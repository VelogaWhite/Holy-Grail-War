import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  Flame,
  Footprints,
  LockOpen,
  MapPin,
  Package,
  Play,
  Shield,
  Square,
  Swords,
  UserPlus,
  X,
  Zap,
} from 'lucide-react';
import { ITEMS_BY_ID, SERVANTS_BY_ID } from '../../data';
import { useGameStore } from '../../store/useGameStore';
import type { SecretCommandsDoc, StanceType } from '../../types/game';
import { formatCoordLabel } from '../../utils/assetHelper';
import { formatMpCost } from '../../utils/gridMath';

function getStanceBadge(stance?: StanceType): {
  label: string;
  className: string;
} {
  switch (stance) {
    case 'attack':
      return {
        label: '⚔️ ATK',
        className: 'border-rose-500/70 bg-rose-500/20 text-rose-200',
      };
    case 'evade':
      return {
        label: '💨 EVADE',
        className: 'border-emerald-500/70 bg-emerald-500/20 text-emerald-200',
      };
    default:
      return {
        label: '🛡️ DEF',
        className: 'border-sky-500/70 bg-sky-500/20 text-sky-200',
      };
  }
}

function ReinforcementRequestCard({
  masterKey,
  teamLabel,
  ordersDoc,
}: {
  masterKey: 'master_a' | 'master_b';
  teamLabel: string;
  ordersDoc: SecretCommandsDoc | null;
}) {
  const roomState = useGameStore((s) => s.roomState);
  const approveReinforcement = useGameStore((s) => s.approveReinforcement);
  const dismissReinforcement = useGameStore((s) => s.dismissReinforcement);

  const req = ordersDoc?.reinforcementRequest;
  if (!req) return null;

  const unit = roomState.units[req.unitId];

  return (
    <div className="clip-tactical-sm border border-[#C8A253] bg-[#C8A253]/12 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#E5C983]">
          <UserPlus className="h-3.5 w-3.5 text-[#C8A253]" />
          คำขอส่งตัวสำรอง · {teamLabel}
        </span>
        <button
          type="button"
          onClick={() => dismissReinforcement(masterKey)}
          title="ยกเลิกคำขอ"
          className="text-slate-400 hover:text-red-400"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-200">
        ส่ง <strong className="font-display text-[#E5C983]">{unit?.name ?? req.unitId}</strong>{' '}
        ลงจุด{' '}
        <strong>
          {req.position.zone.toUpperCase()} {formatCoordLabel(req.position.x, req.position.y)}
        </strong>
      </p>
      <button
        type="button"
        onClick={() => approveReinforcement(masterKey)}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-[2px] bg-emerald-700 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-600"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>อนุมัติลงสนาม (Approve)</span>
      </button>
    </div>
  );
}

function DeploymentTeamPreview({
  title,
  teamKey,
  masterKey,
  ordersDoc,
}: {
  title: string;
  teamKey: 'team_a' | 'team_b';
  masterKey: 'master_a' | 'master_b';
  ordersDoc: SecretCommandsDoc | null;
}) {
  const roomState = useGameStore((s) => s.roomState);
  const unlockMasterOrders = useGameStore((s) => s.unlockMasterOrders);
  const isTeamA = teamKey === 'team_a';
  const isLocked = roomState.teams[teamKey].readyLocked;
  const placements = ordersDoc?.deployment?.placements ?? [];

  return (
    <div
      className={`rounded-[2px] border p-2.5 ${
        isTeamA
          ? 'border-[#B91C1C]/60 bg-[#B91C1C]/8'
          : 'border-sky-700/60 bg-sky-950/20'
      }`}
    >
      <div className="mb-1.5 flex items-center justify-between border-b border-slate-800 pb-1">
        <span
          className={`font-display text-xs font-bold tracking-wider ${
            isTeamA ? 'text-red-400' : 'text-sky-400'
          }`}
        >
          {title}
        </span>
        <div className="flex items-center gap-1">
          <span
            className={`rounded-[2px] px-1.5 py-0.5 text-[9px] font-bold uppercase ${
              isLocked
                ? 'border border-emerald-700 bg-emerald-950/60 text-emerald-300'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {isLocked ? 'READY' : 'Selecting...'}
          </span>
          {isLocked && (
            <button
              type="button"
              onClick={() => unlockMasterOrders(masterKey)}
              className="rounded-[2px] border border-[#C8A253]/40 bg-[#090B10] px-1 py-0.5 text-[9px] font-bold text-[#C8A253]"
            >
              Unlock
            </button>
          )}
        </div>
      </div>

      {placements.length === 0 ? (
        <p className="py-1.5 text-[11px] italic text-slate-500">
          รอ Master เลือก 3 ตัวจริงและจุดเกิด...
        </p>
      ) : (
        <div className="space-y-1">
          {placements.map((p) => {
            const u = roomState.units[p.unitId];
            return (
              <div
                key={p.unitId}
                className="flex items-center justify-between rounded-[2px] border border-slate-800 bg-[#090B10] px-2 py-1 text-[11px]"
              >
                <span className="font-display font-bold text-slate-100">
                  {u?.name ?? p.unitId}
                </span>
                <span className="flex items-center gap-0.5 font-mono text-[10px] font-bold text-[#C8A253]">
                  <MapPin className="h-2.5 w-2.5" />
                  {formatCoordLabel(p.position.x, p.position.y)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TeamOrdersBlock({
  title,
  teamKey,
  masterKey,
  ordersDoc,
}: {
  title: string;
  teamKey: 'team_a' | 'team_b';
  masterKey: 'master_a' | 'master_b';
  ordersDoc: SecretCommandsDoc | null;
}) {
  const roomState = useGameStore((s) => s.roomState);
  const checkedOrderIds = useGameStore((s) => s.checkedOrderIds);
  const toggleCheckedOrder = useGameStore((s) => s.toggleCheckedOrder);
  const unlockMasterOrders = useGameStore((s) => s.unlockMasterOrders);
  const applySkillOrder = useGameStore((s) => s.applySkillOrder);
  const applyMoveOrder = useGameStore((s) => s.applyMoveOrder);
  const applyNpOrder = useGameStore((s) => s.applyNpOrder);
  const applyGuardOrder = useGameStore((s) => s.applyGuardOrder);
  const applyUseItemOrder = useGameStore((s) => s.applyUseItemOrder);
  const [appliedShortcuts, setAppliedShortcuts] = useState<Record<string, boolean>>({});

  const markApplied = (key: string) =>
    setAppliedShortcuts((prev) => ({ ...prev, [key]: true }));

  const isTeamA = teamKey === 'team_a';
  const isLocked = roomState.teams[teamKey].readyLocked;
  const orders = ordersDoc?.orders ?? [];

  return (
    <div
      className={`rounded-[2px] border p-2.5 ${
        isTeamA
          ? 'border-[#B91C1C]/60 bg-[#B91C1C]/8'
          : 'border-sky-700/60 bg-sky-950/20'
      }`}
    >
      <div className="mb-2 flex items-center justify-between border-b border-slate-800 pb-1.5">
        <div className="flex items-center gap-1.5">
          {isTeamA ? (
            <Swords className="h-3.5 w-3.5 text-red-400" />
          ) : (
            <Shield className="h-3.5 w-3.5 text-sky-400" />
          )}
          <span
            className={`font-display text-xs font-bold tracking-wider ${
              isTeamA ? 'text-red-400' : 'text-sky-400'
            }`}
          >
            {title}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`rounded-[2px] px-1.5 py-0.5 text-[9.5px] font-bold uppercase ${
              isLocked
                ? 'border border-emerald-700 bg-emerald-950/60 text-emerald-300'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {isLocked ? 'LOCKED' : 'Waiting'}
          </span>
          {isLocked && (
            <button
              type="button"
              onClick={() => unlockMasterOrders(masterKey)}
              title="ปลดล็อกให้ Master แก้คำสั่งใหม่"
              className="flex items-center gap-0.5 rounded-[2px] border border-[#C8A253]/40 bg-[#090B10] px-1.5 py-0.5 text-[9.5px] font-bold text-[#C8A253] hover:bg-[#C8A253]/15"
            >
              <LockOpen className="h-2.5 w-2.5" />
              <span>Unlock</span>
            </button>
          )}
        </div>
      </div>

      {orders.length === 0 ? (
        <p className="py-2 text-center text-[11px] italic text-slate-500">
          ยังไม่มีคำสั่งลับที่ส่งเข้ามาในเทิร์นนี้
        </p>
      ) : (
        <div className="space-y-1.5">
          {orders.map((ord) => {
            const unit = roomState.units[ord.unitId];
            const tpl = unit ? SERVANTS_BY_ID[unit.templateId] : null;
            const targetUnit = ord.targetUnitId
              ? roomState.units[ord.targetUnitId]
              : null;
            const checkKey = `${masterKey}-${roomState.turn}-${ord.unitId}`;
            const checked = Boolean(checkedOrderIds[checkKey]);
            const isOverRange = Boolean(
              ord.overrideMoveRange && ord.estimatedMoveCost === null
            );
            const alreadyAppliedCd = (unit?.skillCooldown ?? 0) >= 2;
            const attachedItem = ord.itemId ? ITEMS_BY_ID[ord.itemId] ?? null : null;
            const moveKey = `${checkKey}-move`;
            const npKey = `${checkKey}-np`;
            const guardKey = `${checkKey}-guard`;
            const itemKey = `${checkKey}-item`;

            const stance: StanceType = ord.stance ?? 'defensive';
            const stanceBadge = getStanceBadge(stance);
            const isGuardEvade = ord.actionType === 'guard' && stance === 'evade';

            const showMoveBtn = Boolean(
              unit && ord.targetPosition && ord.actionType === 'move'
            );
            const showNpBtn = Boolean(unit && tpl && ord.actionType === 'np');
            const showGuardBtn = Boolean(unit && ord.actionType === 'guard');
            const showItemBtn = Boolean(attachedItem && ord.itemId);

            return (
              <div
                key={ord.unitId}
                onClick={() => toggleCheckedOrder(checkKey)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleCheckedOrder(checkKey);
                  }
                }}
                className={`flex w-full cursor-pointer items-start gap-2 rounded-[2px] border p-2 text-left transition ${
                  checked
                    ? 'border-emerald-800/70 bg-emerald-950/25 opacity-65'
                    : isOverRange
                      ? 'border-amber-600/70 bg-[#090B10] hover:border-amber-500'
                      : 'border-slate-800 bg-[#090B10] hover:border-[#C8A253]/40'
                }`}
              >
                {checked ? (
                  <CheckSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                ) : (
                  <Square className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-display truncate text-[11px] font-bold text-slate-100">
                      {unit?.name ?? ord.unitId}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      <span
                        className={`rounded-[2px] border px-1.5 py-px text-[8.5px] font-bold uppercase ${stanceBadge.className}`}
                      >
                        {stanceBadge.label}
                      </span>
                      <span className="rounded-[2px] border border-[#C8A253]/35 bg-[#111622] px-1.5 py-px font-display text-[9px] font-bold uppercase text-[#E5C983]">
                        {ord.actionType.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {isGuardEvade && (
                    <div className="mt-1 rounded-[2px] border border-emerald-600/50 bg-emerald-950/35 px-1.5 py-0.5 text-[9.5px] font-semibold text-emerald-300">
                      💨 Guard + Evade: ลดดาเมจ 50% + ถอยหลัง 1 ช่องเมื่อโดนโจมตี (กดปุ่มถอยใน Combat Helper)
                    </div>
                  )}

                  {/* Bonus Action Skill Badge + 1-Click Apply */}
                  {ord.useSkill && tpl && (
                    <div className="mt-1 space-y-1 rounded-[2px] border border-violet-500/60 bg-violet-950/40 p-1.5">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-violet-200">
                        <Zap className="h-3 w-3 shrink-0 text-amber-300" />
                        <span className="truncate">
                          SKILL: {tpl.skillName} (-{tpl.skillCost} Mana)
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={alreadyAppliedCd}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (unit) {
                            applySkillOrder(
                              unit.id,
                              teamKey,
                              tpl.skillName,
                              tpl.skillCost
                            );
                          }
                        }}
                        className={`flex w-full items-center justify-center gap-1 rounded-[2px] border py-0.5 text-[9.5px] font-bold transition ${
                          alreadyAppliedCd
                            ? 'cursor-default border-emerald-700/60 bg-emerald-950/50 text-emerald-300'
                            : 'border-[#C8A253]/60 bg-violet-800/80 text-white hover:bg-violet-700'
                        }`}
                      >
                        <Zap className="h-2.5 w-2.5" />
                        <span>
                          {alreadyAppliedCd
                            ? 'Applied (หัก Mana & ติด CD 2T แล้ว)'
                            : 'Apply Skill (หัก Mana & ติด CD 2T)'}
                        </span>
                      </button>
                    </div>
                  )}

                  {ord.targetPosition && (
                    <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10.5px] font-semibold text-[#C8A253]">
                      <span>
                        → {ord.targetPosition.zone.toUpperCase()}{' '}
                        {formatCoordLabel(ord.targetPosition.x, ord.targetPosition.y)}
                        {ord.estimatedMoveCost != null
                          ? ` (${formatMpCost(ord.estimatedMoveCost)} MP)`
                          : ''}
                        {targetUnit ? ` (${targetUnit.name})` : ''}
                      </span>
                    </div>
                  )}

                  {isOverRange && (
                    <div className="mt-1 inline-flex items-center gap-1 rounded-[2px] border border-amber-500/70 bg-amber-950/60 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-300">
                      <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                      <span>⚠️ เกินระยะปกติ</span>
                    </div>
                  )}

                  {attachedItem && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-amber-200">
                      <Package className="h-3 w-3 shrink-0 text-[#C8A253]" />
                      <span className="truncate">ไอเทมแนบ: {attachedItem.name}</span>
                    </div>
                  )}

                  {ord.note && (
                    <div className="mt-0.5 text-[10.5px] text-slate-300">
                      “{ord.note}”
                    </div>
                  )}

                  {/* 1-Click Ruler Execution Shortcuts */}
                  {(showMoveBtn || showNpBtn || showGuardBtn || showItemBtn) && (
                    <div className="mt-1.5 flex flex-wrap gap-1 border-t border-slate-800/80 pt-1.5">
                      {showMoveBtn && unit && ord.targetPosition && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            applyMoveOrder(unit.id, ord.targetPosition!);
                            markApplied(moveKey);
                          }}
                          className={`flex items-center gap-1 rounded-[2px] border px-2 py-0.5 text-[9.5px] font-bold transition ${
                            appliedShortcuts[moveKey]
                              ? 'border-emerald-700/70 bg-emerald-950/50 text-emerald-300'
                              : 'border-emerald-600/70 bg-emerald-950/40 text-emerald-200 hover:bg-emerald-700 hover:text-white'
                          }`}
                        >
                          <Footprints className="h-2.5 w-2.5" />
                          <span>{appliedShortcuts[moveKey] ? 'Moved ✓' : 'Apply Move'}</span>
                        </button>
                      )}

                      {showNpBtn && unit && tpl && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            applyNpOrder(unit.id, teamKey, tpl.npName, tpl.npCost);
                            markApplied(npKey);
                          }}
                          className={`flex items-center gap-1 rounded-[2px] border px-2 py-0.5 text-[9.5px] font-bold transition ${
                            appliedShortcuts[npKey]
                              ? 'border-emerald-700/70 bg-emerald-950/50 text-emerald-300'
                              : 'border-[#B91C1C]/80 bg-[#B91C1C]/30 text-red-200 hover:bg-[#B91C1C] hover:text-white'
                          }`}
                        >
                          <Flame className="h-2.5 w-2.5" />
                          <span>
                            {appliedShortcuts[npKey]
                              ? 'NP Applied ✓'
                              : `Apply NP (-${tpl.npCost}M)`}
                          </span>
                        </button>
                      )}

                      {showGuardBtn && unit && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            applyGuardOrder(unit.id);
                            markApplied(guardKey);
                          }}
                          className={`flex items-center gap-1 rounded-[2px] border px-2 py-0.5 text-[9.5px] font-bold transition ${
                            appliedShortcuts[guardKey]
                              ? 'border-emerald-700/70 bg-emerald-950/50 text-emerald-300'
                              : 'border-sky-600/70 bg-sky-950/40 text-sky-200 hover:bg-sky-700 hover:text-white'
                          }`}
                        >
                          <Shield className="h-2.5 w-2.5" />
                          <span>{appliedShortcuts[guardKey] ? 'Guard ✓' : 'Apply Guard'}</span>
                        </button>
                      )}

                      {showItemBtn && ord.itemId && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            applyUseItemOrder(teamKey, ord.itemId!, unit?.name);
                            markApplied(itemKey);
                          }}
                          className={`flex items-center gap-1 rounded-[2px] border px-2 py-0.5 text-[9.5px] font-bold transition ${
                            appliedShortcuts[itemKey]
                              ? 'border-emerald-700/70 bg-emerald-950/50 text-emerald-300'
                              : 'border-[#C8A253]/70 bg-[#C8A253]/15 text-[#E5C983] hover:bg-[#C8A253] hover:text-[#090B10]'
                          }`}
                        >
                          <Package className="h-2.5 w-2.5" />
                          <span>{appliedShortcuts[itemKey] ? 'Item Used ✓' : 'Use Item'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SecretOrdersViewer() {
  const masterAOrders = useGameStore((s) => s.masterAOrders);
  const masterBOrders = useGameStore((s) => s.masterBOrders);
  const roomState = useGameStore((s) => s.roomState);
  const deployAllAndStartTurn1 = useGameStore((s) => s.deployAllAndStartTurn1);

  const isDeployment = roomState.phase === 'deployment';

  return (
    <div className="space-y-3">
      {/* Mid-Game Reinforcement Requests */}
      <ReinforcementRequestCard
        masterKey="master_a"
        teamLabel="Team A"
        ordersDoc={masterAOrders}
      />
      <ReinforcementRequestCard
        masterKey="master_b"
        teamLabel="Team B"
        ordersDoc={masterBOrders}
      />

      {isDeployment ? (
        <>
          <div className="rounded-[2px] border border-[#C8A253]/40 bg-[#090B10] px-2.5 py-2 text-[11px] text-slate-300">
            <strong className="text-[#E5C983]">เฟสจัดทัพลับ (Deployment):</strong>{' '}
            Master ทั้ง 2 ฝั่งกำลังเลือก 3 ตัวจริงและจุดเกิด (คุณสามารถสลับแท็บไปดู Preview บน Base A / Base B ได้)
          </div>

          <DeploymentTeamPreview
            title="TEAM A DEPLOYMENT"
            teamKey="team_a"
            masterKey="master_a"
            ordersDoc={masterAOrders}
          />
          <DeploymentTeamPreview
            title="TEAM B DEPLOYMENT"
            teamKey="team_b"
            masterKey="master_b"
            ordersDoc={masterBOrders}
          />

          <button
            type="button"
            onClick={() => deployAllAndStartTurn1()}
            className="flex w-full items-center justify-center gap-2 rounded-[2px] border border-[#C8A253] bg-[#B91C1C] py-2.5 font-display text-xs font-bold tracking-widest text-slate-100 transition hover:bg-red-700"
          >
            <Play className="h-4 w-4" />
            <span>Deploy All & Start Turn 1</span>
          </button>
        </>
      ) : (
        <>
          <div className="space-y-0.5 rounded-[2px] border border-slate-800 bg-[#090B10] px-2.5 py-2 text-[10px] leading-snug text-slate-300">
            <div className="font-display text-[10px] font-bold tracking-wider text-[#E5C983]">
              RESOLUTION CHECKLIST (PRIORITY 1 → 4)
            </div>
            <div>
              <strong className="text-sky-300">P1:</strong> เรย์จู, Guard, บัฟ/สกิลป้องกัน, เปิด Stance, Tag-Out
            </div>
            <div>
              <strong className="text-rose-300">P2:</strong> โจมตีปกติ, NP, สกิลเล็งเป้า (Combat First) + ผล Stance สวนกลับ/ลดดาเมจ + PvE Counter
            </div>
            <div>
              <strong className="text-emerald-300">P3:</strong> เคลื่อนที่พร้อมกัน (Move / Guard+Evade ถอย 1 ช่อง — ข้ามตัวที่ตายหรือโดนตีขณะถือ Attack/Defensive Stance)
            </div>
            <div>
              <strong className="text-[#E5C983]">P4:</strong> ผลช่องพิเศษ (Leyline/Safe House/Grail), ลด Skill CD -1, จบเทิร์น
            </div>
          </div>

          <TeamOrdersBlock
            title={`TEAM A ORDERS · T${roomState.turn}`}
            teamKey="team_a"
            masterKey="master_a"
            ordersDoc={masterAOrders}
          />

          <TeamOrdersBlock
            title={`TEAM B ORDERS · T${roomState.turn}`}
            teamKey="team_b"
            masterKey="master_b"
            ordersDoc={masterBOrders}
          />
        </>
      )}
    </div>
  );
}
