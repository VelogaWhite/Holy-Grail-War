import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Crosshair,
  Lock,
  Package,
  Send,
  ShoppingBag,
  Sparkles,
  Unlock,
  X,
  Zap,
} from 'lucide-react';
import { ITEMS, ITEMS_BY_ID, MAP_DATA, SERVANTS_BY_ID } from '../../data';
import { useGameStore } from '../../store/useGameStore';
import type { CommandActionType, StanceType, TeamId } from '../../types/game';
import { formatCoordLabel } from '../../utils/assetHelper';
import { formatMpCost } from '../../utils/gridMath';
import { getDisplayUnitName } from '../../utils/visibilityHelper';
import { TileInspector } from '../board/TileInspector';

const ACTION_OPTIONS: { id: CommandActionType; label: string }[] = [
  { id: 'move', label: 'Move' },
  { id: 'attack', label: 'Attack' },
  { id: 'np', label: 'NP (Noble Phantasm)' },
  { id: 'guard', label: 'Guard' },
  { id: 'explore', label: 'Explore/Shop' },
  { id: 'tag_out', label: 'Tag-Out (1M)' },
  { id: 'custom', label: 'Custom/CS/Item' },
];

const STANCE_OPTIONS: {
  id: StanceType;
  icon: string;
  label: string;
  tooltip: string;
  activeClass: string;
  idleClass: string;
}[] = [
  {
    id: 'attack',
    icon: '⚔️',
    label: 'Attack',
    tooltip: 'โดนตีสวนกลับ 50% ATK (ใน Range) | โดนตีไม่ขยับ',
    activeClass:
      'border-rose-500 bg-rose-500/25 text-rose-200 shadow-[0_0_8px_rgba(244,63,94,0.25)]',
    idleClass:
      'border-slate-700/80 bg-[#111622] text-slate-400 hover:border-rose-500/50 hover:text-rose-200',
  },
  {
    id: 'defensive',
    icon: '🛡️',
    label: 'Defensive',
    tooltip: 'ลดดาเมจ 25% (ถ้า Guard รวมเป็น 60%) | โดนตีไม่ขยับ',
    activeClass:
      'border-sky-500 bg-sky-500/25 text-sky-200 shadow-[0_0_8px_rgba(14,165,233,0.25)]',
    idleClass:
      'border-slate-700/80 bg-[#111622] text-slate-400 hover:border-sky-500/50 hover:text-sky-200',
  },
  {
    id: 'evade',
    icon: '💨',
    label: 'Evade',
    tooltip:
      'ลดดาเมจ 0% (Guard 50%) | ไม่ติด ZoC, โดนตีแล้วยังเดินหนีได้ (ถ้า Guard + Evade ถอยหลัง 1 ช่อง)',
    activeClass:
      'border-emerald-500 bg-emerald-500/25 text-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.25)]',
    idleClass:
      'border-slate-700/80 bg-[#111622] text-slate-400 hover:border-emerald-500/50 hover:text-emerald-200',
  },
];

export function SecretCommandPanel() {
  const previewRole = useGameStore((s) => s.previewRole);
  const roomState = useGameStore((s) => s.roomState);
  const draftOrders = useGameStore((s) => s.draftOrders);
  const selectedUnitId = useGameStore((s) => s.selectedUnitId);
  const pickingOrderForUnitId = useGameStore((s) => s.pickingOrderForUnitId);
  const setDraftOrder = useGameStore((s) => s.setDraftOrder);
  const clearDraftOrderTarget = useGameStore((s) => s.clearDraftOrderTarget);
  const setPickingOrderForUnitId = useGameStore((s) => s.setPickingOrderForUnitId);
  const locateUnit = useGameStore((s) => s.locateUnit);
  const lockMasterTurn = useGameStore((s) => s.lockMasterTurn);
  const [submitting, setSubmitting] = useState(false);
  const [openShopUnitId, setOpenShopUnitId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const teamId: TeamId = previewRole === 'master_b' ? 'team_b' : 'team_a';
  const team = roomState.teams[teamId];
  const isLocked = team.readyLocked;

  const activeServants = Object.values(roomState.units)
    .filter((u) => u.unitType === 'servant' && u.owner === teamId && u.status === 'active')
    .slice(0, 3);

  // Deduplicated team inventory list with counts for dropdown
  const inventoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const id of team.inventory) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([id, count]) => ({
      id,
      count,
      item: ITEMS_BY_ID[id],
    }));
  }, [team.inventory]);

  // Smoothly scroll highlighted Servant command card into view on board-first selection
  const focusedUnitId = pickingOrderForUnitId ?? selectedUnitId;
  useEffect(() => {
    if (!focusedUnitId) return;
    const el = cardRefs.current[focusedUnitId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [focusedUnitId]);

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
            stance: 'defensive' as StanceType,
            note: '',
          };
          const currentStance: StanceType = order.stance ?? 'defensive';
          const isGuardAction = order.actionType === 'guard';
          const isGuardEvade = isGuardAction && currentStance === 'evade';
          const isMoveEvade =
            order.actionType === 'move' && currentStance === 'evade';
          const isCombatAction =
            order.actionType === 'attack' || order.actionType === 'np';
          const tpl = SERVANTS_BY_ID[unit.templateId];
          const cd = unit.skillCooldown ?? 0;
          const isPicking = pickingOrderForUnitId === unit.id;
          const isHighlighted = isPicking || selectedUnitId === unit.id;
          const targetUnit = order.targetUnitId
            ? roomState.units[order.targetUnitId]
            : null;
          const isOverRangeTarget = Boolean(
            order.targetPosition &&
              order.overrideMoveRange &&
              order.estimatedMoveCost === null
          );

          // Check if unit is standing on a Safe House (Church) for QP Shop shortcut
          const isOnSafeHouse = Boolean(
            unit.position &&
              MAP_DATA.zones[unit.position.zone]?.specialTiles.some(
                (t) =>
                  t.x === unit.position!.x &&
                  t.y === unit.position!.y &&
                  t.type === 'safe_house'
              )
          );
          const isShopOpen = openShopUnitId === unit.id;

          return (
            <div
              key={unit.id}
              ref={(el) => {
                cardRefs.current[unit.id] = el;
              }}
              className={`rounded-[2px] border p-2 transition ${
                isPicking
                  ? 'border-[#C8A253] bg-[#C8A253]/14 shadow-[0_0_12px_rgba(200,162,83,0.22)]'
                  : isHighlighted
                    ? 'border-[#C8A253]/70 bg-[#C8A253]/8'
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

              {/* Stance Selector (3 Tactical Stances) */}
              <div className="mb-1.5">
                <div className="mb-0.5 flex items-center justify-between text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                  <span>STANCE (ท่วงท่าประจำเทิร์น)</span>
                  <span
                    className={
                      currentStance === 'attack'
                        ? 'text-rose-400'
                        : currentStance === 'evade'
                          ? 'text-emerald-400'
                          : 'text-sky-400'
                    }
                  >
                    {currentStance === 'attack'
                      ? 'สวน 50% ATK'
                      : currentStance === 'evade'
                        ? 'ไม่ติด ZoC'
                        : 'ลด DMG 25%/60%'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {STANCE_OPTIONS.map((st) => {
                    const active = currentStance === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        disabled={isLocked}
                        title={st.tooltip}
                        onClick={() =>
                          setDraftOrder(unit.id, { stance: st.id })
                        }
                        className={`flex items-center justify-center gap-1 rounded-[2px] border py-1 text-[10px] font-bold transition disabled:cursor-not-allowed ${
                          active ? st.activeClass : st.idleClass
                        }`}
                      >
                        <span>{st.icon}</span>
                        <span>{st.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Action Selector + Pick Tile Button */}
              <div className="flex gap-1.5">
                <select
                  disabled={isLocked}
                  value={order.actionType}
                  onChange={(e) => {
                    const nextType = e.target.value as CommandActionType;
                    setDraftOrder(unit.id, {
                      actionType: nextType,
                      ...(nextType === 'guard'
                        ? {
                            targetPosition: undefined,
                            targetUnitId: undefined,
                            estimatedMoveCost: undefined,
                          }
                        : {}),
                      ...(nextType !== 'custom' && nextType !== 'explore'
                        ? { itemId: undefined }
                        : {}),
                    });
                  }}
                  className="flex-1 rounded-[2px] border border-slate-700 bg-[#111622] px-2 py-1 text-[11px] font-semibold text-slate-100 focus:border-[#C8A253] focus:outline-none disabled:cursor-not-allowed"
                >
                  {ACTION_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.id === 'np' && tpl
                        ? `NP: ${tpl.npName} (${tpl.npCost}M)`
                        : opt.label}
                    </option>
                  ))}
                </select>

                {/* Pick Tile / Unit Button (hidden whenever Guard is selected — Guard never targets a tile) */}
                {!isGuardAction && (
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
                )}
              </div>

              {/* Contextual Stance + Action Guides */}
              {isMoveEvade && (
                <div className="mt-1.5 rounded-[2px] border border-emerald-500/50 bg-emerald-950/40 px-2 py-1 text-[10px] font-semibold text-emerald-300">
                  💨 <strong>Evade: ไม่ติด ZoC</strong> — เดินหนีได้เต็ม MP และยังขยับไปจุดหมายได้แม้โดนโจมตีใน Priority 2
                </div>
              )}

              {isGuardAction && (
                <div
                  className={`mt-1.5 rounded-[2px] border px-2 py-1 text-[10px] font-semibold ${
                    isGuardEvade
                      ? 'border-emerald-500/60 bg-emerald-950/45 text-emerald-200'
                      : 'border-sky-500/50 bg-sky-950/35 text-sky-200'
                  }`}
                >
                  {isGuardEvade ? (
                    <>
                      💨 <strong>Guard + Evade:</strong> ลดดาเมจ 50% และถอยหลัง 1 ช่องนับจากทิศศัตรูเมื่อถูกโจมตี (ไม่ต้องเลือกช่องปลายทาง)
                    </>
                  ) : currentStance === 'defensive' ? (
                    <>
                      🛡️ <strong>Guard + Defensive:</strong> ลดดาเมจรวม 60% (ปัดลง) · ตั้งรับอยู่กับที่ (ไม่ต้องเลือกช่อง)
                    </>
                  ) : (
                    <>
                      ⚔️ <strong>Guard + Attack:</strong> ลดดาเมจ 50% + สวนกลับ 50% ATK (ใน Range) · ตั้งรับอยู่กับที่ (ไม่ต้องเลือกช่อง)
                    </>
                  )}
                </div>
              )}

              {isCombatAction && (
                <div className="mt-1.5 rounded-[2px] border border-rose-500/40 bg-rose-950/25 px-2 py-0.5 text-[9.5px] font-medium text-rose-200">
                  ⚔️ <strong>Attack ก่อน Move:</strong> เล็งเป้าหมายจากตำแหน่งยืนปัจจุบัน (ในระยะ Range)
                </div>
              )}

              {/* Interactive Inventory Item Dropdown for 'custom' Action */}
              {order.actionType === 'custom' && (
                <div className="mt-1.5 rounded-[2px] border border-[#C8A253]/30 bg-[#111622] p-1.5">
                  <label className="mb-1 flex items-center gap-1 text-[9.5px] font-bold text-[#E5C983]">
                    <Package className="h-3 w-3 text-[#C8A253]" />
                    เลือกใช้ไอเทมจากกระเป๋าทีม ({team.inventory.length} ชิ้น):
                  </label>
                  <select
                    disabled={isLocked || inventoryCounts.length === 0}
                    value={order.itemId ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) {
                        setDraftOrder(unit.id, { itemId: undefined });
                        return;
                      }
                      const chosen = ITEMS_BY_ID[val];
                      setDraftOrder(unit.id, {
                        itemId: val,
                        note: chosen ? `ใช้ไอเทม: ${chosen.name}` : order.note,
                      });
                    }}
                    className="w-full rounded-[2px] border border-slate-700 bg-[#090B10] px-1.5 py-1 text-[10.5px] text-slate-100 focus:border-[#C8A253] focus:outline-none disabled:opacity-50"
                  >
                    <option value="">
                      {inventoryCounts.length === 0
                        ? '-- ไม่มีไอเทมในกระเป๋า --'
                        : '-- ไม่ใช้ไอเทม (คำสั่ง/เรย์จูทั่วไป) --'}
                    </option>
                    {inventoryCounts.map(({ id, count, item }) => (
                      <option key={id} value={id}>
                        {item?.name ?? id} {count > 1 ? `(x${count})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Safe House QP Shop Shortcut */}
              {isOnSafeHouse && (
                <div className="mt-1.5">
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() =>
                      setOpenShopUnitId(isShopOpen ? null : unit.id)
                    }
                    className="flex w-full items-center justify-between rounded-[2px] border border-emerald-600/60 bg-emerald-950/40 px-2 py-1 text-[10.5px] font-bold text-emerald-300 transition hover:bg-emerald-950/70 disabled:opacity-50"
                  >
                    <span className="flex items-center gap-1">
                      <ShoppingBag className="h-3 w-3" />
                      <span>ดูร้านค้า QP (Safe House)</span>
                    </span>
                    <span className="font-mono text-[10px] text-[#E5C983]">
                      มี {team.qp} QP
                    </span>
                  </button>

                  {isShopOpen && !isLocked && (
                    <div className="mt-1 max-h-44 space-y-1 overflow-y-auto rounded-[2px] border border-[#C8A253]/40 bg-[#111622] p-1.5">
                      {ITEMS.map((it) => {
                        const affordable = team.qp >= it.qpCost;
                        return (
                          <button
                            key={it.id}
                            type="button"
                            onClick={() => {
                              setDraftOrder(unit.id, {
                                actionType: 'explore',
                                itemId: undefined,
                                note: `ซื้อร้านค้า QP: ${it.name} (${it.qpCost} QP)`,
                              });
                              setOpenShopUnitId(null);
                            }}
                            className={`flex w-full flex-col rounded-[2px] border px-2 py-1 text-left transition ${
                              affordable
                                ? 'border-slate-700 bg-[#090B10] hover:border-[#C8A253]'
                                : 'border-slate-800/70 bg-[#090B10]/50 opacity-60 hover:border-amber-700'
                            }`}
                          >
                            <div className="flex w-full items-center justify-between gap-1 text-[10.5px] font-bold">
                              <span className="truncate text-slate-100">{it.name}</span>
                              <span
                                className={`shrink-0 font-mono text-[10px] ${
                                  affordable ? 'text-[#E5C983]' : 'text-red-400'
                                }`}
                              >
                                {it.qpCost} QP
                              </span>
                            </div>
                            <span className="line-clamp-2 text-[9.5px] text-slate-400">
                              {it.effectDesc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Unlock Range Override Checkbox (hidden for Guard) */}
              {!isGuardAction && (
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
              )}

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
