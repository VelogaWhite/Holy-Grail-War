import { useMemo } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { AlertTriangle, Footprints, Skull } from 'lucide-react';
import { MAP_DATA, MONSTERS_BY_ID } from '../../data';
import { useGameStore } from '../../store/useGameStore';
import type { BoardUnit, Coordinates, SpecialTile } from '../../types/game';
import { getTileKey } from '../../utils/assetHelper';
import { computeMovementAnalysis } from '../../utils/gridMath';
import { GridTile } from './GridTile';
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
  const pendingSpawnMonsterId = useGameStore((s) => s.pendingSpawnMonsterId);
  const setHoveredTile = useGameStore((s) => s.setHoveredTile);
  const toggleLockTile = useGameStore((s) => s.toggleLockTile);
  const setTilePopover = useGameStore((s) => s.setTilePopover);
  const moveUnit = useGameStore((s) => s.moveUnit);
  const spawnMonster = useGameStore((s) => s.spawnMonster);

  const isRuler = previewRole === 'ruler';
  const canDrag = isRuler && freeDragEnabled;

  // Require 6px movement before drag starts so regular click selects unit cleanly
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

  const unitPosMap = useMemo(() => {
    const map = new Map<string, BoardUnit>();
    for (const unit of Object.values(roomState.units)) {
      if (unit.status === 'active' && unit.position?.zone === activeZone) {
        map.set(`${unit.position.x}_${unit.position.y}`, unit);
      }
    }
    return map;
  }, [roomState.units, activeZone]);

  const selectedUnit = selectedUnitId ? roomState.units[selectedUnitId] : null;
  const hasteBonus = roomState.activeMapEvent?.id === 'haste_wind' ? 1 : 0;

  const movementAnalysis = useMemo(() => {
    if (!showMoveHelper || !selectedUnit || selectedUnit.unitType !== 'servant') {
      return null;
    }
    return computeMovementAnalysis(selectedUnit, roomState.units, hasteBonus);
  }, [showMoveHelper, selectedUnit, roomState.units, hasteBonus]);

  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      cells.push({ x, y });
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
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

  const handleTileClick = (coords: Coordinates) => {
    if (isRuler && pendingSpawnMonsterId) {
      spawnMonster(pendingSpawnMonsterId, coords);
      return;
    }
    toggleLockTile(coords);
  };

  const handleRightClickTile = (coords: Coordinates, clientX: number, clientY: number) => {
    if (!isRuler) return;
    setTilePopover({ coords, clientX, clientY });
  };

  const maxBoardWidth = isRuler
    ? 'min(100%, calc((100vh - 165px) * 10 / 7))'
    : 'min(100%, calc((100vh - 125px) * 10 / 7))';

  return (
    <main className="flex flex-1 min-w-0 flex-col items-center justify-center overflow-hidden bg-[#090B10] px-3 py-1.5">
      {/* Contextual Tactical Banner (Spawn Mode or Movement/ZoC Summary) */}
      <div className="mb-1 flex h-5 w-full items-center justify-center gap-2 text-[10.5px]">
        {isRuler && pendingSpawnMonsterId ? (
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

        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
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
                className="grid w-full grid-cols-10 grid-rows-7 overflow-visible border border-[#C8A253]/30 bg-[#090B10]"
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
                      isSpawnMode={Boolean(isRuler && pendingSpawnMonsterId)}
                      onSelectUnit={selectUnit}
                      onGateJump={setActiveZone}
                      onHover={() => setHoveredTile({ zone: activeZone, x, y })}
                      onClickTile={() => handleTileClick({ zone: activeZone, x, y })}
                      onRightClickTile={(cx, cy) =>
                        handleRightClickTile({ zone: activeZone, x, y }, cx, cy)
                      }
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </DndContext>
      </div>
    </main>
  );
}
