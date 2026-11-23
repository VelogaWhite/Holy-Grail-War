import { useMemo, useState } from 'react';
import { MessageSquare, ScrollText, X } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import type { GameLogEntry } from '../../types/game';
import { RoomChatBox } from './RoomChatBox';

type LogFilter = 'all' | 'combat' | 'events';

export function GameLogDrawer() {
  const isOpen = useGameStore((s) => s.isLogsOpen);
  const setLogsOpen = useGameStore((s) => s.setLogsOpen);
  const logsDrawerTab = useGameStore((s) => s.logsDrawerTab);
  const setLogsDrawerTab = useGameStore((s) => s.setLogsDrawerTab);
  const unreadChatCount = useGameStore((s) => s.unreadChatCount);
  const chatCount = useGameStore((s) => s.chatMessages.length);
  const logs = useGameStore((s) => s.roomState.logs);
  const [filter, setFilter] = useState<LogFilter>('all');

  const groupedByTurn = useMemo(() => {
    const filtered = logs.filter((entry) => {
      if (filter === 'all') return true;
      const msg = entry.message.toLowerCase();
      if (filter === 'combat') {
        return (
          msg.includes('1d6') ||
          msg.includes('🎲') ||
          msg.includes('กลืนกิน') ||
          msg.includes('hp') ||
          msg.includes('ลบยูนิต')
        );
      }
      return (
        msg.includes('event') ||
        msg.includes('grail') ||
        msg.includes('จอก') ||
        msg.includes('draft') ||
        msg.includes('เทิร์น') ||
        msg.includes('stray')
      );
    });

    const groups = new Map<number, GameLogEntry[]>();
    for (const entry of filtered) {
      const arr = groups.get(entry.turn) ?? [];
      arr.push(entry);
      groups.set(entry.turn, arr);
    }
    return Array.from(groups.entries()).sort((a, b) => b[0] - a[0]);
  }, [logs, filter]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#090B10]/60"
      onClick={() => setLogsOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="War Chronicle & Room Chat"
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col border-l border-[#C8A253]/40 bg-[#111622] text-slate-100 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#C8A253]/25 bg-[#090B10] px-4 py-3">
          <div className="flex items-center gap-2">
            {logsDrawerTab === 'logs' ? (
              <ScrollText className="h-4 w-4 text-[#C8A253]" />
            ) : (
              <MessageSquare className="h-4 w-4 text-[#C8A253]" />
            )}
            <h2 className="font-display text-sm font-bold tracking-widest text-[#E5C983]">
              {logsDrawerTab === 'logs'
                ? `WAR CHRONICLE (${logs.length}/50)`
                : `ROOM CHAT (${chatCount}/50)`}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setLogsOpen(false)}
            className="rounded-[2px] border border-slate-700 bg-[#111622] p-1 text-slate-400 hover:border-[#C8A253] hover:text-[#E5C983]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Main Tab Switcher: Game Logs | Room Chat */}
        <div className="grid shrink-0 grid-cols-2 border-b border-[#C8A253]/25 bg-[#090B10]">
          <button
            type="button"
            onClick={() => setLogsDrawerTab('logs')}
            className={`flex items-center justify-center gap-1.5 border-b-2 py-2.5 font-display text-xs font-bold tracking-wider transition ${
              logsDrawerTab === 'logs'
                ? 'border-[#C8A253] bg-[#111622] text-[#E5C983]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ScrollText className="h-3.5 w-3.5" />
            <span>Game Logs</span>
          </button>
          <button
            type="button"
            onClick={() => setLogsDrawerTab('chat')}
            className={`flex items-center justify-center gap-1.5 border-b-2 py-2.5 font-display text-xs font-bold tracking-wider transition ${
              logsDrawerTab === 'chat'
                ? 'border-[#C8A253] bg-[#111622] text-[#E5C983]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Room Chat</span>
            {unreadChatCount > 0 && (
              <span className="rounded-full bg-rose-500 px-1.5 py-px font-mono text-[10px] font-bold text-white">
                {unreadChatCount > 99 ? '99+' : unreadChatCount}
              </span>
            )}
          </button>
        </div>

        {logsDrawerTab === 'chat' ? (
          <RoomChatBox className="flex-1" />
        ) : (
          <>
            {/* Filters */}
            <div className="grid shrink-0 grid-cols-3 gap-1 border-b border-slate-800 bg-[#090B10] p-2">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'combat', label: 'Combat / Dice' },
                  { id: 'events', label: 'Events / Grail' },
                ] as { id: LogFilter; label: string }[]
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`rounded-[2px] py-1 text-[11px] font-bold transition ${
                    filter === f.id
                      ? 'bg-[#B91C1C] text-slate-100'
                      : 'bg-[#111622] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Log Entries */}
            <div className="flex-1 space-y-4 overflow-y-auto p-3.5">
              {groupedByTurn.length === 0 ? (
                <p className="py-10 text-center text-xs text-slate-500">
                  ยังไม่มีบันทึกเหตุการณ์ในหมวดนี้
                </p>
              ) : (
                groupedByTurn.map(([turn, entries]) => (
                  <div key={turn}>
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="font-display rounded-[2px] border border-[#C8A253]/35 bg-[#090B10] px-2 py-0.5 text-[10px] font-bold tracking-widest text-[#C8A253]">
                        TURN {turn}
                      </span>
                      <div className="h-px flex-1 bg-slate-800" />
                    </div>
                    <div className="space-y-1.5">
                      {entries.map((entry) => (
                        <div
                          key={entry.id}
                          className="rounded-[2px] border border-slate-800/80 bg-[#090B10]/80 px-2.5 py-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span className="font-display font-bold uppercase text-[#C8A253]/80">
                              {entry.actor}
                            </span>
                            <span>
                              {new Date(entry.timestamp).toLocaleTimeString('th-TH', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="mt-0.5 leading-snug text-slate-200">
                            {entry.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
