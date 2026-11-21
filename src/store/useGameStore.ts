import { create } from 'zustand';
import { MONSTERS_BY_ID, SERVANTS, SERVANTS_BY_ID } from '../data';
import type {
  BoardUnit,
  Coordinates,
  GrailBannerBroadcast,
  OwnerId,
  Role,
  RoomState,
  RulerSecretDoc,
  ZoneId,
} from '../types/game';

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

interface GameStoreState {
  roomState: RoomState;
  rulerSecret: RulerSecretDoc;
  previewRole: Role;
  activeZone: ZoneId;
  selectedUnitId: string | null;
  hoveredTile: Coordinates | null;
  isCatalogOpen: boolean;
  setActiveZone: (zone: ZoneId) => void;
  selectUnit: (unitId: string | null) => void;
  locateUnit: (unitId: string) => void;
  setHoveredTile: (coords: Coordinates | null) => void;
  setCatalogOpen: (open: boolean) => void;
  setPreviewRole: (role: Role) => void;
  triggerSampleGrailBanner: (manifest?: boolean) => void;
  dismissGrailBanner: () => void;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  roomState: createPhase1MockRoom(),
  rulerSecret: {
    secretGrailTurn: randomSecretGrailTurn(),
  },
  previewRole: 'ruler',
  activeZone: 'central',
  selectedUnitId: 'unit_a_1',
  hoveredTile: null,
  isCatalogOpen: false,

  setActiveZone: (zone) => set({ activeZone: zone, hoveredTile: null }),
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
  setCatalogOpen: (open) => set({ isCatalogOpen: open }),
  setPreviewRole: (role) => set({ previewRole: role }),
  triggerSampleGrailBanner: (manifest = false) => {
    const current = get().roomState;
    const nextCount = manifest ? 5 : Math.min(5, current.grailAbsorbedCount + 1);
    const isMan = manifest || nextCount >= 5;
    const servantName = 'EMIYA';
    const banner: GrailBannerBroadcast = isMan
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
          servantName,
          absorbedCount: nextCount,
          isManifestation: false,
          message: `วิญญาณวีรชน ${servantName} ถูกจอกศักดิ์สิทธิ์กลืนกินแล้ว... (${nextCount} / 5)`,
          timestamp: Date.now(),
        };
    set({
      roomState: {
        ...current,
        grailAbsorbedCount: nextCount,
        grailManifested: isMan ? true : current.grailManifested,
        grailBannerBroadcast: banner,
      },
    });
  },
  dismissGrailBanner: () =>
    set((state) => ({
      roomState: {
        ...state.roomState,
        grailBannerBroadcast: null,
      },
    })),
}));
