import { useState } from 'react';
import { Crown, X } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

export function GrailAbsorptionBanner() {
  const banner = useGameStore((s) => s.roomState.grailBannerBroadcast);
  const dismiss = useGameStore((s) => s.dismissGrailBanner);
  const [iconErr, setIconErr] = useState(false);

  if (!banner) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-22 z-50 flex justify-center px-4">
      <div
        role="status"
        className={`clip-tactical pointer-events-auto relative flex w-full max-w-2xl items-center gap-4 border px-5 py-3.5 shadow-2xl ${
          banner.isManifestation
            ? 'border-[#C8A253] bg-[#111622]'
            : 'border-[#C8A253]/50 bg-[#111622]/95'
        }`}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[2px] border border-[#C8A253]/40 bg-[#090B10]">
          {!iconErr ? (
            <img
              src="/assets/ui/holy_grail.webp"
              alt="Holy Grail"
              onError={() => setIconErr(true)}
              className="h-8 w-8 object-contain"
            />
          ) : (
            <Crown className="h-5 w-5 text-[#C8A253]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-[#C8A253]">
              {banner.isManifestation
                ? 'GREATER GRAIL MANIFESTATION'
                : 'HOLY GRAIL VESSEL ABSORPTION'}
            </span>
            <span className="rounded-[2px] border border-[#C8A253]/40 bg-[#090B10] px-1.5 py-0.5 text-[10px] font-bold text-[#E5C983]">
              {banner.absorbedCount} / 5
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-100">{banner.message}</p>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="ปิดประกาศ"
          className="rounded-[2px] border border-[#C8A253]/30 bg-[#090B10] p-1.5 text-slate-300 transition hover:border-[#C8A253] hover:text-[#C8A253]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
