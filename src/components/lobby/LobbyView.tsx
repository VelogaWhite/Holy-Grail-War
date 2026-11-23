import { useEffect, useState } from 'react';
import {
  Crown,
  Flame,
  KeyRound,
  LogIn,
  Play,
  User,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { ensureAnonymousAuth, isFirebaseConfigured } from '../../services/firebase';
import {
  createOnlineRoom,
  fetchRoomSnapshot,
  joinRoomLobby,
} from '../../services/roomService';
import {
  clearLastSession,
  createDemoRoomState,
  createFreshDraftRoomState,
  getParticipantRole,
  loadLastSession,
  randomSecretGrailTurn,
  useGameStore,
} from '../../store/useGameStore';

export function LobbyView() {
  const authUid = useGameStore((s) => s.authUid);
  const setAuthUid = useGameStore((s) => s.setAuthUid);
  const enterOnlineRoom = useGameStore((s) => s.enterOnlineRoom);
  const enterLocalSandbox = useGameStore((s) => s.enterLocalSandbox);
  const kickedNotice = useGameStore((s) => s.kickedNotice);
  const clearKickedNotice = useGameStore((s) => s.clearKickedNotice);

  const [authStatus, setAuthStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [authError, setAuthError] = useState<string | null>(null);
  const [rejoining, setRejoining] = useState(false);

  // Create Room state
  const [rulerName, setRulerName] = useState('Ruler');
  const [teamAName, setTeamAName] = useState('Team A (Mount Enzo)');
  const [teamBName, setTeamBName] = useState('Team B (Shinto City)');
  const [rulerPin, setRulerPin] = useState('');
  const [trueNameConcealment, setTrueNameConcealment] = useState(false);
  const [startWithDemo, setStartWithDemo] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Join Room state (Room Code + Nickname -> Join Waiting Lobby)
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setAuthStatus('error');
      setAuthError('ยังไม่ได้ตั้งค่า VITE_FIREBASE_* ใน .env.local');
      return;
    }

    let cancelled = false;
    ensureAnonymousAuth()
      .then(async (user) => {
        if (cancelled) return;
        setAuthUid(user.uid);
        setAuthStatus('ready');

        // Auto-rejoin on page refresh if uid still belongs to last room (Read-only getDoc, zero writes)
        const saved = loadLastSession();
        if (!saved?.roomId) return;

        setRejoining(true);
        try {
          const existingRoom = await fetchRoomSnapshot(saved.roomId);
          if (cancelled) return;

          if (existingRoom) {
            const uid = user.uid;
            const isParticipant = Boolean(existingRoom.participants?.[uid]);
            const role = getParticipantRole(existingRoom.seats, uid);
            if (isParticipant || role !== 'spectator') {
              enterOnlineRoom(existingRoom.roomId, role, existingRoom, saved.nickname);
              return;
            }
          }
          clearLastSession();
        } catch {
          // Ignore silent rejoin errors and let user join manually
        } finally {
          if (!cancelled) {
            setRejoining(false);
          }
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setAuthStatus('error');
          setAuthError(err instanceof Error ? err.message : 'Anonymous Auth ล้มเหลว');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [setAuthUid, enterOnlineRoom]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUid) return;
    setCreating(true);
    setCreateError(null);

    try {
      const cleanRulerName = rulerName.trim() || 'Ruler';
      const initialState = startWithDemo
        ? createDemoRoomState(teamAName, teamBName, trueNameConcealment)
        : createFreshDraftRoomState(teamAName, teamBName, trueNameConcealment);
      const secretTurn = randomSecretGrailTurn();

      const { roomId, roomState } = await createOnlineRoom({
        initialState,
        rulerUid: authUid,
        rulerName: cleanRulerName,
        rulerPin: rulerPin.trim() || undefined,
        secretGrailTurn: secretTurn,
      });

      enterOnlineRoom(roomId, 'ruler', roomState, cleanRulerName);
    } catch (err: unknown) {
      setCreateError(
        err instanceof Error
          ? err.message
          : 'สร้างห้องไม่สำเร็จ (ตรวจสอบว่าเปิด Firestore & Deploy rules แล้ว)'
      );
    } finally {
      setCreating(false);
    }
  };

  const handleJoinLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUid || !roomCodeInput.trim() || !nicknameInput.trim()) return;
    setJoining(true);
    setJoinError(null);

    try {
      const res = await joinRoomLobby(roomCodeInput, authUid, nicknameInput);
      if (!res.ok || !res.room) {
        setJoinError(res.error ?? 'เข้าร่วมห้องไม่สำเร็จ');
        return;
      }

      const assignedRole = getParticipantRole(res.room.seats, authUid);
      enterOnlineRoom(
        res.room.roomId,
        assignedRole,
        res.room,
        nicknameInput.trim()
      );
    } catch (err: unknown) {
      setJoinError(
        err instanceof Error ? err.message : 'ไม่สามารถเข้าร่วมห้องได้'
      );
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center overflow-y-auto bg-[#090B10] p-6 text-slate-100">
      <div className="clip-tactical w-full max-w-4xl border border-[#C8A253]/45 bg-[#111622] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#C8A253]/25 pb-4">
          <div className="flex items-center gap-3">
            <img
              src="/assets/ui/holy_grail.webp"
              alt="Holy Grail"
              className="h-11 w-11 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div>
              <h1 className="font-display text-2xl font-bold tracking-widest text-[#E5C983]">
                FATE: HOLY GRAIL WAR
              </h1>
              <p className="text-xs text-slate-400">
                Custom VTT · 3-Player Simultaneous WEGO · Waiting Lobby &amp; Live Chat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {rejoining ? (
              <span className="rounded-[2px] border border-[#C8A253]/50 bg-[#C8A253]/10 px-2.5 py-1 text-[11px] font-semibold text-[#E5C983]">
                กำลังกลับเข้าห้องเดิม...
              </span>
            ) : authStatus === 'ready' ? (
              <span className="flex items-center gap-1.5 rounded-[2px] border border-emerald-700/70 bg-emerald-950/40 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                <Wifi className="h-3.5 w-3.5" />
                Firebase Spark Ready
              </span>
            ) : authStatus === 'loading' ? (
              <span className="rounded-[2px] border border-slate-700 bg-[#090B10] px-2.5 py-1 text-[11px] text-slate-400">
                กำลังเชื่อมต่อ Anonymous Auth...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-[2px] border border-red-800 bg-red-950/40 px-2.5 py-1 text-[11px] text-red-300">
                <WifiOff className="h-3.5 w-3.5" />
                Offline
              </span>
            )}
          </div>
        </div>

        {kickedNotice && (
          <div className="mt-3 flex items-center justify-between rounded-[2px] border border-amber-700/80 bg-amber-950/40 px-3 py-2 text-xs text-amber-200">
            <span>{kickedNotice}</span>
            <button
              type="button"
              onClick={clearKickedNotice}
              className="text-amber-400 hover:text-amber-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {authError && (
          <div className="mt-3 rounded-[2px] border border-red-800/80 bg-red-950/40 px-3 py-2 text-xs text-red-300">
            <strong>หมายเหตุการเชื่อมต่อ Firebase:</strong> {authError}
          </div>
        )}

        {/* 2-Column Create vs Join */}
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Left: Create New War Room (Ruler) */}
          <form
            onSubmit={handleCreateRoom}
            className="flex flex-col justify-between rounded-[2px] border border-[#C8A253]/30 bg-[#090B10] p-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-[#C8A253]" />
                <h2 className="font-display text-sm font-bold tracking-wider text-[#E5C983]">
                  CREATE NEW WAR ROOM (RULER)
                </h2>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                สร้างห้องรอ (Waiting Lobby) พร้อมสุ่ม Room Code 6 หลัก และ Secret Grail Turn (10–12)
              </p>

              <div className="mt-3 space-y-2.5">
                <div>
                  <label className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-[#E5C983]">
                    <Crown className="h-3 w-3 text-[#C8A253]" />
                    ชื่อ Ruler / GM
                  </label>
                  <input
                    type="text"
                    value={rulerName}
                    onChange={(e) => setRulerName(e.target.value)}
                    placeholder="Ruler"
                    maxLength={24}
                    className="w-full rounded-[2px] border border-slate-700 bg-[#111622] px-2.5 py-1.5 text-xs text-slate-100 focus:border-[#C8A253] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-rose-300">
                    ชื่อทีมฝั่งซ้าย (Team A)
                  </label>
                  <input
                    type="text"
                    value={teamAName}
                    onChange={(e) => setTeamAName(e.target.value)}
                    className="w-full rounded-[2px] border border-slate-700 bg-[#111622] px-2.5 py-1.5 text-xs text-slate-100 focus:border-[#C8A253] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-sky-300">
                    ชื่อทีมฝั่งขวา (Team B)
                  </label>
                  <input
                    type="text"
                    value={teamBName}
                    onChange={(e) => setTeamBName(e.target.value)}
                    className="w-full rounded-[2px] border border-slate-700 bg-[#111622] px-2.5 py-1.5 text-xs text-slate-100 focus:border-[#C8A253] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-slate-300">
                    <KeyRound className="h-3 w-3 text-[#C8A253]" />
                    Ruler PIN 4 หลัก (ไม่บังคับ)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={rulerPin}
                    onChange={(e) => setRulerPin(e.target.value)}
                    placeholder="เว้นว่างได้หากไม่ต้องการล็อก PIN"
                    className="w-full rounded-[2px] border border-slate-700 bg-[#111622] px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-[#C8A253] focus:outline-none"
                  />
                </div>

                <label className="flex cursor-pointer items-center gap-2 pt-1 text-xs text-[#E5C983]">
                  <input
                    type="checkbox"
                    checked={trueNameConcealment}
                    onChange={(e) => setTrueNameConcealment(e.target.checked)}
                    className="h-3.5 w-3.5 accent-[#C8A253]"
                  />
                  <span>โหมดปิดนามแท้ (True Name Concealment — ศัตรูเห็นเฉพาะคลาส)</span>
                </label>

                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={startWithDemo}
                    onChange={(e) => setStartWithDemo(e.target.checked)}
                    className="h-3.5 w-3.5 accent-[#C8A253]"
                  />
                  <span>เริ่มด้วยชุดยูนิตตัวอย่าง (โหมดทดสอบ — ปกติเว้นว่างเพื่อเริ่ม Turn 1 Draft จริง)</span>
                </label>
              </div>
            </div>

            <div className="mt-4">
              {createError && (
                <p className="mb-2 text-xs font-semibold text-red-400">{createError}</p>
              )}
              <button
                type="submit"
                disabled={authStatus !== 'ready' || creating || rejoining}
                className="flex w-full items-center justify-center gap-2 rounded-[2px] border border-[#C8A253]/60 bg-[#B91C1C] py-2 font-display text-xs font-bold tracking-widest text-slate-100 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Flame className="h-4 w-4" />
                <span>{creating ? 'CREATING WAR ROOM...' : 'CREATE NEW WAR ROOM'}</span>
              </button>
            </div>
          </form>

          {/* Right: Join Waiting Lobby */}
          <form
            onSubmit={handleJoinLobby}
            className="flex flex-col justify-between rounded-[2px] border border-[#C8A253]/30 bg-[#090B10] p-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <LogIn className="h-4 w-4 text-[#C8A253]" />
                <h2 className="font-display text-sm font-bold tracking-wider text-[#E5C983]">
                  JOIN EXISTING WAR ROOM
                </h2>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                กรอกรหัสห้องจาก Ruler (เช่น <code>FGO-482</code>) และชื่อเล่นเพื่อเข้าสู่ห้องรอ — จากนั้น Ruler จะเป็นคนจัดฝั่ง Master A / B ให้
              </p>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-300">
                    รหัสห้อง (Room Code)
                  </label>
                  <input
                    type="text"
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                    placeholder="เช่น FGO-482"
                    className="w-full rounded-[2px] border border-slate-700 bg-[#111622] px-3 py-2 font-display text-sm font-bold tracking-widest text-slate-100 uppercase placeholder:font-sans placeholder:text-xs placeholder:tracking-normal placeholder:text-slate-600 focus:border-[#C8A253] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-slate-300">
                    <User className="h-3 w-3 text-[#C8A253]" />
                    ชื่อเล่นของคุณ (Nickname)
                  </label>
                  <input
                    type="text"
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    maxLength={24}
                    placeholder="เช่น Shirou, Rin, Kiritsugu"
                    className="w-full rounded-[2px] border border-slate-700 bg-[#111622] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:border-[#C8A253] focus:outline-none"
                  />
                </div>

                <div className="rounded-[2px] border border-slate-800 bg-[#111622]/70 p-3 text-[11px] leading-relaxed text-slate-400">
                  <p className="font-semibold text-[#E5C983]">ขั้นตอนการเข้าร่วม:</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4">
                    <li>เข้าห้องรอเพื่อพูดคุยผ่าน Room Chat กับเพื่อนและ Ruler</li>
                    <li>Ruler กดจัดฝั่ง Master A (สีแดง) และ Master B (สีฟ้า)</li>
                    <li>เมื่อ Ruler กด Enter War Room ทุกหน้าจอจะเข้าสู่กระดานพร้อมกัน</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-4">
              {joinError && (
                <p className="mb-2 text-xs font-semibold text-red-400">{joinError}</p>
              )}
              <button
                type="submit"
                disabled={
                  authStatus !== 'ready' ||
                  joining ||
                  rejoining ||
                  !roomCodeInput.trim() ||
                  !nicknameInput.trim()
                }
                className="flex w-full items-center justify-center gap-2 rounded-[2px] border border-[#C8A253]/60 bg-[#C8A253] py-2 font-display text-xs font-bold tracking-widest text-[#090B10] transition hover:bg-[#E5C983] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogIn className="h-4 w-4" />
                <span>{joining ? 'JOINING LOBBY...' : 'JOIN LOBBY'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer: Offline Local Sandbox */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3 text-xs text-slate-400">
          <span>ต้องการทดสอบระบบแบบออฟไลน์คนเดียว (ไม่ใช้โควตา Firestore)?</span>
          <button
            type="button"
            onClick={enterLocalSandbox}
            className="flex items-center gap-1.5 rounded-[2px] border border-slate-700 bg-[#090B10] px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:border-[#C8A253] hover:text-[#E5C983]"
          >
            <Play className="h-3.5 w-3.5 text-[#C8A253]" />
            <span>Enter Local Sandbox (Offline)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
