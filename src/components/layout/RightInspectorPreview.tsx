import { useEffect, useState } from 'react';
import { Award, Flame, Heart, Move, Shield, Sparkles, Swords, Target } from 'lucide-react';
import { MONSTERS_BY_ID, SERVANTS_BY_ID } from '../../data';
import { useGameStore } from '../../store/useGameStore';
import {
  formatCoordLabel,
  getClassIconUrl,
  getFactionStyle,
  getInitials,
  resolveAssetUrl,
} from '../../utils/assetHelper';
import { TileInspector } from '../board/TileInspector';

export function RightInspectorPreview() {
  const units = useGameStore((s) => s.roomState.units);
  const selectedUnitId = useGameStore((s) => s.selectedUnitId);
  const [imgErr, setImgErr] = useState(false);

  const unit = selectedUnitId ? units[selectedUnitId] : null;

  useEffect(() => {
    setImgErr(false);
  }, [selectedUnitId]);

  const faction = unit ? getFactionStyle(unit.owner) : null;
  const imgUrl = unit ? resolveAssetUrl(unit.image) : null;
  const classIconUrl = unit ? getClassIconUrl(unit.servantClass, unit.subClass) : null;
  const servantTpl =
    unit && unit.unitType === 'servant' ? SERVANTS_BY_ID[unit.templateId] : null;
  const monsterTpl =
    unit && unit.unitType === 'monster' ? MONSTERS_BY_ID[unit.templateId] : null;

  return (
    <aside className="flex w-[320px] shrink-0 flex-col overflow-y-auto border-l border-[#C8A253]/25 bg-[#111622] p-3 text-slate-100">
      {/* Section 1: UNIT INSPECTOR */}
      <div className="mb-2 flex items-center justify-between border-b border-[#C8A253]/25 pb-1.5">
        <h2 className="font-display text-xs font-bold uppercase tracking-widest text-[#C8A253]">
          Unit Inspector
        </h2>
        {faction && (
          <span
            className={`rounded-[2px] px-2 py-0.5 font-display text-[10px] font-bold tracking-wider ${faction.badgeBg}`}
          >
            {faction.label}
          </span>
        )}
      </div>

      {!unit || !faction ? (
        <div className="flex flex-col items-center justify-center rounded-[2px] border border-dashed border-slate-700 bg-[#090B10]/60 py-6 text-center text-slate-400">
          <Target className="mb-1.5 h-6 w-6 text-slate-600" />
          <p className="text-xs font-bold text-slate-300">เลือกยูนิตบนกระดาน</p>
        </div>
      ) : (
        <div>
          {/* Header Card */}
          <div className="clip-tactical flex gap-2.5 border border-[#C8A253]/35 bg-[#090B10] p-2">
            <div
              className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-[2px] border-2 ${faction.border} bg-[#111622]`}
            >
              {imgUrl && !imgErr ? (
                <img
                  src={imgUrl}
                  alt={unit.name}
                  onError={() => setImgErr(true)}
                  className="h-full w-full object-cover object-top"
                />
              ) : (
                <div
                  className={`flex h-full w-full items-center justify-center font-display text-sm font-bold text-white ${faction.bg}`}
                >
                  {getInitials(unit.name)}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-display truncate text-sm font-bold tracking-wide text-[#E5C983]">
                {unit.name}
              </h3>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                {classIconUrl && (
                  <img
                    src={classIconUrl}
                    alt={unit.servantClass ?? ''}
                    className="h-3.5 w-3.5 rounded-full border border-[#C8A253]/40 bg-[#090B10] object-contain p-0.5"
                  />
                )}
                <span className="truncate">
                  {unit.unitType === 'servant'
                    ? `${unit.servantClass}${unit.subClass ? ` (${unit.subClass})` : ''}`
                    : `PvE Monster · T${monsterTpl?.tier ?? 1}`}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1 text-[9.5px] font-bold">
                <span className="rounded-[2px] border border-slate-700 bg-slate-900 px-1.5 py-px uppercase text-slate-200">
                  {unit.status}
                </span>
                {unit.position && (
                  <span className="rounded-[2px] border border-[#C8A253]/30 bg-[#111622] px-1.5 py-px font-display text-[#C8A253]">
                    {unit.position.zone.toUpperCase()}{' '}
                    {formatCoordLabel(unit.position.x, unit.position.y)}
                  </span>
                )}
                {unit.npReady && (
                  <span className="rounded-[2px] bg-[#B91C1C] px-1.5 py-px font-display tracking-wider text-slate-100">
                    NP READY
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stat Grid */}
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            <div className="rounded-[2px] border border-[#C8A253]/25 bg-[#090B10] py-1.5 text-center">
              <Heart className="mx-auto h-3 w-3 text-emerald-400" />
              <div className="mt-0.5 text-[11px] font-bold text-slate-100">
                {unit.hp}/{unit.maxHp}
              </div>
              <div className="font-display text-[8.5px] font-bold tracking-wider text-slate-500">
                HP
              </div>
            </div>
            <div className="rounded-[2px] border border-[#C8A253]/25 bg-[#090B10] py-1.5 text-center">
              <Swords className="mx-auto h-3 w-3 text-red-400" />
              <div className="mt-0.5 text-[11px] font-bold text-slate-100">{unit.atk}</div>
              <div className="font-display text-[8.5px] font-bold tracking-wider text-slate-500">
                ATK
              </div>
            </div>
            <div className="rounded-[2px] border border-[#C8A253]/25 bg-[#090B10] py-1.5 text-center">
              <Move className="mx-auto h-3 w-3 text-sky-400" />
              <div className="mt-0.5 text-[11px] font-bold text-slate-100">{unit.mov}</div>
              <div className="font-display text-[8.5px] font-bold tracking-wider text-slate-500">
                MOV
              </div>
            </div>
            <div className="rounded-[2px] border border-[#C8A253]/25 bg-[#090B10] py-1.5 text-center">
              <Target className="mx-auto h-3 w-3 text-[#C8A253]" />
              <div className="mt-0.5 text-[11px] font-bold text-slate-100">
                {unit.range ?? 1}
              </div>
              <div className="font-display text-[8.5px] font-bold tracking-wider text-slate-500">
                RNG
              </div>
            </div>
          </div>

          {/* Active Custom Tags */}
          {unit.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {unit.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-[2px] border border-[#C8A253]/35 bg-[#090B10] px-1.5 py-0.5 text-[10px] font-semibold text-[#E5C983]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Servant Skill & NP Details */}
          {servantTpl && (
            <div className="mt-2 space-y-2">
              <div className="rounded-[2px] border border-slate-800 bg-[#090B10] p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display flex items-center gap-1 text-[11px] font-bold tracking-wide text-sky-300">
                    <Sparkles className="h-3 w-3 shrink-0 text-sky-400" />
                    {servantTpl.skillName}
                  </span>
                  <span className="shrink-0 rounded-[2px] border border-sky-800/70 bg-sky-950/60 px-1.5 py-px text-[9.5px] font-bold text-sky-300">
                    {servantTpl.skillCost}M
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-snug text-slate-300">
                  {servantTpl.skillDesc}
                </p>
              </div>

              <div className="clip-tactical border border-[#C8A253]/45 bg-[#090B10] p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display flex items-center gap-1 text-[11px] font-bold tracking-wide text-[#E5C983]">
                    <Flame className="h-3 w-3 shrink-0 text-[#B91C1C]" />
                    {servantTpl.npName}
                  </span>
                  <span className="shrink-0 rounded-[2px] bg-[#B91C1C] px-1.5 py-px text-[9.5px] font-bold text-slate-100">
                    {servantTpl.npCost}M
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-snug text-slate-200">
                  {servantTpl.npDesc}
                </p>
              </div>
            </div>
          )}

          {/* Monster Reward Info */}
          {monsterTpl && (
            <div className="clip-tactical mt-2 border border-[#C8A253]/40 bg-[#090B10] p-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#E5C983]">
                <Award className="h-3.5 w-3.5 text-[#C8A253]" />
                <span>รางวัลเมื่อกำจัด (Tier {monsterTpl.tier})</span>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-slate-200">
                {monsterTpl.rewardNote}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Section 2: TILE INSPECTOR (Scene Banner + Layer 1 & Layer 2) */}
      <TileInspector />

      {/* Compact Phase Status Pill */}
      <div className="mt-3 flex items-center justify-between rounded-[2px] border border-[#C8A253]/20 bg-[#090B10]/80 px-2.5 py-1.5 text-[10px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <Shield className="h-3 w-3 text-[#C8A253]" />
          <strong className="text-slate-300">Phase 1</strong> · Fuyuki Night UI
        </span>
        <span className="text-slate-500">Phase 2: God-Mode</span>
      </div>
    </aside>
  );
}
