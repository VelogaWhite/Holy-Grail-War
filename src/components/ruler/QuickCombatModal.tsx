import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Dices,
  Minus,
  Plus,
  Shield,
  Skull,
  Sparkles,
  Swords,
  X,
} from 'lucide-react';
import { MONSTERS_BY_ID, TERRAINS_BY_ID } from '../../data';
import { useGameStore } from '../../store/useGameStore';
import type { BoardUnit, TeamId } from '../../types/game';
import { formatCoordLabel } from '../../utils/assetHelper';
import { getTerrainAt } from '../../utils/gridMath';

function diceResultToBonus(roll: number): number {
  if (roll >= 6) return 2;
  if (roll >= 3) return 1;
  return 0;
}

interface KillRewardBanner {
  victimType: 'servant' | 'monster';
  victimName: string;
  monsterTemplateId?: string;
  killerTeam: TeamId;
  killerUnitId: string;
  paid: boolean;
}

export function QuickCombatModal() {
  const previewRole = useGameStore((s) => s.previewRole);
  const isOpen = useGameStore((s) => s.isCombatHelperOpen);
  const preselectedAttackerId = useGameStore((s) => s.combatPreselectedAttackerId);
  const setCombatHelperOpen = useGameStore((s) => s.setCombatHelperOpen);
  const roomState = useGameStore((s) => s.roomState);
  const rollDice1d6 = useGameStore((s) => s.rollDice1d6);
  const applyCombatDamage = useGameStore((s) => s.applyCombatDamage);
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
  const [guardHalved, setGuardHalved] = useState(false);
  const [customMod, setCustomMod] = useState(0);

  const [killBanner, setKillBanner] = useState<KillRewardBanner | null>(null);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);
  const lastBroadcastIdRef = useRef<string | null>(roomState.diceBroadcast?.id ?? null);

  // Initialize attacker/defender when opening modal
  useEffect(() => {
    if (!isOpen) return;
    setKillBanner(null);
    setAppliedNotice(null);
    setCustomMod(0);
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

  const attackerTerrain = attacker?.position
    ? getTerrainAt(attacker.position.zone, attacker.position.x, attacker.position.y)
    : null;
  const defenderTerrain = defender?.position
    ? getTerrainAt(defender.position.zone, defender.position.x, defender.position.y)
    : null;

  // Auto-detect terrain & Guard modifiers when attacker/defender selection changes
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
    setGuardHalved(defender.tags.some((t) => t.toLowerCase() === 'guard'));
  }, [attacker?.id, defender?.id, attackerTerrain, defenderTerrain]);

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
  const finalDamage = guardHalved ? Math.floor(clampedDamage / 2) : clampedDamage;

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

    applyCombatDamage(defender.id, finalDamage, attacker.name);
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

  const monsterTpl = killBanner?.monsterTemplateId
    ? MONSTERS_BY_ID[killBanner.monsterTemplateId]
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
      onClick={() => setCombatHelperOpen(false)}
    >
      <div
        className="clip-tactical flex w-full max-w-lg flex-col border border-[#C8A253]/60 bg-[#111622] text-slate-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#C8A253]/25 bg-[#090B10] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Swords className="h-4 w-4 text-[#C8A253]" />
            <div>
              <h2 className="font-display text-sm font-bold tracking-widest text-[#E5C983]">
                QUICK COMBAT HELPER
              </h2>
              <p className="text-[10px] text-slate-400">
                คำนวณภูมิประเทศอัตโนมัติ + ทอย 1d6 ซิงก์ทั้ง 3 หน้าจอ + หักเลือดในคลิกเดียว
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

        {/* Body */}
        <div className="space-y-3 p-4">
          {/* Attacker & Defender Selectors */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-[2px] border border-slate-800 bg-[#090B10] p-2">
              <label className="mb-1 block font-display text-[10px] font-bold tracking-wider text-red-400">
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
                  <span>ATK พื้นฐาน: <strong className="text-slate-200">{attacker.atk}</strong></span>
                  <span>
                    ช่อง: <strong className="text-[#E5C983]">{TERRAINS_BY_ID[attackerTerrain]?.label}</strong>
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
                    HP: <strong className="text-emerald-300">{defender.hp}/{defender.maxHp}</strong>
                  </span>
                  <span>
                    ช่อง: <strong className="text-[#E5C983]">{TERRAINS_BY_ID[defenderTerrain]?.label}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Terrain & Status Modifier Checkboxes (Auto-detected + Ruler editable) */}
          <div className="rounded-[2px] border border-[#C8A253]/25 bg-[#090B10] p-2.5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-display text-[10px] font-bold uppercase tracking-wider text-[#C8A253]">
                ตัวคูณภูมิประเทศ & สถานะ (ตรวจให้อัตโนมัติ / ติ๊กแก้ได้)
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

              <label className="col-span-2 flex cursor-pointer items-center justify-between rounded-[2px] border border-slate-800 bg-[#111622] px-2 py-1 text-slate-200">
                <span className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={guardHalved}
                    onChange={(e) => setGuardHalved(e.target.checked)}
                    className="h-3.5 w-3.5 accent-sky-500"
                  />
                  <Shield className="h-3 w-3 text-sky-400" />
                  <span>เป้าหมายติดป้าย Guard (หาร 2 ปัดลง)</span>
                </span>
                {defender?.tags.some((t) => t.toLowerCase() === 'guard') && (
                  <span className="rounded-[2px] bg-sky-950 px-1.5 py-px text-[9px] font-bold text-sky-300">
                    ตรวจพบป้าย Guard
                  </span>
                )}
              </label>
            </div>

            {/* Custom Bonus / Penalty Stepper */}
            <div className="mt-2 flex items-center justify-between border-t border-slate-800 pt-2 text-[11px]">
              <span className="text-slate-400">
                ปรับเพิ่ม/ลดอิสระ (เช่น สกิล Mana Burst, DEF+1):
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
                  ({lastRollValue === 6 ? '+2 CRIT!' : `+${diceResultToBonus(lastRollValue)}`})
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
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                ความเสียหายสุทธิ (NET DAMAGE)
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
                  <span>จ่ายรางวัลสังหารให้ {killBanner.killerTeam === 'team_a' ? 'Team A' : 'Team B'} เรียบร้อยแล้ว!</span>
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
                  <span>
                    จ่ายรางวัลมอนสเตอร์ ({monsterTpl.rewardNote})
                  </span>
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
