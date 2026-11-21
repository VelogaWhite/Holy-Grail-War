import { CheckSquare, LockOpen, Shield, Square, Swords } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import type { SecretCommandsDoc } from '../../types/game';
import { formatCoordLabel } from '../../utils/assetHelper';

function TeamOrdersBlock({
  title,
  teamKey,
  masterKey,
  ordersDoc,
}: {
  title: string;
  teamKey: 'team_a' | 'team_b';
  masterKey: 'master_a' | 'master_b';
  ordersDoc: SecretCommandsDoc | null;
}) {
  const roomState = useGameStore((s) => s.roomState);
  const checkedOrderIds = useGameStore((s) => s.checkedOrderIds);
  const toggleCheckedOrder = useGameStore((s) => s.toggleCheckedOrder);
  const unlockMasterOrders = useGameStore((s) => s.unlockMasterOrders);

  const isTeamA = teamKey === 'team_a';
  const isLocked = roomState.teams[teamKey].readyLocked;
  const orders = ordersDoc?.orders ?? [];

  return (
    <div
      className={`rounded-[2px] border p-2.5 ${
        isTeamA
          ? 'border-[#B91C1C]/60 bg-[#B91C1C]/8'
          : 'border-sky-700/60 bg-sky-950/20'
      }`}
    >
      <div className="mb-2 flex items-center justify-between border-b border-slate-800 pb-1.5">
        <div className="flex items-center gap-1.5">
          {isTeamA ? (
            <Swords className="h-3.5 w-3.5 text-red-400" />
          ) : (
            <Shield className="h-3.5 w-3.5 text-sky-400" />
          )}
          <span
            className={`font-display text-xs font-bold tracking-wider ${
              isTeamA ? 'text-red-400' : 'text-sky-400'
            }`}
          >
            {title}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`rounded-[2px] px-1.5 py-0.5 text-[9.5px] font-bold uppercase ${
              isLocked
                ? 'border border-emerald-700 bg-emerald-950/60 text-emerald-300'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {isLocked ? 'LOCKED' : 'Waiting'}
          </span>
          {isLocked && (
            <button
              type="button"
              onClick={() => unlockMasterOrders(masterKey)}
              title="ปลดล็อกให้ Master แก้คำสั่งใหม่"
              className="flex items-center gap-0.5 rounded-[2px] border border-[#C8A253]/40 bg-[#090B10] px-1.5 py-0.5 text-[9.5px] font-bold text-[#C8A253] hover:bg-[#C8A253]/15"
            >
              <LockOpen className="h-2.5 w-2.5" />
              <span>Unlock</span>
            </button>
          )}
        </div>
      </div>

      {orders.length === 0 ? (
        <p className="py-2 text-center text-[11px] italic text-slate-500">
          ยังไม่มีคำสั่งลับที่ส่งเข้ามาในเทิร์นนี้
        </p>
      ) : (
        <div className="space-y-1.5">
          {orders.map((ord) => {
            const unit = roomState.units[ord.unitId];
            const targetUnit = ord.targetUnitId
              ? roomState.units[ord.targetUnitId]
              : null;
            const checkKey = `${masterKey}-${roomState.turn}-${ord.unitId}`;
            const checked = Boolean(checkedOrderIds[checkKey]);

            return (
              <button
                key={ord.unitId}
                type="button"
                onClick={() => toggleCheckedOrder(checkKey)}
                className={`flex w-full items-start gap-2 rounded-[2px] border p-2 text-left transition ${
                  checked
                    ? 'border-emerald-800/70 bg-emerald-950/25 opacity-65'
                    : 'border-slate-800 bg-[#090B10] hover:border-[#C8A253]/40'
                }`}
              >
                {checked ? (
                  <CheckSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                ) : (
                  <Square className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-display truncate text-[11px] font-bold text-slate-100">
                      {unit?.name ?? ord.unitId}
                    </span>
                    <span className="shrink-0 rounded-[2px] border border-[#C8A253]/35 bg-[#111622] px-1.5 py-px font-display text-[9px] font-bold uppercase text-[#E5C983]">
                      {ord.actionType.replace('_', ' ')}
                    </span>
                  </div>

                  {ord.targetPosition && (
                    <div className="mt-0.5 text-[10.5px] font-semibold text-[#C8A253]">
                      → {ord.targetPosition.zone.toUpperCase()}{' '}
                      {formatCoordLabel(ord.targetPosition.x, ord.targetPosition.y)}
                      {targetUnit ? ` (${targetUnit.name})` : ''}
                    </div>
                  )}

                  {ord.note && (
                    <div className="mt-0.5 text-[10.5px] text-slate-300">
                      “{ord.note}”
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SecretOrdersViewer() {
  const masterAOrders = useGameStore((s) => s.masterAOrders);
  const masterBOrders = useGameStore((s) => s.masterBOrders);
  const roomState = useGameStore((s) => s.roomState);

  return (
    <div className="space-y-3">
      <div className="rounded-[2px] border border-slate-800 bg-[#090B10] px-2.5 py-1.5 text-[10.5px] text-slate-400">
        <strong className="text-[#E5C983]">Priority 1 → 4:</strong> P1 เรย์จู/Guard/Buff/Tag-Out →
        P2 เดินพร้อมกัน → P3 Combat/NP → P4 Tile Effects (ติ๊กเช็กเมื่อเฉลยแล้ว)
      </div>

      <TeamOrdersBlock
        title={`TEAM A ORDERS · T${roomState.turn}`}
        teamKey="team_a"
        masterKey="master_a"
        ordersDoc={masterAOrders}
      />

      <TeamOrdersBlock
        title={`TEAM B ORDERS · T${roomState.turn}`}
        teamKey="team_b"
        masterKey="master_b"
        ordersDoc={masterBOrders}
      />
    </div>
  );
}
