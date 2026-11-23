import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import type { ChatMessage } from '../../types/game';

interface RoomChatBoxProps {
  className?: string;
  showHeader?: boolean;
}

function getRoleStyle(role: ChatMessage['senderRole']): {
  label: string;
  badgeClass: string;
  nameClass: string;
} {
  switch (role) {
    case 'ruler':
      return {
        label: 'Ruler',
        badgeClass: 'border-[#C8A253]/50 bg-[#C8A253]/15 text-[#E5C983]',
        nameClass: 'text-[#E5C983]',
      };
    case 'master_a':
      return {
        label: 'Master A',
        badgeClass: 'border-rose-500/50 bg-rose-500/15 text-rose-300',
        nameClass: 'text-rose-400',
      };
    case 'master_b':
      return {
        label: 'Master B',
        badgeClass: 'border-sky-500/50 bg-sky-500/15 text-sky-300',
        nameClass: 'text-sky-400',
      };
    default:
      return {
        label: 'Waiting',
        badgeClass: 'border-slate-700 bg-slate-800/80 text-slate-400',
        nameClass: 'text-slate-300',
      };
  }
}

export function RoomChatBox({
  className = '',
  showHeader = false,
}: RoomChatBoxProps) {
  const messages = useGameStore((s) => s.chatMessages);
  const authUid = useGameStore((s) => s.authUid);
  const sessionMode = useGameStore((s) => s.sessionMode);
  const previewRole = useGameStore((s) => s.previewRole);
  const sendRoomChatMessage = useGameStore((s) => s.sendRoomChatMessage);

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const myUid =
    sessionMode === 'online' ? authUid : `local-${previewRole}`;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError(null);
    setDraft('');
    try {
      await sendRoomChatMessage(trimmed);
    } catch (err: unknown) {
      setDraft(trimmed);
      setError(
        err instanceof Error ? err.message : 'ส่งข้อความไม่สำเร็จ'
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={`flex min-h-0 flex-col bg-[#090B10] text-slate-100 ${className}`}
    >
      {showHeader && (
        <div className="flex shrink-0 items-center justify-between border-b border-[#C8A253]/25 bg-[#111622] px-3 py-2">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-[#C8A253]" />
            <span className="font-display text-xs font-bold tracking-wider text-[#E5C983]">
              ROOM CHAT
            </span>
          </div>
          <span className="text-[10px] text-slate-500">
            {messages.length}/50
          </span>
        </div>
      )}

      {/* Messages List */}
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="mb-2 h-6 w-6 text-slate-700" />
            <p className="text-xs text-slate-500">
              ยังไม่มีข้อความในห้อง — เริ่มทักทายได้เลย!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const style = getRoleStyle(msg.senderRole);
            const isMine = Boolean(myUid && msg.senderUid === myUid);

            return (
              <div
                key={msg.id}
                className={`rounded-[2px] border px-2.5 py-2 text-xs ${
                  isMine
                    ? 'border-[#C8A253]/30 bg-[#111622]'
                    : 'border-slate-800/90 bg-[#0D111A]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span
                      className={`shrink-0 rounded-[2px] border px-1.5 py-px font-display text-[9px] font-bold uppercase tracking-wider ${style.badgeClass}`}
                    >
                      {style.label}
                    </span>
                    <span
                      className={`truncate text-[11px] font-bold ${style.nameClass}`}
                    >
                      {msg.senderName}
                      {isMine ? ' (คุณ)' : ''}
                    </span>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-slate-500">
                    {new Date(msg.timestamp).toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="mt-1 break-words whitespace-pre-wrap leading-relaxed text-slate-200">
                  {msg.text}
                </p>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="shrink-0 border-t border-red-900/60 bg-red-950/40 px-3 py-1.5 text-[11px] text-red-300">
          {error}
        </div>
      )}

      {/* Input Row */}
      <form
        onSubmit={handleSubmit}
        className="flex shrink-0 items-center gap-1.5 border-t border-[#C8A253]/25 bg-[#111622] p-2.5"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={300}
          placeholder="พิมพ์ข้อความ... (กด Enter เพื่อส่ง)"
          className="min-w-0 flex-1 rounded-[2px] border border-slate-700 bg-[#090B10] px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-[#C8A253] focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          title="ส่งข้อความ"
          className="flex h-8 shrink-0 items-center gap-1 rounded-[2px] border border-[#C8A253]/60 bg-[#C8A253] px-3 text-xs font-bold text-[#090B10] transition hover:bg-[#E5C983] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
          <span>ส่ง</span>
        </button>
      </form>
    </div>
  );
}
