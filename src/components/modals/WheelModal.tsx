import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Disc,
  Shield,
  Skull,
  Sparkles,
  Swords,
  X,
} from 'lucide-react';
import { EVENTS, SERVANTS_BY_ID } from '../../data';
import { useGameStore } from '../../store/useGameStore';
import type { WheelBroadcast } from '../../types/game';
import { resolveAssetUrl } from '../../utils/assetHelper';

type WheelMode = WheelBroadcast['wheelType'];

const WHEEL_TABS: { id: WheelMode; label: string }[] = [
  { id: 'servant_draft', label: 'Servant Draft' },
  { id: 'map_event', label: 'Map Event' },
  { id: 'personal_event', label: 'Personal Event (?)' },
];

const SLICE_COLORS = [
  '#1A2233',
  '#131926',
  '#221A24',
  '#16212C',
  '#1F1C18',
  '#182420',
];

export function WheelModal() {
  const isOpen = useGameStore((s) => s.isWheelOpen);
  const setWheelOpen = useGameStore((s) => s.setWheelOpen);
  const previewRole = useGameStore((s) => s.previewRole);
  const roomState = useGameStore((s) => s.roomState);
  const spinWheel = useGameStore((s) => s.spinWheel);
  const assignDraftedServant = useGameStore((s) => s.assignDraftedServant);
  const spawnStrayBossFromWheel = useGameStore((s) => s.spawnStrayBossFromWheel);
  const applyMapEventFromWheel = useGameStore((s) => s.applyMapEventFromWheel);
  const recordPersonalEventLog = useGameStore((s) => s.recordPersonalEventLog);

  const isRuler = previewRole === 'ruler';
  const broadcast = roomState.wheelBroadcast;

  const [selectedMode, setSelectedMode] = useState<WheelMode>('servant_draft');
  const [animating, setAnimating] = useState(false);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [revealedBroadcastId, setRevealedBroadcastId] = useState<string | null>(null);
  const lastSeenIdRef = useRef<string | null>(broadcast?.id ?? null);
  const spinTimerRef = useRef<number | null>(null);

  const broadcastId = broadcast?.id ?? null;
  const broadcastType = broadcast?.wheelType ?? null;
  const broadcastSpinning = broadcast?.isSpinning ?? false;

  // Clean up timer only on component unmount
  useEffect(() => {
    return () => {
      if (spinTimerRef.current !== null) {
        window.clearTimeout(spinTimerRef.current);
      }
    };
  }, []);

  // Auto-open modal and play synced 3.2s spin animation across all 3 screens when a new spin ID arrives
  useEffect(() => {
    if (!broadcastId || !broadcastType) return;
    if (broadcastId === lastSeenIdRef.current) return;

    lastSeenIdRef.current = broadcastId;
    setSelectedMode(broadcastType);
    setWheelOpen(true);

    if (spinTimerRef.current !== null) {
      window.clearTimeout(spinTimerRef.current);
      spinTimerRef.current = null;
    }

    if (broadcastSpinning) {
      setAnimating(true);
      setRevealedBroadcastId(null);
      const hash = broadcastId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      setRotationDeg((prev) => prev + 1800 + (hash % 360));

      spinTimerRef.current = window.setTimeout(() => {
        setAnimating(false);
        setRevealedBroadcastId(broadcastId);
        spinTimerRef.current = null;
      }, 3200);
    } else {
      setAnimating(false);
      setRevealedBroadcastId(broadcastId);
    }
  }, [broadcastId, broadcastType, broadcastSpinning, setWheelOpen]);

  const activePoolLabels = useMemo(() => {
    if (selectedMode === 'servant_draft') {
      return roomState.draftPoolRemaining.map(
        (id) => SERVANTS_BY_ID[id]?.name ?? id
      );
    }
    if (selectedMode === 'map_event') {
      return EVENTS.mapEvents.map((e) => e.title);
    }
    return EVENTS.personalEvents.map((e) => e.title);
  }, [selectedMode, roomState.draftPoolRemaining]);

  if (!isOpen) return null;

  const showResult =
    broadcast &&
    broadcast.wheelType === selectedMode &&
    !animating &&
    (revealedBroadcastId === broadcast.id || !broadcast.isSpinning);

  const draftedServantTpl =
    showResult && broadcast?.wheelType === 'servant_draft' && broadcast.resultId
      ? SERVANTS_BY_ID[broadcast.resultId]
      : null;

  const isAlreadyRemovedFromPool =
    draftedServantTpl &&
    !roomState.draftPoolRemaining.includes(draftedServantTpl.id);

  // Build 12 visual SVG slices for crisp spinning wheel graphic
  const sliceCount = 12;
  const sliceAngle = 360 / sliceCount;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Fate Wheel Modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#090B10]/85 p-4"
      onClick={() => !animating && setWheelOpen(false)}
    >
      <div
        className="clip-tactical flex w-full max-w-2xl flex-col overflow-hidden border border-[#C8A253]/50 bg-[#111622] text-slate-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#C8A253]/25 bg-[#090B10] px-5 py-3">
          <div className="flex items-center gap-2.5">
            <Disc className="h-5 w-5 text-[#C8A253]" />
            <div>
              <h2 className="font-display text-sm font-bold tracking-widest text-[#E5C983]">
                WHEEL OF FATE · REAL-TIME SYNC
              </h2>
              <p className="text-[11px] text-slate-400">
                {isRuler
                  ? 'Ruler กดหมุนเพื่อซิงก์ผลไปยังหน้าจอ Master A และ Master B พร้อมกัน'
                  : 'โหมดรับชมสด — รอ Ruler หมุนวงล้อสุ่ม'}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={animating}
            onClick={() => setWheelOpen(false)}
            className="rounded-[2px] border border-slate-700 bg-[#111622] p-1 text-slate-400 hover:border-[#C8A253] hover:text-[#E5C983] disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 3 Wheel Mode Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-800 bg-[#090B10]">
          {WHEEL_TABS.map((t) => {
            const active = selectedMode === t.id;
            return (
              <button
                key={t.id}
                type="button"
                disabled={animating}
                onClick={() => setSelectedMode(t.id)}
                className={`border-b-2 py-2 font-display text-[11px] font-bold tracking-wider transition ${
                  active
                    ? 'border-[#C8A253] bg-[#111622] text-[#E5C983]'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
                {t.id === 'servant_draft' ? ` (${roomState.draftPoolRemaining.length})` : ''}
              </button>
            );
          })}
        </div>

        {/* Wheel Visual + Result Area */}
        <div className="flex flex-col items-center p-5">
          {/* SVG Spinning Wheel */}
          <div className="relative flex h-52 w-52 items-center justify-center">
            {/* Top Gold Pointer */}
            <div className="absolute -top-2 z-20 h-0 w-0 border-x-[9px] border-t-[16px] border-x-transparent border-t-[#C8A253] drop-shadow" />

            <svg
              viewBox="-100 -100 200 200"
              className="h-full w-full rounded-full border-2 border-[#C8A253]/70 shadow-2xl"
              style={{
                transform: `rotate(${rotationDeg}deg)`,
                transition: animating
                  ? 'transform 3.1s cubic-bezier(0.12, 0.85, 0.18, 1)'
                  : 'none',
              }}
            >
              {Array.from({ length: sliceCount }).map((_, i) => {
                const startRad = ((i * sliceAngle - 90) * Math.PI) / 180;
                const endRad = (((i + 1) * sliceAngle - 90) * Math.PI) / 180;
                const x1 = Math.cos(startRad) * 98;
                const y1 = Math.sin(startRad) * 98;
                const x2 = Math.cos(endRad) * 98;
                const y2 = Math.sin(endRad) * 98;
                return (
                  <path
                    key={i}
                    d={`M 0 0 L ${x1} ${y1} A 98 98 0 0 1 ${x2} ${y2} Z`}
                    fill={SLICE_COLORS[i % SLICE_COLORS.length]}
                    stroke="#C8A253"
                    strokeOpacity="0.35"
                    strokeWidth="0.9"
                  />
                );
              })}
              <circle
                cx="0"
                cy="0"
                r="24"
                fill="#090B10"
                stroke="#C8A253"
                strokeWidth="2.5"
              />
            </svg>

            {/* Center Emblem */}
            <div className="pointer-events-none absolute flex h-10 w-10 items-center justify-center rounded-full">
              <img
                src="/assets/ui/holy_grail.webp"
                alt="Grail"
                className="h-7 w-7 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>

          {/* Status / Result Card */}
          <div className="mt-4 w-full rounded-[2px] border border-[#C8A253]/35 bg-[#090B10] p-3.5 text-center">
            {animating ? (
              <div className="py-2">
                <div className="font-display text-sm font-bold tracking-widest text-[#C8A253] animate-pulse">
                  SPINNING THE WHEEL OF FATE...
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  กำลังสุ่มจากตัวเลือกทั้งหมด {activePoolLabels.length} รายการ
                </p>
              </div>
            ) : showResult && broadcast?.resultLabel ? (
              <div className="flex flex-col items-center">
                {draftedServantTpl && (
                  <img
                    src={resolveAssetUrl(draftedServantTpl.image) ?? ''}
                    alt={draftedServantTpl.name}
                    className="mb-2 h-16 w-16 rounded-[2px] border-2 border-[#C8A253] object-cover object-top"
                  />
                )}
                <div className="font-display text-lg font-bold tracking-wider text-[#E5C983]">
                  {broadcast.resultLabel}
                </div>
                {broadcast.resultDescription && (
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">
                    {broadcast.resultDescription}
                  </p>
                )}

                {/* Ruler Post-Spin Actions */}
                {isRuler && (
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    {broadcast.wheelType === 'servant_draft' &&
                      broadcast.resultId &&
                      !isAlreadyRemovedFromPool && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              assignDraftedServant(broadcast.resultId!, 'team_a')
                            }
                            className="flex items-center gap-1 rounded-[2px] bg-[#B91C1C] px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
                          >
                            <Swords className="h-3.5 w-3.5" />
                            <span>Assign Team A (Red)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              assignDraftedServant(broadcast.resultId!, 'team_b')
                            }
                            className="flex items-center gap-1 rounded-[2px] bg-sky-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-600"
                          >
                            <Shield className="h-3.5 w-3.5" />
                            <span>Assign Team B (Blue)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              spawnStrayBossFromWheel(broadcast.resultId!)
                            }
                            className="flex items-center gap-1 rounded-[2px] border border-[#C8A253]/60 bg-[#111622] px-3 py-1.5 text-xs font-bold text-[#E5C983] hover:bg-[#C8A253]/20"
                          >
                            <Skull className="h-3.5 w-3.5" />
                            <span>Spawn Stray Boss</span>
                          </button>
                        </>
                      )}

                    {broadcast.wheelType === 'servant_draft' &&
                      isAlreadyRemovedFromPool && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" />
                          จัดการ Servant ตัวนี้และตัดออกจากวงล้อแล้ว
                        </span>
                      )}

                    {broadcast.wheelType === 'map_event' && broadcast.resultId && (
                      <button
                        type="button"
                        onClick={() => applyMapEventFromWheel(broadcast.resultId!)}
                        className="flex items-center gap-1.5 rounded-[2px] bg-[#C8A253] px-4 py-1.5 text-xs font-bold text-[#090B10] hover:bg-[#E5C983]"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Set as Active Turn Event</span>
                      </button>
                    )}

                    {broadcast.wheelType === 'personal_event' && (
                      <button
                        type="button"
                        onClick={() =>
                          recordPersonalEventLog(
                            broadcast.resultLabel ?? 'Personal Event',
                            broadcast.resultDescription ?? ''
                          )
                        }
                        className="flex items-center gap-1.5 rounded-[2px] border border-[#C8A253]/60 bg-[#111622] px-4 py-1.5 text-xs font-bold text-[#E5C983] hover:bg-[#C8A253]/20"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>บันทึกลง Game Log</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="py-2 text-xs text-slate-400">
                พร้อมสุ่มจาก {activePoolLabels.length} รายการในโหมดนี้
              </p>
            )}
          </div>

          {/* Spin Button (Ruler Only) */}
          {isRuler && (
            <button
              type="button"
              disabled={animating || activePoolLabels.length === 0}
              onClick={() => spinWheel(selectedMode)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-[2px] border border-[#C8A253]/70 bg-[#B91C1C] py-2.5 font-display text-xs font-bold tracking-widest text-slate-100 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Disc className={`h-4 w-4 ${animating ? 'animate-spin' : ''}`} />
              <span>{animating ? 'SPINNING...' : 'SPIN WHEEL'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
