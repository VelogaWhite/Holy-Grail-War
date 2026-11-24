import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Compass,
  Disc,
  Flame,
  Gift,
  Shield,
  Skull,
  Sparkles,
  Swords,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { EVENTS, SERVANTS, SERVANTS_BY_ID } from '../../data';
import { useGameStore } from '../../store/useGameStore';
import type {
  GameEventTemplate,
  ServantClassId,
  ServantTemplate,
  WheelBroadcast,
} from '../../types/game';
import {
  getClassIconUrl,
  getClassShortLabel,
  getInitials,
  resolveAssetUrl,
} from '../../utils/assetHelper';

type WheelMode = WheelBroadcast['wheelType'];
type EventCategory = 'buff' | 'danger' | 'field';

const WHEEL_TABS: { id: WheelMode; label: string }[] = [
  { id: 'servant_draft', label: 'Servant Draft' },
  { id: 'map_event', label: 'Map Event' },
  { id: 'personal_event', label: 'Personal Event (?)' },
];

const TAPE_LENGTH = 60;
const WINNING_INDEX = 48;
const CARD_WIDTH = 128;
const CARD_GAP = 8;
const CARD_STEP = CARD_WIDTH + CARD_GAP; // 136px
const SPIN_DURATION_MS = 5500;

// --- Deterministic PRNG (Mulberry32) so Ruler, Master A & Master B see identical tape ---
function hashStringToSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function createMulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Web Audio API Sound Synthesizer (Tick & Reveal Chime) ---
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!sharedAudioCtx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) return null;
      sharedAudioCtx = new Ctx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

function playTickSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(920, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.022);
    gain.gain.setValueAtTime(0.065, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.024);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.026);
  } catch {
    // Ignore audio context errors
  }
}

function playRevealChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const notes = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6 golden arpeggio
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.075;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.09, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.7);
    });
  } catch {
    // Ignore audio context errors
  }
}

// --- Class & Event Styling Helpers ---
function getClassBarStyle(servantClass: ServantClassId): {
  barClass: string;
  badgeText: string;
} {
  switch (servantClass) {
    case 'Saber':
      return {
        barClass: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.85)]',
        badgeText: 'text-blue-300',
      };
    case 'Archer':
      return {
        barClass: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.85)]',
        badgeText: 'text-red-300',
      };
    case 'Lancer':
      return {
        barClass: 'bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.85)]',
        badgeText: 'text-sky-300',
      };
    case 'Rider':
      return {
        barClass: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.85)]',
        badgeText: 'text-orange-300',
      };
    case 'Caster':
      return {
        barClass: 'bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.85)]',
        badgeText: 'text-violet-300',
      };
    case 'Assassin':
      return {
        barClass: 'bg-slate-400 shadow-[0_0_10px_rgba(148,163,184,0.85)]',
        badgeText: 'text-slate-300',
      };
    case 'Berserker':
      return {
        barClass: 'bg-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.9)]',
        badgeText: 'text-rose-300',
      };
    case 'Extra':
      return {
        barClass:
          'bg-gradient-to-r from-amber-300 via-fuchsia-400 to-cyan-300 shadow-[0_0_12px_rgba(251,191,36,0.95)]',
        badgeText: 'text-amber-300',
      };
  }
}

const DANGER_EVENT_IDS = new Set([
  'mana_drought',
  'bloodlust',
  'grail_mud',
  'leyline_overload',
  'stray_servant',
  'cursed_trap',
  'phantom_ambush',
  'mana_leak',
]);

const FIELD_EVENT_IDS = new Set([
  'dense_fog',
  'spatial_distortion',
  'secret_shortcut',
  'scout_insight',
]);

function getEventCategory(eventId: string): EventCategory {
  if (DANGER_EVENT_IDS.has(eventId)) return 'danger';
  if (FIELD_EVENT_IDS.has(eventId)) return 'field';
  return 'buff';
}

// --- Tape Card Sub-Components (128px × 168px) ---
function ServantTapeCard({
  servant,
  isWinner,
  masked = false,
}: {
  servant: ServantTemplate;
  isWinner: boolean;
  masked?: boolean;
}) {
  const [imgErr, setImgErr] = useState(false);
  const [classIconErr, setClassIconErr] = useState(false);
  const imgUrl = resolveAssetUrl(servant.image);
  const classIconUrl = getClassIconUrl(servant.servantClass, servant.subClass);
  const clsStyle = getClassBarStyle(servant.servantClass);

  return (
    <div
      style={{ width: CARD_WIDTH, height: 168 }}
      className={`relative flex shrink-0 flex-col overflow-hidden rounded-[3px] border bg-[#111622] transition-transform duration-300 ${
        isWinner
          ? 'z-20 scale-[1.06] border-[#E5C983] shadow-[0_0_22px_rgba(200,162,83,0.8)]'
          : 'border-slate-700/80'
      }`}
    >
      {/* Portrait Area (or Masked Class Emblem under True Name Concealment) */}
      <div className="relative h-[108px] w-full overflow-hidden bg-[#090B10]">
        {masked ? (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-[#172033] to-[#090B10]">
            {classIconUrl && !classIconErr ? (
              <img
                src={classIconUrl}
                alt={servant.servantClass}
                onError={() => setClassIconErr(true)}
                className="h-12 w-12 object-contain opacity-95"
                draggable={false}
              />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#C8A253]/70 bg-[#111622] font-display text-sm font-bold text-[#E5C983]">
                {getClassShortLabel(servant.servantClass, servant.subClass)}
              </span>
            )}
          </div>
        ) : imgUrl && !imgErr ? (
          <img
            src={imgUrl}
            alt={servant.name}
            onError={() => setImgErr(true)}
            className="h-full w-full object-cover object-top"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-800 font-display text-lg font-bold text-[#E5C983]">
            {getInitials(servant.name)}
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#111622] to-transparent" />

        {/* Class Icon Top-Left (when unmasked) */}
        {!masked && (
          <div className="absolute top-1.5 left-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full border border-[#C8A253]/60 bg-[#090B10]/90 px-0.5">
            {classIconUrl && !classIconErr ? (
              <img
                src={classIconUrl}
                alt={servant.subClass ?? servant.servantClass}
                onError={() => setClassIconErr(true)}
                className="h-4 w-4 object-contain"
              />
            ) : (
              <span className="font-display text-[7px] font-bold text-[#E5C983]">
                {getClassShortLabel(servant.servantClass, servant.subClass)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Name & Class Label */}
      <div className="flex flex-1 flex-col justify-between px-2 pt-1 pb-2 text-center">
        <div className="font-display line-clamp-1 text-[11px] font-bold tracking-wide text-slate-100">
          {masked ? '???' : servant.name}
        </div>
        <div className={`text-[9.5px] font-bold uppercase tracking-wider ${clsStyle.badgeText}`}>
          {masked ? servant.servantClass : servant.subClass ?? servant.servantClass}
        </div>
      </div>

      {/* Bottom Glowing Class Strip */}
      <div className={`h-1.5 w-full shrink-0 ${clsStyle.barClass}`} />
    </div>
  );
}

function EventTapeCard({
  ev,
  isWinner,
}: {
  ev: GameEventTemplate;
  isWinner: boolean;
}) {
  const cat = getEventCategory(ev.id);

  const catStyle =
    cat === 'danger'
      ? {
          icon: <AlertTriangle className="h-6 w-6 text-red-400" />,
          bar: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.85)]',
          badge: 'text-red-300 border-red-800/70 bg-red-950/50',
          label: 'DANGER',
        }
      : cat === 'field'
        ? {
            icon: <Compass className="h-6 w-6 text-sky-400" />,
            bar: 'bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.85)]',
            badge: 'text-sky-300 border-sky-800/70 bg-sky-950/50',
            label: 'FIELD',
          }
        : {
            icon: <Gift className="h-6 w-6 text-[#E5C983]" />,
            bar: 'bg-gradient-to-r from-emerald-400 to-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]',
            badge: 'text-[#E5C983] border-[#C8A253]/50 bg-[#C8A253]/15',
            label: 'BOON',
          };

  return (
    <div
      style={{ width: CARD_WIDTH, height: 168 }}
      className={`relative flex shrink-0 flex-col justify-between overflow-hidden rounded-[3px] border bg-[#111622] transition-transform duration-300 ${
        isWinner
          ? 'z-20 scale-[1.06] border-[#E5C983] shadow-[0_0_22px_rgba(200,162,83,0.8)]'
          : 'border-slate-700/80'
      }`}
    >
      <div className="flex flex-1 flex-col items-center px-2 pt-3 pb-2 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-[#090B10]">
          {catStyle.icon}
        </div>
        <span
          className={`mt-1.5 rounded-[2px] border px-1.5 py-px font-display text-[8px] font-bold tracking-widest ${catStyle.badge}`}
        >
          {catStyle.label}
        </span>
        <div className="mt-1.5 line-clamp-2 text-[10.5px] font-bold leading-tight text-slate-100">
          {ev.title}
        </div>
        <p className="mt-1 line-clamp-2 text-[9px] leading-snug text-slate-400">
          {ev.description}
        </p>
      </div>

      {/* Bottom Category Strip */}
      <div className={`h-1.5 w-full shrink-0 ${catStyle.bar}`} />
    </div>
  );
}

// --- Main Modal ---
export function WheelModal() {
  const isOpen = useGameStore((s) => s.isWheelOpen);
  const setWheelOpen = useGameStore((s) => s.setWheelOpen);
  const previewRole = useGameStore((s) => s.previewRole);
  const roomState = useGameStore((s) => s.roomState);
  const rulerVariantNotice = useGameStore((s) => s.rulerVariantNotice);
  const clearRulerVariantNotice = useGameStore((s) => s.clearRulerVariantNotice);
  const spinWheel = useGameStore((s) => s.spinWheel);
  const assignDraftedServant = useGameStore((s) => s.assignDraftedServant);
  const spawnStrayBossFromWheel = useGameStore((s) => s.spawnStrayBossFromWheel);
  const applyMapEventFromWheel = useGameStore((s) => s.applyMapEventFromWheel);
  const recordPersonalEventLog = useGameStore((s) => s.recordPersonalEventLog);

  const isRuler = previewRole === 'ruler';
  const broadcast = roomState.wheelBroadcast;
  const broadcastId = broadcast?.id ?? null;
  const broadcastType = broadcast?.wheelType ?? null;
  const broadcastSpinning = broadcast?.isSpinning ?? false;

  const [selectedMode, setSelectedMode] = useState<WheelMode>('servant_draft');
  const [draftTarget, setDraftTarget] = useState<'team_a' | 'team_b' | 'stray'>('team_a');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [spotlightIconErrId, setSpotlightIconErrId] = useState<string | null>(null);
  const [spotlightImgErrId, setSpotlightImgErrId] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);
  const [translateX, setTranslateX] = useState(0);
  const [useTransition, setUseTransition] = useState(false);
  const [revealedBroadcastId, setRevealedBroadcastId] = useState<string | null>(null);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const tapeRef = useRef<HTMLDivElement | null>(null);
  const lastSeenIdRef = useRef<string | null>(broadcastId);
  const spinTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Cleanup timers & RAF on unmount only
  useEffect(() => {
    return () => {
      if (spinTimerRef.current !== null) window.clearTimeout(spinTimerRef.current);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Build deterministic 60-card tape when a broadcast matches selectedMode, or a preview tape when idle
  const tapeData = useMemo(() => {
    const isSyncedMode = Boolean(broadcast && broadcast.wheelType === selectedMode);

    if (isSyncedMode && broadcast && broadcast.resultId) {
      const seed = hashStringToSeed(broadcast.id);
      const rand = createMulberry32(seed);
      const pool =
        broadcast.poolIds.length > 0
          ? broadcast.poolIds
          : selectedMode === 'servant_draft'
            ? roomState.draftPoolRemaining
            : selectedMode === 'map_event'
              ? EVENTS.mapEvents.map((e) => e.id)
              : EVENTS.personalEvents.map((e) => e.id);

      const ids: string[] = [];
      for (let i = 0; i < TAPE_LENGTH; i++) {
        if (i === WINNING_INDEX) {
          ids.push(broadcast.resultId);
        } else {
          const pick = pool[Math.floor(rand() * pool.length)] ?? broadcast.resultId;
          ids.push(pick);
        }
      }

      // Deterministic near-miss stopOffset between -40% and +40% of card width
      const stopOffsetRatio = (rand() * 0.8) - 0.4;
      return { ids, stopOffsetRatio, isPreview: false };
    }

    // Idle preview tape from remaining pool
    const previewPool =
      selectedMode === 'servant_draft'
        ? roomState.draftPoolRemaining
        : selectedMode === 'map_event'
          ? EVENTS.mapEvents.map((e) => e.id)
          : EVENTS.personalEvents.map((e) => e.id);

    return {
      ids: previewPool.slice(0, 14),
      stopOffsetRatio: 0,
      isPreview: true,
    };
  }, [broadcast, selectedMode, roomState.draftPoolRemaining]);

  // Trigger synced 5.5s CS:GO tape roll whenever a genuinely new broadcastId arrives
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
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (broadcastSpinning) {
      setAnimating(true);
      setRevealedBroadcastId(null);
      setUseTransition(false);
      setTranslateX(0);

      // Compute deterministic offset from broadcastId (matches tapeData)
      const seed = hashStringToSeed(broadcastId);
      const rand = createMulberry32(seed);
      for (let i = 0; i < TAPE_LENGTH; i++) {
        if (i !== WINNING_INDEX) rand();
      }
      const stopOffsetRatio = rand() * 0.8 - 0.4;

      // Double RAF to ensure DOM paints translateX(0) before starting 5.5s CSS transition
      let innerRaf = 0;
      const outerRaf = requestAnimationFrame(() => {
        innerRaf = requestAnimationFrame(() => {
          const viewportW = viewportRef.current?.clientWidth || 720;
          const cardCenterX = WINNING_INDEX * CARD_STEP + CARD_WIDTH / 2;
          const targetX =
            viewportW / 2 - cardCenterX - stopOffsetRatio * CARD_WIDTH;

          setUseTransition(true);
          setTranslateX(targetX);

          // Track exact card crossings under center marker for Web Audio ticks
          let lastCardIdx = -1;
          const trackTicks = () => {
            const el = tapeRef.current;
            const vp = viewportRef.current;
            if (el && vp) {
              const style = window.getComputedStyle(el);
              const matrix = new DOMMatrixReadOnly(style.transform);
              const curX = matrix.m41;
              const centerInTape = vp.clientWidth / 2 - curX;
              const cardIdx = Math.floor(centerInTape / CARD_STEP);
              if (cardIdx !== lastCardIdx && cardIdx >= 0) {
                if (lastCardIdx !== -1 && soundEnabledRef.current) {
                  playTickSound();
                }
                lastCardIdx = cardIdx;
              }
            }
            rafRef.current = requestAnimationFrame(trackTicks);
          };
          rafRef.current = requestAnimationFrame(trackTicks);
        });
      });

      spinTimerRef.current = window.setTimeout(() => {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        setAnimating(false);
        setRevealedBroadcastId(broadcastId);
        if (soundEnabledRef.current) {
          playRevealChime();
        }

        // Auto-assign drafted Servant to the pre-selected targetTeam once spin finishes (Ruler only)
        const latestState = useGameStore.getState();
        const latestBroadcast = latestState.roomState.wheelBroadcast;
        if (
          latestState.previewRole === 'ruler' &&
          latestBroadcast &&
          latestBroadcast.id === broadcastId &&
          latestBroadcast.wheelType === 'servant_draft' &&
          latestBroadcast.resultId &&
          (latestBroadcast.targetTeam === 'team_a' ||
            latestBroadcast.targetTeam === 'team_b') &&
          latestState.roomState.draftPoolRemaining.includes(latestBroadcast.resultId)
        ) {
          latestState.assignDraftedServant(
            latestBroadcast.resultId,
            latestBroadcast.targetTeam
          );
        }

        spinTimerRef.current = null;
      }, SPIN_DURATION_MS + 100);

      return () => {
        cancelAnimationFrame(outerRaf);
        if (innerRaf) cancelAnimationFrame(innerRaf);
      };
    } else {
      setAnimating(false);
      setRevealedBroadcastId(broadcastId);
    }
  }, [broadcastId, broadcastType, broadcastSpinning, setWheelOpen]);

  // Reset scroll position when switching tabs while idle
  const handleSwitchTab = (mode: WheelMode) => {
    if (animating) return;
    setSelectedMode(mode);
    setUseTransition(false);
    setTranslateX(0);
  };

  const eventLookup = useMemo(() => {
    const map: Record<string, GameEventTemplate> = {};
    for (const e of EVENTS.mapEvents) map[e.id] = e;
    for (const e of EVENTS.personalEvents) map[e.id] = e;
    return map;
  }, []);

  if (!isOpen) return null;

  const showResult =
    Boolean(broadcast) &&
    broadcast?.wheelType === selectedMode &&
    !animating &&
    (revealedBroadcastId === broadcast?.id || !broadcast?.isSpinning);

  const draftedServantTpl =
    showResult && broadcast?.wheelType === 'servant_draft' && broadcast.resultId
      ? SERVANTS_BY_ID[broadcast.resultId]
      : null;

  const isAlreadyRemovedFromPool =
    draftedServantTpl &&
    !roomState.draftPoolRemaining.includes(draftedServantTpl.id);

  // Under True Name Concealment, mask the draft tape & winner spotlight for the opposing Master
  const isMaskedDraftForViewer = Boolean(
    selectedMode === 'servant_draft' &&
      roomState.trueNameConcealment &&
      !isRuler &&
      broadcast?.targetTeam &&
      ((previewRole === 'master_a' && broadcast.targetTeam === 'team_b') ||
        (previewRole === 'master_b' && broadcast.targetTeam === 'team_a'))
  );

  const poolCount =
    selectedMode === 'servant_draft'
      ? roomState.draftPoolRemaining.length
      : selectedMode === 'map_event'
        ? EVENTS.mapEvents.length
        : EVENTS.personalEvents.length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Fate Case Opening Roulette"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#090B10]/88 p-4"
      onClick={() => !animating && setWheelOpen(false)}
    >
      <div
        className="clip-tactical flex w-full max-w-4xl flex-col overflow-hidden border border-[#C8A253]/50 bg-[#111622] text-slate-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#C8A253]/25 bg-[#090B10] px-5 py-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/ui/holy_grail.webp"
              alt="Grail"
              className="h-6 w-6 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div>
              <h2 className="font-display text-sm font-bold tracking-widest text-[#E5C983]">
                SUMMONING ROULETTE · FUYUKI CASE OPENING
              </h2>
              <p className="text-[11px] text-slate-400">
                {isRuler
                  ? 'Ruler กดสุ่มเพื่อซิงก์แถบการ์ดและจุดหยุดเหมือนกันเป๊ะทั้ง 3 หน้าจอ'
                  : 'โหมดรับชมสด — แถบการ์ดซิงก์ Real-time จาก Ruler'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled((v) => !v)}
              title={soundEnabled ? 'ปิดเสียงเอฟเฟกต์' : 'เปิดเสียงเอฟเฟกต์'}
              className={`flex items-center gap-1 rounded-[2px] border px-2 py-1 text-[11px] font-semibold transition ${
                soundEnabled
                  ? 'border-[#C8A253]/50 bg-[#111622] text-[#E5C983]'
                  : 'border-slate-700 bg-[#090B10] text-slate-500'
              }`}
            >
              {soundEnabled ? (
                <Volume2 className="h-3.5 w-3.5" />
              ) : (
                <VolumeX className="h-3.5 w-3.5" />
              )}
              <span>{soundEnabled ? 'SFX ON' : 'Muted'}</span>
            </button>

            <button
              type="button"
              disabled={animating}
              onClick={() => setWheelOpen(false)}
              aria-label="ปิดหน้าต่าง"
              className="rounded-[2px] border border-slate-700 bg-[#111622] p-1 text-slate-400 hover:border-[#C8A253] hover:text-[#E5C983] disabled:opacity-40"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
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
                onClick={() => handleSwitchTab(t.id)}
                className={`border-b-2 py-2 font-display text-[11px] font-bold tracking-wider transition ${
                  active
                    ? 'border-[#C8A253] bg-[#111622] text-[#E5C983]'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
                {t.id === 'servant_draft'
                  ? ` (${roomState.draftPoolRemaining.length}/${SERVANTS.length})`
                  : ''}
              </button>
            );
          })}
        </div>

        {/* Servant Draft Pool & Variant Exclusion Status Bar */}
        {selectedMode === 'servant_draft' && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 bg-[#0D121D] px-5 py-1.5 text-[10.5px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-400">
                คงเหลือใน Pool:{' '}
                <strong className="font-mono text-[#E5C983]">
                  {roomState.draftPoolRemaining.length} / {SERVANTS.length}
                </strong>
              </span>
              <span
                className={`rounded-[2px] border px-1.5 py-px font-bold ${
                  roomState.excludeDuplicateSummer
                    ? 'border-cyan-500/60 bg-cyan-950/50 text-cyan-300'
                    : 'border-slate-700 bg-[#090B10] text-slate-500'
                }`}
              >
                No Dupes Summer: {roomState.excludeDuplicateSummer ? 'ON' : 'OFF'}
              </span>
              <span
                className={`rounded-[2px] border px-1.5 py-px font-bold ${
                  roomState.excludeDuplicateAlter
                    ? 'border-fuchsia-500/60 bg-fuchsia-950/50 text-fuchsia-300'
                    : 'border-slate-700 bg-[#090B10] text-slate-500'
                }`}
              >
                No Dupes Alter: {roomState.excludeDuplicateAlter ? 'ON' : 'OFF'}
              </span>
            </div>
            {isRuler && rulerVariantNotice && (
              <div className="flex items-center gap-1.5 rounded-[2px] border border-amber-500/50 bg-amber-950/40 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                <span>🔒 {rulerVariantNotice}</span>
                <button
                  type="button"
                  onClick={clearRulerVariantNotice}
                  className="text-amber-400 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* CS:GO Horizontal Roulette Tape Viewport */}
        <div className="p-5">
          <div
            ref={viewportRef}
            className="relative flex h-[204px] w-full items-center overflow-hidden rounded-[3px] border border-[#C8A253]/45 bg-[#090B10] shadow-inner"
          >
            {/* Left & Right Dark Fade Vignettes */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-30 w-24 bg-gradient-to-r from-[#090B10] via-[#090B10]/80 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-30 w-24 bg-gradient-to-l from-[#090B10] via-[#090B10]/80 to-transparent" />

            {/* Golden Center Marker Line + Top/Bottom Arrows */}
            <div className="pointer-events-none absolute inset-y-0 left-1/2 z-40 -translate-x-1/2">
              {/* Top Arrow */}
              <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 border-x-[8px] border-t-[12px] border-x-transparent border-t-[#E5C983]" />
              {/* Center Gold Needle */}
              <div className="h-full w-[2px] bg-[#E5C983] shadow-[0_0_10px_rgba(229,201,131,0.95)]" />
              {/* Bottom Arrow */}
              <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 border-x-[8px] border-b-[12px] border-x-transparent border-b-[#E5C983]" />
            </div>

            {/* Horizontal Sliding Tape */}
            <div
              ref={tapeRef}
              className="flex items-center"
              style={{
                gap: `${CARD_GAP}px`,
                transform: `translate3d(${translateX}px, 0, 0)`,
                transition: useTransition
                  ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.12, 0.85, 0.15, 1)`
                  : 'none',
                willChange: 'transform',
              }}
            >
              {tapeData.ids.map((itemId, idx) => {
                const isWinnerCard =
                  !tapeData.isPreview && showResult && idx === WINNING_INDEX;

                if (selectedMode === 'servant_draft') {
                  const servant = SERVANTS_BY_ID[itemId];
                  if (!servant) return null;
                  return (
                    <ServantTapeCard
                      key={`${itemId}-${idx}`}
                      servant={servant}
                      isWinner={isWinnerCard}
                      masked={isMaskedDraftForViewer}
                    />
                  );
                }

                const ev = eventLookup[itemId];
                if (!ev) return null;
                return (
                  <EventTapeCard
                    key={`${itemId}-${idx}`}
                    ev={ev}
                    isWinner={isWinnerCard}
                  />
                );
              })}
            </div>
          </div>

          {/* Winner Spotlight / Status Panel */}
          <div className="mt-4 rounded-[2px] border border-[#C8A253]/35 bg-[#090B10] p-4">
            {animating ? (
              <div className="flex flex-col items-center py-2 text-center">
                <div className="font-display text-sm font-bold tracking-[0.2em] text-[#E5C983] animate-pulse">
                  SUMMONING IN PROGRESS...
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  กำลังสุ่มจากทั้งหมด {poolCount} รายการ (5.5s Near-Miss Suspense)
                </p>
              </div>
            ) : showResult && broadcast?.resultLabel ? (
              <div>
                {draftedServantTpl ? (
                  isMaskedDraftForViewer ? (
                    <div className="flex flex-col items-center py-2 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#C8A253] bg-[#111622] p-2">
                        {spotlightIconErrId !== draftedServantTpl.id ? (
                          <img
                            src={
                              getClassIconUrl(
                                draftedServantTpl.servantClass,
                                draftedServantTpl.subClass
                              ) ?? ''
                            }
                            alt={draftedServantTpl.subClass ?? draftedServantTpl.servantClass}
                            onError={() => setSpotlightIconErrId(draftedServantTpl.id)}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <span className="font-display text-sm font-bold text-[#E5C983]">
                            {getClassShortLabel(
                              draftedServantTpl.servantClass,
                              draftedServantTpl.subClass
                            )}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-2 font-display text-base font-bold tracking-wider text-[#E5C983]">
                        {broadcast?.targetTeam === 'team_a' ? 'Team A' : 'Team B'}{' '}
                        อัญเชิญวีรชนคลาส [{broadcast?.resultClass ?? draftedServantTpl.servantClass}]!
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        โหมดปิดนามแท้ทำงานอยู่ — ชื่อจริง รูป และสกิลถูกซ่อนไว้จนกว่าจะเปิดเผย
                      </p>
                    </div>
                  ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    {spotlightImgErrId !== draftedServantTpl.id ? (
                      <img
                        src={resolveAssetUrl(draftedServantTpl.image) ?? ''}
                        alt={draftedServantTpl.name}
                        onError={() => setSpotlightImgErrId(draftedServantTpl.id)}
                        className="h-20 w-20 shrink-0 rounded-[2px] border-2 border-[#E5C983] object-cover object-top shadow-[0_0_14px_rgba(200,162,83,0.45)]"
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[2px] border-2 border-[#E5C983] bg-slate-800 font-display text-lg font-bold text-[#E5C983] shadow-[0_0_14px_rgba(200,162,83,0.45)]">
                        {getInitials(draftedServantTpl.name)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-lg font-bold tracking-wider text-[#E5C983]">
                          {draftedServantTpl.name}
                        </h3>
                        <span className="rounded-[2px] border border-[#C8A253]/50 bg-[#111622] px-2 py-0.5 text-[10px] font-bold uppercase text-[#C8A253]">
                          {draftedServantTpl.servantClass}
                          {draftedServantTpl.subClass
                            ? ` · ${draftedServantTpl.subClass}`
                            : ''}
                        </span>
                        {draftedServantTpl.variantType === 'summer' && (
                          <span className="rounded-[2px] border border-cyan-500/60 bg-cyan-950/60 px-1.5 py-0.5 text-[9.5px] font-bold text-cyan-300">
                            Summer
                          </span>
                        )}
                        {draftedServantTpl.variantType === 'alter' && (
                          <span className="rounded-[2px] border border-fuchsia-500/60 bg-fuchsia-950/60 px-1.5 py-0.5 text-[9.5px] font-bold text-fuchsia-300">
                            Alter
                          </span>
                        )}
                        <span className="font-mono text-xs font-bold text-slate-300">
                          HP {draftedServantTpl.hp} · ATK {draftedServantTpl.atk} · MOV{' '}
                          {draftedServantTpl.mov} · RNG {draftedServantTpl.range}
                        </span>
                      </div>
                      <div className="mt-1.5 grid grid-cols-1 gap-1.5 text-[11px] sm:grid-cols-2">
                        <div className="rounded-[2px] border border-slate-800 bg-[#111622] p-2">
                          <span className="font-display font-bold text-sky-300">
                            {draftedServantTpl.skillName} ({draftedServantTpl.skillCost}M):
                          </span>{' '}
                          <span className="text-slate-300">{draftedServantTpl.skillDesc}</span>
                        </div>
                        <div className="rounded-[2px] border border-[#C8A253]/35 bg-[#111622] p-2">
                          <span className="font-display flex items-center gap-1 font-bold text-[#E5C983]">
                            <Flame className="h-3 w-3 text-[#B91C1C]" />
                            {draftedServantTpl.npName} ({draftedServantTpl.npCost}M)
                          </span>
                          <p className="mt-0.5 text-slate-200">{draftedServantTpl.npDesc}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  )
                ) : (
                  <div className="text-center">
                    <div className="font-display text-lg font-bold tracking-wider text-[#E5C983]">
                      {broadcast.resultLabel}
                    </div>
                    {broadcast.resultDescription && (
                      <p className="mt-1 text-xs leading-relaxed text-slate-300">
                        {broadcast.resultDescription}
                      </p>
                    )}
                  </div>
                )}

                {/* Ruler Post-Spin Actions */}
                {isRuler && (
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2 border-t border-slate-800 pt-3">
                    {broadcast.wheelType === 'servant_draft' &&
                      broadcast.resultId &&
                      !isAlreadyRemovedFromPool && (
                        broadcast.targetTeam === null ? (
                          <button
                            type="button"
                            onClick={() =>
                              spawnStrayBossFromWheel(broadcast.resultId!)
                            }
                            className="flex items-center gap-1.5 rounded-[2px] border border-[#C8A253]/70 bg-[#C8A253] px-4 py-1.5 text-xs font-bold text-[#090B10] hover:bg-[#E5C983]"
                          >
                            <Skull className="h-3.5 w-3.5" />
                            <span>Spawn Stray Boss (Central)</span>
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                assignDraftedServant(broadcast.resultId!, 'team_a')
                              }
                              className="flex items-center gap-1.5 rounded-[2px] bg-[#B91C1C] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-red-700"
                            >
                              <Swords className="h-3.5 w-3.5" />
                              <span>Assign Team A (Red)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                assignDraftedServant(broadcast.resultId!, 'team_b')
                              }
                              className="flex items-center gap-1.5 rounded-[2px] bg-sky-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-sky-600"
                            >
                              <Shield className="h-3.5 w-3.5" />
                              <span>Assign Team B (Blue)</span>
                            </button>
                          </>
                        )
                      )}

                    {broadcast.wheelType === 'servant_draft' &&
                      isAlreadyRemovedFromPool && (
                        <span className="flex items-center gap-1.5 rounded-[2px] border border-emerald-800/70 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-300">
                          <CheckCircle2 className="h-4 w-4" />
                          {broadcast.targetTeam === 'team_a'
                            ? 'ส่งเข้าสู่ทีม Team A (Red) และตัดออกจาก Pool อัตโนมัติแล้ว'
                            : broadcast.targetTeam === 'team_b'
                              ? 'ส่งเข้าสู่ทีม Team B (Blue) และตัดออกจาก Pool อัตโนมัติแล้ว'
                              : 'จัดการ Servant ตัวนี้และตัดออกจาก Pool เรียบร้อยแล้ว'}
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
              <div className="py-1 text-center text-xs text-slate-400">
                แถบด้านบนแสดงตัวอย่างจาก Pool ที่เหลือ <strong className="text-[#E5C983]">{poolCount}</strong> รายการ —{' '}
                {isRuler ? 'กดปุ่มด้านล่างเพื่อเริ่มสุ่มแบบ CS:GO Roulette' : 'รอ Ruler กดเริ่มสุ่ม'}
              </div>
            )}
          </div>

          {/* Ruler Draft Target Selector + Spin Button */}
          {isRuler && (
            <div className="mt-4 space-y-2.5">
              {selectedMode === 'servant_draft' && (
                <div className="flex flex-wrap items-center justify-center gap-2 rounded-[2px] border border-slate-800 bg-[#090B10] px-3 py-2 text-xs">
                  <span className="font-semibold text-slate-400">สุ่มให้:</span>
                  {(
                    [
                      { id: 'team_a', label: 'Team A (Red)', cls: 'border-[#B91C1C] bg-[#B91C1C] text-white' },
                      { id: 'team_b', label: 'Team B (Blue)', cls: 'border-sky-600 bg-sky-700 text-white' },
                      { id: 'stray', label: 'Stray Boss', cls: 'border-[#C8A253] bg-[#C8A253] text-[#090B10]' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={animating}
                      onClick={() => setDraftTarget(opt.id)}
                      className={`rounded-[2px] border px-3 py-1 text-xs font-bold transition ${
                        draftTarget === opt.id
                          ? opt.cls
                          : 'border-slate-700 bg-[#111622] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  {roomState.trueNameConcealment && draftTarget !== 'stray' && (
                    <span className="text-[10.5px] font-semibold text-[#C8A253]">
                      (ปิดนามแท้: ฝั่งตรงข้ามเห็นเฉพาะคลาส)
                    </span>
                  )}
                </div>
              )}

              <button
                type="button"
                disabled={animating || poolCount === 0}
                onClick={() => {
                  if (soundEnabled) getAudioContext();
                  spinWheel(
                    selectedMode,
                    selectedMode === 'servant_draft'
                      ? draftTarget === 'stray'
                        ? null
                        : draftTarget
                      : null
                  );
                }}
                className="flex w-full items-center justify-center gap-2 rounded-[2px] border border-[#C8A253]/70 bg-[#B91C1C] py-2.5 font-display text-xs font-bold tracking-widest text-slate-100 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Disc className={`h-4 w-4 ${animating ? 'animate-spin' : ''}`} />
                <span>{animating ? 'OPENING CASE...' : 'SPIN CASE ROULETTE'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
