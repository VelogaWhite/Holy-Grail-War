import { create } from 'zustand';
import {
  EVENTS,
  ITEMS,
  ITEMS_BY_ID,
  MAP_DATA,
  MONSTERS_BY_ID,
  SERVANTS,
  SERVANTS_BY_ID,
} from '../data';
import {
  assignParticipantSeat,
  broadcastDiceRoll,
  clearAllSecretOrders,
  kickParticipant,
  leaveRoomLobby,
  resetRoomSeat,
  sendChatMessage,
  startGame,
  submitMasterSecretOrders,
  swapMasterSeats,
  syncRoomStateToFirestore,
  unlockMasterSecretOrders,
  updateRulerSecretDoc,
} from '../services/roomService';
import type {
  BoardUnit,
  ChatMessage,
  CommandActionType,
  CommandOrder,
  Coordinates,
  DeploymentPlacement,
  DiceBroadcast,
  GrailBannerBroadcast,
  OwnerId,
  Role,
  RoomChatDoc,
  RoomState,
  RulerSecretDoc,
  SecretCommandsDoc,
  TeamId,
  TurnPhase,
  WheelBroadcast,
  ZoneId,
} from '../types/game';
import { formatCoordLabel, getTileKey } from '../utils/assetHelper';

const MAX_UNDO_HISTORY = 15;
export const LAST_SESSION_STORAGE_KEY = 'hgw_last_session';

export interface SavedLobbySession {
  roomId: string;
  nickname: string;
}

export function saveLastSession(session: SavedLobbySession): void {
  try {
    localStorage.setItem(LAST_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage errors (e.g., private browsing quota)
  }
}

export function loadLastSession(): SavedLobbySession | null {
  try {
    const raw = localStorage.getItem(LAST_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedLobbySession>;
    if (typeof parsed.roomId === 'string' && parsed.roomId.trim()) {
      return {
        roomId: parsed.roomId.trim().toUpperCase(),
        nickname: typeof parsed.nickname === 'string' ? parsed.nickname : '',
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function clearLastSession(): void {
  try {
    localStorage.removeItem(LAST_SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function getParticipantRole(
  seats: RoomState['seats'],
  uid: string | null
): Role | 'spectator' {
  if (!uid) return 'spectator';
  if (seats.rulerUid === uid) return 'ruler';
  if (seats.masterAUid === uid) return 'master_a';
  if (seats.masterBUid === uid) return 'master_b';
  return 'spectator';
}

export function isRoomGameStarted(room: RoomState): boolean {
  return room.gameStarted ?? true;
}

export type SessionMode = 'lobby' | 'online' | 'sandbox';

function cloneRoomState(state: RoomState): RoomState {
  return JSON.parse(JSON.stringify(state)) as RoomState;
}

function appendLog(
  state: RoomState,
  actor: Role | 'system',
  message: string
): RoomState['logs'] {
  const next = [
    {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      turn: state.turn,
      timestamp: Date.now(),
      actor,
      message,
    },
    ...state.logs,
  ];
  return next.slice(0, 50);
}

function createServantUnit(
  id: string,
  templateId: string,
  owner: OwnerId,
  status: 'active' | 'reserve' | 'defeated',
  position: Coordinates | null,
  overrides?: Partial<BoardUnit>
): BoardUnit {
  const tpl = SERVANTS_BY_ID[templateId];
  return {
    id,
    templateId,
    unitType: 'servant',
    name: tpl.name,
    servantClass: tpl.servantClass,
    subClass: tpl.subClass,
    owner,
    status,
    position,
    hp: tpl.hp,
    maxHp: tpl.hp,
    atk: tpl.atk,
    mov: tpl.mov,
    range: tpl.range,
    npReady: false,
    skillCooldown: 0,
    tags: [],
    isRevealedToEnemy: false,
    isTrueNameRevealed: true,
    image: tpl.image,
    ...overrides,
  };
}

function createMonsterUnit(
  id: string,
  templateId: string,
  position: Coordinates,
  overrides?: Partial<BoardUnit>
): BoardUnit {
  const tpl = MONSTERS_BY_ID[templateId];
  return {
    id,
    templateId,
    unitType: 'monster',
    name: tpl.name,
    owner: 'neutral',
    status: 'active',
    position,
    hp: tpl.hp,
    maxHp: tpl.hp,
    atk: tpl.atk,
    mov: tpl.mov,
    range: tpl.range,
    npReady: false,
    skillCooldown: 0,
    tags: [`Tier ${tpl.tier}`],
    isRevealedToEnemy: true,
    isTrueNameRevealed: true,
    image: tpl.image,
    ...overrides,
  };
}

export function randomSecretGrailTurn(): 10 | 11 | 12 {
  const choices: (10 | 11 | 12)[] = [10, 11, 12];
  return choices[Math.floor(Math.random() * choices.length)];
}

function findOpenTileInZone(
  units: Record<string, BoardUnit>,
  zone: ZoneId
): Coordinates {
  const occupied = new Set<string>();
  for (const u of Object.values(units)) {
    if (u.status === 'active' && u.position?.zone === zone) {
      occupied.add(`${u.position.x}_${u.position.y}`);
    }
  }
  const preferredY = [3, 1, 5, 2, 4, 0, 6];
  const preferredX =
    zone === 'base_a'
      ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
      : zone === 'base_b'
        ? [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
        : [4, 5, 3, 6, 2, 7, 1, 8, 0, 9];

  for (const y of preferredY) {
    for (const x of preferredX) {
      if (!occupied.has(`${x}_${y}`)) {
        return { zone, x, y };
      }
    }
  }
  return { zone, x: 0, y: 0 };
}

export function createDemoRoomState(
  teamAName = 'Team A (Mount Enzo)',
  teamBName = 'Team B (Shinto City)',
  trueNameConcealment = false
): RoomState {
  const teamAServants = [
    'artoria',
    'melusine',
    'merlin',
    'gilgamesh',
    'cu_chulainn',
    'king_hassan',
  ];
  const teamBServants = [
    'jeanne_darc_alter',
    'morgan',
    'achilles',
    'emiya',
    'heracles',
    'bb',
  ];
  const drafted = new Set([...teamAServants, ...teamBServants]);

  const unitsList: BoardUnit[] = [
    createServantUnit('unit_a_1', 'artoria', 'team_a', 'active', { zone: 'central', x: 3, y: 3 }, {
      hp: 12,
      npReady: true,
      tags: ['ATK+1'],
    }),
    createServantUnit('unit_a_2', 'melusine', 'team_a', 'active', { zone: 'central', x: 4, y: 1 }, {
      hp: 13,
      tags: ['Invincible'],
    }),
    createServantUnit('unit_a_3', 'merlin', 'team_a', 'active', { zone: 'base_a', x: 3, y: 0 }, {
      hp: 12,
      tags: ['Leyline'],
    }),
    createServantUnit('unit_a_4', 'gilgamesh', 'team_a', 'reserve', null),
    createServantUnit('unit_a_5', 'cu_chulainn', 'team_a', 'reserve', null),
    createServantUnit('unit_a_6', 'king_hassan', 'team_a', 'reserve', null),

    createServantUnit('unit_b_1', 'jeanne_darc_alter', 'team_b', 'active', { zone: 'central', x: 6, y: 3 }, {
      hp: 10,
      npReady: true,
      tags: ['ATK+2', 'Guard'],
    }),
    createServantUnit('unit_b_2', 'morgan', 'team_b', 'active', { zone: 'central', x: 6, y: 6 }, {
      hp: 13,
      isRevealedToEnemy: true,
    }),
    createServantUnit('unit_b_3', 'achilles', 'team_b', 'active', { zone: 'base_b', x: 5, y: 1 }, {
      hp: 14,
      tags: ['Invincible 2x'],
    }),
    createServantUnit('unit_b_4', 'emiya', 'team_b', 'reserve', null),
    createServantUnit('unit_b_5', 'heracles', 'team_b', 'reserve', null),
    createServantUnit('unit_b_6', 'bb', 'team_b', 'reserve', null),

    createMonsterUnit('mon_skel_a', 'skeleton', { zone: 'base_a', x: 6, y: 2 }),
    createMonsterUnit('mon_wyvern_c', 'wyvern', { zone: 'central', x: 2, y: 2 }, { hp: 5 }),
    createMonsterUnit('mon_chimera_c', 'chimera', { zone: 'central', x: 7, y: 4 }),
    createMonsterUnit('mon_fafnir_c', 'fafnir', { zone: 'central', x: 4, y: 0 }),
    createMonsterUnit('mon_homunc_b', 'homunculus', { zone: 'base_b', x: 3, y: 4 }),
  ];

  const units: Record<string, BoardUnit> = {};
  for (const u of unitsList) {
    units[u.id] =
      u.unitType === 'servant'
        ? { ...u, isTrueNameRevealed: !trueNameConcealment }
        : u;
  }

  return {
    roomId: 'FGO-482',
    createdAt: Date.now(),
    turn: 4,
    phase: 'planning',
    seats: {
      rulerUid: 'local-ruler',
      masterAUid: 'local-master-a',
      masterBUid: 'local-master-b',
    },
    participants: {
      'local-ruler': { uid: 'local-ruler', name: 'Ruler', joinedAt: Date.now() },
      'local-master-a': { uid: 'local-master-a', name: 'Master A', joinedAt: Date.now() },
      'local-master-b': { uid: 'local-master-b', name: 'Master B', joinedAt: Date.now() },
    },
    gameStarted: true,
    draftPoolRemaining: SERVANTS.filter((s) => !drafted.has(s.id)).map((s) => s.id),
    teams: {
      team_a: {
        name: teamAName,
        mana: 7,
        qp: 5,
        commandSpells: 3,
        inventory: ['dragon_vein_crystal', 'golden_apple'],
        defeatedCount: 1,
        readyLocked: false,
      },
      team_b: {
        name: teamBName,
        mana: 6,
        qp: 4,
        commandSpells: 2,
        inventory: ['black_keys', 'saint_quartz'],
        defeatedCount: 1,
        readyLocked: false,
      },
    },
    units,
    tileOverrides: {
      base_a_4_1: {
        tileKey: 'base_a_4_1',
        cleared: true,
      },
      central_4_3: {
        tileKey: 'central_4_3',
        cleared: false,
        customNote: 'Grail Sanctuary — วิญญาณครบ 5/5 หรือเทิร์นลับ 10–12',
      },
    },
    fogConfig: {
      enabled: true,
      revealBaseZoneToOwnerOnly: true,
      showCentralToAll: true,
      hideUnitsInForest: true,
    },
    trueNameConcealment,
    activeMapEvent: {
      id: 'haste_wind',
      title: 'Haste Wind (สายลมเร่งความเร็ว)',
      description: 'Servant ทุกตนบนกระดานได้รับระยะเดิน +1 MOV ในเทิร์นนี้',
    },
    wheelBroadcast: null,
    diceBroadcast: null,
    grailAbsorbedCount: 2,
    grailAbsorbedNames: ['Sasaki Kojiro', 'Spartacus'],
    grailManifested: false,
    grailBannerBroadcast: null,
    logs: [
      {
        id: 'log-1',
        turn: 4,
        timestamp: Date.now() - 60000,
        actor: 'ruler',
        message: 'เริ่มเทิร์น 4 — Map Event: Haste Wind (+1 MOV ทุกตัว)',
      },
    ],
  };
}

export function createFreshDraftRoomState(
  teamAName = 'Team A (Mount Enzo)',
  teamBName = 'Team B (Shinto City)',
  trueNameConcealment = false
): RoomState {
  const unitsList: BoardUnit[] = [
    createMonsterUnit('mon_skel_a', 'skeleton', { zone: 'base_a', x: 6, y: 2 }),
    createMonsterUnit('mon_homunc_a', 'homunculus', { zone: 'base_a', x: 6, y: 4 }),
    createMonsterUnit('mon_wyvern_c', 'wyvern', { zone: 'central', x: 2, y: 2 }),
    createMonsterUnit('mon_chimera_c', 'chimera', { zone: 'central', x: 7, y: 4 }),
    createMonsterUnit('mon_fafnir_c', 'fafnir', { zone: 'central', x: 4, y: 0 }),
    createMonsterUnit('mon_skel_b', 'skeleton', { zone: 'base_b', x: 3, y: 2 }),
    createMonsterUnit('mon_homunc_b', 'homunculus', { zone: 'base_b', x: 3, y: 4 }),
  ];

  const units: Record<string, BoardUnit> = {};
  for (const u of unitsList) {
    units[u.id] =
      u.unitType === 'servant'
        ? { ...u, isTrueNameRevealed: !trueNameConcealment }
        : u;
  }

  return {
    roomId: 'FGO-000',
    createdAt: Date.now(),
    turn: 1,
    phase: 'draft',
    seats: {
      rulerUid: null,
      masterAUid: null,
      masterBUid: null,
    },
    participants: {},
    gameStarted: false,
    draftPoolRemaining: SERVANTS.map((s) => s.id),
    teams: {
      team_a: {
        name: teamAName,
        mana: 4,
        qp: 2,
        commandSpells: 3,
        inventory: [],
        defeatedCount: 0,
        readyLocked: false,
      },
      team_b: {
        name: teamBName,
        mana: 4,
        qp: 2,
        commandSpells: 3,
        inventory: [],
        defeatedCount: 0,
        readyLocked: false,
      },
    },
    units,
    tileOverrides: {},
    fogConfig: {
      enabled: true,
      revealBaseZoneToOwnerOnly: true,
      showCentralToAll: true,
      hideUnitsInForest: true,
    },
    trueNameConcealment,
    activeMapEvent: null,
    wheelBroadcast: null,
    diceBroadcast: null,
    grailAbsorbedCount: 0,
    grailAbsorbedNames: [],
    grailManifested: false,
    grailBannerBroadcast: null,
    logs: [
      {
        id: 'log-init',
        turn: 1,
        timestamp: Date.now(),
        actor: 'system',
        message: 'สร้างห้องสงครามจอกศักดิ์สิทธิ์ใหม่เรียบร้อย — เข้าสู่เฟส Draft',
      },
    ],
  };
}

export interface TilePopoverState {
  coords: Coordinates;
  clientX: number;
  clientY: number;
}

export interface RadialMenuState {
  unitId: string;
  anchorX: number;
  anchorY: number;
}

export interface PendingPickupToast {
  id: string;
  tileKey: string;
  coords: Coordinates;
  itemId: string;
  unitId: string;
  unitName: string;
  teamId: TeamId;
}

export interface EndTurnTileReward {
  unitId: string;
  unitName: string;
  teamId: TeamId;
  tileType: 'leyline' | 'safe_house';
  tileLabel: string;
  amount: number;
  detail: string;
}

export function scanEndTurnTileRewards(roomState: RoomState): EndTurnTileReward[] {
  const rewards: EndTurnTileReward[] = [];
  for (const unit of Object.values(roomState.units)) {
    if (
      unit.unitType !== 'servant' ||
      unit.status !== 'active' ||
      !unit.position ||
      (unit.owner !== 'team_a' && unit.owner !== 'team_b')
    ) {
      continue;
    }
    const zoneDef = MAP_DATA.zones[unit.position.zone];
    if (!zoneDef) continue;
    const special = zoneDef.specialTiles.find(
      (t) => t.x === unit.position!.x && t.y === unit.position!.y
    );
    if (!special) continue;

    if (special.type === 'leyline') {
      const amount = special.manaBonus ?? 2;
      rewards.push({
        unitId: unit.id,
        unitName: unit.name,
        teamId: unit.owner,
        tileType: 'leyline',
        tileLabel: special.label,
        amount,
        detail: `+${amount} Mana`,
      });
    } else if (special.type === 'safe_house') {
      const healAmount = Math.min(2, Math.max(0, unit.maxHp - unit.hp));
      rewards.push({
        unitId: unit.id,
        unitName: unit.name,
        teamId: unit.owner,
        tileType: 'safe_house',
        tileLabel: special.label,
        amount: healAmount,
        detail: healAmount > 0 ? `+${healAmount} HP` : 'HP เต็มแล้ว',
      });
    }
  }
  return rewards;
}

function handleServantDefeatedEffects(draft: RoomState, unit: BoardUnit) {
  unit.isTrueNameRevealed = true;
  const nextCount = Math.min(5, draft.grailAbsorbedCount + 1);
  draft.grailAbsorbedCount = nextCount;
  if (!draft.grailAbsorbedNames.includes(unit.name)) {
    draft.grailAbsorbedNames.push(unit.name);
  }

  if (unit.owner === 'team_a') {
    draft.teams.team_b.defeatedCount = Math.min(6, draft.teams.team_b.defeatedCount + 1);
  } else if (unit.owner === 'team_b') {
    draft.teams.team_a.defeatedCount = Math.min(6, draft.teams.team_a.defeatedCount + 1);
  }

  const manifestedNow = nextCount >= 5 && !draft.grailManifested;
  if (manifestedNow) {
    draft.grailManifested = true;
  }

  const banner: GrailBannerBroadcast = manifestedNow
    ? {
        id: `grail-${Date.now()}`,
        servantName: unit.name,
        absorbedCount: nextCount,
        isManifestation: true,
        message: `วิญญาณวีรชน ${unit.name} เติมเต็มภาชนะครบ 5/5 — Greater Grail จุติลง ณ ใจกลางฟุยุกิแล้ว!`,
        timestamp: Date.now(),
      }
    : {
        id: `grail-${Date.now()}`,
        servantName: unit.name,
        absorbedCount: nextCount,
        isManifestation: false,
        message: `วิญญาณวีรชน ${unit.name} ถูกจอกศักดิ์สิทธิ์กลืนกินแล้ว... (${nextCount} / 5)`,
        timestamp: Date.now(),
      };

  draft.grailBannerBroadcast = banner;
  draft.logs = appendLog(draft, 'system', banner.message);
}

interface GameStoreState {
  // Session / Online Sync State
  sessionMode: SessionMode;
  authUid: string | null;
  activeRoomId: string | null;
  previewRole: Role; // Active role (in online mode = real claimed seat; in sandbox = switchable)

  // Game Data
  roomState: RoomState;
  rulerSecret: RulerSecretDoc;
  masterAOrders: SecretCommandsDoc | null;
  masterBOrders: SecretCommandsDoc | null;
  historyStack: RoomState[];

  // Master Local Secret Command Drafts
  draftOrders: Record<string, CommandOrder>;
  pickingOrderForUnitId: string | null;
  radialMenu: RadialMenuState | null;

  // Chat State (dedicated rooms/{roomId}/chat/public listener — isolated from RoomState)
  chatMessages: ChatMessage[];
  hasLoadedInitialChat: boolean;
  unreadChatCount: number;
  logsDrawerTab: 'logs' | 'chat';
  kickedNotice: string | null;

  // Board / UI State
  activeZone: ZoneId;
  selectedUnitId: string | null;
  hoveredTile: Coordinates | null;
  lockedTile: Coordinates | null;
  tilePopover: TilePopoverState | null;
  pendingSpawnMonsterId: string | null;
  freeDragEnabled: boolean;
  showMoveHelper: boolean;
  showCommandArrows: boolean;
  checkedOrderIds: Record<string, boolean>;
  isCatalogOpen: boolean;
  isWheelOpen: boolean;
  isDiceOpen: boolean;
  isLogsOpen: boolean;
  isCombatHelperOpen: boolean;
  combatPreselectedAttackerId: string | null;
  pendingPickupToast: PendingPickupToast | null;

  // Session Lifecycle Actions
  setAuthUid: (uid: string | null) => void;
  enterOnlineRoom: (
    roomId: string,
    role: Role | 'spectator',
    initialRoom?: RoomState,
    nickname?: string
  ) => void;
  enterLocalSandbox: () => void;
  leaveRoom: () => void;
  leaveRoomAndCleanup: () => Promise<void>;
  clearKickedNotice: () => void;

  // Waiting Lobby & Ruler Seat Management
  assignSeat: (targetUid: string, role: 'master_a' | 'master_b' | null) => Promise<void>;
  swapMasterSeatsAction: () => Promise<void>;
  kickParticipantAction: (targetUid: string) => Promise<void>;
  startGameAction: () => Promise<void>;

  // Remote Sync Receivers (Pure local setters — NEVER trigger writes!)
  applyRemoteRoomState: (room: RoomState) => void;
  applyRemoteSecretOrders: (
    masterKey: 'master_a' | 'master_b',
    docData: SecretCommandsDoc
  ) => void;
  applyRemoteRulerSecret: (docData: RulerSecretDoc) => void;
  applyRemoteChatDoc: (docData: RoomChatDoc) => void;

  // Chat Actions
  sendRoomChatMessage: (text: string) => Promise<void>;
  setLogsDrawerTab: (tab: 'logs' | 'chat') => void;
  markChatAsRead: () => void;

  // Navigation & UI Selection
  setActiveZone: (zone: ZoneId) => void;
  selectUnit: (unitId: string | null) => void;
  locateUnit: (unitId: string) => void;
  setHoveredTile: (coords: Coordinates | null) => void;
  toggleLockTile: (coords: Coordinates) => void;
  clearLockedTile: () => void;
  setTilePopover: (popover: TilePopoverState | null) => void;
  setPendingSpawnMonsterId: (monsterId: string | null) => void;
  setFreeDragEnabled: (enabled: boolean) => void;
  setShowMoveHelper: (enabled: boolean) => void;
  setShowCommandArrows: (enabled: boolean) => void;
  toggleCheckedOrder: (key: string) => void;
  setCatalogOpen: (open: boolean) => void;
  setWheelOpen: (open: boolean) => void;
  setDiceOpen: (open: boolean) => void;
  setLogsOpen: (open: boolean) => void;
  setCombatHelperOpen: (open: boolean, attackerUnitId?: string | null) => void;
  dismissPickupToast: () => void;
  setPreviewRole: (role: Role) => void;

  // Phase 4: Shared Wheels & 1d6 Dice
  spinWheel: (
    wheelType: WheelBroadcast['wheelType'],
    targetTeam?: TeamId | null
  ) => void;
  assignDraftedServant: (servantId: string, teamId: TeamId) => void;
  spawnStrayBossFromWheel: (servantId: string) => void;
  applyMapEventFromWheel: (eventId: string) => void;
  recordPersonalEventLog: (title: string, description: string) => void;
  rollDice1d6: (label: string) => Promise<void>;

  // Feature (A): Secret Deployment & Reinforcements
  submitMasterDeployment: (placements: DeploymentPlacement[]) => Promise<void>;
  deployAllAndStartTurn1: () => Promise<void>;
  requestMasterReinforcement: (unitId: string, position: Coordinates) => Promise<void>;
  approveReinforcement: (masterKey: 'master_a' | 'master_b') => Promise<void>;
  dismissReinforcement: (masterKey: 'master_a' | 'master_b') => Promise<void>;

  // Feature (B): True Name Concealment
  toggleTrueNameConcealment: () => void;
  toggleUnitTrueNameRevealed: (unitId: string) => void;

  // Master Secret Command Queue & Radial Wheel Actions (Pure Local Client State)
  setDraftOrder: (
    unitId: string,
    patch: Partial<CommandOrder> & { actionType?: CommandActionType }
  ) => void;
  updateDraftOrder: (
    unitId: string,
    patch: Partial<CommandOrder> & { actionType?: CommandActionType }
  ) => void;
  setActiveOrderUnit: (unitId: string | null) => void;
  startTargetPicking: (unitId: string, mode: 'move' | 'attack' | 'np') => void;
  openRadialMenu: (unitId: string, anchorX: number, anchorY: number) => void;
  closeRadialMenu: () => void;
  clearDraftOrderTarget: (unitId: string) => void;
  setPickingOrderForUnitId: (unitId: string | null) => void;
  applyPickedTarget: (
    targetPosition: Coordinates,
    targetUnitId?: string,
    estimatedMoveCost?: number | null
  ) => void;
  lockMasterTurn: () => Promise<void>;

  // Ruler God-Mode Actions (sync to Firestore once per explicit user action)
  undo: () => void;
  setPhase: (phase: TurnPhase) => void;
  endTurnAndNext: (skipManaUpkeep?: boolean, grantSpecialTileRewards?: boolean) => void;
  applySkillOrder: (
    unitId: string,
    teamId: TeamId,
    skillName: string,
    skillCost: number
  ) => void;
  applyMoveOrder: (unitId: string, target: Coordinates) => void;
  applyNpOrder: (
    unitId: string,
    teamId: TeamId,
    npName: string,
    npCost: number
  ) => void;
  applyGuardOrder: (unitId: string) => void;
  applyUseItemOrder: (teamId: TeamId, itemId: string, unitName?: string) => void;
  applyCombatDamage: (
    targetUnitId: string,
    damage: number,
    attackerName: string,
    isCounterAttack?: boolean
  ) => void;
  applyRetreatMove: (
    unitId: string,
    target: Coordinates,
    attackerName: string
  ) => void;
  grantServantKillBounty: (killerTeamId: TeamId, victimName: string) => void;
  grantMonsterReward: (
    killerTeamId: TeamId,
    monsterTemplateId: string,
    killerUnitId?: string,
    tier1Choice?: 'mana' | 'qp'
  ) => void;
  setSecretGrailTurn: (turn: 10 | 11 | 12) => void;
  toggleFogOfWar: () => void;
  toggleGrailManifested: () => void;
  unlockMasterOrders: (masterKey: 'master_a' | 'master_b') => Promise<void>;
  resetSeat: (masterKey: 'master_a' | 'master_b') => Promise<void>;

  moveUnit: (unitId: string, target: Coordinates) => void;
  updateUnit: (unitId: string, patch: Partial<BoardUnit>) => void;
  removeUnit: (unitId: string) => void;
  teleportUnitToZone: (unitId: string, zone: ZoneId) => void;
  addUnitTag: (unitId: string, tag: string) => void;
  removeUnitTag: (unitId: string, tag: string) => void;

  adjustTeamResource: (
    teamId: TeamId,
    field: 'mana' | 'qp' | 'commandSpells' | 'defeatedCount',
    delta: number
  ) => void;
  giveTeamItem: (teamId: TeamId, itemId: string) => void;
  removeTeamItem: (teamId: TeamId, index: number) => void;

  spawnMonster: (monsterId: string, coords: Coordinates) => void;
  spawnGreaterGrail: () => void;
  toggleTileCleared: (coords: Coordinates) => void;
  setTileCustomNote: (coords: Coordinates, note: string) => void;
  dropItemOnTile: (coords: Coordinates, itemId: string, isMysteryDrop?: boolean) => void;
  dropRandomItemOnTile: (
    coords: Coordinates,
    rarity: 'common' | 'rare',
    isMysteryDrop?: boolean
  ) => void;
  pickupItemFromTile: (coords: Coordinates, teamId: TeamId) => void;
  removeItemFromTile: (coords: Coordinates) => void;
  resetAllClearedTiles: () => void;

  triggerSampleGrailBanner: (manifest?: boolean) => void;
  dismissGrailBanner: () => void;
}

export const useGameStore = create<GameStoreState>((set, get) => {
  const pushToFirestoreIfOnline = (nextState: RoomState) => {
    const { sessionMode, activeRoomId, previewRole } = get();
    if (sessionMode === 'online' && activeRoomId && previewRole === 'ruler') {
      syncRoomStateToFirestore(activeRoomId, nextState).catch((err) => {
        console.error('Failed to sync RoomState:', err);
      });
    }
  };

  const commitRoomMutation = (mutator: (draft: RoomState) => void) => {
    const current = get().roomState;
    const snapshot = cloneRoomState(current);
    const next = cloneRoomState(current);
    mutator(next);
    const nextHistory = [...get().historyStack, snapshot].slice(-MAX_UNDO_HISTORY);
    set({ roomState: next, historyStack: nextHistory });
    pushToFirestoreIfOnline(next);
  };

  return {
    sessionMode: 'lobby',
    authUid: null,
    activeRoomId: null,
    previewRole: 'ruler',

    roomState: createDemoRoomState(),
    rulerSecret: {
      secretGrailTurn: randomSecretGrailTurn(),
    },
    masterAOrders: null,
    masterBOrders: null,
    historyStack: [],

    draftOrders: {},
    pickingOrderForUnitId: null,
    radialMenu: null,

    chatMessages: [],
    hasLoadedInitialChat: false,
    unreadChatCount: 0,
    logsDrawerTab: 'logs',
    kickedNotice: null,

    activeZone: 'central',
    selectedUnitId: 'unit_a_1',
    hoveredTile: null,
    lockedTile: null,
    tilePopover: null,
    pendingSpawnMonsterId: null,
    freeDragEnabled: true,
    showMoveHelper: true,
    showCommandArrows: true,
    checkedOrderIds: {},
    isCatalogOpen: false,
    isWheelOpen: false,
    isDiceOpen: false,
    isLogsOpen: false,
    isCombatHelperOpen: false,
    combatPreselectedAttackerId: null,
    pendingPickupToast: null,

    setAuthUid: (uid) => set({ authUid: uid }),

    enterOnlineRoom: (roomId, role, initialRoom, nickname) => {
      if (nickname !== undefined) {
        saveLastSession({ roomId, nickname });
      }
      const resolvedPreviewRole: Role = role === 'spectator' ? 'master_a' : role;
      set((state) => ({
        sessionMode: 'online',
        activeRoomId: roomId,
        previewRole: resolvedPreviewRole,
        roomState: initialRoom
          ? { ...initialRoom, participants: initialRoom.participants ?? {} }
          : state.roomState,
        activeZone:
          role === 'master_a' ? 'base_a' : role === 'master_b' ? 'base_b' : 'central',
        historyStack: [],
        masterAOrders: null,
        masterBOrders: null,
        draftOrders: {},
        pickingOrderForUnitId: null,
        radialMenu: null,
        checkedOrderIds: {},
        chatMessages: [],
        hasLoadedInitialChat: false,
        unreadChatCount: 0,
        logsDrawerTab: 'logs',
        kickedNotice: null,
      }));
    },

    enterLocalSandbox: () =>
      set({
        sessionMode: 'sandbox',
        activeRoomId: null,
        previewRole: 'ruler',
        roomState: createDemoRoomState(),
        rulerSecret: { secretGrailTurn: randomSecretGrailTurn() },
        activeZone: 'central',
        selectedUnitId: 'unit_a_1',
        historyStack: [],
        masterAOrders: null,
        masterBOrders: null,
        draftOrders: {},
        pickingOrderForUnitId: null,
        radialMenu: null,
        checkedOrderIds: {},
        chatMessages: [],
        hasLoadedInitialChat: true,
        unreadChatCount: 0,
        logsDrawerTab: 'logs',
        kickedNotice: null,
      }),

    leaveRoom: () => {
      clearLastSession();
      set({
        sessionMode: 'lobby',
        activeRoomId: null,
        masterAOrders: null,
        masterBOrders: null,
        draftOrders: {},
        pickingOrderForUnitId: null,
        radialMenu: null,
        tilePopover: null,
        pendingSpawnMonsterId: null,
        historyStack: [],
        chatMessages: [],
        hasLoadedInitialChat: false,
        unreadChatCount: 0,
        isLogsOpen: false,
        logsDrawerTab: 'logs',
      });
    },

    leaveRoomAndCleanup: async () => {
      const { sessionMode, activeRoomId, authUid } = get();
      if (sessionMode === 'online' && activeRoomId && authUid) {
        try {
          await leaveRoomLobby(activeRoomId, authUid);
        } catch (err) {
          console.error('Failed to leave room lobby:', err);
        }
      }
      get().leaveRoom();
    },

    clearKickedNotice: () => set({ kickedNotice: null }),

    assignSeat: async (targetUid, role) => {
      const { sessionMode, activeRoomId, roomState } = get();
      if (sessionMode === 'online' && activeRoomId) {
        await assignParticipantSeat(activeRoomId, targetUid, role);
      } else {
        if (targetUid === roomState.seats.rulerUid) return;
        commitRoomMutation((draft) => {
          if (draft.seats.masterAUid === targetUid) draft.seats.masterAUid = null;
          if (draft.seats.masterBUid === targetUid) draft.seats.masterBUid = null;
          if (role === 'master_a') draft.seats.masterAUid = targetUid;
          else if (role === 'master_b') draft.seats.masterBUid = targetUid;
        });
      }
    },

    swapMasterSeatsAction: async () => {
      const { sessionMode, activeRoomId } = get();
      if (sessionMode === 'online' && activeRoomId) {
        await swapMasterSeats(activeRoomId);
      } else {
        commitRoomMutation((draft) => {
          const prevA = draft.seats.masterAUid;
          draft.seats.masterAUid = draft.seats.masterBUid;
          draft.seats.masterBUid = prevA;
          draft.logs = appendLog(
            draft,
            'ruler',
            'Ruler สลับฝั่งผู้เล่น (Master A ↔ Master B)'
          );
        });
      }
    },

    kickParticipantAction: async (targetUid) => {
      const { sessionMode, activeRoomId, roomState } = get();
      if (targetUid === roomState.seats.rulerUid) return;
      if (sessionMode === 'online' && activeRoomId) {
        await kickParticipant(activeRoomId, targetUid);
      } else {
        commitRoomMutation((draft) => {
          delete draft.participants[targetUid];
          if (draft.seats.masterAUid === targetUid) draft.seats.masterAUid = null;
          if (draft.seats.masterBUid === targetUid) draft.seats.masterBUid = null;
        });
      }
    },

    startGameAction: async () => {
      const { sessionMode, activeRoomId } = get();
      if (sessionMode === 'online' && activeRoomId) {
        await startGame(activeRoomId);
      } else {
        commitRoomMutation((draft) => {
          draft.gameStarted = true;
        });
      }
    },

    applyRemoteRoomState: (room) =>
      set((state) => {
        const normalizedRoom: RoomState = {
          ...room,
          participants: room.participants ?? {},
        };

        // Detect if current online user was kicked by Ruler (never writes to Firestore)
        if (state.sessionMode === 'online' && state.authUid) {
          const inParticipants = Boolean(normalizedRoom.participants[state.authUid]);
          const inSeats =
            normalizedRoom.seats.rulerUid === state.authUid ||
            normalizedRoom.seats.masterAUid === state.authUid ||
            normalizedRoom.seats.masterBUid === state.authUid;

          if (!inParticipants && !inSeats) {
            clearLastSession();
            return {
              sessionMode: 'lobby',
              activeRoomId: null,
              masterAOrders: null,
              masterBOrders: null,
              draftOrders: {},
              pickingOrderForUnitId: null,
              tilePopover: null,
              pendingSpawnMonsterId: null,
              historyStack: [],
              chatMessages: [],
              hasLoadedInitialChat: false,
              unreadChatCount: 0,
              isLogsOpen: false,
              kickedNotice: 'คุณถูกนำออกจากห้องโดย Ruler',
            };
          }
        }

        const assignedRole =
          state.sessionMode === 'online'
            ? getParticipantRole(normalizedRoom.seats, state.authUid)
            : state.previewRole;

        const nextPreviewRole: Role =
          assignedRole === 'spectator' ? state.previewRole : assignedRole;
        const roleSwitched =
          state.sessionMode === 'online' &&
          assignedRole !== 'spectator' &&
          nextPreviewRole !== state.previewRole;

        // Clear local draft orders when turn advances or when Master seat swaps
        const turnChanged = normalizedRoom.turn !== state.roomState.turn;
        const phaseChanged = normalizedRoom.phase !== state.roomState.phase;
        return {
          roomState: normalizedRoom,
          previewRole: nextPreviewRole,
          ...(phaseChanged || turnChanged || roleSwitched
            ? { radialMenu: null }
            : {}),
          ...(roleSwitched
            ? {
                activeZone:
                  nextPreviewRole === 'master_a'
                    ? 'base_a'
                    : nextPreviewRole === 'master_b'
                      ? 'base_b'
                      : state.activeZone,
                draftOrders: {},
                pickingOrderForUnitId: null,
              }
            : {}),
          ...(turnChanged
            ? { draftOrders: {}, pickingOrderForUnitId: null, checkedOrderIds: {} }
            : {}),
        };
      }),

    applyRemoteSecretOrders: (masterKey, docData) =>
      set((state) => {
        const next: Partial<GameStoreState> =
          masterKey === 'master_a'
            ? { masterAOrders: docData }
            : { masterBOrders: docData };

        // Sync own saved orders into draftOrders when rejoining/reloading as Master
        if (state.previewRole === masterKey && docData.orders.length > 0) {
          const map: Record<string, CommandOrder> = {};
          for (const ord of docData.orders) {
            map[ord.unitId] = ord;
          }
          next.draftOrders = map;
        }
        return next;
      }),

    applyRemoteRulerSecret: (docData) => set({ rulerSecret: docData }),

    applyRemoteChatDoc: (docData) =>
      set((state) => {
        const incoming = docData.messages ?? [];
        if (!state.hasLoadedInitialChat) {
          return {
            chatMessages: incoming,
            hasLoadedInitialChat: true,
            unreadChatCount: 0,
          };
        }

        const prevIds = new Set(state.chatMessages.map((m) => m.id));
        const newFromOthers = incoming.filter(
          (m) => !prevIds.has(m.id) && m.senderUid !== state.authUid
        ).length;

        // Chat is actively visible if in Waiting Lobby or if Logs Drawer is open on Chat tab
        const myRole =
          state.sessionMode === 'online'
            ? getParticipantRole(state.roomState.seats, state.authUid)
            : state.previewRole;
        const inWaitingLobby =
          state.sessionMode === 'online' &&
          (!isRoomGameStarted(state.roomState) || myRole === 'spectator');
        const viewingChatNow =
          inWaitingLobby || (state.isLogsOpen && state.logsDrawerTab === 'chat');

        return {
          chatMessages: incoming,
          unreadChatCount: viewingChatNow
            ? 0
            : state.unreadChatCount + newFromOthers,
        };
      }),

    sendRoomChatMessage: async (rawText) => {
      const text = rawText.trim();
      if (!text) return;

      const state = get();
      const uid =
        state.sessionMode === 'online'
          ? state.authUid ?? 'unknown'
          : `local-${state.previewRole}`;
      const senderRole: Role | 'spectator' =
        state.sessionMode === 'online'
          ? getParticipantRole(state.roomState.seats, state.authUid)
          : state.previewRole;

      const participantName = state.roomState.participants?.[uid]?.name;
      const fallbackName =
        senderRole === 'ruler'
          ? 'Ruler'
          : senderRole === 'master_a'
            ? 'Master A'
            : senderRole === 'master_b'
              ? 'Master B'
              : 'Guest';

      const message: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        senderUid: uid,
        senderName: participantName || fallbackName,
        senderRole,
        text,
        timestamp: Date.now(),
      };

      if (state.sessionMode === 'online' && state.activeRoomId) {
        await sendChatMessage(state.activeRoomId, message);
      } else {
        set((s) => ({
          chatMessages: [...s.chatMessages, message].slice(-50),
        }));
      }
    },

    setLogsDrawerTab: (tab) =>
      set((s) => ({
        logsDrawerTab: tab,
        unreadChatCount: tab === 'chat' ? 0 : s.unreadChatCount,
      })),

    markChatAsRead: () => set({ unreadChatCount: 0 }),

    setActiveZone: (zone) =>
      set({ activeZone: zone, hoveredTile: null, tilePopover: null, radialMenu: null }),
    selectUnit: (unitId) => set({ selectedUnitId: unitId }),
    locateUnit: (unitId) => {
      const unit = get().roomState.units[unitId];
      if (!unit) return;
      if (unit.position) {
        set({ activeZone: unit.position.zone, selectedUnitId: unitId });
      } else {
        set({ selectedUnitId: unitId });
      }
    },
    setHoveredTile: (coords) => set({ hoveredTile: coords }),
    toggleLockTile: (coords) =>
      set((state) => {
        const prev = state.lockedTile;
        if (
          prev &&
          prev.zone === coords.zone &&
          prev.x === coords.x &&
          prev.y === coords.y
        ) {
          return { lockedTile: null };
        }
        return { lockedTile: coords };
      }),
    clearLockedTile: () => set({ lockedTile: null }),
    setTilePopover: (popover) => set({ tilePopover: popover }),
    setPendingSpawnMonsterId: (monsterId) => set({ pendingSpawnMonsterId: monsterId }),
    setFreeDragEnabled: (enabled) => set({ freeDragEnabled: enabled }),
    setShowMoveHelper: (enabled) => set({ showMoveHelper: enabled }),
    setShowCommandArrows: (enabled) => set({ showCommandArrows: enabled }),
    toggleCheckedOrder: (key) =>
      set((state) => ({
        checkedOrderIds: {
          ...state.checkedOrderIds,
          [key]: !state.checkedOrderIds[key],
        },
      })),
    setCatalogOpen: (open) => set({ isCatalogOpen: open }),
    setWheelOpen: (open) => set({ isWheelOpen: open }),
    setDiceOpen: (open) => set({ isDiceOpen: open }),
    setLogsOpen: (open) =>
      set((s) => ({
        isLogsOpen: open,
        unreadChatCount:
          open && s.logsDrawerTab === 'chat' ? 0 : s.unreadChatCount,
      })),
    setCombatHelperOpen: (open, attackerUnitId = undefined) =>
      set((s) => ({
        isCombatHelperOpen: open,
        combatPreselectedAttackerId:
          attackerUnitId !== undefined ? attackerUnitId : s.combatPreselectedAttackerId,
      })),
    dismissPickupToast: () => set({ pendingPickupToast: null }),
    setPreviewRole: (role) => {
      if (get().sessionMode === 'online') return; // Role is locked to seat in online mode
      set({
        previewRole: role,
        tilePopover: null,
        pendingSpawnMonsterId: null,
        pickingOrderForUnitId: null,
      });
    },

    // --- Master Secret Command Queue & Radial Menu (Pure Local Client State) ---
    setDraftOrder: (unitId, patch) =>
      set((state) => {
        const existing: CommandOrder = state.draftOrders[unitId] ?? {
          unitId,
          actionType: 'move',
          stance: 'defensive',
          note: '',
        };
        return {
          draftOrders: {
            ...state.draftOrders,
            [unitId]: { ...existing, ...patch, unitId },
          },
        };
      }),

    updateDraftOrder: (unitId, patch) => {
      get().setDraftOrder(unitId, patch);
    },

    setActiveOrderUnit: (unitId) => set({ selectedUnitId: unitId }),

    startTargetPicking: (unitId, mode) =>
      set((state) => {
        const existing: CommandOrder = state.draftOrders[unitId] ?? {
          unitId,
          actionType: mode,
          stance: 'defensive',
          note: '',
        };
        const unit = state.roomState.units[unitId];
        const modeChanged = existing.actionType !== mode;
        return {
          radialMenu: null,
          selectedUnitId: unitId,
          pickingOrderForUnitId: unitId,
          ...(unit?.position ? { activeZone: unit.position.zone } : {}),
          draftOrders: {
            ...state.draftOrders,
            [unitId]: {
              ...existing,
              actionType: mode,
              unitId,
              ...(modeChanged
                ? {
                    targetPosition: undefined,
                    targetUnitId: undefined,
                    estimatedMoveCost: undefined,
                  }
                : {}),
            },
          },
        };
      }),

    openRadialMenu: (unitId, anchorX, anchorY) =>
      set({
        radialMenu: { unitId, anchorX, anchorY },
        selectedUnitId: unitId,
        pickingOrderForUnitId: null,
      }),

    closeRadialMenu: () => set({ radialMenu: null }),

    clearDraftOrderTarget: (unitId) =>
      set((state) => {
        const existing = state.draftOrders[unitId];
        if (!existing) return state;
        return {
          draftOrders: {
            ...state.draftOrders,
            [unitId]: {
              ...existing,
              targetPosition: undefined,
              targetUnitId: undefined,
              estimatedMoveCost: undefined,
            },
          },
        };
      }),

    setPickingOrderForUnitId: (unitId) => set({ pickingOrderForUnitId: unitId }),

    applyPickedTarget: (targetPosition, targetUnitId, estimatedMoveCost = null) =>
      set((state) => {
        const unitId = state.pickingOrderForUnitId;
        if (!unitId) return state;
        const existing: CommandOrder = state.draftOrders[unitId] ?? {
          unitId,
          actionType: targetUnitId ? 'attack' : 'move',
          stance: 'defensive',
          note: '',
        };
        return {
          pickingOrderForUnitId: null,
          draftOrders: {
            ...state.draftOrders,
            [unitId]: {
              ...existing,
              targetPosition,
              targetUnitId,
              estimatedMoveCost,
            },
          },
        };
      }),

    lockMasterTurn: async () => {
      const state = get();
      const role = state.previewRole;
      if (role !== 'master_a' && role !== 'master_b') return;

      const teamId: TeamId = role === 'master_a' ? 'team_a' : 'team_b';
      const activeServants = Object.values(state.roomState.units).filter(
        (u) => u.unitType === 'servant' && u.owner === teamId && u.status === 'active'
      );

      const orders: CommandOrder[] = activeServants.slice(0, 3).map((u) => {
        const draft = state.draftOrders[u.id];
        return draft
          ? { ...draft, stance: draft.stance ?? 'defensive' }
          : {
              unitId: u.id,
              actionType: 'guard',
              stance: 'defensive',
              note: '',
            };
      });

      const existingSecret =
        role === 'master_a' ? state.masterAOrders : state.masterBOrders;

      const docPayload: SecretCommandsDoc = {
        ...(existingSecret ?? {}),
        turn: state.roomState.turn,
        locked: true,
        updatedAt: Date.now(),
        orders,
      };

      if (state.sessionMode === 'online' && state.activeRoomId) {
        await submitMasterSecretOrders({
          roomId: state.activeRoomId,
          masterKey: role,
          ordersDoc: docPayload,
          currentTeams: state.roomState.teams,
          setReadyLocked: true,
        });
      } else {
        // Local Sandbox simulation
        set((s) => ({
          ...(role === 'master_a'
            ? { masterAOrders: docPayload }
            : { masterBOrders: docPayload }),
          roomState: {
            ...s.roomState,
            teams: {
              ...s.roomState.teams,
              [teamId]: {
                ...s.roomState.teams[teamId],
                readyLocked: true,
              },
            },
          },
        }));
      }
      set({ pickingOrderForUnitId: null, radialMenu: null });
    },

    // --- Ruler God-Mode Actions ---
    undo: () => {
      const stack = get().historyStack;
      if (stack.length === 0) return;
      const previous = stack[stack.length - 1];
      set({
        roomState: previous,
        historyStack: stack.slice(0, -1),
        tilePopover: null,
      });
      pushToFirestoreIfOnline(previous);
    },

    setPhase: (phase) =>
      commitRoomMutation((draft) => {
        draft.phase = phase;
        draft.logs = appendLog(draft, 'ruler', `เปลี่ยนเฟสเป็น ${phase.toUpperCase()}`);
      }),

    endTurnAndNext: (skipManaUpkeep = false, grantSpecialTileRewards = false) => {
      const { rulerSecret, sessionMode, activeRoomId } = get();
      const secretTurn = rulerSecret.secretGrailTurn;
      const nextTurnNumber = get().roomState.turn + 1;

      commitRoomMutation((draft) => {
        // Optional: Grant End-of-Turn Leyline Mana & Safe House Heal before advancing turn
        if (grantSpecialTileRewards) {
          const specialRewards = scanEndTurnTileRewards(draft);
          const summaryParts: string[] = [];
          for (const rew of specialRewards) {
            if (rew.tileType === 'leyline') {
              draft.teams[rew.teamId].mana += rew.amount;
              summaryParts.push(`${rew.unitName} (${rew.tileLabel} +${rew.amount}M)`);
            } else if (rew.tileType === 'safe_house' && rew.amount > 0) {
              const u = draft.units[rew.unitId];
              if (u) {
                u.hp = Math.min(u.maxHp, u.hp + rew.amount);
                summaryParts.push(`${rew.unitName} (${rew.tileLabel} +${rew.amount} HP)`);
              }
            }
          }
          if (summaryParts.length > 0) {
            draft.logs = appendLog(
              draft,
              'ruler',
              `รางวัลช่องพิเศษจบเทิร์น ${draft.turn}: ${summaryParts.join(', ')}`
            );
          }
        }

        draft.turn += 1;
        draft.phase = 'event';
        draft.teams.team_a.readyLocked = false;
        draft.teams.team_b.readyLocked = false;
        if (!skipManaUpkeep) {
          draft.teams.team_a.mana += 2;
          draft.teams.team_b.mana += 2;
        }
        // Tick down Skill Cooldowns on all units automatically
        for (const u of Object.values(draft.units)) {
          u.skillCooldown = Math.max(0, (u.skillCooldown ?? 0) - 1);
        }
        draft.logs = appendLog(
          draft,
          'ruler',
          `เริ่มเทิร์น ${draft.turn}${skipManaUpkeep ? ' (งดแจก Mana)' : ' (+2 Mana ทั้งสองฝ่าย)'} · ลด Skill CD ทุกตัว -1`
        );

        if (!draft.grailManifested && draft.turn >= secretTurn) {
          draft.grailManifested = true;
          draft.grailBannerBroadcast = {
            id: `grail-turn-${Date.now()}`,
            absorbedCount: draft.grailAbsorbedCount,
            isManifestation: true,
            message: `ถึงเทิร์นลับแห่งโชคชะตา (Turn ${draft.turn}) — Greater Grail จุติลง ณ ใจกลางฟุยุกิแล้ว!`,
            timestamp: Date.now(),
          };
          draft.logs = appendLog(
            draft,
            'system',
            `Greater Grail จุติลงสนาม ณ ใจกลางฟุยุกิ (Turn ${draft.turn})`
          );
        }
      });

      set({
        masterAOrders: null,
        masterBOrders: null,
        draftOrders: {},
        checkedOrderIds: {},
      });

      if (sessionMode === 'online' && activeRoomId) {
        clearAllSecretOrders(activeRoomId, nextTurnNumber).catch((err) =>
          console.error('Failed to clear secret orders:', err)
        );
      }
    },

    applySkillOrder: (unitId, teamId, skillName, skillCost) =>
      commitRoomMutation((draft) => {
        const unit = draft.units[unitId];
        const team = draft.teams[teamId];
        if (!unit || !team) return;
        team.mana = Math.max(0, team.mana - skillCost);
        unit.skillCooldown = 2;
        draft.logs = appendLog(
          draft,
          'ruler',
          `ใช้สกิล ${skillName} (${unit.name}) — หัก ${skillCost} Mana, ติด Cooldown 2 เทิร์น`
        );
      }),

    applyMoveOrder: (unitId, target) => {
      get().moveUnit(unitId, target);
    },

    applyNpOrder: (unitId, teamId, npName, npCost) =>
      commitRoomMutation((draft) => {
        const unit = draft.units[unitId];
        const team = draft.teams[teamId];
        if (!unit || !team) return;
        team.mana = Math.max(0, team.mana - npCost);
        unit.npReady = false;
        draft.logs = appendLog(
          draft,
          'ruler',
          `ปลดปล่อย Noble Phantasm: ${npName} (${unit.name}) — หัก ${npCost} Mana`
        );
      }),

    applyGuardOrder: (unitId) =>
      commitRoomMutation((draft) => {
        const unit = draft.units[unitId];
        if (!unit) return;
        if (!unit.tags.includes('Guard')) {
          unit.tags.push('Guard');
        }
        draft.logs = appendLog(draft, 'ruler', `ติดป้าย [Guard] ให้ ${unit.name}`);
      }),

    applyUseItemOrder: (teamId, itemId, unitName) =>
      commitRoomMutation((draft) => {
        const team = draft.teams[teamId];
        const idx = team.inventory.indexOf(itemId);
        if (idx === -1) return;
        team.inventory.splice(idx, 1);
        const itemName = ITEMS_BY_ID[itemId]?.name ?? itemId;
        draft.logs = appendLog(
          draft,
          'ruler',
          `${team.name} ใช้ไอเทม [${itemName}]${unitName ? ` (${unitName})` : ''}`
        );
      }),

    applyCombatDamage: (targetUnitId, damage, attackerName, isCounterAttack = false) =>
      commitRoomMutation((draft) => {
        const unit = draft.units[targetUnitId];
        if (!unit) return;
        const dmg = Math.max(0, Math.floor(damage));
        const prevStatus = unit.status;
        unit.hp = Math.max(0, unit.hp - dmg);
        draft.logs = appendLog(
          draft,
          'ruler',
          isCounterAttack
            ? `⚔️ Counter-Attack (Attack Stance): ${attackerName} สวนกลับใส่ ${unit.name} สร้างความเสียหาย ${dmg} หน่วย (HP เหลือ ${unit.hp}/${unit.maxHp})`
            : `Combat: ${attackerName} โจมตี ${unit.name} สร้างความเสียหาย ${dmg} หน่วย (HP เหลือ ${unit.hp}/${unit.maxHp})`
        );

        if (unit.hp === 0 && prevStatus !== 'defeated') {
          unit.status = 'defeated';
          unit.position = null;
          if (unit.unitType === 'servant') {
            handleServantDefeatedEffects(draft, unit);
          } else {
            draft.logs = appendLog(
              draft,
              'system',
              `มอนสเตอร์ ${unit.name} ถูกกำจัดโดย ${attackerName}!`
            );
          }
        }
      }),

    applyRetreatMove: (unitId, target, attackerName) =>
      commitRoomMutation((draft) => {
        const unit = draft.units[unitId];
        if (!unit) return;
        unit.position = { ...target };
        unit.status = 'active';
        draft.logs = appendLog(
          draft,
          'ruler',
          `💨 Guard + Evade Retreat: ${unit.name} ถอยหลัง 1 ช่องจาก ${attackerName} ไปที่ ${target.zone.toUpperCase()} ${formatCoordLabel(target.x, target.y)}`
        );
      }),

    grantServantKillBounty: (killerTeamId, victimName) =>
      commitRoomMutation((draft) => {
        const team = draft.teams[killerTeamId];
        team.mana += 4;
        team.qp += 3;
        draft.logs = appendLog(
          draft,
          'ruler',
          `จ่าย Bounty สังหาร ${victimName}: ${team.name} ได้รับ +4 Mana, +3 QP`
        );
      }),

    grantMonsterReward: (killerTeamId, monsterTemplateId, killerUnitId, tier1Choice) =>
      commitRoomMutation((draft) => {
        const tpl = MONSTERS_BY_ID[monsterTemplateId];
        const team = draft.teams[killerTeamId];
        if (!tpl || !team) return;

        let manaGain = tpl.rewardMana;
        let qpGain = tpl.rewardQp;
        if (tpl.tier === 1 && tier1Choice) {
          manaGain = tier1Choice === 'mana' ? 2 : 0;
          qpGain = tier1Choice === 'qp' ? 2 : 0;
        }
        team.mana += manaGain;
        team.qp += qpGain;

        const rewardParts: string[] = [];
        if (manaGain > 0) rewardParts.push(`+${manaGain} Mana`);
        if (qpGain > 0) rewardParts.push(`+${qpGain} QP`);

        if (tpl.dropItemRarity) {
          const pool = ITEMS.filter((it) => it.rarity === tpl.dropItemRarity);
          if (pool.length > 0) {
            const picked = pool[Math.floor(Math.random() * pool.length)];
            team.inventory.push(picked.id);
            rewardParts.push(`ไอเทม [${picked.name}]`);
          }
        }

        if (tpl.id === 'fafnir' && killerUnitId && draft.units[killerUnitId]) {
          draft.units[killerUnitId].atk += 1;
          if (!draft.units[killerUnitId].tags.includes('Dragon Slayer +1 ATK')) {
            draft.units[killerUnitId].tags.push('Dragon Slayer +1 ATK');
          }
          rewardParts.push(`${draft.units[killerUnitId].name} +1 ATK ถาวร`);
        }

        draft.logs = appendLog(
          draft,
          'ruler',
          `รางวัลสังหาร ${tpl.name} ให้ ${team.name}: ${rewardParts.join(', ')}`
        );
      }),

    setSecretGrailTurn: (turn) => {
      const nextSecret: RulerSecretDoc = {
        ...get().rulerSecret,
        secretGrailTurn: turn,
      };
      set({ rulerSecret: nextSecret });
      const { sessionMode, activeRoomId, previewRole } = get();
      if (sessionMode === 'online' && activeRoomId && previewRole === 'ruler') {
        updateRulerSecretDoc(activeRoomId, nextSecret).catch((err) =>
          console.error('Failed to update secretGrailTurn:', err)
        );
      }
    },

    toggleFogOfWar: () =>
      commitRoomMutation((draft) => {
        draft.fogConfig.enabled = !draft.fogConfig.enabled;
        draft.logs = appendLog(
          draft,
          'ruler',
          `${draft.fogConfig.enabled ? 'เปิด' : 'ปิด'} Fog of War`
        );
      }),

    toggleGrailManifested: () =>
      commitRoomMutation((draft) => {
        draft.grailManifested = !draft.grailManifested;
        if (draft.grailManifested) {
          draft.grailBannerBroadcast = {
            id: `grail-man-${Date.now()}`,
            absorbedCount: draft.grailAbsorbedCount,
            isManifestation: true,
            message:
              'ภาชนะแห่งจอกศักดิ์สิทธิ์เติมเต็มแล้ว — Greater Grail จุติลง ณ ใจกลางฟุยุกิแล้ว!',
            timestamp: Date.now(),
          };
          draft.logs = appendLog(draft, 'ruler', 'Ruler เปิดใช้งาน Greater Grail Manifestation');
        }
      }),

    unlockMasterOrders: async (masterKey) => {
      const state = get();
      const teamKey: TeamId = masterKey === 'master_a' ? 'team_a' : 'team_b';
      const currentOrders =
        masterKey === 'master_a' ? state.masterAOrders : state.masterBOrders;

      if (state.sessionMode === 'online' && state.activeRoomId) {
        await unlockMasterSecretOrders({
          roomId: state.activeRoomId,
          masterKey,
          currentOrders,
          currentTeams: state.roomState.teams,
          turn: state.roomState.turn,
        });
      } else {
        set((s) => ({
          ...(masterKey === 'master_a' && s.masterAOrders
            ? { masterAOrders: { ...s.masterAOrders, locked: false } }
            : {}),
          ...(masterKey === 'master_b' && s.masterBOrders
            ? { masterBOrders: { ...s.masterBOrders, locked: false } }
            : {}),
          roomState: {
            ...s.roomState,
            teams: {
              ...s.roomState.teams,
              [teamKey]: {
                ...s.roomState.teams[teamKey],
                readyLocked: false,
              },
            },
          },
        }));
      }
    },

    resetSeat: async (masterKey) => {
      const state = get();
      if (state.sessionMode === 'online' && state.activeRoomId) {
        await resetRoomSeat(state.activeRoomId, masterKey, state.roomState.seats);
      } else {
        commitRoomMutation((draft) => {
          if (masterKey === 'master_a') draft.seats.masterAUid = null;
          else draft.seats.masterBUid = null;
        });
      }
    },

    moveUnit: (unitId, target) => {
      let toastCandidate: PendingPickupToast | null = null;
      const isRulerNow = get().previewRole === 'ruler';

      commitRoomMutation((draft) => {
        const unit = draft.units[unitId];
        if (!unit) return;
        const occupant = Object.values(draft.units).find(
          (u) =>
            u.id !== unitId &&
            u.status === 'active' &&
            u.position?.zone === target.zone &&
            u.position.x === target.x &&
            u.position.y === target.y
        );
        const oldPos = unit.position ? { ...unit.position } : null;
        unit.position = { ...target };
        unit.status = 'active';
        if (occupant && oldPos) {
          occupant.position = oldPos;
        }

        // Check for dropped item on landing tile -> trigger Quick Pickup Toast for Ruler
        const targetKey = getTileKey(target.zone, target.x, target.y);
        const droppedId = draft.tileOverrides[targetKey]?.droppedItemId;
        if (
          isRulerNow &&
          droppedId &&
          unit.unitType === 'servant' &&
          (unit.owner === 'team_a' || unit.owner === 'team_b')
        ) {
          toastCandidate = {
            id: `pickup-${Date.now()}`,
            tileKey: targetKey,
            coords: { ...target },
            itemId: droppedId,
            unitId: unit.id,
            unitName: unit.name,
            teamId: unit.owner,
          };
        }
      });

      if (toastCandidate) {
        set({ pendingPickupToast: toastCandidate });
      }
    },

    updateUnit: (unitId, patch) =>
      commitRoomMutation((draft) => {
        const unit = draft.units[unitId];
        if (!unit) return;
        const prevStatus = unit.status;
        Object.assign(unit, patch);

        if (unit.hp < 0) unit.hp = 0;
        if (unit.maxHp < 1) unit.maxHp = 1;
        if (unit.hp > unit.maxHp) unit.hp = unit.maxHp;

        if (unit.status === 'active' && !unit.position) {
          const targetZone: ZoneId =
            unit.owner === 'team_a'
              ? 'base_a'
              : unit.owner === 'team_b'
                ? 'base_b'
                : 'central';
          unit.position = findOpenTileInZone(draft.units, targetZone);
        } else if (unit.status !== 'active') {
          unit.position = null;
        }

        if (
          unit.unitType === 'servant' &&
          prevStatus !== 'defeated' &&
          unit.status === 'defeated'
        ) {
          handleServantDefeatedEffects(draft, unit);
        }
      }),

    removeUnit: (unitId) => {
      commitRoomMutation((draft) => {
        const unit = draft.units[unitId];
        if (!unit) return;
        const name = unit.name;
        delete draft.units[unitId];
        draft.logs = appendLog(draft, 'ruler', `ลบยูนิต ${name} ออกจากกระดาน`);
      });
      if (get().selectedUnitId === unitId) {
        set({ selectedUnitId: null });
      }
    },

    teleportUnitToZone: (unitId, zone) => {
      commitRoomMutation((draft) => {
        const unit = draft.units[unitId];
        if (!unit) return;
        unit.position = findOpenTileInZone(draft.units, zone);
        unit.status = 'active';
        draft.logs = appendLog(
          draft,
          'ruler',
          `ย้าย ${unit.name} ไปยังโซน ${MAP_DATA.zones[zone].name}`
        );
      });
      set({ activeZone: zone });
    },

    addUnitTag: (unitId, rawTag) => {
      const tag = rawTag.trim();
      if (!tag) return;
      commitRoomMutation((draft) => {
        const unit = draft.units[unitId];
        if (!unit) return;
        if (!unit.tags.includes(tag)) {
          unit.tags.push(tag);
        }
      });
    },

    removeUnitTag: (unitId, tag) =>
      commitRoomMutation((draft) => {
        const unit = draft.units[unitId];
        if (!unit) return;
        unit.tags = unit.tags.filter((t) => t !== tag);
      }),

    adjustTeamResource: (teamId, field, delta) =>
      commitRoomMutation((draft) => {
        const team = draft.teams[teamId];
        const nextVal = team[field] + delta;
        if (field === 'commandSpells') {
          team[field] = Math.max(0, Math.min(3, nextVal));
        } else if (field === 'defeatedCount') {
          team[field] = Math.max(0, Math.min(6, nextVal));
        } else {
          team[field] = Math.max(0, nextVal);
        }
      }),

    giveTeamItem: (teamId, itemId) =>
      commitRoomMutation((draft) => {
        draft.teams[teamId].inventory.push(itemId);
        draft.logs = appendLog(draft, 'ruler', `มอบไอเทม ${itemId} ให้ ${draft.teams[teamId].name}`);
      }),

    removeTeamItem: (teamId, index) =>
      commitRoomMutation((draft) => {
        draft.teams[teamId].inventory.splice(index, 1);
      }),

    spawnMonster: (monsterId, coords) => {
      const tpl = MONSTERS_BY_ID[monsterId];
      if (!tpl) return;
      const newId = `mon_${monsterId}_${Date.now().toString(36).slice(-4)}`;
      commitRoomMutation((draft) => {
        draft.units[newId] = createMonsterUnit(newId, monsterId, coords);
        draft.logs = appendLog(
          draft,
          'ruler',
          `เสกมอนสเตอร์ ${tpl.name} ที่ ${coords.zone.toUpperCase()} (${coords.x},${coords.y})`
        );
      });
      set({ selectedUnitId: newId, pendingSpawnMonsterId: null, tilePopover: null });
    },

    spawnGreaterGrail: () => {
      commitRoomMutation((draft) => {
        draft.grailManifested = true;
        draft.grailBannerBroadcast = {
          id: `grail-spawn-${Date.now()}`,
          absorbedCount: draft.grailAbsorbedCount,
          isManifestation: true,
          message: 'Greater Grail จุติลง ณ ใจกลางฟุยุกิ (Central E4 / F4) แล้ว!',
          timestamp: Date.now(),
        };
        draft.logs = appendLog(draft, 'ruler', 'เสก Greater Grail ลง ณ ใจกลาง Central Fuyuki');
      });
      set({ activeZone: 'central' });
    },

    toggleTileCleared: (coords) =>
      commitRoomMutation((draft) => {
        const key = getTileKey(coords.zone, coords.x, coords.y);
        const existing = draft.tileOverrides[key];
        const nextCleared = !(existing?.cleared ?? false);
        if (!nextCleared && !existing?.customNote && !existing?.droppedItemId) {
          delete draft.tileOverrides[key];
        } else {
          draft.tileOverrides[key] = {
            ...existing,
            tileKey: key,
            cleared: nextCleared,
          };
        }
      }),

    setTileCustomNote: (coords, note) =>
      commitRoomMutation((draft) => {
        const key = getTileKey(coords.zone, coords.x, coords.y);
        const trimmed = note.trim();
        const existing = draft.tileOverrides[key];
        if (!trimmed && !existing?.cleared && !existing?.droppedItemId) {
          delete draft.tileOverrides[key];
        } else {
          draft.tileOverrides[key] = {
            ...existing,
            tileKey: key,
            cleared: existing?.cleared ?? false,
            customNote: trimmed || undefined,
          };
        }
      }),

    dropItemOnTile: (coords, itemId, isMysteryDrop = false) =>
      commitRoomMutation((draft) => {
        const item = ITEMS_BY_ID[itemId];
        if (!item) return;
        const key = getTileKey(coords.zone, coords.x, coords.y);
        const existing = draft.tileOverrides[key];
        draft.tileOverrides[key] = {
          ...existing,
          tileKey: key,
          cleared: existing?.cleared ?? false,
          droppedItemId: itemId,
          isMysteryDrop,
        };
        const label = formatCoordLabel(coords.x, coords.y);
        draft.logs = appendLog(
          draft,
          'ruler',
          isMysteryDrop
            ? `วางหีบสมบัติปริศนา (?) ที่ ${coords.zone.toUpperCase()} ${label}`
            : `ดรอปไอเทม [${item.name}] ที่ ${coords.zone.toUpperCase()} ${label}`
        );
      }),

    dropRandomItemOnTile: (coords, rarity, isMysteryDrop = false) => {
      const pool = ITEMS.filter((it) => it.rarity === rarity);
      if (pool.length === 0) return;
      const picked = pool[Math.floor(Math.random() * pool.length)];
      get().dropItemOnTile(coords, picked.id, isMysteryDrop);
    },

    pickupItemFromTile: (coords, teamId) => {
      const key = getTileKey(coords.zone, coords.x, coords.y);
      commitRoomMutation((draft) => {
        const existing = draft.tileOverrides[key];
        const itemId = existing?.droppedItemId;
        if (!itemId) return;
        const itemName = ITEMS_BY_ID[itemId]?.name ?? itemId;
        draft.teams[teamId].inventory.push(itemId);
        if (!existing.cleared && !existing.customNote) {
          delete draft.tileOverrides[key];
        } else {
          draft.tileOverrides[key] = {
            ...existing,
            droppedItemId: null,
            isMysteryDrop: false,
          };
        }
        draft.logs = appendLog(
          draft,
          'ruler',
          `${draft.teams[teamId].name} เก็บไอเทม [${itemName}] จาก ${coords.zone.toUpperCase()} ${formatCoordLabel(coords.x, coords.y)}`
        );
      });
      if (get().pendingPickupToast?.tileKey === key) {
        set({ pendingPickupToast: null });
      }
    },

    removeItemFromTile: (coords) => {
      const key = getTileKey(coords.zone, coords.x, coords.y);
      commitRoomMutation((draft) => {
        const existing = draft.tileOverrides[key];
        if (!existing?.droppedItemId) return;
        if (!existing.cleared && !existing.customNote) {
          delete draft.tileOverrides[key];
        } else {
          draft.tileOverrides[key] = {
            ...existing,
            droppedItemId: null,
            isMysteryDrop: false,
          };
        }
        draft.logs = appendLog(
          draft,
          'ruler',
          `ลบไอเทมดรอปออกจากช่อง ${coords.zone.toUpperCase()} ${formatCoordLabel(coords.x, coords.y)}`
        );
      });
      if (get().pendingPickupToast?.tileKey === key) {
        set({ pendingPickupToast: null });
      }
    },

    resetAllClearedTiles: () =>
      commitRoomMutation((draft) => {
        for (const key of Object.keys(draft.tileOverrides)) {
          draft.tileOverrides[key].cleared = false;
          if (!draft.tileOverrides[key].customNote && !draft.tileOverrides[key].droppedItemId) {
            delete draft.tileOverrides[key];
          }
        }
        draft.logs = appendLog(draft, 'ruler', 'รีเซ็ตป้าย CLEARED ทุกช่องบนกระดานแล้ว');
      }),

    triggerSampleGrailBanner: (manifest = false) => {
      commitRoomMutation((draft) => {
        const nextCount = manifest ? 5 : Math.min(5, draft.grailAbsorbedCount + 1);
        const isMan = manifest || nextCount >= 5;
        draft.grailAbsorbedCount = nextCount;
        if (isMan) draft.grailManifested = true;
        draft.grailBannerBroadcast = isMan
          ? {
              id: `grail-${Date.now()}`,
              absorbedCount: 5,
              isManifestation: true,
              message:
                'ภาชนะแห่งจอกศักดิ์สิทธิ์เติมเต็มแล้ว — Greater Grail จุติลง ณ ใจกลางฟุยุกิแล้ว!',
              timestamp: Date.now(),
            }
          : {
              id: `grail-${Date.now()}`,
              servantName: 'EMIYA',
              absorbedCount: nextCount,
              isManifestation: false,
              message: `วิญญาณวีรชน EMIYA ถูกจอกศักดิ์สิทธิ์กลืนกินแล้ว... (${nextCount} / 5)`,
              timestamp: Date.now(),
            };
      });
    },

    dismissGrailBanner: () => {
      const next = cloneRoomState(get().roomState);
      next.grailBannerBroadcast = null;
      set({ roomState: next });
      pushToFirestoreIfOnline(next);
    },

    // --- Phase 4: Shared Wheels & 1d6 Dice ---
    spinWheel: (wheelType, targetTeam = null) => {
      commitRoomMutation((draft) => {
        if (wheelType === 'servant_draft') {
          const pool = draft.draftPoolRemaining;
          if (pool.length === 0) return;
          const pickedId = pool[Math.floor(Math.random() * pool.length)];
          const tpl = SERVANTS_BY_ID[pickedId];
          draft.wheelBroadcast = {
            id: `wheel-${Date.now()}`,
            wheelType,
            isSpinning: true,
            poolIds: [...pool],
            resultId: pickedId,
            resultLabel: tpl?.name ?? pickedId,
            resultClass: tpl?.subClass
              ? `${tpl.servantClass} (${tpl.subClass})`
              : tpl?.servantClass ?? null,
            resultDescription: tpl
              ? `${tpl.servantClass}${tpl.subClass ? ` (${tpl.subClass})` : ''} · HP ${tpl.hp} · ATK ${tpl.atk} · MOV ${tpl.mov} · NP: ${tpl.npName}`
              : null,
            targetTeam,
          };
          return;
        }

        const list =
          wheelType === 'map_event' ? EVENTS.mapEvents : EVENTS.personalEvents;
        const weightedIds: string[] = [];
        for (const ev of list) {
          for (let i = 0; i < Math.max(1, ev.weight); i++) {
            weightedIds.push(ev.id);
          }
        }
        const pickedId =
          weightedIds[Math.floor(Math.random() * weightedIds.length)];
        const picked = list.find((e) => e.id === pickedId) ?? list[0];

        draft.wheelBroadcast = {
          id: `wheel-${Date.now()}`,
          wheelType,
          isSpinning: true,
          poolIds: list.map((e) => e.id),
          resultId: picked.id,
          resultLabel: picked.title,
          resultDescription: picked.description,
        };
      });
    },

    assignDraftedServant: (servantId, teamId) => {
      const tpl = SERVANTS_BY_ID[servantId];
      if (!tpl) return;
      const newId = `unit_${teamId === 'team_a' ? 'a' : 'b'}_${Date.now().toString(36).slice(-4)}`;
      commitRoomMutation((draft) => {
        draft.draftPoolRemaining = draft.draftPoolRemaining.filter(
          (id) => id !== servantId
        );
        draft.units[newId] = createServantUnit(
          newId,
          servantId,
          teamId,
          'reserve',
          null,
          { isTrueNameRevealed: !draft.trueNameConcealment }
        );
        if (draft.wheelBroadcast) {
          draft.wheelBroadcast.isSpinning = false;
          draft.wheelBroadcast.targetTeam = teamId;
        }
        draft.logs = appendLog(
          draft,
          'ruler',
          draft.trueNameConcealment
            ? `Draft: ${draft.teams[teamId].name} อัญเชิญวีรชนคลาส ${tpl.servantClass} (ปิดนามแท้)`
            : `Draft: ${tpl.name} (${tpl.servantClass}) เข้าสู่ทีม ${draft.teams[teamId].name}`
        );
      });
    },

    spawnStrayBossFromWheel: (servantId) => {
      const tpl = SERVANTS_BY_ID[servantId];
      if (!tpl) return;
      const newId = `stray_${servantId}_${Date.now().toString(36).slice(-4)}`;
      commitRoomMutation((draft) => {
        draft.draftPoolRemaining = draft.draftPoolRemaining.filter(
          (id) => id !== servantId
        );
        const pos = findOpenTileInZone(draft.units, 'central');
        draft.units[newId] = createServantUnit(
          newId,
          servantId,
          'neutral',
          'active',
          pos,
          {
            hp: 12,
            maxHp: 12,
            atk: 4,
            tags: ['Stray Boss'],
            isRevealedToEnemy: true,
          }
        );
        if (draft.wheelBroadcast) {
          draft.wheelBroadcast.isSpinning = false;
        }
        draft.logs = appendLog(
          draft,
          'system',
          `Stray Servant! ${tpl.name} ปรากฏตัวเป็นบอสกลางโซน Central (HP 12, ATK 4)`
        );
      });
      set({ activeZone: 'central', selectedUnitId: newId });
    },

    applyMapEventFromWheel: (eventId) => {
      const ev = EVENTS.mapEvents.find((e) => e.id === eventId);
      if (!ev) return;
      commitRoomMutation((draft) => {
        draft.activeMapEvent = {
          id: ev.id,
          title: ev.title,
          description: ev.description,
        };
        if (draft.wheelBroadcast) {
          draft.wheelBroadcast.isSpinning = false;
        }
        draft.logs = appendLog(
          draft,
          'ruler',
          `Map Event ประจำเทิร์น ${draft.turn}: ${ev.title} — ${ev.description}`
        );
      });
    },

    recordPersonalEventLog: (title, description) => {
      commitRoomMutation((draft) => {
        if (draft.wheelBroadcast) {
          draft.wheelBroadcast.isSpinning = false;
        }
        draft.logs = appendLog(
          draft,
          'ruler',
          `Personal Event: ${title} — ${description}`
        );
      });
    },

    rollDice1d6: async (label) => {
      const state = get();
      const result = Math.floor(Math.random() * 6) + 1;
      const bonusText =
        result <= 2 ? '+0' : result <= 4 ? '+1' : '+2 CRIT!';
      const cleanLabel = label.trim() || '1d6 Roll';

      const diceBroadcast: DiceBroadcast = {
        id: `dice-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        rollerRole: state.previewRole,
        sides: 6,
        result,
        label: cleanLabel,
        timestamp: Date.now(),
      };

      const roleTag =
        state.previewRole === 'ruler'
          ? 'Ruler'
          : state.previewRole === 'master_a'
            ? 'Master A'
            : 'Master B';

      const nextLogs = appendLog(
        state.roomState,
        state.previewRole,
        `🎲 ${roleTag} ทอย 1d6 (${cleanLabel}): ได้ ${result} [Combat Bonus: ${bonusText}]`
      );

      set((s) => ({
        roomState: {
          ...s.roomState,
          diceBroadcast,
          logs: nextLogs,
        },
      }));

      if (state.sessionMode === 'online' && state.activeRoomId) {
        try {
          await broadcastDiceRoll(state.activeRoomId, diceBroadcast, nextLogs);
        } catch (err) {
          console.error('Failed to broadcast dice roll:', err);
        }
      }
    },

    // --- Feature (A): Secret Deployment & Reinforcements ---
    submitMasterDeployment: async (placements) => {
      const state = get();
      const role = state.previewRole;
      if (role !== 'master_a' && role !== 'master_b') return;
      const teamId: TeamId = role === 'master_a' ? 'team_a' : 'team_b';
      const existing =
        role === 'master_a' ? state.masterAOrders : state.masterBOrders;

      const docPayload: SecretCommandsDoc = {
        ...(existing ?? { orders: [] }),
        turn: state.roomState.turn,
        locked: existing?.locked ?? false,
        updatedAt: Date.now(),
        orders: existing?.orders ?? [],
        deployment: {
          locked: true,
          placements,
        },
      };

      if (state.sessionMode === 'online' && state.activeRoomId) {
        await submitMasterSecretOrders({
          roomId: state.activeRoomId,
          masterKey: role,
          ordersDoc: docPayload,
          currentTeams: state.roomState.teams,
          setReadyLocked: true,
        });
      } else {
        set((s) => ({
          ...(role === 'master_a'
            ? { masterAOrders: docPayload }
            : { masterBOrders: docPayload }),
          roomState: {
            ...s.roomState,
            teams: {
              ...s.roomState.teams,
              [teamId]: {
                ...s.roomState.teams[teamId],
                readyLocked: true,
              },
            },
          },
        }));
      }
    },

    deployAllAndStartTurn1: async () => {
      const state = get();
      const depA = state.masterAOrders?.deployment?.placements ?? [];
      const depB = state.masterBOrders?.deployment?.placements ?? [];

      commitRoomMutation((draft) => {
        const activeIdsA = new Set(depA.map((p) => p.unitId));
        const activeIdsB = new Set(depB.map((p) => p.unitId));

        for (const unit of Object.values(draft.units)) {
          if (unit.unitType !== 'servant') continue;
          if (unit.owner === 'team_a' && depA.length > 0) {
            const match = depA.find((p) => p.unitId === unit.id);
            if (match && activeIdsA.has(unit.id)) {
              unit.status = 'active';
              unit.position = { ...match.position };
            } else if (unit.status !== 'defeated') {
              unit.status = 'reserve';
              unit.position = null;
            }
          } else if (unit.owner === 'team_b' && depB.length > 0) {
            const match = depB.find((p) => p.unitId === unit.id);
            if (match && activeIdsB.has(unit.id)) {
              unit.status = 'active';
              unit.position = { ...match.position };
            } else if (unit.status !== 'defeated') {
              unit.status = 'reserve';
              unit.position = null;
            }
          }
        }

        draft.turn = Math.max(1, draft.turn);
        draft.phase = 'event';
        draft.teams.team_a.readyLocked = false;
        draft.teams.team_b.readyLocked = false;
        draft.logs = appendLog(
          draft,
          'ruler',
          'ทั้งสองฝ่ายจัดทัพเสร็จสิ้น — เริ่มสงครามจอกศักดิ์สิทธิ์ Turn 1 (Event Phase)!'
        );
      });

      set({ masterAOrders: null, masterBOrders: null, draftOrders: {} });

      if (state.sessionMode === 'online' && state.activeRoomId) {
        await clearAllSecretOrders(state.activeRoomId, Math.max(1, state.roomState.turn));
      }
    },

    requestMasterReinforcement: async (unitId, position) => {
      const state = get();
      const role = state.previewRole;
      if (role !== 'master_a' && role !== 'master_b') return;
      const existing =
        role === 'master_a' ? state.masterAOrders : state.masterBOrders;

      const docPayload: SecretCommandsDoc = {
        ...(existing ?? { orders: [] }),
        turn: state.roomState.turn,
        locked: existing?.locked ?? false,
        updatedAt: Date.now(),
        orders: existing?.orders ?? [],
        reinforcementRequest: {
          unitId,
          position,
          requestedAt: Date.now(),
        },
      };

      if (state.sessionMode === 'online' && state.activeRoomId) {
        await submitMasterSecretOrders({
          roomId: state.activeRoomId,
          masterKey: role,
          ordersDoc: docPayload,
        });
      } else {
        set(
          role === 'master_a'
            ? { masterAOrders: docPayload }
            : { masterBOrders: docPayload }
        );
      }
    },

    approveReinforcement: async (masterKey) => {
      const state = get();
      const ordersDoc =
        masterKey === 'master_a' ? state.masterAOrders : state.masterBOrders;
      const req = ordersDoc?.reinforcementRequest;
      if (!req) return;

      commitRoomMutation((draft) => {
        const unit = draft.units[req.unitId];
        if (!unit) return;
        unit.status = 'active';
        unit.position = { ...req.position };
        draft.logs = appendLog(
          draft,
          'ruler',
          draft.trueNameConcealment && !unit.isTrueNameRevealed
            ? `อนุมัติกำลังเสริม: คลาส ${unit.servantClass} ลงสนามที่ ${req.position.zone.toUpperCase()}`
            : `อนุมัติกำลังเสริม: ${unit.name} ลงสนามที่ ${req.position.zone.toUpperCase()}`
        );
      });

      const clearedDoc: SecretCommandsDoc = {
        ...(ordersDoc ?? { turn: state.roomState.turn, locked: false, updatedAt: Date.now(), orders: [] }),
        updatedAt: Date.now(),
        reinforcementRequest: null,
      };

      if (state.sessionMode === 'online' && state.activeRoomId) {
        await submitMasterSecretOrders({
          roomId: state.activeRoomId,
          masterKey,
          ordersDoc: clearedDoc,
        });
      } else {
        set(
          masterKey === 'master_a'
            ? { masterAOrders: clearedDoc }
            : { masterBOrders: clearedDoc }
        );
      }
    },

    dismissReinforcement: async (masterKey) => {
      const state = get();
      const ordersDoc =
        masterKey === 'master_a' ? state.masterAOrders : state.masterBOrders;
      if (!ordersDoc?.reinforcementRequest) return;

      const clearedDoc: SecretCommandsDoc = {
        ...ordersDoc,
        updatedAt: Date.now(),
        reinforcementRequest: null,
      };

      if (state.sessionMode === 'online' && state.activeRoomId) {
        await submitMasterSecretOrders({
          roomId: state.activeRoomId,
          masterKey,
          ordersDoc: clearedDoc,
        });
      } else {
        set(
          masterKey === 'master_a'
            ? { masterAOrders: clearedDoc }
            : { masterBOrders: clearedDoc }
        );
      }
    },

    // --- Feature (B): True Name Concealment ---
    toggleTrueNameConcealment: () =>
      commitRoomMutation((draft) => {
        draft.trueNameConcealment = !draft.trueNameConcealment;
        draft.logs = appendLog(
          draft,
          'ruler',
          `${draft.trueNameConcealment ? 'เปิด' : 'ปิด'} โหมดปิดนามแท้ (True Name Concealment)`
        );
      }),

    toggleUnitTrueNameRevealed: (unitId) =>
      commitRoomMutation((draft) => {
        const unit = draft.units[unitId];
        if (!unit || unit.unitType !== 'servant') return;
        unit.isTrueNameRevealed = !unit.isTrueNameRevealed;
        const teamLabel =
          unit.owner === 'team_a'
            ? draft.teams.team_a.name
            : unit.owner === 'team_b'
              ? draft.teams.team_b.name
              : 'Neutral';
        if (unit.isTrueNameRevealed) {
          draft.logs = appendLog(
            draft,
            'system',
            `นามแท้ของ ${unit.servantClass ?? 'Servant'} ฝั่ง ${teamLabel} ถูกเปิดเผยแล้ว: ${unit.name}!`
          );
        } else {
          draft.logs = appendLog(
            draft,
            'ruler',
            `ซ่อนนามแท้ของ ${unit.name} (${unit.servantClass ?? 'Servant'})`
          );
        }
      }),
  };
});
