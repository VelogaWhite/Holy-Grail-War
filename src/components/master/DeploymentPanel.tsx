import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Lock, MapPin, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import { MAP_DATA } from '../../data';
import { useGameStore } from '../../store/useGameStore';
import type { Coordinates, DeploymentPlacement, TeamId, ZoneId } from '../../types/game';
import { formatCoordLabel, resolveAssetUrl } from '../../utils/assetHelper';
import { TileInspector } from '../board/TileInspector';

export function DeploymentPanel() {
  const previewRole = useGameStore((s) => s.previewRole);
  const roomState = useGameStore((s) => s.roomState);
  const masterAOrders = useGameStore((s) => s.masterAOrders);
  const masterBOrders = useGameStore((s) => s.masterBOrders);
  const submitMasterDeployment = useGameStore((s) => s.submitMasterDeployment);

  const teamId: TeamId = previewRole === 'master_b' ? 'team_b' : 'team_a';
  const baseZone: ZoneId = teamId === 'team_a' ? 'base_a' : 'base_b';
  const spawnType = teamId === 'team_a' ? 'spawn_a' : 'spawn_b';
  const team = roomState.teams[teamId];
  const isLocked = team.readyLocked;

  const savedDeployment =
    (teamId === 'team_a' ? masterAOrders : masterBOrders)?.deployment;

  const spawnTiles = useMemo(() => {
    return MAP_DATA.zones[baseZone].specialTiles
      .filter((t) => t.type === spawnType)
      .slice(0, 3);
  }, [baseZone, spawnType]);

  const myServants = useMemo(() => {
    return Object.values(roomState.units).filter(
      (u) => u.unitType === 'servant' && u.owner === teamId && u.status !== 'defeated'
    );
  }, [roomState.units, teamId]);

  // Map spawn index (0, 1, 2) -> unitId | null
  const [slotUnits, setSlotUnits] = useState<(string | null)[]>([null, null, null]);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  // Hydrate from saved deployment if rejoining
  useEffect(() => {
    if (!savedDeployment?.placements?.length) return;
    const next: (string | null)[] = [null, null, null];
    for (const p of savedDeployment.placements) {
      const idx = spawnTiles.findIndex(
        (t) => t.x === p.position.x && t.y === p.position.y
      );
      if (idx !== -1) next[idx] = p.unitId;
    }
    setSlotUnits(next);
  }, [savedDeployment, spawnTiles]);

  const assignedSet = new Set(slotUnits.filter(Boolean) as string[]);
  const requiredCount = Math.min(3, myServants.length);
  const filledCount = assignedSet.size;
  const canLock = !isLocked && requiredCount > 0 && filledCount === requiredCount;

  const handleAssignServantToSlot = (unitId: string) => {
    if (isLocked) return;
    setSlotUnits((prev) => {
      const next = [...prev];
      const existingIdx = next.indexOf(unitId);
      if (existingIdx !== -1) {
        // Swap with currently selected slot
        next[existingIdx] = next[selectedSlotIdx];
      }
      next[selectedSlotIdx] = unitId;
      return next;
    });
    // Auto-advance to next empty slot
    setSelectedSlotIdx((cur) => {
      const nextEmpty = slotUnits.findIndex((u, i) => i !== cur && !u);
      return nextEmpty !== -1 ? nextEmpty : (cur + 1) % 3;
    });
  };

  const handleClearSlot = (idx: number) => {
    if (isLocked) return;
    setSlotUnits((prev) => {
      const next = [...prev];
      next[idx] = null;
      return next;
    });
    setSelectedSlotIdx(idx);
  };

  const handleClearAll = () => {
    if (isLocked) return;
    setSlotUnits([null, null, null]);
    setSelectedSlotIdx(0);
  };

  const handleLockDeployment = async () => {
    if (!canLock) return;
    setSubmitting(true);
    try {
      const placements: DeploymentPlacement[] = [];
      slotUnits.forEach((unitId, idx) => {
        const tile = spawnTiles[idx];
        if (unitId && tile) {
          const position: Coordinates = { zone: baseZone, x: tile.x, y: tile.y };
          placements.push({ unitId, position });
        }
      });
      await submitMasterDeployment(placements);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <aside className="flex w-[320px] shrink-0 flex-col overflow-y-auto border-l border-[#C8A253]/25 bg-[#111622] p-3 text-slate-100">
      <div className="mb-2 flex items-center justify-between border-b border-[#C8A253]/25 pb-1.5">
        <h2 className="font-display text-xs font-bold uppercase tracking-widest text-[#E5C983]">
          Secret Deployment
        </h2>
        <span className="rounded-[2px] border border-[#C8A253]/40 bg-[#090B10] px-1.5 py-0.5 text-[10px] font-bold text-[#C8A253]">
          {filledCount}/{requiredCount} Active
        </span>
      </div>

      {isLocked ? (
        <div className="mb-2.5 flex items-center gap-2 rounded-[2px] border border-emerald-700/80 bg-emerald-950/40 px-2.5 py-2 text-xs font-semibold text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>ล็อกการจัดทัพลับแล้ว — รออีกฝั่งและ Ruler กดเริ่ม Turn 1</span>
        </div>
      ) : (
        <p className="mb-2.5 text-[11px] leading-relaxed text-slate-400">
          เลือกจุดเกิด (Spawn) ด้านล่าง แล้วคลิกเลือก <strong className="text-slate-200">3 ตัวจริง (Active)</strong> ที่ต้องการส่งลงสนาม อีก 3 ตัวที่เหลือจะเก็บเป็น <strong className="text-[#C8A253]">Reserve</strong> อัตโนมัติ
        </p>
      )}

      {/* 3 Spawn Slots */}
      <div className="space-y-1.5">
        {spawnTiles.map((tile, idx) => {
          const unitId = slotUnits[idx];
          const unit = unitId ? roomState.units[unitId] : null;
          const isSelectedSlot = selectedSlotIdx === idx && !isLocked;

          return (
            <div
              key={`${tile.x}_${tile.y}`}
              onClick={() => !isLocked && setSelectedSlotIdx(idx)}
              className={`flex cursor-pointer items-center justify-between gap-2 rounded-[2px] border p-2 transition ${
                isSelectedSlot
                  ? 'border-[#C8A253] bg-[#C8A253]/12'
                  : 'border-slate-800 bg-[#090B10] hover:border-slate-600'
              }`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex flex-col items-center rounded-[2px] border border-[#C8A253]/35 bg-[#111622] px-1.5 py-1 text-center">
                  <MapPin className="h-3 w-3 text-[#C8A253]" />
                  <span className="font-display text-[9px] font-bold text-[#E5C983]">
                    {formatCoordLabel(tile.x, tile.y)}
                  </span>
                </div>

                {unit ? (
                  <div className="flex min-w-0 items-center gap-2">
                    <img
                      src={resolveAssetUrl(unit.image) ?? ''}
                      alt={unit.name}
                      className="h-8 w-8 shrink-0 rounded-[2px] border border-[#C8A253]/50 object-cover object-top"
                    />
                    <div className="min-w-0">
                      <div className="font-display truncate text-xs font-bold text-slate-100">
                        {unit.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {unit.servantClass} · HP {unit.hp} · MOV {unit.mov}
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs italic text-slate-500">
                    {isSelectedSlot ? '← คลิก Servant ด้านล่างเพื่อวาง' : `${tile.label} (ว่าง)`}
                  </span>
                )}
              </div>

              {unit && !isLocked && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearSlot(idx);
                  }}
                  title="นำออกจากช่องนี้"
                  className="rounded p-1 text-slate-500 hover:text-red-400"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Team Servant Picker (All 6 Drafted Servants) */}
      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
            <Sparkles className="h-3 w-3 text-[#C8A253]" />
            Servants ของทีมคุณ ({myServants.length})
          </span>
          {!isLocked && filledCount > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="flex items-center gap-0.5 text-[10px] font-semibold text-slate-400 hover:text-[#E5C983]"
            >
              <RotateCcw className="h-2.5 w-2.5" />
              ล้างทั้งหมด
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {myServants.map((u) => {
            const slotIdx = slotUnits.indexOf(u.id);
            const isAssigned = slotIdx !== -1;

            return (
              <button
                key={u.id}
                type="button"
                disabled={isLocked}
                onClick={() => handleAssignServantToSlot(u.id)}
                className={`flex items-center gap-1.5 rounded-[2px] border p-1.5 text-left transition disabled:cursor-not-allowed ${
                  isAssigned
                    ? 'border-[#C8A253]/70 bg-[#C8A253]/12'
                    : 'border-slate-800 bg-[#090B10] hover:border-[#C8A253]/40'
                }`}
              >
                <img
                  src={resolveAssetUrl(u.image) ?? ''}
                  alt={u.name}
                  className="h-7 w-7 shrink-0 rounded-[2px] border border-slate-700 object-cover object-top"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-display truncate text-[10.5px] font-bold text-slate-100">
                    {u.name}
                  </div>
                  <div className="text-[9px] text-slate-400">
                    {isAssigned ? (
                      <span className="font-bold text-[#E5C983]">
                        Active · {formatCoordLabel(spawnTiles[slotIdx].x, spawnTiles[slotIdx].y)}
                      </span>
                    ) : (
                      <span>Reserve</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {myServants.length === 0 && (
          <p className="py-4 text-center text-xs italic text-slate-500">
            ยังไม่มี Servant ในทีม (รอ Draft ให้เสร็จก่อน)
          </p>
        )}
      </div>

      {/* LOCK DEPLOYMENT Button */}
      <button
        type="button"
        disabled={!canLock || submitting}
        onClick={handleLockDeployment}
        className={`mt-3 flex w-full items-center justify-center gap-2 rounded-[2px] border py-2.5 font-display text-xs font-bold tracking-widest transition ${
          isLocked
            ? 'cursor-not-allowed border-emerald-800 bg-emerald-950/40 text-emerald-300'
            : 'border-[#C8A253]/60 bg-[#B91C1C] text-slate-100 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-45'
        }`}
      >
        {isLocked ? <Lock className="h-4 w-4" /> : <Send className="h-4 w-4" />}
        <span>
          {isLocked
            ? 'DEPLOYMENT LOCKED'
            : submitting
              ? 'SAVING...'
              : 'LOCK DEPLOYMENT'}
        </span>
      </button>

      <TileInspector />
    </aside>
  );
}
