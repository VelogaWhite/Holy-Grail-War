import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { AlertTriangle, Crosshair, Footprints, Skull } from 'lucide-react';
import { MAP_DATA, MONSTERS_BY_ID } from '../../data';
import { useGameStore } from '../../store/useGameStore';
import type { BoardUnit, Coordinates, SpecialTile, TeamId } from '../../types/game';
import { getTileKey } from '../../utils/assetHelper';
import {
  computeAttackRangeTiles,
  computeMovementAnalysis,
  formatMpCost,
} from '../../utils/gridMath';
import { isUnitIdentityHidden } from '../../utils/visibilityHelper';
import { RadialCommandMenu } from '../master/RadialCommandMenu';
import { CommandArrowsSvg } from './CommandArrowsSvg';
import { FogOverlay } from './FogOverlay';
import { GridTile } from './GridTile';
import { UnitToken } from './UnitToken';
import { ZoneTabs } from './ZoneTabs';

const COL_HEADERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const ROW_HEADERS = ['1', '2', '3', '4', '5', '6', '7'];

export function GameBoard() {
  const previewRole = useGameStore((s) => s.previewRole);
  const activeZone = useGameStore((s) => s.activeZone);
  const setActiveZone = useGameStore((s) => s.setActiveZone);
  const roomState = useGameStore((s) => s.roomState);
  const selectedUnitId = useGameStore((s) => s.selectedUnitId);
  const selectUnit = useGameStore((s) => s.selectUnit);
  const hoveredTile = useGameStore((s) => s.hoveredTile);
  const lockedTile = useGameStore((s) => s.lockedTile);
  const freeDragEnabled = useGameStore((s) => s.freeDragEnabled);
  const showMoveHelper = useGameStore((s) => s.showMoveHelper);
  const showCommandArrows = useGameStore((s) => s.showCommandArrows);
  const pendingSpawnMonsterId = useGameStore((s) => s.pendingSpawnMonsterId);
  const pickingOrderForUnitId = useGameStore((s) => s.pickingOrderForUnitId);
  const draftOrders = useGameStore((s) => s.draftOrders);
  const masterAOrders = useGameStore((s) => s.masterAOrders);
  const masterBOrders = useGameStore((s) => s.masterBOrders);

  const setHoveredTile = useGameStore((s) => s.setHoveredTile);
  const toggleLockTile = useGameStore((s) => s.toggleLockTile);
  const setTilePopover = useGameStore((s) => s.setTilePopover);
  const moveUnit = useGameStore((s) => s.moveUnit);
  const spawnMonster = useGameStore((s) => s.spawnMonster);
  const setPickingOrderForUnitId = useGameStore((s) => s.setPickingOrderForUnitId);
  const applyPickedTarget = useGameStore((s) => s.applyPickedTarget);
  const openRadialMenu = useGameStore((s) => s.openRadialMenu);

  const isRuler = previewRole === 'ruler';
  const myTeam: TeamId | null =
    previewRole === 'master_a'
      ? 'team_a'
      : previewRole === 'master_b'
        ? 'team_b'
        : null;
  const canDrag = isRuler && freeDragEnabled;

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [pickWarning, setPickWarning] = useState<{
    unitId: string;
    message: string;
  } | null>(null);
  const activeDragUnit = activeDragId ? roomState.units[activeDragId] ?? null : null;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const zoneDef = MAP_DATA.zones[activeZone];
  const { cols, rows } = MAP_DATA;

  const specialMap = useMemo(() => {
    const map = new Map<string, SpecialTile>();
    for (const tile of zoneDef.specialTiles) {
      map.set(`${tile.x}_${tile.y}`, tile);
    }
    return map;
  }, [zoneDef]);

  // Ruler Deployment Preview Map during 'deployment' phase
  const deploymentPreviewMap = useMemo(() => {
    const map = new Map<string, { name: string; team: 'team_a' | 'team_b' }>();
    if (!isRuler || roomState.phase !== 'deployment') return map;

    const addPlacements = (
      placements: { unitId: string; position: Coordinates }[] | undefined,
      team: 'team_a' | 'team_b'
    ) => {
      if (!placements) return;
      for (const p of placements) {
        if (p.position.zone !== activeZone) continue;
        const u = roomState.units[p.unitId];
        map.set(`${p.position.x}_${p.position.y}`, {
          name: u?.name ?? p.unitId,
          team,
        });
      }
    };

    addPlacements(masterAOrders?.deployment?.placements, 'team_a');
    addPlacements(masterBOrders?.deployment?.placements, 'team_b');
    return map;
  }, [isRuler, roomState.phase, roomState.units, activeZone, masterAOrders, masterBOrders]);

  // Fog of War: Check if Enemy Base Zone is veiled for Master
  const isEnemyBaseFogged = useMemo(() => {
    if (isRuler || !myTeam || !roomState.fogConfig.enabled) return false;
    if (!roomState.fogConfig.revealBaseZoneToOwnerOnly) return false;
    const enemyBaseZone = myTeam === 'team_a' ? 'base_b' : 'base_a';
    if (activeZone !== enemyBaseZone) return false;

    const hasOwnUnitInside = Object.values(roomState.units).some(
      (u) =>
        u.owner === myTeam &&
        u.status === 'active' &&
        u.position?.zone === enemyBaseZone
    );
    return !hasOwnUnitInside;
  }, [isRuler, myTeam, roomState.fogConfig, roomState.units, activeZone]);

  // Build visible unit map with Forest Stealth + Enemy Base Fog filtering for Masters
  const unitPosMap = useMemo(() => {
    const map = new Map<string, BoardUnit>();
    const activeUnitsInZone = Object.values(roomState.units).filter(
      (u) => u.status === 'active' && u.position?.zone === activeZone
    );

    const friendlyUnitsInZone = myTeam
      ? activeUnitsInZone.filter((u) => u.owner === myTeam)
      : [];

    for (const unit of activeUnitsInZone) {
      if (!unit.position) continue;
      const isEnemyServant =
        !isRuler &&
        myTeam !== null &&
        unit.unitType === 'servant' &&
        unit.owner !== myTeam;

      if (isEnemyServant && roomState.fogConfig.enabled && !unit.isRevealedToEnemy) {
        // 1. Hidden by Enemy Base Fog
        if (isEnemyBaseFogged) continue;

        // 2. Hidden by Forest Stealth unless ally is adjacent (dist 1) or also in forest
        if (roomState.fogConfig.hideUnitsInForest) {
          const terrain = zoneDef.terrainGrid[unit.position.y]?.[unit.position.x];
          if (terrain === 'forest') {
            const spotted = friendlyUnitsInZone.some((ally) => {
              if (!ally.position) return false;
              const dist =
                Math.abs(ally.position.x - unit.position!.x) +
                Math.abs(ally.position.y - unit.position!.y);
              const allyTerrain =
                zoneDef.terrainGrid[ally.position.y]?.[ally.position.x];
              return dist <= 1 || allyTerrain === 'forest';
            });
            if (!spotted) continue;
          }
        }
      }

      map.set(`${unit.position.x}_${unit.position.y}`, unit);
    }
    return map;
  }, [
    roomState.units,
    roomState.fogConfig,
    activeZone,
    isRuler,
    myTeam,
    isEnemyBaseFogged,
    zoneDef,
  ]);

  const selectedUnit = selectedUnitId ? roomState.units[selectedUnitId] : null;
  const pickingUnit =
    !isRuler && pickingOrderForUnitId
      ? roomState.units[pickingOrderForUnitId] ?? null
      : null;
  const pickingOrder = pickingOrderForUnitId
    ? draftOrders[pickingOrderForUnitId]
    : undefined;
  const pickingActionType = pickingOrder?.actionType ?? 'move';
  const isMoveConstrainedAction = pickingActionType === 'move';
  const isCombatPickingAction =
    Boolean(pickingUnit) &&
    (pickingActionType === 'attack' || pickingActionType === 'np');
  const isOverrideUnlocked = Boolean(pickingOrder?.overrideMoveRange);
  const isStrictMovePick = Boolean(
    pickingUnit &&
      pickingUnit.unitType === 'servant' &&
      isMoveConstrainedAction &&
      !isOverrideUnlocked
  );
  const hasteBonus = roomState.activeMapEvent?.id === 'haste_wind' ? 1 : 0;

  const analysisTargetUnit = pickingUnit ?? selectedUnit;
  const analysisDraftOrder =
    !isRuler && analysisTargetUnit
      ? draftOrders[analysisTargetUnit.id]
      : undefined;
  const ignoreZoCByStance =
    !isRuler && (analysisDraftOrder?.stance ?? 'defensive') === 'evade';

  const movementAnalysis = useMemo(() => {
    if (!analysisTargetUnit || analysisTargetUnit.unitType !== 'servant') {
      return null;
    }
    // When Master is picking an Attack/NP target, focus cleanly on Attack Range Overlay from current tile
    if (isCombatPickingAction) {
      return null;
    }
    // Always show movement analysis while picking a target (even if unlocked/custom as a guide)
    if (!pickingUnit && !showMoveHelper) {
      return null;
    }
    // Master only sees MOV helper for own Servants
    if (!isRuler && myTeam && analysisTargetUnit.owner !== myTeam) return null;
    return computeMovementAnalysis(
      analysisTargetUnit,
      roomState.units,
      hasteBonus,
      ignoreZoCByStance
    );
  }, [
    pickingUnit,
    isCombatPickingAction,
    showMoveHelper,
    analysisTargetUnit,
    roomState.units,
    hasteBonus,
    ignoreZoCByStance,
    isRuler,
    myTeam,
  ]);

  const attackRangeAnalysis = useMemo(() => {
    if (!analysisTargetUnit || analysisTargetUnit.unitType !== 'servant') {
      return null;
    }
    if (!pickingUnit && !showMoveHelper) {
      return null;
    }
    if (!isRuler && myTeam && analysisTargetUnit.owner !== myTeam) return null;
    return computeAttackRangeTiles(analysisTargetUnit);
  }, [pickingUnit, showMoveHelper, analysisTargetUnit, isRuler, myTeam]);

  // Hover Path Preview coordinates inside activeZone
  const hoverPathPoints = useMemo(() => {
    if (!movementAnalysis || !hoveredTile || hoveredTile.zone !== activeZone) {
      return null;
    }
    const key = getTileKey(hoveredTile.zone, hoveredTile.x, hoveredTile.y);
    const info = movementAnalysis.reachable[key];
    if (!info || info.path.length < 2) return null;
    const inZone = info.path.filter((p) => p.zone === activeZone);
    if (inZone.length < 2) return null;
    return {
      points: inZone.map((p) => `${p.x + 0.5},${p.y + 0.5}`).join(' '),
      end: inZone[inZone.length - 1],
      zocPenalized: info.zocPenalized,
    };
  }, [movementAnalysis, hoveredTile, activeZone]);

  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      cells.push({ x, y });
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const unitId = String(event.active.id);
    setActiveDragId(unitId);
    selectUnit(unitId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    if (!canDrag) return;
    const { active, over } = event;
    if (!over?.data?.current) return;
    const coords = over.data.current as Coordinates;
    const unitId = String(active.id);
    const unit = roomState.units[unitId];
    if (!unit) return;
    if (
      unit.position &&
      unit.position.zone === coords.zone &&
      unit.position.x === coords.x &&
      unit.position.y === coords.y
    ) {
      return;
    }
    moveUnit(unitId, coords);
  };

  const handleTileClick = (coords: Coordinates, unitOnTile?: BoardUnit) => {
    if (!isRuler && pickingOrderForUnitId) {
      const key = getTileKey(coords.zone, coords.x, coords.y);
      const reachable = movementAnalysis?.reachable[key];
      if (isStrictMovePick && !reachable) {
        setPickWarning({
          unitId: pickingOrderForUnitId,
          message:
            'อยู่นอกระยะเดิน (MP) — เลือกได้เฉพาะช่องสีเขียว/ส้ม หรือติ๊ก "ปลดล็อกระยะ" หากใช้สกิล/บัฟ/วาร์ป',
        });
        return;
      }
      setPickWarning(null);
      applyPickedTarget(coords, unitOnTile?.id, reachable ? reachable.cost : null);
      return;
    }
    if (isRuler && pendingSpawnMonsterId) {
      spawnMonster(pendingSpawnMonsterId, coords);
      return;
    }
    toggleLockTile(coords);
  };

  const handleUnitSelect = (unit: BoardUnit) => {
    if (!isRuler && myTeam) {
      const isOwnActiveServant =
        unit.unitType === 'servant' &&
        unit.owner === myTeam &&
        unit.status === 'active';
      const canPlanNow =
        roomState.phase === 'planning' && !roomState.teams[myTeam].readyLocked;

      // Board-First Command Selection: clicking own active Servant in Planning immediately opens Smart Target Picker
      if (!pickingOrderForUnitId) {
        selectUnit(unit.id);
        if (isOwnActiveServant && canPlanNow) {
          setPickWarning(null);
          setPickingOrderForUnitId(unit.id);
        }
        return;
      }

      // Clicking the same Servant currently being picked toggles picker off cleanly
      if (pickingOrderForUnitId === unit.id) {
        setPickWarning(null);
        setPickingOrderForUnitId(null);
        return;
      }

      // Clicking another own Servant while in strict Move pick seamlessly switches to ordering that Servant
      if (isOwnActiveServant && isStrictMovePick && canPlanNow) {
        setPickWarning(null);
        selectUnit(unit.id);
        setPickingOrderForUnitId(unit.id);
        return;
      }

      if (unit.position) {
        if (isStrictMovePick) {
          setPickWarning({
            unitId: pickingOrderForUnitId,
            message:
              'ช่องนี้มีตัวละครยืนอยู่แล้ว — เลือกช่องว่างในระยะเดินสีเขียว/ส้ม หรือติ๊ก "ปลดล็อกระยะ"',
          });
          return;
        }
        setPickWarning(null);
        applyPickedTarget(unit.position, unit.id, null);
        return;
      }
    }
    selectUnit(unit.id);
  };

  const handleRightClickTile = (coords: Coordinates, clientX: number, clientY: number) => {
    if (!isRuler) return;
    setTilePopover({ coords, clientX, clientY });
  };

  const canOpenRadialMenu = Boolean(
    !isRuler &&
      myTeam &&
      roomState.phase === 'planning' &&
      !roomState.teams[myTeam].readyLocked
  );

  const maxBoardWidth = isRuler
    ? 'min(100%, calc((100vh - 205px) * 10 / 7))'
    : 'min(100%, calc((100vh - 165px) * 10 / 7))';

  // Command Arrow sources: Ruler sees both submitted teams; Master sees only own draft arrows
  const arrowTeamA = isRuler
    ? showCommandArrows
      ? masterAOrders?.orders ?? []
      : []
    : myTeam === 'team_a'
      ? Object.values(draftOrders)
      : [];

  const arrowTeamB = isRuler
    ? showCommandArrows
      ? masterBOrders?.orders ?? []
      : []
    : myTeam === 'team_b'
      ? Object.values(draftOrders)
      : [];

  return (
    <main className="flex flex-1 min-w-0 flex-col items-center justify-center overflow-hidden bg-[#090B10] px-3 py-1.5">
      {/* Contextual Tactical Banner */}
      <div className="mb-1 flex h-5 w-full items-center justify-center gap-2 text-[10.5px]">
        {!isRuler && pickingOrderForUnitId ? (
          pickWarning && pickWarning.unitId === pickingOrderForUnitId ? (
            <span className="flex items-center gap-1.5 rounded-[2px] border border-red-500/80 bg-red-950/70 px-2.5 py-0.5 font-bold text-red-200">
              <AlertTriangle className="h-3 w-3 shrink-0 text-red-400" />
              {pickWarning.message}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-[2px] border border-[#C8A253] bg-[#C8A253]/20 px-2.5 py-0.5 font-bold text-[#E5C983]">
              <Crosshair className="h-3 w-3" />
              {isStrictMovePick ? (
                <>
                  <span>
                    เลือกช่องเดินสำหรับ {roomState.units[pickingOrderForUnitId]?.name} (เฉพาะช่องในระยะ{' '}
                    {formatMpCost(movementAnalysis?.maxMP ?? 0)} MP)
                  </span>
                  {ignoreZoCByStance && (
                    <span className="rounded-[2px] border border-emerald-400/70 bg-emerald-950/80 px-1.5 py-px text-[9.5px] font-bold text-emerald-300">
                      💨 Evade: ไม่ติด ZoC
                    </span>
                  )}
                </>
              ) : isCombatPickingAction ? (
                <span>
                  ⚔️ Attack ก่อน Move: เลือกเป้าหมายในระยะ {attackRangeAnalysis?.effectiveRange ?? 1} ช่อง
                  {attackRangeAnalysis?.highGroundBonus ? ' (+1 High Ground)' : ''} จากตำแหน่งปัจจุบันของ{' '}
                  {roomState.units[pickingOrderForUnitId]?.name}
                </span>
              ) : isOverrideUnlocked ? (
                <span>
                  ปลดล็อกระยะแล้ว: คลิกช่องใดก็ได้บนกระดานสำหรับ{' '}
                  {roomState.units[pickingOrderForUnitId]?.name} (⚠️ หากเกินระยะปกติจะแจ้งเตือน Ruler)
                </span>
              ) : (
                <span>
                  โหมดเลือกเป้าหมายคำสั่งลับ: คลิกช่องหรือยูนิตบนกระดานสำหรับ{' '}
                  {roomState.units[pickingOrderForUnitId]?.name}
                </span>
              )}
            </span>
          )
        ) : isRuler && pendingSpawnMonsterId ? (
          <span className="flex items-center gap-1.5 rounded-[2px] border border-[#C8A253] bg-[#C8A253]/20 px-2.5 py-0.5 font-bold text-[#E5C983]">
            <Skull className="h-3 w-3" />
            โหมดวางมอนสเตอร์: คลิกช่องบนกระดานเพื่อเสก{' '}
            {MONSTERS_BY_ID[pendingSpawnMonsterId]?.name}
          </span>
        ) : movementAnalysis && selectedUnit ? (
          <div className="flex items-center gap-2 text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <Footprints className="h-3 w-3" />
              <strong className="font-display text-slate-200">{selectedUnit.name}</strong> ·{' '}
              {formatMpCost(movementAnalysis.maxMP)} MP
              {hasteBonus > 0 ? ' (Event +1.0)' : ''}
              {attackRangeAnalysis ? (
                <span className="ml-1 text-red-400">
                  · RNG {attackRangeAnalysis.effectiveRange}
                  {attackRangeAnalysis.highGroundBonus ? ' (+1 ตึก)' : ''}
                </span>
              ) : null}
            </span>
            {movementAnalysis.ignoreZoCByStance && (
              <span className="flex items-center gap-1 rounded-[2px] border border-emerald-500/70 bg-emerald-950/60 px-1.5 py-px font-bold text-emerald-300">
                💨 Evade: ไม่ติด ZoC
              </span>
            )}
            {movementAnalysis.isEngaged && !movementAnalysis.ignoreZoCByStance && (
              <span
                className={`flex items-center gap-1 rounded-[2px] px-1.5 py-px font-bold ${
                  movementAnalysis.ignoreZoC
                    ? 'border border-slate-700 bg-slate-900 text-slate-300'
                    : 'border border-amber-600/70 bg-amber-950/60 text-amber-300'
                }`}
              >
                <AlertTriangle className="h-3 w-3" />
                {movementAnalysis.ignoreZoC
                  ? 'Engaged (Assassin ยกเว้น ZoC)'
                  : `Engaged · ZoC (ถอยเหลือ ${formatMpCost(movementAnalysis.zocRetreatMP)} MP)`}
              </span>
            )}
          </div>
        ) : null}
      </div>

      {/* Unified Board Stack */}
      <div
        className="flex w-full flex-col items-center justify-center"
        style={{ maxWidth: maxBoardWidth }}
      >
        <ZoneTabs />

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveDragId(null)}
        >
          <div
            className="flex w-full flex-col rounded-b-[2px] border border-[#C8A253]/35 bg-[#111622] p-1 shadow-2xl"
            onMouseLeave={() => setHoveredTile(null)}
          >
            {/* Top Column Coordinate Header (A–J) */}
            <div className="grid grid-cols-[20px_1fr] items-center pb-0.5">
              <div />
              <div className="grid grid-cols-10 text-center">
                {COL_HEADERS.map((col) => (
                  <span
                    key={col}
                    className="font-display text-[10px] font-bold tracking-widest text-[#C8A253]/75"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>

            {/* Left Row Coordinate Header (1–7) + 10x7 Grid */}
            <div className="grid grid-cols-[20px_1fr] items-stretch">
              <div className="grid grid-rows-7 items-center text-center">
                {ROW_HEADERS.map((row) => (
                  <span
                    key={row}
                    className="font-display text-[10px] font-bold text-[#C8A253]/75"
                  >
                    {row}
                  </span>
                ))}
              </div>

              <div
                className="relative grid w-full grid-cols-10 grid-rows-7 overflow-visible border border-[#C8A253]/30 bg-[#090B10]"
                style={{ aspectRatio: '10 / 7' }}
              >
                {cells.map(({ x, y }) => {
                  const terrainId = zoneDef.terrainGrid[y]?.[x] ?? 'open';
                  const specialTile = specialMap.get(`${x}_${y}`);
                  const tileKey = getTileKey(activeZone, x, y);
                  const tileOverride = roomState.tileOverrides[tileKey];
                  const unit = unitPosMap.get(`${x}_${y}`);
                  const isLockedTile = Boolean(
                    lockedTile &&
                      lockedTile.zone === activeZone &&
                      lockedTile.x === x &&
                      lockedTile.y === y
                  );
                  const reachableInfo = movementAnalysis?.reachable[tileKey];
                  const isInAttackRange = Boolean(attackRangeAnalysis?.tiles.has(tileKey));
                  const isBlockedPick = isStrictMovePick && !reachableInfo;
                  const hiddenIdentity = unit
                    ? isUnitIdentityHidden(unit, previewRole, roomState)
                    : false;
                  const deploymentPreview =
                    deploymentPreviewMap.get(`${x}_${y}`) ?? null;

                  return (
                    <GridTile
                      key={tileKey}
                      zone={activeZone}
                      x={x}
                      y={y}
                      terrainId={terrainId}
                      specialTile={specialTile}
                      tileOverride={tileOverride}
                      unit={unit}
                      isSelectedUnit={unit?.id === selectedUnitId}
                      isLockedTile={isLockedTile}
                      canDragUnit={canDrag}
                      isRuler={isRuler}
                      isUnitIdentityHidden={hiddenIdentity}
                      deploymentPreview={deploymentPreview}
                      reachableInfo={reachableInfo}
                      isInAttackRange={isInAttackRange}
                      isBlockedPick={isBlockedPick}
                      isSpawnMode={Boolean(
                        (isRuler && pendingSpawnMonsterId) ||
                          (!isRuler && pickingOrderForUnitId && !isBlockedPick)
                      )}
                      onSelectUnit={() => unit && handleUnitSelect(unit)}
                      onGateJump={setActiveZone}
                      onHover={() => setHoveredTile({ zone: activeZone, x, y })}
                      onClickTile={() =>
                        handleTileClick({ zone: activeZone, x, y }, unit)
                      }
                      onRightClickTile={(cx, cy) =>
                        handleRightClickTile({ zone: activeZone, x, y }, cx, cy)
                      }
                      onRightClickUnit={
                        canOpenRadialMenu &&
                        unit &&
                        unit.unitType === 'servant' &&
                        unit.owner === myTeam &&
                        unit.status === 'active'
                          ? (u, anchorX, anchorY) => openRadialMenu(u.id, anchorX, anchorY)
                          : undefined
                      }
                    />
                  );
                })}

                {/* Hover Path Preview SVG (Dijkstra Shortest Path) */}
                {hoverPathPoints && (
                  <svg
                    viewBox={`0 0 ${cols} ${rows}`}
                    preserveAspectRatio="none"
                    className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
                  >
                    <polyline
                      points={hoverPathPoints.points}
                      fill="none"
                      stroke={hoverPathPoints.zocPenalized ? '#F59E0B' : '#34D399'}
                      strokeWidth="0.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="0.18 0.1"
                      opacity="0.95"
                    />
                    <circle
                      cx={hoverPathPoints.end.x + 0.5}
                      cy={hoverPathPoints.end.y + 0.5}
                      r="0.14"
                      fill={hoverPathPoints.zocPenalized ? '#F59E0B' : '#34D399'}
                      opacity="0.95"
                    />
                  </svg>
                )}

                {/* SVG Command Arrows Overlay (Ruler: solid Red+Blue + COLLISION!; Master: own dashed draft) */}
                <CommandArrowsSvg
                  activeZone={activeZone}
                  units={roomState.units}
                  teamAOrders={arrowTeamA}
                  teamBOrders={arrowTeamB}
                  dashed={!isRuler}
                />

                {/* Fog of War Overlay on Enemy Base Zone */}
                {isEnemyBaseFogged && <FogOverlay zoneName={zoneDef.name} />}
              </div>
            </div>
          </div>

          {/* Compact Terrain MP Legend Bar */}
          <div className="mt-1 flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[9.5px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="terrain-road inline-block h-2 w-3 rounded-[1px] border border-slate-500/50" />
              ถนน <strong className="text-slate-200">0.5</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="terrain-open inline-block h-2 w-3 rounded-[1px] border border-emerald-700/50" />
              โล่ง <strong className="text-slate-200">1.0</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="terrain-ruins inline-block h-2 w-3 rounded-[1px] border border-[#C8A253]/50" />
              ซากปรักฯ <strong className="text-slate-200">1.0</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="terrain-forest inline-block h-2 w-3 rounded-[1px] border border-emerald-500/50" />
              ป่า <strong className="text-slate-200">1.5</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="terrain-building inline-block h-2 w-3 rounded-[1px] border border-slate-400/50" />
              ตึก <strong className="text-slate-200">1.5/1.0</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="terrain-water inline-block h-2 w-3 rounded-[1px] border border-sky-400/50" />
              แม่น้ำ <strong className="text-slate-200">2.0</strong>
            </span>
            <span className="text-teal-400/80">
              Gate <strong className="text-teal-300">1.0 MP</strong>
            </span>
          </div>

          <DragOverlay dropAnimation={null} zIndex={100}>
            {activeDragUnit ? (
              <div className="pointer-events-none h-16 w-16">
                <UnitToken
                  unit={activeDragUnit}
                  isSelected={false}
                  canDrag={false}
                  isOverlay
                  onSelect={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Master Right-Click Radial Command Menu (Portaled to document.body) */}
      <RadialCommandMenu />
    </main>
  );
}
