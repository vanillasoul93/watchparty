import React, { useState, useEffect } from "react";
import { Clapperboard, Timer, Check, SkipForward, Trash2 } from "lucide-react";

const WatchList = ({
  party,
  watchedMovies,
  nowPlaying,
  upNext,
  onRemoveWatched,
  onMarkWatched,
  onSkipMovie,
  playState,
  intermissionTime,
  isConductor,
}) => {
  // --- 1. State for the countdown timer ---
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const formatTimer = (seconds) =>
    `${Math.floor(seconds / 60)}:${("0" + (seconds % 60)).slice(-2)}`;

  // --- NEW Server-Authoritative Timer Logic ---
  useEffect(() => {
    // This effect now calculates the correct time based on the server's timestamps
    const calculateRemainingTime = () => {
      if (!nowPlaying || !party.playback_start_time) {
        return 0;
      }

      const totalDurationSec = nowPlaying.runtime * 60;
      const startTime = new Date(party.playback_start_time).getTime();
      const now = new Date().getTime();
      const elapsedSec = Math.floor((now - startTime) / 1000);

      return Math.max(0, totalDurationSec - elapsedSec);
    };

    let intervalId = null;

    if (party.party_state?.status === "playing") {
      // If playing, start an interval to update the countdown
      intervalId = setInterval(() => {
        setRemainingSeconds(calculateRemainingTime());
      }, 1000);
      // Set initial time right away
      setRemainingSeconds(calculateRemainingTime());
    } else {
      // If paused, just calculate the time once and display it statically
      setRemainingSeconds(calculateRemainingTime());
    }

    // Cleanup the interval
    return () => clearInterval(intervalId);
  }, [party, nowPlaying]); // Reruns whenever the party object or nowPlaying movie changes

  const totalSeconds = nowPlaying ? nowPlaying.runtime * 60 : 0;
  const progressPercentage =
    totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 0;

  const reversedWatchedMovies = [...watchedMovies].reverse();

  return (
    <div className="bg-gray-900 p-4 rounded-lg">
      <h3 className="font-bold text-white mb-3 flex items-center gap-2">
        <Clapperboard size={20} /> Watch List
      </h3>

      {/* --- MODIFIED LINE --- */}
      <ul className="space-y-3 max-h-158 overflow-y-auto pr-2">
        {/* Up Next Movie */}
        {upNext && (
          <li className="flex items-center gap-3 border-2 border-dashed border-blue-500 p-2 rounded-lg">
            <img
              src={upNext.imageUrl}
              alt={upNext.title}
              className="w-18 h-26 object-cover rounded"
            />
            <div>
              <p className="font-semibold text-white">
                {upNext.title} ({upNext.year})
              </p>
              <p className="text-xs text-gray-400 mb-1">{upNext.runtime} min</p>
              <p className="text-sm text-blue-400">Up Next</p>
            </div>
          </li>
        )}

        {/* Now Playing Movie or Intermission Timer */}
        {intermissionTime > 0 ? (
          <li className="flex items-center gap-3 border-2 border-yellow-500 p-2 rounded-lg">
            <Timer size={48} className="text-yellow-400" />
            <div>
              <p className="font-bold text-white">Intermission</p>
              <p className="text-2xl font-bold text-yellow-400">
                {formatTimer(intermissionTime)}
              </p>
            </div>
          </li>
        ) : (
          nowPlaying && (
            // We'll wrap the Now Playing card in a fragment to add the progress bar below it
            <>
              <li className="flex items-center justify-between gap-3 border-2 border-green-500 p-2 rounded-lg">
                <div className="flex items-center gap-3">
                  <img
                    src={nowPlaying.imageUrl}
                    alt={nowPlaying.title}
                    className="w-12 h-18 object-cover rounded"
                  />
                  <div>
                    <p className="font-bold text-white">
                      {nowPlaying.title} ({nowPlaying.year})
                    </p>
                    <p className="text-xs text-gray-400 mb-1">
                      {nowPlaying.runtime} min
                    </p>
                    {playState === "playing" ? (
                      <p className="text-sm font-bold text-green-400">
                        Now Playing
                      </p>
                    ) : (
                      <p className="text-sm font-bold text-yellow-400">
                        Paused
                      </p>
                    )}
                  </div>
                </div>
                {isConductor && (
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={onMarkWatched}
                      className="p-2 bg-green-600 rounded-full text-white hover:bg-green-700"
                      title="Mark as Watched"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={onSkipMovie}
                      className="p-2 bg-yellow-600 rounded-full text-white hover:bg-yellow-700"
                      title="Skip Movie"
                    >
                      <SkipForward size={16} />
                    </button>
                  </div>
                )}
              </li>

              {/* --- 4. JSX for the new progress bar --- */}
              <div className="px-1">
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-green-500 h-2.5 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <p className="text-right text-xs text-gray-400 mt-1">
                  {formatTimer(remainingSeconds)} remaining
                </p>
              </div>
            </>
          )
        )}

        {/* Watched Movies List */}
        {reversedWatchedMovies.map((movie, index) => {
          const originalIndex = watchedMovies.length - 1 - index;
          return (
            <li
              key={`${movie.id}-${originalIndex}`}
              className="flex items-center justify-between gap-3 opacity-60"
            >
              <div className="flex items-center gap-3">
                <img
                  src={movie.imageUrl}
                  alt={movie.title}
                  className="w-18 h-26 object-cover rounded"
                />
                <div>
                  <p className="text-sm text-gray-300">
                    {movie.title} ({movie.year})
                  </p>
                  <p className="text-xs text-gray-400 mb-1">
                    {movie.runtime} min
                  </p>
                  {movie.status === "watched" && (
                    <span className="text-xs font-bold text-green-400">
                      Watched
                    </span>
                  )}
                  {movie.status === "skipped" && (
                    <span className="text-xs font-bold text-yellow-400">
                      Skipped
                    </span>
                  )}
                </div>
              </div>
              {isConductor && (
                <button
                  onClick={() => onRemoveWatched(originalIndex)}
                  className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default WatchList;
