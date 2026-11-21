import { useState } from 'react';
import { Crown, KeyRound, Shield, Swords, UserCheck } from 'lucide-react';
import type { RoomDocWithPin } from '../../services/roomService';
import type { Role } from '../../types/game';

interface SeatSelectorProps {
  room: RoomDocWithPin;
  currentUid: string;
  joiningRole: Role | null;
  error: string | null;
  onSelectSeat: (role: Role, pin?: string) => void;
}

export function SeatSelector({
  room,
  currentUid,
  joiningRole,
  error,
  onSelectSeat,
}: SeatSelectorProps) {
  const [pinInput, setPinInput] = useState('');

  const seats: {
    role: Role;
    title: string;
    subtitle: string;
    holderUid: string | null;
    borderClass: string;
    titleClass: string;
    icon: React.ReactNode;
    needsPin?: boolean;
  }[] = [
    {
      role: 'ruler',
      title: 'Ruler / GM',
      subtitle: 'คุมกฎ · God-Mode · เฉลยผล',
      holderUid: room.seats.rulerUid,
      borderClass: 'border-[#C8A253]/70 hover:border-[#C8A253]',
      titleClass: 'text-[#E5C983]',
      icon: <Crown className="h-5 w-5 text-[#C8A253]" />,
      needsPin: Boolean(room.rulerPin),
    },
    {
      role: 'master_a',
      title: 'Master A',
      subtitle: room.teams.team_a.name,
      holderUid: room.seats.masterAUid,
      borderClass: 'border-[#B91C1C]/70 hover:border-red-500',
      titleClass: 'text-red-400',
      icon: <Swords className="h-5 w-5 text-red-400" />,
    },
    {
      role: 'master_b',
      title: 'Master B',
      subtitle: room.teams.team_b.name,
      holderUid: room.seats.masterBUid,
      borderClass: 'border-sky-600/70 hover:border-sky-400',
      titleClass: 'text-sky-400',
      icon: <Shield className="h-5 w-5 text-sky-400" />,
    },
  ];

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-display font-bold tracking-wider text-[#E5C983]">
          ROOM {room.roomId} · TURN {room.turn} ({room.phase.toUpperCase()})
        </span>
        <span className="text-[11px] text-slate-400">เลือกที่นั่งของคุณ</span>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {seats.map((seat) => {
          const isMine = Boolean(seat.holderUid && seat.holderUid === currentUid);
          const isOccupied = Boolean(seat.holderUid && !isMine);
          const isBusy = joiningRole === seat.role;

          return (
            <div
              key={seat.role}
              className={`flex flex-col justify-between rounded-[2px] border bg-[#090B10] p-3 transition ${
                isOccupied ? 'border-slate-800 opacity-60' : seat.borderClass
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  {seat.icon}
                  <span
                    className={`rounded-[2px] px-1.5 py-0.5 text-[9.5px] font-bold uppercase ${
                      isMine
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        : isOccupied
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-[#111622] text-[#C8A253] border border-[#C8A253]/30'
                    }`}
                  >
                    {isMine ? 'Your Seat' : isOccupied ? 'Occupied' : 'Available'}
                  </span>
                </div>
                <h4 className={`mt-2 font-display text-sm font-bold ${seat.titleClass}`}>
                  {seat.title}
                </h4>
                <p className="mt-0.5 truncate text-[11px] text-slate-400">{seat.subtitle}</p>
              </div>

              <div className="mt-3 space-y-1.5">
                {seat.needsPin && !isMine && !isOccupied && (
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      maxLength={4}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="PIN 4 หลัก"
                      className="w-full rounded-[2px] border border-slate-700 bg-[#111622] py-1 pr-2 pl-6 text-[11px] text-slate-100 focus:border-[#C8A253] focus:outline-none"
                    />
                  </div>
                )}

                <button
                  type="button"
                  disabled={isOccupied || joiningRole !== null}
                  onClick={() => onSelectSeat(seat.role, seat.needsPin ? pinInput : undefined)}
                  className={`flex w-full items-center justify-center gap-1 rounded-[2px] py-1.5 text-xs font-bold transition ${
                    isMine
                      ? 'bg-emerald-700 text-white hover:bg-emerald-600'
                      : isOccupied
                        ? 'cursor-not-allowed bg-slate-800 text-slate-500'
                        : 'bg-[#B91C1C] text-slate-100 hover:bg-red-700'
                  }`}
                >
                  {isMine && <UserCheck className="h-3.5 w-3.5" />}
                  <span>
                    {isBusy
                      ? 'กำลังเข้าห้อง...'
                      : isMine
                        ? 'Rejoin Seat'
                        : isOccupied
                          ? 'มีผู้เล่นแล้ว'
                          : 'Join Seat'}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="rounded-[2px] border border-red-700/70 bg-red-950/40 px-3 py-2 text-xs font-semibold text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
