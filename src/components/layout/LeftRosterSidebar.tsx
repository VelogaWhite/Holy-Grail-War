import { useState } from 'react';
import { Crosshair, Shield, Skull, Swords } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import type { BoardUnit } from '../../types/game';
import {
  formatCoordLabel,
  getFactionStyle,
  getInitials,
  resolveAssetUrl,
} from '../../utils/assetHelper';

function MiniUnitRow({
  unit,
  isSelected,
  onClick,
}: {
  unit: BoardUnit;
  isSelected: boolean;
  onClick: () => void;
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
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg border p-1.5 text-left transition ${
        isSelected
          ? 'border-amber-400 bg-amber-400/10 ring-1 ring-amber-400/70'
          : 'border-slate-800 bg-slate-950/60 hover:border-slate-600 hover:bg-slate-800/70'
      }`}
    >
      {/* Thumbnail */}
      <div
        className={`relative h-8 w-8 shrink-0 overflow-hidden rounded-md border-2 ${faction.border}`}
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
            className={`flex h-full w-full items-center justify-center text-[10px] font-black text-white ${faction.bg}`}
          >
            {getInitials(unit.name)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className="truncate text-[11px] font-bold text-slate-100">{unit.name}</span>
          {unit.status === 'reserve' && (
            <span className="shrink-0 rounded bg-slate-800 px-1 py-0.5 text-[9px] font-bold text-slate-400">
              Reserve
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center justify-between text-[10px] font-semibold text-slate-400">
          <span>
            HP {unit.hp}/{unit.maxHp} • ATK {unit.atk}
          </span>
          {unit.position && zoneShort ? (
            <span className="flex items-center gap-0.5 text-amber-400">
              <Crosshair className="h-2.5 w-2.5" />
              {zoneShort} {formatCoordLabel(unit.position.x, unit.position.y)}
            </span>
          ) : (
            <span className="text-slate-500">Spirit</span>
          )}
        </div>
      </div>
    </button>
  );
}

export function LeftRosterSidebar() {
  const units = useGameStore((s) => s.roomState.units);
  const selectedUnitId = useGameStore((s) => s.selectedUnitId);
  const locateUnit = useGameStore((s) => s.locateUnit);

  const allUnits = Object.values(units);
  const teamA = allUnits.filter((u) => u.owner === 'team_a');
  const teamB = allUnits.filter((u) => u.owner === 'team_b');
  const monsters = allUnits.filter((u) => u.owner === 'neutral');

  return (
    <aside className="flex w-[250px] shrink-0 flex-col overflow-y-auto border-r border-slate-700/80 bg-slate-900 p-2.5 text-slate-100">
      <div className="mb-2 flex items-center justify-between border-b border-slate-800 pb-1.5">
        <h2 className="text-xs font-black uppercase tracking-wider text-amber-400">
          Board Roster
        </h2>
        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
          คลิก Locate
        </span>
      </div>

      {/* Team A */}
      <section className="mb-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold text-rose-400">
          <Swords className="h-3.5 w-3.5" />
          <span>TEAM A — ENZO ({teamA.length})</span>
        </div>
        <div className="space-y-1">
          {teamA.map((u) => (
            <MiniUnitRow
              key={u.id}
              unit={u}
              isSelected={selectedUnitId === u.id}
              onClick={() => locateUnit(u.id)}
            />
          ))}
        </div>
      </section>

      {/* Team B */}
      <section className="mb-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold text-sky-400">
          <Shield className="h-3.5 w-3.5" />
          <span>TEAM B — SHINTO ({teamB.length})</span>
        </div>
        <div className="space-y-1">
          {teamB.map((u) => (
            <MiniUnitRow
              key={u.id}
              unit={u}
              isSelected={selectedUnitId === u.id}
              onClick={() => locateUnit(u.id)}
            />
          ))}
        </div>
      </section>

      {/* PvE Monsters */}
      <section>
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold text-amber-300">
          <Skull className="h-3.5 w-3.5" />
          <span>NEUTRAL PvE ({monsters.length})</span>
        </div>
        <div className="space-y-1">
          {monsters.map((u) => (
            <MiniUnitRow
              key={u.id}
              unit={u}
              isSelected={selectedUnitId === u.id}
              onClick={() => locateUnit(u.id)}
            />
          ))}
        </div>
      </section>
    </aside>
  );
}
