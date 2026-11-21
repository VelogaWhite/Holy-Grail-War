import { GameBoard } from './components/board/GameBoard';
import { TopBarHud } from './components/layout/TopBarHud';
import { CatalogModal } from './components/modals/CatalogModal';
import { GrailAbsorptionBanner } from './components/modals/GrailAbsorptionBanner';
import { RulerControlStrip } from './components/ruler/RulerControlStrip';
import { RulerToolsSidebar } from './components/ruler/RulerToolsSidebar';
import { TilePopover } from './components/ruler/TilePopover';
import { UnitInspectorPanel } from './components/ruler/UnitInspectorPanel';

export function App() {
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
