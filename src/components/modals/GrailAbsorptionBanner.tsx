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
        className={`pointer-events-auto relative flex w-full max-w-2xl items-center gap-4 overflow-hidden rounded-xl border-2 px-5 py-3.5 shadow-2xl backdrop-blur-md ${
          banner.isManifestation
            ? 'border-amber-300 bg-gradient-to-r from-slate-950 via-amber-950/95 to-slate-950 shadow-amber-500/30'
            : 'border-amber-400/90 bg-slate-950/95 shadow-amber-500/20'
        }`}
      >
        {/* Subtle Gold Accent Glow */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-500/20 text-amber-300 shadow-inner">
          {banner.isManifestation ? (
            <Crown className="h-6 w-6 text-amber-300" />
          ) : (
            <Sparkles className="h-5 w-5 text-amber-400" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">
              {banner.isManifestation
                ? 'GREATER GRAIL MANIFESTATION'
                : 'HOLY GRAIL VESSEL ABSORPTION'}
            </span>
            <span className="rounded border border-amber-400/50 bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-black text-amber-300">
              {banner.absorbedCount} / 5
            </span>
          </div>
          <p className="mt-1 text-sm font-bold text-amber-100">{banner.message}</p>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="ปิดประกาศ"
          className="rounded-lg border border-amber-400/40 bg-slate-900/80 p-1.5 text-amber-200 transition hover:border-amber-300 hover:bg-amber-400/20"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
