import { useEffect, useRef, useState } from 'react';
import { Dices, X } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

export function DiceToast() {
  const dice = useGameStore((s) => s.roomState.diceBroadcast);
  const diceId = dice?.id ?? null;
  const [visibleId, setVisibleId] = useState<string | null>(null);
  const lastSeenRef = useRef<string | null>(diceId);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!diceId) return;
    if (diceId === lastSeenRef.current) return;

    lastSeenRef.current = diceId;
    setVisibleId(diceId);

    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setVisibleId((cur) => (cur === diceId ? null : cur));
      timerRef.current = null;
    }, 6500);
  }, [diceId]);

  if (!dice || visibleId !== dice.id) return null;

  const isCrit = dice.result >= 5;
  const bonusLabel =
    dice.result <= 2 ? '+0' : dice.result <= 4 ? '+1' : '+2 CRIT!';

  const roleLabel =
    dice.rollerRole === 'ruler'
      ? 'Ruler'
      : dice.rollerRole === 'master_a'
        ? 'Master A'
        : 'Master B';

  return (
    <div
      role="status"
      className="clip-tactical-sm fixed right-4 bottom-4 z-50 flex w-72 items-center gap-3 border border-[#C8A253]/70 bg-[#111622] p-3 text-slate-100 shadow-2xl"
    >
      <div
        className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[2px] border font-display text-2xl font-bold ${
          isCrit
            ? 'border-[#C8A253] bg-[#C8A253]/20 text-[#E5C983]'
            : 'border-slate-700 bg-[#090B10] text-slate-100'
        }`}
      >
        {dice.result}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <Dices className="h-3 w-3 text-[#C8A253]" />
          <span>{roleLabel} · 1d6</span>
        </div>
        <div className="mt-0.5 truncate text-xs font-bold text-slate-100">
          {dice.label}
        </div>
        <span
          className={`mt-1 inline-block rounded-[2px] px-1.5 py-px text-[10px] font-bold ${
            isCrit
              ? 'bg-[#B91C1C] text-white'
              : dice.result >= 3
                ? 'bg-sky-950 text-sky-300 border border-sky-700/60'
                : 'bg-slate-800 text-slate-400'
          }`}
        >
          Combat Bonus: {bonusLabel}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setVisibleId(null)}
        aria-label="ปิดแจ้งเตือนลูกเต๋า"
        className="self-start text-slate-500 hover:text-white"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
