import { Info, MapPin, Sparkles } from 'lucide-react';
import { MAP_DATA, TERRAINS_BY_ID } from '../../data';
import { useGameStore } from '../../store/useGameStore';
import { formatCoordLabel, getSpecialTileEffectText, getTileKey } from '../../utils/assetHelper';

export function TileInfoTooltip() {
  const hoveredTile = useGameStore((s) => s.hoveredTile);
  const tileOverrides = useGameStore((s) => s.roomState.tileOverrides);

  if (!hoveredTile) {
    return (
      <div className="flex h-10 w-full items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 px-3 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-amber-500/80" />
          ชี้เมาส์บนช่องใดก็ได้เพื่อดูรายละเอียดภูมิประเทศ (Layer 1) และช่องพิเศษ (Layer 2)
        </span>
        <span className="hidden text-[10px] text-slate-500 xl:inline">
          <strong className="text-slate-300">ถนน:</strong> เริ่มเดิน +1 MOV •{' '}
          <strong className="text-emerald-400/80">ป่า:</strong> 2 MOV / ซ่อนตัว •{' '}
          <strong className="text-sky-400/80">ตึก:</strong> High Ground +1 ATK/+1 RNG
        </span>
      </div>
    );
  }

  const zoneDef = MAP_DATA.zones[hoveredTile.zone];
  const terrainId = zoneDef.terrainGrid[hoveredTile.y]?.[hoveredTile.x] ?? 'open';
  const terrain = TERRAINS_BY_ID[terrainId];
  const specialTile = zoneDef.specialTiles.find(
    (t) => t.x === hoveredTile.x && t.y === hoveredTile.y
  );
  const override = tileOverrides[getTileKey(hoveredTile.zone, hoveredTile.x, hoveredTile.y)];

  return (
    <div className="flex min-h-10 w-full flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-200">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-200">
          {formatCoordLabel(hoveredTile.x, hoveredTile.y)} ({hoveredTile.x},{hoveredTile.y})
        </span>

        {/* Layer 1: Terrain */}
        <span
          className="rounded border border-slate-600 px-1.5 py-0.5 text-[10px] font-bold text-slate-200"
          style={{ backgroundColor: terrain.bgColor }}
        >
          {terrain.label} ({terrain.moveCost} MOV)
        </span>
        <span className="text-slate-300">{terrain.combatNote}</span>
      </div>

      {/* Layer 2: Special Feature */}
      {(specialTile || override?.customNote) && (
        <div className="flex flex-wrap items-center gap-2 border-l border-slate-700 pl-2">
          {specialTile && (
            <span className="flex items-center gap-1 font-medium text-slate-300">
              <Sparkles className="h-3 w-3 shrink-0 text-amber-500/80" />
              <strong className="text-amber-200">{specialTile.label}:</strong>{' '}
              {getSpecialTileEffectText(specialTile.type, specialTile.manaBonus)}
            </span>
          )}
          {override?.customNote && (
            <span className="flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
              <MapPin className="h-3 w-3" /> {override.customNote}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
