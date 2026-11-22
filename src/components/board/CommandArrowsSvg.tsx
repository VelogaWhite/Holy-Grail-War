import { MAP_DATA } from '../../data';
import type { BoardUnit, CommandOrder, ZoneId } from '../../types/game';

interface ArrowSpec {
  id: string;
  team: 'team_a' | 'team_b';
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  actionLabel: string;
  dashed?: boolean;
  isOverRangeOverride?: boolean;
}

interface CommandArrowsSvgProps {
  activeZone: ZoneId;
  units: Record<string, BoardUnit>;
  teamAOrders: CommandOrder[];
  teamBOrders: CommandOrder[];
  dashed?: boolean;
}

const ACTION_SHORT: Record<string, string> = {
  move: 'MOV',
  attack: 'ATK',
  move_and_attack: 'M+A',
  np: 'NP',
  guard: 'GRD',
  explore: 'EXP',
  tag_out: 'TAG',
  custom: 'CMD',
};

export function CommandArrowsSvg({
  activeZone,
  units,
  teamAOrders,
  teamBOrders,
  dashed = false,
}: CommandArrowsSvgProps) {
  const { cols, rows } = MAP_DATA;
  const arrows: ArrowSpec[] = [];

  const targetKeysA = new Set<string>();
  const targetKeysB = new Set<string>();

  const collectOrders = (orders: CommandOrder[], team: 'team_a' | 'team_b') => {
    for (const order of orders) {
      const unit = units[order.unitId];
      if (!unit || !unit.position || !order.targetPosition) continue;
      if (order.targetPosition.zone !== activeZone) continue;

      const tKey = `${order.targetPosition.x}_${order.targetPosition.y}`;
      if (team === 'team_a') targetKeysA.add(tKey);
      else targetKeysB.add(tKey);

      // Only draw arrow line if origin is also in this activeZone
      if (unit.position.zone !== activeZone) continue;

      const isOverRangeOverride = Boolean(
        order.overrideMoveRange && order.estimatedMoveCost === null
      );

      arrows.push({
        id: `${team}-${order.unitId}`,
        team,
        fromX: unit.position.x + 0.5,
        fromY: unit.position.y + 0.5,
        toX: order.targetPosition.x + 0.5,
        toY: order.targetPosition.y + 0.5,
        actionLabel: isOverRangeOverride
          ? `!${ACTION_SHORT[order.actionType] ?? 'CMD'}`
          : ACTION_SHORT[order.actionType] ?? 'CMD',
        dashed: dashed || isOverRangeOverride,
        isOverRangeOverride,
      });
    }
  };

  collectOrders(teamAOrders, 'team_a');
  collectOrders(teamBOrders, 'team_b');

  // Detect collisions (both Team A and Team B targeting the exact same tile!)
  const collisions: { x: number; y: number }[] = [];
  for (const key of targetKeysA) {
    if (targetKeysB.has(key)) {
      const [xStr, yStr] = key.split('_');
      collisions.push({ x: Number(xStr), y: Number(yStr) });
    }
  }

  if (arrows.length === 0 && collisions.length === 0) return null;

  return (
    <svg
      viewBox={`0 0 ${cols} ${rows}`}
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 z-25 h-full w-full overflow-visible"
    >
      <defs>
        <marker
          id="arrow-team-a"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill="#EF4444" />
        </marker>
        <marker
          id="arrow-team-b"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill="#38BDF8" />
        </marker>
        <marker
          id="arrow-overrange"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill="#F59E0B" />
        </marker>
      </defs>

      {/* Command Arrows */}
      {arrows.map((a) => {
        const stroke = a.isOverRangeOverride
          ? '#F59E0B'
          : a.team === 'team_a'
            ? '#EF4444'
            : '#38BDF8';
        const marker = a.isOverRangeOverride
          ? 'url(#arrow-overrange)'
          : a.team === 'team_a'
            ? 'url(#arrow-team-a)'
            : 'url(#arrow-team-b)';
        const dx = a.toX - a.fromX;
        const dy = a.toY - a.fromY;
        const len = Math.hypot(dx, dy);
        // Pull tip slightly back from center so arrowhead sits cleanly inside destination
        const endX = len > 0.2 ? a.toX - (dx / len) * 0.18 : a.toX;
        const endY = len > 0.2 ? a.toY - (dy / len) * 0.18 : a.toY;

        return (
          <g key={a.id}>
            {len > 0.05 && (
              <line
                x1={a.fromX}
                y1={a.fromY}
                x2={endX}
                y2={endY}
                stroke={stroke}
                strokeWidth="0.085"
                strokeLinecap="round"
                strokeDasharray={a.dashed ? '0.16 0.1' : undefined}
                markerEnd={marker}
                opacity="0.92"
              />
            )}
            {/* Action pill near destination */}
            <rect
              x={a.toX - 0.24}
              y={a.toY - 0.13}
              width="0.48"
              height="0.26"
              rx="0.06"
              fill="#090B10"
              stroke={stroke}
              strokeWidth="0.03"
            />
            <text
              x={a.toX}
              y={a.toY + 0.05}
              textAnchor="middle"
              fill={stroke}
              fontSize="0.16"
              fontWeight="800"
            >
              {a.actionLabel}
            </text>
          </g>
        );
      })}

      {/* COLLISION! Alert Boxes */}
      {collisions.map((c) => (
        <g key={`col-${c.x}-${c.y}`}>
          <rect
            x={c.x + 0.04}
            y={c.y + 0.04}
            width="0.92"
            height="0.92"
            rx="0.06"
            fill="rgba(249, 115, 22, 0.22)"
            stroke="#F97316"
            strokeWidth="0.06"
            strokeDasharray="0.14 0.08"
          />
          <rect
            x={c.x + 0.06}
            y={c.y + 0.06}
            width="0.88"
            height="0.24"
            rx="0.04"
            fill="#EA580C"
          />
          <text
            x={c.x + 0.5}
            y={c.y + 0.22}
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="0.14"
            fontWeight="900"
          >
            COLLISION!
          </text>
        </g>
      ))}
    </svg>
  );
}
