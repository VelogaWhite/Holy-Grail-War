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
import { computeMovementAnalysis } from '../../utils/gridMath';
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
  const applyPickedTarget = useGameStore((s) => s.applyPickedTarget);

  const isRuler = previewRole === 'ruler';
  const myTeam: TeamId | null =
    previewRole === 'master_a'
      ? 'team_a'
      : previewRole === 'master_b'
        ? 'team_b'
        : null;
  const canDrag = isRuler && freeDragEnabled;

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
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
  const hasteBonus = roomState.activeMapEvent?.id === 'haste_wind' ? 1 : 0;

  const movementAnalysis = useMemo(() => {
    if (!showMoveHelper || !selectedUnit || selectedUnit.unitType !== 'servant') {
      return null;
    }
    // Master only sees MOV helper for own Servants
    if (!isRuler && myTeam && selectedUnit.owner !== myTeam) return null;
    return computeMovementAnalysis(selectedUnit, roomState.units, hasteBonus);
  }, [showMoveHelper, selectedUnit, roomState.units, hasteBonus, isRuler, myTeam]);

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
      applyPickedTarget(coords, unitOnTile?.id);
      return;
    }
    if (isRuler && pendingSpawnMonsterId) {
      spawnMonster(pendingSpawnMonsterId, coords);
      return;
    }
    toggleLockTile(coords);
  };

  const handleUnitSelect = (unit: BoardUnit) => {
    if (!isRuler && pickingOrderForUnitId && unit.position) {
      applyPickedTarget(unit.position, unit.id);
      return;
    }
    selectUnit(unit.id);
  };

  const handleRightClickTile = (coords: Coordinates, clientX: number, clientY: number) => {
    if (!isRuler) return;
    setTilePopover({ coords, clientX, clientY });
  };

  const maxBoardWidth = isRuler
    ? 'min(100%, calc((100vh - 165px) * 10 / 7))'
    : 'min(100%, calc((100vh - 125px) * 10 / 7))';

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
          <span className="flex items-center gap-1.5 rounded-[2px] border border-[#C8A253] bg-[#C8A253]/20 px-2.5 py-0.5 font-bold text-[#E5C983]">
            <Crosshair className="h-3 w-3" />
            โหมดเลือกเป้าหมายคำสั่งลับ: คลิกช่องหรือยูนิตบนกระดานสำหรับ{' '}
            {roomState.units[pickingOrderForUnitId]?.name}
          </span>
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
              <strong className="font-display text-slate-200">{selectedUnit.name}</strong> · MOV{' '}
              {movementAnalysis.effectiveMov}
              {movementAnalysis.roadBonusApplied ? ' (ถนน +1)' : ''}
              {hasteBonus > 0 ? ' (Event +1)' : ''}
            </span>
            {movementAnalysis.isEngaged && (
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
                  : 'Engaged · ZoC (-1 MOV เมื่อถอยหนี)'}
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
                      reachableInfo={reachableInfo}
                      isSpawnMode={Boolean(
                        (isRuler && pendingSpawnMonsterId) ||
                          (!isRuler && pickingOrderForUnitId)
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
                    />
                  );
                })}

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
    </main>
  );
}
