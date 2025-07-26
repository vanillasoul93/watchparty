import React from "react";
import {
  Play,
  Pause,
  XCircle,
  Timer,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

const DashboardControls = ({
  onPlay,
  onPause,
  onCrashParty,
  onSetIntermission,
  onEndIntermission,
  customIntermissionMinutes,
  setCustomIntermissionMinutes,
  playState,
  isVotingOpen,
}) => {
  const handleIntermissionChange = (amount) => {
    const currentValue = parseInt(customIntermissionMinutes, 10) || 0;
    const newValue = Math.max(1, currentValue + amount);
    setCustomIntermissionMinutes(newValue);
  };

  return (
    <div className="bg-gray-900 p-6 rounded-lg">
      <h3 className="font-bold text-white mb-4">Dashboard Controls</h3>

      <div className="grid grid-cols-2 gap-4">
        {playState === "intermission" ? (
          <button
            onClick={onEndIntermission}
            className="col-span-2 h-24 bg-amber-600 text-white p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-amber-700"
          >
            <Timer size={20} />
            <span className="ml-2 text-lg">End Intermission</span>
          </button>
        ) : (
          <>
            {/* --- MODIFIED: Restructured the input cell --- */}
            <div className="flex flex-col items-center justify-center bg-gray-700 rounded-lg p-2">
              {/* 1. New 'relative' container for precise positioning */}
              <div className="relative w-full h-full">
                <input
                  type="number"
                  value={customIntermissionMinutes}
                  onChange={(e) => setCustomIntermissionMinutes(e.target.value)}
                  // Added pr-8 (padding-right) to make space for the buttons
                  className="bg-gray-800 border-2 border-gray-600 text-white rounded-lg p-2 pr-8 w-full h-full text-center text-2xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="1"
                />
                {/* These buttons are now positioned relative to the new container */}
                <div className="absolute right-2 top-0 bottom-0 flex flex-col justify-center">
                  <button
                    onClick={() => handleIntermissionChange(1)}
                    className="px-1 text-gray-400 hover:text-green-400"
                  >
                    <ChevronUp size={20} />
                  </button>
                  <button
                    onClick={() => handleIntermissionChange(-1)}
                    className="px-1 text-gray-400 hover:text-red-400"
                  >
                    <ChevronDown size={20} />
                  </button>
                </div>
              </div>
              <span className="text-gray-400 text-sm mt-1">minute(s)</span>
            </div>

            <button
              onClick={() => onSetIntermission(customIntermissionMinutes)}
              className="bg-gray-700 p-3 rounded-lg flex flex-col items-center justify-center gap-2 w-full h-full text-yellow-400 hover:bg-yellow-900"
            >
              <Timer size={24} />
              <span className="font-semibold">Set Intermission</span>
            </button>
          </>
        )}

        {/* ... The rest of the buttons remain the same ... */}
        {playState === "playing" ? (
          <button
            onClick={onPause}
            disabled={isVotingOpen}
            className="bg-gray-700 p-3 rounded-lg flex flex-col items-center justify-center gap-2 w-full h-full text-yellow-400 hover:bg-yellow-900 disabled:opacity-50"
          >
            <Pause size={24} />
            <span className="font-semibold">Pause</span>
          </button>
        ) : (
          <button
            onClick={onPlay}
            disabled={isVotingOpen}
            className="w-full bg-gray-700 p-3 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-green-900 text-green-400 disabled:opacity-50"
          >
            <Play size={24} />
            <span className="font-semibold">Play</span>
          </button>
        )}

        <button
          onClick={onCrashParty}
          className="bg-gray-700 p-3 w-full rounded-lg flex flex-col items-center justify-center h-full gap-2 text-red-400 hover:bg-red-900"
        >
          <XCircle size={24} />
          <span className="font-semibold">Crash Party</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardControls;
