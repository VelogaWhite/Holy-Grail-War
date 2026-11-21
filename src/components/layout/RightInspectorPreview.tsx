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

export function RightInspectorPreview() {
  const units = useGameStore((s) => s.roomState.units);
  const selectedUnitId = useGameStore((s) => s.selectedUnitId);
  const [imgErr, setImgErr] = useState(false);

  const unit = selectedUnitId ? units[selectedUnitId] : null;

  useEffect(() => {
    setImgErr(false);
  }, [selectedUnitId]);

  if (!unit) {
    return (
      <aside className="flex w-[320px] shrink-0 flex-col items-center justify-center border-l border-slate-700/80 bg-slate-900 p-6 text-center text-slate-400">
        <Target className="mb-2 h-8 w-8 text-slate-600" />
        <p className="text-sm font-bold text-slate-200">เลือกยูนิตบนกระดาน</p>
        <p className="mt-1 text-xs text-slate-400">
          คลิกที่ตัวหมากบนกระดานหรือรายชื่อฝั่งซ้ายเพื่อดูสเตตัส สกิล และ Noble Phantasm
        </p>
      </aside>
    );
  }

  const faction = getFactionStyle(unit.owner);
  const imgUrl = resolveAssetUrl(unit.image);
  const classIconUrl = getClassIconUrl(unit.servantClass, unit.subClass);
  const servantTpl = unit.unitType === 'servant' ? SERVANTS_BY_ID[unit.templateId] : null;
  const monsterTpl = unit.unitType === 'monster' ? MONSTERS_BY_ID[unit.templateId] : null;

  return (
    <aside className="flex w-[320px] shrink-0 flex-col overflow-y-auto border-l border-slate-700/80 bg-slate-900 p-3 text-slate-100">
      <div className="mb-2.5 flex items-center justify-between border-b border-slate-800 pb-1.5">
        <h2 className="text-xs font-black uppercase tracking-wider text-amber-400">
          Unit Inspector
        </h2>
        <span className={`rounded px-2 py-0.5 text-[10px] font-extrabold ${faction.badgeBg}`}>
          {faction.label}
        </span>
      </div>

      {/* Header Card */}
      <div className="flex gap-3 rounded-lg border border-slate-700 bg-slate-950/80 p-2.5">
        <div
          className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${faction.border} bg-slate-900`}
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
              className={`flex h-full w-full items-center justify-center text-base font-black text-white ${faction.bg}`}
            >
              {getInitials(unit.name)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-black text-slate-100">{unit.name}</h3>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-400">
            {classIconUrl && (
              <img
                src={classIconUrl}
                alt={unit.servantClass ?? ''}
                className="h-4 w-4 rounded-full border border-amber-400/40 bg-slate-950 object-contain p-0.5"
              />
            )}
            <span>
              {unit.unitType === 'servant'
                ? `${unit.servantClass}${unit.subClass ? ` (${unit.subClass})` : ''}`
                : `PvE Monster • Tier ${monsterTpl?.tier ?? 1}`}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
            <span className="rounded bg-slate-800 px-1.5 py-0.5 uppercase text-slate-200">
              {unit.status}
            </span>
            {unit.position && (
              <span className="rounded border border-cyan-400/40 bg-cyan-950/60 px-1.5 py-0.5 text-cyan-300">
                {unit.position.zone.toUpperCase()} {formatCoordLabel(unit.position.x, unit.position.y)}
              </span>
            )}
            {unit.npReady && (
              <span className="rounded bg-amber-400 px-1.5 py-0.5 font-black text-slate-950">
                NP READY
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stat Grid */}
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        <div className="rounded-lg border border-slate-700/80 bg-slate-950/70 p-2 text-center">
          <Heart className="mx-auto h-3.5 w-3.5 text-emerald-400" />
          <div className="mt-0.5 text-xs font-black text-slate-100">
            {unit.hp}/{unit.maxHp}
          </div>
          <div className="text-[9px] font-bold text-slate-400">HP</div>
        </div>
        <div className="rounded-lg border border-slate-700/80 bg-slate-950/70 p-2 text-center">
          <Swords className="mx-auto h-3.5 w-3.5 text-rose-400" />
          <div className="mt-0.5 text-xs font-black text-slate-100">{unit.atk}</div>
          <div className="text-[9px] font-bold text-slate-400">ATK</div>
        </div>
        <div className="rounded-lg border border-slate-700/80 bg-slate-950/70 p-2 text-center">
          <Move className="mx-auto h-3.5 w-3.5 text-sky-400" />
          <div className="mt-0.5 text-xs font-black text-slate-100">{unit.mov}</div>
          <div className="text-[9px] font-bold text-slate-400">MOV</div>
        </div>
        <div className="rounded-lg border border-slate-700/80 bg-slate-950/70 p-2 text-center">
          <Target className="mx-auto h-3.5 w-3.5 text-amber-400" />
          <div className="mt-0.5 text-xs font-black text-slate-100">{unit.range ?? 1}</div>
          <div className="text-[9px] font-bold text-slate-400">RNG</div>
        </div>
      </div>

      {/* Active Custom Tags */}
      <div className="mt-3">
        <div className="mb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          Status / Buff Tags
        </div>
        {unit.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {unit.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-amber-400/50 bg-amber-400/15 px-2 py-0.5 text-[11px] font-bold text-amber-300"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs italic text-slate-500">ไม่มีสถานะเพิ่มเติม</p>
        )}
      </div>

      {/* Servant Skill & NP Details */}
      {servantTpl && (
        <div className="mt-3 space-y-2.5">
          <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 text-xs font-extrabold text-cyan-300">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                {servantTpl.skillName}
              </span>
              <span className="shrink-0 rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">
                {servantTpl.skillCost} Mana
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              {servantTpl.skillDesc}
            </p>
          </div>

          <div className="rounded-lg border border-amber-400/60 bg-amber-950/30 p-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 text-xs font-black text-amber-300">
                <Flame className="h-3.5 w-3.5 text-amber-400" />
                NP: {servantTpl.npName}
              </span>
              <span className="shrink-0 rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-black text-slate-950">
                {servantTpl.npCost} Mana
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-amber-100/90">
              {servantTpl.npDesc}
            </p>
          </div>
        </div>
      )}

      {/* Monster Reward Info */}
      {monsterTpl && (
        <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-950/25 p-2.5">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-300">
            <Award className="h-4 w-4 text-amber-400" />
            <span>รางวัลเมื่อกำจัด (Tier {monsterTpl.tier})</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-200">
            {monsterTpl.rewardNote}
          </p>
          <p className="mt-1.5 text-[11px] font-semibold text-slate-400">
            * มอนสเตอร์ PvE ยืนประจำช่องและโจมตีสวนกลับเฉพาะเมื่อโดนตีแต่ยังไม่ตาย
          </p>
        </div>
      )}

      {/* Phase 1 Footer Hint */}
      <div className="mt-auto pt-4">
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-700 bg-slate-950/60 p-2 text-[11px] text-slate-400">
          <Shield className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            <strong className="text-slate-200">Phase 1 Upgraded:</strong> ระบบ Drag & Drop,
            Weighted BFS (2 MOV / โบนัสถนน), แก้สเตตัสสด และ Undo จะเปิดใน Phase 2
          </span>
        </div>
      </div>
    </aside>
  );
}
