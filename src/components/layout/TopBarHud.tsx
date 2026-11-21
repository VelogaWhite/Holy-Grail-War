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
  LogOut,
  ScrollText,
  Sparkles,
  Swords,
  Zap,
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

export function TopBarHud() {
  const sessionMode = useGameStore((s) => s.sessionMode);
  const roomState = useGameStore((s) => s.roomState);
  const rulerSecret = useGameStore((s) => s.rulerSecret);
  const previewRole = useGameStore((s) => s.previewRole);
  const setPreviewRole = useGameStore((s) => s.setPreviewRole);
  const leaveRoom = useGameStore((s) => s.leaveRoom);
  const setCatalogOpen = useGameStore((s) => s.setCatalogOpen);
  const setWheelOpen = useGameStore((s) => s.setWheelOpen);
  const setDiceOpen = useGameStore((s) => s.setDiceOpen);
  const setLogsOpen = useGameStore((s) => s.setLogsOpen);
  const triggerSampleGrailBanner = useGameStore((s) => s.triggerSampleGrailBanner);
  const [copied, setCopied] = useState(false);
  const [grailIconErr, setGrailIconErr] = useState(false);

  const { team_a, team_b } = roomState.teams;
  const isRulerView = previewRole === 'ruler';

  const cycleSandboxRole = () => {
    if (sessionMode === 'online') return;
    if (previewRole === 'ruler') setPreviewRole('master_a');
    else if (previewRole === 'master_a') setPreviewRole('master_b');
    else setPreviewRole('ruler');
  };

  const roleLabel =
    previewRole === 'ruler'
      ? 'Ruler'
      : previewRole === 'master_a'
        ? 'Master A'
        : 'Master B';

  const handleCopyRoom = () => {
    navigator.clipboard?.writeText(roomState.roomId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <header className="shrink-0 border-b border-[#C8A253]/30 bg-[#111622] text-slate-100">
      {/* Main HUD Row */}
      <div className="flex h-14 items-center justify-between gap-2 px-3">
        {/* Left: Lobby + Room + Turn + Phase + Role */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={leaveRoom}
            title="กลับหน้า Lobby"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] border border-[#C8A253]/40 bg-[#090B10] text-slate-300 transition hover:border-[#C8A253] hover:text-[#E5C983]"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={handleCopyRoom}
            title="คลิกเพื่อคัดลอกรหัสห้อง"
            className="flex items-center gap-1 rounded-[2px] border border-[#C8A253]/25 bg-[#090B10] px-2 py-1 text-xs font-semibold text-slate-200 transition hover:border-[#C8A253]/60 hover:text-[#C8A253]"
          >
            <Flame className="h-3 w-3 text-[#B91C1C]" />
            <span className="font-display tracking-wider">{roomState.roomId}</span>
            {copied ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3 text-slate-500" />
            )}
          </button>

          <div className="flex items-center gap-1.5 rounded-[2px] border border-[#C8A253]/30 bg-[#090B10] px-2.5 py-1 text-xs font-bold">
            <span className="font-display text-slate-100">T{roomState.turn}</span>
            <span className="text-slate-600">|</span>
            <span className="font-display uppercase tracking-widest text-[#C8A253]">
              {roomState.phase}
            </span>
          </div>

          {/* Role Badge (clickable cycle in Local Sandbox; locked seat badge in Online mode) */}
          <button
            type="button"
            onClick={cycleSandboxRole}
            title={
              sessionMode === 'online'
                ? `ที่นั่งของคุณ: ${roleLabel} (Online Sync)`
                : 'คลิกเพื่อสลับมุมมองทดสอบ Ruler / Master A / Master B'
            }
            className={`flex items-center gap-1 rounded-[2px] border px-2 py-1 text-[10px] font-semibold transition ${
              isRulerView
                ? 'border-[#C8A253]/40 bg-[#090B10] text-[#C8A253]'
                : previewRole === 'master_a'
                  ? 'border-[#B91C1C]/70 bg-[#B91C1C]/20 text-red-200'
                  : 'border-sky-600/70 bg-sky-950/40 text-sky-200'
            } ${sessionMode === 'online' ? 'cursor-default' : 'cursor-pointer hover:opacity-90'}`}
          >
            {isRulerView ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            <span className="font-display tracking-wide">{roleLabel}</span>
          </button>
        </div>

        {/* Center: Team A | Grail Vessel 5/5 (with holy_grail.webp) | Team B */}
        <div className="flex items-center gap-2.5">
          {/* Team A (Crimson / Command Seal Red) */}
          <div className="flex items-center gap-2 rounded-[2px] border border-[#B91C1C]/70 bg-[#B91C1C]/12 px-2.5 py-1">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-[11px] font-bold tracking-wider text-red-400">
                  TEAM A
                </span>
                <span
                  className={`rounded-[2px] px-1 py-px text-[9px] font-bold uppercase ${
                    team_a.readyLocked
                      ? 'border border-emerald-700/80 bg-emerald-950/60 text-emerald-300'
                      : 'bg-slate-800/80 text-slate-400'
                  }`}
                >
                  {team_a.readyLocked ? 'LOCKED' : 'Wait'}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] font-semibold text-slate-200">
                <span title="Mana" className="flex items-center gap-0.5 text-sky-300">
                  <Zap className="h-3 w-3" /> {team_a.mana}
                </span>
                <span title="QP" className="flex items-center gap-0.5 text-[#C8A253]">
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
                      className={`inline-block h-2.5 w-1.5 rounded-[1px] ${
                        i < team_a.commandSpells ? 'bg-[#B91C1C]' : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </span>
                <span title="Wipeout Kills (6/6)" className="flex items-center gap-0.5 text-red-300">
                  <Swords className="h-3 w-3" /> {team_a.defeatedCount}/6
                </span>
              </div>
            </div>
          </div>

          {/* Center Grail Vessel Progress Bar with /assets/ui/holy_grail.webp */}
          <div className="clip-tactical-sm flex items-center gap-2.5 border border-[#C8A253]/40 bg-[#090B10] px-3 py-1">
            {!grailIconErr ? (
              <img
                src="/assets/ui/holy_grail.webp"
                alt="Holy Grail"
                onError={() => setGrailIconErr(true)}
                className="h-8 w-8 shrink-0 object-contain"
              />
            ) : (
              <Crown className="h-6 w-6 shrink-0 text-[#C8A253]" />
            )}

            <div className="flex flex-col">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-[11px] font-bold text-[#C8A253]">
                  ภาชนะจอก: {roomState.grailAbsorbedCount}/5
                </span>
                <span
                  title={
                    isRulerView
                      ? 'เทิร์นลับที่สุ่มไว้ (เห็นเฉพาะ Ruler)'
                      : 'เทิร์นจุติจอกถูกซ่อนไว้จาก Master (สุ่ม 10–12)'
                  }
                  className={`rounded-[2px] px-1.5 py-px text-[9px] font-bold ${
                    isRulerView
                      ? 'border border-[#C8A253]/40 bg-[#C8A253]/15 text-[#E5C983]'
                      : 'border border-slate-700 bg-slate-900 text-slate-400'
                  }`}
                >
                  {isRulerView
                    ? `Secret: T${rulerSecret.secretGrailTurn}`
                    : 'จอกจุติ: เทิร์น ???'}
                </span>
              </div>

              {/* 5-segment Grail Gauge */}
              <div className="mt-1 flex w-36 items-center gap-1">
                {[0, 1, 2, 3, 4].map((idx) => {
                  const filled = idx < roomState.grailAbsorbedCount;
                  return (
                    <div
                      key={idx}
                      className={`h-1.5 flex-1 rounded-[1px] transition-colors ${
                        filled ? 'bg-[#C8A253]' : 'bg-slate-800'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Team B (Shinto City - Tactical Sky Blue) */}
          <div className="flex items-center gap-2 rounded-[2px] border border-sky-600/60 bg-sky-950/25 px-2.5 py-1">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-[11px] font-bold tracking-wider text-sky-400">
                  TEAM B
                </span>
                <span
                  className={`rounded-[2px] px-1 py-px text-[9px] font-bold uppercase ${
                    team_b.readyLocked
                      ? 'border border-emerald-700/80 bg-emerald-950/60 text-emerald-300'
                      : 'bg-slate-800/80 text-slate-400'
                  }`}
                >
                  {team_b.readyLocked ? 'LOCKED' : 'Wait'}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] font-semibold text-slate-200">
                <span title="Mana" className="flex items-center gap-0.5 text-sky-300">
                  <Zap className="h-3 w-3" /> {team_b.mana}
                </span>
                <span title="QP" className="flex items-center gap-0.5 text-[#C8A253]">
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
                      className={`inline-block h-2.5 w-1.5 rounded-[1px] ${
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
            className="flex items-center gap-1 rounded-[2px] border border-[#C8A253]/35 bg-[#090B10] px-2 py-1.5 text-[11px] font-semibold text-[#C8A253] transition hover:border-[#C8A253]/70 hover:bg-[#C8A253]/10"
          >
            <Crown className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">+Soul</span>
          </button>
          <button
            type="button"
            onClick={() => setCatalogOpen(true)}
            className="flex items-center gap-1.5 rounded-[2px] border border-[#C8A253]/60 bg-[#B91C1C] px-2.5 py-1.5 text-xs font-bold text-slate-100 transition hover:bg-red-700"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="font-display tracking-wide">Catalog</span>
          </button>
          <button
            type="button"
            onClick={() => setWheelOpen(true)}
            title="เปิดวงล้อสุ่ม (Servant Draft / Map Event / Personal Event)"
            className="flex items-center gap-1 rounded-[2px] border border-[#C8A253]/35 bg-[#090B10] px-2 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-[#C8A253] hover:text-[#E5C983]"
          >
            <Disc className="h-3.5 w-3.5 text-[#C8A253]" />
            <span className="hidden xl:inline">Wheel</span>
          </button>
          <button
            type="button"
            onClick={() => setDiceOpen(true)}
            title="ทอยลูกเต๋า 1d6 ซิงก์ทั้ง 3 หน้าจอ"
            className="flex items-center gap-1 rounded-[2px] border border-[#C8A253]/35 bg-[#090B10] px-2 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-[#C8A253] hover:text-[#E5C983]"
          >
            <Dices className="h-3.5 w-3.5 text-[#C8A253]" />
            <span className="hidden xl:inline">1d6</span>
          </button>
          <button
            type="button"
            onClick={() => setLogsOpen(true)}
            title="เปิดประวัติการเล่น 50 รายการล่าสุด"
            className="flex items-center gap-1 rounded-[2px] border border-[#C8A253]/35 bg-[#090B10] px-2 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-[#C8A253] hover:text-[#E5C983]"
          >
            <ScrollText className="h-3.5 w-3.5 text-[#C8A253]" />
            <span className="hidden xl:inline">Logs</span>
          </button>
        </div>
      </div>

      {/* Compact Active Map Event Strip */}
      {roomState.activeMapEvent && (
        <div
          title={roomState.activeMapEvent.description}
          className="flex h-6 items-center justify-center gap-2 border-t border-[#C8A253]/20 bg-[#090B10] px-3 text-[11px] text-slate-300"
        >
          <Sparkles className="h-3 w-3 shrink-0 text-[#C8A253]" />
          <span className="font-display text-[10px] font-bold tracking-wider text-[#C8A253]">
            ACTIVE EVENT:
          </span>
          <span className="font-semibold text-slate-100">{roomState.activeMapEvent.title}</span>
          <span className="hidden text-slate-400 md:inline">
            — {roomState.activeMapEvent.description}
          </span>
        </div>
      )}
    </header>
  );
}
