import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Gift,
  HelpCircle,
  MapPin,
  Package,
  Skull,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { ITEMS, ITEMS_BY_ID, MONSTERS } from '../../data';
import { useGameStore } from '../../store/useGameStore';
import { formatCoordLabel, getTileKey } from '../../utils/assetHelper';

export function TilePopover() {
  const tilePopover = useGameStore((s) => s.tilePopover);
  const setTilePopover = useGameStore((s) => s.setTilePopover);
  const tileOverrides = useGameStore((s) => s.roomState.tileOverrides);
  const toggleTileCleared = useGameStore((s) => s.toggleTileCleared);
  const setTileCustomNote = useGameStore((s) => s.setTileCustomNote);
  const dropItemOnTile = useGameStore((s) => s.dropItemOnTile);
  const dropRandomItemOnTile = useGameStore((s) => s.dropRandomItemOnTile);
  const pickupItemFromTile = useGameStore((s) => s.pickupItemFromTile);
  const removeItemFromTile = useGameStore((s) => s.removeItemFromTile);
  const spawnMonster = useGameStore((s) => s.spawnMonster);

  const key = tilePopover
    ? getTileKey(tilePopover.coords.zone, tilePopover.coords.x, tilePopover.coords.y)
    : '';
  const override = key ? tileOverrides[key] : undefined;
  const [noteDraft, setNoteDraft] = useState(override?.customNote ?? '');
  const [selectedItemId, setSelectedItemId] = useState(ITEMS[0]?.id ?? '');
  const [isMystery, setIsMystery] = useState(false);

  useEffect(() => {
    setNoteDraft(override?.customNote ?? '');
  }, [key, override?.customNote]);

  if (!tilePopover) return null;

  const { coords, clientX, clientY } = tilePopover;
  const coordLabel = formatCoordLabel(coords.x, coords.y);
  const droppedItem = override?.droppedItemId
    ? ITEMS_BY_ID[override.droppedItemId] ?? null
    : null;

  // Keep popover safely inside viewport
  const left = Math.min(clientX, window.innerWidth - 284);
  const top = Math.min(clientY, window.innerHeight - 460);

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    setTileCustomNote(coords, noteDraft);
    setTilePopover(null);
  };

  return (
    <div
      className="fixed inset-0 z-50"
      onClick={() => setTilePopover(null)}
      onContextMenu={(e) => {
        e.preventDefault();
        setTilePopover(null);
      }}
    >
      <div
        style={{ left: Math.max(8, left), top: Math.max(8, top) }}
        onClick={(e) => e.stopPropagation()}
        className="clip-tactical-sm fixed max-h-[88vh] w-[268px] overflow-y-auto border border-[#C8A253]/50 bg-[#111622] p-2.5 text-slate-100 shadow-2xl"
      >
        <div className="mb-2 flex items-center justify-between border-b border-slate-800 pb-1">
          <span className="font-display text-xs font-bold tracking-wider text-[#E5C983]">
            TILE {coords.zone.toUpperCase()} · {coordLabel}
          </span>
          <button
            type="button"
            onClick={() => setTilePopover(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Toggle Cleared */}
        <button
          type="button"
          onClick={() => {
            toggleTileCleared(coords);
            setTilePopover(null);
          }}
          className="mb-2 flex w-full items-center justify-center gap-1.5 rounded-[2px] border border-slate-700 bg-[#090B10] py-1.5 text-[11px] font-bold text-slate-200 transition hover:border-[#C8A253] hover:text-[#E5C983]"
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-[#C8A253]" />
          <span>{override?.cleared ? 'Restore Tile (ลบ CLEARED)' : 'Mark Cleared'}</span>
        </button>

        {/* Custom GM Note */}
        <form onSubmit={handleSaveNote} className="mb-2.5">
          <label className="mb-1 flex items-center gap-1 text-[10px] font-bold text-slate-400">
            <MapPin className="h-3 w-3 text-[#C8A253]" />
            GM Custom Note
          </label>
          <div className="flex gap-1">
            <input
              type="text"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="เช่น Grail Mud -1 HP"
              className="min-w-0 flex-1 rounded-[2px] border border-slate-700 bg-[#090B10] px-2 py-1 text-[11px] text-slate-100 placeholder:text-slate-600 focus:border-[#C8A253] focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-[2px] bg-[#C8A253] px-2 py-1 text-[10px] font-bold text-[#090B10] hover:bg-[#E5C983]"
            >
              บันทึก
            </button>
          </div>
        </form>

        {/* Tile Item Drops Section */}
        <div className="mb-2.5 border-t border-slate-800 pt-2">
          <div className="mb-1.5 flex items-center gap-1 text-[10px] font-bold text-[#E5C983]">
            <Gift className="h-3 w-3 text-[#C8A253]" />
            วางไอเทมบนช่องนี้ (Drop Item)
          </div>

          {droppedItem ? (
            <div className="space-y-1.5 rounded-[2px] border border-[#C8A253]/50 bg-[#090B10] p-2">
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#E5C983]">
                    <Package className="h-3 w-3 shrink-0 text-[#C8A253]" />
                    <span className="truncate">{droppedItem.name}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[9.5px] text-slate-400">
                    <span className="uppercase">{droppedItem.rarity}</span>
                    {override?.isMysteryDrop && (
                      <span className="flex items-center gap-0.5 rounded-[2px] border border-amber-500/50 bg-amber-950/60 px-1 text-amber-300">
                        <HelpCircle className="h-2.5 w-2.5" /> ปริศนา (?)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    pickupItemFromTile(coords, 'team_a');
                    setTilePopover(null);
                  }}
                  className="rounded-[2px] border border-[#B91C1C]/70 bg-[#B91C1C]/25 py-1 text-[10px] font-bold text-red-200 transition hover:bg-[#B91C1C]"
                >
                  เก็บเข้า Team A
                </button>
                <button
                  type="button"
                  onClick={() => {
                    pickupItemFromTile(coords, 'team_b');
                    setTilePopover(null);
                  }}
                  className="rounded-[2px] border border-sky-600/70 bg-sky-950/50 py-1 text-[10px] font-bold text-sky-200 transition hover:bg-sky-700"
                >
                  เก็บเข้า Team B
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  removeItemFromTile(coords);
                  setTilePopover(null);
                }}
                className="flex w-full items-center justify-center gap-1 rounded-[2px] border border-slate-700 bg-[#111622] py-1 text-[10px] font-semibold text-slate-400 transition hover:border-red-600 hover:text-red-300"
              >
                <Trash2 className="h-3 w-3" />
                <span>ลบไอเทมออกจากพื้น</span>
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex gap-1">
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="min-w-0 flex-1 rounded-[2px] border border-slate-700 bg-[#090B10] px-1.5 py-1 text-[10.5px] text-slate-200 focus:border-[#C8A253] focus:outline-none"
                >
                  {ITEMS.map((it) => (
                    <option key={it.id} value={it.id}>
                      [{it.rarity === 'rare' ? 'Rare' : 'C'}] {it.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    dropItemOnTile(coords, selectedItemId, isMystery);
                    setTilePopover(null);
                  }}
                  className="shrink-0 rounded-[2px] bg-[#C8A253] px-2 py-1 text-[10px] font-bold text-[#090B10] hover:bg-[#E5C983]"
                >
                  วาง
                </button>
              </div>

              <label className="flex cursor-pointer items-center gap-1.5 text-[10px] text-slate-300">
                <input
                  type="checkbox"
                  checked={isMystery}
                  onChange={(e) => setIsMystery(e.target.checked)}
                  className="h-3 w-3 accent-[#C8A253]"
                />
                <span>ซ่อนเป็นหีบปริศนา (?)</span>
              </label>

              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    dropRandomItemOnTile(coords, 'common', isMystery);
                    setTilePopover(null);
                  }}
                  className="flex items-center justify-center gap-1 rounded-[2px] border border-slate-700 bg-[#090B10] py-1 text-[10px] font-bold text-slate-200 transition hover:border-[#C8A253] hover:text-[#E5C983]"
                >
                  <Sparkles className="h-2.5 w-2.5 text-slate-400" />
                  <span>สุ่ม Common</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    dropRandomItemOnTile(coords, 'rare', isMystery);
                    setTilePopover(null);
                  }}
                  className="flex items-center justify-center gap-1 rounded-[2px] border border-[#C8A253]/50 bg-[#C8A253]/10 py-1 text-[10px] font-bold text-[#E5C983] transition hover:bg-[#C8A253]/25"
                >
                  <Sparkles className="h-2.5 w-2.5 text-[#C8A253]" />
                  <span>สุ่ม Rare</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Spawn Monster Here */}
        <div className="border-t border-slate-800 pt-2">
          <div className="mb-1 flex items-center gap-1 text-[10px] font-bold text-slate-400">
            <Skull className="h-3 w-3 text-[#C8A253]" />
            Spawn Monster Here
          </div>
          <div className="grid grid-cols-2 gap-1">
            {MONSTERS.map((mon) => (
              <button
                key={mon.id}
                type="button"
                onClick={() => spawnMonster(mon.id, coords)}
                className="truncate rounded-[2px] border border-slate-800 bg-[#090B10] px-1.5 py-1 text-left text-[10px] font-semibold text-slate-300 hover:border-[#C8A253]/60 hover:text-[#E5C983]"
              >
                T{mon.tier} {mon.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
