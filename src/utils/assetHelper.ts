import type { OwnerId, ServantClassId } from '../types/game';

const SUBCLASS_ICON_MAP: Record<string, string> = {
  ruler: '/assets/classes/ruler.webp',
  avenger: '/assets/classes/avenger.webp',
  'alter ego': '/assets/classes/alter_ego.webp',
  alter_ego: '/assets/classes/alter_ego.webp',
  'moon cancer': '/assets/classes/moon_cancer.webp',
  moon_cancer: '/assets/classes/moon_cancer.webp',
};

const CLASS_ICON_MAP: Record<ServantClassId, string> = {
  Saber: '/assets/classes/saber.webp',
  Archer: '/assets/classes/archer.webp',
  Lancer: '/assets/classes/lancer.webp',
  Rider: '/assets/classes/rider.webp',
  Caster: '/assets/classes/caster.webp',
  Assassin: '/assets/classes/assassin.webp',
  Berserker: '/assets/classes/berserker.webp',
  Extra: '/assets/classes/ruler.webp',
};

export function resolveAssetUrl(path?: string | null): string | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
    return trimmed;
  }
  return `/${trimmed}`;
}

export function getClassIconUrl(servantClass?: ServantClassId, subClass?: string): string | null {
  if (subClass) {
    const key = subClass.trim().toLowerCase();
    if (SUBCLASS_ICON_MAP[key]) {
      return SUBCLASS_ICON_MAP[key];
    }
  }
  if (servantClass && CLASS_ICON_MAP[servantClass]) {
    return CLASS_ICON_MAP[servantClass];
  }
  return null;
}

export function getInitials(name: string): string {
  const cleaned = name.replace(/[()]/g, ' ').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '??';
  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export interface FactionStyle {
  border: string;
  bg: string;
  softBg: string;
  text: string;
  badgeBg: string;
  ring: string;
  label: string;
}

export function getFactionStyle(owner: OwnerId): FactionStyle {
  switch (owner) {
    case 'team_a':
      return {
        border: 'border-red-600',
        bg: 'bg-red-600',
        softBg: 'bg-red-50',
        text: 'text-red-700',
        badgeBg: 'bg-red-600 text-white',
        ring: 'ring-red-500',
        label: 'Team A',
      };
    case 'team_b':
      return {
        border: 'border-blue-600',
        bg: 'bg-blue-600',
        softBg: 'bg-blue-50',
        text: 'text-blue-700',
        badgeBg: 'bg-blue-600 text-white',
        ring: 'ring-blue-500',
        label: 'Team B',
      };
    default:
      return {
        border: 'border-amber-600',
        bg: 'bg-stone-700',
        softBg: 'bg-stone-100',
        text: 'text-stone-800',
        badgeBg: 'bg-stone-700 text-white',
        ring: 'ring-amber-500',
        label: 'PvE',
      };
  }
}

export function formatCoordLabel(x: number, y: number): string {
  const col = String.fromCharCode(65 + x); // A..F
  return `${col}${y + 1}`;
}

export function getTileKey(zone: string, x: number, y: number): string {
  return `${zone}_${x}_${y}`;
}
