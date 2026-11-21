import classesRaw from './classes.json';
import servantsRaw from './servants.json';
import monstersRaw from './monsters.json';
import itemsRaw from './items.json';
import eventsRaw from './events.json';
import mapsRaw from './maps.json';
import type {
  ClassDefinition,
  EventsData,
  ItemTemplate,
  MapData,
  MonsterTemplate,
  ServantClassId,
  ServantTemplate,
} from '../types/game';

export const CLASSES = classesRaw as ClassDefinition[];
export const SERVANTS = servantsRaw as ServantTemplate[];
export const MONSTERS = monstersRaw as MonsterTemplate[];
export const ITEMS = itemsRaw as ItemTemplate[];
export const EVENTS = eventsRaw as EventsData;
export const MAP_DATA = mapsRaw as MapData;

export const CLASSES_BY_ID: Record<ServantClassId, ClassDefinition> = CLASSES.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<ServantClassId, ClassDefinition>
);

export const SERVANTS_BY_ID: Record<string, ServantTemplate> = SERVANTS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<string, ServantTemplate>
);

export const MONSTERS_BY_ID: Record<string, MonsterTemplate> = MONSTERS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<string, MonsterTemplate>
);

export const ITEMS_BY_ID: Record<string, ItemTemplate> = ITEMS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<string, ItemTemplate>
);
