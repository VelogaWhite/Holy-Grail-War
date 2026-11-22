import type { BoardUnit, Role, RoomState } from '../types/game';

/**
 * Returns true if the viewing player must NOT see this unit's True Name, portrait, skill, or NP.
 * - Ruler always sees everything.
 * - The owning Master always sees their own Servants.
 * - Non-Servants (PvE Monsters / Grail) are never concealed.
 * - When trueNameConcealment is OFF, everyone sees everything.
 */
export function isUnitIdentityHidden(
  unit: BoardUnit,
  viewerRole: Role,
  roomState: RoomState
): boolean {
  if (!roomState.trueNameConcealment) return false;
  if (unit.unitType !== 'servant') return false;
  if (viewerRole === 'ruler') return false;
  if (unit.isTrueNameRevealed) return false;

  const viewerTeam = viewerRole === 'master_a' ? 'team_a' : 'team_b';
  return unit.owner !== viewerTeam;
}

export function getDisplayUnitName(
  unit: BoardUnit,
  viewerRole: Role,
  roomState: RoomState
): string {
  if (isUnitIdentityHidden(unit, viewerRole, roomState)) {
    return `${unit.servantClass ?? 'Servant'} ???`;
  }
  return unit.name;
}
