export type Role = 'ruler' | 'master_a' | 'master_b';
export type TeamId = 'team_a' | 'team_b';
export type OwnerId = TeamId | 'neutral';
export type ZoneId = 'base_a' | 'central' | 'base_b';
export type TurnPhase =
  | 'draft'
  | 'deployment'
  | 'event'
  | 'planning'
  | 'resolution'
  | 'ended';
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

export type TerrainId = 'open' | 'road' | 'building' | 'forest' | 'ruins' | 'water';

export interface Coordinates {
  zone: ZoneId;
  x: number; // 0 to 9 (10x7 horizontal grid)
  y: number; // 0 to 6
}

export interface BoardUnit {
  id: string;
  templateId: string;
  unitType: 'servant' | 'monster' | 'grail';
  name: string;
  servantClass?: ServantClassId;
  subClass?: string;
  owner: OwnerId;
  status: UnitStatus;
  position: Coordinates | null;
  hp: number;
  maxHp: number;
  atk: number;
  mov: number;
  range?: number;
  npReady: boolean;
  skillCooldown: number; // 0 = ready, 1-2 = turns remaining
  tags: string[];
  isRevealedToEnemy: boolean;
  isTrueNameRevealed: boolean;
  image?: string;
}

export interface TeamState {
  name: string;
  mana: number;
  qp: number;
  commandSpells: number; // Max 3
  inventory: string[];
  defeatedCount: number; // Wipeout 6/6
  readyLocked: boolean;
}

export interface TileOverride {
  tileKey: string; // "{zone}_{x}_{y}" e.g. "central_4_3"
  cleared: boolean;
  customNote?: string;
  droppedItemId?: string | null;
  isMysteryDrop?: boolean;
}

export type StanceType = 'attack' | 'defensive' | 'evade';

export type CommandActionType =
  | 'move'
  | 'attack'
  | 'np'
  | 'guard'
  | 'explore'
  | 'tag_out'
  | 'custom';

export interface CommandOrder {
  unitId: string;
  actionType: CommandActionType;
  stance?: StanceType;
  targetPosition?: Coordinates;
  targetUnitId?: string;
  useSkill?: boolean;
  overrideMoveRange?: boolean;
  estimatedMoveCost?: number | null;
  itemId?: string;
  note: string;
}

export interface DeploymentPlacement {
  unitId: string;
  position: Coordinates;
}

export interface SecretCommandsDoc {
  turn: number;
  locked: boolean;
  updatedAt: number;
  orders: CommandOrder[]; // Max 3 orders (Active Servants)
  deployment?: {
    locked: boolean;
    placements: DeploymentPlacement[];
  };
  reinforcementRequest?: {
    unitId: string;
    position: Coordinates;
    requestedAt: number;
  } | null;
}

export interface RulerSecretDoc {
  secretGrailTurn: 10 | 11 | 12;
  gmPrivateNote?: string;
}

export interface WheelBroadcast {
  id: string;
  wheelType: 'servant_draft' | 'map_event' | 'personal_event';
  isSpinning: boolean;
  poolIds: string[];
  resultId: string | null;
  resultLabel: string | null;
  resultClass?: string | null;
  resultDescription?: string | null;
  targetTeam?: TeamId | null;
}

export interface GrailBannerBroadcast {
  id: string;
  servantName?: string;
  absorbedCount: number; // 0 to 5
  isManifestation: boolean;
  message: string;
  timestamp: number;
}

export interface DiceBroadcast {
  id: string;
  rollerRole: Role;
  sides: number;
  result: number;
  label: string;
  timestamp: number;
}

export interface FogConfig {
  enabled: boolean;
  revealBaseZoneToOwnerOnly: boolean;
  showCentralToAll: boolean;
  hideUnitsInForest: boolean;
}

export interface GameLogEntry {
  id: string;
  turn: number;
  timestamp: number;
  actor: Role | 'system';
  message: string;
}

export interface RoomParticipant {
  uid: string;
  name: string;
  joinedAt: number;
}

export interface ChatMessage {
  id: string;
  senderUid: string;
  senderName: string;
  senderRole: Role | 'spectator';
  text: string;
  timestamp: number;
}

export interface RoomChatDoc {
  messages: ChatMessage[];
  updatedAt: number;
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
  participants: Record<string, RoomParticipant>;
  gameStarted?: boolean;
  draftPoolRemaining: string[];
  teams: {
    team_a: TeamState;
    team_b: TeamState;
  };
  units: Record<string, BoardUnit>;
  tileOverrides: Record<string, TileOverride>;
  fogConfig: FogConfig;
  trueNameConcealment: boolean;
  activeMapEvent: { id: string; title: string; description: string } | null;
  wheelBroadcast: WheelBroadcast | null;
  diceBroadcast: DiceBroadcast | null;
  grailAbsorbedCount: number; // Total defeated servants across both teams (5 = manifest)
  grailAbsorbedNames: string[];
  grailManifested: boolean;
  grailBannerBroadcast: GrailBannerBroadcast | null;
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

export interface TerrainDefinition {
  id: TerrainId;
  label: string;
  moveCost: number;
  sameTerrainMoveCost?: number;
  combatNote: string;
  stealth: boolean;
  highGround: boolean;
  bgColor: string;
  icon: string;
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
  | 'grail_site'
  | 'summoning_altar'
  | 'teleporter'
  | 'watchtower'
  | 'workshop'
  | 'blood_altar';

export interface SpecialTile {
  x: number;
  y: number;
  type: SpecialTileType;
  label: string;
  manaBonus?: number;
  monsterId?: string;
  tier?: number;
  targetZone?: ZoneId;
  targetX?: number;
  targetY?: number;
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
  terrainGrid: TerrainId[][]; // 7 rows x 10 cols
  specialTiles: SpecialTile[];
}

export interface MapData {
  cols: number;
  rows: number;
  gates: GateDefinition[];
  zones: Record<ZoneId, ZoneDefinition>;
}
