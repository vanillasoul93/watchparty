import React from "react";
import { Play, Pause, XCircle, Timer } from "lucide-react";

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
  return (
    <div className="bg-gray-900 p-6 rounded-lg">
      <h3 className="font-bold text-white mb-4">Dashboard Controls</h3>
      <div className="space-y-4">
        {playState === "intermission" ? (
          <button
            onClick={onEndIntermission}
            className="h-12 bg-amber-600 text-white px-3 rounded-lg flex-grow flex w-full items-center justify-center gap-2 hover:bg-amber-700"
          >
            <Timer size={20} />
            <span className="ml-2">End Intermission</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={customIntermissionMinutes}
              onChange={(e) => setCustomIntermissionMinutes(e.target.value)}
              className="h-12 w-24 bg-gray-700 border-2 border-gray-600 text-white rounded-lg p-2 text-center text-lg"
              min="1"
            />
            {/* --- NEW: Label is now a flex item --- */}
            <span className="text-gray-400 text-sm">minute(s)</span>
            <button
              onClick={() => onSetIntermission(customIntermissionMinutes)}
              className="h-12 w-full bg-gray-700 rounded-lg flex items-center justify-center gap-2 text-yellow-400 hover:bg-yellow-900"
            >
              <Timer size={20} />
              <span className="ml-2">Set Intermission</span>
            </button>
          </div>
        )}

        {/* Play/Pause Button */}
        {playState === "playing" ? (
          <button
            onClick={onPause}
            disabled={isVotingOpen}
            className="h-12 bg-gray-700 rounded-lg flex items-center justify-center gap-2 w-full text-yellow-400 hover:bg-yellow-900 disabled:opacity-50"
          >
            <Pause size={20} />
            <span>Pause</span>
          </button>
        ) : (
          <button
            onClick={onPlay}
            disabled={isVotingOpen}
            className="h-12 w-full bg-gray-700 rounded-lg flex items-center justify-center gap-2 hover:bg-green-900 text-green-400 disabled:opacity-50"
          >
            <Play size={20} />
            <span>Play</span>
          </button>
        )}

        {/* Crash Party Button */}
        <button
          onClick={onCrashParty}
          className="h-12 bg-gray-700 w-full rounded-lg flex items-center text-red-400 justify-center gap-2 hover:bg-red-900"
        >
          <XCircle size={20} />
          <span>Crash Party</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardControls;
