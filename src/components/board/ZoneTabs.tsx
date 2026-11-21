import { MAP_DATA } from '../../data';
import { useGameStore } from '../../store/useGameStore';
import type { ZoneId } from '../../types/game';

const ZONE_ORDER: { id: ZoneId; shortLabel: string; accentClass: string }[] = [
  { id: 'base_a', shortLabel: 'Base A · Mount Enzo', accentClass: 'text-red-300' },
  { id: 'central', shortLabel: 'Central Fuyuki', accentClass: 'text-[#E5C983]' },
  { id: 'base_b', shortLabel: 'Base B · Shinto City', accentClass: 'text-sky-300' },
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
    <div className="flex w-full items-center justify-center gap-1.5">
      {ZONE_ORDER.map((z) => {
        const isActive = activeZone === z.id;
        const count = countInZone(z.id);
        return (
          <button
            key={z.id}
            type="button"
            onClick={() => setActiveZone(z.id)}
            title={MAP_DATA.zones[z.id].name}
            className={`flex flex-1 items-center justify-center gap-2 rounded-t-[2px] border-x border-t px-3 py-1 text-xs font-bold transition ${
              isActive
                ? 'border-[#C8A253]/40 border-b-2 border-b-[#C8A253] bg-[#111622] text-slate-100'
                : 'border-slate-800/80 border-b-2 border-b-transparent bg-[#111622]/40 text-slate-400 hover:bg-[#111622]/80 hover:text-slate-200'
            }`}
          >
            <span className={`font-display tracking-wide ${isActive ? z.accentClass : ''}`}>
              {z.shortLabel}
            </span>
            <span
              className={`rounded-[2px] px-1.5 py-px text-[10px] font-bold ${
                isActive
                  ? 'bg-[#B91C1C] text-slate-100'
                  : 'bg-slate-800/80 text-slate-400'
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
