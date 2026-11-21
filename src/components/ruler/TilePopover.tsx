import { useEffect, useState } from 'react';
import { CheckCircle2, MapPin, Skull, X } from 'lucide-react';
import { MONSTERS } from '../../data';
import { useGameStore } from '../../store/useGameStore';
import { formatCoordLabel, getTileKey } from '../../utils/assetHelper';

export function TilePopover() {
  const tilePopover = useGameStore((s) => s.tilePopover);
  const setTilePopover = useGameStore((s) => s.setTilePopover);
  const tileOverrides = useGameStore((s) => s.roomState.tileOverrides);
  const toggleTileCleared = useGameStore((s) => s.toggleTileCleared);
  const setTileCustomNote = useGameStore((s) => s.setTileCustomNote);
  const spawnMonster = useGameStore((s) => s.spawnMonster);

  const key = tilePopover
    ? getTileKey(tilePopover.coords.zone, tilePopover.coords.x, tilePopover.coords.y)
    : '';
  const override = key ? tileOverrides[key] : undefined;
  const [noteDraft, setNoteDraft] = useState(override?.customNote ?? '');

  useEffect(() => {
    setNoteDraft(override?.customNote ?? '');
  }, [key, override?.customNote]);

  if (!tilePopover) return null;

  const { coords, clientX, clientY } = tilePopover;
  const coordLabel = formatCoordLabel(coords.x, coords.y);

  // Keep popover inside viewport
  const left = Math.min(clientX, window.innerWidth - 260);
  const top = Math.min(clientY, window.innerHeight - 280);

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
        className="clip-tactical-sm fixed w-60 border border-[#C8A253]/50 bg-[#111622] p-2.5 text-slate-100 shadow-2xl"
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
        <form onSubmit={handleSaveNote} className="mb-2">
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
