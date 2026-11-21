import type { OwnerId, ServantClassId, SpecialTileType } from '../types/game';

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
        border: 'border-rose-500',
        bg: 'bg-rose-600',
        softBg: 'bg-rose-950/50',
        text: 'text-rose-400',
        badgeBg: 'bg-rose-600 text-white',
        ring: 'ring-rose-500',
        label: 'Team A',
      };
    case 'team_b':
      return {
        border: 'border-sky-500',
        bg: 'bg-sky-600',
        softBg: 'bg-sky-950/50',
        text: 'text-sky-400',
        badgeBg: 'bg-sky-600 text-white',
        ring: 'ring-sky-500',
        label: 'Team B',
      };
    default:
      return {
        border: 'border-amber-600',
        bg: 'bg-stone-700',
        softBg: 'bg-stone-900/70',
        text: 'text-amber-400',
        badgeBg: 'bg-stone-700 text-amber-200',
        ring: 'ring-amber-500',
        label: 'PvE',
      };
  }
}

export function formatCoordLabel(x: number, y: number): string {
  const col = String.fromCharCode(65 + x); // A..J
  return `${col}${y + 1}`;
}

export function getTileKey(zone: string, x: number, y: number): string {
  return `${zone}_${x}_${y}`;
}

export function getSpecialTileEffectText(type: SpecialTileType, manaBonus?: number): string {
  switch (type) {
    case 'leyline':
      return `ได้รับ +${manaBonus ?? 2} Mana ตอนจบเทิร์น (ใช้ได้ทุกเทิร์น)`;
    case 'qp_cache':
      return 'ทอยเต๋า 1d6 รับเงิน QP ตามแต้มที่ออก (รีเซ็ตทุก 3 เทิร์น)';
    case 'personal_event':
      return 'Ruler หมุนวงล้อ Mini-Event เฉพาะตัว (รีเซ็ตทุก 3 เทิร์น)';
    case 'monster_nest':
      return 'จุดเกิดมอนสเตอร์ PvE (เกิดใหม่ทุก 4 เทิร์นหลังถูกกำจัด)';
    case 'safe_house':
      return 'ฟื้นฟู +2 HP ตอนจบเทิร์น และเป็นจุดซื้อ Mystic Codes ด้วย QP';
    case 'grail_site':
      return 'จุดจุติจอกศักดิ์สิทธิ์ (วิญญาณครบ 5/5 หรือถึงเทิร์นลับ 10–12) ยึดครอง 2 เทิร์นติดชนะทันที';
    case 'summoning_altar':
      return 'จ่าย 1 Mana สั่ง Tag-Out สลับตัวสำรองลงช่องนี้จากโซน Central ได้ทันที';
    case 'teleporter':
      return 'จ่าย 2 Mana วาร์ปไปช่องวงเวทคู่กันอีกจุดหนึ่งบนกระดานได้ทันที';
    case 'watchtower':
      return 'ใช้ Action Explore (ฟรี) เปิดเผยศัตรูที่ซ่อนในป่าทั้งโซน หรือส่อง Base ศัตรู 1 เทิร์น';
    case 'workshop':
      return 'จ่าย 3 QP แปะป้าย [ATK+1] หรือ [DEF+1] ให้ Servant นาน 2 เทิร์น (เทิร์นละ 1 ครั้ง)';
    case 'blood_altar':
      return 'ยอมเสีย 3 HP (คงที่) แลกเป็น +3 Mana หรือ +4 QP ทันที (เทิร์นละ 1 ครั้ง)';
    case 'gate':
      return 'ช่องเชื่อมโซน ก้าวข้ามไปโซนถัดไปนับเป็นระยะเดิน 1 ช่องปกติ';
    case 'spawn_a':
      return 'จุดเกิดเริ่มต้นและจุดส่งตัวสำรองของ Team A (Mount Enzo)';
    case 'spawn_b':
      return 'จุดเกิดเริ่มต้นและจุดส่งตัวสำรองของ Team B (Shinto City)';
  }
}
