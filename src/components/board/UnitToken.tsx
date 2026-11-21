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

  const visibleTags = unit.tags.slice(0, 2);
  const extraTags = unit.tags.length - visibleTags.length;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`group relative flex h-[86%] w-[86%] flex-col items-center justify-center rounded-lg border-[3px] bg-white shadow-sm transition ${
        faction.border
      } ${
        isSelected
          ? 'ring-3 ring-orange-500 ring-offset-1 scale-[1.03] z-20'
          : 'hover:scale-[1.03] hover:z-20'
      }`}
    >
      {/* Portrait or Initials Fallback */}
      <div className="relative h-full w-full overflow-hidden rounded-[5px]">
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
            <span className="text-sm font-black tracking-tight">
              {getInitials(unit.name)}
            </span>
            {unit.servantClass && (
              <span className="text-[9px] font-semibold opacity-85">
                {unit.subClass || unit.servantClass}
              </span>
            )}
          </div>
        )}

        {/* Bottom gradient for readable HP bar */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/85 via-black/50 to-transparent" />

        {/* Bottom HP bar + crisp numeric label */}
        <div className="pointer-events-none absolute inset-x-1 bottom-0.5 flex flex-col gap-0.5">
          <div className="flex items-center justify-between px-0.5 text-[9px] font-black leading-none text-white drop-shadow">
            <span className="truncate max-w-[65%]">{unit.name.split(' ')[0]}</span>
            <span>
              {unit.hp}/{unit.maxHp}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-900/80">
            <div
              className={`h-full transition-all ${
                hpPercent > 50
                  ? 'bg-emerald-400'
                  : hpPercent > 25
                    ? 'bg-amber-400'
                    : 'bg-red-500'
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
          className="absolute -top-1.5 -left-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-slate-900 bg-slate-950 p-0.5 shadow"
        >
          <img
            src={classIconUrl}
            alt={unit.servantClass ?? 'Class'}
            onError={() => setClassIconError(true)}
            className="h-full w-full object-contain"
          />
        </div>
      )}

      {/* Top-Right: NP Ready Glow / Reveal Eye */}
      <div className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5">
        {unit.npReady && (
          <span
            title="NP Ready"
            className="flex h-4 w-4 items-center justify-center rounded-full border border-white bg-orange-500 text-white shadow"
          >
            <Sparkles className="h-2.5 w-2.5" />
          </span>
        )}
        {unit.isRevealedToEnemy && unit.unitType === 'servant' && (
          <span
            title="Revealed through Fog"
            className="flex h-4 w-4 items-center justify-center rounded-full border border-white bg-slate-900 text-white shadow"
          >
            <Eye className="h-2.5 w-2.5" />
          </span>
        )}
      </div>

      {/* Top Tag Pills (max 2 + "+N") */}
      {visibleTags.length > 0 && (
        <div className="pointer-events-none absolute -bottom-2.5 inset-x-0 flex items-center justify-center gap-0.5">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="max-w-[52px] truncate rounded bg-slate-900 px-1 py-px text-[8px] font-bold text-orange-300 shadow"
            >
              {tag}
            </span>
          ))}
          {extraTags > 0 && (
            <span className="rounded bg-orange-500 px-1 py-px text-[8px] font-bold text-white shadow">
              +{extraTags}
            </span>
          )}
        </div>
      )}

      {/* Hover Quick Tooltip */}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 hidden w-44 -translate-x-1/2 rounded-lg border-2 border-slate-900 bg-white p-2 text-left text-[11px] text-slate-900 shadow-lg group-hover:block">
        <div className="font-extrabold leading-tight">{unit.name}</div>
        <div className="mt-0.5 text-[10px] font-semibold text-slate-500">
          {unit.unitType === 'servant'
            ? `${unit.servantClass}${unit.subClass ? ` • ${unit.subClass}` : ''}`
            : 'Neutral PvE Monster'}
        </div>
        <div className="mt-1.5 grid grid-cols-3 gap-1 rounded bg-slate-100 px-1.5 py-1 text-center text-[10px] font-bold">
          <span>ATK {unit.atk}</span>
          <span>MOV {unit.mov}</span>
          <span>RNG {unit.range ?? 1}</span>
        </div>
        {unit.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {unit.tags.map((t) => (
              <span
                key={t}
                className="rounded bg-orange-100 px-1 py-0.5 text-[9px] font-bold text-orange-800"
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
