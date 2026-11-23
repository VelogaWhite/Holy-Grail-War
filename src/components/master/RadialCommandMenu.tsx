import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Compass,
  Flame,
  Footprints,
  Package,
  RefreshCw,
  Shield,
  Swords,
  Zap,
} from 'lucide-react';
import { MAP_DATA, SERVANTS_BY_ID } from '../../data';
import { useGameStore } from '../../store/useGameStore';
import type {
  CommandActionType,
  SpecialTileType,
  StanceType,
  TeamId,
} from '../../types/game';
import {
  getClassIconUrl,
  getInitials,
  resolveAssetUrl,
} from '../../utils/assetHelper';
import {
  computeAttackRangeTiles,
  formatMpCost,
} from '../../utils/gridMath';

const OUTER_R = 148;
const INNER_R = 56;
const LABEL_R = 104;
const GAP_DEG = 3.2;
const FOCUS_OFFSET = 9;
const SVG_HALF = 172;
const SVG_SIZE = SVG_HALF * 2;
const EDGE_PADDING = 24;
const PANEL_HALF_W = 186;
const TOP_EXTENT = 166;
const BOTTOM_EXTENT = 258; // Wheel + info strip + Stance Quick-Bar

interface RadialSegmentSpec {
  id: CommandActionType;
  label: string;
  subLabel: string;
  badge?: string;
  badgeColor?: string;
  description: string;
  accentHex: string;
  glowRgba: string;
  dimmed?: boolean;
  iconType: CommandActionType;
}

function getExploreTileInfo(specialType?: SpecialTileType): {
  label: string;
  sub: string;
  desc: string;
} {
  switch (specialType) {
    case 'safe_house':
      return {
        label: 'Safe House',
        sub: 'Shop / +2HP',
        desc: 'Safe House / Church: ฟื้นฟู +2 HP ตอนจบเทิร์น หรือซื้อไอเทม Mystic Codes ด้วย QP',
      };
    case 'watchtower':
      return {
        label: 'Watchtower',
        sub: 'ส่องหมอก',
        desc: 'Watchtower: ใช้ Action Explore ฟรีเพื่อเปิดเผยยูนิตศัตรูในป่าทั้งโซนหรือส่อง Base ศัตรู',
      };
    case 'workshop':
      return {
        label: 'Workshop',
        sub: '3QP บัฟ',
        desc: 'Workshop / Forge: จ่าย 3 QP เพื่อแปะป้าย [ATK+1] หรือ [DEF+1] นาน 2 เทิร์น',
      };
    case 'blood_altar':
      return {
        label: 'Blood Altar',
        sub: '-3HP แลก',
        desc: 'Blood Altar: เสีย 3 HP (คงที่) เพื่อแลก +3 Mana หรือ +4 QP ทันที',
      };
    case 'teleporter':
      return {
        label: 'Teleport',
        sub: '2M วาร์ป',
        desc: 'Teleport Circle: จ่าย 2 Mana เพื่อวาร์ปไปยังวงเวทคู่กันอีกจุดบนกระดาน',
      };
    case 'qp_cache':
      return {
        label: 'QP Cache',
        sub: '1d6 QP',
        desc: 'QP Cache: เก็บหีบสมบัติ ทอย 1d6 เพื่อรับ QP ตอนจบเทิร์น',
      };
    case 'personal_event':
      return {
        label: 'Event ?',
        sub: 'สุ่ม Event',
        desc: 'Personal Event (?): ให้ Ruler หมุนวงล้อ Mini-Event เฉพาะตัวของ Servant ตนนี้',
      };
    default:
      return {
        label: 'Explore',
        sub: 'สำรวจช่อง',
        desc: 'Explore / Tile Action: สำรวจพื้นที่หรือใช้งานช่องพิเศษที่ Servant ยืนอยู่',
      };
  }
}

function buildDonutWedgePath(
  startDeg: number,
  endDeg: number,
  innerR: number,
  outerR: number
): string {
  const a0 = (startDeg * Math.PI) / 180;
  const a1 = (endDeg * Math.PI) / 180;
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;

  const x0o = outerR * Math.cos(a0);
  const y0o = outerR * Math.sin(a0);
  const x1o = outerR * Math.cos(a1);
  const y1o = outerR * Math.sin(a1);

  const x1i = innerR * Math.cos(a1);
  const y1i = innerR * Math.sin(a1);
  const x0i = innerR * Math.cos(a0);
  const y0i = innerR * Math.sin(a0);

  return [
    `M ${x0o.toFixed(2)} ${y0o.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x1o.toFixed(2)} ${y1o.toFixed(2)}`,
    `L ${x1i.toFixed(2)} ${y1i.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x0i.toFixed(2)} ${y0i.toFixed(2)}`,
    'Z',
  ].join(' ');
}

function SegmentGlyph({
  type,
  color,
}: {
  type: CommandActionType;
  color: string;
}) {
  const props = {
    x: -9,
    y: -21,
    width: 18,
    height: 18,
    color,
    strokeWidth: 2.2,
  };
  switch (type) {
    case 'move':
      return <Footprints {...props} />;
    case 'attack':
      return <Swords {...props} />;
    case 'np':
      return <Flame {...props} />;
    case 'guard':
      return <Shield {...props} />;
    case 'explore':
      return <Compass {...props} />;
    case 'tag_out':
      return <RefreshCw {...props} />;
    case 'custom':
    default:
      return <Package {...props} />;
  }
}

const STANCE_QUICK_BTNS: {
  id: StanceType;
  icon: string;
  label: string;
  activeClass: string;
  hint: string;
}[] = [
  {
    id: 'attack',
    icon: '⚔️',
    label: 'Attack',
    activeClass:
      'border-rose-400 bg-rose-500/30 text-rose-100 shadow-[0_0_10px_rgba(244,63,94,0.4)]',
    hint: 'สวนกลับ 50% ATK (ใน Range) · โดนตีไม่ขยับ',
  },
  {
    id: 'defensive',
    icon: '🛡️',
    label: 'Defensive',
    activeClass:
      'border-sky-400 bg-sky-500/30 text-sky-100 shadow-[0_0_10px_rgba(56,189,248,0.4)]',
    hint: 'ลดดาเมจ 25% (Guard รวม 60%) · โดนตีไม่ขยับ',
  },
  {
    id: 'evade',
    icon: '💨',
    label: 'Evade',
    activeClass:
      'border-emerald-400 bg-emerald-500/30 text-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.4)]',
    hint: 'ไม่ติด ZoC · โดนตียังเดินได้ (Guard+Evade ถอย 1 ช่อง)',
  },
];

export function RadialCommandMenu() {
  const radialMenu = useGameStore((s) => s.radialMenu);
  const previewRole = useGameStore((s) => s.previewRole);
  const roomState = useGameStore((s) => s.roomState);
  const draftOrders = useGameStore((s) => s.draftOrders);
  const closeRadialMenu = useGameStore((s) => s.closeRadialMenu);
  const updateDraftOrder = useGameStore((s) => s.updateDraftOrder);
  const setActiveOrderUnit = useGameStore((s) => s.setActiveOrderUnit);
  const startTargetPicking = useGameStore((s) => s.startTargetPicking);

  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [hoveringHub, setHoveringHub] = useState(false);
  const [hoveringStanceBar, setHoveringStanceBar] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  const myTeam: TeamId | null =
    previewRole === 'master_a'
      ? 'team_a'
      : previewRole === 'master_b'
        ? 'team_b'
        : null;

  const unit = radialMenu ? roomState.units[radialMenu.unitId] ?? null : null;
  const isPlanningUnlocked = Boolean(
    myTeam &&
      roomState.phase === 'planning' &&
      !roomState.teams[myTeam].readyLocked
  );
  const isValidOpen = Boolean(
    radialMenu &&
      unit &&
      myTeam &&
      unit.owner === myTeam &&
      unit.status === 'active' &&
      unit.position &&
      isPlanningUnlocked
  );

  // Close on Escape key
  useEffect(() => {
    if (!radialMenu) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeRadialMenu();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [radialMenu, closeRadialMenu]);

  // Reset transient hover state whenever a new unit wheel opens
  useEffect(() => {
    setFocusedIndex(null);
    setHoveringHub(false);
    setHoveringStanceBar(false);
    setImgErr(false);
  }, [radialMenu?.unitId, radialMenu?.anchorX, radialMenu?.anchorY]);

  const order = unit ? draftOrders[unit.id] : undefined;
  const currentStance: StanceType = order?.stance ?? 'defensive';
  const currentUseSkill = Boolean(order?.useSkill);
  const currentActionType = order?.actionType;
  const tpl = unit ? SERVANTS_BY_ID[unit.templateId] ?? null : null;
  const team = myTeam ? roomState.teams[myTeam] : null;
  const hasteBonus = roomState.activeMapEvent?.id === 'haste_wind' ? 1 : 0;

  // Build context-aware dynamic segments (6 or 7 — never Move+Attack)
  const segments = useMemo<RadialSegmentSpec[]>(() => {
    if (!unit || !unit.position || !myTeam || !team) return [];

    const zoneDef = MAP_DATA.zones[unit.position.zone];
    const specialTile = zoneDef?.specialTiles.find(
      (t) => t.x === unit.position!.x && t.y === unit.position!.y
    );
    const rangeInfo = computeAttackRangeTiles(unit);
    const exploreInfo = getExploreTileInfo(specialTile?.type);

    const ownBaseZone = myTeam === 'team_a' ? 'base_a' : 'base_b';
    const reserveCount = Object.values(roomState.units).filter(
      (u) => u.unitType === 'servant' && u.owner === myTeam && u.status === 'reserve'
    ).length;
    const canTagOut =
      reserveCount > 0 &&
      (unit.position.zone === ownBaseZone ||
        specialTile?.type === 'summoning_altar');

    const npCost = tpl?.npCost ?? 4;
    const npName = tpl?.npName ?? 'Noble Phantasm';
    const npManaShort = team.mana < npCost;

    const guardSub =
      currentStance === 'defensive'
        ? 'ลด 60%'
        : currentStance === 'evade'
          ? '-50% ถอย 1'
          : 'ลด 50%';
    const guardDesc =
      currentStance === 'defensive'
        ? 'Guard + Defensive: ลดดาเมจรวม 60% (ปัดลง) · โดนตีไม่ขยับ'
        : currentStance === 'evade'
          ? 'Guard + Evade: ลดดาเมจ 50% และถอยหลัง 1 ช่องนับจากทิศผู้โจมตี'
          : 'Guard + Attack: ลดดาเมจ 50% + สวนกลับ 50% ATK (ใน Range)';

    const list: RadialSegmentSpec[] = [
      {
        id: 'move',
        label: 'Move',
        subLabel: `${formatMpCost(unit.mov + hasteBonus)} MP`,
        badge: currentStance === 'evade' ? 'No ZoC' : undefined,
        badgeColor: '#10B981',
        description: `เคลื่อนที่ตามงบ ${formatMpCost(unit.mov + hasteBonus)} MP (Priority 3)${
          currentStance === 'evade'
            ? ' · 💨 Evade: ไม่ติด ZoC และยังเดินหนีได้แม้โดนตี'
            : ''
        }`,
        accentHex: '#38BDF8',
        glowRgba: 'rgba(56, 189, 248, 0.7)',
        iconType: 'move',
      },
      {
        id: 'attack',
        label: 'Attack',
        subLabel: `ATK ${unit.atk} · R${rangeInfo.effectiveRange}${rangeInfo.highGroundBonus ? '+1' : ''}`,
        description: `โจมตีปกติก่อนเดิน (Priority 2): ATK ${unit.atk} + 1d6 · ระยะ ${rangeInfo.effectiveRange} ช่อง${
          rangeInfo.highGroundBonus ? ' (รวม High Ground +1)' : ''
        }`,
        accentHex: '#F43F5E',
        glowRgba: 'rgba(244, 63, 94, 0.72)',
        iconType: 'attack',
      },
      {
        id: 'np',
        label: 'NP',
        subLabel: npManaShort ? `⚠ ${npCost}M` : `${npCost} Mana`,
        badge: npManaShort ? 'Mana ไม่พอ' : undefined,
        badgeColor: '#EF4444',
        description: `Noble Phantasm: ${npName} (${npCost} Mana)${
          npManaShort
            ? ` — ⚠️ เตือน: ทีมมี ${team.mana} Mana (ยังคลิกเลือกได้)`
            : tpl
              ? ` — ${tpl.npDesc}`
              : ''
        }`,
        accentHex: '#F59E0B',
        glowRgba: 'rgba(245, 158, 11, 0.75)',
        dimmed: npManaShort,
        iconType: 'np',
      },
      {
        id: 'guard',
        label: 'Guard',
        subLabel: guardSub,
        description: guardDesc,
        accentHex: '#818CF8',
        glowRgba: 'rgba(129, 140, 248, 0.7)',
        iconType: 'guard',
      },
      {
        id: 'explore',
        label: exploreInfo.label,
        subLabel: exploreInfo.sub,
        description: exploreInfo.desc,
        accentHex: '#10B981',
        glowRgba: 'rgba(16, 185, 129, 0.7)',
        iconType: 'explore',
      },
      {
        id: 'custom',
        label: 'Item/Cmd',
        subLabel: `กระเป๋า (${team.inventory.length})`,
        badge: team.inventory.length > 0 ? `${team.inventory.length}` : undefined,
        badgeColor: '#A855F7',
        description: `ใช้ไอเทมในกระเป๋า (${team.inventory.length} ชิ้น), เรย์จู (Command Spell) หรือคำสั่งพิเศษ`,
        accentHex: '#A855F7',
        glowRgba: 'rgba(168, 85, 247, 0.7)',
        iconType: 'custom',
      },
    ];

    if (canTagOut) {
      list.push({
        id: 'tag_out',
        label: 'Tag-Out',
        subLabel: 'สลับ (1M)',
        description: `สลับตัวกับ Servant สำรอง (${reserveCount} ตน) ที่ ${
          specialTile?.type === 'summoning_altar' ? 'Summoning Altar' : 'ฐานทัพ'
        } (1 Mana)`,
        accentHex: '#EA580C',
        glowRgba: 'rgba(234, 88, 12, 0.72)',
        iconType: 'tag_out',
      });
    }

    return list;
  }, [unit, myTeam, team, roomState.units, tpl, currentStance, hasteBonus]);

  if (!isValidOpen || !radialMenu || !unit || !myTeam || !team || segments.length === 0) {
    return null;
  }

  // Clamp wheel center safely within viewport with >= 24px margin
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 720;

  const minX = PANEL_HALF_W + EDGE_PADDING;
  const maxX = vw - PANEL_HALF_W - EDGE_PADDING;
  const centerX =
    minX <= maxX
      ? Math.max(minX, Math.min(maxX, radialMenu.anchorX))
      : vw / 2;

  const minY = TOP_EXTENT + EDGE_PADDING;
  const maxY = vh - BOTTOM_EXTENT - EDGE_PADDING;
  const centerY =
    minY <= maxY
      ? Math.max(minY, Math.min(maxY, radialMenu.anchorY))
      : Math.max(TOP_EXTENT + 12, vh / 2 - 36);

  const sliceDeg = 360 / segments.length;
  const startOffset = -90 - sliceDeg / 2;

  const computeSegmentIndexFromPointer = (
    clientX: number,
    clientY: number
  ): number | null => {
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const r = Math.hypot(dx, dy);
    if (r < INNER_R) return null;

    const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    let rel = (deg - startOffset) % 360;
    if (rel < 0) rel += 360;
    return Math.floor(rel / sliceDeg) % segments.length;
  };

  const handleBackdropMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hoveringHub || hoveringStanceBar) {
      if (focusedIndex !== null) setFocusedIndex(null);
      return;
    }
    const idx = computeSegmentIndexFromPointer(e.clientX, e.clientY);
    if (idx !== focusedIndex) {
      setFocusedIndex(idx);
    }
  };

  const handleSelectSegment = (seg: RadialSegmentSpec) => {
    if (seg.id === 'move' || seg.id === 'attack' || seg.id === 'np') {
      startTargetPicking(unit.id, seg.id);
      return;
    }

    // Guard / Explore / Tag-Out / Custom: update draft order preserving stance & useSkill, focus right panel card, and close wheel
    updateDraftOrder(unit.id, {
      actionType: seg.id,
      ...(seg.id === 'guard'
        ? {
            targetPosition: undefined,
            targetUnitId: undefined,
            estimatedMoveCost: undefined,
          }
        : {}),
      ...(seg.id !== 'custom' && seg.id !== 'explore'
        ? { itemId: undefined }
        : {}),
    });
    setActiveOrderUnit(unit.id);
    closeRadialMenu();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Clicking directly on backdrop outside the wheel closes the menu
    if (e.target === e.currentTarget) {
      closeRadialMenu();
    }
  };

  const skillCd = unit.skillCooldown ?? 0;
  const imageUrl = resolveAssetUrl(unit.image);
  const classIconUrl = getClassIconUrl(unit.servantClass, unit.subClass);
  const focusedSeg =
    focusedIndex !== null ? segments[focusedIndex] ?? null : null;

  // Live info bar text below wheel
  const readoutTitle = hoveringHub && tpl
    ? `⚡ Skill: ${tpl.skillName} (${tpl.skillCost} Mana)`
    : focusedSeg
      ? `${focusedSeg.label} — ${focusedSeg.subLabel}`
      : `${unit.name} · คลิกเลือกคำสั่ง หรือสลับ Skill / Stance`;

  const readoutDesc = hoveringHub && tpl
    ? skillCd > 0
      ? `ติดคูลดาวน์อีก ${skillCd} เทิร์น — ${tpl.skillDesc}`
      : `${currentUseSkill ? '[เปิดใช้งานอยู่] ' : ''}${tpl.skillDesc}`
    : focusedSeg
      ? focusedSeg.description
      : STANCE_QUICK_BTNS.find((s) => s.id === currentStance)?.hint ?? '';

  // Subtle compass tick marks every 15 degrees
  const compassTicks = Array.from({ length: 24 }, (_, i) => i * 15);

  return createPortal(
    <div
      role="dialog"
      aria-label={`Radial Command Menu for ${unit.name}`}
      onMouseMove={handleBackdropMouseMove}
      onClick={handleBackdropClick}
      onContextMenu={(e) => {
        e.preventDefault();
        closeRadialMenu();
      }}
      className="fixed inset-0 z-[100] select-none bg-[#090B10]/35 backdrop-blur-[1px]"
    >
      {/* Anchored Wheel Root */}
      <div
        style={{
          left: centerX,
          top: centerY,
        }}
        className="pointer-events-none fixed"
      >
        <div className="animate-radial-open relative">
          {/* SVG Arcane Tactical Wheel centered at (0, 0) */}
          <svg
            width={SVG_SIZE}
            height={SVG_SIZE}
            viewBox={`${-SVG_HALF} ${-SVG_HALF} ${SVG_SIZE} ${SVG_SIZE}`}
            style={{
              position: 'absolute',
              left: -SVG_HALF,
              top: -SVG_HALF,
            }}
            className="pointer-events-none overflow-visible"
          >
            {/* Outer Grail Gold Arcane Magic Circle Rings */}
            <circle
              cx={0}
              cy={0}
              r={OUTER_R + 7}
              fill="none"
              stroke="#D4AF37"
              strokeOpacity="0.4"
              strokeWidth="1.2"
              strokeDasharray="6 4"
            />
            <circle
              cx={0}
              cy={0}
              r={OUTER_R + 12}
              fill="none"
              stroke="#D4AF37"
              strokeOpacity="0.18"
              strokeWidth="0.9"
            />
            {compassTicks.map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const isMajor = deg % 45 === 0;
              const r1 = OUTER_R + 4;
              const r2 = OUTER_R + (isMajor ? 14 : 9);
              return (
                <line
                  key={deg}
                  x1={Math.cos(rad) * r1}
                  y1={Math.sin(rad) * r1}
                  x2={Math.cos(rad) * r2}
                  y2={Math.sin(rad) * r2}
                  stroke="#D4AF37"
                  strokeOpacity={isMajor ? 0.55 : 0.25}
                  strokeWidth={isMajor ? 1.4 : 0.8}
                />
              );
            })}

            {/* Donut Wedge Segments */}
            {segments.map((seg, i) => {
              const segStart = startOffset + i * sliceDeg + GAP_DEG / 2;
              const segEnd = startOffset + (i + 1) * sliceDeg - GAP_DEG / 2;
              const midDeg = startOffset + (i + 0.5) * sliceDeg;
              const midRad = (midDeg * Math.PI) / 180;

              const isFocused = focusedIndex === i;
              const isCurrentlySelected = currentActionType === seg.id;

              const tx = isFocused ? Math.cos(midRad) * FOCUS_OFFSET : 0;
              const ty = isFocused ? Math.sin(midRad) * FOCUS_OFFSET : 0;
              const lx = Math.cos(midRad) * LABEL_R;
              const ly = Math.sin(midRad) * LABEL_R;

              const pathD = buildDonutWedgePath(segStart, segEnd, INNER_R, OUTER_R);

              return (
                <g
                  key={seg.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectSegment(seg);
                  }}
                  style={{
                    transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${
                      isFocused ? 1.035 : 1
                    })`,
                    transformOrigin: '0px 0px',
                    transition: 'transform 110ms ease-out, filter 110ms ease-out',
                    filter: isFocused
                      ? `drop-shadow(0 0 10px ${seg.glowRgba})`
                      : 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.7))',
                    opacity: seg.dimmed && !isFocused ? 0.62 : 1,
                  }}
                  className="pointer-events-auto cursor-pointer"
                >
                  <path
                    d={pathD}
                    fill={
                      isFocused
                        ? 'rgba(15, 23, 42, 0.96)'
                        : isCurrentlySelected
                          ? 'rgba(20, 28, 46, 0.94)'
                          : 'rgba(9, 13, 22, 0.90)'
                    }
                    stroke={
                      isFocused
                        ? seg.accentHex
                        : isCurrentlySelected
                          ? '#D4AF37'
                          : 'rgba(212, 175, 55, 0.42)'
                    }
                    strokeWidth={isFocused ? 2.4 : isCurrentlySelected ? 1.8 : 1.1}
                  />

                  {/* Subtle inner colored accent arc when focused */}
                  {isFocused && (
                    <path
                      d={buildDonutWedgePath(
                        segStart + 1.5,
                        segEnd - 1.5,
                        OUTER_R - 4,
                        OUTER_R
                      )}
                      fill={seg.accentHex}
                      opacity="0.88"
                    />
                  )}

                  {/* Icon + Labels at wedge centroid */}
                  <g
                    transform={`translate(${lx.toFixed(1)}, ${ly.toFixed(1)})`}
                    className="pointer-events-none"
                  >
                    <SegmentGlyph
                      type={seg.iconType}
                      color={isFocused ? seg.accentHex : '#E5C983'}
                    />
                    <text
                      x={0}
                      y={9}
                      textAnchor="middle"
                      fill={isFocused ? '#FFFFFF' : '#F1F5F9'}
                      fontSize="11.5"
                      fontWeight="800"
                    >
                      {seg.label}
                    </text>
                    <text
                      x={0}
                      y={22}
                      textAnchor="middle"
                      fill={isFocused ? seg.accentHex : '#94A3B8'}
                      fontSize="9.2"
                      fontWeight="700"
                    >
                      {seg.subLabel}
                    </text>

                    {/* Optional Compact Pill Badge (e.g., "No ZoC", "Mana ไม่พอ", Inventory Count) */}
                    {seg.badge && (
                      <g transform="translate(0, -32)">
                        <rect
                          x={-26}
                          y={-7}
                          width={52}
                          height={13}
                          rx={3}
                          fill="#090B10"
                          stroke={seg.badgeColor ?? seg.accentHex}
                          strokeWidth="1"
                        />
                        <text
                          x={0}
                          y={2.5}
                          textAnchor="middle"
                          fill={seg.badgeColor ?? seg.accentHex}
                          fontSize="7.5"
                          fontWeight="800"
                        >
                          {seg.badge}
                        </text>
                      </g>
                    )}
                  </g>
                </g>
              );
            })}

            {/* Inner Grail Gold Ring */}
            <circle
              cx={0}
              cy={0}
              r={INNER_R - 2}
              fill="none"
              stroke="#D4AF37"
              strokeOpacity="0.65"
              strokeWidth="1.4"
            />
          </svg>

          {/* Center Hub (Deadzone: Portrait + Interactive Skill Toggle — never closes wheel) */}
          <div
            onMouseEnter={() => {
              setHoveringHub(true);
              setFocusedIndex(null);
            }}
            onMouseLeave={() => setHoveringHub(false)}
            onClick={(e) => e.stopPropagation()}
            style={{
              left: -(INNER_R - 4),
              top: -(INNER_R - 4),
              width: (INNER_R - 4) * 2,
              height: (INNER_R - 4) * 2,
            }}
            className="pointer-events-auto absolute flex flex-col items-center justify-center overflow-hidden rounded-full border-2 border-[#D4AF37]/80 bg-[#090D16]/95 p-1.5 text-center shadow-[0_0_18px_rgba(0,0,0,0.9)]"
          >
            {/* Servant Avatar / Class Icon */}
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[#D4AF37]/70 bg-[#111622]">
              {imageUrl && !imgErr ? (
                <img
                  src={imageUrl}
                  alt={unit.name}
                  onError={() => setImgErr(true)}
                  className="h-full w-full object-cover object-top"
                  draggable={false}
                />
              ) : classIconUrl ? (
                <img
                  src={classIconUrl}
                  alt={unit.servantClass ?? 'Servant'}
                  className="h-full w-full object-contain p-1"
                  draggable={false}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-display text-[10px] font-bold text-[#E5C983]">
                  {getInitials(unit.name)}
                </div>
              )}
            </div>

            {/* Interactive Skill Bonus Action Toggle */}
            {tpl && (
              <button
                type="button"
                disabled={skillCd > 0}
                title={`${tpl.skillName} (${tpl.skillCost}M): ${tpl.skillDesc}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (skillCd > 0) return;
                  updateDraftOrder(unit.id, { useSkill: !currentUseSkill });
                }}
                className={`mt-1 flex items-center justify-center gap-0.5 rounded-full border px-2 py-0.5 text-[9.5px] font-extrabold tracking-tight transition ${
                  skillCd > 0
                    ? 'cursor-not-allowed border-slate-700 bg-slate-900/90 text-slate-500'
                    : currentUseSkill
                      ? 'border-amber-300 bg-violet-600 text-white shadow-[0_0_10px_rgba(139,92,246,0.85)]'
                      : 'border-violet-500/70 bg-violet-950/80 text-violet-200 hover:border-amber-400 hover:bg-violet-800'
                }`}
              >
                <Zap className="h-2.5 w-2.5 shrink-0" />
                <span>
                  {skillCd > 0
                    ? `CD ${skillCd}`
                    : currentUseSkill
                      ? `ON ${tpl.skillCost}M`
                      : `Skill ${tpl.skillCost}M`}
                </span>
              </button>
            )}
          </div>

          {/* Bottom Dock: Live Info Strip + Stance Quick-Bar (does NOT close wheel) */}
          <div
            onMouseEnter={() => {
              setHoveringStanceBar(true);
              setFocusedIndex(null);
            }}
            onMouseLeave={() => setHoveringStanceBar(false)}
            onClick={(e) => e.stopPropagation()}
            style={{
              left: -PANEL_HALF_W,
              top: OUTER_R + 18,
              width: PANEL_HALF_W * 2,
            }}
            className="pointer-events-auto absolute flex flex-col gap-1.5"
          >
            {/* Dynamic Description / Mana Readout */}
            <div className="rounded-[2px] border border-[#D4AF37]/45 bg-[#090D16]/95 px-2.5 py-1.5 text-center shadow-xl">
              <div className="truncate font-display text-[11px] font-bold tracking-wide text-[#E5C983]">
                {readoutTitle}
              </div>
              <div className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-slate-300">
                {readoutDesc}
              </div>
            </div>

            {/* Stance Quick-Bar */}
            <div className="rounded-[2px] border border-[#D4AF37]/40 bg-[#090D16]/95 p-1.5 shadow-xl">
              <div className="mb-1 flex items-center justify-between px-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                <span>STANCE (คลิกสลับได้โดยไม่ปิดวงล้อ)</span>
                <span className="font-mono text-[#E5C983]">ESC ปิด</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {STANCE_QUICK_BTNS.map((st) => {
                  const active = currentStance === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      title={st.hint}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateDraftOrder(unit.id, { stance: st.id });
                      }}
                      className={`flex items-center justify-center gap-1 rounded-[2px] border py-1 text-[10.5px] font-bold transition ${
                        active
                          ? st.activeClass
                          : 'border-slate-700/80 bg-[#111622] text-slate-400 hover:border-slate-500 hover:text-slate-200'
                      }`}
                    >
                      <span>{st.icon}</span>
                      <span>{st.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
