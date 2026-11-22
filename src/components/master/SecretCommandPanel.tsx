import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Crosshair,
  Lock,
  Send,
  Sparkles,
  Unlock,
  X,
  Zap,
} from 'lucide-react';
import { SERVANTS_BY_ID } from '../../data';
import { useGameStore } from '../../store/useGameStore';
import type { CommandActionType, TeamId } from '../../types/game';
import { formatCoordLabel } from '../../utils/assetHelper';
import { formatMpCost } from '../../utils/gridMath';
import { getDisplayUnitName } from '../../utils/visibilityHelper';
import { TileInspector } from '../board/TileInspector';

const ACTION_OPTIONS: { id: CommandActionType; label: string }[] = [
  { id: 'move', label: 'Move' },
  { id: 'attack', label: 'Attack' },
  { id: 'move_and_attack', label: 'Move+Atk' },
  { id: 'np', label: 'NP (Noble Phantasm)' },
  { id: 'guard', label: 'Guard' },
  { id: 'explore', label: 'Explore/Shop' },
  { id: 'tag_out', label: 'Tag-Out (1M)' },
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
  const locateUnit = useGameStore((s) => s.locateUnit);
  const lockMasterTurn = useGameStore((s) => s.lockMasterTurn);
  const [submitting, setSubmitting] = useState(false);

  const teamId: TeamId = previewRole === 'master_b' ? 'team_b' : 'team_a';
  const team = roomState.teams[teamId];
  const isLocked = team.readyLocked;

  const activeServants = Object.values(roomState.units)
    .filter((u) => u.unitType === 'servant' && u.owner === teamId && u.status === 'active')
    .slice(0, 3);

  // Estimate total Mana usage for this turn (Skill Bonus Action + NP + Tag-Out)
  const estimatedMana = activeServants.reduce((sum, unit) => {
    const order = draftOrders[unit.id];
    const tpl = SERVANTS_BY_ID[unit.templateId];
    if (!order || !tpl) return sum;
    const cd = unit.skillCooldown ?? 0;
    let cost = 0;
    if (order.useSkill && cd === 0) cost += tpl.skillCost;
    if (order.actionType === 'np') cost += tpl.npCost;
    if (order.actionType === 'tag_out') cost += 1;
    return sum + cost;
  }, 0);

  const isManaOverBudget = estimatedMana > team.mana;

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
          const tpl = SERVANTS_BY_ID[unit.templateId];
          const cd = unit.skillCooldown ?? 0;
          const isPicking = pickingOrderForUnitId === unit.id;
          const targetUnit = order.targetUnitId
            ? roomState.units[order.targetUnitId]
            : null;
          const isOverRangeTarget = Boolean(
            order.targetPosition &&
              order.overrideMoveRange &&
              order.estimatedMoveCost === null
          );

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

              {/* Bonus Action: Skill Toggle */}
              {tpl && (
                <div className="mb-1.5">
                  <button
                    type="button"
                    disabled={isLocked || cd > 0}
                    title={tpl.skillDesc}
                    onClick={() =>
                      setDraftOrder(unit.id, { useSkill: !order.useSkill })
                    }
                    className={`flex w-full items-center justify-between gap-1.5 rounded-[2px] border px-2 py-1 text-left text-[10.5px] font-bold transition ${
                      cd > 0
                        ? 'cursor-not-allowed border-slate-800 bg-slate-900/70 text-slate-500'
                        : order.useSkill
                          ? 'border-violet-500/80 bg-violet-950/60 text-violet-200 shadow-[0_0_8px_rgba(139,92,246,0.25)]'
                          : 'border-slate-700/80 bg-[#111622] text-slate-300 hover:border-violet-500/50 hover:text-violet-200'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-1 truncate">
                      <Zap
                        className={`h-3 w-3 shrink-0 ${
                          cd > 0
                            ? 'text-slate-600'
                            : order.useSkill
                              ? 'text-amber-300'
                              : 'text-violet-400'
                        }`}
                      />
                      <span className="truncate">
                        ใช้สกิล: {tpl.skillName} ({tpl.skillCost}M)
                      </span>
                    </span>
                    {cd > 0 ? (
                      <span className="shrink-0 rounded-[2px] bg-slate-800 px-1.5 py-px text-[9px] font-bold text-slate-400">
                        ติดคูลดาวน์อีก {cd} เทิร์น
                      </span>
                    ) : (
                      <span
                        className={`shrink-0 rounded-[2px] px-1.5 py-px text-[9px] font-bold uppercase ${
                          order.useSkill
                            ? 'bg-violet-600 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {order.useSkill ? 'ON' : 'OFF'}
                      </span>
                    )}
                  </button>
                </div>
              )}

              {/* Main Action Selector + Pick Tile Button */}
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
                      {opt.id === 'np' && tpl ? `NP: ${tpl.npName} (${tpl.npCost}M)` : opt.label}
                    </option>
                  ))}
                </select>

                {/* Pick Tile / Unit Button */}
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => {
                    if (isPicking) {
                      setPickingOrderForUnitId(null);
                    } else {
                      locateUnit(unit.id);
                      setPickingOrderForUnitId(unit.id);
                    }
                  }}
                  className={`flex shrink-0 items-center gap-1 rounded-[2px] border px-2 py-1 text-[10.5px] font-bold transition disabled:cursor-not-allowed ${
                    isPicking
                      ? 'border-[#C8A253] bg-[#C8A253] text-[#090B10]'
                      : 'border-[#C8A253]/40 bg-[#111622] text-[#C8A253] hover:bg-[#C8A253]/15'
                  }`}
                >
                  <Crosshair className="h-3 w-3" />
                  <span>{isPicking ? 'จิ้มบนแมพ...' : 'Pick Tile'}</span>
                </button>
              </div>

              {/* Unlock Range Override Checkbox */}
              <label
                className={`mt-1.5 flex items-center gap-1.5 text-[10px] ${
                  isLocked
                    ? 'cursor-not-allowed text-slate-600'
                    : order.overrideMoveRange
                      ? 'cursor-pointer font-semibold text-amber-300'
                      : 'cursor-pointer text-slate-400 hover:text-slate-200'
                }`}
              >
                <input
                  type="checkbox"
                  disabled={isLocked}
                  checked={Boolean(order.overrideMoveRange)}
                  onChange={(e) =>
                    setDraftOrder(unit.id, { overrideMoveRange: e.target.checked })
                  }
                  className="h-3 w-3 accent-amber-500"
                />
                <Unlock className="h-2.5 w-2.5 shrink-0" />
                <span>ปลดล็อกระยะ (สกิล/บัฟ/วาร์ป)</span>
              </label>

              {/* Selected Target Readout */}
              {order.targetPosition && (
                <div className="mt-1.5 space-y-1">
                  <div className="flex items-center justify-between rounded-[2px] border border-[#C8A253]/30 bg-[#111622] px-2 py-1 text-[10.5px]">
                    <span className="truncate text-[#E5C983]">
                      เป้า: {order.targetPosition.zone.toUpperCase()}{' '}
                      {formatCoordLabel(order.targetPosition.x, order.targetPosition.y)}
                      {order.estimatedMoveCost != null
                        ? ` (${formatMpCost(order.estimatedMoveCost)} MP)`
                        : ''}
                      {targetUnit
                        ? ` (${getDisplayUnitName(targetUnit, previewRole, roomState)})`
                        : ''}
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

                  {isOverRangeTarget && (
                    <div className="flex items-center gap-1 rounded-[2px] border border-amber-600/60 bg-amber-950/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      <span>⚠️ เกินระยะปกติ (ปลดล็อกระยะ)</span>
                    </div>
                  )}
                </div>
              )}

              {/* 1-Line Note Input */}
              <input
                type="text"
                disabled={isLocked}
                value={order.note}
                onChange={(e) => setDraftOrder(unit.id, { note: e.target.value })}
                placeholder="ระบุเป้าหมาย / โฮกุ / ไอเทม / เรย์จู..."
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

      {/* Estimated Mana Usage Bar (Soft Warning) */}
      {activeServants.length > 0 && (
        <div
          className={`mt-3 flex items-center justify-between rounded-[2px] border px-2.5 py-1.5 text-[11px] font-bold ${
            isManaOverBudget
              ? 'border-red-500/80 bg-red-950/50 text-red-200'
              : 'border-sky-800/60 bg-[#090B10] text-sky-300'
          }`}
        >
          <span className="flex items-center gap-1.5">
            {isManaOverBudget ? (
              <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-sky-400" />
            )}
            <span>ประเมิน Mana ที่ใช้เทิร์นนี้:</span>
          </span>
          <span className="font-mono text-xs">
            {estimatedMana} / {team.mana}
          </span>
        </div>
      )}

      {/* LOCK TURN Button */}
      <button
        type="button"
        disabled={isLocked || submitting || activeServants.length === 0}
        onClick={handleLock}
        className={`mt-2 flex w-full items-center justify-center gap-2 rounded-[2px] border py-2.5 font-display text-xs font-bold tracking-widest transition ${
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
