import { Crown, Sparkles, X } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

export function GrailAbsorptionBanner() {
  const banner = useGameStore((s) => s.roomState.grailBannerBroadcast);
  const dismiss = useGameStore((s) => s.dismissGrailBanner);

  if (!banner) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-50 flex justify-center px-4">
      <div
        role="status"
        className={`pointer-events-auto relative flex w-full max-w-2xl items-center gap-4 rounded-xl border px-5 py-3.5 shadow-xl ${
          banner.isManifestation
            ? 'border-amber-600 bg-slate-900'
            : 'border-amber-700/80 bg-slate-900/95'
        }`}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-700 bg-slate-950 text-amber-400">
          {banner.isManifestation ? (
            <Crown className="h-5 w-5 text-amber-400" />
          ) : (
            <Sparkles className="h-5 w-5 text-amber-500" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-400/90">
              {banner.isManifestation
                ? 'GREATER GRAIL MANIFESTATION'
                : 'HOLY GRAIL VESSEL ABSORPTION'}
            </span>
            <span className="rounded border border-amber-700/70 bg-slate-950 px-1.5 py-0.5 text-[10px] font-bold text-amber-200">
              {banner.absorbedCount} / 5
            </span>
          </div>
          <p className="mt-1 text-sm font-bold text-slate-100">{banner.message}</p>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="ปิดประกาศ"
          className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 transition hover:border-slate-500 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
