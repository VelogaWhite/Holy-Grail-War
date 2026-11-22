import { Gift, X } from 'lucide-react';
import { ITEMS_BY_ID } from '../../data';
import { useGameStore } from '../../store/useGameStore';
import { formatCoordLabel } from '../../utils/assetHelper';

export function QuickPickupToast() {
  const previewRole = useGameStore((s) => s.previewRole);
  const toast = useGameStore((s) => s.pendingPickupToast);
  const pickupItemFromTile = useGameStore((s) => s.pickupItemFromTile);
  const dismissPickupToast = useGameStore((s) => s.dismissPickupToast);

  if (previewRole !== 'ruler' || !toast) return null;

  const item = ITEMS_BY_ID[toast.itemId];
  const isTeamA = toast.teamId === 'team_a';
  const teamLabel = isTeamA ? 'Team A' : 'Team B';

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      <div className="clip-tactical-sm flex items-center gap-3 border border-[#C8A253] bg-[#111622]/95 px-3.5 py-2.5 text-xs text-slate-100 shadow-[0_0_24px_rgba(200,162,83,0.3)] backdrop-blur-sm">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] border border-[#C8A253]/60 bg-[#C8A253]/15 text-[#E5C983]">
          <Gift className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-bold text-[#E5C983]">
            {toast.unitName} ลงช่อง {toast.coords.zone.toUpperCase()}{' '}
            {formatCoordLabel(toast.coords.x, toast.coords.y)} ที่มีไอเทมดรอป!
          </div>
          <div className="text-[10.5px] text-slate-300">
            ไอเทมบนพื้น: <strong className="text-white">{item?.name ?? toast.itemId}</strong>
          </div>
        </div>
        <button
          type="button"
          onClick={() => pickupItemFromTile(toast.coords, toast.teamId)}
          className={`shrink-0 rounded-[2px] border px-2.5 py-1.5 text-[11px] font-bold text-white transition ${
            isTeamA
              ? 'border-red-400/70 bg-[#B91C1C] hover:bg-red-700'
              : 'border-sky-400/70 bg-sky-700 hover:bg-sky-600'
          }`}
        >
          เก็บให้ {teamLabel}
        </button>
        <button
          type="button"
          onClick={dismissPickupToast}
          title="ปิด"
          className="text-slate-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
