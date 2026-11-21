import { useState } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  Dices,
  Disc,
  Flame,
  ScrollText,
  Sparkles,
  Swords,
  Zap,
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

export function TopBarHud() {
  const roomState = useGameStore((s) => s.roomState);
  const setCatalogOpen = useGameStore((s) => s.setCatalogOpen);
  const [copied, setCopied] = useState(false);

  const { team_a, team_b } = roomState.teams;

  const handleCopyRoom = () => {
    navigator.clipboard?.writeText(roomState.roomId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <header className="shrink-0 border-b-2 border-slate-900 bg-white">
      {/* Main 56px HUD row */}
      <div className="flex h-14 items-center justify-between gap-3 px-3">
        {/* Left: Room + Turn + Phase */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-500 text-white">
              <Flame className="h-4 w-4" />
            </div>
            <button
              type="button"
              onClick={handleCopyRoom}
              title="คลิกเพื่อคัดลอกรหัสห้อง"
              className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-900 transition hover:border-orange-500 hover:bg-orange-50"
            >
              <span>Room: {roomState.roomId}</span>
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-slate-400" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5 rounded-md border border-slate-900 bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">
            <span>Turn {roomState.turn}</span>
            <span className="text-slate-400">|</span>
            <span className="uppercase tracking-wider text-orange-400">
              {roomState.phase}
            </span>
          </div>
        </div>

        {/* Center: Team A & Team B Summaries */}
        <div className="flex items-center gap-2.5">
          {/* Team A */}
          <div className="flex items-center gap-2.5 rounded-lg border-2 border-red-600 bg-red-50/70 px-3 py-1">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-red-700">TEAM A</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                    team_a.readyLocked
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {team_a.readyLocked ? 'LOCKED' : 'Waiting'}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] font-bold text-slate-900">
                <span title="Mana" className="flex items-center gap-0.5 text-blue-700">
                  <Zap className="h-3 w-3" /> {team_a.mana}
                </span>
                <span title="QP" className="flex items-center gap-0.5 text-amber-700">
                  <img
                    src="/assets/items/qp.webp"
                    alt="QP"
                    className="h-3.5 w-3.5 object-contain"
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
                        i < team_a.commandSpells ? 'bg-red-600' : 'bg-slate-300'
                      }`}
                    />
                  ))}
                </span>
                <span title="Kills" className="flex items-center gap-0.5 text-slate-700">
                  <Swords className="h-3 w-3 text-red-600" /> {team_a.defeatedCount}/4
                </span>
              </div>
            </div>
          </div>

          {/* Team B */}
          <div className="flex items-center gap-2.5 rounded-lg border-2 border-blue-600 bg-blue-50/70 px-3 py-1">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-blue-700">TEAM B</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                    team_b.readyLocked
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {team_b.readyLocked ? 'LOCKED' : 'Waiting'}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] font-bold text-slate-900">
                <span title="Mana" className="flex items-center gap-0.5 text-blue-700">
                  <Zap className="h-3 w-3" /> {team_b.mana}
                </span>
                <span title="QP" className="flex items-center gap-0.5 text-amber-700">
                  <img
                    src="/assets/items/qp.webp"
                    alt="QP"
                    className="h-3.5 w-3.5 object-contain"
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
                        i < team_b.commandSpells ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    />
                  ))}
                </span>
                <span title="Kills" className="flex items-center gap-0.5 text-slate-700">
                  <Swords className="h-3 w-3 text-blue-600" /> {team_b.defeatedCount}/4
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Shared Tool Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCatalogOpen(true)}
            className="flex items-center gap-1.5 rounded-md border-2 border-slate-900 bg-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-orange-600"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Catalog</span>
          </button>
          <button
            type="button"
            disabled
            title="พร้อมใช้งานใน Phase 4"
            className="flex cursor-not-allowed items-center gap-1 rounded-md border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-400"
          >
            <Disc className="h-3.5 w-3.5" />
            <span>Wheel</span>
          </button>
          <button
            type="button"
            disabled
            title="พร้อมใช้งานใน Phase 4"
            className="flex cursor-not-allowed items-center gap-1 rounded-md border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-400"
          >
            <Dices className="h-3.5 w-3.5" />
            <span>Dice 1d6</span>
          </button>
          <button
            type="button"
            disabled
            title="พร้อมใช้งานใน Phase 4"
            className="flex cursor-not-allowed items-center gap-1 rounded-md border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-400"
          >
            <ScrollText className="h-3.5 w-3.5" />
            <span>Logs</span>
          </button>
        </div>
      </div>

      {/* Compact Active Map Event Bar */}
      {roomState.activeMapEvent && (
        <div
          title={roomState.activeMapEvent.description}
          className="flex h-7 items-center justify-center gap-2 border-t border-slate-200 bg-orange-50 px-3 text-xs text-slate-900"
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-orange-600" />
          <span className="font-bold text-orange-700">Active Map Event:</span>
          <span className="font-semibold">{roomState.activeMapEvent.title}</span>
          <span className="hidden text-slate-600 md:inline">
            — {roomState.activeMapEvent.description}
          </span>
        </div>
      )}
    </header>
  );
}
