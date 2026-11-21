import { Coins, Cross, Crown, HelpCircle, Skull, Sparkles } from 'lucide-react';
import { MAP_DATA } from '../../data';
import { useGameStore } from '../../store/useGameStore';
import type { BoardUnit, SpecialTile } from '../../types/game';
import { getTileKey } from '../../utils/assetHelper';
import { GridTile } from './GridTile';
import { ZoneTabs } from './ZoneTabs';

export function GameBoard() {
  const activeZone = useGameStore((s) => s.activeZone);
  const setActiveZone = useGameStore((s) => s.setActiveZone);
  const roomState = useGameStore((s) => s.roomState);
  const selectedUnitId = useGameStore((s) => s.selectedUnitId);
  const selectUnit = useGameStore((s) => s.selectUnit);

  const zoneDef = MAP_DATA.zones[activeZone];
  const gridSize = MAP_DATA.gridSize;

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
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      cells.push({ x, y });
    }
  }

  return (
    <main className="flex flex-1 min-w-0 flex-col items-center justify-between overflow-hidden bg-slate-50 px-3 py-2">
      {/* Zone Switcher Tabs */}
      <ZoneTabs />

      {/* 6x6 Interactive Grid Container */}
      <div className="flex flex-1 min-h-0 w-full items-center justify-center py-1.5">
        <div
          className="grid aspect-square h-full max-h-[580px] max-w-[580px] grid-cols-6 grid-rows-6 overflow-visible rounded-lg border-2 border-slate-900 bg-white shadow-sm"
          style={{ width: 'min(100%, calc(100vh - 185px))', height: 'min(100%, calc(100vh - 185px))' }}
        >
          {cells.map(({ x, y }) => {
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
                specialTile={specialTile}
                tileOverride={tileOverride}
                unit={unit}
                isSelectedUnit={unit?.id === selectedUnitId}
                onSelectUnit={selectUnit}
                onGateJump={setActiveZone}
              />
            );
          })}
        </div>
      </div>

      {/* Compact Legend Bar */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-md border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700">
        <span className="flex items-center gap-1 text-sky-700">
          <Sparkles className="h-3 w-3" /> Leyline (+2/+3M)
        </span>
        <span className="flex items-center gap-1 text-amber-600">
          <Coins className="h-3 w-3" /> QP (1d6)
        </span>
        <span className="flex items-center gap-1 text-orange-600">
          <HelpCircle className="h-3 w-3" /> Event (?)
        </span>
        <span className="flex items-center gap-1 text-stone-600">
          <Skull className="h-3 w-3" /> Monster Nest
        </span>
        <span className="flex items-center gap-1 text-emerald-700">
          <Cross className="h-3 w-3" /> Safe House
        </span>
        <span className="flex items-center gap-1 text-orange-600">
          <Crown className="h-3 w-3" /> Grail (T10)
        </span>
        <span className="text-slate-500">
          | <strong className="text-orange-600">ZoC:</strong> ถอยหนี -1 MOV (ยกเว้น Assassin)
        </span>
      </div>
    </main>
  );
}
