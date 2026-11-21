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
      ? 'Base A'
      : unit.position?.zone === 'central'
        ? 'Central'
        : unit.position?.zone === 'base_b'
          ? 'Base B'
          : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg border p-1.5 text-left transition ${
        isSelected
          ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500'
          : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50'
      }`}
    >
      {/* Thumbnail */}
      <div
        className={`relative h-9 w-9 shrink-0 overflow-hidden rounded-md border-2 ${faction.border}`}
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
          <span className="truncate text-xs font-bold text-slate-950">{unit.name}</span>
          {unit.status === 'reserve' && (
            <span className="shrink-0 rounded bg-slate-200 px-1 py-0.5 text-[9px] font-bold text-slate-700">
              Reserve
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center justify-between text-[10px] font-semibold text-slate-600">
          <span>
            HP {unit.hp}/{unit.maxHp} • ATK {unit.atk}
          </span>
          {unit.position && zoneShort ? (
            <span className="flex items-center gap-0.5 text-orange-600">
              <Crosshair className="h-2.5 w-2.5" />
              {zoneShort} {formatCoordLabel(unit.position.x, unit.position.y)}
            </span>
          ) : (
            <span className="text-slate-400">Spirit Form</span>
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
    <aside className="flex w-[272px] shrink-0 flex-col overflow-y-auto border-r-2 border-slate-900 bg-white p-2.5">
      <div className="mb-2 flex items-center justify-between border-b border-slate-200 pb-1.5">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
          Board Roster
        </h2>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
          คลิกเพื่อ Locate
        </span>
      </div>

      {/* Team A */}
      <section className="mb-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold text-red-700">
          <Swords className="h-3.5 w-3.5" />
          <span>TEAM A — RED ({teamA.length})</span>
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
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold text-blue-700">
          <Shield className="h-3.5 w-3.5" />
          <span>TEAM B — BLUE ({teamB.length})</span>
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
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold text-stone-700">
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
