import { useState } from 'react';
import { CheckCircle2, Crosshair, Lock, Send, X } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import type { CommandActionType, TeamId } from '../../types/game';
import { formatCoordLabel } from '../../utils/assetHelper';
import { TileInspector } from '../board/TileInspector';

const ACTION_OPTIONS: { id: CommandActionType; label: string }[] = [
  { id: 'move', label: 'Move' },
  { id: 'attack', label: 'Attack' },
  { id: 'move_and_attack', label: 'Move+Atk' },
  { id: 'skill', label: 'Skill' },
  { id: 'np', label: 'NP' },
  { id: 'guard', label: 'Guard' },
  { id: 'explore', label: 'Explore/Shop' },
  { id: 'tag_out', label: 'Tag-Out' },
  { id: 'custom', label: 'Custom/CS' },
];

export function SecretCommandPanel() {
  const previewRole = useGameStore((s) => s.previewRole);
  const roomState = useGameStore((s) => s.roomState);
  const draftOrders = useGameStore((s) => s.draftOrders);
  const pickingOrderForUnitId = useGameStore((s) => s.pickingOrderForUnitId);
  const setDraftOrder = useGameStore((s) => s.setDraftOrder);
  const clearDraftOrderTarget = useGameStore((s) => s.clearDraftOrderTarget);
  const setPickingOrderForUnitId = useGameStore((s) => s.setPickingOrderForUnitId);
  const lockMasterTurn = useGameStore((s) => s.lockMasterTurn);
  const [submitting, setSubmitting] = useState(false);

  const teamId: TeamId = previewRole === 'master_b' ? 'team_b' : 'team_a';
  const team = roomState.teams[teamId];
  const isLocked = team.readyLocked;

  const activeServants = Object.values(roomState.units)
    .filter((u) => u.unitType === 'servant' && u.owner === teamId && u.status === 'active')
    .slice(0, 3);

  const handleLock = async () => {
    setSubmitting(true);
    try {
      await lockMasterTurn();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <aside className="flex w-[320px] shrink-0 flex-col overflow-y-auto border-l border-[#C8A253]/25 bg-[#111622] p-3 text-slate-100">
      <div className="mb-2 flex items-center justify-between border-b border-[#C8A253]/25 pb-1.5">
        <h2 className="font-display text-xs font-bold uppercase tracking-widest text-[#C8A253]">
          Secret Command Queue
        </h2>
        <span className="font-display text-[10px] font-bold text-slate-400">
          TURN {roomState.turn}
        </span>
      </div>

      {isLocked && (
        <div className="mb-2.5 flex items-center gap-2 rounded-[2px] border border-emerald-700/80 bg-emerald-950/40 px-2.5 py-2 text-xs font-semibold text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>ล็อกคำสั่งลับแล้ว — รออีกฝั่ง / รอ Ruler เฉลยผล...</span>
        </div>
      )}

      {/* 3 Active Servant Command Cards */}
      <div className="space-y-2.5">
        {activeServants.map((unit) => {
          const order = draftOrders[unit.id] ?? {
            unitId: unit.id,
            actionType: 'move' as CommandActionType,
            note: '',
          };
          const isPicking = pickingOrderForUnitId === unit.id;
          const targetUnit = order.targetUnitId
            ? roomState.units[order.targetUnitId]
            : null;

          return (
            <div
              key={unit.id}
              className={`rounded-[2px] border p-2 transition ${
                isPicking
                  ? 'border-[#C8A253] bg-[#C8A253]/12'
                  : 'border-slate-800 bg-[#090B10]'
              } ${isLocked ? 'opacity-75' : ''}`}
            >
              <div className="mb-1.5 flex items-center justify-between gap-1">
                <span className="font-display truncate text-xs font-bold text-[#E5C983]">
                  {unit.name}
                </span>
                {unit.position && (
                  <span className="text-[10px] font-semibold text-slate-400">
                    {unit.position.zone.toUpperCase()}{' '}
                    {formatCoordLabel(unit.position.x, unit.position.y)}
                  </span>
                )}
              </div>

              {/* Action Selector */}
              <div className="flex gap-1.5">
                <select
                  disabled={isLocked}
                  value={order.actionType}
                  onChange={(e) =>
                    setDraftOrder(unit.id, {
                      actionType: e.target.value as CommandActionType,
                    })
                  }
                  className="flex-1 rounded-[2px] border border-slate-700 bg-[#111622] px-2 py-1 text-[11px] font-semibold text-slate-100 focus:border-[#C8A253] focus:outline-none disabled:cursor-not-allowed"
                >
                  {ACTION_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* Pick Tile / Unit Button */}
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() =>
                    setPickingOrderForUnitId(isPicking ? null : unit.id)
                  }
                  className={`flex shrink-0 items-center gap-1 rounded-[2px] border px-2 py-1 text-[10.5px] font-bold transition disabled:cursor-not-allowed ${
                    isPicking
                      ? 'border-[#C8A253] bg-[#C8A253] text-[#090B10]'
                      : 'border-[#C8A253]/40 bg-[#111622] text-[#C8A253] hover:bg-[#C8A253]/15'
                  }`}
                >
                  <Crosshair className="h-3 w-3" />
                  <span>{isPicking ? 'จิ้มบนแมพ...' : 'Pick'}</span>
                </button>
              </div>

              {/* Selected Target Readout */}
              {order.targetPosition && (
                <div className="mt-1.5 flex items-center justify-between rounded-[2px] border border-[#C8A253]/30 bg-[#111622] px-2 py-1 text-[10.5px]">
                  <span className="truncate text-[#E5C983]">
                    เป้า: {order.targetPosition.zone.toUpperCase()}{' '}
                    {formatCoordLabel(order.targetPosition.x, order.targetPosition.y)}
                    {targetUnit ? ` (${targetUnit.name})` : ''}
                  </span>
                  {!isLocked && (
                    <button
                      type="button"
                      onClick={() => clearDraftOrderTarget(unit.id)}
                      className="ml-1 text-slate-400 hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}

              {/* 1-Line Note Input */}
              <input
                type="text"
                disabled={isLocked}
                value={order.note}
                onChange={(e) => setDraftOrder(unit.id, { note: e.target.value })}
                placeholder="ระบุสกิล / โฮกุ / ไอเทม / เรย์จู..."
                className="mt-1.5 w-full rounded-[2px] border border-slate-800 bg-[#111622] px-2 py-1 text-[11px] text-slate-200 placeholder:text-slate-600 focus:border-[#C8A253] focus:outline-none disabled:cursor-not-allowed"
              />
            </div>
          );
        })}

        {activeServants.length === 0 && (
          <div className="rounded-[2px] border border-dashed border-slate-800 bg-[#090B10]/60 p-4 text-center text-xs text-slate-500">
            รอส่ง Servant ลงสนามเพื่อสั่งการลับ
          </div>
        )}
      </div>

      {/* LOCK TURN Button */}
      <button
        type="button"
        disabled={isLocked || submitting || activeServants.length === 0}
        onClick={handleLock}
        className={`mt-3 flex w-full items-center justify-center gap-2 rounded-[2px] border py-2.5 font-display text-xs font-bold tracking-widest transition ${
          isLocked
            ? 'cursor-not-allowed border-emerald-800 bg-emerald-950/40 text-emerald-300'
            : 'border-[#C8A253]/60 bg-[#B91C1C] text-slate-100 hover:bg-red-700 disabled:opacity-50'
        }`}
      >
        {isLocked ? <Lock className="h-4 w-4" /> : <Send className="h-4 w-4" />}
        <span>
          {isLocked
            ? 'TURN LOCKED (READY)'
            : submitting
              ? 'SENDING ORDERS...'
              : 'LOCK TURN (READY)'}
        </span>
      </button>

      {/* Tile Inspector below Command Queue */}
      <TileInspector />
    </aside>
  );
}
