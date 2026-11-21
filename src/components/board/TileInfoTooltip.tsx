import { Info, MapPin, Sparkles } from 'lucide-react';
import { MAP_DATA, TERRAINS_BY_ID } from '../../data';
import { useGameStore } from '../../store/useGameStore';
import { formatCoordLabel, getSpecialTileEffectText, getTileKey } from '../../utils/assetHelper';

export function TileInfoTooltip() {
  const hoveredTile = useGameStore((s) => s.hoveredTile);
  const tileOverrides = useGameStore((s) => s.roomState.tileOverrides);

  if (!hoveredTile) {
    return (
      <div className="flex h-9 w-full items-center justify-between gap-3 rounded-[2px] border border-[#C8A253]/25 bg-[#111622] px-3 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-[#C8A253]" />
          ชี้เมาส์บนช่องใดก็ได้เพื่อดูประเภทภูมิประเทศและช่องพิเศษ
        </span>
        <div className="hidden items-center gap-3 text-[10px] text-slate-400 xl:flex">
          <span className="flex items-center gap-1">
            <span className="terrain-road inline-block h-2.5 w-3.5 rounded-[1px] border border-slate-500/40" />
            ถนน (+1 MOV)
          </span>
          <span className="flex items-center gap-1">
            <span className="terrain-forest inline-block h-2.5 w-3.5 rounded-[1px] border border-emerald-500/40" />
            ป่า (2 MOV · ซ่อนตัว)
          </span>
          <span className="flex items-center gap-1">
            <span className="terrain-building inline-block h-2.5 w-3.5 rounded-[1px] border border-slate-400/40" />
            ตึก (High Ground)
          </span>
          <span className="flex items-center gap-1">
            <span className="terrain-ruins inline-block h-2.5 w-3.5 rounded-[1px] border border-[#C8A253]/40" />
            ซากปรักฯ (Cover)
          </span>
          <span className="flex items-center gap-1">
            <span className="terrain-water inline-block h-2.5 w-3.5 rounded-[1px] border border-sky-400/40" />
            แม่น้ำ (2 MOV)
          </span>
        </div>
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
    <div className="flex min-h-9 w-full flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-[2px] border border-[#C8A253]/40 bg-[#111622] px-3 py-1 text-[11px] text-slate-200">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display rounded-[2px] border border-[#C8A253]/30 bg-[#090B10] px-1.5 py-0.5 text-[10px] font-bold text-[#C8A253]">
          {formatCoordLabel(hoveredTile.x, hoveredTile.y)}
        </span>

        {/* Layer 1: Terrain */}
        <span
          className={`terrain-${terrainId} rounded-[2px] border border-slate-600/80 px-1.5 py-0.5 text-[10px] font-bold text-slate-100`}
        >
          {terrain.label} ({terrain.moveCost} MOV)
        </span>
        <span className="text-slate-300">{terrain.combatNote}</span>
      </div>

      {/* Layer 2: Special Feature */}
      {(specialTile || override?.customNote) && (
        <div className="flex flex-wrap items-center gap-2 border-l border-[#C8A253]/25 pl-2">
          {specialTile && (
            <span className="flex items-center gap-1 font-medium text-slate-300">
              <Sparkles className="h-3 w-3 shrink-0 text-[#C8A253]" />
              <strong className="text-[#E5C983]">{specialTile.label}:</strong>{' '}
              {getSpecialTileEffectText(specialTile.type, specialTile.manaBonus)}
            </span>
          )}
          {override?.customNote && (
            <span className="flex items-center gap-1 rounded-[2px] border border-[#C8A253]/30 bg-[#090B10] px-1.5 py-0.5 text-[10px] font-semibold text-[#C8A253]">
              <MapPin className="h-3 w-3" /> {override.customNote}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
