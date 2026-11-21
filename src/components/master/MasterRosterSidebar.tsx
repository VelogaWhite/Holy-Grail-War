import { useState } from 'react';
import { Crosshair, Package, Shield, Sparkles, Swords } from 'lucide-react';
import { ITEMS_BY_ID } from '../../data';
import { useGameStore } from '../../store/useGameStore';
import type { BoardUnit, TeamId } from '../../types/game';
import {
  formatCoordLabel,
  getFactionStyle,
  getInitials,
  resolveAssetUrl,
} from '../../utils/assetHelper';

function MasterUnitCard({
  unit,
  isSelected,
  onLocate,
}: {
  unit: BoardUnit;
  isSelected: boolean;
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
    <button
      type="button"
      onClick={onLocate}
      className={`flex w-full items-center gap-2 rounded-[2px] border p-1.5 text-left transition ${
        isSelected
          ? 'border-[#C8A253] bg-[#C8A253]/12'
          : 'border-slate-800 bg-[#090B10]/80 hover:border-[#C8A253]/40'
      }`}
    >
      <div
        className={`relative h-9 w-9 shrink-0 overflow-hidden rounded-[2px] border-2 ${faction.border}`}
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

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className="font-display truncate text-[11px] font-bold text-slate-100">
            {unit.name}
          </span>
          {unit.npReady && (
            <span className="rounded-[2px] bg-[#B91C1C] px-1 py-px text-[8px] font-bold text-white">
              NP
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center justify-between text-[10px] text-slate-400">
          <span>
            HP {unit.hp}/{unit.maxHp} · ATK {unit.atk} · MOV {unit.mov}
          </span>
          {unit.position && zoneShort ? (
            <span className="flex items-center gap-0.5 font-bold text-[#C8A253]">
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

export function MasterRosterSidebar() {
  const previewRole = useGameStore((s) => s.previewRole);
  const roomState = useGameStore((s) => s.roomState);
  const selectedUnitId = useGameStore((s) => s.selectedUnitId);
  const locateUnit = useGameStore((s) => s.locateUnit);

  const teamId: TeamId = previewRole === 'master_b' ? 'team_b' : 'team_a';
  const team = roomState.teams[teamId];
  const isTeamA = teamId === 'team_a';

  const myServants = Object.values(roomState.units).filter(
    (u) => u.unitType === 'servant' && u.owner === teamId
  );
  const activeServants = myServants.filter((u) => u.status === 'active');
  const reserveServants = myServants.filter((u) => u.status === 'reserve');
  const defeatedServants = myServants.filter((u) => u.status === 'defeated');

  return (
    <aside className="flex w-[248px] shrink-0 flex-col overflow-y-auto border-r border-[#C8A253]/25 bg-[#111622] p-2.5 text-slate-100">
      <div className="mb-2 flex items-center justify-between border-b border-[#C8A253]/25 pb-1.5">
        <div className="flex items-center gap-1.5">
          {isTeamA ? (
            <Swords className="h-3.5 w-3.5 text-red-400" />
          ) : (
            <Shield className="h-3.5 w-3.5 text-sky-400" />
          )}
          <h2
            className={`font-display text-xs font-bold uppercase tracking-wider ${
              isTeamA ? 'text-red-400' : 'text-sky-400'
            }`}
          >
            {isTeamA ? 'Master A' : 'Master B'}
          </h2>
        </div>
        <span className="text-[10px] text-slate-400">กองทัพของคุณ</span>
      </div>

      {/* Active Servants (3) */}
      <section className="mb-3">
        <div className="mb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-[#C8A253]">
          Active Servants ({activeServants.length}/3)
        </div>
        <div className="space-y-1.5">
          {activeServants.map((u) => (
            <MasterUnitCard
              key={u.id}
              unit={u}
              isSelected={selectedUnitId === u.id}
              onLocate={() => locateUnit(u.id)}
            />
          ))}
          {activeServants.length === 0 && (
            <p className="text-[11px] italic text-slate-500">ยังไม่มีตัวจริงบนกระดาน</p>
          )}
        </div>
      </section>

      {/* Reserve Servants (3) */}
      <section className="mb-3">
        <div className="mb-1.5 flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
          <Sparkles className="h-3 w-3 text-[#C8A253]" />
          <span>Reserve · Spirit Form ({reserveServants.length})</span>
        </div>
        <div className="space-y-1">
          {reserveServants.map((u) => (
            <MasterUnitCard
              key={u.id}
              unit={u}
              isSelected={selectedUnitId === u.id}
              onLocate={() => locateUnit(u.id)}
            />
          ))}
        </div>
      </section>

      {/* Defeated */}
      {defeatedServants.length > 0 && (
        <section className="mb-3">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-red-400/80">
            Defeated ({defeatedServants.length})
          </div>
          <div className="space-y-1 opacity-60">
            {defeatedServants.map((u) => (
              <div
                key={u.id}
                className="rounded-[2px] border border-slate-800 bg-[#090B10] px-2 py-1 text-[10.5px] line-through text-slate-400"
              >
                {u.name}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Inventory (Mystic Codes) */}
      <section className="mt-auto border-t border-slate-800 pt-2.5">
        <div className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-[#C8A253]">
          <Package className="h-3.5 w-3.5" />
          <span>Mystic Codes ({team.inventory.length})</span>
        </div>
        {team.inventory.length > 0 ? (
          <div className="space-y-1">
            {team.inventory.map((itemId, idx) => {
              const item = ITEMS_BY_ID[itemId];
              return (
                <div
                  key={`${itemId}-${idx}`}
                  title={item?.effectDesc}
                  className="rounded-[2px] border border-slate-800 bg-[#090B10] p-1.5"
                >
                  <div className="text-[11px] font-bold text-slate-200">
                    {item?.name ?? itemId}
                  </div>
                  {item && (
                    <p className="mt-0.5 text-[10px] leading-snug text-slate-400">
                      {item.effectDesc}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[11px] italic text-slate-500">ไม่มีไอเทมในกระเป๋า</p>
        )}
      </section>
    </aside>
  );
}
