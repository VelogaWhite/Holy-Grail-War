import { useDroppable } from '@dnd-kit/core';
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
  Skull,
  Sparkles,
  Trees,
  Waves,
} from 'lucide-react';
import type {
  BoardUnit,
  SpecialTile,
  TerrainId,
  TileOverride,
  ZoneId,
} from '../../types/game';
import { getTileKey } from '../../utils/assetHelper';
import type { ReachableTileInfo } from '../../utils/gridMath';
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
  isLockedTile: boolean;
  canDragUnit: boolean;
  isUnitIdentityHidden?: boolean;
  deploymentPreview?: { name: string; team: 'team_a' | 'team_b' } | null;
  reachableInfo?: ReachableTileInfo;
  isSpawnMode: boolean;
  onSelectUnit: (unitId: string) => void;
  onGateJump: (targetZone: ZoneId) => void;
  onHover: () => void;
  onClickTile: () => void;
  onRightClickTile: (clientX: number, clientY: number) => void;
}

function TerrainSubtleGlyph({ terrainId }: { terrainId: TerrainId }) {
  switch (terrainId) {
    case 'building':
      return <Building2 className="h-4 w-4 text-slate-300/20" />;
    case 'forest':
      return <Trees className="h-4 w-4 text-emerald-400/25" />;
    case 'ruins':
      return <Landmark className="h-4 w-4 text-[#C8A253]/25" />;
    case 'water':
      return <Waves className="h-4 w-4 text-sky-400/25" />;
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
  isLockedTile,
  canDragUnit,
  isUnitIdentityHidden = false,
  deploymentPreview = null,
  reachableInfo,
  isSpawnMode,
  onSelectUnit,
  onGateJump,
  onHover,
  onClickTile,
  onRightClickTile,
}: GridTileProps) {
  const tileKey = getTileKey(zone, x, y);
  const { setNodeRef, isOver } = useDroppable({
    id: tileKey,
    data: { zone, x, y },
  });

  const isCleared = tileOverride?.cleared ?? false;
  const customNote = tileOverride?.customNote;

  const isGateRight = specialTile?.type === 'gate' && x === 9;
  const isGateLeft = specialTile?.type === 'gate' && x === 0;

  const renderSpecialMarker = () => {
    if (!specialTile) return null;
    switch (specialTile.type) {
      case 'leyline':
        return (
          <div className="pointer-events-none flex flex-col items-center text-teal-300/90">
            <Sparkles className="h-4 w-4" />
            <span className="mt-0.5 text-[9px] font-bold leading-none">
              +{specialTile.manaBonus ?? 2}M
            </span>
          </div>
        );
      case 'qp_cache':
        return (
          <div className="pointer-events-none flex flex-col items-center text-[#C8A253]">
            <Coins className="h-4 w-4" />
            <span className="mt-0.5 text-[8.5px] font-bold leading-none">QP</span>
          </div>
        );
      case 'personal_event':
        return (
          <div className="pointer-events-none flex flex-col items-center text-[#E5C983]">
            <HelpCircle className="h-4 w-4" />
            <span className="mt-0.5 text-[8.5px] font-bold leading-none">?</span>
          </div>
        );
      case 'monster_nest':
        return (
          <div className="pointer-events-none flex flex-col items-center text-stone-400">
            <Skull className="h-4 w-4" />
            <span className="mt-0.5 text-[8.5px] font-bold leading-none">
              T{specialTile.tier ?? 1}
            </span>
          </div>
        );
      case 'safe_house':
        return (
          <div className="pointer-events-none flex flex-col items-center text-emerald-400/90">
            <Cross className="h-4 w-4" />
            <span className="mt-0.5 text-[8px] font-bold leading-none">Church</span>
          </div>
        );
      case 'grail_site':
        return (
          <div className="pointer-events-none flex flex-col items-center text-[#C8A253]">
            <Crown className="h-5 w-5" />
            <span className="mt-0.5 font-display text-[8px] font-bold uppercase tracking-wider leading-none">
              Grail
            </span>
          </div>
        );
      case 'summoning_altar':
        return (
          <div className="pointer-events-none flex flex-col items-center text-violet-300/90">
            <Hexagon className="h-4 w-4" />
            <span className="mt-0.5 text-[8px] font-bold leading-none">Altar</span>
          </div>
        );
      case 'teleporter':
        return (
          <div className="pointer-events-none flex flex-col items-center text-teal-300/90">
            <Orbit className="h-4 w-4" />
            <span className="mt-0.5 text-[8px] font-bold leading-none">Portal</span>
          </div>
        );
      case 'watchtower':
        return (
          <div className="pointer-events-none flex flex-col items-center text-[#E5C983]/90">
            <Eye className="h-4 w-4" />
            <span className="mt-0.5 text-[8px] font-bold leading-none">Tower</span>
          </div>
        );
      case 'workshop':
        return (
          <div className="pointer-events-none flex flex-col items-center text-[#C8A253]/90">
            <Hammer className="h-4 w-4" />
            <span className="mt-0.5 text-[8px] font-bold leading-none">Forge</span>
          </div>
        );
      case 'blood_altar':
        return (
          <div className="pointer-events-none flex flex-col items-center text-red-400/90">
            <Droplet className="h-4 w-4" />
            <span className="mt-0.5 text-[8px] font-bold leading-none">Blood</span>
          </div>
        );
      case 'spawn_a':
        return (
          <span className="pointer-events-none font-display text-[9px] font-bold text-red-400/75">
            {specialTile.label.replace('Spawn ', '')}
          </span>
        );
      case 'spawn_b':
        return (
          <span className="pointer-events-none font-display text-[9px] font-bold text-sky-400/75">
            {specialTile.label.replace('Spawn ', '')}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      onMouseEnter={onHover}
      onClick={onClickTile}
      onContextMenu={(e) => {
        e.preventDefault();
        onRightClickTile(e.clientX, e.clientY);
      }}
      className={`terrain-${terrainId} relative flex items-center justify-center border border-slate-800/70 transition hover:z-10 hover:ring-1 hover:ring-[#C8A253]/70 ${
        isSpawnMode ? 'cursor-crosshair' : 'cursor-pointer'
      } ${isOver ? 'z-20 ring-2 ring-[#E5C983] bg-[#C8A253]/25' : ''} ${
        isLockedTile && !isOver ? 'z-10 ring-2 ring-[#C8A253]' : ''
      } ${isGateRight ? 'border-r-[3px] border-r-teal-500/80' : ''} ${
        isGateLeft ? 'border-l-[3px] border-l-teal-500/80' : ''
      } ${
        specialTile?.type === 'grail_site'
          ? 'ring-inset ring-1 ring-[#C8A253]/80'
          : ''
      }`}
    >
      {/* Movement & ZoC Visual Helper Overlay (non-blocking) */}
      {reachableInfo && !unit && (
        <div
          className={`pointer-events-none absolute inset-0.5 rounded-[2px] border ${
            reachableInfo.isZocRetreat
              ? 'border-amber-500/90 bg-amber-500/18'
              : 'border-emerald-400/75 bg-emerald-500/15'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 rounded-[2px] px-1 py-px font-mono text-[7.5px] font-bold leading-none ${
              reachableInfo.isZocRetreat
                ? 'bg-amber-600 text-slate-950'
                : 'bg-emerald-950/90 text-emerald-300'
            }`}
          >
            {reachableInfo.isZocRetreat ? `ZoC` : `${reachableInfo.cost}`}
          </span>
        </div>
      )}

      {/* Layer 1: Subtle Terrain Glyph ONLY for non-open, non-road empty tiles */}
      {!specialTile && !unit && (
        <div className="pointer-events-none">
          <TerrainSubtleGlyph terrainId={terrainId} />
        </div>
      )}

      {/* Custom GM Note Pin (Top-Right) */}
      {customNote && (
        <div
          title={`GM Note: ${customNote}`}
          className="absolute top-0.5 right-0.5 z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#C8A253] text-[#090B10]"
        >
          <MapPin className="h-2.5 w-2.5" />
        </div>
      )}

      {/* Gate Quick-Jump Button */}
      {specialTile?.type === 'gate' && specialTile.targetZone && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onGateJump(specialTile.targetZone!);
          }}
          title={`คลิกเพื่อข้ามไปดูโซน ${specialTile.targetZone.toUpperCase()}`}
          className={`absolute z-10 flex items-center gap-0.5 rounded-[2px] border border-teal-600/70 bg-[#090B10]/90 px-1 py-0.5 text-[8px] font-bold text-teal-200 transition hover:bg-teal-900 ${
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

      {/* Layer 2: Special Feature Marker */}
      <div className={unit ? 'opacity-10' : 'opacity-95'}>{renderSpecialMarker()}</div>

      {/* Cleared Overlay */}
      {isCleared && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#090B10]/65">
          <span className="rotate-[-12deg] rounded-[2px] border border-slate-600 bg-[#111622]/95 px-1 py-px text-[7px] font-bold tracking-wider text-slate-400">
            CLEARED
          </span>
        </div>
      )}

      {/* Ruler Deployment Preview Ghost Badge */}
      {!unit && deploymentPreview && (
        <div
          className={`pointer-events-none absolute inset-1 z-10 flex flex-col items-center justify-center rounded-[2px] border border-dashed px-1 text-center ${
            deploymentPreview.team === 'team_a'
              ? 'border-red-400 bg-red-950/70 text-red-200'
              : 'border-sky-400 bg-sky-950/70 text-sky-200'
          }`}
        >
          <span className="text-[7px] font-bold uppercase opacity-75">Preview</span>
          <span className="font-display max-w-full truncate text-[8.5px] font-bold">
            {deploymentPreview.name.split(' ')[0]}
          </span>
        </div>
      )}

      {/* Occupying Unit Token */}
      {unit && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <UnitToken
            unit={unit}
            isSelected={isSelectedUnit}
            canDrag={canDragUnit}
            isIdentityHidden={isUnitIdentityHidden}
            onSelect={() => onSelectUnit(unit.id)}
          />
        </div>
      )}

      <span className="sr-only">{tileKey}</span>
    </div>
  );
}
