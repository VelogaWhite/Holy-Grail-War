import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
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
  canDrag: boolean;
  isOverlay?: boolean;
  isIdentityHidden?: boolean;
  onSelect: () => void;
}

export function UnitToken({
  unit,
  isSelected,
  canDrag,
  isOverlay = false,
  isIdentityHidden = false,
  onSelect,
}: UnitTokenProps) {
  const [imgError, setImgError] = useState(false);
  const [classIconError, setClassIconError] = useState(false);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: unit.id,
    disabled: !canDrag || isOverlay,
  });

  const faction = getFactionStyle(unit.owner);
  const imageUrl = resolveAssetUrl(unit.image);
  const classIconUrl = getClassIconUrl(unit.servantClass, unit.subClass);
  const hpPercent = Math.max(0, Math.min(100, (unit.hp / Math.max(1, unit.maxHp)) * 100));

  const teamFrameGlow =
    unit.owner === 'team_a'
      ? 'border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.65)]'
      : unit.owner === 'team_b'
        ? 'border-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.65)]'
        : 'border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.55)]';

  return (
    <button
      ref={isOverlay ? undefined : setNodeRef}
      type="button"
      {...(isOverlay ? {} : listeners)}
      {...(isOverlay ? {} : attributes)}
      onClick={(e) => {
        e.stopPropagation();
        if (!isOverlay) onSelect();
      }}
      className={`group relative flex h-[92%] w-[92%] flex-col items-center justify-center rounded-[3px] border-2 bg-[#090B10] transition ${teamFrameGlow} ${
        isOverlay
          ? 'h-full w-full cursor-grabbing scale-105 shadow-2xl ring-2 ring-[#C8A253]'
          : canDrag
            ? 'cursor-grab active:cursor-grabbing touch-none'
            : 'cursor-pointer'
      } ${
        isDragging
          ? 'opacity-25'
          : !isOverlay && isSelected
            ? 'z-20 scale-[1.05] ring-2 ring-[#C8A253] ring-offset-1 ring-offset-[#090B10]'
            : !isOverlay
              ? 'hover:z-20 hover:scale-[1.04]'
              : ''
      }`}
    >
      {/* Full-Bleed Portrait OR Concealed Class Emblem */}
      <div className="relative h-full w-full overflow-hidden rounded-[2px]">
        {isIdentityHidden ? (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-[#161D2E] to-[#090B10] pb-2">
            {classIconUrl && !classIconError ? (
              <img
                src={classIconUrl}
                alt={unit.servantClass ?? 'Servant'}
                onError={() => setClassIconError(true)}
                className="h-7 w-7 object-contain opacity-95"
                draggable={false}
              />
            ) : (
              <span className="font-display text-xs font-bold text-[#C8A253]">???</span>
            )}
            <span className="mt-0.5 font-display text-[7.5px] font-bold tracking-wider text-[#E5C983]">
              {unit.servantClass ?? 'Servant'} ???
            </span>
          </div>
        ) : imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={unit.name}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover object-top"
            draggable={false}
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center ${faction.bg} text-white`}
          >
            <span className="font-display text-xs font-bold tracking-tight">
              {getInitials(unit.name)}
            </span>
          </div>
        )}

        {/* Slim HP Bar pinned cleanly to bottom edge */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[5px] bg-[#090B10]/90">
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

        {/* Compact numeric HP badge tucked into bottom-right corner */}
        <span className="pointer-events-none absolute right-0.5 bottom-[6px] rounded-[2px] bg-[#090B10]/85 px-1 py-px font-mono text-[8px] font-bold leading-none text-slate-100">
          {unit.hp}/{unit.maxHp}
        </span>
      </div>

      {/* Top-Left: Small Class Icon Badge */}
      {classIconUrl && !classIconError && (
        <div
          title={unit.subClass ? `${unit.servantClass} (${unit.subClass})` : unit.servantClass}
          className="absolute -top-1 -left-1 flex h-4 w-4 items-center justify-center rounded-full border border-[#C8A253]/70 bg-[#090B10] p-0.5"
        >
          <img
            src={classIconUrl}
            alt={unit.servantClass ?? 'Class'}
            onError={() => setClassIconError(true)}
            className="h-full w-full object-contain"
          />
        </div>
      )}

      {/* Top-Right: Subtle NP Ready / Reveal Indicator */}
      <div className="absolute -top-1 -right-1 flex items-center gap-0.5">
        {unit.npReady && (
          <span
            title="NP Ready"
            className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#090B10] bg-[#C8A253] text-[#090B10]"
          >
            <Sparkles className="h-2.5 w-2.5" />
          </span>
        )}
        {unit.isRevealedToEnemy && unit.unitType === 'servant' && (
          <span
            title="Revealed through Fog"
            className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#090B10] bg-sky-500 text-[#090B10]"
          >
            <Eye className="h-2.5 w-2.5" />
          </span>
        )}
      </div>

      {/* Hover Tactical Tooltip (hidden while dragging or inside DragOverlay) */}
      {!isDragging && !isOverlay && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 hidden w-48 -translate-x-1/2 rounded-[2px] border border-[#C8A253]/40 bg-[#111622] p-2 text-left text-[11px] text-slate-100 shadow-xl group-hover:block">
          {isIdentityHidden ? (
            <>
              <div className="font-display font-bold leading-tight text-[#E5C983]">
                {unit.servantClass ?? 'Servant'} ???
              </div>
              <div className="mt-0.5 text-[10px] font-medium text-amber-300/80">
                ยังไม่เปิดเผยนามแท้ (True Name Concealed)
              </div>
              <div className="mt-1.5 rounded-[2px] bg-[#090B10] px-2 py-1 text-center text-[10px] font-bold text-slate-200">
                HP {unit.hp}/{unit.maxHp}
              </div>
            </>
          ) : (
            <>
              <div className="font-display font-bold leading-tight text-[#E5C983]">
                {unit.name}
              </div>
              <div className="mt-0.5 text-[10px] font-medium text-slate-400">
                {unit.unitType === 'servant'
                  ? `${unit.servantClass}${unit.subClass ? ` • ${unit.subClass}` : ''}`
                  : 'Neutral PvE Monster'}
              </div>
              <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-[2px] bg-[#090B10] px-1.5 py-1 text-center text-[10px] font-bold text-slate-200">
                <span>ATK {unit.atk}</span>
                <span>MOV {unit.mov}</span>
                <span>RNG {unit.range ?? 1}</span>
              </div>
            </>
          )}
          {unit.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {unit.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-[2px] border border-[#C8A253]/30 bg-[#090B10] px-1 py-0.5 text-[9px] font-semibold text-[#C8A253]"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </button>
  );
}
