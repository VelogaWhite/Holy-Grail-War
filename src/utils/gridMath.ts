import { CLASSES_BY_ID, MAP_DATA, TERRAINS_BY_ID } from '../data';
import type { BoardUnit, Coordinates, TerrainId, ZoneId } from '../types/game';
import { getTileKey } from './assetHelper';

export interface ReachableTileInfo {
  zone: ZoneId;
  x: number;
  y: number;
  cost: number;
  path: Coordinates[];
  zocPenalized: boolean;
  crossZone: boolean;
}

export interface MovementAnalysis {
  reachable: Record<string, ReachableTileInfo>;
  isEngaged: boolean;
  ignoreZoC: boolean;
  baseMov: number;
  maxMP: number;
  zocRetreatMP: number;
}

const ORTHO_DIRS: [number, number][] = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
];

function roundHalf(val: number): number {
  return Math.round(val * 2) / 2;
}

export function formatMpCost(cost: number): string {
  return roundHalf(cost).toFixed(1);
}

export function getTerrainAt(zone: ZoneId, x: number, y: number): TerrainId {
  return MAP_DATA.zones[zone]?.terrainGrid[y]?.[x] ?? 'open';
}

export interface AttackRangeAnalysis {
  tiles: Set<string>;
  baseRange: number;
  effectiveRange: number;
  highGroundBonus: boolean;
}

/**
 * Computes attack range tiles (Manhattan distance 1..effectiveRange within the same zone).
 * Ranged classes (base range >= 2) standing on a 'building' tile receive +1 Range (High Ground).
 */
export function computeAttackRangeTiles(unit: BoardUnit): AttackRangeAnalysis {
  const classDef = unit.servantClass ? CLASSES_BY_ID[unit.servantClass] : undefined;
  const baseRange = unit.range ?? classDef?.baseRange ?? 1;
  const tiles = new Set<string>();

  if (unit.status !== 'active' || !unit.position || baseRange <= 0) {
    return { tiles, baseRange, effectiveRange: baseRange, highGroundBonus: false };
  }

  const { zone, x: ux, y: uy } = unit.position;
  const terrain = getTerrainAt(zone, ux, uy);
  const highGroundBonus = terrain === 'building' && baseRange >= 2;
  const effectiveRange = baseRange + (highGroundBonus ? 1 : 0);

  for (let y = 0; y < MAP_DATA.rows; y++) {
    for (let x = 0; x < MAP_DATA.cols; x++) {
      const dist = Math.abs(x - ux) + Math.abs(y - uy);
      if (dist >= 1 && dist <= effectiveRange) {
        tiles.add(getTileKey(zone, x, y));
      }
    }
  }

  return { tiles, baseRange, effectiveRange, highGroundBonus };
}

function getMoveStepCost(fromTerrain: TerrainId, toTerrain: TerrainId): number {
  const toDef = TERRAINS_BY_ID[toTerrain];
  if (!toDef) return 1.0;
  if (fromTerrain === toTerrain && typeof toDef.sameTerrainMoveCost === 'number') {
    return toDef.sameTerrainMoveCost;
  }
  return toDef.moveCost;
}

function isEnemyOf(a: BoardUnit, b: BoardUnit): boolean {
  if (a.id === b.id) return false;
  if (a.owner === 'neutral' || b.owner === 'neutral') return true;
  return a.owner !== b.owner;
}

function manhattan(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/**
 * Computes reachable tiles using Civilization-style Movement Points (0.5 MP base) Dijkstra:
 * - Road: 0.5 MP | Open / Ruins: 1.0 MP | Forest: 1.5 MP | Building: 1.5 MP (1.0 MP rooftop-to-rooftop) | Water: 2.0 MP
 * - Gate Crossing (x=9 <-> x=0 at y=1, 3, 5): fixed 1.0 MP
 * - Strict MP: totalCost + stepCost <= maxMP; cannot pass through enemies/monsters or stop on occupied tiles
 * - Zone of Control (ZoC): Engaged at turn start -> retreating reduces maxMP by 1.0 (min 1.0 MP), exempt for Assassin (ignoreZoC: true)
 *
 * NOTE: Visual / Picker helper — never blocks Ruler Free Drag!
 */
export function computeMovementAnalysis(
  unit: BoardUnit,
  allUnits: Record<string, BoardUnit>,
  hasteBonus = 0
): MovementAnalysis {
  const baseMaxMP = roundHalf(Math.max(0, unit.mov + hasteBonus));
  const empty: MovementAnalysis = {
    reachable: {},
    isEngaged: false,
    ignoreZoC: false,
    baseMov: unit.mov,
    maxMP: baseMaxMP,
    zocRetreatMP: Math.max(1.0, roundHalf(baseMaxMP - 1.0)),
  };

  if (unit.status !== 'active' || !unit.position || baseMaxMP <= 0) {
    return empty;
  }

  const start = unit.position;
  const maxMP = baseMaxMP;

  const classDef = unit.servantClass ? CLASSES_BY_ID[unit.servantClass] : undefined;
  const ignoreZoC = Boolean(classDef?.ignoreZoC);

  // Build occupancy maps
  const occupiedAll = new Map<string, BoardUnit>();
  const blockingEnemies = new Set<string>();
  const adjacentEnemyServants: Coordinates[] = [];

  for (const other of Object.values(allUnits)) {
    if (other.status !== 'active' || !other.position || other.id === unit.id) continue;
    const key = getTileKey(other.position.zone, other.position.x, other.position.y);
    occupiedAll.set(key, other);

    if (isEnemyOf(unit, other)) {
      blockingEnemies.add(key);
      if (
        other.unitType === 'servant' &&
        other.position.zone === start.zone &&
        manhattan(start.x, start.y, other.position.x, other.position.y) === 1
      ) {
        adjacentEnemyServants.push(other.position);
      }
    }
  }

  const isEngaged = adjacentEnemyServants.length > 0;
  const zocRetreatMP = Math.max(1.0, roundHalf(maxMP - 1.0));

  // Build bidirectional gate lookup
  const gateNeighbors = new Map<string, Coordinates[]>();
  for (const gate of MAP_DATA.gates) {
    const kFrom = getTileKey(gate.from.zone, gate.from.x, gate.from.y);
    const kTo = getTileKey(gate.to.zone, gate.to.x, gate.to.y);
    gateNeighbors.set(kFrom, [...(gateNeighbors.get(kFrom) ?? []), gate.to]);
    gateNeighbors.set(kTo, [...(gateNeighbors.get(kTo) ?? []), gate.from]);
  }

  interface Node {
    zone: ZoneId;
    x: number;
    y: number;
    cost: number;
    path: Coordinates[];
  }

  const startCoord: Coordinates = { zone: start.zone, x: start.x, y: start.y };
  const startKey = getTileKey(start.zone, start.x, start.y);
  const bestCost = new Map<string, number>([[startKey, 0]]);
  const queue: Node[] = [
    { zone: start.zone, x: start.x, y: start.y, cost: 0, path: [startCoord] },
  ];
  const reachable: Record<string, ReachableTileInfo> = {};

  while (queue.length > 0) {
    queue.sort((a, b) => a.cost - b.cost);
    const cur = queue.shift()!;
    const curKey = getTileKey(cur.zone, cur.x, cur.y);

    if (cur.cost > (bestCost.get(curKey) ?? Infinity)) continue;

    // Record reachable (cannot stop on occupied tile or start tile)
    if (curKey !== startKey && !occupiedAll.has(curKey)) {
      let zocPenalized = false;
      if (isEngaged && !ignoreZoC) {
        if (cur.zone !== start.zone) {
          zocPenalized = true;
        } else {
          zocPenalized = adjacentEnemyServants.some(
            (e) => manhattan(cur.x, cur.y, e.x, e.y) > 1
          );
        }
      }

      const maxAllowed = zocPenalized ? zocRetreatMP : maxMP;
      if (cur.cost <= maxAllowed) {
        reachable[curKey] = {
          zone: cur.zone,
          x: cur.x,
          y: cur.y,
          cost: cur.cost,
          path: cur.path,
          zocPenalized,
          crossZone: cur.zone !== start.zone,
        };
      }
    }

    const curTerrain = getTerrainAt(cur.zone, cur.x, cur.y);

    // 1. Orthogonal neighbors in same zone
    for (const [dx, dy] of ORTHO_DIRS) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      if (nx < 0 || nx >= MAP_DATA.cols || ny < 0 || ny >= MAP_DATA.rows) continue;
      const nKey = getTileKey(cur.zone, nx, ny);
      if (blockingEnemies.has(nKey)) continue;

      const nextTerrain = getTerrainAt(cur.zone, nx, ny);
      const stepCost = getMoveStepCost(curTerrain, nextTerrain);
      const nextCost = roundHalf(cur.cost + stepCost);

      if (nextCost <= maxMP && nextCost < (bestCost.get(nKey) ?? Infinity)) {
        bestCost.set(nKey, nextCost);
        queue.push({
          zone: cur.zone,
          x: nx,
          y: ny,
          cost: nextCost,
          path: [...cur.path, { zone: cur.zone, x: nx, y: ny }],
        });
      }
    }

    // 2. Gate crossing neighbors (fixed 1.0 MP)
    const gates = gateNeighbors.get(curKey);
    if (gates) {
      for (const dest of gates) {
        const dKey = getTileKey(dest.zone, dest.x, dest.y);
        if (blockingEnemies.has(dKey)) continue;
        const nextCost = roundHalf(cur.cost + 1.0);
        if (nextCost <= maxMP && nextCost < (bestCost.get(dKey) ?? Infinity)) {
          bestCost.set(dKey, nextCost);
          queue.push({
            zone: dest.zone,
            x: dest.x,
            y: dest.y,
            cost: nextCost,
            path: [...cur.path, { zone: dest.zone, x: dest.x, y: dest.y }],
          });
        }
      }
    }
  }

  return {
    reachable,
    isEngaged,
    ignoreZoC,
    baseMov: unit.mov,
    maxMP,
    zocRetreatMP,
  };
}
