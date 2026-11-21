import { useState } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  Crown,
  Dices,
  Disc,
  Eye,
  EyeOff,
  Flame,
  ScrollText,
  Sparkles,
  Swords,
  Zap,
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

export function TopBarHud() {
  const roomState = useGameStore((s) => s.roomState);
  const rulerSecret = useGameStore((s) => s.rulerSecret);
  const previewRole = useGameStore((s) => s.previewRole);
  const setPreviewRole = useGameStore((s) => s.setPreviewRole);
  const setCatalogOpen = useGameStore((s) => s.setCatalogOpen);
  const triggerSampleGrailBanner = useGameStore((s) => s.triggerSampleGrailBanner);
  const [copied, setCopied] = useState(false);

  const { team_a, team_b } = roomState.teams;
  const isRulerView = previewRole === 'ruler';

  const handleCopyRoom = () => {
    navigator.clipboard?.writeText(roomState.roomId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <header className="shrink-0 border-b border-slate-700/80 bg-slate-900 text-slate-100">
      {/* Main HUD Row */}
      <div className="flex h-14 items-center justify-between gap-2 px-3">
        {/* Left: Room + Turn + Phase + Role Preview */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-amber-400/60 bg-amber-400/15 text-amber-400">
            <Flame className="h-4 w-4" />
          </div>

          <button
            type="button"
            onClick={handleCopyRoom}
            title="คลิกเพื่อคัดลอกรหัสห้อง"
            className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs font-bold text-slate-100 transition hover:border-amber-400 hover:text-amber-300"
          >
            <span>{roomState.roomId}</span>
            {copied ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3 text-slate-400" />
            )}
          </button>

          <div className="flex items-center gap-1.5 rounded-md border border-amber-400/40 bg-slate-950 px-2 py-1 text-xs font-bold">
            <span className="text-slate-200">T{roomState.turn}</span>
            <span className="text-slate-600">|</span>
            <span className="uppercase tracking-wider text-amber-400">{roomState.phase}</span>
          </div>

          {/* Preview Role Switch (Ruler vs Master for testing Secret Turn) */}
          <button
            type="button"
            onClick={() => setPreviewRole(isRulerView ? 'master_a' : 'ruler')}
            title="สลับมุมมองทดสอบ Ruler / Master (เช็ก Secret Grail Turn)"
            className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-extrabold transition ${
              isRulerView
                ? 'border-amber-400/70 bg-amber-400/15 text-amber-300'
                : 'border-rose-500/60 bg-rose-500/15 text-rose-300'
            }`}
          >
            {isRulerView ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            <span>{isRulerView ? 'Ruler View' : 'Master View'}</span>
          </button>
        </div>

        {/* Center: Team A | Grail Vessel 5/5 & Secret Turn | Team B */}
        <div className="flex items-center gap-2">
          {/* Team A (Mount Enzo - Rose) */}
          <div className="flex items-center gap-2 rounded-lg border border-rose-500/80 bg-rose-950/35 px-2.5 py-1">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black text-rose-400">TEAM A</span>
                <span
                  className={`rounded px-1 py-px text-[9px] font-bold uppercase ${
                    team_a.readyLocked
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {team_a.readyLocked ? 'LOCKED' : 'Wait'}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] font-bold text-slate-100">
                <span title="Mana" className="flex items-center gap-0.5 text-cyan-300">
                  <Zap className="h-3 w-3" /> {team_a.mana}
                </span>
                <span title="QP" className="flex items-center gap-0.5 text-amber-300">
                  <img
                    src="/assets/items/qp.webp"
                    alt="QP"
                    className="h-3 w-3 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  {team_a.qp}
                </span>
                <span title="Command Spells" className="flex items-center gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className={`inline-block h-2.5 w-1.5 rounded-xs ${
                        i < team_a.commandSpells ? 'bg-rose-500' : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </span>
                <span title="Wipeout Kills (6/6)" className="flex items-center gap-0.5 text-rose-300">
                  <Swords className="h-3 w-3" /> {team_a.defeatedCount}/6
                </span>
              </div>
            </div>
          </div>

          {/* Center Grail Vessel Progress Bar (X/5) + Secret Grail Turn */}
          <div className="flex flex-col items-center rounded-lg border border-amber-400/60 bg-slate-950 px-2.5 py-1 shadow-inner">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] font-black text-amber-300">
                <Crown className="h-3 w-3 text-amber-400" />
                ภาชนะจอก: {roomState.grailAbsorbedCount}/5
              </span>
              <span
                title={
                  isRulerView
                    ? 'เทิร์นลับที่สุ่มไว้ (เห็นเฉพาะ Ruler)'
                    : 'เทิร์นจุติจอกถูกซ่อนไว้จาก Master (สุ่ม 10–12)'
                }
                className={`rounded px-1.5 py-px text-[9px] font-black ${
                  isRulerView
                    ? 'border border-amber-400/60 bg-amber-400/20 text-amber-300'
                    : 'border border-slate-700 bg-slate-800 text-slate-400'
                }`}
              >
                {isRulerView
                  ? `Secret Grail: T${rulerSecret.secretGrailTurn}`
                  : 'จอกจุติ: เทิร์น ???'}
              </span>
            </div>

            {/* 5-segment Grail Vessel Gauge */}
            <div className="mt-1 flex w-full items-center gap-1">
              {[0, 1, 2, 3, 4].map((idx) => {
                const filled = idx < roomState.grailAbsorbedCount;
                return (
                  <div
                    key={idx}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      filled
                        ? 'bg-gradient-to-r from-amber-500 to-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.7)]'
                        : 'bg-slate-800'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Team B (Shinto City - Sky) */}
          <div className="flex items-center gap-2 rounded-lg border border-sky-500/80 bg-sky-950/35 px-2.5 py-1">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black text-sky-400">TEAM B</span>
                <span
                  className={`rounded px-1 py-px text-[9px] font-bold uppercase ${
                    team_b.readyLocked
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {team_b.readyLocked ? 'LOCKED' : 'Wait'}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] font-bold text-slate-100">
                <span title="Mana" className="flex items-center gap-0.5 text-cyan-300">
                  <Zap className="h-3 w-3" /> {team_b.mana}
                </span>
                <span title="QP" className="flex items-center gap-0.5 text-amber-300">
                  <img
                    src="/assets/items/qp.webp"
                    alt="QP"
                    className="h-3 w-3 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  {team_b.qp}
                </span>
                <span title="Command Spells" className="flex items-center gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className={`inline-block h-2.5 w-1.5 rounded-xs ${
                        i < team_b.commandSpells ? 'bg-sky-500' : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </span>
                <span title="Wipeout Kills (6/6)" className="flex items-center gap-0.5 text-sky-300">
                  <Swords className="h-3 w-3" /> {team_b.defeatedCount}/6
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Shared Tool Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => triggerSampleGrailBanner(false)}
            title="ทดสอบแบนเนอร์จอกกลืนกินวิญญาณ (+1/5)"
            className="flex items-center gap-1 rounded-md border border-amber-400/50 bg-slate-950 px-2 py-1.5 text-[11px] font-bold text-amber-300 transition hover:bg-amber-400/15"
          >
            <Crown className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">+Soul</span>
          </button>
          <button
            type="button"
            onClick={() => setCatalogOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-400 px-2.5 py-1.5 text-xs font-black text-slate-950 shadow-xs transition hover:bg-amber-300"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Catalog</span>
          </button>
          <button
            type="button"
            disabled
            title="พร้อมใช้งานใน Phase 4"
            className="flex cursor-not-allowed items-center gap-1 rounded-md border border-slate-700 bg-slate-800/70 px-2 py-1.5 text-xs font-semibold text-slate-500"
          >
            <Disc className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Wheel</span>
          </button>
          <button
            type="button"
            disabled
            title="พร้อมใช้งานใน Phase 4"
            className="flex cursor-not-allowed items-center gap-1 rounded-md border border-slate-700 bg-slate-800/70 px-2 py-1.5 text-xs font-semibold text-slate-500"
          >
            <Dices className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">1d6</span>
          </button>
          <button
            type="button"
            disabled
            title="พร้อมใช้งานใน Phase 4"
            className="flex cursor-not-allowed items-center gap-1 rounded-md border border-slate-700 bg-slate-800/70 px-2 py-1.5 text-xs font-semibold text-slate-500"
          >
            <ScrollText className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Logs</span>
          </button>
        </div>
      </div>

      {/* Compact Active Map Event Strip */}
      {roomState.activeMapEvent && (
        <div
          title={roomState.activeMapEvent.description}
          className="flex h-7 items-center justify-center gap-2 border-t border-amber-500/25 bg-amber-950/40 px-3 text-xs text-amber-100"
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-400" />
          <span className="font-black text-amber-400">Active Map Event:</span>
          <span className="font-bold">{roomState.activeMapEvent.title}</span>
          <span className="hidden text-slate-300 md:inline">
            — {roomState.activeMapEvent.description}
          </span>
        </div>
      )}
    </header>
  );
}
