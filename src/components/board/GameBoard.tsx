import { MAP_DATA } from '../../data';
import { useGameStore } from '../../store/useGameStore';
import type { BoardUnit, SpecialTile } from '../../types/game';
import { getTileKey } from '../../utils/assetHelper';
import { GridTile } from './GridTile';
import { TileInfoTooltip } from './TileInfoTooltip';
import { ZoneTabs } from './ZoneTabs';

export function GameBoard() {
  const activeZone = useGameStore((s) => s.activeZone);
  const setActiveZone = useGameStore((s) => s.setActiveZone);
  const roomState = useGameStore((s) => s.roomState);
  const selectedUnitId = useGameStore((s) => s.selectedUnitId);
  const selectUnit = useGameStore((s) => s.selectUnit);
  const setHoveredTile = useGameStore((s) => s.setHoveredTile);

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
    <main className="flex flex-1 min-w-0 flex-col items-center justify-between overflow-hidden bg-slate-950 px-3 py-2">
      {/* Zone Switcher Tabs */}
      <ZoneTabs />

      {/* 10x7 Horizontal Interactive Grid */}
      <div
        className="flex flex-1 min-h-0 w-full items-center justify-center py-1.5"
        onMouseLeave={() => setHoveredTile(null)}
      >
        <div
          className="grid grid-cols-10 grid-rows-7 overflow-visible rounded-lg border-2 border-slate-700 bg-slate-950 shadow-2xl"
          style={{
            width: 'min(100%, calc((100vh - 200px) * 10 / 7))',
            aspectRatio: '10 / 7',
          }}
        >
          {cells.map(({ x, y }) => {
            const terrainId = zoneDef.terrainGrid[y]?.[x] ?? 'open';
            const specialTile = specialMap.get(`${x}_${y}`);
            const tileKey = getTileKey(activeZone, x, y);
            const tileOverride = roomState.tileOverrides[tileKey];
            const unit = unitPosMap.get(`${x}_${y}`);

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
                onSelectUnit={selectUnit}
                onGateJump={setActiveZone}
                onHover={() => setHoveredTile({ zone: activeZone, x, y })}
              />
            );
          })}
        </div>
      </div>

      {/* Live Hover Tile Info (Terrain Layer 1 + Special Feature Layer 2) */}
      <TileInfoTooltip />
    </main>
  );
}
