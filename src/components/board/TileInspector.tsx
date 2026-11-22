import { useState } from 'react';
import { Compass, Lock, MapPin, Sparkles, Unlock, Waves } from 'lucide-react';
import { MAP_DATA, TERRAINS_BY_ID } from '../../data';
import { useGameStore } from '../../store/useGameStore';
import type { TerrainId } from '../../types/game';
import {
  formatCoordLabel,
  getSpecialTileEffectText,
  getTileKey,
} from '../../utils/assetHelper';

interface TerrainSceneConfig {
  enTitle: string;
  image?: string;
  imgClass: string;
}

const TERRAIN_SCENE_MAP: Record<TerrainId, TerrainSceneConfig> = {
  forest: {
    enTitle: 'FOREST',
    image: '/assets/terrains/forest.webp',
    imgClass: 'object-center brightness-95',
  },
  open: {
    enTitle: 'OPEN PLAIN',
    image: '/assets/terrains/plain.webp',
    imgClass: 'object-bottom brightness-90',
  },
  road: {
    enTitle: 'FUYUKI ROAD',
    image: '/assets/terrains/road.webp',
    imgClass: 'object-bottom brightness-75 saturate-75',
  },
  ruins: {
    enTitle: 'ANCIENT RUINS',
    image: '/assets/terrains/ruins.webp',
    imgClass: 'object-center brightness-65 saturate-50 contrast-110',
  },
  building: {
    enTitle: 'HIGH BUILDING',
    image: '/assets/terrains/building.webp',
    imgClass: 'object-center brightness-85 contrast-110',
  },
  water: {
    enTitle: 'FUYUKI RIVER',
    imgClass: 'object-center',
  },
};

const ZONE_SHORT_LABEL: Record<string, string> = {
  base_a: 'MOUNT ENZO',
  central: 'CENTRAL',
  base_b: 'SHINTO',
};

export function TileInspector() {
  const hoveredTile = useGameStore((s) => s.hoveredTile);
  const lockedTile = useGameStore((s) => s.lockedTile);
  const clearLockedTile = useGameStore((s) => s.clearLockedTile);
  const tileOverrides = useGameStore((s) => s.roomState.tileOverrides);
  const [imgErr, setImgErr] = useState<string | null>(null);

  // Locked tile takes priority over hover; hovering previews when unlocked
  const activeTile = lockedTile ?? hoveredTile;
  const isLocked = Boolean(lockedTile);

  if (!activeTile) {
    return (
      <section className="mt-3 border-t border-[#C8A253]/25 pt-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-xs font-bold uppercase tracking-widest text-[#C8A253]">
            Tile Inspector
          </h3>
          <span className="text-[10px] text-slate-500">Hover / Click ช่อง</span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-[2px] border border-dashed border-[#C8A253]/25 bg-[#090B10]/70 px-3 py-5 text-center">
          <Compass className="mb-1.5 h-5 w-5 text-[#C8A253]/50" />
          <p className="text-[11px] font-medium text-slate-400">
            ชี้เมาส์เพื่อดูรายละเอียดช่อง หรือคลิกช่องบนกระดานเพื่อล็อกข้อมูลไว้
          </p>
        </div>
      </section>
    );
  }

  const zoneDef = MAP_DATA.zones[activeTile.zone];
  const terrainId = zoneDef.terrainGrid[activeTile.y]?.[activeTile.x] ?? 'open';
  const terrain = TERRAINS_BY_ID[terrainId];
  const scene = TERRAIN_SCENE_MAP[terrainId];
  const specialTile = zoneDef.specialTiles.find(
    (t) => t.x === activeTile.x && t.y === activeTile.y
  );
  const override = tileOverrides[getTileKey(activeTile.zone, activeTile.x, activeTile.y)];
  const coordLabel = formatCoordLabel(activeTile.x, activeTile.y);
  const hasLayer2 = Boolean(specialTile || override?.cleared || override?.customNote);

  return (
    <section className="mt-3 border-t border-[#C8A253]/25 pt-3">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-display text-xs font-bold uppercase tracking-widest text-[#C8A253]">
          Tile Inspector
        </h3>
        {isLocked ? (
          <button
            type="button"
            onClick={clearLockedTile}
            title="คลิกเพื่อปลดล็อกช่อง"
            className="flex items-center gap-1 rounded-[2px] border border-[#C8A253]/50 bg-[#C8A253]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#E5C983] transition hover:bg-[#C8A253]/25"
          >
            <Lock className="h-2.5 w-2.5" />
            <span>Locked · ปลดล็อก</span>
          </button>
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <Unlock className="h-2.5 w-2.5 text-slate-500" />
            Preview (คลิกเพื่อล็อก)
          </span>
        )}
      </div>

      {/* Main Inspector Card */}
      <div className="clip-tactical overflow-hidden border border-[#C8A253]/35 bg-[#0B101B]">
        {/* Scene Banner (~112px / h-28) */}
        <div className="relative h-28 w-full overflow-hidden bg-[#090B10]">
          {scene.image && imgErr !== scene.image ? (
            <img
              src={scene.image}
              alt={scene.enTitle}
              onError={() => setImgErr(scene.image ?? null)}
              className={`h-full w-full object-cover ${scene.imgClass}`}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0A2239] via-[#0F2F4C] to-[#0B101B]">
              <Waves className="h-10 w-10 text-sky-400/30" />
            </div>
          )}

          {/* Bottom-to-top dark gradient */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B101B] via-[#0B101B]/55 to-transparent" />

          {/* Top-Left Coordinate Pill */}
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-[2px] border border-[#C8A253]/40 bg-[#090B10]/85 px-1.5 py-0.5 font-display text-[10px] font-bold tracking-wider text-[#E5C983]">
            <span>{ZONE_SHORT_LABEL[activeTile.zone]}</span>
            <span className="text-slate-500">·</span>
            <span>{coordLabel}</span>
          </div>

          {/* Top-Right MP Cost Pill */}
          <div className="absolute top-2 right-2 rounded-[2px] border border-slate-700/80 bg-[#090B10]/85 px-1.5 py-0.5 text-[10px] font-bold text-slate-200">
            {terrain.moveCost.toFixed(1)} MP
          </div>

          {/* Bottom-Left Terrain Title (Cinzel Gold + Thai) */}
          <div className="absolute inset-x-2.5 bottom-2 flex items-baseline justify-between gap-2">
            <div>
              <div className="font-display text-sm font-bold leading-tight tracking-wider text-[#C8A253]">
                {scene.enTitle}
              </div>
              <div className="text-[11px] font-semibold text-slate-200">
                ภูมิประเทศ: {terrain.label}
              </div>
            </div>
          </div>
        </div>

        {/* Body: Layer 1 (Terrain) + Layer 2 (Special Node / Status) */}
        <div className="space-y-2 p-2.5">
          {/* Layer 1: Terrain Effects */}
          <div className="rounded-[2px] border border-slate-800 bg-[#090B10]/80 p-2">
            <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>Layer 1 · ผลภูมิประเทศ</span>
              <span className="text-[#C8A253]">
                Cost {terrain.moveCost.toFixed(1)} MP
                {typeof terrain.sameTerrainMoveCost === 'number'
                  ? ` (${terrain.sameTerrainMoveCost.toFixed(1)} ข้ามตึก)`
                  : ''}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              {terrain.combatNote}
            </p>
          </div>

          {/* Layer 2: Special Node / Status (shown only when present) */}
          {hasLayer2 && (
            <div className="rounded-[2px] border border-[#C8A253]/40 bg-[#111622] p-2">
              <div className="mb-1 flex items-center justify-between gap-1">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#E5C983]">
                  <Sparkles className="h-3 w-3 text-[#C8A253]" />
                  Layer 2 · Special Node
                </span>
                {override?.cleared && (
                  <span className="rounded-[2px] border border-slate-600 bg-slate-900 px-1.5 py-px text-[9px] font-bold tracking-wider text-slate-400">
                    CLEARED
                  </span>
                )}
              </div>

              {specialTile && (
                <div>
                  <div className="font-display text-xs font-bold tracking-wide text-slate-100">
                    {specialTile.label}
                  </div>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-300">
                    {getSpecialTileEffectText(specialTile.type, specialTile.manaBonus)}
                  </p>
                </div>
              )}

              {override?.customNote && (
                <div className="mt-1.5 flex items-start gap-1.5 rounded-[2px] border border-[#C8A253]/30 bg-[#090B10] px-2 py-1 text-[11px] text-[#E5C983]">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-[#C8A253]" />
                  <span>{override.customNote}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
