import { useEffect, useState } from 'react';
import { Crown, Flame, KeyRound, Play, Search, Wifi, WifiOff } from 'lucide-react';
import { ensureAnonymousAuth, isFirebaseConfigured } from '../../services/firebase';
import {
  claimRoomSeat,
  createOnlineRoom,
  fetchRoomSnapshot,
  type RoomDocWithPin,
} from '../../services/roomService';
import {
  createDemoRoomState,
  createFreshDraftRoomState,
  randomSecretGrailTurn,
  useGameStore,
} from '../../store/useGameStore';
import type { Role } from '../../types/game';
import { SeatSelector } from './SeatSelector';

export function LobbyView() {
  const authUid = useGameStore((s) => s.authUid);
  const setAuthUid = useGameStore((s) => s.setAuthUid);
  const enterOnlineRoom = useGameStore((s) => s.enterOnlineRoom);
  const enterLocalSandbox = useGameStore((s) => s.enterLocalSandbox);

  const [authStatus, setAuthStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [authError, setAuthError] = useState<string | null>(null);

  // Create Room state
  const [teamAName, setTeamAName] = useState('Team A (Mount Enzo)');
  const [teamBName, setTeamBName] = useState('Team B (Shinto City)');
  const [rulerPin, setRulerPin] = useState('');
  const [startWithDemo, setStartWithDemo] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Join Room state
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundRoom, setFoundRoom] = useState<RoomDocWithPin | null>(null);
  const [findError, setFindError] = useState<string | null>(null);
  const [joiningRole, setJoiningRole] = useState<Role | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setAuthStatus('error');
      setAuthError('ยังไม่ได้ตั้งค่า VITE_FIREBASE_* ใน .env.local');
      return;
    }

    let cancelled = false;
    ensureAnonymousAuth()
      .then((user) => {
        if (!cancelled) {
          setAuthUid(user.uid);
          setAuthStatus('ready');
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
  }, [setAuthUid]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUid) return;
    setCreating(true);
    setCreateError(null);

    try {
      const initialState = startWithDemo
        ? createDemoRoomState(teamAName, teamBName)
        : createFreshDraftRoomState(teamAName, teamBName);
      const secretTurn = randomSecretGrailTurn();

      const roomId = await createOnlineRoom({
        initialState,
        rulerUid: authUid,
        rulerPin: rulerPin.trim() || undefined,
        secretGrailTurn: secretTurn,
      });

      enterOnlineRoom(roomId, 'ruler', {
        ...initialState,
        roomId,
        seats: { rulerUid: authUid, masterAUid: null, masterBUid: null },
      });
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

  const handleFindRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;
    setSearching(true);
    setFindError(null);
    setJoinError(null);

    try {
      const room = await fetchRoomSnapshot(roomCodeInput);
      if (!room) {
        setFoundRoom(null);
        setFindError(`ไม่พบห้อง "${roomCodeInput.trim().toUpperCase()}"`);
      } else {
        setFoundRoom(room);
      }
    } catch (err: unknown) {
      setFindError(err instanceof Error ? err.message : 'ค้นหาห้องไม่สำเร็จ');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSeat = async (role: Role, pin?: string) => {
    if (!foundRoom || !authUid) return;
    setJoiningRole(role);
    setJoinError(null);

    try {
      const res = await claimRoomSeat({
        roomId: foundRoom.roomId,
        role,
        uid: authUid,
        pin,
      });
      if (!res.ok) {
        setJoinError(res.error ?? 'เข้าที่นั่งไม่สำเร็จ');
      } else {
        enterOnlineRoom(foundRoom.roomId, role, foundRoom);
      }
    } catch (err: unknown) {
      setJoinError(err instanceof Error ? err.message : 'ไม่สามารถจับจองที่นั่งได้');
    } finally {
      setJoiningRole(null);
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
                Custom VTT · 3-Player Simultaneous WEGO · 10×7 Fuyuki Night
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {authStatus === 'ready' ? (
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
                ระบบจะสุ่ม Room Code 6 หลัก และสุ่ม Secret Grail Turn (10–12) เก็บไว้ในเอกสารลับของ Ruler
              </p>

              <div className="mt-3 space-y-2.5">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-red-300">
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

                <label className="flex cursor-pointer items-center gap-2 pt-1 text-xs text-slate-300">
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
                disabled={authStatus !== 'ready' || creating}
                className="flex w-full items-center justify-center gap-2 rounded-[2px] border border-[#C8A253]/60 bg-[#B91C1C] py-2 font-display text-xs font-bold tracking-widest text-slate-100 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Flame className="h-4 w-4" />
                <span>{creating ? 'CREATING WAR ROOM...' : 'CREATE NEW WAR ROOM'}</span>
              </button>
            </div>
          </form>

          {/* Right: Join Room */}
          <div className="flex flex-col rounded-[2px] border border-[#C8A253]/30 bg-[#090B10] p-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-[#C8A253]" />
              <h2 className="font-display text-sm font-bold tracking-wider text-[#E5C983]">
                JOIN EXISTING WAR ROOM
              </h2>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              กรอกรหัสห้องจาก Ruler (เช่น <code>FGO-482</code>) เพื่อเลือกที่นั่ง Master A / Master B หรือ Rejoin
            </p>

            <form onSubmit={handleFindRoom} className="mt-3 flex gap-2">
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="เช่น FGO-482"
                className="flex-1 rounded-[2px] border border-slate-700 bg-[#111622] px-3 py-1.5 font-display text-sm font-bold tracking-widest text-slate-100 uppercase placeholder:font-sans placeholder:text-xs placeholder:tracking-normal placeholder:text-slate-600 focus:border-[#C8A253] focus:outline-none"
              />
              <button
                type="submit"
                disabled={authStatus !== 'ready' || searching || !roomCodeInput.trim()}
                className="rounded-[2px] border border-[#C8A253]/60 bg-[#C8A253] px-4 py-1.5 font-display text-xs font-bold tracking-wider text-[#090B10] transition hover:bg-[#E5C983] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {searching ? 'ค้นหา...' : 'Find Room'}
              </button>
            </form>

            {findError && (
              <p className="mt-2 text-xs font-semibold text-red-400">{findError}</p>
            )}

            {foundRoom && authUid ? (
              <SeatSelector
                room={foundRoom}
                currentUid={authUid}
                joiningRole={joiningRole}
                error={joinError}
                onSelectSeat={handleSelectSeat}
              />
            ) : (
              <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-[2px] border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
                กรอกรหัสห้องแล้วกด Find Room เพื่อแสดงการ์ดเลือกที่นั่ง 3 ตำแหน่ง
              </div>
            )}
          </div>
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
