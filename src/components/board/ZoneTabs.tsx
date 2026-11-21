import { MAP_DATA } from '../../data';
import { useGameStore } from '../../store/useGameStore';
import type { ZoneId } from '../../types/game';

const ZONE_ORDER: { id: ZoneId; shortLabel: string; accentClass: string }[] = [
  { id: 'base_a', shortLabel: 'Base A: Mount Enzo', accentClass: 'text-rose-400' },
  { id: 'central', shortLabel: 'Central Fuyuki', accentClass: 'text-amber-400' },
  { id: 'base_b', shortLabel: 'Base B: Shinto City', accentClass: 'text-sky-400' },
];

export function ZoneTabs() {
  const activeZone = useGameStore((s) => s.activeZone);
  const setActiveZone = useGameStore((s) => s.setActiveZone);
  const units = useGameStore((s) => s.roomState.units);

  const countInZone = (zoneId: ZoneId) =>
    Object.values(units).filter(
      (u) => u.status === 'active' && u.position?.zone === zoneId
    ).length;

  return (
    <div className="flex w-full max-w-[780px] items-center justify-center gap-2">
      {ZONE_ORDER.map((z) => {
        const isActive = activeZone === z.id;
        const count = countInZone(z.id);
        return (
          <button
            key={z.id}
            type="button"
            onClick={() => setActiveZone(z.id)}
            title={MAP_DATA.zones[z.id].name}
            className={`flex flex-1 items-center justify-center gap-2 rounded-t-lg border-x border-t px-3 py-1.5 text-xs font-extrabold transition ${
              isActive
                ? 'border-slate-700 border-b-4 border-b-amber-400 bg-slate-900 text-amber-300 shadow-sm'
                : 'border-slate-800 border-b-2 border-b-transparent bg-slate-900/50 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <span className={isActive ? z.accentClass : ''}>{z.shortLabel}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                isActive
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
