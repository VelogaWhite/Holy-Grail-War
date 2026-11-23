import { useState } from 'react';
import {
  ArrowLeftRight,
  Crown,
  Minus,
  PackagePlus,
  Plus,
  RotateCcw,
  Skull,
  Sparkles,
  Swords,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { ITEMS, ITEMS_BY_ID, MONSTERS } from '../../data';
import { useGameStore } from '../../store/useGameStore';
import type { TeamId } from '../../types/game';
import { LeftRosterSidebar } from '../layout/LeftRosterSidebar';
import { MasterRosterSidebar } from '../master/MasterRosterSidebar';

function ResourceCounterRow({
  label,
  value,
  maxLabel,
  onMinus,
  onPlus,
}: {
  label: string;
  value: number;
  maxLabel?: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="font-medium text-slate-300">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onMinus}
          className="flex h-5 w-5 items-center justify-center rounded-[2px] border border-slate-700 bg-[#090B10] text-slate-300 hover:border-[#C8A253] hover:text-white"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="min-w-[34px] text-center font-mono text-xs font-bold text-slate-100">
          {value}
          {maxLabel ? <span className="text-[10px] text-slate-500">{maxLabel}</span> : null}
        </span>
        <button
          type="button"
          onClick={onPlus}
          className="flex h-5 w-5 items-center justify-center rounded-[2px] border border-slate-700 bg-[#090B10] text-slate-300 hover:border-[#C8A253] hover:text-white"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function TeamOverrideBox({ teamId }: { teamId: TeamId }) {
  const team = useGameStore((s) => s.roomState.teams[teamId]);
  const adjustTeamResource = useGameStore((s) => s.adjustTeamResource);
  const giveTeamItem = useGameStore((s) => s.giveTeamItem);
  const removeTeamItem = useGameStore((s) => s.removeTeamItem);
  const [selectedItem, setSelectedItem] = useState(ITEMS[0]?.id ?? '');

  const isTeamA = teamId === 'team_a';

  return (
    <div
      className={`rounded-[2px] border p-2 ${
        isTeamA
          ? 'border-[#B91C1C]/60 bg-[#B91C1C]/8'
          : 'border-sky-700/60 bg-sky-950/20'
      }`}
    >
      <div className="mb-1.5 flex items-center justify-between border-b border-slate-800 pb-1">
        <span
          className={`font-display text-[11px] font-bold tracking-wider ${
            isTeamA ? 'text-red-400' : 'text-sky-400'
          }`}
        >
          {isTeamA ? 'TEAM A · ENZO' : 'TEAM B · SHINTO'}
        </span>
        <Swords className={`h-3 w-3 ${isTeamA ? 'text-[#B91C1C]' : 'text-sky-400'}`} />
      </div>

      <div className="space-y-1.5">
        <ResourceCounterRow
          label="Mana"
          value={team.mana}
          onMinus={() => adjustTeamResource(teamId, 'mana', -1)}
          onPlus={() => adjustTeamResource(teamId, 'mana', 1)}
        />
        <ResourceCounterRow
          label="QP"
          value={team.qp}
          onMinus={() => adjustTeamResource(teamId, 'qp', -1)}
          onPlus={() => adjustTeamResource(teamId, 'qp', 1)}
        />
        <ResourceCounterRow
          label="Command Spells"
          value={team.commandSpells}
          maxLabel="/3"
          onMinus={() => adjustTeamResource(teamId, 'commandSpells', -1)}
          onPlus={() => adjustTeamResource(teamId, 'commandSpells', 1)}
        />
        <ResourceCounterRow
          label="Kills (Wipeout)"
          value={team.defeatedCount}
          maxLabel="/6"
          onMinus={() => adjustTeamResource(teamId, 'defeatedCount', -1)}
          onPlus={() => adjustTeamResource(teamId, 'defeatedCount', 1)}
        />
      </div>

      {/* Give Item */}
      <div className="mt-2 border-t border-slate-800/80 pt-2">
        <div className="flex gap-1">
          <select
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            className="min-w-0 flex-1 rounded-[2px] border border-slate-700 bg-[#090B10] px-1.5 py-1 text-[10px] text-slate-200 focus:border-[#C8A253] focus:outline-none"
          >
            {ITEMS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.qpCost} QP)
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => selectedItem && giveTeamItem(teamId, selectedItem)}
            title="มอบไอเทมให้ทีมนี้"
            className="flex shrink-0 items-center gap-0.5 rounded-[2px] border border-[#C8A253]/50 bg-[#090B10] px-1.5 py-1 text-[10px] font-bold text-[#C8A253] hover:bg-[#C8A253]/15"
          >
            <PackagePlus className="h-3 w-3" />
          </button>
        </div>

        {team.inventory.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {team.inventory.map((itemId, idx) => (
              <span
                key={`${itemId}-${idx}`}
                className="flex items-center gap-1 rounded-[2px] border border-slate-700 bg-[#090B10] px-1.5 py-0.5 text-[9.5px] text-slate-300"
              >
                <span className="max-w-[90px] truncate">
                  {ITEMS_BY_ID[itemId]?.name ?? itemId}
                </span>
                <button
                  type="button"
                  onClick={() => removeTeamItem(teamId, idx)}
                  className="text-slate-500 hover:text-red-400"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function RulerToolsSidebar() {
  const previewRole = useGameStore((s) => s.previewRole);
  const pendingSpawnMonsterId = useGameStore((s) => s.pendingSpawnMonsterId);
  const setPendingSpawnMonsterId = useGameStore((s) => s.setPendingSpawnMonsterId);
  const spawnGreaterGrail = useGameStore((s) => s.spawnGreaterGrail);
  const resetAllClearedTiles = useGameStore((s) => s.resetAllClearedTiles);
  const resetSeat = useGameStore((s) => s.resetSeat);
  const swapMasterSeatsAction = useGameStore((s) => s.swapMasterSeatsAction);
  const [tab, setTab] = useState<'roster' | 'tools'>('roster');

  // Master view gets MasterRosterSidebar (Active / Reserve / Inventory)
  if (previewRole !== 'ruler') {
    return <MasterRosterSidebar />;
  }

  return (
    <div className="flex w-[248px] shrink-0 flex-col overflow-hidden border-r border-[#C8A253]/25 bg-[#111622] text-slate-100">
      {/* Top 2-Tab Switcher (Roster | GM Tools) */}
      <div className="grid shrink-0 grid-cols-2 border-b border-[#C8A253]/25 bg-[#090B10]">
        <button
          type="button"
          onClick={() => setTab('roster')}
          className={`flex items-center justify-center gap-1.5 border-b-2 py-2 font-display text-[11px] font-bold tracking-wider transition ${
            tab === 'roster'
              ? 'border-[#C8A253] bg-[#111622] text-[#E5C983]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Roster</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('tools')}
          className={`flex items-center justify-center gap-1.5 border-b-2 py-2 font-display text-[11px] font-bold tracking-wider transition ${
            tab === 'tools'
              ? 'border-[#C8A253] bg-[#111622] text-[#E5C983]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wrench className="h-3.5 w-3.5" />
          <span>GM Tools</span>
        </button>
      </div>

      {tab === 'roster' ? (
        <div className="min-h-0 flex-1 overflow-hidden [&>aside]:h-full [&>aside]:w-full [&>aside]:border-r-0">
          <LeftRosterSidebar />
        </div>
      ) : (
        <aside className="flex-1 space-y-3 overflow-y-auto p-2.5">
          {/* Resource Overrides */}
          <TeamOverrideBox teamId="team_a" />
          <TeamOverrideBox teamId="team_b" />

          {/* Spawn Monster Picker */}
          <div className="rounded-[2px] border border-[#C8A253]/30 bg-[#090B10]/80 p-2">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1 font-display text-[11px] font-bold tracking-wider text-[#E5C983]">
                <Skull className="h-3.5 w-3.5 text-[#C8A253]" />
                SPAWN PvE MONSTER
              </span>
              {pendingSpawnMonsterId && (
                <button
                  type="button"
                  onClick={() => setPendingSpawnMonsterId(null)}
                  className="text-[10px] font-bold text-red-400 hover:underline"
                >
                  ยกเลิก
                </button>
              )}
            </div>
            <p className="mb-1.5 text-[10px] text-slate-400">
              {pendingSpawnMonsterId
                ? 'คลิกช่องว่างบนกระดานเพื่อวางมอนสเตอร์ที่เลือก'
                : 'เลือกมอนสเตอร์แล้วคลิกวางบนช่อง (หรือคลิกขวาที่ช่องบนกระดาน)'}
            </p>
            <div className="space-y-1">
              {MONSTERS.map((mon) => {
                const active = pendingSpawnMonsterId === mon.id;
                return (
                  <button
                    key={mon.id}
                    type="button"
                    onClick={() => setPendingSpawnMonsterId(active ? null : mon.id)}
                    className={`flex w-full items-center justify-between rounded-[2px] border px-2 py-1 text-left text-[10.5px] font-semibold transition ${
                      active
                        ? 'border-[#C8A253] bg-[#C8A253]/20 text-[#E5C983]'
                        : 'border-slate-800 bg-[#111622] text-slate-300 hover:border-[#C8A253]/40'
                    }`}
                  >
                    <span className="truncate">{mon.name}</span>
                    <span className="shrink-0 font-mono text-[9.5px] text-slate-400">
                      T{mon.tier} · {mon.hp}HP
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Map Actions */}
          <div className="space-y-1.5 rounded-[2px] border border-[#C8A253]/25 bg-[#090B10]/80 p-2">
            <div className="flex items-center gap-1 font-display text-[11px] font-bold tracking-wider text-[#C8A253]">
              <Sparkles className="h-3.5 w-3.5" />
              QUICK MAP TOOLS
            </div>

            <button
              type="button"
              onClick={spawnGreaterGrail}
              className="flex w-full items-center justify-center gap-1.5 rounded-[2px] border border-[#C8A253]/60 bg-[#C8A253]/15 py-1.5 text-[11px] font-bold text-[#E5C983] transition hover:bg-[#C8A253]/25"
            >
              <Crown className="h-3.5 w-3.5" />
              <span>Spawn Greater Grail (Central)</span>
            </button>

            <button
              type="button"
              onClick={resetAllClearedTiles}
              className="flex w-full items-center justify-center gap-1.5 rounded-[2px] border border-slate-700 bg-[#111622] py-1.5 text-[11px] font-semibold text-slate-300 transition hover:border-[#C8A253]/50 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset All Cleared Tiles</span>
            </button>

            <button
              type="button"
              onClick={() => swapMasterSeatsAction()}
              title="สลับฝั่งผู้เล่น Master A ↔ Master B (ใช้สะดวกหลังทอย 1d6 เลือกฝั่งในเฟส Draft)"
              className="flex w-full items-center justify-center gap-1.5 rounded-[2px] border border-[#C8A253]/50 bg-[#111622] py-1.5 text-[11px] font-bold text-[#E5C983] transition hover:bg-[#C8A253]/15"
            >
              <ArrowLeftRight className="h-3.5 w-3.5 text-[#C8A253]" />
              <span>Swap Master A ↔ B</span>
            </button>

            <div className="grid grid-cols-2 gap-1 pt-1">
              <button
                type="button"
                onClick={() => resetSeat('master_a')}
                title="ล้างที่นั่ง Master A เผื่อเพื่อนเปลี่ยนเครื่อง/หลุด"
                className="rounded-[2px] border border-red-900/60 bg-[#111622] py-1 text-[10px] font-semibold text-red-300 hover:bg-red-950/50"
              >
                Reset Seat A
              </button>
              <button
                type="button"
                onClick={() => resetSeat('master_b')}
                title="ล้างที่นั่ง Master B เผื่อเพื่อนเปลี่ยนเครื่อง/หลุด"
                className="rounded-[2px] border border-sky-900/60 bg-[#111622] py-1 text-[10px] font-semibold text-sky-300 hover:bg-sky-950/50"
              >
                Reset Seat B
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
