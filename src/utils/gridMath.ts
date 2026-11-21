import { CLASSES_BY_ID, MAP_DATA, TERRAINS_BY_ID } from '../data';
import type { BoardUnit, Coordinates, TerrainId, ZoneId } from '../types/game';
import { getTileKey } from './assetHelper';

export interface ReachableTileInfo {
  zone: ZoneId;
  x: number;
  y: number;
  cost: number;
  isZocRetreat: boolean;
  crossZone: boolean;
}

export interface MovementAnalysis {
  reachable: Record<string, ReachableTileInfo>;
  isEngaged: boolean;
  ignoreZoC: boolean;
  roadBonusApplied: boolean;
  baseMov: number;
  effectiveMov: number;
}

const ORTHO_DIRS: [number, number][] = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
];

function getTerrainAt(zone: ZoneId, x: number, y: number): TerrainId {
  return MAP_DATA.zones[zone]?.terrainGrid[y]?.[x] ?? 'open';
}

function getMoveStepCost(fromTerrain: TerrainId, toTerrain: TerrainId): number {
  const toDef = TERRAINS_BY_ID[toTerrain];
  if (!toDef) return 1;
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
 * Computes reachable tiles using Weighted BFS (Dijkstra) supporting:
 * - 10x7 horizontal 3-zone grid + bidirectional Gate Crossing (1 MOV)
 * - Terrain costs (road +1 MOV start bonus, forest/water 2 MOV, building 2 MOV climb / 1 MOV rooftop)
 * - Zone of Control (ZoC): -1 MOV penalty when retreating from adjacent enemy Servant (min 1 MOV), exempt for Assassin (ignoreZoC: true)
 *
 * NOTE: Visual Helper only — never blocks Ruler Free Drag!
 */
export function computeMovementAnalysis(
  unit: BoardUnit,
  allUnits: Record<string, BoardUnit>,
  hasteBonus = 0
): MovementAnalysis {
  const empty: MovementAnalysis = {
    reachable: {},
    isEngaged: false,
    ignoreZoC: false,
    roadBonusApplied: false,
    baseMov: unit.mov,
    effectiveMov: unit.mov,
  };

  if (unit.status !== 'active' || !unit.position || unit.mov <= 0) {
    return empty;
  }

  const start = unit.position;
  const startTerrain = getTerrainAt(start.zone, start.x, start.y);
  const roadBonusApplied = (TERRAINS_BY_ID[startTerrain]?.startRoadBonus ?? 0) > 0;
  const effectiveMov = unit.mov + (roadBonusApplied ? 1 : 0) + hasteBonus;

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
  const zocRetreatBudget = Math.max(1, effectiveMov - 1);

  // Build bidirectional gate lookup
  const gateNeighbors = new Map<string, Coordinates[]>();
  for (const gate of MAP_DATA.gates) {
    const kFrom = getTileKey(gate.from.zone, gate.from.x, gate.from.y);
    const kTo = getTileKey(gate.to.zone, gate.to.x, gate.to.y);
    gateNeighbors.set(kFrom, [...(gateNeighbors.get(kFrom) ?? []), gate.to]);
    gateNeighbors.set(kTo, [...(gateNeighbors.get(kTo) ?? []), gate.from]);
  }

  // Dijkstra priority queue (small grid, simple sorted array is super fast)
  interface Node {
    zone: ZoneId;
    x: number;
    y: number;
    cost: number;
  }

  const startKey = getTileKey(start.zone, start.x, start.y);
  const bestCost = new Map<string, number>([[startKey, 0]]);
  const queue: Node[] = [{ zone: start.zone, x: start.x, y: start.y, cost: 0 }];
  const reachable: Record<string, ReachableTileInfo> = {};

  while (queue.length > 0) {
    queue.sort((a, b) => a.cost - b.cost);
    const cur = queue.shift()!;
    const curKey = getTileKey(cur.zone, cur.x, cur.y);

    if (cur.cost > (bestCost.get(curKey) ?? Infinity)) continue;

    // Record reachable (cannot stop on occupied tile or start tile)
    if (curKey !== startKey && !occupiedAll.has(curKey)) {
      let isZocRetreat = false;
      if (isEngaged && !ignoreZoC) {
        // Retreating = moving to another zone OR increasing distance from any engaged enemy
        if (cur.zone !== start.zone) {
          isZocRetreat = true;
        } else {
          isZocRetreat = adjacentEnemyServants.some(
            (e) => manhattan(cur.x, cur.y, e.x, e.y) > 1
          );
        }
      }

      const maxAllowed = isZocRetreat ? zocRetreatBudget : effectiveMov;
      if (cur.cost <= maxAllowed) {
        reachable[curKey] = {
          zone: cur.zone,
          x: cur.x,
          y: cur.y,
          cost: cur.cost,
          isZocRetreat,
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
      const nextCost = cur.cost + stepCost;

      if (nextCost <= effectiveMov && nextCost < (bestCost.get(nKey) ?? Infinity)) {
        bestCost.set(nKey, nextCost);
        queue.push({ zone: cur.zone, x: nx, y: ny, cost: nextCost });
      }
    }

    // 2. Gate crossing neighbors (1 MOV)
    const gates = gateNeighbors.get(curKey);
    if (gates) {
      for (const dest of gates) {
        const dKey = getTileKey(dest.zone, dest.x, dest.y);
        if (blockingEnemies.has(dKey)) continue;
        const nextCost = cur.cost + 1;
        if (nextCost <= effectiveMov && nextCost < (bestCost.get(dKey) ?? Infinity)) {
          bestCost.set(dKey, nextCost);
          queue.push({ zone: dest.zone, x: dest.x, y: dest.y, cost: nextCost });
        }
      }
    }
  }

  return {
    reachable,
    isEngaged,
    ignoreZoC,
    roadBonusApplied,
    baseMov: unit.mov,
    effectiveMov,
  };
}
