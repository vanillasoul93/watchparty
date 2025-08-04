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
    <div className="bg-gray-200 p-6 rounded-lg">
      <h3 className="font-bold text-white mb-4">Dashboard Controls</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {/* --- Conditional Intermission Controls --- */}
          {playState === "intermission" ? (
            // If intermission is active, show the "End" button
            <div className="flex items-center flex-col gap-2 w-full">
              <button
                onClick={onEndIntermission}
                className="bg-amber-600 text-white p-2 rounded-lg flex-grow flex w-full h-full items-center justify-center hover:bg-amber-700"
              >
                <Timer size={20} />
                <span className="ml-2">End Intermission</span>
              </button>
            </div>
          ) : (
            // Otherwise, show the inputs to "Set" an intermission
            <div className="flex items-center flex-col gap-2 w-full">
              <div className="flex justify-center items-center flex-col">
                <input
                  type="number"
                  value={customIntermissionMinutes}
                  onChange={(e) => setCustomIntermissionMinutes(e.target.value)}
                  className="bg-gray-700 border-2 border-gray-600 text-white rounded-lg p-2 w-full text-center text-lg"
                  min="1"
                />
                <span className="text-gray-400 text-lg pb-0 mb-0">
                  minute(s)
                </span>
              </div>
              <button
                onClick={() => onSetIntermission(customIntermissionMinutes)}
                className="bg-gray-700 text-amber-400 p-2 rounded-lg flex-grow flex w-full items-center justify-center hover:bg-amber-900"
              >
                <Timer size={20} />
                <span className="ml-2">Set Intermission</span>
              </button>
            </div>
          )}

          <div className="col-span-2 flex flex-col gap-2">
            {playState === "playing" ? (
              <button
                onClick={onPause}
                disabled={isVotingOpen}
                className="bg-gray-700 p-3 rounded-lg flex items-center justify-center gap-2 w-full h-full text-yellow-400 hover:bg-yellow-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Pause size={20} />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={onPlay}
                disabled={isVotingOpen}
                className="w-full h-full bg-gray-700 p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-green-900 text-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play size={20} />
                <span>Play</span>
              </button>
            )}
            <button
              onClick={onCrashParty}
              className="bg-gray-700 p-3 w-full rounded-lg flex items-center text-red-400 justify-center h-full gap-2 hover:bg-red-900"
            >
              <XCircle size={20} />
              <span>Crash Party</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardControls;
