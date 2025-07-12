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
  Check,
  X,
  Trash2,
} from "lucide-react";

// --- TMDB API Helper ---
const tmdbApiKey = import.meta.env.VITE_TMDB_API_KEY;
const tmdbBaseUrl = "https://api.themoviedb.org/3";
const tmdbImageUrl = "https://image.tmdb.org/t/p/w200";

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
      runtime: data.runtime || 0,
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
    const detailedResults = await Promise.all(
      data.results.map((movie) => getMovieDetails(movie.id))
    );
    return detailedResults.filter(Boolean);
  } catch (error) {
    console.error("Error searching TMDB:", error);
    return [];
  }
};
// --- End TMDB API Helper ---

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
  const [nowPlayingMovieDetails, setNowPlayingMovieDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [intermissionTime, setIntermissionTime] = useState(0);
  const [customIntermissionMinutes, setCustomIntermissionMinutes] =
    useState(15);
  const [upNextMovie, setUpNextMovie] = useState(null);
  const [isAddingToPoll, setIsAddingToPoll] = useState(false);
  const [showZeroVotesDialog, setShowZeroVotesDialog] = useState(false);
  const [showCrashConfirmation, setShowCrashConfirmation] = useState(false);
  const [pollVoteCounts, setPollVoteCounts] = useState({});
  const [suggestions, setSuggestions] = useState([]);

  const refreshVoteCounts = async () => {
    if (!partyId) return;
    const { data: allVotesData } = await supabase
      .from("votes")
      .select("movie_tmdb_id")
      .eq("party_id", partyId);
    const counts = allVotesData
      ? allVotesData.reduce((acc, vote) => {
          acc[vote.movie_tmdb_id] = (acc[vote.movie_tmdb_id] || 0) + 1;
          return acc;
        }, {})
      : {};
    setPollVoteCounts(counts);
  };

  const refreshSuggestionData = async () => {
    if (!partyId) return;
    const { data } = await supabase
      .from("suggestions")
      .select("*")
      .eq("party_id", partyId);
    if (data) setSuggestions(data);
  };

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
      } else {
        setParty(data);
      }
      setLoading(false);
    };
    fetchPartyDetails();
    refreshVoteCounts();
    refreshSuggestionData();

    const votesChannel = supabase
      .channel(`dashboard-votes-${partyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "votes",
          filter: `party_id=eq.${partyId}`,
        },
        refreshVoteCounts
      )
      .subscribe();
    const suggestionsChannel = supabase
      .channel(`dashboard-suggestions-${partyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "suggestions",
          filter: `party_id=eq.${partyId}`,
        },
        refreshSuggestionData
      )
      .subscribe();

    return () => {
      supabase.removeChannel(votesChannel);
      supabase.removeChannel(suggestionsChannel);
    };
  }, [partyId]);

  useEffect(() => {
    const fetchAllMovieDetails = async () => {
      if (party) {
        if (party.now_playing_tmdb_id) {
          const details = await getMovieDetails(party.now_playing_tmdb_id);
          setNowPlayingMovieDetails(details);
        } else {
          setNowPlayingMovieDetails(null);
        }
        if (party.up_next_tmdb_id) {
          const upNextDetails = await getMovieDetails(party.up_next_tmdb_id);
          setUpNextMovie(upNextDetails);
        } else {
          setUpNextMovie(null);
        }
        if (party.movies_watched && party.movies_watched.length > 0) {
          const movieDetailsPromises = party.movies_watched.map(
            async (watchedInfo) => {
              const details = await getMovieDetails(watchedInfo.id);
              return details
                ? { ...details, status: watchedInfo.status }
                : null;
            }
          );
          const detailedMovies = await Promise.all(movieDetailsPromises);
          setWatchedMovieDetails(detailedMovies.filter(Boolean));
        } else {
          setWatchedMovieDetails([]);
        }
      }
    };
    fetchAllMovieDetails();
  }, [party]);

  useEffect(() => {
    if (
      party?.party_state?.status === "intermission" &&
      party.party_state.ends_at
    ) {
      const endsAt = new Date(party.party_state.ends_at).getTime();
      const now = new Date().getTime();
      const remaining = Math.round((endsAt - now) / 1000);
      setIntermissionTime(remaining > 0 ? remaining : 0);
    } else {
      setIntermissionTime(0);
    }
  }, [party]);

  useEffect(() => {
    if (intermissionTime > 0) {
      const timer = setTimeout(
        () => setIntermissionTime(intermissionTime - 1),
        1000
      );
      return () => clearTimeout(timer);
    } else if (
      intermissionTime === 0 &&
      party?.party_state?.status === "intermission"
    ) {
      updatePartyStatus({ party_state: { status: "paused" } });
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
    if (!isNaN(duration) && duration > 0) {
      const ends_at = new Date(Date.now() + duration * 60000).toISOString();
      updatePartyStatus({ party_state: { status: "intermission", ends_at } });
    }
  };

  const handleOpenPoll = async () => {
    await supabase.from("votes").delete().eq("party_id", partyId);
    setPollVoteCounts({});
    updatePartyStatus({ voting_open: true });
  };

  // **FIXED**: Rewrote the winner selection logic to be more robust.
  const handleClosePoll = () => {
    if (!party.poll_movies || party.poll_movies.length === 0) return;

    const moviesWithVotes = party.poll_movies.map((movie) => ({
      ...movie,
      votes: pollVoteCounts[movie.id] || 0,
    }));

    const totalVotes = moviesWithVotes.reduce(
      (sum, movie) => sum + movie.votes,
      0
    );

    if (totalVotes === 0) {
      setShowZeroVotesDialog(true);
      return;
    }

    const winner = moviesWithVotes.reduce((prev, current) =>
      prev.votes > current.votes ? prev : current
    );

    if (winner) {
      setUpNextMovie(winner);
      updatePartyStatus({
        voting_open: false,
        up_next_tmdb_id: winner.id,
      });
    }
  };

  const handleSelectRandom = () => {
    const randomIndex = Math.floor(Math.random() * party.poll_movies.length);
    const randomMovie = party.poll_movies[randomIndex];
    setUpNextMovie(randomMovie);
    updatePartyStatus({
      voting_open: false,
      up_next_tmdb_id: randomMovie.id,
    });
    setShowZeroVotesDialog(false);
  };

  const handleCrashFromDialog = () => {
    setShowZeroVotesDialog(false);
    handleCrashParty();
  };

  const handleCancelPoll = () => {
    updatePartyStatus({ voting_open: false });
    setShowZeroVotesDialog(false);
  };

  const handleReturnToPoll = () => {
    setShowZeroVotesDialog(false);
  };

  const handleAddMovieToPoll = (movie) => {
    if (party.poll_movies.length < 10) {
      const newPollMovies = [...party.poll_movies, movie];
      updatePartyStatus({ poll_movies: newPollMovies });
    }
    setIsAddingToPoll(false);
  };

  const handleRemoveFromPoll = (movieIdToRemove) => {
    const newPollMovies = party.poll_movies.filter(
      (movie) => movie.id !== movieIdToRemove
    );
    updatePartyStatus({ poll_movies: newPollMovies });
  };

  const handlePlay = () => {
    if (party?.party_state?.status === "intermission") {
      updatePartyStatus({ party_state: { status: "playing" } });
      return;
    }
    if (nowPlayingMovieDetails) {
      updatePartyStatus({ party_state: { status: "playing" } });
    } else if (upNextMovie) {
      const newPollList = party.poll_movies.filter(
        (movie) => movie.id !== upNextMovie.id
      );
      updatePartyStatus({
        now_playing_tmdb_id: upNextMovie.id,
        poll_movies: newPollList,
        party_state: { status: "playing" },
        up_next_tmdb_id: null,
      });
      setUpNextMovie(null);
    } else {
      setError("No movie is queued up. Please select one from the poll.");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handlePause = () => {
    updatePartyStatus({ party_state: { status: "paused" } });
  };

  const handleFinishMovie = (status) => {
    if (!nowPlayingMovieDetails) return;
    const finishedMovie = {
      id: nowPlayingMovieDetails.id,
      status: status,
    };
    const newWatchedList = [...(party.movies_watched || []), finishedMovie];

    if (party.poll_movies.length > 0 || upNextMovie) {
      updatePartyStatus({
        now_playing_tmdb_id: null,
        movies_watched: newWatchedList,
        voting_open: true,
        party_state: { status: "paused" },
      });
    } else {
      updatePartyStatus({
        now_playing_tmdb_id: null,
        movies_watched: newWatchedList,
        voting_open: false,
        party_state: { status: "paused" },
      });
    }
  };

  const handleMarkAsWatched = () => handleFinishMovie("watched");
  const handleSkipMovie = () => handleFinishMovie("skipped");

  const handleRemoveFromWatched = (indexToRemove) => {
    const currentWatchedList = [...(party.movies_watched || [])];
    currentWatchedList.splice(indexToRemove, 1);
    updatePartyStatus({ movies_watched: currentWatchedList });
  };

  const handleCrashParty = () => {
    if (nowPlayingMovieDetails) {
      setShowCrashConfirmation(true);
    } else {
      updatePartyStatus({
        status: "concluded",
        end_time: new Date().toISOString(),
      });
      onBack();
    }
  };

  const handleConfirmCrash = (markAsWatched) => {
    let updates = {
      status: "concluded",
      end_time: new Date().toISOString(),
    };

    if (markAsWatched && nowPlayingMovieDetails) {
      const finishedMovie = {
        id: nowPlayingMovieDetails.id,
        status: "watched",
      };
      updates.movies_watched = [...(party.movies_watched || []), finishedMovie];
      updates.now_playing_tmdb_id = null;
    }

    updatePartyStatus(updates);
    setShowCrashConfirmation(false);
    onBack();
  };

  const handleCancelCrash = () => {
    setShowCrashConfirmation(false);
  };

  const handleMoveSuggestionToPoll = async (suggestion) => {
    if (party.poll_movies.length >= 10) {
      setError("The movie poll is full.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    const movieToAdd = {
      id: suggestion.movie_tmdb_id,
      title: suggestion.movie_title,
      year: suggestion.movie_year,
      imageUrl: suggestion.movie_image_url,
    };
    const newPollMovies = [...party.poll_movies, movieToAdd];
    await updatePartyStatus({ poll_movies: newPollMovies });

    const { error } = await supabase
      .from("suggestions")
      .delete()
      .eq("id", suggestion.id);
    if (!error) {
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
    }
  };

  if (loading)
    return (
      <div className="text-center text-white pt-40">Loading Dashboard...</div>
    );
  if (!party)
    return <div className="text-center text-white pt-40">Party not found.</div>;

  const formatTimer = (seconds) =>
    `${Math.floor(seconds / 60)}:${("0" + (seconds % 60)).slice(-2)}`;

  const sortedPollMovies = [...(party?.poll_movies || [])].sort((a, b) => {
    const votesA = pollVoteCounts[a.id] || 0;
    const votesB = pollVoteCounts[b.id] || 0;
    return votesB - votesA;
  });

  return (
    <div className="bg-gray-900 min-h-screen pt-24 pb-12">
      {showCrashConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 max-w-sm w-full text-center shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">Crash Party?</h2>
            <p className="text-gray-300 mb-6">
              Would you like to mark "{nowPlayingMovieDetails?.title}" as
              watched before ending the party?
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleConfirmCrash(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                Mark as Watched & Crash
              </button>
              <button
                onClick={() => handleConfirmCrash(false)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                Just Crash Party
              </button>
              <button
                onClick={handleCancelCrash}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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
                onClick={handleCancelPoll}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                Cancel Poll
              </button>
              <button
                onClick={handleCrashFromDialog}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                Crash Party
              </button>
              <button
                onClick={handleReturnToPoll}
                className="w-full bg-transparent hover:bg-gray-700 text-gray-300 font-bold py-2 px-4 rounded-lg"
              >
                Return to Poll
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
                      <button
                        onClick={() => handleRemoveFromWatched(index)}
                        className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))}
                  {party.party_state?.status === "intermission" ? (
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
                    nowPlayingMovieDetails && (
                      <li className="flex items-center justify-between gap-3 border-2 border-green-500 p-2 rounded-lg">
                        <div className="flex items-center gap-3">
                          <img
                            src={nowPlayingMovieDetails.imageUrl}
                            alt={nowPlayingMovieDetails.title}
                            className="w-12 h-18 object-cover rounded"
                          />
                          <div>
                            <p className="font-bold text-white">
                              {nowPlayingMovieDetails.title} (
                              {nowPlayingMovieDetails.year})
                            </p>
                            <p className="text-xs text-gray-400 mb-1">
                              {nowPlayingMovieDetails.runtime} min
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
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={handleMarkAsWatched}
                            className="p-2 bg-green-600 rounded-full text-white hover:bg-green-700"
                            title="Mark as Watched"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={handleSkipMovie}
                            className="p-2 bg-yellow-600 rounded-full text-white hover:bg-yellow-700"
                            title="Skip Movie"
                          >
                            <SkipForward size={16} />
                          </button>
                        </div>
                      </li>
                    )
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
                <h3 className="font-bold text-white mb-4">
                  Dashboard Controls
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {party.party_state?.status === "playing" ? (
                      <button
                        onClick={handlePause}
                        disabled={party.voting_open}
                        className="w-full bg-yellow-600 p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Pause size={20} />
                        <span>Pause</span>
                      </button>
                    ) : (
                      <button
                        onClick={handlePlay}
                        disabled={party.voting_open}
                        className="w-full bg-green-600 p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Play size={20} />
                        <span>Play</span>
                      </button>
                    )}
                    <button
                      onClick={handleCrashParty}
                      className="w-full bg-red-600 p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-red-700"
                    >
                      <XCircle size={20} />
                      <span>Crash Party</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-700">
                    <input
                      type="number"
                      value={customIntermissionMinutes}
                      onChange={(e) =>
                        setCustomIntermissionMinutes(e.target.value)
                      }
                      className="bg-gray-700 border-2 border-gray-600 text-white rounded-lg p-2 w-20 text-center"
                      min="1"
                    />
                    <span className="text-gray-400">min</span>
                    <button
                      onClick={() =>
                        handleStartIntermission(customIntermissionMinutes)
                      }
                      className="bg-gray-600 p-2 rounded-lg flex-grow flex items-center justify-center hover:bg-gray-700"
                    >
                      <Timer size={20} />
                      <span className="ml-2">Set Intermission</span>
                    </button>
                  </div>
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
                        disabled={
                          !party.poll_movies || party.poll_movies.length === 0
                        }
                        className="bg-blue-600 px-3 py-1 rounded-md text-sm font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed"
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

                {party.poll_movies?.length === 0 && !isAddingToPoll ? (
                  <p className="text-gray-400 text-center py-4">
                    The movie poll is empty.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {sortedPollMovies.map((movie) => (
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
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-white">
                            {pollVoteCounts[movie.id] || 0} Votes
                          </span>
                          <button
                            onClick={() => handleRemoveFromPoll(movie.id)}
                            className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {(isAddingToPoll ||
                  (party.poll_movies?.length === 0 && !party.voting_open)) && (
                  <div className="mt-4">
                    <MovieSearchInput
                      onSelect={handleAddMovieToPoll}
                      existingIds={[
                        ...party.poll_movies.map((m) => m.id),
                        party.now_playing_tmdb_id,
                      ]}
                    />
                  </div>
                )}
              </div>
              <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <PlusCircle size={20} /> Viewer Suggestions
                </h3>
                {suggestions.length > 0 ? (
                  <ul className="space-y-2">
                    {suggestions.map((suggestion) => (
                      <li
                        key={suggestion.id}
                        className="bg-gray-800 p-3 rounded-md flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={suggestion.movie_image_url}
                            alt={suggestion.movie_title}
                            className="w-10 h-16 object-cover rounded"
                          />
                          <span className="text-gray-300">
                            {suggestion.movie_title} ({suggestion.movie_year})
                          </span>
                        </div>
                        <button
                          onClick={() => handleMoveSuggestionToPoll(suggestion)}
                          className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition hover:bg-green-700"
                        >
                          Add to Poll
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 text-center py-4">
                    No suggestions from viewers yet.
                  </p>
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
