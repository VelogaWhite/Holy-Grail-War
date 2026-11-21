import { useEffect, useState } from 'react';
import {
  Award,
  ClipboardList,
  Eye,
  Flame,
  Heart,
  Minus,
  Move,
  Plus,
  Shield,
  Sparkles,
  Swords,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { MONSTERS_BY_ID, SERVANTS_BY_ID } from '../../data';
import { useGameStore } from '../../store/useGameStore';
import type { UnitStatus, ZoneId } from '../../types/game';
import {
  formatCoordLabel,
  getClassIconUrl,
  getFactionStyle,
  getInitials,
  resolveAssetUrl,
} from '../../utils/assetHelper';
import { TileInspector } from '../board/TileInspector';
import { SecretCommandPanel } from '../master/SecretCommandPanel';
import { SecretOrdersViewer } from './SecretOrdersViewer';

const QUICK_TAGS = [
  'Guard',
  'Evade 1x',
  'Invincible',
  'Stun',
  'ATK+1',
  'DEF+1',
  'Guts',
  'Engaged',
];

function StatAdjuster({
  label,
  value,
  subValue,
  icon,
  canEdit,
  onMinus,
  onPlus,
}: {
  label: string;
  value: number;
  subValue?: string;
  icon: React.ReactNode;
  canEdit: boolean;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="rounded-[2px] border border-[#C8A253]/25 bg-[#090B10] px-1.5 py-1.5 text-center">
      <div className="flex items-center justify-center gap-1">
        {icon}
        <span className="font-display text-[8.5px] font-bold tracking-wider text-slate-400">
          {label}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-center gap-1">
        {canEdit && (
          <button
            type="button"
            onClick={onMinus}
            className="flex h-4 w-4 items-center justify-center rounded-[2px] border border-slate-700 bg-[#111622] text-slate-300 hover:border-[#C8A253] hover:text-white"
          >
            <Minus className="h-2.5 w-2.5" />
          </button>
        )}
        <span className="font-mono text-xs font-bold text-slate-100">
          {value}
          {subValue ? <span className="text-[10px] text-slate-500">{subValue}</span> : null}
        </span>
        {canEdit && (
          <button
            type="button"
            onClick={onPlus}
            className="flex h-4 w-4 items-center justify-center rounded-[2px] border border-slate-700 bg-[#111622] text-slate-300 hover:border-[#C8A253] hover:text-white"
          >
            <Plus className="h-2.5 w-2.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function UnitInspectorPanel() {
  const previewRole = useGameStore((s) => s.previewRole);
  const roomState = useGameStore((s) => s.roomState);
  const units = roomState.units;
  const selectedUnitId = useGameStore((s) => s.selectedUnitId);
  const updateUnit = useGameStore((s) => s.updateUnit);
  const removeUnit = useGameStore((s) => s.removeUnit);
  const teleportUnitToZone = useGameStore((s) => s.teleportUnitToZone);
  const addUnitTag = useGameStore((s) => s.addUnitTag);
  const removeUnitTag = useGameStore((s) => s.removeUnitTag);

  const [imgErr, setImgErr] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');
  const [rightTab, setRightTab] = useState<'inspector' | 'orders'>('inspector');

  const isRuler = previewRole === 'ruler';
  const unit = selectedUnitId ? units[selectedUnitId] : null;
  const lockedCount =
    (roomState.teams.team_a.readyLocked ? 1 : 0) +
    (roomState.teams.team_b.readyLocked ? 1 : 0);

  useEffect(() => {
    setImgErr(false);
    setCustomTagInput('');
  }, [selectedUnitId]);

  // Master View gets the Secret Command Queue Panel (+ TileInspector inside it)
  if (!isRuler) {
    return <SecretCommandPanel />;
  }

  const faction = unit ? getFactionStyle(unit.owner) : null;
  const imgUrl = unit ? resolveAssetUrl(unit.image) : null;
  const classIconUrl = unit ? getClassIconUrl(unit.servantClass, unit.subClass) : null;
  const servantTpl =
    unit && unit.unitType === 'servant' ? SERVANTS_BY_ID[unit.templateId] : null;
  const monsterTpl =
    unit && unit.unitType === 'monster' ? MONSTERS_BY_ID[unit.templateId] : null;

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unit || !customTagInput.trim()) return;
    addUnitTag(unit.id, customTagInput);
    setCustomTagInput('');
  };

  return (
    <aside className="flex w-[320px] shrink-0 flex-col overflow-hidden border-l border-[#C8A253]/25 bg-[#111622] text-slate-100">
      {/* Ruler 2-Tab Switcher (Unit Inspector | Secret Orders) */}
      <div className="grid shrink-0 grid-cols-2 border-b border-[#C8A253]/25 bg-[#090B10]">
        <button
          type="button"
          onClick={() => setRightTab('inspector')}
          className={`flex items-center justify-center gap-1.5 border-b-2 py-2 font-display text-[11px] font-bold tracking-wider transition ${
            rightTab === 'inspector'
              ? 'border-[#C8A253] bg-[#111622] text-[#E5C983]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Target className="h-3.5 w-3.5" />
          <span>Inspector</span>
        </button>
        <button
          type="button"
          onClick={() => setRightTab('orders')}
          className={`flex items-center justify-center gap-1.5 border-b-2 py-2 font-display text-[11px] font-bold tracking-wider transition ${
            rightTab === 'orders'
              ? 'border-[#C8A253] bg-[#111622] text-[#E5C983]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ClipboardList className="h-3.5 w-3.5" />
          <span>Orders</span>
          <span
            className={`rounded-[2px] px-1 py-px text-[9px] font-bold ${
              lockedCount === 2
                ? 'bg-emerald-600 text-white'
                : lockedCount === 1
                  ? 'bg-[#C8A253] text-[#090B10]'
                  : 'bg-slate-800 text-slate-400'
            }`}
          >
            {lockedCount}/2
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
      {rightTab === 'orders' ? (
        <SecretOrdersViewer />
      ) : (
      <>
      {/* Header */}
      <div className="mb-2 flex items-center justify-between border-b border-[#C8A253]/25 pb-1.5">
        <h2 className="font-display text-xs font-bold uppercase tracking-widest text-[#C8A253]">
          Unit Inspector
        </h2>
        {faction && (
          <span
            className={`rounded-[2px] px-2 py-0.5 font-display text-[10px] font-bold tracking-wider ${faction.badgeBg}`}
          >
            {faction.label}
          </span>
        )}
      </div>

      {!unit || !faction ? (
        <div className="flex flex-col items-center justify-center rounded-[2px] border border-dashed border-slate-700 bg-[#090B10]/60 py-6 text-center text-slate-400">
          <Target className="mb-1.5 h-6 w-6 text-slate-600" />
          <p className="text-xs font-bold text-slate-300">เลือกยูนิตบนกระดาน</p>
        </div>
      ) : (
        <div>
          {/* Unit Identity Card */}
          <div className="clip-tactical flex gap-2.5 border border-[#C8A253]/35 bg-[#090B10] p-2">
            <div
              className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-[2px] border-2 ${faction.border} bg-[#111622]`}
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
                  className={`flex h-full w-full items-center justify-center font-display text-sm font-bold text-white ${faction.bg}`}
                >
                  {getInitials(unit.name)}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-display truncate text-sm font-bold tracking-wide text-[#E5C983]">
                {unit.name}
              </h3>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                {classIconUrl && (
                  <img
                    src={classIconUrl}
                    alt={unit.servantClass ?? ''}
                    className="h-3.5 w-3.5 rounded-full border border-[#C8A253]/40 bg-[#090B10] object-contain p-0.5"
                  />
                )}
                <span className="truncate">
                  {unit.unitType === 'servant'
                    ? `${unit.servantClass}${unit.subClass ? ` (${unit.subClass})` : ''}`
                    : `PvE Monster · T${monsterTpl?.tier ?? 1}`}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1 text-[9.5px] font-bold">
                <span className="rounded-[2px] border border-slate-700 bg-slate-900 px-1.5 py-px uppercase text-slate-200">
                  {unit.status}
                </span>
                {unit.position && (
                  <span className="rounded-[2px] border border-[#C8A253]/30 bg-[#111622] px-1.5 py-px font-display text-[#C8A253]">
                    {unit.position.zone.toUpperCase()}{' '}
                    {formatCoordLabel(unit.position.x, unit.position.y)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Live Stat Editors (2x2 Grid for crisp +/- buttons) */}
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <StatAdjuster
              label="HP"
              value={unit.hp}
              subValue={`/${unit.maxHp}`}
              icon={<Heart className="h-3 w-3 text-emerald-400" />}
              canEdit={isRuler}
              onMinus={() => updateUnit(unit.id, { hp: Math.max(0, unit.hp - 1) })}
              onPlus={() => updateUnit(unit.id, { hp: Math.min(unit.maxHp, unit.hp + 1) })}
            />
            <StatAdjuster
              label="MAX HP"
              value={unit.maxHp}
              icon={<Heart className="h-3 w-3 text-slate-400" />}
              canEdit={isRuler}
              onMinus={() =>
                updateUnit(unit.id, {
                  maxHp: Math.max(1, unit.maxHp - 1),
                  hp: Math.min(unit.hp, Math.max(1, unit.maxHp - 1)),
                })
              }
              onPlus={() => updateUnit(unit.id, { maxHp: unit.maxHp + 1 })}
            />
            <StatAdjuster
              label="ATK"
              value={unit.atk}
              icon={<Swords className="h-3 w-3 text-red-400" />}
              canEdit={isRuler}
              onMinus={() => updateUnit(unit.id, { atk: Math.max(0, unit.atk - 1) })}
              onPlus={() => updateUnit(unit.id, { atk: unit.atk + 1 })}
            />
            <StatAdjuster
              label="MOV"
              value={unit.mov}
              icon={<Move className="h-3 w-3 text-sky-400" />}
              canEdit={isRuler}
              onMinus={() => updateUnit(unit.id, { mov: Math.max(0, unit.mov - 1) })}
              onPlus={() => updateUnit(unit.id, { mov: unit.mov + 1 })}
            />
          </div>

          {/* Ruler God-Mode Controls: Zone Teleport, Status, Toggles */}
          {isRuler && (
            <div className="mt-2 space-y-1.5 rounded-[2px] border border-[#C8A253]/25 bg-[#090B10]/80 p-2">
              {/* Zone Teleport */}
              <div className="flex items-center gap-1">
                <span className="w-12 shrink-0 text-[9.5px] font-bold text-slate-400">
                  วาร์ปโซน:
                </span>
                {(
                  [
                    { id: 'base_a', label: 'Enzo' },
                    { id: 'central', label: 'Central' },
                    { id: 'base_b', label: 'Shinto' },
                  ] as { id: ZoneId; label: string }[]
                ).map((z) => (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => teleportUnitToZone(unit.id, z.id)}
                    className={`flex-1 rounded-[2px] border py-0.5 text-[10px] font-bold transition ${
                      unit.position?.zone === z.id
                        ? 'border-[#C8A253] bg-[#C8A253]/20 text-[#E5C983]'
                        : 'border-slate-700 bg-[#111622] text-slate-300 hover:border-[#C8A253]/50'
                    }`}
                  >
                    {z.label}
                  </button>
                ))}
              </div>

              {/* Status Switcher */}
              <div className="flex items-center gap-1">
                <span className="w-12 shrink-0 text-[9.5px] font-bold text-slate-400">
                  สถานะ:
                </span>
                {(['active', 'reserve', 'defeated'] as UnitStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => updateUnit(unit.id, { status: st })}
                    className={`flex-1 rounded-[2px] border py-0.5 text-[9.5px] font-bold uppercase transition ${
                      unit.status === st
                        ? st === 'defeated'
                          ? 'border-red-600 bg-[#B91C1C] text-white'
                          : 'border-[#C8A253] bg-[#C8A253]/20 text-[#E5C983]'
                        : 'border-slate-700 bg-[#111622] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st === 'defeated' ? 'Defeated' : st}
                  </button>
                ))}
              </div>

              {/* Toggles Row */}
              <div className="flex items-center gap-1 pt-0.5">
                <button
                  type="button"
                  onClick={() => updateUnit(unit.id, { npReady: !unit.npReady })}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-[2px] border py-1 text-[10px] font-bold transition ${
                    unit.npReady
                      ? 'border-[#C8A253] bg-[#C8A253]/20 text-[#E5C983]'
                      : 'border-slate-700 bg-[#111622] text-slate-400'
                  }`}
                >
                  <Sparkles className="h-3 w-3" />
                  <span>NP Ready</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateUnit(unit.id, { isRevealedToEnemy: !unit.isRevealedToEnemy })
                  }
                  className={`flex flex-1 items-center justify-center gap-1 rounded-[2px] border py-1 text-[10px] font-bold transition ${
                    unit.isRevealedToEnemy
                      ? 'border-sky-600 bg-sky-950/60 text-sky-300'
                      : 'border-slate-700 bg-[#111622] text-slate-400'
                  }`}
                >
                  <Eye className="h-3 w-3" />
                  <span>Reveal Fog</span>
                </button>
                {unit.unitType === 'monster' && (
                  <button
                    type="button"
                    onClick={() => removeUnit(unit.id)}
                    title="ลบมอนสเตอร์ตัวนี้ออกจากกระดาน"
                    className="flex items-center justify-center rounded-[2px] border border-red-900/70 bg-red-950/40 px-2 py-1 text-red-400 hover:bg-[#B91C1C] hover:text-white"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Custom Buff Tags + Quick-Tags */}
          <div className="mt-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-display text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Status / Buff Tags
              </span>
            </div>

            {unit.tags.length > 0 && (
              <div className="mb-1.5 flex flex-wrap gap-1">
                {unit.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-[2px] border border-[#C8A253]/40 bg-[#090B10] px-1.5 py-0.5 text-[10px] font-semibold text-[#E5C983]"
                  >
                    <span>{tag}</span>
                    {isRuler && (
                      <button
                        type="button"
                        onClick={() => removeUnitTag(unit.id, tag)}
                        className="text-slate-500 hover:text-red-400"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}

            {isRuler && (
              <div className="space-y-1.5">
                <form onSubmit={handleAddCustomTag} className="flex gap-1">
                  <input
                    type="text"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    placeholder="พิมพ์ Tag อิสระ เช่น Burn -1"
                    className="min-w-0 flex-1 rounded-[2px] border border-slate-700 bg-[#090B10] px-2 py-1 text-[10.5px] text-slate-200 placeholder:text-slate-600 focus:border-[#C8A253] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-[2px] border border-[#C8A253]/50 bg-[#090B10] px-2 py-1 text-[10px] font-bold text-[#C8A253] hover:bg-[#C8A253]/15"
                  >
                    + Tag
                  </button>
                </form>
                <div className="flex flex-wrap gap-1">
                  {QUICK_TAGS.map((qt) => (
                    <button
                      key={qt}
                      type="button"
                      onClick={() => addUnitTag(unit.id, qt)}
                      className="rounded-[2px] border border-slate-800 bg-[#090B10] px-1.5 py-0.5 text-[9.5px] font-medium text-slate-400 transition hover:border-[#C8A253]/50 hover:text-[#E5C983]"
                    >
                      +{qt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Servant Skill & NP Details */}
          {servantTpl && (
            <div className="mt-2.5 space-y-2">
              <div className="rounded-[2px] border border-slate-800 bg-[#090B10] p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display flex items-center gap-1 text-[11px] font-bold tracking-wide text-sky-300">
                    <Sparkles className="h-3 w-3 shrink-0 text-sky-400" />
                    {servantTpl.skillName}
                  </span>
                  <span className="shrink-0 rounded-[2px] border border-sky-800/70 bg-sky-950/60 px-1.5 py-px text-[9.5px] font-bold text-sky-300">
                    {servantTpl.skillCost}M
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-snug text-slate-300">
                  {servantTpl.skillDesc}
                </p>
              </div>

              <div className="clip-tactical border border-[#C8A253]/45 bg-[#090B10] p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display flex items-center gap-1 text-[11px] font-bold tracking-wide text-[#E5C983]">
                    <Flame className="h-3 w-3 shrink-0 text-[#B91C1C]" />
                    {servantTpl.npName}
                  </span>
                  <span className="shrink-0 rounded-[2px] bg-[#B91C1C] px-1.5 py-px text-[9.5px] font-bold text-slate-100">
                    {servantTpl.npCost}M
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-snug text-slate-200">
                  {servantTpl.npDesc}
                </p>
              </div>
            </div>
          )}

          {/* Monster Reward Info */}
          {monsterTpl && (
            <div className="clip-tactical mt-2.5 border border-[#C8A253]/40 bg-[#090B10] p-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#E5C983]">
                <Award className="h-3.5 w-3.5 text-[#C8A253]" />
                <span>รางวัลเมื่อกำจัด (Tier {monsterTpl.tier})</span>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-slate-200">
                {monsterTpl.rewardNote}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tile Inspector (Scene Banner + Layer 1 & 2) */}
      <TileInspector />
      </>
      )}

      {/* Compact Phase 3 Status Pill */}
      <div className="mt-3 flex items-center justify-between rounded-[2px] border border-[#C8A253]/20 bg-[#090B10]/80 px-2.5 py-1.5 text-[10px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <Shield className="h-3 w-3 text-[#C8A253]" />
          <strong className="text-slate-300">Phase 3</strong> · WEGO Real-time
        </span>
        <span className="text-slate-500">Spark Ready</span>
      </div>
      </div>
    </aside>
  );
}
