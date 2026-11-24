import { useMemo, useState } from 'react';
import {
  CloudFog,
  Crown,
  EyeOff,
  FastForward,
  Footprints,
  Hand,
  Heart,
  Navigation,
  Sparkles,
  Swords,
  Undo2,
  X,
} from 'lucide-react';
import { scanEndTurnTileRewards, useGameStore } from '../../store/useGameStore';
import type { TurnPhase } from '../../types/game';

const PHASES: { id: TurnPhase; label: string }[] = [
  { id: 'draft', label: 'Draft' },
  { id: 'deployment', label: 'Deploy' },
  { id: 'event', label: 'Event' },
  { id: 'planning', label: 'Planning' },
  { id: 'resolution', label: 'Resolve' },
];

export function RulerControlStrip() {
  const previewRole = useGameStore((s) => s.previewRole);
  const roomState = useGameStore((s) => s.roomState);
  const rulerSecret = useGameStore((s) => s.rulerSecret);
  const historyLength = useGameStore((s) => s.historyStack.length);
  const freeDragEnabled = useGameStore((s) => s.freeDragEnabled);
  const showMoveHelper = useGameStore((s) => s.showMoveHelper);
  const showCommandArrows = useGameStore((s) => s.showCommandArrows);

  const setPhase = useGameStore((s) => s.setPhase);
  const endTurnAndNext = useGameStore((s) => s.endTurnAndNext);
  const setSecretGrailTurn = useGameStore((s) => s.setSecretGrailTurn);
  const toggleFogOfWar = useGameStore((s) => s.toggleFogOfWar);
  const toggleTrueNameConcealment = useGameStore((s) => s.toggleTrueNameConcealment);
  const toggleExcludeDuplicateSummer = useGameStore((s) => s.toggleExcludeDuplicateSummer);
  const toggleExcludeDuplicateAlter = useGameStore((s) => s.toggleExcludeDuplicateAlter);
  const toggleGrailManifested = useGameStore((s) => s.toggleGrailManifested);
  const setFreeDragEnabled = useGameStore((s) => s.setFreeDragEnabled);
  const setShowMoveHelper = useGameStore((s) => s.setShowMoveHelper);
  const setShowCommandArrows = useGameStore((s) => s.setShowCommandArrows);
  const setCombatHelperOpen = useGameStore((s) => s.setCombatHelperOpen);
  const undo = useGameStore((s) => s.undo);

  const [skipMana, setSkipMana] = useState(false);
  const [showEndTurnMenu, setShowEndTurnMenu] = useState(false);

  const endTurnRewards = useMemo(
    () => (showEndTurnMenu ? scanEndTurnTileRewards(roomState) : []),
    [showEndTurnMenu, roomState]
  );

  if (previewRole !== 'ruler') return null;

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#C8A253]/25 bg-[#0D121D] px-3 py-1 text-[11px] text-slate-200">
      {/* Left: Phase Stepper + End Turn */}
      <div className="flex items-center gap-1.5">
        <span className="font-display text-[10px] font-bold tracking-widest text-[#C8A253]">
          RULER GOD-MODE
        </span>

        <div className="flex items-center rounded-[2px] border border-slate-800 bg-[#090B10] p-0.5">
          {PHASES.map((p) => {
            const active = roomState.phase === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPhase(p.id)}
                className={`rounded-[2px] px-2 py-0.5 font-display text-[10px] font-bold tracking-wide transition ${
                  active
                    ? 'bg-[#C8A253] text-[#090B10]'
                    : 'text-slate-400 hover:bg-[#111622] hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEndTurnMenu((v) => !v)}
            className="flex items-center gap-1 rounded-[2px] border border-[#C8A253]/50 bg-[#B91C1C] px-2.5 py-0.5 font-display text-[10px] font-bold tracking-wider text-slate-100 transition hover:bg-red-700"
          >
            <FastForward className="h-3 w-3" />
            <span>End Turn → T{roomState.turn + 1}</span>
          </button>

          {showEndTurnMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowEndTurnMenu(false)}
              />
              <div className="clip-tactical-sm absolute top-full left-0 z-50 mt-1.5 w-72 border border-[#C8A253]/60 bg-[#111622] p-2.5 text-slate-100 shadow-2xl">
                <div className="mb-1.5 flex items-center justify-between border-b border-slate-800 pb-1">
                  <span className="font-display text-[10.5px] font-bold tracking-wider text-[#E5C983]">
                    จบเทิร์น {roomState.turn} → T{roomState.turn + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowEndTurnMenu(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mb-2 text-[10px] text-slate-400">
                  สแกน Servant ที่ยืนบนช่อง Leyline / Safe House:
                </div>

                {endTurnRewards.length === 0 ? (
                  <div className="mb-2.5 rounded-[2px] border border-dashed border-slate-800 bg-[#090B10] px-2 py-2 text-center text-[10.5px] text-slate-500">
                    ไม่มี Servant ยืนบน Leyline หรือ Safe House ในเทิร์นนี้
                  </div>
                ) : (
                  <div className="mb-2.5 max-h-36 space-y-1 overflow-y-auto">
                    {endTurnRewards.map((r) => (
                      <div
                        key={`${r.unitId}-${r.tileType}`}
                        className="flex items-center justify-between rounded-[2px] border border-slate-800 bg-[#090B10] px-2 py-1 text-[10.5px]"
                      >
                        <div className="min-w-0 truncate">
                          <span
                            className={`mr-1 font-bold ${
                              r.teamId === 'team_a' ? 'text-red-400' : 'text-sky-400'
                            }`}
                          >
                            [{r.teamId === 'team_a' ? 'A' : 'B'}]
                          </span>
                          <span className="font-semibold text-slate-200">{r.unitName}</span>
                        </div>
                        <span
                          className={`ml-1.5 flex shrink-0 items-center gap-0.5 font-bold ${
                            r.tileType === 'leyline' ? 'text-teal-300' : 'text-emerald-300'
                          }`}
                        >
                          {r.tileType === 'leyline' ? (
                            <Sparkles className="h-2.5 w-2.5" />
                          ) : (
                            <Heart className="h-2.5 w-2.5" />
                          )}
                          {r.detail}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      endTurnAndNext(skipMana, true);
                      setShowEndTurnMenu(false);
                    }}
                    className="flex w-full items-center justify-center gap-1 rounded-[2px] border border-[#C8A253]/70 bg-[#B91C1C] py-1.5 text-[10.5px] font-bold text-white transition hover:bg-red-700"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>แจกรางวัลช่องพิเศษ & จบเทิร์น</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      endTurnAndNext(skipMana, false);
                      setShowEndTurnMenu(false);
                    }}
                    className="flex w-full items-center justify-center gap-1 rounded-[2px] border border-slate-700 bg-[#090B10] py-1 text-[10px] font-semibold text-slate-300 transition hover:border-[#C8A253] hover:text-white"
                  >
                    <span>จบเทิร์นแบบไม่แจกช่องพิเศษ</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setCombatHelperOpen(true)}
          title="เปิด Quick Combat Helper (คำนวณดาเมจภูมิประเทศ + ทอย 1d6 + หัก HP/จ่าย Bounty)"
          className="flex items-center gap-1 rounded-[2px] border border-[#C8A253]/60 bg-[#C8A253]/15 px-2 py-0.5 font-display text-[10px] font-bold tracking-wider text-[#E5C983] transition hover:bg-[#C8A253]/30"
        >
          <Swords className="h-3 w-3" />
          <span>Combat</span>
        </button>

        <label
          title="ติ๊กเพื่อไม่แจก +2 Mana ประจำเทิร์น (เช่น ติด Event Mana Drought)"
          className="flex cursor-pointer items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200"
        >
          <input
            type="checkbox"
            checked={skipMana}
            onChange={(e) => setSkipMana(e.target.checked)}
            className="h-3 w-3 accent-[#C8A253]"
          />
          <span>งด +2M</span>
        </label>
      </div>

      {/* Center: Secret Grail Turn & Manifest Switch */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-[2px] border border-[#C8A253]/25 bg-[#090B10] px-1.5 py-0.5">
          <span className="text-[10px] font-semibold text-slate-400">Secret Turn:</span>
          {([10, 11, 12] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSecretGrailTurn(t)}
              className={`rounded-[2px] px-1.5 py-px font-display text-[10px] font-bold transition ${
                rulerSecret.secretGrailTurn === t
                  ? 'bg-[#C8A253] text-[#090B10]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              T{t}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={toggleGrailManifested}
          className={`flex items-center gap-1 rounded-[2px] border px-2 py-0.5 text-[10px] font-bold transition ${
            roomState.grailManifested
              ? 'border-[#C8A253] bg-[#C8A253]/20 text-[#E5C983]'
              : 'border-slate-700 bg-[#090B10] text-slate-400 hover:text-slate-200'
          }`}
        >
          <Crown className="h-3 w-3" />
          <span>{roomState.grailManifested ? 'Grail: ACTIVE' : 'Grail: Sealed'}</span>
        </button>
      </div>

      {/* Right: Mode Toggles + Undo */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setFreeDragEnabled(!freeDragEnabled)}
          title="เปิด-ปิดการลากตัวหมากอิสระ (God-Mode)"
          className={`flex items-center gap-1 rounded-[2px] border px-2 py-0.5 text-[10px] font-bold transition ${
            freeDragEnabled
              ? 'border-emerald-700/80 bg-emerald-950/50 text-emerald-300'
              : 'border-slate-700 bg-[#090B10] text-slate-500'
          }`}
        >
          <Hand className="h-3 w-3" />
          <span>Free Drag</span>
        </button>

        <button
          type="button"
          onClick={() => setShowMoveHelper(!showMoveHelper)}
          title="แสดงไฮไลต์ระยะเดิน MP (Dijkstra 0.5 MP + ZoC)"
          className={`flex items-center gap-1 rounded-[2px] border px-2 py-0.5 text-[10px] font-bold transition ${
            showMoveHelper
              ? 'border-sky-700/80 bg-sky-950/50 text-sky-300'
              : 'border-slate-700 bg-[#090B10] text-slate-500'
          }`}
        >
          <Footprints className="h-3 w-3" />
          <span>MOV/ZoC</span>
        </button>

        <button
          type="button"
          onClick={() => setShowCommandArrows(!showCommandArrows)}
          title="แสดง/ซ่อนเส้นลูกศรคำสั่งลับของทั้งสองฝ่ายบนกระดาน"
          className={`flex items-center gap-1 rounded-[2px] border px-2 py-0.5 text-[10px] font-bold transition ${
            showCommandArrows
              ? 'border-[#C8A253]/70 bg-[#C8A253]/15 text-[#E5C983]'
              : 'border-slate-700 bg-[#090B10] text-slate-500'
          }`}
        >
          <Navigation className="h-3 w-3" />
          <span>Arrows</span>
        </button>

        <button
          type="button"
          onClick={toggleTrueNameConcealment}
          title="สลับโหมดปิดนามแท้ (ศัตรูเห็นเฉพาะคลาสจนกว่าจะถูกเปิดเผย)"
          className={`flex items-center gap-1 rounded-[2px] border px-2 py-0.5 text-[10px] font-bold transition ${
            roomState.trueNameConcealment
              ? 'border-[#C8A253] bg-[#C8A253]/20 text-[#E5C983]'
              : 'border-slate-700 bg-[#090B10] text-slate-400 hover:text-slate-200'
          }`}
        >
          <EyeOff className="h-3 w-3" />
          <span>ปิดนามแท้: {roomState.trueNameConcealment ? 'ON' : 'OFF'}</span>
        </button>

        <button
          type="button"
          onClick={toggleExcludeDuplicateSummer}
          title="ห้ามร่าง Summer ซ้ำร่างปกติ (ปรับ Pool อัตโนมัติ — Alter ยังอยู่)"
          className={`rounded-[2px] border px-2 py-0.5 text-[10px] font-bold transition ${
            roomState.excludeDuplicateSummer
              ? 'border-cyan-500/80 bg-cyan-950/60 text-cyan-300'
              : 'border-slate-700 bg-[#090B10] text-slate-500 hover:text-slate-300'
          }`}
        >
          No Dupes: Summer
        </button>

        <button
          type="button"
          onClick={toggleExcludeDuplicateAlter}
          title="ห้ามร่าง Alter ซ้ำร่างปกติ (ปรับ Pool อัตโนมัติ — Summer ยังอยู่)"
          className={`rounded-[2px] border px-2 py-0.5 text-[10px] font-bold transition ${
            roomState.excludeDuplicateAlter
              ? 'border-fuchsia-500/80 bg-fuchsia-950/60 text-fuchsia-300'
              : 'border-slate-700 bg-[#090B10] text-slate-500 hover:text-slate-300'
          }`}
        >
          No Dupes: Alter
        </button>

        <button
          type="button"
          onClick={toggleFogOfWar}
          title="เปิด-ปิด Fog of War"
          className={`flex items-center gap-1 rounded-[2px] border px-2 py-0.5 text-[10px] font-bold transition ${
            roomState.fogConfig.enabled
              ? 'border-[#C8A253]/70 bg-[#C8A253]/15 text-[#E5C983]'
              : 'border-slate-700 bg-[#090B10] text-slate-400 hover:text-slate-200'
          }`}
        >
          <CloudFog className="h-3 w-3" />
          <span>Fog: {roomState.fogConfig.enabled ? 'ON' : 'OFF'}</span>
        </button>

        <button
          type="button"
          onClick={undo}
          disabled={historyLength === 0}
          title="ย้อนกลับสถานะกระดานก่อนหน้า (เก็บสูงสุด 15 ขั้น)"
          className={`flex items-center gap-1 rounded-[2px] border px-2 py-0.5 text-[10px] font-bold transition ${
            historyLength > 0
              ? 'border-[#C8A253]/60 bg-[#111622] text-[#E5C983] hover:bg-[#C8A253]/20'
              : 'cursor-not-allowed border-slate-800 bg-[#090B10] text-slate-600'
          }`}
        >
          <Undo2 className="h-3 w-3" />
          <span>Undo ({historyLength})</span>
        </button>
      </div>
    </div>
  );
}
