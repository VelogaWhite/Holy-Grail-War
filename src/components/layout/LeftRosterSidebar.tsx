import { useMemo, useState } from 'react';
import { Crosshair, Shield, Skull, Swords } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import type { BoardUnit } from '../../types/game';
import {
  formatCoordLabel,
  getFactionStyle,
  getInitials,
  resolveAssetUrl,
} from '../../utils/assetHelper';

type RosterFilter = 'all' | 'zone' | 'active' | 'reserve';

function MiniUnitRow({
  unit,
  isSelected,
  onSelect,
  onLocate,
}: {
  unit: BoardUnit;
  isSelected: boolean;
  onSelect: () => void;
  onLocate: () => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const faction = getFactionStyle(unit.owner);
  const imgUrl = resolveAssetUrl(unit.image);

  const zoneShort =
    unit.position?.zone === 'base_a'
      ? 'Enzo'
      : unit.position?.zone === 'central'
        ? 'Central'
        : unit.position?.zone === 'base_b'
          ? 'Shinto'
          : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onLocate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onLocate();
        }
      }}
      className={`flex w-full cursor-pointer items-center gap-2 rounded-[2px] border p-1.5 text-left transition ${
        isSelected
          ? 'border-[#C8A253]/70 bg-[#C8A253]/10'
          : 'border-slate-800/80 bg-[#090B10]/70 hover:border-[#C8A253]/30 hover:bg-[#090B10]'
      }`}
    >
      {/* Thumbnail */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        className={`relative h-8 w-8 shrink-0 overflow-hidden rounded-[2px] border-2 ${faction.border}`}
      >
        {imgUrl && !imgErr ? (
          <img
            src={imgUrl}
            alt={unit.name}
            onError={() => setImgErr(true)}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center font-display text-[10px] font-bold text-white ${faction.bg}`}
          >
            {getInitials(unit.name)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className="font-display truncate text-[11px] font-bold tracking-wide text-slate-100">
            {unit.name}
          </span>
          {unit.status === 'reserve' && (
            <span className="shrink-0 rounded-[2px] border border-slate-700 bg-slate-900 px-1 py-px text-[8.5px] font-semibold text-slate-400">
              Reserve
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-1 text-[10px] font-medium text-slate-400">
          <span>
            HP {unit.hp}/{unit.maxHp} · ATK {unit.atk}
          </span>
          {unit.position && zoneShort ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLocate();
              }}
              title={`สลับไปโซน ${zoneShort} (${formatCoordLabel(unit.position.x, unit.position.y)})`}
              className="flex shrink-0 items-center gap-0.5 rounded-[2px] border border-[#C8A253]/35 bg-[#111622] px-1 py-px text-[9.5px] font-bold text-[#C8A253] transition hover:border-[#C8A253] hover:bg-[#C8A253]/20"
            >
              <Crosshair className="h-2.5 w-2.5" />
              <span>
                {zoneShort} {formatCoordLabel(unit.position.x, unit.position.y)}
              </span>
            </button>
          ) : (
            <span className="text-[9.5px] text-slate-600">Spirit Form</span>
          )}
        </div>
      </div>
    </div>
  );
}

const FILTER_OPTIONS: { id: RosterFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'zone', label: 'แมพนี้' },
  { id: 'active', label: 'Active' },
  { id: 'reserve', label: 'Reserve' },
];

export function LeftRosterSidebar() {
  const units = useGameStore((s) => s.roomState.units);
  const activeZone = useGameStore((s) => s.activeZone);
  const selectedUnitId = useGameStore((s) => s.selectedUnitId);
  const selectUnit = useGameStore((s) => s.selectUnit);
  const locateUnit = useGameStore((s) => s.locateUnit);
  const [filter, setFilter] = useState<RosterFilter>('all');

  const filteredUnits = useMemo(() => {
    const all = Object.values(units);
    switch (filter) {
      case 'zone':
        return all.filter(
          (u) => u.status === 'active' && u.position?.zone === activeZone
        );
      case 'active':
        return all.filter((u) => u.status === 'active');
      case 'reserve':
        return all.filter((u) => u.status === 'reserve');
      default:
        return all;
    }
  }, [units, filter, activeZone]);

  const teamA = filteredUnits.filter((u) => u.owner === 'team_a');
  const teamB = filteredUnits.filter((u) => u.owner === 'team_b');
  const monsters = filteredUnits.filter((u) => u.owner === 'neutral');

  return (
    <aside className="flex w-[248px] shrink-0 flex-col overflow-y-auto border-r border-[#C8A253]/25 bg-[#111622] p-2.5 text-slate-100">
      <div className="mb-2 flex items-center justify-between border-b border-[#C8A253]/25 pb-1.5">
        <h2 className="font-display text-xs font-bold uppercase tracking-widest text-[#C8A253]">
          Board Roster
        </h2>
        <span className="rounded-[2px] border border-slate-800 bg-[#090B10] px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
          {filteredUnits.length} ยูนิต
        </span>
      </div>

      {/* Filter Bar (All / แมพนี้ / Active / Reserve) */}
      <div className="mb-2.5 grid grid-cols-4 gap-1 rounded-[2px] border border-slate-800 bg-[#090B10] p-0.5">
        {FILTER_OPTIONS.map((opt) => {
          const isActive = filter === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setFilter(opt.id)}
              className={`rounded-[2px] py-1 text-[10px] font-bold transition ${
                isActive
                  ? 'bg-[#B91C1C] text-slate-100'
                  : 'text-slate-400 hover:bg-[#111622] hover:text-slate-200'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Team A */}
      {teamA.length > 0 && (
        <section className="mb-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-red-400">
            <Swords className="h-3.5 w-3.5 text-[#B91C1C]" />
            <span className="font-display tracking-wider">TEAM A · ENZO ({teamA.length})</span>
          </div>
          <div className="space-y-1">
            {teamA.map((u) => (
              <MiniUnitRow
                key={u.id}
                unit={u}
                isSelected={selectedUnitId === u.id}
                onSelect={() => selectUnit(u.id)}
                onLocate={() => locateUnit(u.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Team B */}
      {teamB.length > 0 && (
        <section className="mb-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-sky-400">
            <Shield className="h-3.5 w-3.5" />
            <span className="font-display tracking-wider">TEAM B · SHINTO ({teamB.length})</span>
          </div>
          <div className="space-y-1">
            {teamB.map((u) => (
              <MiniUnitRow
                key={u.id}
                unit={u}
                isSelected={selectedUnitId === u.id}
                onSelect={() => selectUnit(u.id)}
                onLocate={() => locateUnit(u.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* PvE Monsters */}
      {monsters.length > 0 && (
        <section>
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-[#C8A253]">
            <Skull className="h-3.5 w-3.5" />
            <span className="font-display tracking-wider">NEUTRAL PvE ({monsters.length})</span>
          </div>
          <div className="space-y-1">
            {monsters.map((u) => (
              <MiniUnitRow
                key={u.id}
                unit={u}
                isSelected={selectedUnitId === u.id}
                onSelect={() => selectUnit(u.id)}
                onLocate={() => locateUnit(u.id)}
              />
            ))}
          </div>
        </section>
      )}

      {filteredUnits.length === 0 && (
        <div className="py-8 text-center text-xs text-slate-500">
          ไม่มียูนิตในตัวกรองนี้
        </div>
      )}
    </aside>
  );
}
