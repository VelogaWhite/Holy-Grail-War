import { create } from 'zustand';
import { MAP_DATA, MONSTERS_BY_ID, SERVANTS, SERVANTS_BY_ID } from '../data';
import type {
  BoardUnit,
  Coordinates,
  GrailBannerBroadcast,
  OwnerId,
  Role,
  RoomState,
  RulerSecretDoc,
  TeamId,
  TurnPhase,
  ZoneId,
} from '../types/game';
import { getTileKey } from '../utils/assetHelper';

const MAX_UNDO_HISTORY = 15;

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

function randomSecretGrailTurn(): 10 | 11 | 12 {
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
  // Prefer center-ish rows first
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

function createPhase1MockRoom(): RoomState {
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
    // Team A — Active (3)
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
    // Team A — Reserve (3)
    createServantUnit('unit_a_4', 'gilgamesh', 'team_a', 'reserve', null),
    createServantUnit('unit_a_5', 'cu_chulainn', 'team_a', 'reserve', null),
    createServantUnit('unit_a_6', 'king_hassan', 'team_a', 'reserve', null),

    // Team B — Active (3)
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
    // Team B — Reserve (3)
    createServantUnit('unit_b_4', 'emiya', 'team_b', 'reserve', null),
    createServantUnit('unit_b_5', 'heracles', 'team_b', 'reserve', null),
    createServantUnit('unit_b_6', 'bb', 'team_b', 'reserve', null),

    // PvE Monsters (matching maps.json nests)
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
        name: 'Team A (Mount Enzo)',
        mana: 7,
        qp: 5,
        commandSpells: 3,
        inventory: ['dragon_vein_crystal', 'golden_apple'],
        defeatedCount: 1,
        readyLocked: true,
      },
      team_b: {
        name: 'Team B (Shinto City)',
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
      enabled: false,
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

export interface TilePopoverState {
  coords: Coordinates;
  clientX: number;
  clientY: number;
}

interface GameStoreState {
  roomState: RoomState;
  rulerSecret: RulerSecretDoc;
  historyStack: RoomState[];
  previewRole: Role;
  activeZone: ZoneId;
  selectedUnitId: string | null;
  hoveredTile: Coordinates | null;
  lockedTile: Coordinates | null;
  tilePopover: TilePopoverState | null;
  pendingSpawnMonsterId: string | null;
  freeDragEnabled: boolean;
  showMoveHelper: boolean;
  isCatalogOpen: boolean;

  // Navigation & UI selection
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
  setCatalogOpen: (open: boolean) => void;
  setPreviewRole: (role: Role) => void;

  // Phase 2: Ruler God-Mode Actions (all push to local 15-step historyStack)
  undo: () => void;
  setPhase: (phase: TurnPhase) => void;
  endTurnAndNext: (skipManaUpkeep?: boolean) => void;
  setSecretGrailTurn: (turn: 10 | 11 | 12) => void;
  toggleFogOfWar: () => void;
  toggleGrailManifested: () => void;

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
  const commitRoomMutation = (mutator: (draft: RoomState) => void) => {
    const current = get().roomState;
    const snapshot = cloneRoomState(current);
    const next = cloneRoomState(current);
    mutator(next);
    const nextHistory = [...get().historyStack, snapshot].slice(-MAX_UNDO_HISTORY);
    set({ roomState: next, historyStack: nextHistory });
  };

  return {
    roomState: createPhase1MockRoom(),
    rulerSecret: {
      secretGrailTurn: randomSecretGrailTurn(),
    },
    historyStack: [],
    previewRole: 'ruler',
    activeZone: 'central',
    selectedUnitId: 'unit_a_1',
    hoveredTile: null,
    lockedTile: null,
    tilePopover: null,
    pendingSpawnMonsterId: null,
    freeDragEnabled: true,
    showMoveHelper: true,
    isCatalogOpen: false,

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
    setCatalogOpen: (open) => set({ isCatalogOpen: open }),
    setPreviewRole: (role) => set({ previewRole: role, tilePopover: null, pendingSpawnMonsterId: null }),

    undo: () => {
      const stack = get().historyStack;
      if (stack.length === 0) return;
      const previous = stack[stack.length - 1];
      set({
        roomState: previous,
        historyStack: stack.slice(0, -1),
        tilePopover: null,
      });
    },

    setPhase: (phase) =>
      commitRoomMutation((draft) => {
        draft.phase = phase;
        draft.logs = appendLog(draft, 'ruler', `เปลี่ยนเฟสเป็น ${phase.toUpperCase()}`);
      }),

    endTurnAndNext: (skipManaUpkeep = false) => {
      const secretTurn = get().rulerSecret.secretGrailTurn;
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

        // Secret Grail Turn Manifestation Check
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
    },

    setSecretGrailTurn: (turn) =>
      set((state) => ({
        rulerSecret: { ...state.rulerSecret, secretGrailTurn: turn },
      })),

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
        // If another unit is already on target tile, swap positions cleanly in God-Mode
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

        // If moved from reserve/defeated to active with no position, place on open tile in owner's base or central
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

        // Servant Defeated -> Grail Vessel Absorption (X/5) + Wipeout Kill Count (X/6)
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

          // Credit opposing team's Wipeout kill counter
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

    dismissGrailBanner: () =>
      set((state) => ({
        roomState: {
          ...state.roomState,
          grailBannerBroadcast: null,
        },
      })),
  };
});
