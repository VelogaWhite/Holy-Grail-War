import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  CheckCircle2,
  CornerDownLeft,
  Dices,
  Minus,
  Plus,
  Shield,
  Skull,
  Sparkles,
  Swords,
  X,
} from 'lucide-react';
import { MAP_DATA, MONSTERS_BY_ID, TERRAINS_BY_ID } from '../../data';
import { useGameStore } from '../../store/useGameStore';
import type { BoardUnit, Coordinates, StanceType, TeamId } from '../../types/game';
import { formatCoordLabel } from '../../utils/assetHelper';
import {
  computeAttackRangeTiles,
  getRetreatTiles,
  getTerrainAt,
} from '../../utils/gridMath';

function diceResultToBonus(roll: number): number {
  if (roll >= 5) return 2;
  if (roll >= 3) return 1;
  return 0;
}

function computeStanceReduction(
  rawClamped: number,
  stance: StanceType,
  isGuarding: boolean
): { finalDamage: number; reductionPct: number } {
  if (isGuarding) {
    if (stance === 'defensive') {
      return { finalDamage: Math.floor(rawClamped * 0.4), reductionPct: 60 };
    }
    return { finalDamage: Math.floor(rawClamped * 0.5), reductionPct: 50 };
  }
  if (stance === 'defensive') {
    return { finalDamage: Math.floor(rawClamped * 0.75), reductionPct: 25 };
  }
  return { finalDamage: rawClamped, reductionPct: 0 };
}

interface KillRewardBanner {
  victimType: 'servant' | 'monster';
  victimName: string;
  monsterTemplateId?: string;
  killerTeam: TeamId;
  killerUnitId: string;
  paid: boolean;
}

const DEFENDER_STANCE_BTNS: {
  id: StanceType;
  label: string;
  activeClass: string;
}[] = [
  {
    id: 'attack',
    label: '⚔️ Attack',
    activeClass: 'border-rose-500 bg-rose-500/25 text-rose-200',
  },
  {
    id: 'defensive',
    label: '🛡️ Defensive',
    activeClass: 'border-sky-500 bg-sky-500/25 text-sky-200',
  },
  {
    id: 'evade',
    label: '💨 Evade',
    activeClass: 'border-emerald-500 bg-emerald-500/25 text-emerald-200',
  },
];

export function QuickCombatModal() {
  const previewRole = useGameStore((s) => s.previewRole);
  const isOpen = useGameStore((s) => s.isCombatHelperOpen);
  const preselectedAttackerId = useGameStore((s) => s.combatPreselectedAttackerId);
  const setCombatHelperOpen = useGameStore((s) => s.setCombatHelperOpen);
  const roomState = useGameStore((s) => s.roomState);
  const masterAOrders = useGameStore((s) => s.masterAOrders);
  const masterBOrders = useGameStore((s) => s.masterBOrders);
  const rollDice1d6 = useGameStore((s) => s.rollDice1d6);
  const applyCombatDamage = useGameStore((s) => s.applyCombatDamage);
  const applyRetreatMove = useGameStore((s) => s.applyRetreatMove);
  const grantServantKillBounty = useGameStore((s) => s.grantServantKillBounty);
  const grantMonsterReward = useGameStore((s) => s.grantMonsterReward);

  const activeUnits = useMemo(
    () =>
      Object.values(roomState.units).filter(
        (u) => u.status === 'active' && u.position !== null
      ),
    [roomState.units]
  );

  const [attackerId, setAttackerId] = useState<string>('');
  const [defenderId, setDefenderId] = useState<string>('');
  const [diceBonus, setDiceBonus] = useState<number>(0);
  const [lastRollValue, setLastRollValue] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);

  const [highGroundAtk, setHighGroundAtk] = useState(false);
  const [forestCover, setForestCover] = useState(false);
  const [ruinsCover, setRuinsCover] = useState(false);
  const [waterExposed, setWaterExposed] = useState(false);
  const [defenderStance, setDefenderStance] = useState<StanceType>('defensive');
  const [isGuarding, setIsGuarding] = useState(false);
  const [customMod, setCustomMod] = useState(0);
  const [counterCustomMod, setCounterCustomMod] = useState(0);

  const [killBanner, setKillBanner] = useState<KillRewardBanner | null>(null);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);
  const [counterNotice, setCounterNotice] = useState<string | null>(null);
  const [retreatNotice, setRetreatNotice] = useState<string | null>(null);
  const lastBroadcastIdRef = useRef<string | null>(roomState.diceBroadcast?.id ?? null);

  // Initialize attacker/defender when opening modal
  useEffect(() => {
    if (!isOpen) return;
    setKillBanner(null);
    setAppliedNotice(null);
    setCounterNotice(null);
    setRetreatNotice(null);
    setCustomMod(0);
    setCounterCustomMod(0);
    setDiceBonus(0);
    setLastRollValue(null);
    lastBroadcastIdRef.current = roomState.diceBroadcast?.id ?? null;

    const initialAttacker =
      (preselectedAttackerId &&
        activeUnits.find((u) => u.id === preselectedAttackerId)) ||
      activeUnits[0];
    if (initialAttacker) {
      setAttackerId(initialAttacker.id);
      const opposing = activeUnits.filter(
        (u) => u.id !== initialAttacker.id && u.owner !== initialAttacker.owner
      );
      const sameZoneOpposing = opposing.find(
        (u) => u.position?.zone === initialAttacker.position?.zone
      );
      setDefenderId((sameZoneOpposing ?? opposing[0])?.id ?? '');
    }
  }, [isOpen, preselectedAttackerId]);

  const attacker: BoardUnit | null = attackerId ? roomState.units[attackerId] ?? null : null;
  const defender: BoardUnit | null = defenderId ? roomState.units[defenderId] ?? null : null;

  const defenderOrder = useMemo(() => {
    if (!defender) return null;
    if (defender.owner === 'team_a') {
      return masterAOrders?.orders.find((o) => o.unitId === defender.id) ?? null;
    }
    if (defender.owner === 'team_b') {
      return masterBOrders?.orders.find((o) => o.unitId === defender.id) ?? null;
    }
    return null;
  }, [defender, masterAOrders, masterBOrders]);

  const attackerTerrain = attacker?.position
    ? getTerrainAt(attacker.position.zone, attacker.position.x, attacker.position.y)
    : null;
  const defenderTerrain = defender?.position
    ? getTerrainAt(defender.position.zone, defender.position.x, defender.position.y)
    : null;

  // Auto-detect terrain, Stance & Guard from secret orders/tags when attacker/defender selection changes
  useEffect(() => {
    if (!attacker || !defender) return;
    const attPos = attacker.position;
    const defPos = defender.position;
    const attTerr = attPos ? getTerrainAt(attPos.zone, attPos.x, attPos.y) : null;
    const defTerr = defPos ? getTerrainAt(defPos.zone, defPos.x, defPos.y) : null;

    const sameZone = Boolean(attPos && defPos && attPos.zone === defPos.zone);
    const dist =
      sameZone && attPos && defPos
        ? Math.abs(attPos.x - defPos.x) + Math.abs(attPos.y - defPos.y)
        : 99;
    const isRangedAttacker = (attacker.range ?? 1) >= 2 || dist > 1;

    setHighGroundAtk(attTerr === 'building' && defTerr !== 'building');
    setForestCover(defTerr === 'forest' && attTerr !== 'forest' && isRangedAttacker);
    setRuinsCover(defTerr === 'ruins');
    setWaterExposed(defTerr === 'water');

    const detectedStance: StanceType = defenderOrder?.stance ?? 'defensive';
    const detectedGuard =
      defenderOrder?.actionType === 'guard' ||
      defender.tags.some((t) => t.toLowerCase() === 'guard');

    setDefenderStance(detectedStance);
    setIsGuarding(detectedGuard);
    setCounterCustomMod(0);
    setCounterNotice(null);
    setRetreatNotice(null);
  }, [attacker?.id, defender?.id, attackerTerrain, defenderTerrain, defenderOrder]);

  // Capture 1d6 broadcast result triggered from inside Quick Combat Helper
  const broadcastId = roomState.diceBroadcast?.id ?? null;
  const broadcastResult = roomState.diceBroadcast?.result ?? null;
  useEffect(() => {
    if (!isOpen || !broadcastId || broadcastResult === null) return;
    if (broadcastId !== lastBroadcastIdRef.current) {
      lastBroadcastIdRef.current = broadcastId;
      setLastRollValue(broadcastResult);
      setDiceBonus(diceResultToBonus(broadcastResult));
    }
  }, [isOpen, broadcastId, broadcastResult]);

  // Counter-attack range & damage analysis (when Defender holds Attack Stance)
  const counterAnalysis = useMemo(() => {
    if (!attacker?.position || !defender?.position) return null;
    const rangeInfo = computeAttackRangeTiles(defender);
    const sameZone = attacker.position.zone === defender.position.zone;
    const dist = sameZone
      ? Math.abs(attacker.position.x - defender.position.x) +
        Math.abs(attacker.position.y - defender.position.y)
      : Infinity;
    const inRange = sameZone && dist >= 1 && dist <= rangeInfo.effectiveRange;
    const defenderHighGroundAtk =
      defenderTerrain === 'building' && attackerTerrain !== 'building' ? 1 : 0;
    const defenderEffectiveAtk = defender.atk + defenderHighGroundAtk;
    const baseCounterDmg = Math.max(1, Math.floor(defenderEffectiveAtk * 0.5));
    return {
      sameZone,
      dist,
      inRange,
      effectiveRange: rangeInfo.effectiveRange,
      highGroundRangeBonus: rangeInfo.highGroundBonus,
      defenderHighGroundAtk,
      defenderEffectiveAtk,
      baseCounterDmg,
    };
  }, [attacker, defender, attackerTerrain, defenderTerrain]);

  // Valid Guard + Evade 1-tile retreat tiles
  const retreatTiles = useMemo(() => {
    if (
      !attacker?.position ||
      !defender?.position ||
      defender.status !== 'active' ||
      defenderStance !== 'evade' ||
      !isGuarding
    ) {
      return [];
    }
    return getRetreatTiles(
      defender.position,
      attacker.position,
      roomState.units,
      MAP_DATA
    );
  }, [attacker, defender, defenderStance, isGuarding, roomState.units]);

  if (!isOpen || previewRole !== 'ruler') return null;

  const baseAtk = attacker?.atk ?? 0;
  const rawDamage =
    baseAtk +
    diceBonus +
    (highGroundAtk ? 1 : 0) +
    (waterExposed ? 1 : 0) -
    (forestCover ? 1 : 0) -
    (ruinsCover ? 1 : 0) +
    customMod;
  const clampedDamage = Math.max(0, rawDamage);
  const { finalDamage, reductionPct } = computeStanceReduction(
    clampedDamage,
    defenderStance,
    isGuarding
  );

  const finalCounterDamage = Math.max(
    0,
    (counterAnalysis?.baseCounterDmg ?? 1) + counterCustomMod
  );

  const handleRollDice = async () => {
    if (!attacker || !defender) return;
    setRolling(true);
    try {
      await rollDice1d6(`${attacker.name} โจมตี ${defender.name}`);
    } finally {
      setRolling(false);
    }
  };

  const handleApplyDamage = () => {
    if (!attacker || !defender) return;
    const willDefeat = defender.hp - finalDamage <= 0 && defender.status === 'active';
    const victimName = defender.name;
    const victimType = defender.unitType === 'monster' ? 'monster' : 'servant';
    const monsterTemplateId =
      defender.unitType === 'monster' ? defender.templateId : undefined;
    const killerTeam =
      attacker.owner === 'team_a' || attacker.owner === 'team_b'
        ? attacker.owner
        : null;

    applyCombatDamage(defender.id, finalDamage, attacker.name, false);
    setAppliedNotice(
      `ลดเลือด ${victimName} -${finalDamage} HP (เหลือ ${Math.max(0, defender.hp - finalDamage)}/${defender.maxHp})`
    );

    if (willDefeat && killerTeam) {
      setKillBanner({
        victimType,
        victimName,
        monsterTemplateId,
        killerTeam,
        killerUnitId: attacker.id,
        paid: false,
      });
    }
  };

  const handleApplyCounter = () => {
    if (!attacker || !defender || attacker.status !== 'active') return;
    applyCombatDamage(attacker.id, finalCounterDamage, defender.name, true);
    setCounterNotice(
      `⚔️ สวนกลับใส่ ${attacker.name} -${finalCounterDamage} HP (เหลือ ${Math.max(0, attacker.hp - finalCounterDamage)}/${attacker.maxHp})`
    );
  };

  const handleApplyRetreat = (tile: Coordinates) => {
    if (!attacker || !defender || defender.status !== 'active') return;
    applyRetreatMove(defender.id, tile, attacker.name);
    setRetreatNotice(
      `💨 ย้าย ${defender.name} ถอยไปที่ ${tile.zone.toUpperCase()} ${formatCoordLabel(tile.x, tile.y)} (${tile.x}, ${tile.y}) แล้ว (รองรับ Undo)`
    );
  };

  const monsterTpl = killBanner?.monsterTemplateId
    ? MONSTERS_BY_ID[killBanner.monsterTemplateId]
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
      onClick={() => setCombatHelperOpen(false)}
    >
      <div
        className="clip-tactical flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden border border-[#C8A253]/60 bg-[#111622] text-slate-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#C8A253]/25 bg-[#090B10] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Swords className="h-4 w-4 text-[#C8A253]" />
            <div>
              <h2 className="font-display text-sm font-bold tracking-widest text-[#E5C983]">
                QUICK COMBAT HELPER (ATTACK FIRST + 3 STANCES)
              </h2>
              <p className="text-[10px] text-slate-400">
                ภูมิประเทศ + Stance + Guard + ทอย 1d6 + สวนกลับ Attack Stance &amp; ถอย Guard+Evade
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCombatHelperOpen(false)}
            className="rounded-[2px] border border-slate-700 bg-[#111622] p-1 text-slate-400 hover:border-[#C8A253] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {/* Attacker & Defender Selectors */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-[2px] border border-slate-800 bg-[#090B10] p-2">
              <label className="mb-1 block font-display text-[10px] font-bold tracking-wider text-rose-400">
                ผู้โจมตี (ATTACKER)
              </label>
              <select
                value={attackerId}
                onChange={(e) => setAttackerId(e.target.value)}
                className="w-full rounded-[2px] border border-slate-700 bg-[#111622] px-2 py-1.5 text-xs font-semibold text-slate-100 focus:border-[#C8A253] focus:outline-none"
              >
                <option value="">-- เลือกผู้โจมตี --</option>
                {activeUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} (ATK {u.atk} · {u.position ? formatCoordLabel(u.position.x, u.position.y) : ''})
                  </option>
                ))}
              </select>
              {attacker && attackerTerrain && (
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                  <span>
                    ATK: <strong className="text-slate-200">{attacker.atk}</strong> · HP:{' '}
                    <strong className="text-emerald-300">
                      {attacker.hp}/{attacker.maxHp}
                    </strong>
                  </span>
                  <span>
                    <strong className="text-[#E5C983]">
                      {TERRAINS_BY_ID[attackerTerrain]?.label}
                    </strong>
                  </span>
                </div>
              )}
            </div>

            <div className="rounded-[2px] border border-slate-800 bg-[#090B10] p-2">
              <label className="mb-1 block font-display text-[10px] font-bold tracking-wider text-sky-400">
                เป้าหมาย (DEFENDER)
              </label>
              <select
                value={defenderId}
                onChange={(e) => setDefenderId(e.target.value)}
                className="w-full rounded-[2px] border border-slate-700 bg-[#111622] px-2 py-1.5 text-xs font-semibold text-slate-100 focus:border-[#C8A253] focus:outline-none"
              >
                <option value="">-- เลือกเป้าหมาย --</option>
                {activeUnits
                  .filter((u) => u.id !== attackerId)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} (HP {u.hp}/{u.maxHp} · {u.position ? formatCoordLabel(u.position.x, u.position.y) : ''})
                    </option>
                  ))}
              </select>
              {defender && defenderTerrain && (
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                  <span>
                    HP:{' '}
                    <strong className="text-emerald-300">
                      {defender.hp}/{defender.maxHp}
                    </strong>{' '}
                    · ATK: <strong className="text-slate-200">{defender.atk}</strong>
                  </span>
                  <span>
                    <strong className="text-[#E5C983]">
                      {TERRAINS_BY_ID[defenderTerrain]?.label}
                    </strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Defender Stance & Guard Selector */}
          <div className="rounded-[2px] border border-[#C8A253]/30 bg-[#090B10] p-2.5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-display text-[10px] font-bold uppercase tracking-wider text-[#C8A253]">
                STANCE &amp; GUARD ของฝ่ายรับ (DEFENDER)
              </span>
              {defenderOrder && (
                <span className="rounded-[2px] border border-emerald-700/70 bg-emerald-950/50 px-1.5 py-px text-[9px] font-bold text-emerald-300">
                  ดึงจากคำสั่งลับอัตโนมัติ
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {DEFENDER_STANCE_BTNS.map((st) => {
                const active = defenderStance === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setDefenderStance(st.id)}
                    className={`rounded-[2px] border py-1.5 text-[11px] font-bold transition ${
                      active
                        ? st.activeClass
                        : 'border-slate-700 bg-[#111622] text-slate-400 hover:border-slate-500 hover:text-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>

            <label className="mt-2 flex cursor-pointer items-center justify-between rounded-[2px] border border-slate-800 bg-[#111622] px-2.5 py-1.5 text-[11px] text-slate-200">
              <span className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={isGuarding}
                  onChange={(e) => setIsGuarding(e.target.checked)}
                  className="h-3.5 w-3.5 accent-sky-500"
                />
                <Shield className="h-3.5 w-3.5 text-sky-400" />
                <span>
                  ฝ่ายรับกด <strong>Guard</strong>
                </span>
              </span>
              <span className="font-mono text-[10px] font-bold text-[#E5C983]">
                ลดดาเมจรวม: {reductionPct}%
              </span>
            </label>
          </div>

          {/* Terrain & Status Modifier Checkboxes */}
          <div className="rounded-[2px] border border-[#C8A253]/25 bg-[#090B10] p-2.5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-display text-[10px] font-bold uppercase tracking-wider text-[#C8A253]">
                ตัวคูณภูมิประเทศ &amp; ปรับเพิ่ม/ลดอิสระ
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <label className="flex cursor-pointer items-center gap-1.5 rounded-[2px] border border-slate-800 bg-[#111622] px-2 py-1 text-slate-200">
                <input
                  type="checkbox"
                  checked={highGroundAtk}
                  onChange={(e) => setHighGroundAtk(e.target.checked)}
                  className="h-3.5 w-3.5 accent-[#C8A253]"
                />
                <span>High Ground ตึก (+1 ATK)</span>
              </label>

              <label className="flex cursor-pointer items-center gap-1.5 rounded-[2px] border border-slate-800 bg-[#111622] px-2 py-1 text-slate-200">
                <input
                  type="checkbox"
                  checked={waterExposed}
                  onChange={(e) => setWaterExposed(e.target.checked)}
                  className="h-3.5 w-3.5 accent-sky-400"
                />
                <span>Exposed แม่น้ำ (+1 DMG)</span>
              </label>

              <label className="flex cursor-pointer items-center gap-1.5 rounded-[2px] border border-slate-800 bg-[#111622] px-2 py-1 text-slate-200">
                <input
                  type="checkbox"
                  checked={forestCover}
                  onChange={(e) => setForestCover(e.target.checked)}
                  className="h-3.5 w-3.5 accent-emerald-400"
                />
                <span>ป่า Cover ตีไกล (-1 DMG)</span>
              </label>

              <label className="flex cursor-pointer items-center gap-1.5 rounded-[2px] border border-slate-800 bg-[#111622] px-2 py-1 text-slate-200">
                <input
                  type="checkbox"
                  checked={ruinsCover}
                  onChange={(e) => setRuinsCover(e.target.checked)}
                  className="h-3.5 w-3.5 accent-amber-400"
                />
                <span>ซากปรักฯ Cover (-1 ตีปกติ)</span>
              </label>
            </div>

            {/* Custom Bonus / Penalty Stepper */}
            <div className="mt-2 flex items-center justify-between border-t border-slate-800 pt-2 text-[11px]">
              <span className="text-slate-400">
                ปรับเพิ่ม/ลดอิสระ (เช่น Mana Burst, DEF+1):
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCustomMod((v) => v - 1)}
                  className="flex h-6 w-6 items-center justify-center rounded-[2px] border border-slate-700 bg-[#111622] hover:border-[#C8A253]"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-8 text-center font-mono text-xs font-bold text-[#E5C983]">
                  {customMod > 0 ? `+${customMod}` : customMod}
                </span>
                <button
                  type="button"
                  onClick={() => setCustomMod((v) => v + 1)}
                  className="flex h-6 w-6 items-center justify-center rounded-[2px] border border-slate-700 bg-[#111622] hover:border-[#C8A253]"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Built-in 1d6 Dice Roll Row */}
          <div className="flex items-center justify-between gap-2 rounded-[2px] border border-[#C8A253]/35 bg-[#090B10] px-3 py-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={rolling || !attacker || !defender}
                onClick={handleRollDice}
                className="flex items-center gap-1.5 rounded-[2px] border border-[#C8A253] bg-[#C8A253]/20 px-3 py-1.5 text-xs font-bold text-[#E5C983] transition hover:bg-[#C8A253]/30 disabled:opacity-50"
              >
                <Dices className="h-4 w-4" />
                <span>{rolling ? 'กำลังทอย...' : 'ทอย 1d6'}</span>
              </button>
              {lastRollValue !== null && (
                <span className="text-xs font-bold text-slate-200">
                  ออก{' '}
                  <strong className="font-mono text-sm text-[#E5C983]">
                    {lastRollValue}
                  </strong>{' '}
                  ({lastRollValue >= 5 ? '+2 CRIT!' : `+${diceResultToBonus(lastRollValue)}`})
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <span className="mr-1 text-[10px] text-slate-400">โบนัสเต๋า:</span>
              {[0, 1, 2].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setDiceBonus(b)}
                  className={`rounded-[2px] border px-2 py-1 font-mono text-[11px] font-bold transition ${
                    diceBonus === b
                      ? 'border-[#C8A253] bg-[#C8A253] text-[#090B10]'
                      : 'border-slate-700 bg-[#111622] text-slate-300 hover:border-[#C8A253]/60'
                  }`}
                >
                  +{b}
                </button>
              ))}
            </div>
          </div>

          {/* Net Damage Summary & Apply Button */}
          <div className="flex items-center justify-between gap-3 rounded-[2px] border border-red-800/70 bg-red-950/25 px-3.5 py-2.5">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>ความเสียหายสุทธิ (NET DAMAGE)</span>
                {reductionPct > 0 && (
                  <span className="rounded-[2px] bg-sky-950 px-1.5 py-px font-mono text-[9.5px] text-sky-300">
                    Raw {clampedDamage} → -{reductionPct}%
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-black text-red-400">
                  -{finalDamage} HP
                </span>
                {defender && (
                  <span className="text-[11px] text-slate-300">
                    ({defender.hp} → {Math.max(0, defender.hp - finalDamage)}/{defender.maxHp})
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              disabled={!attacker || !defender || defender.status !== 'active'}
              onClick={handleApplyDamage}
              className="flex items-center gap-1.5 rounded-[2px] border border-[#C8A253]/70 bg-[#B91C1C] px-4 py-2 font-display text-xs font-bold tracking-wider text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Swords className="h-4 w-4" />
              <span>Apply -{finalDamage} HP</span>
            </button>
          </div>

          {appliedNotice && (
            <div className="flex items-center gap-1.5 rounded-[2px] border border-emerald-700/60 bg-emerald-950/40 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>{appliedNotice}</span>
            </div>
          )}

          {/* Attack Stance Counter-Attack Box */}
          {attacker && defender && defenderStance === 'attack' && counterAnalysis && (
            <div className="rounded-[2px] border border-rose-500/60 bg-rose-950/20 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-xs font-bold tracking-wider text-rose-300">
                  ⚔️ Attack Stance Counter-Attack
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  Range {counterAnalysis.effectiveRange}
                  {counterAnalysis.highGroundRangeBonus ? ' (+1 ตึก)' : ''} · ห่าง{' '}
                  {counterAnalysis.sameZone ? `${counterAnalysis.dist} ช่อง` : 'คนละโซน'}
                </span>
              </div>

              {counterAnalysis.inRange ? (
                <div className="mt-2 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
                    <span>
                      50% ของ ATK ฝ่ายรับ ({counterAnalysis.defenderEffectiveAtk}
                      {counterAnalysis.defenderHighGroundAtk > 0 ? ' รวม +1 ตึก' : ''}) ={' '}
                      <strong className="font-mono text-rose-300">
                        {counterAnalysis.baseCounterDmg}
                      </strong>
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">ปรับสด:</span>
                      <button
                        type="button"
                        onClick={() => setCounterCustomMod((v) => v - 1)}
                        className="flex h-5 w-5 items-center justify-center rounded-[2px] border border-slate-700 bg-[#090B10] hover:border-rose-400"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-7 text-center font-mono text-xs font-bold text-rose-300">
                        {finalCounterDamage}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCounterCustomMod((v) => v + 1)}
                        className="flex h-5 w-5 items-center justify-center rounded-[2px] border border-slate-700 bg-[#090B10] hover:border-rose-400"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={attacker.status !== 'active' || finalCounterDamage <= 0}
                    onClick={handleApplyCounter}
                    className="flex w-full items-center justify-center gap-1.5 rounded-[2px] border border-rose-500/80 bg-rose-700/80 py-1.5 text-xs font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Swords className="h-3.5 w-3.5" />
                    <span>
                      Apply Counter -{finalCounterDamage} HP ใส่ผู้โจมตี ({attacker.name})
                    </span>
                  </button>

                  {counterNotice && (
                    <div className="flex items-center gap-1.5 rounded-[2px] border border-rose-700/60 bg-rose-950/50 px-2 py-1 text-[10.5px] font-semibold text-rose-200">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      <span>{counterNotice}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-1.5 text-xs text-slate-400">
                  นอกระยะสวนกลับ (Range {counterAnalysis.effectiveRange}, ห่าง{' '}
                  {counterAnalysis.sameZone ? `${counterAnalysis.dist} ช่อง` : 'คนละโซน'})
                </p>
              )}
            </div>
          )}

          {/* Post-Hit Movement Status Strip */}
          {attacker && defender && (
            <div className="rounded-[2px] border border-slate-800 bg-[#090B10] p-2.5">
              <div className="mb-1.5 font-display text-[10px] font-bold uppercase tracking-wider text-slate-400">
                ผลหลังโดนโจมตี (POST-HIT MOVEMENT STATUS — PRIORITY 3)
              </div>

              {defenderStance === 'attack' || defenderStance === 'defensive' ? (
                <div className="rounded-[2px] border border-amber-600/60 bg-amber-950/40 px-2.5 py-1.5 text-xs font-bold text-amber-300">
                  🛑 ติดชะงัก: ฝ่ายรับไม่ขยับใน Priority 3
                </div>
              ) : !isGuarding ? (
                <div className="rounded-[2px] border border-sky-600/60 bg-sky-950/40 px-2.5 py-1.5 text-xs font-bold text-sky-300">
                  💨 Evade: ฝ่ายรับยังเดินไปจุด Move ที่สั่งไว้ได้ (ไม่ติด ZoC)
                </div>
              ) : (
                <div className="space-y-2 rounded-[2px] border border-emerald-600/60 bg-emerald-950/35 px-2.5 py-2">
                  <div className="text-xs font-bold text-emerald-300">
                    💨 Guard + Evade: ถอยหลัง 1 ช่องนับจากผู้โจมตี
                  </div>
                  {defender.status !== 'active' ? (
                    <p className="text-[11px] text-slate-400">
                      ฝ่ายรับถูกกำจัดแล้ว — ไม่สามารถถอยหลังได้
                    </p>
                  ) : retreatTiles.length === 0 ? (
                    <p className="text-[11px] text-slate-400">
                      ไม่มีช่องว่างให้ถอยหลัง 1 ช่อง (ติดขอบกระดานหรือมีหมากยืนขวาง)
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {retreatTiles.map((tile) => (
                        <button
                          key={`${tile.zone}-${tile.x}-${tile.y}`}
                          type="button"
                          onClick={() => handleApplyRetreat(tile)}
                          className="flex items-center gap-1 rounded-[2px] border border-emerald-500/80 bg-emerald-900/50 px-2.5 py-1 text-[11px] font-bold text-emerald-200 transition hover:bg-emerald-700 hover:text-white"
                        >
                          <CornerDownLeft className="h-3 w-3" />
                          <span>
                            ถอยไป {formatCoordLabel(tile.x, tile.y)} ({tile.x}, {tile.y})
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {retreatNotice && (
                    <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      <span>{retreatNotice}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Defeat / Kill Bounty 1-Click Payout Strip */}
          {killBanner && (
            <div className="clip-tactical-sm space-y-2 border border-[#C8A253] bg-[#C8A253]/12 p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#E5C983]">
                <Skull className="h-4 w-4 text-red-400" />
                <span>
                  {killBanner.victimName} ถูกกำจัดแล้ว! (เปลี่ยนสถานะเป็น Defeated อัตโนมัติ)
                </span>
              </div>

              {killBanner.paid ? (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    จ่ายรางวัลสังหารให้ {killBanner.killerTeam === 'team_a' ? 'Team A' : 'Team B'} เรียบร้อยแล้ว!
                  </span>
                </div>
              ) : killBanner.victimType === 'servant' ? (
                <button
                  type="button"
                  onClick={() => {
                    grantServantKillBounty(killBanner.killerTeam, killBanner.victimName);
                    setKillBanner({ ...killBanner, paid: true });
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-[2px] bg-[#C8A253] py-2 text-xs font-bold text-[#090B10] transition hover:bg-[#E5C983]"
                >
                  <Award className="h-4 w-4" />
                  <span>
                    จ่าย Bounty (+4 Mana, +3 QP) ให้{' '}
                    {killBanner.killerTeam === 'team_a' ? 'Team A' : 'Team B'}
                  </span>
                </button>
              ) : monsterTpl && monsterTpl.tier === 1 ? (
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      grantMonsterReward(
                        killBanner.killerTeam,
                        monsterTpl.id,
                        killBanner.killerUnitId,
                        'mana'
                      );
                      setKillBanner({ ...killBanner, paid: true });
                    }}
                    className="flex items-center justify-center gap-1 rounded-[2px] bg-sky-700 py-1.5 text-[11px] font-bold text-white hover:bg-sky-600"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>จ่ายรางวัล (+2 Mana)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      grantMonsterReward(
                        killBanner.killerTeam,
                        monsterTpl.id,
                        killBanner.killerUnitId,
                        'qp'
                      );
                      setKillBanner({ ...killBanner, paid: true });
                    }}
                    className="flex items-center justify-center gap-1 rounded-[2px] bg-[#C8A253] py-1.5 text-[11px] font-bold text-[#090B10] hover:bg-[#E5C983]"
                  >
                    <Award className="h-3.5 w-3.5" />
                    <span>จ่ายรางวัล (+2 QP)</span>
                  </button>
                </div>
              ) : monsterTpl ? (
                <button
                  type="button"
                  onClick={() => {
                    grantMonsterReward(
                      killBanner.killerTeam,
                      monsterTpl.id,
                      killBanner.killerUnitId
                    );
                    setKillBanner({ ...killBanner, paid: true });
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-[2px] bg-[#C8A253] py-2 text-xs font-bold text-[#090B10] transition hover:bg-[#E5C983]"
                >
                  <Award className="h-4 w-4" />
                  <span>จ่ายรางวัลมอนสเตอร์ ({monsterTpl.rewardNote})</span>
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
