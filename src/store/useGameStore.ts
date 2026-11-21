import { create } from 'zustand';
import { EVENTS, MAP_DATA, MONSTERS_BY_ID, SERVANTS, SERVANTS_BY_ID } from '../data';
import {
  broadcastDiceRoll,
  clearAllSecretOrders,
  resetRoomSeat,
  submitMasterSecretOrders,
  syncRoomStateToFirestore,
  unlockMasterSecretOrders,
  updateRulerSecretDoc,
} from '../services/roomService';
import type {
  BoardUnit,
  CommandActionType,
  CommandOrder,
  Coordinates,
  DiceBroadcast,
  GrailBannerBroadcast,
  OwnerId,
  Role,
  RoomState,
  RulerSecretDoc,
  SecretCommandsDoc,
  TeamId,
  TurnPhase,
  WheelBroadcast,
  ZoneId,
} from '../types/game';
import { getTileKey } from '../utils/assetHelper';

const MAX_UNDO_HISTORY = 15;

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
    tags: [],
    isRevealedToEnemy: false,
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
    tags: [`Tier ${tpl.tier}`],
    isRevealedToEnemy: true,
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
  teamBName = 'Team B (Shinto City)'
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
    units[u.id] = u;
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
  teamBName = 'Team B (Shinto City)'
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
    units[u.id] = u;
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

  // Session Lifecycle Actions
  setAuthUid: (uid: string | null) => void;
  enterOnlineRoom: (roomId: string, role: Role, initialRoom?: RoomState) => void;
  enterLocalSandbox: () => void;
  leaveRoom: () => void;

  // Remote Sync Receivers (Pure local setters — NEVER trigger writes!)
  applyRemoteRoomState: (room: RoomState) => void;
  applyRemoteSecretOrders: (
    masterKey: 'master_a' | 'master_b',
    docData: SecretCommandsDoc
  ) => void;
  applyRemoteRulerSecret: (docData: RulerSecretDoc) => void;

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
  setPreviewRole: (role: Role) => void;

  // Phase 4: Shared Wheels & 1d6 Dice
  spinWheel: (wheelType: WheelBroadcast['wheelType']) => void;
  assignDraftedServant: (servantId: string, teamId: TeamId) => void;
  spawnStrayBossFromWheel: (servantId: string) => void;
  applyMapEventFromWheel: (eventId: string) => void;
  recordPersonalEventLog: (title: string, description: string) => void;
  rollDice1d6: (label: string) => Promise<void>;

  // Master Secret Command Queue Actions
  setDraftOrder: (
    unitId: string,
    patch: Partial<CommandOrder> & { actionType?: CommandActionType }
  ) => void;
  clearDraftOrderTarget: (unitId: string) => void;
  setPickingOrderForUnitId: (unitId: string | null) => void;
  applyPickedTarget: (targetPosition: Coordinates, targetUnitId?: string) => void;
  lockMasterTurn: () => Promise<void>;

  // Ruler God-Mode Actions (sync to Firestore once per explicit user action)
  undo: () => void;
  setPhase: (phase: TurnPhase) => void;
  endTurnAndNext: (skipManaUpkeep?: boolean) => void;
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

    setAuthUid: (uid) => set({ authUid: uid }),

    enterOnlineRoom: (roomId, role, initialRoom) =>
      set((state) => ({
        sessionMode: 'online',
        activeRoomId: roomId,
        previewRole: role,
        roomState: initialRoom ?? state.roomState,
        activeZone: role === 'master_a' ? 'base_a' : role === 'master_b' ? 'base_b' : 'central',
        historyStack: [],
        masterAOrders: null,
        masterBOrders: null,
        draftOrders: {},
        pickingOrderForUnitId: null,
        checkedOrderIds: {},
      })),

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
        checkedOrderIds: {},
      }),

    leaveRoom: () =>
      set({
        sessionMode: 'lobby',
        activeRoomId: null,
        masterAOrders: null,
        masterBOrders: null,
        draftOrders: {},
        pickingOrderForUnitId: null,
        tilePopover: null,
        pendingSpawnMonsterId: null,
        historyStack: [],
      }),

    applyRemoteRoomState: (room) =>
      set((state) => {
        // Clear local draft orders when turn advances
        const turnChanged = room.turn !== state.roomState.turn;
        return {
          roomState: room,
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

    setActiveZone: (zone) => set({ activeZone: zone, hoveredTile: null, tilePopover: null }),
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
    setLogsOpen: (open) => set({ isLogsOpen: open }),
    setPreviewRole: (role) => {
      if (get().sessionMode === 'online') return; // Role is locked to seat in online mode
      set({
        previewRole: role,
        tilePopover: null,
        pendingSpawnMonsterId: null,
        pickingOrderForUnitId: null,
      });
    },

    // --- Master Secret Command Queue ---
    setDraftOrder: (unitId, patch) =>
      set((state) => {
        const existing: CommandOrder = state.draftOrders[unitId] ?? {
          unitId,
          actionType: 'move',
          note: '',
        };
        return {
          draftOrders: {
            ...state.draftOrders,
            [unitId]: { ...existing, ...patch, unitId },
          },
        };
      }),

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
            },
          },
        };
      }),

    setPickingOrderForUnitId: (unitId) => set({ pickingOrderForUnitId: unitId }),

    applyPickedTarget: (targetPosition, targetUnitId) =>
      set((state) => {
        const unitId = state.pickingOrderForUnitId;
        if (!unitId) return state;
        const existing: CommandOrder = state.draftOrders[unitId] ?? {
          unitId,
          actionType: targetUnitId ? 'attack' : 'move',
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
        return (
          draft ?? {
            unitId: u.id,
            actionType: 'guard',
            note: '',
          }
        );
      });

      const docPayload: SecretCommandsDoc = {
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
      set({ pickingOrderForUnitId: null });
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

    endTurnAndNext: (skipManaUpkeep = false) => {
      const { rulerSecret, sessionMode, activeRoomId } = get();
      const secretTurn = rulerSecret.secretGrailTurn;
      const nextTurnNumber = get().roomState.turn + 1;

      commitRoomMutation((draft) => {
        draft.turn += 1;
        draft.phase = 'event';
        draft.teams.team_a.readyLocked = false;
        draft.teams.team_b.readyLocked = false;
        if (!skipManaUpkeep) {
          draft.teams.team_a.mana += 2;
          draft.teams.team_b.mana += 2;
        }
        draft.logs = appendLog(
          draft,
          'ruler',
          `เริ่มเทิร์น ${draft.turn}${skipManaUpkeep ? ' (งดแจก Mana)' : ' (+2 Mana ทั้งสองฝ่าย)'}`
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

    moveUnit: (unitId, target) =>
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
      }),

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
        draft.tileOverrides[key] = {
          tileKey: key,
          cleared: !(existing?.cleared ?? false),
          customNote: existing?.customNote,
        };
      }),

    setTileCustomNote: (coords, note) =>
      commitRoomMutation((draft) => {
        const key = getTileKey(coords.zone, coords.x, coords.y);
        const trimmed = note.trim();
        const existing = draft.tileOverrides[key];
        if (!trimmed && !existing?.cleared) {
          delete draft.tileOverrides[key];
        } else {
          draft.tileOverrides[key] = {
            tileKey: key,
            cleared: existing?.cleared ?? false,
            customNote: trimmed || undefined,
          };
        }
      }),

    resetAllClearedTiles: () =>
      commitRoomMutation((draft) => {
        for (const key of Object.keys(draft.tileOverrides)) {
          draft.tileOverrides[key].cleared = false;
          if (!draft.tileOverrides[key].customNote) {
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
    spinWheel: (wheelType) => {
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
            resultDescription: tpl
              ? `${tpl.servantClass}${tpl.subClass ? ` (${tpl.subClass})` : ''} · HP ${tpl.hp} · ATK ${tpl.atk} · MOV ${tpl.mov} · NP: ${tpl.npName}`
              : null,
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
          null
        );
        if (draft.wheelBroadcast) {
          draft.wheelBroadcast.isSpinning = false;
          draft.wheelBroadcast.targetTeam = teamId;
        }
        draft.logs = appendLog(
          draft,
          'ruler',
          `Draft: ${tpl.name} (${tpl.servantClass}) เข้าสู่ทีม ${draft.teams[teamId].name}`
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
  };
});
