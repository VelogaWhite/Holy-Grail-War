import { GameBoard } from './components/board/GameBoard';
import { LeftRosterSidebar } from './components/layout/LeftRosterSidebar';
import { RightInspectorPreview } from './components/layout/RightInspectorPreview';
import { TopBarHud } from './components/layout/TopBarHud';
import { CatalogModal } from './components/modals/CatalogModal';
import { GrailAbsorptionBanner } from './components/modals/GrailAbsorptionBanner';

export function App() {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#090B10] text-slate-100">
      <TopBarHud />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <LeftRosterSidebar />
        <GameBoard />
        <RightInspectorPreview />
      </div>
      <CatalogModal />
      <GrailAbsorptionBanner />
    </div>
  );
}

export default App;
