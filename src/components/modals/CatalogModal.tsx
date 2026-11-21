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
      ? { text: 'Team A', cls: 'bg-red-600 text-white' }
      : draftStatus === 'team_b'
        ? { text: 'Team B', cls: 'bg-blue-600 text-white' }
        : { text: 'In Pool', cls: 'bg-slate-200 text-slate-700' };

  return (
    <div className="flex flex-col rounded-xl border-2 border-slate-900 bg-white p-3 shadow-xs transition hover:border-orange-500">
      <div className="flex items-start gap-2.5">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 border-slate-900 bg-slate-100">
          {imgUrl && !imgErr ? (
            <img
              src={imgUrl}
              alt={servant.name}
              onError={() => setImgErr(true)}
              className="h-full w-full object-cover object-top"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-800 text-xs font-black text-white">
              {getInitials(servant.name)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <h4 className="truncate text-sm font-black text-slate-950" title={servant.name}>
              {servant.name}
            </h4>
            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${badge.cls}`}>
              {badge.text}
            </span>
          </div>

          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
            {classIconUrl && (
              <img
                src={classIconUrl}
                alt={servant.servantClass}
                className="h-4 w-4 rounded-full bg-slate-900 object-contain p-0.5"
              />
            )}
            <span>
              {servant.servantClass}
              {servant.subClass ? ` • ${servant.subClass}` : ''}
            </span>
          </div>

          <div className="mt-1.5 grid grid-cols-4 gap-1 rounded bg-slate-100 px-1.5 py-1 text-center text-[10px] font-black text-slate-900">
            <span>HP {servant.hp}</span>
            <span>ATK {servant.atk}</span>
            <span>MOV {servant.mov}</span>
            <span>RNG {servant.range}</span>
          </div>
        </div>
      </div>

      {/* Skill */}
      <div className="mt-2.5 rounded-md border border-slate-200 bg-slate-50 p-2 text-[11px]">
        <div className="flex items-center justify-between gap-1 font-extrabold text-slate-900">
          <span className="flex items-center gap-1 truncate">
            <Sparkles className="h-3 w-3 shrink-0 text-sky-600" />
            {servant.skillName}
          </span>
          <span className="shrink-0 text-[10px] text-sky-700">{servant.skillCost}M</span>
        </div>
        <p className="mt-0.5 leading-snug text-slate-700">{servant.skillDesc}</p>
      </div>

      {/* NP */}
      <div className="mt-1.5 rounded-md border border-orange-300 bg-orange-50/70 p-2 text-[11px]">
        <div className="flex items-center justify-between gap-1 font-extrabold text-orange-950">
          <span className="flex items-center gap-1 truncate">
            <Flame className="h-3 w-3 shrink-0 text-orange-600" />
            {servant.npName}
          </span>
          <span className="shrink-0 text-[10px] text-orange-700">{servant.npCost}M</span>
        </div>
        <p className="mt-0.5 leading-snug text-slate-800">{servant.npDesc}</p>
      </div>
    </div>
  );
}

function ItemCard({ item }: { item: ItemTemplate }) {
  const [imgErr, setImgErr] = useState(false);
  const iconUrl = resolveAssetUrl(item.icon);

  return (
    <div className="flex items-start gap-3 rounded-xl border-2 border-slate-900 bg-white p-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-300 bg-slate-50">
        {iconUrl && !imgErr ? (
          <img
            src={iconUrl}
            alt={item.name}
            onError={() => setImgErr(true)}
            className="h-10 w-10 object-contain"
          />
        ) : (
          <Package className="h-6 w-6 text-orange-500" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-black text-slate-950">{item.name}</h4>
          <span className="flex shrink-0 items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-900">
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
              ? 'bg-orange-500 text-white'
              : 'bg-slate-200 text-slate-700'
          }`}
        >
          {item.rarity}
        </span>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-700">{item.effectDesc}</p>
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[1px]"
      onClick={() => setCatalogOpen(false)}
    >
      <div
        className="flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border-2 border-slate-900 bg-slate-50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 bg-white px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-500 text-white">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-950">
                Servant Catalog & Holy Grail Reference
              </h2>
              <p className="text-xs text-slate-500">
                คลังข้อมูล Servant ทั้งหมด {SERVANTS.length} ตน, ร้านค้า Mystic Codes และสรุปกติกา
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCatalogOpen(false)}
            className="rounded-lg border border-slate-300 bg-slate-100 p-1.5 text-slate-700 transition hover:border-slate-900 hover:bg-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-300 bg-white px-5 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('servants')}
            className={`flex items-center gap-1.5 border-b-4 px-4 py-2 text-xs font-black transition ${
              activeTab === 'servants'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
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
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
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
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
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
                    className="w-full rounded-lg border-2 border-slate-300 bg-white py-1.5 pr-3 pl-9 text-xs font-semibold text-slate-950 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedClass('ALL')}
                    className={`rounded-md border px-2.5 py-1 text-xs font-bold transition ${
                      selectedClass === 'ALL'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
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
                          ? 'border-orange-600 bg-orange-500 text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <img
                        src={cls.icon}
                        alt={cls.label}
                        className="h-3.5 w-3.5 rounded-full bg-slate-900 object-contain p-0.5"
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
              <p className="mb-3 text-xs font-semibold text-slate-600">
                สามารถซื้อไอเทมได้เมื่อ Servant ยืนอยู่ที่ช่อง{' '}
                <strong className="text-emerald-700">Safe House / Fuyuki Church</strong>{' '}
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
              <div className="rounded-xl border-2 border-slate-900 bg-white p-4">
                <h3 className="text-sm font-black text-orange-600">1. เงื่อนไขการชนะ (Win Conditions)</h3>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-800">
                  <li>
                    <strong>ยึดครองจอกศักดิ์สิทธิ์ (Grail Conquest):</strong> จอกเกิดเทิร์น 10 กลางโซน Central — ยืนคุมพื้นที่ครบ <strong>2 เทิร์นติด</strong> โดยไม่มีศัตรูในช่องเดียวกัน ชนะทันที
                  </li>
                  <li>
                    <strong>กวาดล้างศัตรู (Total Elimination):</strong> สังหาร Servant ฝ่ายตรงข้ามครบ <strong>4 ตน</strong> (จาก 6 ตน) ชนะทันที
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border-2 border-slate-900 bg-white p-4">
                <h3 className="text-sm font-black text-orange-600">2. สูตรต่อสู้ 1d6 & Guard</h3>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-800">
                  <li>
                    <strong>โจมตีปกติ:</strong> <code>ATK + 1d6 Bonus</code> → ทอย 1–2 (+0), ทอย 3–4 (+1), ทอย 5–6 (<strong>+2 CRIT!</strong>)
                  </li>
                  <li>
                    <strong>Guard (ตั้งรับ):</strong> ลดความเสียหายทั้งหมดในเทิร์นนั้นลงครึ่งหนึ่ง (ปัดเศษดาเมจที่โดนลง เช่น 5 เหลือ 2)
                  </li>
                  <li>
                    <strong>ค่าหัวสังหาร (Bounty):</strong> ฆ่า Servant ศัตรูได้ <strong>+4 Mana</strong> และ <strong>+3 QP</strong> ทันที
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border-2 border-slate-900 bg-white p-4">
                <h3 className="text-sm font-black text-orange-600">3. ลำดับเฉลยผล (Priority 1 → 4)</h3>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-slate-800">
                  <li><strong>Priority 1:</strong> Command Spells, Guard, Buffs & Tag-Out</li>
                  <li><strong>Priority 2:</strong> Simultaneous Movement (เช็ก ZoC ก่อนเดิน; ชนช่องเดียวกันหยุดประจันหน้า)</li>
                  <li><strong>Priority 3:</strong> Combat, Skill, NP (เช็กระยะหลังเป้าหมายเดินจบ — Anti-Whiff) & PvE Counter</li>
                  <li><strong>Priority 4:</strong> Tile Effects (Leyline, QP, Event, Safe House) & อัปเดตจอก/จบเทิร์น</li>
                </ol>
              </div>

              <div className="rounded-xl border-2 border-slate-900 bg-white p-4">
                <h3 className="text-sm font-black text-orange-600">4. Zone of Control (ZoC) & Command Spells</h3>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-800">
                  <li>
                    <strong>ZoC:</strong> หากเริ่มเทิร์นยืนติดศัตรู 1 ช่อง การเดินหนีออกห่างลดระยะเดิน <strong>-1 MOV</strong> (ขั้นต่ำ 1 ช่อง) — <strong>Assassin ไม่ติดโทษ ZoC</strong>
                  </li>
                  <li>
                    <strong>เรย์จู 1 ขีด:</strong> วาร์ปกลับฐาน / ยกเลิก ZoC หนีเต็มระยะ / โจมตีปกติซ้ำ 2 ครั้ง / บวก +3 Mana ทันที
                  </li>
                  <li>
                    <strong>เรย์จู 2 ขีด:</strong> ฟื้นฟู HP เต็มหลอด / ใช้สิทธิ์ Emergency Re-Summon (ฝั่งละ 1 ครั้ง/เกม)
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
