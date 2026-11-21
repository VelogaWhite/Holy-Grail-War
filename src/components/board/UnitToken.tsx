import { useState } from 'react';
import { Eye, Sparkles } from 'lucide-react';
import type { BoardUnit } from '../../types/game';
import {
  getClassIconUrl,
  getFactionStyle,
  getInitials,
  resolveAssetUrl,
} from '../../utils/assetHelper';

interface UnitTokenProps {
  unit: BoardUnit;
  isSelected: boolean;
  onSelect: () => void;
}

export function UnitToken({ unit, isSelected, onSelect }: UnitTokenProps) {
  const [imgError, setImgError] = useState(false);
  const [classIconError, setClassIconError] = useState(false);

  const faction = getFactionStyle(unit.owner);
  const imageUrl = resolveAssetUrl(unit.image);
  const classIconUrl = getClassIconUrl(unit.servantClass, unit.subClass);
  const hpPercent = Math.max(0, Math.min(100, (unit.hp / Math.max(1, unit.maxHp)) * 100));

  const primaryTag = unit.tags[0];
  const extraTags = unit.tags.length > 1 ? unit.tags.length - 1 : 0;
  const shortName = unit.name.split(' ')[0];

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`group relative flex h-[88%] w-[88%] flex-col items-center justify-center rounded-md border-2 bg-slate-900 transition ${
        faction.border
      } ${
        isSelected
          ? 'z-20 scale-[1.03] ring-2 ring-amber-500 ring-offset-1 ring-offset-slate-950'
          : 'hover:z-20 hover:scale-[1.03]'
      }`}
    >
      {/* Portrait or Initials Fallback */}
      <div className="relative h-full w-full overflow-hidden rounded-[4px]">
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={unit.name}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover object-top"
            draggable={false}
          />
        ) : (
          <div
            className={`flex h-full w-full flex-col items-center justify-center ${faction.bg} text-white`}
          >
            <span className="text-xs font-bold tracking-tight">
              {getInitials(unit.name)}
            </span>
          </div>
        )}

        {/* Matte dark backdrop for Name + HP bar */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-slate-950/90 px-1 pt-0.5 pb-0.5">
          <div className="flex items-center justify-between gap-0.5 text-[8.5px] font-bold leading-none text-slate-200">
            <span className="truncate">{shortName}</span>
            <span className="shrink-0 font-mono text-amber-200">
              {unit.hp}/{unit.maxHp}
            </span>
          </div>
          <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full transition-all ${
                hpPercent > 50
                  ? 'bg-emerald-500'
                  : hpPercent > 25
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Top-Left: Class Icon Badge */}
      {classIconUrl && !classIconError && (
        <div
          title={unit.subClass ? `${unit.servantClass} (${unit.subClass})` : unit.servantClass}
          className="absolute -top-1.5 -left-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-slate-600 bg-slate-950 p-0.5"
        >
          <img
            src={classIconUrl}
            alt={unit.servantClass ?? 'Class'}
            onError={() => setClassIconError(true)}
            className="h-full w-full object-contain"
          />
        </div>
      )}

      {/* Top-Right: NP Ready / Reveal Eye (Matte, no glow) */}
      <div className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5">
        {unit.npReady && (
          <span
            title="NP Ready"
            className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-slate-950 bg-amber-600 text-slate-950"
          >
            <Sparkles className="h-2.5 w-2.5" />
          </span>
        )}
        {unit.isRevealedToEnemy && unit.unitType === 'servant' && (
          <span
            title="Revealed through Fog"
            className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-slate-950 bg-teal-600 text-white"
          >
            <Eye className="h-2.5 w-2.5" />
          </span>
        )}
      </div>

      {/* Compact Top-Center Tag Pill */}
      {primaryTag && (
        <div className="pointer-events-none absolute top-0.5 inset-x-3 flex items-center justify-center gap-0.5">
          <span className="max-w-full truncate rounded bg-slate-950/90 px-1 py-px text-[7.5px] font-semibold text-amber-200 ring-1 ring-slate-700">
            {primaryTag}
          </span>
          {extraTags > 0 && (
            <span className="shrink-0 rounded bg-amber-600 px-1 py-px text-[7.5px] font-bold text-slate-950">
              +{extraTags}
            </span>
          )}
        </div>
      )}

      {/* Hover Quick Tooltip */}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 hidden w-44 -translate-x-1/2 rounded-lg border border-slate-600 bg-slate-900 p-2 text-left text-[11px] text-slate-200 shadow-lg group-hover:block">
        <div className="font-bold leading-tight text-amber-200">{unit.name}</div>
        <div className="mt-0.5 text-[10px] font-semibold text-slate-400">
          {unit.unitType === 'servant'
            ? `${unit.servantClass}${unit.subClass ? ` • ${unit.subClass}` : ''}`
            : 'Neutral PvE Monster'}
        </div>
        <div className="mt-1.5 grid grid-cols-3 gap-1 rounded bg-slate-950 px-1.5 py-1 text-center text-[10px] font-bold text-slate-200">
          <span>ATK {unit.atk}</span>
          <span>MOV {unit.mov}</span>
          <span>RNG {unit.range ?? 1}</span>
        </div>
        {unit.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {unit.tags.map((t) => (
              <span
                key={t}
                className="rounded bg-slate-800 px-1 py-0.5 text-[9px] font-semibold text-amber-200"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
