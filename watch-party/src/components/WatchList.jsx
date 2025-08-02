import React, { useState, useEffect } from "react";
import {
  Clapperboard,
  Timer,
  Check,
  SkipForward,
  Trash2,
  PlayCircle,
  PauseCircle,
} from "lucide-react";
import MovieDetailsModal from "./MovieDetailsModal";
import { getMovieDetailsWithCredits } from "../api/tmdb"; // Import the new API function

const WatchList = ({
  party,
  watchedMovies,
  nowPlaying,
  upNext,
  onRemoveWatched,
  onMarkWatched,
  onSkipMovie,
  intermissionTime,
  isConductor,
  onShowReviewModal,
  onAddToFavorites,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  // --- NEW: State for the movie details modal ---
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);

  const [modalMovieData, setModalMovieData] = useState(null);

  const formatTimer = (seconds) =>
    `${Math.floor(seconds / 60)}:${("0" + (seconds % 60)).slice(-2)}`;

  useEffect(() => {
    const fetchModalData = async () => {
      if (selectedMovieId) {
        setLoadingModal(true);
        const fullDetails = await getMovieDetailsWithCredits(selectedMovieId);
        setModalMovieData(fullDetails);
        setLoadingModal(false);
      } else {
        // This is the key part that hides the modal
        setModalMovieData(null);
      }
    };
    fetchModalData();
  }, [selectedMovieId]);

  // This function is called from the modal to add to history
  const handleAddToHistoryFromModal = (movie) => {
    setSelectedMovieId(null); // This closes the details modal
    onShowReviewModal(movie); // This calls the parent function to open the review modal
  };
  const handleRemoveClick = (e, index) => {
    e.stopPropagation();
    onRemoveWatched(index);
  };

  useEffect(() => {
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
      intervalId = setInterval(() => {
        setRemainingSeconds(calculateRemainingTime());
      }, 1000);
      setRemainingSeconds(calculateRemainingTime());
    } else {
      setRemainingSeconds(calculateRemainingTime());
    }
    return () => clearInterval(intervalId);
  }, [party, nowPlaying]);

  const totalSeconds = nowPlaying ? nowPlaying.runtime * 60 : 0;
  const progressPercentage =
    totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 0;

  const reversedWatchedMovies = [...(watchedMovies || [])].reverse();

  return (
    <>
      {/* --- Render the new Modal --- */}
      <MovieDetailsModal
        movie={modalMovieData}
        onClose={() => setSelectedMovieId(null)}
        onAddToHistory={handleAddToHistoryFromModal}
        onAddToFavorites={onAddToFavorites}
      />
      {/* 1. Make the main container a flex column that takes up the full height of its parent */}
      <div className="bg-gray-900 p-4 rounded-lg flex flex-col max-h-190 h-full">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          <Clapperboard size={20} /> Watch List
        </h3>

        {/* --- Part 1: The Static Top Section --- */}
        <ul className="space-y-3 mb-3">
          {upNext && (
            <li
              onClick={() => setSelectedMovieId(upNext.id)}
              className="bg-gray-900 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/10 hover:ring-2 hover:ring-indigo-500/30 hover:bg-gray-800 flex items-center gap-3 border-2 border-dashed border-blue-500 p-2 rounded-lg cursor-pointer "
            >
              <img
                src={upNext.imageUrl}
                alt={upNext.title}
                className="w-17 h-26 object-cover rounded "
              />
              <div>
                <p className="font-semibold text-white">
                  {upNext.title} ({upNext.year})
                </p>
                <p className="text-xs text-gray-400 mb-1">
                  {upNext.runtime} min
                </p>
                <p className="text-sm font-bold text-blue-400">Up Next</p>
              </div>
            </li>
          )}
          {intermissionTime > 0 ? (
            <li>
              <div className="flex items-center gap-3 border-2 border-yellow-500 pr-3 pt-5 pb-5 rounded-lg">
                <Timer size={75} className="text-yellow-400" />
                <div>
                  <p className="font-bold text-white">Intermission</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {formatTimer(intermissionTime)}
                  </p>
                </div>
              </div>
            </li>
          ) : (
            nowPlaying && (
              <li>
                <div
                  onClick={() => setSelectedMovie(nowPlaying)}
                  className="bg-gray-900 transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-indigo-500/10 hover:ring-2 hover:ring-indigo-500/30 hover:bg-gray-800 flex items-center justify-between gap-3 border-2 border-green-500 p-2 rounded-lg"
                >
                  <div
                    onClick={() => setSelectedMovieId(nowPlaying.id)}
                    className="flex items-center gap-3 "
                  >
                    <img
                      src={nowPlaying.imageUrl}
                      alt={nowPlaying.title}
                      className="w-17 h-26 object-cover rounded"
                    />
                    <div>
                      <p className="font-bold text-white">
                        {nowPlaying.title} ({nowPlaying.year})
                      </p>
                      <p className="text-xs text-gray-400 mb-1">
                        {nowPlaying.runtime} min
                      </p>
                      {party.party_state?.status === "playing" ? (
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
                </div>
                <div className="px-1 mt-2">
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-green-500 h-2.5 rounded-full transition-all duration-1000 ease-linear"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-right text-sm text-gray-400 mt-1">
                    {formatTimer(remainingSeconds)} remaining
                  </p>
                </div>
              </li>
            )
          )}
        </ul>

        {/* A divider that only appears if there's a history to show */}
        {(nowPlaying || upNext) && reversedWatchedMovies.length > 0 && (
          <hr className="border-gray-700 my-3" />
        )}

        {/* --- Part 2: The Scrollable History Section --- */}
        <ul className="space-y-3 overflow-y-auto p-1 flex-grow">
          {reversedWatchedMovies.map((movie, index) => {
            const originalIndex = watchedMovies.length - 1 - index;
            return (
              <li
                key={`${movie.id}-${originalIndex}`}
                className="bg-gray-900 p-3 mr-4 rounded-md flex items-center justify-between transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/10 hover:ring-2 hover:ring-indigo-500/30 hover:bg-gray-800 "
              >
                <div
                  onClick={() => setSelectedMovieId(movie.id)}
                  className="flex items-center gap-3 cursor-pointer "
                >
                  <img
                    src={movie.imageUrl}
                    alt={movie.title}
                    className="w-14 h-[88px] object-cover rounded"
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
    </>
  );
};

export default WatchList;
