import {
  CheckCircle2,
  CheckSquare,
  LockOpen,
  MapPin,
  Play,
  Shield,
  Square,
  Swords,
  UserPlus,
  X,
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import type { SecretCommandsDoc } from '../../types/game';
import { formatCoordLabel } from '../../utils/assetHelper';

function ReinforcementRequestCard({
  masterKey,
  teamLabel,
  ordersDoc,
}: {
  masterKey: 'master_a' | 'master_b';
  teamLabel: string;
  ordersDoc: SecretCommandsDoc | null;
}) {
  const roomState = useGameStore((s) => s.roomState);
  const approveReinforcement = useGameStore((s) => s.approveReinforcement);
  const dismissReinforcement = useGameStore((s) => s.dismissReinforcement);

  const req = ordersDoc?.reinforcementRequest;
  if (!req) return null;

  const unit = roomState.units[req.unitId];

  return (
    <div className="clip-tactical-sm border border-[#C8A253] bg-[#C8A253]/12 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#E5C983]">
          <UserPlus className="h-3.5 w-3.5 text-[#C8A253]" />
          คำขอส่งตัวสำรอง · {teamLabel}
        </span>
        <button
          type="button"
          onClick={() => dismissReinforcement(masterKey)}
          title="ยกเลิกคำขอ"
          className="text-slate-400 hover:text-red-400"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-200">
        ส่ง <strong className="font-display text-[#E5C983]">{unit?.name ?? req.unitId}</strong>{' '}
        ลงจุด{' '}
        <strong>
          {req.position.zone.toUpperCase()} {formatCoordLabel(req.position.x, req.position.y)}
        </strong>
      </p>
      <button
        type="button"
        onClick={() => approveReinforcement(masterKey)}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-[2px] bg-emerald-700 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-600"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>อนุมัติลงสนาม (Approve)</span>
      </button>
    </div>
  );
}

function DeploymentTeamPreview({
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
  const unlockMasterOrders = useGameStore((s) => s.unlockMasterOrders);
  const isTeamA = teamKey === 'team_a';
  const isLocked = roomState.teams[teamKey].readyLocked;
  const placements = ordersDoc?.deployment?.placements ?? [];

  return (
    <div
      className={`rounded-[2px] border p-2.5 ${
        isTeamA
          ? 'border-[#B91C1C]/60 bg-[#B91C1C]/8'
          : 'border-sky-700/60 bg-sky-950/20'
      }`}
    >
      <div className="mb-1.5 flex items-center justify-between border-b border-slate-800 pb-1">
        <span
          className={`font-display text-xs font-bold tracking-wider ${
            isTeamA ? 'text-red-400' : 'text-sky-400'
          }`}
        >
          {title}
        </span>
        <div className="flex items-center gap-1">
          <span
            className={`rounded-[2px] px-1.5 py-0.5 text-[9px] font-bold uppercase ${
              isLocked
                ? 'border border-emerald-700 bg-emerald-950/60 text-emerald-300'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {isLocked ? 'READY' : 'Selecting...'}
          </span>
          {isLocked && (
            <button
              type="button"
              onClick={() => unlockMasterOrders(masterKey)}
              className="rounded-[2px] border border-[#C8A253]/40 bg-[#090B10] px-1 py-0.5 text-[9px] font-bold text-[#C8A253]"
            >
              Unlock
            </button>
          )}
        </div>
      </div>

      {placements.length === 0 ? (
        <p className="py-1.5 text-[11px] italic text-slate-500">
          รอ Master เลือก 3 ตัวจริงและจุดเกิด...
        </p>
      ) : (
        <div className="space-y-1">
          {placements.map((p) => {
            const u = roomState.units[p.unitId];
            return (
              <div
                key={p.unitId}
                className="flex items-center justify-between rounded-[2px] border border-slate-800 bg-[#090B10] px-2 py-1 text-[11px]"
              >
                <span className="font-display font-bold text-slate-100">
                  {u?.name ?? p.unitId}
                </span>
                <span className="flex items-center gap-0.5 font-mono text-[10px] font-bold text-[#C8A253]">
                  <MapPin className="h-2.5 w-2.5" />
                  {formatCoordLabel(p.position.x, p.position.y)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
  const deployAllAndStartTurn1 = useGameStore((s) => s.deployAllAndStartTurn1);

  const isDeployment = roomState.phase === 'deployment';

  return (
    <div className="space-y-3">
      {/* Mid-Game Reinforcement Requests */}
      <ReinforcementRequestCard
        masterKey="master_a"
        teamLabel="Team A"
        ordersDoc={masterAOrders}
      />
      <ReinforcementRequestCard
        masterKey="master_b"
        teamLabel="Team B"
        ordersDoc={masterBOrders}
      />

      {isDeployment ? (
        <>
          <div className="rounded-[2px] border border-[#C8A253]/40 bg-[#090B10] px-2.5 py-2 text-[11px] text-slate-300">
            <strong className="text-[#E5C983]">เฟสจัดทัพลับ (Deployment):</strong>{' '}
            Master ทั้ง 2 ฝั่งกำลังเลือก 3 ตัวจริงและจุดเกิด (คุณสามารถสลับแท็บไปดู Preview บน Base A / Base B ได้)
          </div>

          <DeploymentTeamPreview
            title="TEAM A DEPLOYMENT"
            teamKey="team_a"
            masterKey="master_a"
            ordersDoc={masterAOrders}
          />
          <DeploymentTeamPreview
            title="TEAM B DEPLOYMENT"
            teamKey="team_b"
            masterKey="master_b"
            ordersDoc={masterBOrders}
          />

          <button
            type="button"
            onClick={() => deployAllAndStartTurn1()}
            className="flex w-full items-center justify-center gap-2 rounded-[2px] border border-[#C8A253] bg-[#B91C1C] py-2.5 font-display text-xs font-bold tracking-widest text-slate-100 transition hover:bg-red-700"
          >
            <Play className="h-4 w-4" />
            <span>Deploy All & Start Turn 1</span>
          </button>
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
