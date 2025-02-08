interface ControlPanelProps {
  onSpeedChange: (speed: string) => void;
  onToggleRandomWalk: (enabled: boolean) => void;
  onToggleDebugInfo: (enabled: boolean) => void;
}

export function ControlPanel({ 
  onSpeedChange, 
  onToggleRandomWalk, 
  onToggleDebugInfo 
}: ControlPanelProps) {
  return (
    <div className="w-full bg-slate-900/90 backdrop-blur shadow-xl ring-1 ring-white/10 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-purple-400" />
        Controls
      </h2>
      
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Simulation Speed</span>
            <select 
              className="bg-slate-800 text-white border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              defaultValue="normal"
              onChange={(e) => onSpeedChange(e.target.value)}
            >
              <option value="slow">Slow</option>
              <option value="normal">Normal</option>
              <option value="fast">Fast</option>
            </select>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Random Walk</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                defaultChecked
                onChange={(e) => onToggleRandomWalk(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Debug Info</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                onChange={(e) => onToggleDebugInfo(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>

        <div className="h-px bg-white/10" />

        <button 
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          Reset Simulation
        </button>
      </div>
    </div>
  );
} 