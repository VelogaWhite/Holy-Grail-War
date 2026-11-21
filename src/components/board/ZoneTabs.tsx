import { MAP_DATA } from '../../data';
import { useGameStore } from '../../store/useGameStore';
import type { ZoneId } from '../../types/game';

const ZONE_ORDER: { id: ZoneId; shortLabel: string; accentClass: string }[] = [
  { id: 'base_a', shortLabel: 'Base A (Red)', accentClass: 'text-red-700' },
  { id: 'central', shortLabel: 'Central Fuyuki', accentClass: 'text-slate-950' },
  { id: 'base_b', shortLabel: 'Base B (Blue)', accentClass: 'text-blue-700' },
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
    <div className="flex w-full max-w-[600px] items-center justify-center gap-2">
      {ZONE_ORDER.map((z) => {
        const isActive = activeZone === z.id;
        const count = countInZone(z.id);
        return (
          <button
            key={z.id}
            type="button"
            onClick={() => setActiveZone(z.id)}
            title={MAP_DATA.zones[z.id].name}
            className={`flex flex-1 items-center justify-center gap-2 rounded-t-lg border-x border-t px-3 py-1.5 text-xs font-bold transition ${
              isActive
                ? 'border-slate-900 border-b-4 border-b-orange-500 bg-white text-slate-950 shadow-xs'
                : 'border-slate-300 border-b-2 border-b-transparent bg-slate-100 text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <span className={isActive ? z.accentClass : ''}>{z.shortLabel}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                isActive
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-200 text-slate-700'
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
