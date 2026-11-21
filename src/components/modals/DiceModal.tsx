import { useState } from 'react';
import { Dices, X } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

const PRESET_LABELS = [
  'Basic Attack (1d6)',
  'QP Cache (1d6)',
  'Choose Side (Post-Draft)',
  'NP Instant Kill Check',
];

export function DiceModal() {
  const isOpen = useGameStore((s) => s.isDiceOpen);
  const setDiceOpen = useGameStore((s) => s.setDiceOpen);
  const diceBroadcast = useGameStore((s) => s.roomState.diceBroadcast);
  const rollDice1d6 = useGameStore((s) => s.rollDice1d6);

  const [label, setLabel] = useState('Basic Attack (1d6)');
  const [rolling, setRolling] = useState(false);

  if (!isOpen) return null;

  const handleRoll = async (e: React.FormEvent) => {
    e.preventDefault();
    setRolling(true);
    try {
      await rollDice1d6(label);
    } finally {
      setRolling(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Dice 1d6 Modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#090B10]/80 p-4"
      onClick={() => setDiceOpen(false)}
    >
      <div
        className="clip-tactical w-full max-w-md border border-[#C8A253]/50 bg-[#111622] text-slate-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#C8A253]/25 bg-[#090B10] px-4 py-3">
          <div className="flex items-center gap-2">
            <Dices className="h-4 w-4 text-[#C8A253]" />
            <h2 className="font-display text-sm font-bold tracking-widest text-[#E5C983]">
              DICE ROLLER · 1d6
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setDiceOpen(false)}
            className="rounded-[2px] border border-slate-700 bg-[#111622] p-1 text-slate-400 hover:border-[#C8A253] hover:text-[#E5C983]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleRoll} className="p-4">
          <label className="mb-1 block text-xs font-semibold text-slate-300">
            หัวข้อการทอย (Broadcast ไปทั้ง 3 หน้าจอ)
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="เช่น Artoria Attack Roll หรือ QP Cache"
            className="w-full rounded-[2px] border border-slate-700 bg-[#090B10] px-3 py-1.5 text-xs text-slate-100 focus:border-[#C8A253] focus:outline-none"
          />

          <div className="mt-2 flex flex-wrap gap-1">
            {PRESET_LABELS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setLabel(p)}
                className="rounded-[2px] border border-slate-800 bg-[#090B10] px-2 py-0.5 text-[10px] text-slate-400 hover:border-[#C8A253]/50 hover:text-[#E5C983]"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Combat Bonus Reference */}
          <div className="mt-3 grid grid-cols-3 gap-1.5 rounded-[2px] border border-slate-800 bg-[#090B10] p-2 text-center text-[10.5px]">
            <div>
              <div className="font-mono font-bold text-slate-300">1 – 2</div>
              <div className="text-slate-500">Bonus +0</div>
            </div>
            <div>
              <div className="font-mono font-bold text-sky-300">3 – 4</div>
              <div className="text-sky-400">Bonus +1</div>
            </div>
            <div>
              <div className="font-mono font-bold text-[#E5C983]">5 – 6</div>
              <div className="font-bold text-[#C8A253]">+2 CRIT!</div>
            </div>
          </div>

          {diceBroadcast && (
            <div className="mt-3 flex items-center justify-between rounded-[2px] border border-[#C8A253]/35 bg-[#090B10] px-3 py-2 text-xs">
              <span className="truncate text-slate-400">
                ล่าสุด: <strong className="text-slate-200">{diceBroadcast.label}</strong>
              </span>
              <span className="font-display text-base font-bold text-[#E5C983]">
                {diceBroadcast.result}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={rolling}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-[2px] border border-[#C8A253]/60 bg-[#B91C1C] py-2.5 font-display text-xs font-bold tracking-widest text-slate-100 transition hover:bg-red-700 disabled:opacity-50"
          >
            <Dices className="h-4 w-4" />
            <span>{rolling ? 'ROLLING...' : 'ROLL 1d6'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
