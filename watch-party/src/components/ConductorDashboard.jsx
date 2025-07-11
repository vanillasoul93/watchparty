import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/Auth";
import {
  ArrowLeft,
  Play,
  Pause,
  XCircle,
  SkipForward,
  SkipBack,
  Vote,
  Users,
  Clapperboard,
  Timer,
  FilmIcon,
  PlusCircle,
  Search,
} from "lucide-react";

// --- TMDB API Helper ---
const tmdbApiKey = import.meta.env.VITE_TMDB_API_KEY;
const tmdbBaseUrl = "https://api.themoviedb.org/3";
const tmdbImageUrl = "https://image.tmdb.org/t/p/w200";

// Updated to fetch runtime for each movie
const getMovieDetails = async (movieId) => {
  if (!movieId) return null;
  try {
    const response = await fetch(
      `${tmdbBaseUrl}/movie/${movieId}?api_key=${tmdbApiKey}`
    );
    if (!response.ok) throw new Error("Failed to fetch movie details");
    const data = await response.json();
    return {
      id: data.id,
      title: data.title,
      year: data.release_date ? data.release_date.split("-")[0] : "N/A",
      imageUrl: data.poster_path
        ? `${tmdbImageUrl}${data.poster_path}`
        : "https://placehold.co/100x150/1a202c/ffffff?text=No+Image",
      runtime: data.runtime || 0, // Add runtime in minutes
    };
  } catch (error) {
    console.error("Error fetching movie details:", error);
    return null;
  }
};

const searchTMDb = async (query) => {
  if (!query) return [];
  try {
    const response = await fetch(
      `${tmdbBaseUrl}/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(
        query
      )}`
    );
    if (!response.ok) throw new Error("Failed to fetch from TMDB");
    const data = await response.json();
    // Fetch full details for each search result to get runtime
    const detailedResults = await Promise.all(
      data.results.map((movie) => getMovieDetails(movie.id))
    );
    return detailedResults.filter(Boolean); // Filter out any null results from failed fetches
  } catch (error) {
    console.error("Error searching TMDB:", error);
    return [];
  }
};
// --- End TMDB API Helper ---

// Reusable Movie Search Input Component
const MovieSearchInput = ({ onSelect, existingIds = [] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchTerm(query);
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const searchResults = await searchTMDb(query);
    setResults(searchResults.filter((res) => !existingIds.includes(res.id)));
    setLoading(false);
  };

  const handleSelectMovie = (movie) => {
    onSelect(movie);
    setSearchTerm("");
    setResults([]);
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="text-gray-400" size={20} />
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearch}
        className="w-full bg-gray-700 border-2 border-gray-600 text-white rounded-lg p-3 pl-10 focus:ring-2 focus:ring-indigo-500 transition"
        placeholder="Search for a movie to add..."
      />
      {loading && (
        <p className="text-sm text-gray-400 mt-1 pl-2">Searching...</p>
      )}
      {results.length > 0 && (
        <ul className="absolute z-10 w-full bg-gray-800 border-2 border-gray-700 rounded-lg mt-1 max-h-60 overflow-y-auto">
          {results.map((movie) => (
            <li
              key={movie.id}
              onClick={() => handleSelectMovie(movie)}
              className="px-4 py-2 text-white hover:bg-indigo-600 cursor-pointer flex items-center gap-4"
            >
              <img
                src={movie.imageUrl}
                alt={movie.title}
                className="w-10 h-16 object-cover rounded"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "https://placehold.co/40x60/1a202c/ffffff?text=Err";
                }}
              />
              <span>
                {movie.title} ({movie.year})
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const ConductorDashboard = ({ partyId, onBack }) => {
  const { user } = useAuth();
  const [party, setParty] = useState(null);
  const [watchedMovieDetails, setWatchedMovieDetails] = useState([]);
  const [featuredMovieDetails, setFeaturedMovieDetails] = useState(null); // New state for detailed featured movie
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [intermissionTime, setIntermissionTime] = useState(0);
  const [customIntermissionMinutes, setCustomIntermissionMinutes] =
    useState(15);
  const [upNextMovie, setUpNextMovie] = useState(null);
  const [isAddingToPoll, setIsAddingToPoll] = useState(false);
  const [showZeroVotesDialog, setShowZeroVotesDialog] = useState(false);

  // This effect fetches the main party data from your database
  useEffect(() => {
    const fetchPartyDetails = async () => {
      if (!partyId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("watch_parties")
        .select("*")
        .eq("id", partyId)
        .single();
      if (error) {
        setError("Failed to load party details.");
        console.error(error);
      } else {
        setParty(data);
      }
      setLoading(false);
    };
    fetchPartyDetails();
  }, [partyId]);

  // This new effect fetches detailed movie info using the TMDB IDs
  useEffect(() => {
    const fetchAllMovieDetails = async () => {
      if (party) {
        // Fetch details for the featured movie
        if (party.featured_movie_tmdb_id) {
          const details = await getMovieDetails(party.featured_movie_tmdb_id);
          setFeaturedMovieDetails(details);
        }
        // Fetch details for the watched movies list
        if (party.movies_watched && party.movies_watched.length > 0) {
          const movieDetailsPromises = party.movies_watched.map((id) =>
            getMovieDetails(id)
          );
          const detailedMovies = await Promise.all(movieDetailsPromises);
          setWatchedMovieDetails(detailedMovies.filter(Boolean));
        } else {
          setWatchedMovieDetails([]);
        }
      }
    };
    fetchAllMovieDetails();
  }, [party]); // Re-run whenever the party data changes

  useEffect(() => {
    if (intermissionTime > 0) {
      const timer = setTimeout(
        () => setIntermissionTime(intermissionTime - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [intermissionTime]);

  const updatePartyStatus = async (updates) => {
    const { error } = await supabase
      .from("watch_parties")
      .update(updates)
      .eq("id", partyId);
    if (error) {
      setError("Failed to update party.");
    } else {
      setParty((prev) => ({ ...prev, ...updates }));
    }
  };

  const handleStartIntermission = (minutes) => {
    const duration = parseInt(minutes, 10);
    if (!isNaN(duration) && duration > 0) setIntermissionTime(duration * 60);
  };

  const handleOpenPoll = () => updatePartyStatus({ voting_open: true });

  const handleClosePoll = () => {
    if (!party.poll_movies || party.poll_movies.length === 0) return;
    const totalVotes = party.poll_movies.reduce(
      (sum, movie) => sum + (movie.votes || 0),
      0
    );
    if (totalVotes === 0) {
      setShowZeroVotesDialog(true);
      return;
    }
    const winner = party.poll_movies.reduce((prev, current) =>
      (prev.votes || 0) > (current.votes || 0) ? prev : current
    );
    setUpNextMovie(winner);
    updatePartyStatus({ voting_open: false });
  };

  const handleSelectRandom = () => {
    const randomIndex = Math.floor(Math.random() * party.poll_movies.length);
    const randomMovie = party.poll_movies[randomIndex];
    setUpNextMovie(randomMovie);
    updatePartyStatus({ voting_open: false });
    setShowZeroVotesDialog(false);
  };

  const handleCrashFromDialog = () => {
    setShowZeroVotesDialog(false);
    handleCrashParty();
  };

  const handleCancelDialog = () => {
    setShowZeroVotesDialog(false);
  };

  const handleAddMovieToPoll = (movie) => {
    if (party.poll_movies.length < 10) {
      const newPollMovies = [...party.poll_movies, movie];
      updatePartyStatus({ poll_movies: newPollMovies });
    }
    setIsAddingToPoll(false);
  };

  const handleNextMovie = () => {
    if (!upNextMovie) {
      setError("No movie is queued up next. Close a poll to select one.");
      setTimeout(() => setError(""), 5000);
      return;
    }

    const newWatchedList = [
      ...(party.movies_watched || []),
      party.featured_movie_tmdb_id,
    ];
    const newPollList = party.poll_movies.filter(
      (movie) => movie.id !== upNextMovie.id
    );

    updatePartyStatus({
      featured_movie: upNextMovie.title,

      featured_movie_tmdb_id: upNextMovie.id,
      movies_watched: newWatchedList,
      poll_movies: newPollList,
    });

    setUpNextMovie(null);
  };

  const handleCrashParty = () => {
    updatePartyStatus({
      status: "concluded",
      end_time: new Date().toISOString(),
    });
    onBack();
  };

  if (loading)
    return (
      <div className="text-center text-white pt-40">Loading Dashboard...</div>
    );
  if (!party)
    return <div className="text-center text-white pt-40">Party not found.</div>;

  const formatTimer = (seconds) =>
    `${Math.floor(seconds / 60)}:${("0" + (seconds % 60)).slice(-2)}`;

  return (
    <div className="bg-gray-900 min-h-screen pt-24 pb-12">
      {showZeroVotesDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 max-w-sm w-full text-center shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">
              No Votes Received
            </h2>
            <p className="text-gray-300 mb-6">
              The poll has closed with zero votes. What would you like to do?
            </p>
            <div className="space-y-3">
              <button
                onClick={handleSelectRandom}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                Select Random Movie
              </button>
              <button
                onClick={handleCrashFromDialog}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                Crash Party
              </button>
              <button
                onClick={handleCancelDialog}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="container mx-auto px-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-6"
        >
          <ArrowLeft size={20} /> Back to Hub
        </button>
        {error && (
          <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}
        <div className="bg-gray-800 rounded-xl shadow-lg p-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
              <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                  <Clapperboard size={20} /> Watch List
                </h3>
                <ul className="space-y-3">
                  {watchedMovieDetails.map((movie, index) => (
                    <li
                      key={movie.id || index}
                      className="flex items-center gap-3 opacity-60"
                    >
                      <img
                        src={movie.imageUrl}
                        alt={movie.title}
                        className="w-12 h-18 object-cover rounded"
                      />
                      <div>
                        <p className="text-sm text-gray-300">
                          {movie.title} ({movie.year})
                        </p>
                        <p className="text-xs text-gray-400">
                          {movie.runtime} min
                        </p>
                      </div>
                    </li>
                  ))}
                  {featuredMovieDetails && (
                    <li className="flex items-center gap-3 border-2 border-green-500 p-2 rounded-lg">
                      <img
                        src={featuredMovieDetails.imageUrl}
                        alt={featuredMovieDetails.title}
                        className="w-12 h-18 object-cover rounded"
                      />
                      <div>
                        <p className="font-bold text-white">
                          {featuredMovieDetails.title} (
                          {featuredMovieDetails.year})
                        </p>
                        <p className="text-xs text-gray-400 mb-1">
                          {featuredMovieDetails.runtime} min
                        </p>
                        <p className="text-sm font-bold text-green-400">
                          Now Playing
                        </p>
                      </div>
                    </li>
                  )}
                  {upNextMovie && (
                    <li className="flex items-center gap-3 border-2 border-dashed border-blue-500 p-2 rounded-lg">
                      <img
                        src={upNextMovie.imageUrl}
                        alt={upNextMovie.title}
                        className="w-12 h-18 object-cover rounded"
                      />
                      <div>
                        <p className="font-semibold text-white">
                          {upNextMovie.title} ({upNextMovie.year})
                        </p>
                        <p className="text-sm text-blue-400">Up Next</p>
                      </div>
                    </li>
                  )}
                </ul>
              </div>
              <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <Users size={20} /> Viewers (
                  {party.watching_users?.length || 0})
                </h3>
                <ul className="space-y-1 text-gray-300">
                  {party.watching_users?.map((viewer) => (
                    <li key={viewer.userId}>{viewer.username}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:col-span-2 space-y-8">
              <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="font-bold text-white mb-4">Party Controls</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button className="bg-green-600 p-3 rounded-lg flex flex-col items-center justify-center hover:bg-green-700">
                    <Play size={24} />
                    <span>Start Show</span>
                  </button>
                  <button
                    onClick={handleCrashParty}
                    className="bg-red-600 p-3 rounded-lg flex flex-col items-center justify-center hover:bg-red-700"
                  >
                    <XCircle size={24} />
                    <span>Crash Party</span>
                  </button>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <h4 className="font-semibold text-white mb-2">
                    Intermission
                  </h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={customIntermissionMinutes}
                      onChange={(e) =>
                        setCustomIntermissionMinutes(e.target.value)
                      }
                      className="bg-gray-700 border-2 border-gray-600 text-white rounded-lg p-2 w-20 text-center"
                      min="1"
                    />
                    <span className="text-gray-400">minutes</span>
                    <button
                      onClick={() =>
                        handleStartIntermission(customIntermissionMinutes)
                      }
                      className="bg-yellow-600 p-2 rounded-lg flex-grow flex items-center justify-center hover:bg-yellow-700"
                    >
                      <Pause size={20} />
                      <span className="ml-2">Set Intermission</span>
                    </button>
                  </div>
                </div>
                {intermissionTime > 0 && (
                  <div className="mt-4 text-center bg-yellow-500/20 text-yellow-300 p-3 rounded-lg flex items-center justify-center gap-2">
                    <Timer size={20} /> Intermission ends in:{" "}
                    {formatTimer(intermissionTime)}
                  </div>
                )}
              </div>
              <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="font-bold text-white mb-4">Movie Controls</h3>
                <div className="grid grid-cols-3 gap-4">
                  <button className="bg-gray-600 p-3 rounded-lg flex flex-col items-center justify-center hover:bg-gray-700">
                    <SkipBack size={24} />
                    <span>Previous</span>
                  </button>
                  <button
                    onClick={handleNextMovie}
                    className="bg-gray-600 p-3 rounded-lg flex flex-col items-center justify-center hover:bg-gray-700"
                  >
                    <SkipForward size={24} />
                    <span>Next Movie</span>
                  </button>
                </div>
              </div>
              <div className="bg-gray-900 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Vote size={20} /> Movie Poll
                  </h3>
                  <div className="flex items-center gap-2">
                    {!party.voting_open && party.poll_movies?.length < 10 && (
                      <button
                        onClick={() => setIsAddingToPoll(true)}
                        className="bg-gray-600 p-2 rounded-md text-sm font-semibold hover:bg-gray-700"
                      >
                        <PlusCircle size={16} />
                      </button>
                    )}
                    {party.voting_open ? (
                      <button
                        onClick={handleClosePoll}
                        className="bg-red-600 px-3 py-1 rounded-md text-sm font-semibold"
                      >
                        Close Poll
                      </button>
                    ) : (
                      <button
                        onClick={handleOpenPoll}
                        className="bg-blue-600 px-3 py-1 rounded-md text-sm font-semibold"
                      >
                        Open Poll
                      </button>
                    )}
                  </div>
                </div>
                {party.voting_open && (
                  <p className="text-green-400 text-sm mb-3">
                    Voting is now open for viewers!
                  </p>
                )}
                <ul className="space-y-2">
                  {party.poll_movies?.map((movie) => (
                    <li
                      key={movie.id}
                      className="bg-gray-800 p-3 rounded-md flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={movie.imageUrl}
                          alt={movie.title}
                          className="w-10 h-16 object-cover rounded"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://placehold.co/40x60/1a202c/ffffff?text=Err";
                          }}
                        />
                        <span className="text-gray-300">
                          {movie.title} ({movie.year})
                        </span>
                      </div>
                      <span className="font-bold text-white">
                        {movie.votes || 0} Votes
                      </span>
                    </li>
                  ))}
                </ul>
                {isAddingToPoll && (
                  <div className="mt-4">
                    <MovieSearchInput
                      onSelect={handleAddMovieToPoll}
                      existingIds={[
                        ...party.poll_movies.map((m) => m.id),
                        party.featured_movie_tmdb_id,
                      ]}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConductorDashboard;
