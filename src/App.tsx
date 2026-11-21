import { useEffect } from 'react';
import { GameBoard } from './components/board/GameBoard';
import { TopBarHud } from './components/layout/TopBarHud';
import { LobbyView } from './components/lobby/LobbyView';
import { CatalogModal } from './components/modals/CatalogModal';
import { GrailAbsorptionBanner } from './components/modals/GrailAbsorptionBanner';
import { RulerControlStrip } from './components/ruler/RulerControlStrip';
import { RulerToolsSidebar } from './components/ruler/RulerToolsSidebar';
import { TilePopover } from './components/ruler/TilePopover';
import { UnitInspectorPanel } from './components/ruler/UnitInspectorPanel';
import {
  subscribeRoomState,
  subscribeRulerSecret,
  subscribeSecretCommands,
} from './services/roomService';
import { useGameStore } from './store/useGameStore';

export function App() {
  const sessionMode = useGameStore((s) => s.sessionMode);
  const activeRoomId = useGameStore((s) => s.activeRoomId);
  const previewRole = useGameStore((s) => s.previewRole);
  const applyRemoteRoomState = useGameStore((s) => s.applyRemoteRoomState);
  const applyRemoteSecretOrders = useGameStore((s) => s.applyRemoteSecretOrders);
  const applyRemoteRulerSecret = useGameStore((s) => s.applyRemoteRulerSecret);

  // Strict Read-Only Firestore Subscriptions with guaranteed cleanup (AntiGravity Guardrails)
  useEffect(() => {
    if (sessionMode !== 'online' || !activeRoomId) return;

    const unsubs: (() => void)[] = [];

    unsubs.push(
      subscribeRoomState(activeRoomId, (room) => {
        applyRemoteRoomState(room);
      })
    );

    if (previewRole === 'ruler') {
      unsubs.push(
        subscribeRulerSecret(activeRoomId, (docData) => {
          applyRemoteRulerSecret(docData);
        })
      );
      unsubs.push(
        subscribeSecretCommands(activeRoomId, 'master_a', (docData) => {
          applyRemoteSecretOrders('master_a', docData);
        })
      );
      unsubs.push(
        subscribeSecretCommands(activeRoomId, 'master_b', (docData) => {
          applyRemoteSecretOrders('master_b', docData);
        })
      );
    } else if (previewRole === 'master_a') {
      unsubs.push(
        subscribeSecretCommands(activeRoomId, 'master_a', (docData) => {
          applyRemoteSecretOrders('master_a', docData);
        })
      );
    } else if (previewRole === 'master_b') {
      unsubs.push(
        subscribeSecretCommands(activeRoomId, 'master_b', (docData) => {
          applyRemoteSecretOrders('master_b', docData);
        })
      );
    }

    return () => {
      for (const unsub of unsubs) {
        unsub();
      }
    };
  }, [
    sessionMode,
    activeRoomId,
    previewRole,
    applyRemoteRoomState,
    applyRemoteSecretOrders,
    applyRemoteRulerSecret,
  ]);

  if (sessionMode === 'lobby') {
    return <LobbyView />;
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#090B10] text-slate-100">
      <TopBarHud />
      <RulerControlStrip />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <RulerToolsSidebar />
        <GameBoard />
        <UnitInspectorPanel />
      </div>
      <CatalogModal />
      <GrailAbsorptionBanner />
      <TilePopover />
    </div>
  );
}

export default App;
