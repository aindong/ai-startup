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
    <div className="fixed bottom-5 right-5 w-[300px] bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4 text-white">Controls</h2>
      
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-white">Simulation Speed</span>
          <select 
            className="bg-black/50 text-white border border-white/10 rounded px-2 py-1"
            defaultValue="normal"
            onChange={(e) => onSpeedChange(e.target.value)}
          >
            <option value="slow">Slow</option>
            <option value="normal">Normal</option>
            <option value="fast">Fast</option>
          </select>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-white">Random Walk</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              defaultChecked
              onChange={(e) => onToggleRandomWalk(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
          </label>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-white">Debug Info</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              onChange={(e) => onToggleDebugInfo(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
          </label>
        </div>

        <button 
          className="mt-2 w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          Reset Simulation
        </button>
      </div>
    </div>
  );
} 