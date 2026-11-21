import {
  ArrowLeft,
  ArrowRight,
  Coins,
  Cross,
  Crown,
  HelpCircle,
  MapPin,
  Skull,
  Sparkles,
} from 'lucide-react';
import type { BoardUnit, SpecialTile, TileOverride, ZoneId } from '../../types/game';
import { formatCoordLabel } from '../../utils/assetHelper';
import { UnitToken } from './UnitToken';

interface GridTileProps {
  zone: ZoneId;
  x: number;
  y: number;
  specialTile?: SpecialTile;
  tileOverride?: TileOverride;
  unit?: BoardUnit;
  isSelectedUnit: boolean;
  onSelectUnit: (unitId: string) => void;
  onGateJump: (targetZone: ZoneId) => void;
}

export function GridTile({
  zone,
  x,
  y,
  specialTile,
  tileOverride,
  unit,
  isSelectedUnit,
  onSelectUnit,
  onGateJump,
}: GridTileProps) {
  const coordLabel = formatCoordLabel(x, y);
  const isCleared = tileOverride?.cleared ?? false;
  const customNote = tileOverride?.customNote;

  const getTileBg = () => {
    if (!specialTile) return 'bg-white hover:bg-slate-50';
    switch (specialTile.type) {
      case 'leyline':
        return 'bg-sky-50/90 hover:bg-sky-100/80';
      case 'qp_cache':
        return 'bg-amber-50/90 hover:bg-amber-100/80';
      case 'personal_event':
        return 'bg-orange-50/90 hover:bg-orange-100/80';
      case 'monster_nest':
        return 'bg-stone-100 hover:bg-stone-200/70';
      case 'safe_house':
        return 'bg-emerald-50/90 hover:bg-emerald-100/80';
      case 'grail_site':
        return 'bg-gradient-to-br from-amber-100 via-orange-50 to-amber-100 hover:from-amber-200/80';
      case 'spawn_a':
        return 'bg-red-50/80 hover:bg-red-100/70';
      case 'spawn_b':
        return 'bg-blue-50/80 hover:bg-blue-100/70';
      case 'gate':
        return 'bg-orange-50/60 hover:bg-orange-100/70';
      default:
        return 'bg-white';
    }
  };

  const renderSpecialMarker = () => {
    if (!specialTile) return null;
    switch (specialTile.type) {
      case 'leyline':
        return (
          <div className="pointer-events-none flex flex-col items-center text-sky-700">
            <Sparkles className="h-4 w-4" />
            <span className="text-[10px] font-black leading-tight">
              +{specialTile.manaBonus ?? 2}M
            </span>
          </div>
        );
      case 'qp_cache':
        return (
          <div className="pointer-events-none flex flex-col items-center text-amber-600">
            <Coins className="h-4 w-4" />
            <span className="text-[9px] font-extrabold leading-tight">QP 1d6</span>
          </div>
        );
      case 'personal_event':
        return (
          <div className="pointer-events-none flex flex-col items-center text-orange-600">
            <HelpCircle className="h-4 w-4" />
            <span className="text-[9px] font-extrabold leading-tight">Event ?</span>
          </div>
        );
      case 'monster_nest':
        return (
          <div className="pointer-events-none flex flex-col items-center text-stone-600">
            <Skull className="h-4 w-4" />
            <span className="text-[9px] font-extrabold leading-tight">
              T{specialTile.tier ?? 1} Nest
            </span>
          </div>
        );
      case 'safe_house':
        return (
          <div className="pointer-events-none flex flex-col items-center text-emerald-700">
            <Cross className="h-4 w-4" />
            <span className="text-[9px] font-extrabold leading-tight">+2HP/Shop</span>
          </div>
        );
      case 'grail_site':
        return (
          <div className="pointer-events-none flex flex-col items-center text-orange-600">
            <Crown className="h-5 w-5" />
            <span className="text-[9px] font-black uppercase leading-tight">
              Grail
            </span>
          </div>
        );
      case 'spawn_a':
        return (
          <span className="pointer-events-none text-[10px] font-black text-red-500/80">
            {specialTile.label}
          </span>
        );
      case 'spawn_b':
        return (
          <span className="pointer-events-none text-[10px] font-black text-blue-500/80">
            {specialTile.label}
          </span>
        );
      default:
        return null;
    }
  };

  const isGateRight = specialTile?.type === 'gate' && x === 5;
  const isGateLeft = specialTile?.type === 'gate' && x === 0;

  return (
    <div
      title={specialTile ? `${coordLabel} (${x},${y}) — ${specialTile.label}` : `${coordLabel} (${x},${y})`}
      className={`relative flex aspect-square items-center justify-center border border-slate-300 transition ${getTileBg()} ${
        isGateRight ? 'border-r-4 border-r-orange-500' : ''
      } ${isGateLeft ? 'border-l-4 border-l-orange-500' : ''} ${
        specialTile?.type === 'grail_site' ? 'ring-inset ring-2 ring-orange-400/80' : ''
      }`}
    >
      {/* Coordinate Label (Top-Left) */}
      <span className="pointer-events-none absolute top-0.5 left-1 text-[9px] font-bold text-slate-400">
        {coordLabel}
      </span>

      {/* Custom GM Note Pin (Top-Right) */}
      {customNote && (
        <div
          title={`GM Note: ${customNote}`}
          className="absolute top-0.5 right-0.5 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-white shadow-xs"
        >
          <MapPin className="h-2.5 w-2.5" />
        </div>
      )}

      {/* Gate Quick-Jump Button */}
      {specialTile?.type === 'gate' && specialTile.targetZone && (
        <button
          type="button"
          onClick={() => onGateJump(specialTile.targetZone!)}
          title={`คลิกเพื่อสลับไปดูโซน ${specialTile.targetZone.toUpperCase()}`}
          className={`absolute z-10 flex items-center gap-0.5 rounded bg-orange-500 px-1 py-0.5 text-[8px] font-black text-white shadow hover:bg-orange-600 ${
            isGateRight ? 'right-0.5 bottom-0.5' : 'left-0.5 bottom-0.5'
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

      {/* Special Tile Background Marker (dimmed when unit occupies) */}
      <div className={unit ? 'opacity-20' : 'opacity-95'}>{renderSpecialMarker()}</div>

      {/* Cleared Overlay */}
      {isCleared && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-200/65">
          <span className="rotate-[-12deg] rounded border border-slate-500 bg-white/90 px-1 py-0.5 text-[8px] font-black tracking-wider text-slate-600">
            CLEARED
          </span>
        </div>
      )}

      {/* Occupying Unit Token */}
      {unit && (
        <div className="absolute inset-0 flex items-center justify-center">
          <UnitToken
            unit={unit}
            isSelected={isSelectedUnit}
            onSelect={() => onSelectUnit(unit.id)}
          />
        </div>
      )}

      {/* Hidden zone attribute for future Phase 2 DnD targeting */}
      <span className="sr-only">
        {zone}-{x}-{y}
      </span>
    </div>
  );
}
