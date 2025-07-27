import React, { useState } from "react";
import { X, Star, Clock, Youtube, Film, DollarSign } from "lucide-react";

const MovieDetailsModal = ({
  movie,
  onClose,
  onAddToHistory,
  onAddToFavorites,
  isLoading,
}) => {
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  if (!movie) return null;

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return "N/A";
    return `$${amount.toLocaleString()}`;
  };

  return (
    <>
      <div className="fixed inset-0 bg-gray-900/90 flex items-center justify-center z-50 p-4 h-screen">
        <div
          className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(17, 24, 39, 0.9), rgba(17, 24, 39, 1)), url(${movie.backdropUrl})`,
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white z-20"
          >
            <X size={28} />
          </button>

          {isLoading ? (
            <div className="text-white text-center p-20">
              Loading details...
            </div>
          ) : (
            <div className="p-8 md:p-12">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                  <img
                    src={movie.imageUrl}
                    alt={movie.title}
                    className="w-full h-auto object-cover rounded-lg shadow-2xl"
                  />
                </div>
                <div className="md:col-span-2 text-white">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {movie.genres.map((genre) => (
                      <span
                        key={genre.id}
                        className="bg-indigo-600/50 text-indigo-200 text-xs font-semibold px-2.5 py-1 rounded-full"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>

                  <h2 className="text-4xl font-bold mb-2">
                    {movie.title} ({movie.year})
                  </h2>

                  {/* --- MODIFIED: Added Trailer button here --- */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-gray-400">
                    <div className="flex items-center gap-1">
                      <Star size={16} className="text-yellow-400" />
                      <span>{movie.rating} / 10</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      <span>{movie.runtime} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Film size={16} />
                      <span>{movie.originalLanguage.toUpperCase()}</span>
                    </div>
                    {movie.trailerUrl && (
                      <button
                        onClick={() => setIsTrailerOpen(true)}
                        className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Youtube size={16} />
                        <span>Play Trailer</span>
                      </button>
                    )}
                  </div>

                  <p className="text-gray-300 mb-6">{movie.description}</p>

                  {/* --- MOVED: Budget and Box Office are now here --- */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <h4 className="text-sm text-gray-400">Budget</h4>
                      <p className="font-semibold">
                        {formatCurrency(movie.budget)}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm text-gray-400">Box Office</h4>
                      <p className="font-semibold">
                        {formatCurrency(movie.revenue)}
                      </p>
                    </div>
                  </div>

                  <h3 className="font-semibold text-lg mb-3">Cast & Crew</h3>
                  <div className="flex flex-wrap gap-4">
                    {movie.director && (
                      <a
                        href={`https://www.themoviedb.org/person/${movie.director.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-gray-800/50 hover:bg-gray-700/70 p-2 rounded-lg transition-colors"
                      >
                        <img
                          src={
                            movie.director.profileUrl ||
                            "https://placehold.co/100x100/718096/ffffff?text=NA"
                          }
                          alt={movie.director.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-white font-semibold text-sm">
                            {movie.director.name}
                          </p>
                          <p className="text-gray-400 text-xs">Director</p>
                        </div>
                      </a>
                    )}
                    {movie.cast.map((actor) => (
                      <a
                        key={actor.id}
                        href={`https://www.themoviedb.org/person/${actor.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-gray-800/50 hover:bg-gray-700/70 p-2 rounded-lg transition-colors"
                      >
                        <img
                          src={actor.profileUrl}
                          alt={actor.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-white font-semibold text-sm">
                            {actor.name}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {actor.character}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>

                  {/* Buttons at the bottom */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
                    <button
                      onClick={() => onAddToHistory(movie)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg"
                    >
                      Mark as Watched
                    </button>
                    <button
                      onClick={() => alert("Add to Favorites clicked!")}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg"
                    >
                      Favorite
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- NEW: Trailer Popup Overlay --- */}
      {isTrailerOpen && movie.trailerUrl && (
        <div className="fixed inset-0 bg-gray-900/90 bg-opacity-90 flex items-center justify-center z-[60] p-4 h-screen">
          <div className="relative w-full max-w-screen-lg aspect-video">
            <iframe
              src={`${movie.trailerUrl.replace(
                "watch?v=",
                "embed/"
              )}?autoplay=1`}
              title="Movie Trailer"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded-lg"
            ></iframe>
            <button
              onClick={() => setIsTrailerOpen(false)}
              className="absolute -top-10 -right-2 text-white hover:text-gray-400"
            >
              <X size={32} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MovieDetailsModal;
