import React from "react";
import { Vote, PlusCircle, Trash2 } from "lucide-react";
import { useAutoAnimate } from "@formkit/auto-animate/react"; // Use the hook

const MoviePoll = ({
  movies,
  voteCounts,
  onOpenPoll,
  onClosePoll,
  onCancelPoll,
  onRemoveFromPoll,
  onAddMovie,
  isVotingOpen,
  isAddingToPoll,
  setIsAddingToPoll,
  SearchComponent,
}) => {
  const [parent] = useAutoAnimate({ duration: 500 }); // Initialize the hook (500ms is a nice, noticeable duration)

  const sortedMovies = [...(movies || [])].sort((a, b) => {
    const votesA = voteCounts[a.id] || 0;
    const votesB = voteCounts[b.id] || 0;
    return votesB - votesA;
  });

  return (
    <div className="bg-gray-900 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        {/* ... Header and buttons remain the same ... */}
        <h3 className="font-bold text-white flex items-center gap-2">
          <Vote size={20} /> Movie Poll
        </h3>
        <div className="flex items-center gap-2">
          {!isVotingOpen && movies?.length < 10 && (
            <button
              onClick={() => setIsAddingToPoll(true)}
              className="bg-gray-600 p-2 rounded-md text-green-400 text-sm font-semibold hover:bg-green-900"
            >
              <PlusCircle size={20} />
            </button>
          )}
          {isVotingOpen ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onCancelPoll}
                className="bg-gray-600 px-3 py-2 rounded-md text-amber-400 text-sm font-semibold hover:bg-yellow-900"
              >
                Cancel Poll
              </button>
              <button
                onClick={onClosePoll}
                className="bg-gray-600 px-3 py-2 rounded-md text-blue-400 text-sm font-semibold hover:bg-blue-900"
              >
                Close Poll
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenPoll}
              disabled={!movies || movies.length === 0}
              className="bg-gray-600 px-3 py-2 rounded-md text-sm text-blue-400 font-semibold hover:bg-blue-900 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              Open Poll
            </button>
          )}
        </div>
      </div>

      {isVotingOpen && (
        <p className="text-green-400 text-sm mb-3">
          Voting is now open for viewers!
        </p>
      )}

      {movies?.length === 0 && !isAddingToPoll ? (
        <p className="text-gray-400 text-center py-4">
          The movie poll is empty.
        </p>
      ) : (
        <ul className="space-y-2" ref={parent}>
          {sortedMovies.map((movie) => (
            <li
              key={movie.id}
              className="bg-gray-800 p-3 rounded-md flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <img
                  src={movie.imageUrl}
                  alt={movie.title}
                  className="w-10 h-16 object-cover rounded"
                />
                <span className="text-gray-300">
                  {movie.title} ({movie.year})
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-white">
                  {voteCounts[movie.id] || 0} Votes
                </span>
                <button
                  onClick={() => onRemoveFromPoll(movie.id)}
                  className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {(isAddingToPoll || (movies?.length === 0 && !isVotingOpen)) && (
        <div className="mt-4">
          <SearchComponent onSelect={onAddMovie} />
        </div>
      )}
    </div>
  );
};

export default MoviePoll;
