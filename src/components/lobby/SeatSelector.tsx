import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  Check,
  Copy,
  Crown,
  Flame,
  LogOut,
  Shield,
  Swords,
  UserMinus,
  Users,
  UserX,
} from 'lucide-react';
import {
  getParticipantRole,
  isRoomGameStarted,
  useGameStore,
} from '../../store/useGameStore';
import type { RoomParticipant } from '../../types/game';
import { RoomChatBox } from '../modals/RoomChatBox';

export function WaitingLobbyView() {
  const roomState = useGameStore((s) => s.roomState);
  const authUid = useGameStore((s) => s.authUid);
  const assignSeat = useGameStore((s) => s.assignSeat);
  const swapMasterSeatsAction = useGameStore((s) => s.swapMasterSeatsAction);
  const kickParticipantAction = useGameStore((s) => s.kickParticipantAction);
  const startGameAction = useGameStore((s) => s.startGameAction);
  const leaveRoomAndCleanup = useGameStore((s) => s.leaveRoomAndCleanup);

  const [copied, setCopied] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const myRole = getParticipantRole(roomState.seats, authUid);
  const isRuler = myRole === 'ruler';
  const gameAlreadyStarted = isRoomGameStarted(roomState);

  const participantList = useMemo(() => {
    const map: Record<string, RoomParticipant> = {
      ...(roomState.participants ?? {}),
    };

    // Ensure any seated UID from legacy rooms is still visible
    const ensureSeatEntry = (uid: string | null, fallback: string) => {
      if (uid && !map[uid]) {
        map[uid] = { uid, name: fallback, joinedAt: 0 };
      }
    };
    ensureSeatEntry(roomState.seats.rulerUid, 'Ruler');
    ensureSeatEntry(roomState.seats.masterAUid, 'Master A');
    ensureSeatEntry(roomState.seats.masterBUid, 'Master B');

    const roleRank = (uid: string): number => {
      if (uid === roomState.seats.rulerUid) return 0;
      if (uid === roomState.seats.masterAUid) return 1;
      if (uid === roomState.seats.masterBUid) return 2;
      return 3;
    };

    return Object.values(map).sort((a, b) => {
      const diff = roleRank(a.uid) - roleRank(b.uid);
      if (diff !== 0) return diff;
      return a.joinedAt - b.joinedAt;
    });
  }, [roomState.participants, roomState.seats]);

  const masterAName = roomState.seats.masterAUid
    ? roomState.participants?.[roomState.seats.masterAUid]?.name ?? 'Master A'
    : null;
  const masterBName = roomState.seats.masterBUid
    ? roomState.participants?.[roomState.seats.masterBUid]?.name ?? 'Master B'
    : null;

  const missingMasters = !roomState.seats.masterAUid || !roomState.seats.masterBUid;

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(roomState.roomId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const runAction = async (key: string, fn: () => Promise<void>) => {
    setBusyAction(key);
    setActionError(null);
    try {
      await fn();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'ดำเนินการไม่สำเร็จ');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#090B10] text-slate-100">
      {/* Top Bar */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#C8A253]/30 bg-[#111622] px-5 py-3">
        <div className="flex items-center gap-3">
          <img
            src="/assets/ui/holy_grail.webp"
            alt="Holy Grail"
            className="h-9 w-9 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg font-bold tracking-widest text-[#E5C983]">
                WAITING LOBBY
              </h1>
              <span className="rounded-[2px] border border-[#C8A253]/40 bg-[#C8A253]/15 px-2 py-0.5 font-display text-[10px] font-bold tracking-wider text-[#E5C983]">
                {roomState.phase.toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Fate: Holy Grail War · ห้องรอเตรียมความพร้อมก่อนเข้าสู่สมรภูมิ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Room Code Copy Pill */}
          <button
            type="button"
            onClick={handleCopyCode}
            title="คลิกเพื่อคัดลอกรหัสห้องส่งให้เพื่อน"
            className="flex items-center gap-2 rounded-[2px] border border-[#C8A253]/60 bg-[#090B10] px-3 py-1.5 transition hover:border-[#E5C983]"
          >
            <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Room Code
            </span>
            <span className="font-display text-sm font-bold tracking-widest text-[#E5C983]">
              {roomState.roomId}
            </span>
            {copied ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                <Check className="h-3.5 w-3.5" />
                Copied
              </span>
            ) : (
              <Copy className="h-3.5 w-3.5 text-[#C8A253]" />
            )}
          </button>

          {/* Leave Room Button */}
          <button
            type="button"
            disabled={busyAction !== null}
            onClick={() => runAction('leave', leaveRoomAndCleanup)}
            className="flex items-center gap-1.5 rounded-[2px] border border-rose-800/80 bg-rose-950/30 px-3 py-1.5 text-xs font-bold text-rose-300 transition hover:border-rose-500 hover:bg-rose-950/60 disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Leave Room</span>
          </button>
        </div>
      </header>

      {/* Main 2-Column Content: Left (Participants & Controls) | Right (Room Chat) */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden p-4 lg:grid-cols-12">
        {/* Left Column: Factions + Roster + Start Button */}
        <div className="flex min-h-0 flex-col gap-4 overflow-hidden lg:col-span-8">
          {/* Non-Ruler Status Banner */}
          {!isRuler && (
            <div
              className={`shrink-0 rounded-[2px] border px-4 py-3 text-xs font-semibold ${
                myRole === 'master_a'
                  ? 'border-rose-500/70 bg-rose-950/30 text-rose-200'
                  : myRole === 'master_b'
                    ? 'border-sky-500/70 bg-sky-950/30 text-sky-200'
                    : 'border-slate-700 bg-[#111622] text-slate-300'
              }`}
            >
              {myRole === 'master_a' ? (
                <div className="flex items-center gap-2">
                  <Swords className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>
                    คุณได้รับมอบหมายเป็น{' '}
                    <strong className="text-rose-400">
                      Master A (Red Faction — {roomState.teams.team_a.name})
                    </strong>{' '}
                    — รอ Ruler กดเริ่มเกม
                  </span>
                </div>
              ) : myRole === 'master_b' ? (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 shrink-0 text-sky-400" />
                  <span>
                    คุณได้รับมอบหมายเป็น{' '}
                    <strong className="text-sky-400">
                      Master B (Blue Faction — {roomState.teams.team_b.name})
                    </strong>{' '}
                    — รอ Ruler กดเริ่มเกม
                  </span>
                </div>
              ) : gameAlreadyStarted ? (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 shrink-0 text-[#C8A253]" />
                  <span>
                    เกมได้เริ่มขึ้นแล้ว — กรุณารอ Ruler จัดฝั่งให้คุณ (Master A หรือ Master B) เพื่อเข้าสู่กระดาน
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 shrink-0 text-slate-400" />
                  <span>รอ Ruler จัดฝั่ง... (สามารถพิมพ์คุยในห้องแชตด้านขวาได้ระหว่างรอ)</span>
                </div>
              )}
            </div>
          )}

          {/* Faction Slots Overview + Ruler Swap Button */}
          <div className="grid shrink-0 grid-cols-1 items-stretch gap-3 sm:grid-cols-11">
            {/* Master A Card */}
            <div className="rounded-[2px] border border-rose-500/60 bg-[#111622] p-3 sm:col-span-5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-display text-xs font-bold tracking-wider text-rose-400">
                  <Swords className="h-4 w-4" />
                  MASTER A · RED FACTION
                </span>
                <span className="rounded-[2px] border border-rose-500/40 bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
                  {masterAName ? 'ASSIGNED' : 'EMPTY'}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-slate-400">
                {roomState.teams.team_a.name}
              </p>
              <div className="mt-2 rounded-[2px] border border-slate-800 bg-[#090B10] px-2.5 py-1.5 text-sm font-bold text-slate-100">
                {masterAName ? (
                  <span className="text-rose-300">{masterAName}</span>
                ) : (
                  <span className="text-xs font-normal text-slate-500">
                    ยังไม่ได้กำหนดผู้เล่น
                  </span>
                )}
              </div>
            </div>

            {/* Center Swap Button (Ruler) or VS badge */}
            <div className="flex items-center justify-center sm:col-span-1">
              {isRuler ? (
                <button
                  type="button"
                  disabled={busyAction !== null || (!masterAName && !masterBName)}
                  onClick={() => runAction('swap', swapMasterSeatsAction)}
                  title="สลับฝั่ง Master A ↔ Master B"
                  className="flex h-10 w-full items-center justify-center gap-1 rounded-[2px] border border-[#C8A253]/60 bg-[#111622] px-2 text-xs font-bold text-[#E5C983] transition hover:bg-[#C8A253]/20 disabled:cursor-not-allowed disabled:opacity-40 sm:h-12 sm:w-12 sm:flex-col sm:gap-0.5"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  <span className="text-[9px] font-display tracking-wider">SWAP</span>
                </button>
              ) : (
                <span className="font-display text-xs font-bold tracking-widest text-[#C8A253]">
                  VS
                </span>
              )}
            </div>

            {/* Master B Card */}
            <div className="rounded-[2px] border border-sky-500/60 bg-[#111622] p-3 sm:col-span-5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-display text-xs font-bold tracking-wider text-sky-400">
                  <Shield className="h-4 w-4" />
                  MASTER B · BLUE FACTION
                </span>
                <span className="rounded-[2px] border border-sky-500/40 bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-bold text-sky-300">
                  {masterBName ? 'ASSIGNED' : 'EMPTY'}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-slate-400">
                {roomState.teams.team_b.name}
              </p>
              <div className="mt-2 rounded-[2px] border border-slate-800 bg-[#090B10] px-2.5 py-1.5 text-sm font-bold text-slate-100">
                {masterBName ? (
                  <span className="text-sky-300">{masterBName}</span>
                ) : (
                  <span className="text-xs font-normal text-slate-500">
                    ยังไม่ได้กำหนดผู้เล่น
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Participants List */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2px] border border-[#C8A253]/30 bg-[#111622]">
            <div className="flex shrink-0 items-center justify-between border-b border-[#C8A253]/20 bg-[#090B10] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#C8A253]" />
                <h2 className="font-display text-xs font-bold tracking-widest text-[#E5C983]">
                  PARTICIPANTS IN ROOM ({participantList.length})
                </h2>
              </div>
              {isRuler && (
                <span className="text-[11px] text-slate-400">
                  คลิกปุ่มด้านขวาเพื่อจัดฝั่ง Master A / B หรือเตะผู้เล่น
                </span>
              )}
            </div>

            {actionError && (
              <div className="shrink-0 border-b border-red-900/70 bg-red-950/40 px-4 py-2 text-xs text-red-300">
                {actionError}
              </div>
            )}

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
              {participantList.map((p) => {
                const role = getParticipantRole(roomState.seats, p.uid);
                const isSelf = p.uid === authUid;
                const isRowRuler = role === 'ruler';

                const badge =
                  role === 'ruler'
                    ? {
                        text: 'Ruler',
                        cls: 'border-[#C8A253]/60 bg-[#C8A253]/15 text-[#E5C983]',
                      }
                    : role === 'master_a'
                      ? {
                          text: 'Master A',
                          cls: 'border-rose-500/60 bg-rose-500/15 text-rose-300',
                        }
                      : role === 'master_b'
                        ? {
                            text: 'Master B',
                            cls: 'border-sky-500/60 bg-sky-500/15 text-sky-300',
                          }
                        : {
                            text: 'Waiting',
                            cls: 'border-slate-700 bg-slate-800/80 text-slate-400',
                          };

                return (
                  <div
                    key={p.uid}
                    className={`flex flex-wrap items-center justify-between gap-2 rounded-[2px] border px-3 py-2.5 ${
                      isRowRuler
                        ? 'border-[#C8A253]/40 bg-[#090B10]'
                        : role === 'master_a'
                          ? 'border-rose-500/40 bg-rose-950/10'
                          : role === 'master_b'
                            ? 'border-sky-500/40 bg-sky-950/10'
                            : 'border-slate-800 bg-[#090B10]/80'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      {isRowRuler ? (
                        <Crown className="h-4 w-4 shrink-0 text-[#C8A253]" />
                      ) : role === 'master_a' ? (
                        <Swords className="h-4 w-4 shrink-0 text-rose-400" />
                      ) : role === 'master_b' ? (
                        <Shield className="h-4 w-4 shrink-0 text-sky-400" />
                      ) : (
                        <Users className="h-4 w-4 shrink-0 text-slate-500" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-bold text-slate-100">
                            {p.name}
                          </span>
                          {isSelf && (
                            <span className="rounded-[2px] border border-emerald-700/60 bg-emerald-950/50 px-1.5 py-px text-[9.5px] font-bold text-emerald-300">
                              YOU
                            </span>
                          )}
                          <span
                            className={`rounded-[2px] border px-1.5 py-px font-display text-[10px] font-bold uppercase tracking-wider ${badge.cls}`}
                          >
                            {badge.text}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ruler Action Buttons */}
                    {isRuler && !isRowRuler && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          disabled={busyAction !== null || role === 'master_a'}
                          onClick={() =>
                            runAction(`assign-a-${p.uid}`, () =>
                              assignSeat(p.uid, 'master_a')
                            )
                          }
                          className={`rounded-[2px] border px-2 py-1 text-[11px] font-bold transition ${
                            role === 'master_a'
                              ? 'cursor-default border-rose-500/80 bg-rose-500/25 text-rose-200'
                              : 'border-rose-600/60 bg-[#090B10] text-rose-300 hover:bg-rose-950/60'
                          } disabled:opacity-60`}
                        >
                          Assign Team A
                        </button>

                        <button
                          type="button"
                          disabled={busyAction !== null || role === 'master_b'}
                          onClick={() =>
                            runAction(`assign-b-${p.uid}`, () =>
                              assignSeat(p.uid, 'master_b')
                            )
                          }
                          className={`rounded-[2px] border px-2 py-1 text-[11px] font-bold transition ${
                            role === 'master_b'
                              ? 'cursor-default border-sky-500/80 bg-sky-500/25 text-sky-200'
                              : 'border-sky-600/60 bg-[#090B10] text-sky-300 hover:bg-sky-950/60'
                          } disabled:opacity-60`}
                        >
                          Assign Team B
                        </button>

                        {role !== 'spectator' && (
                          <button
                            type="button"
                            disabled={busyAction !== null}
                            onClick={() =>
                              runAction(`unassign-${p.uid}`, () =>
                                assignSeat(p.uid, null)
                              )
                            }
                            title="ถอดออกจากฝั่ง"
                            className="flex items-center gap-1 rounded-[2px] border border-slate-700 bg-[#090B10] px-2 py-1 text-[11px] font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white disabled:opacity-50"
                          >
                            <UserMinus className="h-3 w-3" />
                            <span>Unassign</span>
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={busyAction !== null}
                          onClick={() =>
                            runAction(`kick-${p.uid}`, () =>
                              kickParticipantAction(p.uid)
                            )
                          }
                          title="นำผู้เล่นนี้ออกจากห้อง"
                          className="flex items-center gap-1 rounded-[2px] border border-red-900/70 bg-red-950/30 px-2 py-1 text-[11px] font-semibold text-red-300 transition hover:border-red-500 hover:bg-red-950/70 disabled:opacity-50"
                        >
                          <UserX className="h-3 w-3" />
                          <span>Kick</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ruler Start Game Footer */}
          {isRuler && (
            <div className="shrink-0 rounded-[2px] border border-[#C8A253]/40 bg-[#111622] p-3">
              {missingMasters && (
                <div className="mb-2.5 flex items-center gap-2 rounded-[2px] border border-amber-500/40 bg-amber-950/30 px-3 py-1.5 text-[11px] text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                  <span>
                    ยังไม่ได้กำหนดผู้เล่นครบทั้ง Master A และ Master B — สามารถกดเริ่มเกมเพื่อทดสอบได้ทันที หรือรอเพื่อนเข้ามาก่อน
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={() => runAction('start', startGameAction)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-[2px] border border-[#E5C983] bg-gradient-to-r from-[#C8A253] via-[#E5C983] to-[#C8A253] px-5 py-2.5 font-display text-sm font-bold tracking-widest text-[#090B10] shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Flame className="h-4 w-4" />
                  <span>
                    {busyAction === 'start'
                      ? 'ENTERING WAR ROOM...'
                      : 'ENTER WAR ROOM (START GAME)'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Room Chat */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-[2px] border border-[#C8A253]/30 bg-[#111622] lg:col-span-4">
          <RoomChatBox showHeader className="min-h-0 flex-1" />
        </div>
      </div>
    </div>
  );
}

// Keep legacy export name alias so any existing reference remains clean
export const SeatSelector = WaitingLobbyView;
