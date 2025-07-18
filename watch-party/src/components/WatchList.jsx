import React from "react";
import {
  Clapperboard,
  Timer,
  Check,
  SkipForward,
  Trash2,
  PlayCircle,
  PauseCircle,
} from "lucide-react";

const WatchList = ({
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
  const formatTimer = (seconds) =>
    `${Math.floor(seconds / 60)}:${("0" + (seconds % 60)).slice(-2)}`;

  // Create a reversed copy of the watched movies array to show most recent first
  const reversedWatchedMovies = [...watchedMovies].reverse();

  return (
    <div className="bg-gray-900 p-4 rounded-lg">
      <h3 className="font-bold text-white mb-3 flex items-center gap-2">
        <Clapperboard size={20} /> Watch List
      </h3>
      <ul className="space-y-3">
        {/* Up Next Movie */}
        {upNext && (
          <li className="flex items-center gap-3 border-2 border-dashed border-blue-500 p-2 rounded-lg">
            <img
              src={upNext.imageUrl}
              alt={upNext.title}
              className="w-12 h-18 object-cover rounded"
            />
            <div>
              <p className="font-semibold text-white">
                {upNext.title} ({upNext.year})
              </p>
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
                    <p className="text-sm font-bold text-yellow-400">Paused</p>
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
          )
        )}

        {/* Watched Movies List */}
        {reversedWatchedMovies.map((movie, index) => {
          // The original index is needed for deletion, so we calculate it from the end.
          const originalIndex = watchedMovies.length - 1 - index;
          return (
            <li
              key={movie.id || index}
              className="flex items-center justify-between gap-3 opacity-60"
            >
              <div className="flex items-center gap-3">
                <img
                  src={movie.imageUrl}
                  alt={movie.title}
                  className="w-12 h-18 object-cover rounded"
                />
                <div>
                  <p className="text-sm text-gray-300">
                    {movie.title} ({movie.year})
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
