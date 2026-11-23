import { useMemo, useState } from 'react';
import {
  BookOpen,
  Flame,
  Package,
  Search,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react';
import { CLASSES, ITEMS, SERVANTS } from '../../data';
import { useGameStore } from '../../store/useGameStore';
import type { ItemTemplate, ServantClassId, ServantTemplate } from '../../types/game';
import { getClassIconUrl, getInitials, resolveAssetUrl } from '../../utils/assetHelper';
import { isUnitIdentityHidden } from '../../utils/visibilityHelper';

type CatalogTab = 'servants' | 'shop' | 'rules';

function ServantCard({
  servant,
  draftStatus,
}: {
  servant: ServantTemplate;
  draftStatus: 'team_a' | 'team_b' | 'pool';
}) {
  const [imgErr, setImgErr] = useState(false);
  const imgUrl = resolveAssetUrl(servant.image);
  const classIconUrl = getClassIconUrl(servant.servantClass, servant.subClass);

  const badge =
    draftStatus === 'team_a'
      ? { text: 'Team A', cls: 'bg-[#B91C1C] text-slate-100' }
      : draftStatus === 'team_b'
        ? { text: 'Team B', cls: 'bg-sky-700 text-slate-100' }
        : { text: 'In Pool', cls: 'bg-[#090B10] text-slate-400 border border-slate-700' };

  return (
    <div className="flex flex-col rounded-[2px] border border-[#C8A253]/30 bg-[#111622] p-3 transition hover:border-[#C8A253]/70">
      <div className="flex items-start gap-2.5">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[2px] border border-[#C8A253]/40 bg-[#090B10]">
          {imgUrl && !imgErr ? (
            <img
              src={imgUrl}
              alt={servant.name}
              onError={() => setImgErr(true)}
              className="h-full w-full object-cover object-top"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-800 font-display text-xs font-bold text-slate-200">
              {getInitials(servant.name)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <h4
              className="font-display truncate text-sm font-bold tracking-wide text-[#E5C983]"
              title={servant.name}
            >
              {servant.name}
            </h4>
            <span className={`shrink-0 rounded-[2px] px-1.5 py-0.5 text-[10px] font-bold ${badge.cls}`}>
              {badge.text}
            </span>
          </div>

          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
            {classIconUrl && (
              <img
                src={classIconUrl}
                alt={servant.servantClass}
                className="h-4 w-4 rounded-full border border-[#C8A253]/30 bg-[#090B10] object-contain p-0.5"
              />
            )}
            <span>
              {servant.servantClass}
              {servant.subClass ? ` · ${servant.subClass}` : ''}
            </span>
          </div>

          <div className="mt-1.5 grid grid-cols-4 gap-1 rounded-[2px] bg-[#090B10] px-1.5 py-1 text-center text-[10px] font-bold text-slate-200">
            <span>HP {servant.hp}</span>
            <span>ATK {servant.atk}</span>
            <span>MOV {servant.mov}</span>
            <span>RNG {servant.range}</span>
          </div>
        </div>
      </div>

      {/* Skill */}
      <div className="mt-2.5 rounded-[2px] border border-slate-800 bg-[#090B10] p-2 text-[11px]">
        <div className="flex items-center justify-between gap-1 font-bold text-sky-300">
          <span className="font-display flex items-center gap-1 truncate tracking-wide">
            <Sparkles className="h-3 w-3 shrink-0 text-sky-400" />
            {servant.skillName}
          </span>
          <span className="shrink-0 text-[10px] text-sky-400">{servant.skillCost}M</span>
        </div>
        <p className="mt-0.5 leading-snug text-slate-300">{servant.skillDesc}</p>
      </div>

      {/* NP */}
      <div className="clip-tactical-sm mt-1.5 border border-[#C8A253]/35 bg-[#090B10] p-2 text-[11px]">
        <div className="flex items-center justify-between gap-1 font-bold text-[#E5C983]">
          <span className="font-display flex items-center gap-1 truncate tracking-wide">
            <Flame className="h-3 w-3 shrink-0 text-[#B91C1C]" />
            {servant.npName}
          </span>
          <span className="shrink-0 text-[10px] text-[#C8A253]">{servant.npCost}M</span>
        </div>
        <p className="mt-0.5 leading-snug text-slate-200">{servant.npDesc}</p>
      </div>
    </div>
  );
}

function ItemCard({ item }: { item: ItemTemplate }) {
  const [imgErr, setImgErr] = useState(false);
  const iconUrl = resolveAssetUrl(item.icon);

  return (
    <div className="flex items-start gap-3 rounded-[2px] border border-[#C8A253]/30 bg-[#111622] p-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[2px] border border-[#C8A253]/30 bg-[#090B10]">
        {iconUrl && !imgErr ? (
          <img
            src={iconUrl}
            alt={item.name}
            onError={() => setImgErr(true)}
            className="h-10 w-10 object-contain"
          />
        ) : (
          <Package className="h-6 w-6 text-[#C8A253]" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-display text-sm font-bold tracking-wide text-slate-100">
            {item.name}
          </h4>
          <span className="flex shrink-0 items-center gap-1 rounded-[2px] border border-[#C8A253]/40 bg-[#090B10] px-2 py-0.5 text-xs font-bold text-[#C8A253]">
            <img
              src="/assets/items/qp.webp"
              alt="QP"
              className="h-3.5 w-3.5 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            {item.qpCost} QP
          </span>
        </div>
        <span
          className={`mt-1 inline-block rounded-[2px] px-1.5 py-0.5 text-[10px] font-bold uppercase ${
            item.rarity === 'rare'
              ? 'bg-[#B91C1C] text-slate-100'
              : 'bg-slate-800 text-slate-300'
          }`}
        >
          {item.rarity}
        </span>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{item.effectDesc}</p>
      </div>
    </div>
  );
}

export function CatalogModal() {
  const isOpen = useGameStore((s) => s.isCatalogOpen);
  const setCatalogOpen = useGameStore((s) => s.setCatalogOpen);
  const previewRole = useGameStore((s) => s.previewRole);
  const roomState = useGameStore((s) => s.roomState);
  const units = roomState.units;

  const [activeTab, setActiveTab] = useState<CatalogTab>('servants');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<ServantClassId | 'ALL'>('ALL');

  const draftOwnerMap = useMemo(() => {
    const map = new Map<string, 'team_a' | 'team_b'>();
    for (const u of Object.values(units)) {
      if (u.unitType === 'servant' && (u.owner === 'team_a' || u.owner === 'team_b')) {
        // Under True Name Concealment, hide opposing team's unrevealed Servants from Catalog badges
        if (isUnitIdentityHidden(u, previewRole, roomState)) {
          continue;
        }
        map.set(u.templateId, u.owner);
      }
    }
    return map;
  }, [units, previewRole, roomState]);

  const filteredServants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return SERVANTS.filter((s) => {
      if (selectedClass !== 'ALL' && s.servantClass !== selectedClass) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.servantClass.toLowerCase().includes(q) ||
        (s.subClass && s.subClass.toLowerCase().includes(q)) ||
        s.skillName.toLowerCase().includes(q) ||
        s.npName.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedClass]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Servant Catalog & Holy Grail Reference"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#090B10]/85 p-4"
      onClick={() => setCatalogOpen(false)}
    >
      <div
        className="clip-tactical flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden border border-[#C8A253]/45 bg-[#090B10] text-slate-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#C8A253]/25 bg-[#111622] px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[2px] border border-[#C8A253]/50 bg-[#B91C1C] text-slate-100">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold tracking-wider text-[#E5C983]">
                Servant Catalog & Holy Grail Reference
              </h2>
              <p className="text-xs text-slate-400">
                คลังข้อมูล Servant ทั้งหมด {SERVANTS.length} ตน, ร้านค้า Mystic Codes และสรุปกติกา 10×7
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCatalogOpen(false)}
            aria-label="ปิดหน้าต่าง"
            className="rounded-[2px] border border-[#C8A253]/30 bg-[#090B10] p-1.5 text-slate-300 transition hover:border-[#C8A253] hover:text-[#C8A253]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-2 border-b border-[#C8A253]/20 bg-[#111622] px-5 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('servants')}
            className={`font-display flex items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-bold tracking-wider transition ${
              activeTab === 'servants'
                ? 'border-[#C8A253] text-[#E5C983]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Servants ({SERVANTS.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('shop')}
            className={`font-display flex items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-bold tracking-wider transition ${
              activeTab === 'shop'
                ? 'border-[#C8A253] text-[#E5C983]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Mystic Codes (QP Shop)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`font-display flex items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-bold tracking-wider transition ${
              activeTab === 'rules'
                ? 'border-[#C8A253] text-[#E5C983]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Quick Rules
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'servants' && (
            <div>
              {/* Search & Class Filter Bar */}
              <div className="mb-4 flex flex-wrap items-center gap-2.5">
                <div className="relative min-w-[240px] flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อ Servant, สกิล, โฮกุ หรือคลาสย่อย..."
                    className="w-full rounded-[2px] border border-[#C8A253]/30 bg-[#111622] py-1.5 pr-3 pl-9 text-xs font-medium text-slate-100 placeholder:text-slate-500 focus:border-[#C8A253] focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedClass('ALL')}
                    className={`rounded-[2px] border px-2.5 py-1 text-xs font-bold transition ${
                      selectedClass === 'ALL'
                        ? 'border-[#C8A253] bg-[#B91C1C] text-slate-100'
                        : 'border-slate-700 bg-[#111622] text-slate-300 hover:border-[#C8A253]/50'
                    }`}
                  >
                    All ({SERVANTS.length})
                  </button>
                  {CLASSES.map((cls) => (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => setSelectedClass(cls.id)}
                      className={`flex items-center gap-1 rounded-[2px] border px-2.5 py-1 text-xs font-bold transition ${
                        selectedClass === cls.id
                          ? 'border-[#C8A253] bg-[#B91C1C] text-slate-100'
                          : 'border-slate-700 bg-[#111622] text-slate-300 hover:border-[#C8A253]/50'
                      }`}
                    >
                      <img
                        src={cls.icon}
                        alt={cls.label}
                        className="h-3.5 w-3.5 rounded-full bg-[#090B10] object-contain p-0.5"
                      />
                      <span>{cls.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Servants Grid */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {filteredServants.map((s) => (
                  <ServantCard
                    key={s.id}
                    servant={s}
                    draftStatus={draftOwnerMap.get(s.id) ?? 'pool'}
                  />
                ))}
              </div>
              {filteredServants.length === 0 && (
                <div className="py-12 text-center text-sm font-bold text-slate-500">
                  ไม่พบ Servant ที่ตรงกับคำค้นหา
                </div>
              )}
            </div>
          )}

          {activeTab === 'shop' && (
            <div>
              <p className="mb-3 text-xs font-medium text-slate-400">
                สามารถซื้อไอเทมได้เมื่อ Servant ยืนอยู่ที่ช่อง{' '}
                <strong className="text-emerald-400">Safe House / Fuyuki Church</strong>{' '}
                หรือได้รับจากการกำจัดมอนสเตอร์ PvE / Personal Events
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {ITEMS.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-[2px] border border-[#C8A253]/30 bg-[#111622] p-4">
                <h3 className="text-sm font-bold text-[#E5C983]">
                  1. เงื่อนไขการชนะ & จอกศักดิ์สิทธิ์จุติ
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-300">
                  <li>
                    <strong className="text-slate-100">Soul Trigger (ภาชนะจอก 5/5):</strong>{' '}
                    เมื่อมี Servant ถูกกำจัดรวมทั้ง 2 ฝั่งครบ <strong>5 ตน</strong> จอกจุติทันทีที่ Central E4 / F4
                  </li>
                  <li>
                    <strong className="text-slate-100">Secret Turn Trigger:</strong> สุ่มเทิร์นลับ{' '}
                    <strong>10, 11 หรือ 12</strong> (เห็นเฉพาะ Ruler) หากถึงเทิร์นลับจอกจุติทันที
                  </li>
                  <li>
                    <strong className="text-slate-100">ยึดครองจอก / Wipeout:</strong> ยืนคุมช่องจอกครบ{' '}
                    <strong>2 เทิร์นติด</strong> หรือสังหารศัตรูครบ <strong>6/6 ตน</strong> ชนะทันที
                  </li>
                </ul>
              </div>

              <div className="rounded-[2px] border border-[#C8A253]/30 bg-[#111622] p-4">
                <h3 className="text-sm font-bold text-[#E5C983]">
                  2. ระบบภูมิประเทศ 2 ชั้น & Civilization MP (10×7)
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-300">
                  <li>
                    <strong className="text-slate-100">Strict MP & Gate:</strong> งบ MP = ค่า <code>MOV</code> (2.0 / 3.0 MP) ต้องมี MP พอจึงจะก้าวเข้าได้ · ข้าม <strong>Gate 1.0 MP</strong> คงที่
                  </li>
                  <li>
                    <strong className="text-slate-100">ถนน (Road):</strong> <strong>0.5 MP</strong> (วิ่งตามถนนได้ไกล 2 เท่า) · <strong className="text-slate-100">ที่โล่ง (Open):</strong> <strong>1.0 MP</strong>
                  </li>
                  <li>
                    <strong className="text-[#C8A253]">ซากปรักฯ (Ruins):</strong> <strong>1.0 MP</strong> · Cover ลดดาเมจโจมตีปกติ -1
                  </li>
                  <li>
                    <strong className="text-emerald-400">ป่า (Forest):</strong> <strong>1.5 MP</strong> · <strong>Stealth</strong> ซ่อนตัวจากศัตรูนอกป่า & ลดดาเมจตีไกล -1
                  </li>
                  <li>
                    <strong className="text-slate-100">ตึก (Building):</strong> ปีนขึ้น <strong>1.5 MP</strong> / ข้ามตึกติดกัน <strong>1.0 MP</strong> · High Ground <strong>+1 ATK</strong> & ตีไกล <strong>+1 Range</strong>
                  </li>
                  <li>
                    <strong className="text-sky-400">แม่น้ำ (Water):</strong> <strong>2.0 MP</strong> · Exposed รับดาเมจเพิ่ม +1
                  </li>
                </ul>
              </div>

              <div className="rounded-[2px] border border-[#C8A253]/30 bg-[#111622] p-4">
                <h3 className="text-sm font-bold text-[#E5C983]">
                  3. ระบบ Attack ก่อน Move, 3 Stances &amp; Priority 1 → 4
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-300">
                  <li>
                    <strong className="text-rose-300">Attack ก่อน Move (ตัด Move+Attack ออก):</strong>{' '}
                    การโจมตีปกติ/NP/สกิลเล็งเป้าคำนวณใน <strong>Priority 2</strong> จากตำแหน่งยืนปัจจุบันก่อนการเคลื่อนที่ใน <strong>Priority 3</strong>
                  </li>
                  <li>
                    <strong className="text-rose-300">⚔️ Attack Stance:</strong>{' '}
                    ลดดาเมจ 0% (Guard 50%) · เมื่อโดนตีจะ <strong>สวนกลับ 50% ATK</strong> (ขั้นต่ำ 1, ถ้าระยะถึง) · โดนตีแล้วติดชะงักไม่ขยับใน P3
                  </li>
                  <li>
                    <strong className="text-sky-300">🛡️ Defensive Stance:</strong>{' '}
                    ลดดาเมจ <strong>25%</strong> (ถ้ากด Guard รวมเป็น <strong>60%</strong> ปัดลง) · โดนตีแล้วติดชะงักไม่ขยับใน P3
                  </li>
                  <li>
                    <strong className="text-emerald-300">💨 Evade Stance:</strong>{' '}
                    ลดดาเมจ 0% (Guard 50%) · <strong>ไม่ติด ZoC</strong>, โดนตีแล้วยังเดินไปจุด Move ได้ใน P3 (ถ้า <strong>Guard + Evade</strong> ถอยหลัง 1 ช่องนับจากผู้โจมตี)
                  </li>
                  <li>
                    <strong className="text-violet-300">Skill Bonus Action (CD 2T) &amp; 1d6:</strong>{' '}
                    ใช้สกิลคู่ Action หลักได้ · โจมตีปกติ <code>ATK + 1d6</code> (1–2: +0, 3–4: +1, 5–6: <strong className="text-[#E5C983]">+2 CRIT!</strong>)
                  </li>
                  <li>
                    <strong className="text-slate-100">ลำดับเฉลยผล:</strong> P1 (เรย์จู/Guard/บัฟ/เปิด Stance/Tag-Out) → P2 (Combat/NP/สกิลเล็งเป้า + สวนกลับ + PvE Counter) → P3 (Move / Guard+Evade ถอย 1 ช่อง) → P4 (Tile Effects, ลด CD -1 &amp; จบเทิร์น)
                  </li>
                </ul>
              </div>

              <div className="rounded-[2px] border border-[#C8A253]/30 bg-[#111622] p-4">
                <h3 className="text-sm font-bold text-[#E5C983]">
                  4. ZoC, Secret Deployment, ปิดนามแท้ &amp; เรย์จู
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-300">
                  <li>
                    <strong className="text-slate-100">Zone of Control (ZoC):</strong> ยืนติดศัตรู 1 ช่อง การเดินหนีหักงบ{' '}
                    <strong>-1.0 MP</strong> (ขั้นต่ำเหลือ 1.0 MP) — <strong>Assassin และ Evade Stance ไม่ติดโทษ ZoC</strong>
                  </li>
                  <li>
                    <strong className="text-slate-100">Secret Deployment:</strong> หลัง Draft ครบ 6 ตน เข้าเฟส <code>DEPLOYMENT</code> แอบเลือก 3 ตัวจริงและจุดเกิดใน Base Zone แล้วกด Lock พร้อมกัน
                  </li>
                  <li>
                    <strong className="text-slate-100">โหมดปิดนามแท้ (True Name Concealment):</strong>{' '}
                    เมื่อเปิดใช้งาน ฝั่งตรงข้ามจะเห็นเฉพาะคลาส (<code>[Class] ???</code>) จนกว่า Ruler จะกดเปิดเผยหรือถูกกำจัด
                  </li>
                  <li>
                    <strong className="text-slate-100">เรย์จู 1 ขีด:</strong> วาร์ปกลับฐาน / ยกเลิก ZoC / ตีปกติซ้ำ 2 ครั้ง / +3 Mana ·{' '}
                    <strong className="text-slate-100">2 ขีด:</strong> ฟื้น HP เต็ม / Emergency Re-Summon (ฝั่งละ 1 ครั้ง/เกม)
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
