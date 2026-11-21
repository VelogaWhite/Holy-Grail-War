export type Role = 'ruler' | 'master_a' | 'master_b';
export type TeamId = 'team_a' | 'team_b';
export type OwnerId = TeamId | 'neutral';
export type ZoneId = 'base_a' | 'central' | 'base_b';
export type TurnPhase = 'draft' | 'event' | 'planning' | 'resolution' | 'ended';
export type UnitStatus = 'active' | 'reserve' | 'defeated';

export type ServantClassId =
  | 'Saber'
  | 'Archer'
  | 'Lancer'
  | 'Rider'
  | 'Caster'
  | 'Assassin'
  | 'Berserker'
  | 'Extra';

export interface Coordinates {
  zone: ZoneId;
  x: number; // 0 to 5 (6x6 grid)
  y: number; // 0 to 5
}

export interface BoardUnit {
  id: string; // Unique instance ID e.g. "unit_a_1" or "mon_wyvern_1"
  templateId: string; // Reference id in servants.json or monsters.json
  unitType: 'servant' | 'monster' | 'grail';
  name: string;
  servantClass?: ServantClassId;
  subClass?: string; // e.g. "Ruler", "Avenger", "Alter Ego", "Moon Cancer"
  owner: OwnerId;
  status: UnitStatus;
  position: Coordinates | null; // null when reserve or defeated
  hp: number;
  maxHp: number;
  atk: number;
  mov: number;
  range?: number;
  npReady: boolean;
  tags: string[]; // Free-form GM buff/debuff tags e.g. ["Evade 1x", "Stun", "ATK+2"]
  isRevealedToEnemy: boolean; // Override reveal through Fog of War
  image?: string;
}

export interface TeamState {
  name: string;
  mana: number;
  qp: number;
  commandSpells: number; // Max 3
  inventory: string[]; // itemId list
  defeatedCount: number; // Enemy kills count or own defeated count (per win condition)
  readyLocked: boolean;
}

export interface TileOverride {
  tileKey: string; // "{zone}_{x}_{y}" e.g. "central_2_3"
  cleared: boolean;
  customNote?: string;
}

export type CommandActionType =
  | 'move'
  | 'attack'
  | 'move_and_attack'
  | 'skill'
  | 'np'
  | 'guard'
  | 'explore'
  | 'tag_out'
  | 'custom';

export interface CommandOrder {
  unitId: string;
  actionType: CommandActionType;
  targetPosition?: Coordinates;
  targetUnitId?: string;
  note: string;
}

export interface SecretCommandsDoc {
  turn: number;
  locked: boolean;
  updatedAt: number;
  orders: CommandOrder[]; // Max 3 orders (Active Servants)
}

export interface WheelBroadcast {
  id: string;
  wheelType: 'servant_draft' | 'map_event' | 'personal_event';
  isSpinning: boolean;
  poolIds: string[];
  resultId: string | null;
  resultLabel: string | null;
  resultDescription?: string | null;
  targetTeam?: TeamId | null;
}

export interface DiceBroadcast {
  id: string;
  rollerRole: Role;
  sides: number; // e.g. 6 (1d6)
  result: number;
  label: string;
  timestamp: number;
}

export interface FogConfig {
  enabled: boolean;
  revealBaseZoneToOwnerOnly: boolean;
  showCentralToAll: boolean;
}

export interface GameLogEntry {
  id: string;
  turn: number;
  timestamp: number;
  actor: Role | 'system';
  message: string;
}

export interface RoomState {
  roomId: string;
  createdAt: number;
  turn: number;
  phase: TurnPhase;
  seats: {
    rulerUid: string | null;
    masterAUid: string | null;
    masterBUid: string | null;
  };
  draftPoolRemaining: string[];
  teams: {
    team_a: TeamState;
    team_b: TeamState;
  };
  units: Record<string, BoardUnit>;
  tileOverrides: Record<string, TileOverride>;
  fogConfig: FogConfig;
  activeMapEvent: { id: string; title: string; description: string } | null;
  wheelBroadcast: WheelBroadcast | null;
  diceBroadcast: DiceBroadcast | null;
  logs: GameLogEntry[]; // Latest 50 entries
}

// --- Static JSON Data Schemas ---

export interface ClassDefinition {
  id: ServantClassId;
  label: string;
  baseMov: number;
  baseRange: number;
  ignoreZoC: boolean;
  icon: string;
  color: string;
  traitNote: string;
}

export interface ServantTemplate {
  id: string;
  name: string;
  servantClass: ServantClassId;
  subClass?: string;
  hp: number;
  atk: number;
  mov: number;
  range: number;
  skillName: string;
  skillCost: number;
  skillDesc: string;
  npName: string;
  npCost: number;
  npDesc: string;
  image: string;
}

export interface MonsterTemplate {
  id: string;
  name: string;
  tier: 1 | 2 | 3;
  hp: number;
  atk: number;
  mov: number;
  range: number;
  rewardMana: number;
  rewardQp: number;
  dropItemRarity: 'common' | 'rare' | null;
  rewardNote: string;
  image: string;
}

export interface ItemTemplate {
  id: string;
  name: string;
  rarity: 'common' | 'rare';
  qpCost: number;
  effectDesc: string;
  icon: string;
}

export interface GameEventTemplate {
  id: string;
  title: string;
  description: string;
  weight: number;
}

export interface EventsData {
  mapEvents: GameEventTemplate[];
  personalEvents: GameEventTemplate[];
}

export type SpecialTileType =
  | 'spawn_a'
  | 'spawn_b'
  | 'safe_house'
  | 'leyline'
  | 'qp_cache'
  | 'personal_event'
  | 'monster_nest'
  | 'gate'
  | 'grail_site';

export interface SpecialTile {
  x: number;
  y: number;
  type: SpecialTileType;
  label: string;
  manaBonus?: number;
  monsterId?: string;
  tier?: number;
  targetZone?: ZoneId;
}

export interface GateDefinition {
  id: string;
  label: string;
  from: Coordinates;
  to: Coordinates;
}

export interface ZoneDefinition {
  id: ZoneId;
  name: string;
  owner: OwnerId;
  specialTiles: SpecialTile[];
}

export interface MapData {
  gridSize: number;
  gates: GateDefinition[];
  zones: Record<ZoneId, ZoneDefinition>;
}
