import { useEffect } from 'react';
import { GameBoard } from './components/board/GameBoard';
import { PhaseGuideBanner } from './components/layout/PhaseGuideBanner';
import { TopBarHud } from './components/layout/TopBarHud';
import { LobbyView } from './components/lobby/LobbyView';
import { WaitingLobbyView } from './components/lobby/SeatSelector';
import { CatalogModal } from './components/modals/CatalogModal';
import { DiceModal } from './components/modals/DiceModal';
import { DiceToast } from './components/modals/DiceToast';
import { GameLogDrawer } from './components/modals/GameLogDrawer';
import { GrailAbsorptionBanner } from './components/modals/GrailAbsorptionBanner';
import { WheelModal } from './components/modals/WheelModal';
import { QuickCombatModal } from './components/ruler/QuickCombatModal';
import { QuickPickupToast } from './components/ruler/QuickPickupToast';
import { RulerControlStrip } from './components/ruler/RulerControlStrip';
import { RulerToolsSidebar } from './components/ruler/RulerToolsSidebar';
import { TilePopover } from './components/ruler/TilePopover';
import { UnitInspectorPanel } from './components/ruler/UnitInspectorPanel';
import {
  subscribeRoomState,
  subscribeRulerSecret,
  subscribeSecretCommands,
  subscribeToChat,
} from './services/roomService';
import {
  getParticipantRole,
  isRoomGameStarted,
  useGameStore,
} from './store/useGameStore';

export function App() {
  const sessionMode = useGameStore((s) => s.sessionMode);
  const activeRoomId = useGameStore((s) => s.activeRoomId);
  const authUid = useGameStore((s) => s.authUid);
  const roomState = useGameStore((s) => s.roomState);
  const applyRemoteRoomState = useGameStore((s) => s.applyRemoteRoomState);
  const applyRemoteSecretOrders = useGameStore((s) => s.applyRemoteSecretOrders);
  const applyRemoteRulerSecret = useGameStore((s) => s.applyRemoteRulerSecret);
  const applyRemoteChatDoc = useGameStore((s) => s.applyRemoteChatDoc);

  const myOnlineRole =
    sessionMode === 'online'
      ? getParticipantRole(roomState.seats, authUid)
      : 'spectator';

  // 1. Strict Read-Only RoomState & Dedicated Chat Subscriptions (guaranteed cleanup)
  useEffect(() => {
    if (sessionMode !== 'online' || !activeRoomId) return;

    const unsubRoom = subscribeRoomState(activeRoomId, (room) => {
      applyRemoteRoomState(room);
    });
    const unsubChat = subscribeToChat(activeRoomId, (chatDoc) => {
      applyRemoteChatDoc(chatDoc);
    });

    return () => {
      unsubRoom();
      unsubChat();
    };
  }, [sessionMode, activeRoomId, applyRemoteRoomState, applyRemoteChatDoc]);

  // 2. Role-Scoped Secret Document Subscriptions (only active once assigned to a seat)
  useEffect(() => {
    if (sessionMode !== 'online' || !activeRoomId || myOnlineRole === 'spectator') {
      return;
    }

    const unsubs: (() => void)[] = [];

    if (myOnlineRole === 'ruler') {
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
    } else if (myOnlineRole === 'master_a') {
      unsubs.push(
        subscribeSecretCommands(activeRoomId, 'master_a', (docData) => {
          applyRemoteSecretOrders('master_a', docData);
        })
      );
    } else if (myOnlineRole === 'master_b') {
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
    myOnlineRole,
    applyRemoteSecretOrders,
    applyRemoteRulerSecret,
  ]);

  if (sessionMode === 'lobby') {
    return <LobbyView />;
  }

  // Show Waiting Lobby when game hasn't started yet OR user hasn't been assigned a seat
  if (
    sessionMode === 'online' &&
    (!isRoomGameStarted(roomState) || myOnlineRole === 'spectator')
  ) {
    return <WaitingLobbyView />;
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#090B10] text-slate-100">
      <TopBarHud />
      <PhaseGuideBanner />
      <RulerControlStrip />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <RulerToolsSidebar />
        <GameBoard />
        <UnitInspectorPanel />
      </div>
      <CatalogModal />
      <WheelModal />
      <DiceModal />
      <DiceToast />
      <GameLogDrawer />
      <GrailAbsorptionBanner />
      <QuickCombatModal />
      <QuickPickupToast />
      <TilePopover />
    </div>
  );
}

export default App;
