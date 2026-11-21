import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Coins,
  Cross,
  Crown,
  Droplet,
  Eye,
  Hammer,
  HelpCircle,
  Hexagon,
  Landmark,
  MapPin,
  Orbit,
  Route,
  Skull,
  Sparkles,
  Trees,
  Waves,
} from 'lucide-react';
import { TERRAINS_BY_ID } from '../../data';
import type {
  BoardUnit,
  SpecialTile,
  TerrainId,
  TileOverride,
  ZoneId,
} from '../../types/game';
import { formatCoordLabel } from '../../utils/assetHelper';
import { UnitToken } from './UnitToken';

interface GridTileProps {
  zone: ZoneId;
  x: number;
  y: number;
  terrainId: TerrainId;
  specialTile?: SpecialTile;
  tileOverride?: TileOverride;
  unit?: BoardUnit;
  isSelectedUnit: boolean;
  onSelectUnit: (unitId: string) => void;
  onGateJump: (targetZone: ZoneId) => void;
  onHover: () => void;
}

function TerrainBackdropIcon({ terrainId }: { terrainId: TerrainId }) {
  const cls = 'h-3.5 w-3.5 opacity-20 text-slate-300';
  switch (terrainId) {
    case 'road':
      return <Route className={cls} />;
    case 'building':
      return <Building2 className={cls} />;
    case 'forest':
      return <Trees className="h-3.5 w-3.5 opacity-25 text-emerald-300" />;
    case 'ruins':
      return <Landmark className="h-3.5 w-3.5 opacity-25 text-amber-200" />;
    case 'water':
      return <Waves className="h-3.5 w-3.5 opacity-25 text-sky-300" />;
    default:
      return null;
  }
}

export function GridTile({
  zone,
  x,
  y,
  terrainId,
  specialTile,
  tileOverride,
  unit,
  isSelectedUnit,
  onSelectUnit,
  onGateJump,
  onHover,
}: GridTileProps) {
  const coordLabel = formatCoordLabel(x, y);
  const terrain = TERRAINS_BY_ID[terrainId];
  const isCleared = tileOverride?.cleared ?? false;
  const customNote = tileOverride?.customNote;

  const isGateRight = specialTile?.type === 'gate' && x === 9;
  const isGateLeft = specialTile?.type === 'gate' && x === 0;

  const renderSpecialMarker = () => {
    if (!specialTile) return null;
    switch (specialTile.type) {
      case 'leyline':
        return (
          <div className="pointer-events-none flex flex-col items-center text-teal-300/85">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="text-[8.5px] font-bold leading-none">
              +{specialTile.manaBonus ?? 2}M
            </span>
          </div>
        );
      case 'qp_cache':
        return (
          <div className="pointer-events-none flex flex-col items-center text-amber-300/80">
            <Coins className="h-3.5 w-3.5" />
            <span className="text-[8px] font-bold leading-none">QP</span>
          </div>
        );
      case 'personal_event':
        return (
          <div className="pointer-events-none flex flex-col items-center text-amber-400/80">
            <HelpCircle className="h-3.5 w-3.5" />
            <span className="text-[8px] font-bold leading-none">Event</span>
          </div>
        );
      case 'monster_nest':
        return (
          <div className="pointer-events-none flex flex-col items-center text-stone-400">
            <Skull className="h-3.5 w-3.5" />
            <span className="text-[8px] font-bold leading-none">
              T{specialTile.tier ?? 1}
            </span>
          </div>
        );
      case 'safe_house':
        return (
          <div className="pointer-events-none flex flex-col items-center text-emerald-400/80">
            <Cross className="h-3.5 w-3.5" />
            <span className="text-[8px] font-bold leading-none">Church</span>
          </div>
        );
      case 'grail_site':
        return (
          <div className="pointer-events-none flex flex-col items-center text-amber-400/90">
            <Crown className="h-4 w-4" />
            <span className="text-[8px] font-extrabold uppercase leading-none">Grail</span>
          </div>
        );
      case 'summoning_altar':
        return (
          <div className="pointer-events-none flex flex-col items-center text-violet-300/80">
            <Hexagon className="h-3.5 w-3.5" />
            <span className="text-[7.5px] font-bold leading-none">Altar</span>
          </div>
        );
      case 'teleporter':
        return (
          <div className="pointer-events-none flex flex-col items-center text-teal-300/80">
            <Orbit className="h-3.5 w-3.5" />
            <span className="text-[7.5px] font-bold leading-none">Portal</span>
          </div>
        );
      case 'watchtower':
        return (
          <div className="pointer-events-none flex flex-col items-center text-amber-200/80">
            <Eye className="h-3.5 w-3.5" />
            <span className="text-[7.5px] font-bold leading-none">Tower</span>
          </div>
        );
      case 'workshop':
        return (
          <div className="pointer-events-none flex flex-col items-center text-amber-300/80">
            <Hammer className="h-3.5 w-3.5" />
            <span className="text-[7.5px] font-bold leading-none">Forge</span>
          </div>
        );
      case 'blood_altar':
        return (
          <div className="pointer-events-none flex flex-col items-center text-rose-400/85">
            <Droplet className="h-3.5 w-3.5" />
            <span className="text-[7.5px] font-bold leading-none">Blood</span>
          </div>
        );
      case 'spawn_a':
        return (
          <span className="pointer-events-none text-[8.5px] font-bold text-rose-400/80">
            {specialTile.label}
          </span>
        );
      case 'spawn_b':
        return (
          <span className="pointer-events-none text-[8.5px] font-bold text-sky-400/80">
            {specialTile.label}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      onMouseEnter={onHover}
      style={{ backgroundColor: terrain.bgColor }}
      className={`relative flex items-center justify-center border border-slate-700/60 transition hover:z-10 hover:ring-1 hover:ring-slate-400/70 ${
        isGateRight ? 'border-r-[3px] border-r-teal-600' : ''
      } ${isGateLeft ? 'border-l-[3px] border-l-teal-600' : ''} ${
        specialTile?.type === 'grail_site'
          ? 'ring-inset ring-1 ring-amber-600/80'
          : ''
      }`}
    >
      {/* Coordinate Label (Top-Left) */}
      <span className="pointer-events-none absolute top-0.5 left-1 text-[8px] font-semibold text-slate-400/70">
        {coordLabel}
      </span>

      {/* Layer 1: Subtle Terrain Icon (when no special tile and no unit) */}
      {!specialTile && !unit && (
        <div className="pointer-events-none">
          <TerrainBackdropIcon terrainId={terrainId} />
        </div>
      )}

      {/* Layer 1: Mandatory Thai Terrain Badge (Bottom-Left on EVERY tile) */}
      <span className="pointer-events-none absolute bottom-0.5 left-0.5 z-10 rounded bg-slate-950/75 px-1 py-px text-[7.5px] font-semibold leading-none text-slate-300/90">
        {terrain.label}
      </span>

      {/* Custom GM Note Pin (Top-Right) */}
      {customNote && (
        <div
          title={`GM Note: ${customNote}`}
          className="absolute top-0.5 right-0.5 z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-600 text-slate-950"
        >
          <MapPin className="h-2.5 w-2.5" />
        </div>
      )}

      {/* Gate Quick-Jump Button (Matte Teal) */}
      {specialTile?.type === 'gate' && specialTile.targetZone && (
        <button
          type="button"
          onClick={() => onGateJump(specialTile.targetZone!)}
          title={`คลิกเพื่อข้ามไปดูโซน ${specialTile.targetZone.toUpperCase()}`}
          className={`absolute z-10 flex items-center gap-0.5 rounded border border-teal-700 bg-slate-800 px-1 py-0.5 text-[7.5px] font-bold text-teal-200 transition hover:bg-teal-900 ${
            isGateRight ? 'right-0.5 bottom-0.5' : 'right-0.5 top-0.5'
          }`}
        >
          {isGateLeft && <ArrowLeft className="h-2.5 w-2.5" />}
          <span>
            {specialTile.targetZone === 'central'
              ? 'CTR'
              : specialTile.targetZone === 'base_a'
                ? 'A'
                : 'B'}
          </span>
          {isGateRight && <ArrowRight className="h-2.5 w-2.5" />}
        </button>
      )}

      {/* Layer 2: Special Feature Marker (dimmed when unit occupies) */}
      <div className={unit ? 'opacity-15' : 'opacity-90'}>{renderSpecialMarker()}</div>

      {/* Cleared Overlay */}
      {isCleared && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/60">
          <span className="rotate-[-12deg] rounded border border-slate-600 bg-slate-900/95 px-1 py-px text-[7px] font-bold tracking-wider text-slate-400">
            CLEARED
          </span>
        </div>
      )}

      {/* Occupying Unit Token */}
      {unit && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <UnitToken
            unit={unit}
            isSelected={isSelectedUnit}
            onSelect={() => onSelectUnit(unit.id)}
          />
        </div>
      )}

      <span className="sr-only">
        {zone}-{x}-{y}
      </span>
    </div>
  );
}
