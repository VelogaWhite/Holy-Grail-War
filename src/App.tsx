import { Shield, Swords, Flame } from 'lucide-react';

export function App() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50 p-6 text-slate-950">
      <div className="w-full max-w-lg rounded-xl border-2 border-slate-900 bg-white p-8 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-500 text-white">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              FATE: HOLY GRAIL WAR — VTT
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Phase 0: Pre-Flight Setup Complete
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">
            <Swords className="h-4 w-4" />
            <span>Team A — Red Faction</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-blue-700">
            <Shield className="h-4 w-4" />
            <span>Team B — Blue Faction</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
