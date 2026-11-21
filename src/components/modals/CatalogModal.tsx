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
      ? { text: 'Team A', cls: 'bg-rose-600 text-white' }
      : draftStatus === 'team_b'
        ? { text: 'Team B', cls: 'bg-sky-600 text-white' }
        : { text: 'In Pool', cls: 'bg-slate-800 text-slate-300 border border-slate-700' };

  return (
    <div className="flex flex-col rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-sm transition hover:border-amber-400">
      <div className="flex items-start gap-2.5">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 border-slate-700 bg-slate-950">
          {imgUrl && !imgErr ? (
            <img
              src={imgUrl}
              alt={servant.name}
              onError={() => setImgErr(true)}
              className="h-full w-full object-cover object-top"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-800 text-xs font-black text-slate-200">
              {getInitials(servant.name)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <h4 className="truncate text-sm font-black text-slate-100" title={servant.name}>
              {servant.name}
            </h4>
            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${badge.cls}`}>
              {badge.text}
            </span>
          </div>

          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
            {classIconUrl && (
              <img
                src={classIconUrl}
                alt={servant.servantClass}
                className="h-4 w-4 rounded-full border border-amber-400/30 bg-slate-950 object-contain p-0.5"
              />
            )}
            <span>
              {servant.servantClass}
              {servant.subClass ? ` • ${servant.subClass}` : ''}
            </span>
          </div>

          <div className="mt-1.5 grid grid-cols-4 gap-1 rounded bg-slate-950 px-1.5 py-1 text-center text-[10px] font-black text-slate-200">
            <span>HP {servant.hp}</span>
            <span>ATK {servant.atk}</span>
            <span>MOV {servant.mov}</span>
            <span>RNG {servant.range}</span>
          </div>
        </div>
      </div>

      {/* Skill */}
      <div className="mt-2.5 rounded-md border border-slate-800 bg-slate-950/70 p-2 text-[11px]">
        <div className="flex items-center justify-between gap-1 font-extrabold text-cyan-300">
          <span className="flex items-center gap-1 truncate">
            <Sparkles className="h-3 w-3 shrink-0 text-cyan-400" />
            {servant.skillName}
          </span>
          <span className="shrink-0 text-[10px] text-cyan-400">{servant.skillCost}M</span>
        </div>
        <p className="mt-0.5 leading-snug text-slate-300">{servant.skillDesc}</p>
      </div>

      {/* NP */}
      <div className="mt-1.5 rounded-md border border-amber-400/40 bg-amber-950/25 p-2 text-[11px]">
        <div className="flex items-center justify-between gap-1 font-extrabold text-amber-300">
          <span className="flex items-center gap-1 truncate">
            <Flame className="h-3 w-3 shrink-0 text-amber-400" />
            {servant.npName}
          </span>
          <span className="shrink-0 text-[10px] text-amber-400">{servant.npCost}M</span>
        </div>
        <p className="mt-0.5 leading-snug text-amber-100/90">{servant.npDesc}</p>
      </div>
    </div>
  );
}

function ItemCard({ item }: { item: ItemTemplate }) {
  const [imgErr, setImgErr] = useState(false);
  const iconUrl = resolveAssetUrl(item.icon);

  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-900 p-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
        {iconUrl && !imgErr ? (
          <img
            src={iconUrl}
            alt={item.name}
            onError={() => setImgErr(true)}
            className="h-10 w-10 object-contain"
          />
        ) : (
          <Package className="h-6 w-6 text-amber-400" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-black text-slate-100">{item.name}</h4>
          <span className="flex shrink-0 items-center gap-1 rounded-md border border-amber-400/40 bg-amber-400/15 px-2 py-0.5 text-xs font-black text-amber-300">
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
          className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
            item.rarity === 'rare'
              ? 'bg-amber-400 text-slate-950'
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
  const units = useGameStore((s) => s.roomState.units);

  const [activeTab, setActiveTab] = useState<CatalogTab>('servants');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<ServantClassId | 'ALL'>('ALL');

  const draftOwnerMap = useMemo(() => {
    const map = new Map<string, 'team_a' | 'team_b'>();
    for (const u of Object.values(units)) {
      if (u.unitType === 'servant' && (u.owner === 'team_a' || u.owner === 'team_b')) {
        map.set(u.templateId, u.owner);
      }
    }
    return map;
  }, [units]);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs"
      onClick={() => setCatalogOpen(false)}
    >
      <div
        className="flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border-2 border-amber-400/60 bg-slate-950 text-slate-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-400 text-slate-950">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-amber-300">
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
            className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 transition hover:border-amber-400 hover:text-amber-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900 px-5 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('servants')}
            className={`flex items-center gap-1.5 border-b-4 px-4 py-2 text-xs font-black transition ${
              activeTab === 'servants'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Servants ({SERVANTS.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('shop')}
            className={`flex items-center gap-1.5 border-b-4 px-4 py-2 text-xs font-black transition ${
              activeTab === 'shop'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Mystic Codes (QP Shop)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-1.5 border-b-4 px-4 py-2 text-xs font-black transition ${
              activeTab === 'rules'
                ? 'border-amber-400 text-amber-400'
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
                  <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อ Servant, สกิล, โฮกุ หรือคลาสย่อย..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 py-1.5 pr-3 pl-9 text-xs font-semibold text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedClass('ALL')}
                    className={`rounded-md border px-2.5 py-1 text-xs font-bold transition ${
                      selectedClass === 'ALL'
                        ? 'border-amber-400 bg-amber-400 text-slate-950'
                        : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    All ({SERVANTS.length})
                  </button>
                  {CLASSES.map((cls) => (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => setSelectedClass(cls.id)}
                      className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-bold transition ${
                        selectedClass === cls.id
                          ? 'border-amber-400 bg-amber-400 text-slate-950'
                          : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <img
                        src={cls.icon}
                        alt={cls.label}
                        className="h-3.5 w-3.5 rounded-full bg-slate-950 object-contain p-0.5"
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
              <p className="mb-3 text-xs font-semibold text-slate-400">
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
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                <h3 className="text-sm font-black text-amber-400">
                  1. เงื่อนไขการชนะ & จอกศักดิ์สิทธิ์จุติ
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-300">
                  <li>
                    <strong className="text-slate-100">Soul Trigger (ภาชนะจอก 5/5):</strong>{' '}
                    เมื่อมี Servant ถูกกำจัดรวมทั้ง 2 ฝั่งครบ <strong>5 ตน</strong> จอกจุติทันทีที่ Central (4,3)/(5,3)
                  </li>
                  <li>
                    <strong className="text-slate-100">Secret Turn Trigger:</strong> สุ่มเทิร์นลับ <strong>10, 11 หรือ 12</strong> (เห็นเฉพาะ Ruler) หากถึงเทิร์นลับจอกจุติทันที
                  </li>
                  <li>
                    <strong className="text-slate-100">ยึดครองจอก / Wipeout:</strong> ยืนคุมช่องจอกครบ <strong>2 เทิร์นติด</strong> หรือสังหารศัตรูครบ <strong>6/6 ตน</strong> ชนะทันที
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                <h3 className="text-sm font-black text-amber-400">
                  2. ระบบภูมิประเทศ 2 ชั้น (10×7)
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-300">
                  <li><strong className="text-slate-100">ถนน (Road):</strong> 1 MOV • เริ่มเคลื่อนที่จากถนนได้ <strong>+1 MOV</strong></li>
                  <li><strong className="text-slate-100">ตึก (Building):</strong> ปีน 2 MOV / ข้ามตึก 1 MOV • High Ground <strong>+1 ATK</strong>, ตีไกล <strong>+1 Range</strong></li>
                  <li><strong className="text-emerald-400">ป่า (Forest):</strong> 2 MOV • <strong>Stealth</strong> ซ่อนตัวจากศัตรูนอกป่า & ลดดาเมจตีไกล -1</li>
                  <li><strong className="text-amber-300">ซากปรักฯ (Ruins):</strong> 1 MOV • Cover ลดดาเมจโจมตีปกติ -1</li>
                  <li><strong className="text-sky-400">แม่น้ำ (Water):</strong> 2 MOV • Exposed รับดาเมจเพิ่ม +1</li>
                </ul>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                <h3 className="text-sm font-black text-amber-400">
                  3. สูตรต่อสู้ 1d6, Guard & ลำดับ Priority 1 → 4
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-300">
                  <li>
                    <strong className="text-slate-100">โจมตีปกติ:</strong> <code>ATK + 1d6</code> → 1–2 (+0), 3–4 (+1), 5–6 (<strong className="text-amber-400">+2 CRIT!</strong>) • <strong>Guard</strong> ลดดาเมจครึ่งหนึ่ง (ปัดลง)
                  </li>
                  <li>
                    <strong className="text-slate-100">ลำดับเฉลยผล:</strong> P1 (เรย์จู/Guard/Buff/Tag-Out) → P2 (เดินพร้อมกัน + ZoC) → P3 (Combat/NP Anti-Whiff & PvE Counter) → P4 (Tile Effects & จบเทิร์น)
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                <h3 className="text-sm font-black text-amber-400">
                  4. Zone of Control (ZoC) & Command Spells
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-300">
                  <li>
                    <strong className="text-slate-100">ZoC:</strong> ยืนติดศัตรู 1 ช่อง การเดินหนีลด <strong>-1 MOV</strong> (ขั้นต่ำ 1 ช่อง) — <strong>Assassin ไม่ติดโทษ ZoC</strong>
                  </li>
                  <li>
                    <strong className="text-slate-100">เรย์จู 1 ขีด:</strong> วาร์ปกลับฐาน / ยกเลิก ZoC / ตีปกติซ้ำ 2 ครั้ง / +3 Mana
                  </li>
                  <li>
                    <strong className="text-slate-100">เรย์จู 2 ขีด:</strong> ฟื้นฟู HP เต็มหลอด / Emergency Re-Summon (ฝั่งละ 1 ครั้ง/เกม)
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
