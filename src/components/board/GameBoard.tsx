import { MAP_DATA } from '../../data';
import { useGameStore } from '../../store/useGameStore';
import type { BoardUnit, SpecialTile } from '../../types/game';
import { getTileKey } from '../../utils/assetHelper';
import { GridTile } from './GridTile';
import { ZoneTabs } from './ZoneTabs';

const COL_HEADERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const ROW_HEADERS = ['1', '2', '3', '4', '5', '6', '7'];

export function GameBoard() {
  const activeZone = useGameStore((s) => s.activeZone);
  const setActiveZone = useGameStore((s) => s.setActiveZone);
  const roomState = useGameStore((s) => s.roomState);
  const selectedUnitId = useGameStore((s) => s.selectedUnitId);
  const selectUnit = useGameStore((s) => s.selectUnit);
  const lockedTile = useGameStore((s) => s.lockedTile);
  const setHoveredTile = useGameStore((s) => s.setHoveredTile);
  const toggleLockTile = useGameStore((s) => s.toggleLockTile);

  const zoneDef = MAP_DATA.zones[activeZone];
  const { cols, rows } = MAP_DATA;

  const specialMap = new Map<string, SpecialTile>();
  for (const tile of zoneDef.specialTiles) {
    specialMap.set(`${tile.x}_${tile.y}`, tile);
  }

  const unitPosMap = new Map<string, BoardUnit>();
  for (const unit of Object.values(roomState.units)) {
    if (unit.status === 'active' && unit.position?.zone === activeZone) {
      unitPosMap.set(`${unit.position.x}_${unit.position.y}`, unit);
    }
  }

  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      cells.push({ x, y });
    }
  }

  return (
    <main className="flex flex-1 min-w-0 flex-col items-center justify-center overflow-hidden bg-[#090B10] px-3 py-2">
      {/* Unified Board Stack: ZoneTabs flush directly above Column Headers + 10x7 Grid */}
      <div
        className="flex w-full flex-col items-center justify-center"
        style={{ maxWidth: 'min(100%, calc((100vh - 118px) * 10 / 7))' }}
      >
        {/* Zone Switcher Tabs flush with board */}
        <ZoneTabs />

        {/* Outer Coordinate Frame + 10x7 Grid */}
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
                    onSelectUnit={selectUnit}
                    onGateJump={setActiveZone}
                    onHover={() => setHoveredTile({ zone: activeZone, x, y })}
                    onClickTile={() => toggleLockTile({ zone: activeZone, x, y })}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
