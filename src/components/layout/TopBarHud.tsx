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
    <header className="shrink-0 border-b border-slate-800 bg-slate-900 text-slate-200">
      {/* Main HUD Row */}
      <div className="flex h-14 items-center justify-between gap-2 px-3">
        {/* Left: Room + Turn + Phase + Role Preview */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-700 bg-slate-800 text-amber-500">
            <Flame className="h-4 w-4" />
          </div>

          <button
            type="button"
            onClick={handleCopyRoom}
            title="คลิกเพื่อคัดลอกรหัสห้อง"
            className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs font-bold text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            <span>{roomState.roomId}</span>
            {copied ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3 text-slate-500" />
            )}
          </button>

          <div className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs font-bold">
            <span className="text-slate-200">T{roomState.turn}</span>
            <span className="text-slate-600">|</span>
            <span className="uppercase tracking-wider text-amber-500/90">{roomState.phase}</span>
          </div>

          {/* Preview Role Switch */}
          <button
            type="button"
            onClick={() => setPreviewRole(isRulerView ? 'master_a' : 'ruler')}
            title="สลับมุมมองทดสอบ Ruler / Master (เช็ก Secret Grail Turn)"
            className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold transition ${
              isRulerView
                ? 'border-slate-600 bg-slate-800 text-amber-200/90'
                : 'border-rose-900/80 bg-rose-950/40 text-rose-300'
            }`}
          >
            {isRulerView ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            <span>{isRulerView ? 'Ruler View' : 'Master View'}</span>
          </button>
        </div>

        {/* Center: Team A | Grail Vessel 5/5 & Secret Turn | Team B */}
        <div className="flex items-center gap-2">
          {/* Team A (Mount Enzo - Muted Rose) */}
          <div className="flex items-center gap-2 rounded-lg border border-rose-800/70 bg-rose-950/25 px-2.5 py-1">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-extrabold text-rose-400">TEAM A</span>
                <span
                  className={`rounded px-1 py-px text-[9px] font-bold uppercase ${
                    team_a.readyLocked
                      ? 'border border-emerald-800 bg-emerald-950/60 text-emerald-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {team_a.readyLocked ? 'LOCKED' : 'Wait'}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] font-semibold text-slate-200">
                <span title="Mana" className="flex items-center gap-0.5 text-sky-300/90">
                  <Zap className="h-3 w-3" /> {team_a.mana}
                </span>
                <span title="QP" className="flex items-center gap-0.5 text-amber-200/90">
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
                        i < team_a.commandSpells ? 'bg-rose-600' : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </span>
                <span title="Wipeout Kills (6/6)" className="flex items-center gap-0.5 text-rose-300/90">
                  <Swords className="h-3 w-3" /> {team_a.defeatedCount}/6
                </span>
              </div>
            </div>
          </div>

          {/* Center Grail Vessel Progress Bar (Matte Gold, No Glow) */}
          <div className="flex flex-col items-center rounded-lg border border-slate-700 bg-slate-950/80 px-2.5 py-1">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-200/90">
                <Crown className="h-3 w-3 text-amber-500" />
                ภาชนะจอก: {roomState.grailAbsorbedCount}/5
              </span>
              <span
                title={
                  isRulerView
                    ? 'เทิร์นลับที่สุ่มไว้ (เห็นเฉพาะ Ruler)'
                    : 'เทิร์นจุติจอกถูกซ่อนไว้จาก Master (สุ่ม 10–12)'
                }
                className={`rounded px-1.5 py-px text-[9px] font-bold ${
                  isRulerView
                    ? 'border border-amber-700/60 bg-amber-950/50 text-amber-200'
                    : 'border border-slate-700 bg-slate-800 text-slate-400'
                }`}
              >
                {isRulerView
                  ? `Secret Grail: T${rulerSecret.secretGrailTurn}`
                  : 'จอกจุติ: เทิร์น ???'}
              </span>
            </div>

            {/* 5-segment Matte Grail Gauge */}
            <div className="mt-1 flex w-full items-center gap-1">
              {[0, 1, 2, 3, 4].map((idx) => {
                const filled = idx < roomState.grailAbsorbedCount;
                return (
                  <div
                    key={idx}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      filled ? 'bg-amber-600' : 'bg-slate-800'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Team B (Shinto City - Muted Sky) */}
          <div className="flex items-center gap-2 rounded-lg border border-sky-800/70 bg-sky-950/25 px-2.5 py-1">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-extrabold text-sky-400">TEAM B</span>
                <span
                  className={`rounded px-1 py-px text-[9px] font-bold uppercase ${
                    team_b.readyLocked
                      ? 'border border-emerald-800 bg-emerald-950/60 text-emerald-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {team_b.readyLocked ? 'LOCKED' : 'Wait'}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] font-semibold text-slate-200">
                <span title="Mana" className="flex items-center gap-0.5 text-sky-300/90">
                  <Zap className="h-3 w-3" /> {team_b.mana}
                </span>
                <span title="QP" className="flex items-center gap-0.5 text-amber-200/90">
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
                        i < team_b.commandSpells ? 'bg-sky-600' : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </span>
                <span title="Wipeout Kills (6/6)" className="flex items-center gap-0.5 text-sky-300/90">
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
            className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-[11px] font-bold text-amber-200/90 transition hover:border-amber-700 hover:bg-slate-700"
          >
            <Crown className="h-3.5 w-3.5 text-amber-500" />
            <span className="hidden xl:inline">+Soul</span>
          </button>
          <button
            type="button"
            onClick={() => setCatalogOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-amber-700 bg-amber-600 px-2.5 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-amber-500"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Catalog</span>
          </button>
          <button
            type="button"
            disabled
            title="พร้อมใช้งานใน Phase 4"
            className="flex cursor-not-allowed items-center gap-1 rounded-md border border-slate-800 bg-slate-800/50 px-2 py-1.5 text-xs font-semibold text-slate-500"
          >
            <Disc className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Wheel</span>
          </button>
          <button
            type="button"
            disabled
            title="พร้อมใช้งานใน Phase 4"
            className="flex cursor-not-allowed items-center gap-1 rounded-md border border-slate-800 bg-slate-800/50 px-2 py-1.5 text-xs font-semibold text-slate-500"
          >
            <Dices className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">1d6</span>
          </button>
          <button
            type="button"
            disabled
            title="พร้อมใช้งานใน Phase 4"
            className="flex cursor-not-allowed items-center gap-1 rounded-md border border-slate-800 bg-slate-800/50 px-2 py-1.5 text-xs font-semibold text-slate-500"
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
          className="flex h-7 items-center justify-center gap-2 border-t border-slate-800 bg-slate-950/60 px-3 text-xs text-slate-300"
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-500/90" />
          <span className="font-bold text-amber-400/90">Active Map Event:</span>
          <span className="font-semibold text-slate-200">{roomState.activeMapEvent.title}</span>
          <span className="hidden text-slate-400 md:inline">
            — {roomState.activeMapEvent.description}
          </span>
        </div>
      )}
    </header>
  );
}
