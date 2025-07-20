import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/Auth";
import { useParams, useNavigate } from "react-router-dom";
import { getMovieDetails, searchTMDb } from "../api/tmdb";
import WatchList from "./WatchList";
import DashboardControls from "./DashboardControls";
import MoviePoll from "./MoviePoll";
import ViewerSuggestions from "./ViewerSuggestions";
import ViewersList from "./ViewersList";
import ReviewMovieModal from "./ReviewMovieModal";
import { ArrowLeft, Search } from "lucide-react";

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

const ConductorDashboard = () => {
  const { partyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userProfileRef = useRef();

  const [party, setParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [watchedMovieDetails, setWatchedMovieDetails] = useState([]);
  const [nowPlayingMovieDetails, setNowPlayingMovieDetails] = useState(null);
  const [upNextMovie, setUpNextMovie] = useState(null);
  const [customIntermissionMinutes, setCustomIntermissionMinutes] =
    useState(15);
  const [intermissionTime, setIntermissionTime] = useState(0);
  const [pollVoteCounts, setPollVoteCounts] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [viewers, setViewers] = useState([]);
  const [isAddingToPoll, setIsAddingToPoll] = useState(false);
  const [showZeroVotesDialog, setShowZeroVotesDialog] = useState(false);
  const [showCrashConfirmation, setShowCrashConfirmation] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [movieToReview, setMovieToReview] = useState(null);
  const prevMoviesWatchedRef = useRef([]);

  useEffect(() => {
    userProfileRef.current = userProfile;
  }, [userProfile]);

  // --- ADDED BACK: Data refresh functions ---
  const refreshVoteCounts = useCallback(async () => {
    if (!partyId) return;
    const { data } = await supabase
      .from("votes")
      .select("movie_tmdb_id")
      .eq("party_id", partyId);
    const counts = data
      ? data.reduce((acc, vote) => {
          acc[vote.movie_tmdb_id] = (acc[vote.movie_tmdb_id] || 0) + 1;
          return acc;
        }, {})
      : {};
    setPollVoteCounts(counts);
  }, [partyId]);

  const refreshSuggestionData = useCallback(async () => {
    if (!partyId) return;
    const { data } = await supabase
      .from("suggestions")
      .select("*")
      .eq("party_id", partyId);
    if (data) setSuggestions(data);
  }, [partyId]);

  // --- UPDATED: useEffect for Realtime and Data Fetching ---
  // --- useEffect for Initial Data Fetching ---
  useEffect(() => {
    if (!partyId || !user) return;

    const fetchInitialData = async () => {
      setLoading(true);
      const [partyRes, profileRes] = await Promise.all([
        supabase.from("watch_parties").select("*").eq("id", partyId).single(),
        supabase
          .from("profiles")
          .select("prompt_for_reviews")
          .eq("id", user.id)
          .single(),
      ]);

      if (partyRes.error) setError("Failed to load party details.");
      else setParty(partyRes.data);

      if (profileRes.data) setUserProfile(profileRes.data);

      await Promise.all([refreshVoteCounts(), refreshSuggestionData()]);
      setLoading(false);
    };

    fetchInitialData();
  }, [partyId, user, refreshVoteCounts, refreshSuggestionData]); // This runs once when these stable functions are created

  useEffect(() => {
    if (!partyId || !user) return;

    // This is the single channel for the dashboard.
    const partyChannel = supabase.channel(`party:${partyId}`, {
      config: { presence: { key: user.id } },
    });

    // Set up all necessary listeners before subscribing
    partyChannel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "watch_parties",
          filter: `id=eq.${partyId}`,
        },
        (payload) => setParty(payload.new)
      )
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
      .on("presence", { event: "sync" }, () => {
        const presenceState = partyChannel.presenceState();
        const currentViewers = Object.values(presenceState)
          .map((p) => p[0])
          .filter((p) => p.username);
        currentViewers.sort(
          (a, b) => (b.is_conductor ? 1 : 0) - (a.is_conductor ? 1 : 0)
        );
        setViewers(currentViewers);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Announce presence when connected
          await partyChannel.track({
            user_id: user.id,
            username: user.user_metadata?.username || "Conductor",
            is_conductor: true,
          });
        }
      });

    // Cleanup function
    return () => {
      supabase.removeChannel(partyChannel);
    };
  }, [partyId, user, refreshVoteCounts, refreshSuggestionData]);

  useEffect(() => {
    const fetchAllMovieDetails = async () => {
      if (party) {
        setNowPlayingMovieDetails(
          party.now_playing_tmdb_id
            ? await getMovieDetails(party.now_playing_tmdb_id)
            : null
        );
        setUpNextMovie(
          party.up_next_tmdb_id
            ? await getMovieDetails(party.up_next_tmdb_id)
            : null
        );
        if (party.movies_watched?.length > 0) {
          const movieDetailsPromises = party.movies_watched.map(
            async (info) => {
              const details = await getMovieDetails(info.id);
              return details ? { ...details, status: info.status } : null;
            }
          );
          setWatchedMovieDetails(
            (await Promise.all(movieDetailsPromises)).filter(Boolean)
          );
        } else {
          setWatchedMovieDetails([]);
        }
      }
    };
    fetchAllMovieDetails();
  }, [party]);

  useEffect(() => {
    if (
      party?.party_state?.status !== "intermission" ||
      !party.party_state.ends_at
    ) {
      setIntermissionTime(0);
      return;
    }
    const endsAt = new Date(party.party_state.ends_at).getTime();
    const intervalId = setInterval(() => {
      const now = new Date().getTime();
      const remaining = Math.round((endsAt - now) / 1000);
      if (remaining > 0) {
        setIntermissionTime(remaining);
      } else {
        setIntermissionTime(0);
        if (user.id === party.conductor_id) {
          updatePartyStatus({ party_state: { status: "paused" } });
        }
        clearInterval(intervalId);
      }
    }, 1000);
    const initialRemaining = Math.round((endsAt - new Date().getTime()) / 1000);
    setIntermissionTime(initialRemaining > 0 ? initialRemaining : 0);
    return () => clearInterval(intervalId);
  }, [party?.party_state, party?.conductor_id, user?.id]);

  const updatePartyStatus = async (updates) => {
    const { error } = await supabase
      .from("watch_parties")
      .update(updates)
      .eq("id", partyId);
    if (error) setError("Failed to update party.");
    else setParty((prev) => ({ ...prev, ...updates }));
  };

  const handleStartIntermission = (minutes) => {
    const duration = parseInt(minutes, 10);
    if (!isNaN(duration) && duration > 0) {
      const ends_at = new Date(Date.now() + duration * 60000).toISOString();
      updatePartyStatus({ party_state: { status: "intermission", ends_at } });
    }
  };

  const handleEndIntermission = () => {
    updatePartyStatus({ party_state: { status: "paused" } });
  };

  const handlePlay = () => {
    if (nowPlayingMovieDetails) {
      updatePartyStatus({ party_state: { status: "playing" } });
      return;
    }
    if (upNextMovie) {
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

  const handleFinishMovie = async (status) => {
    // Make the function async
    if (!nowPlayingMovieDetails) return;

    if (status === "watched") {
      const channel = supabase.channel(`party:${partyId}`);
      channel.send({
        type: "broadcast",
        event: "movie-finished",
        payload: { movieId: nowPlayingMovieDetails.id },
      });
      supabase.removeChannel(channel);

      // --- NEW: Trigger the modal for the conductor ---
      if (userProfile?.prompt_for_reviews) {
        // We already have the movie details, so we can use them directly
        setMovieToReview(nowPlayingMovieDetails);
      }
    }

    // The rest of the function updates the database as before
    const finishedMovie = { id: nowPlayingMovieDetails.id, status: status };
    const newWatchedList = [...(party.movies_watched || []), finishedMovie];
    let updates = {
      now_playing_tmdb_id: null,
      movies_watched: newWatchedList,
      party_state: { status: "paused" },
    };
    if (party.poll_movies.length > 0 && upNextMovie === null) {
      updates.voting_open = true;
    }
    updatePartyStatus(updates);
  };

  const handleCrashParty = () => {
    if (nowPlayingMovieDetails) {
      setShowCrashConfirmation(true);
    } else {
      updatePartyStatus({
        status: "concluded",
        end_time: new Date().toISOString(),
      });
      navigate("/conductors");
    }
  };

  const handleConfirmCrash = (markAsWatched) => {
    let updates = { status: "concluded", end_time: new Date().toISOString() };
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
    navigate("/conductors");
  };

  const handleCancelCrash = () => {
    setShowCrashConfirmation(false);
  };

  const handleOpenPoll = () => {
    updatePartyStatus({ voting_open: true });
  };

  const handleClosePoll = () => {
    if (!party.poll_movies || party.poll_movies.length === 0) return;
    const totalVotes = Object.values(pollVoteCounts).reduce(
      (sum, count) => sum + count,
      0
    );
    if (totalVotes === 0) {
      setShowZeroVotesDialog(true);
      return;
    }
    const winner = party.poll_movies.reduce((prev, current) => {
      const prevVotes = pollVoteCounts[prev.id] || 0;
      const currentVotes = pollVoteCounts[current.id] || 0;
      return prevVotes >= currentVotes ? prev : current;
    });
    setUpNextMovie(winner);
    updatePartyStatus({ voting_open: false, up_next_tmdb_id: winner.id });
  };

  const handleSelectRandom = () => {
    const randomIndex = Math.floor(Math.random() * party.poll_movies.length);
    const randomMovie = party.poll_movies[randomIndex];
    setUpNextMovie(randomMovie);
    updatePartyStatus({ voting_open: false, up_next_tmdb_id: randomMovie.id });
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
    const newPollMovies = [...party.poll_movies, movie];
    updatePartyStatus({ poll_movies: newPollMovies });
    setIsAddingToPoll(false);
  };

  const handleRemoveFromPoll = (movieId) => {
    const newPollMovies = party.poll_movies.filter((m) => m.id !== movieId);
    updatePartyStatus({ poll_movies: newPollMovies });
  };
  const handleRemoveFromWatched = (indexToRemove) => {
    // Create a new copy of the watched movies array from the current party state
    const currentWatchedList = [...(party.movies_watched || [])];

    // Remove the movie at the specified index
    currentWatchedList.splice(indexToRemove, 1);

    // Update the party in the database with the new, shorter watched list
    updatePartyStatus({ movies_watched: currentWatchedList });
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

    // Try to delete the suggestion from the database
    const { error } = await supabase
      .from("suggestions")
      .delete()
      .eq("id", suggestion.id);

    // If the deletion was successful, update the UI immediately
    if (!error) {
      setSuggestions((currentSuggestions) =>
        currentSuggestions.filter((s) => s.id !== suggestion.id)
      );
    }
  };

  const handleSaveReview = async ({ rating, review }) => {
    if (!movieToReview) return;
    await supabase.from("movie_watch_history").insert({
      user_id: user.id,
      party_id: party.id,
      movie_tmdb_id: movieToReview.id,
      movie_title: movieToReview.title,
      movie_image_url: movieToReview.imageUrl,
      watched_at: new Date().toISOString(),
      rating,
      review,
    });
    setMovieToReview(null);
  };

  const handleAddToFavorites = async () => {
    if (!movieToReview) return;
    alert(
      `Adding ${movieToReview.title} to favorites! (feature to be fully connected)`
    );
    setMovieToReview(null);
  };

  if (loading)
    return (
      <div className="text-center text-white pt-40">Loading Dashboard...</div>
    );
  if (!party)
    return <div className="text-center text-white pt-40">Party not found.</div>;

  return (
    <>
      {movieToReview && (
        <ReviewMovieModal
          movie={movieToReview}
          onSave={handleSaveReview}
          onClose={() => setMovieToReview(null)}
          onAddToFavorites={handleAddToFavorites}
        />
      )}
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

      <div className="bg-gray-900 min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate("/conductors")}
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
                <WatchList
                  watchedMovies={watchedMovieDetails}
                  nowPlaying={nowPlayingMovieDetails}
                  upNext={upNextMovie}
                  onMarkWatched={() => handleFinishMovie("watched")}
                  onSkipMovie={() => handleFinishMovie("skipped")}
                  onRemoveWatched={handleRemoveFromWatched}
                  playState={party.party_state?.status}
                  intermissionTime={intermissionTime}
                  isConductor={true}
                />
                <ViewersList viewers={viewers} />
              </div>
              <div className="md:col-span-2 space-y-8">
                <DashboardControls
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onCrashParty={handleCrashParty}
                  onSetIntermission={handleStartIntermission}
                  onEndIntermission={handleEndIntermission}
                  customIntermissionMinutes={customIntermissionMinutes}
                  setCustomIntermissionMinutes={setCustomIntermissionMinutes}
                  playState={party.party_state?.status}
                  isVotingOpen={party.voting_open}
                />
                <MoviePoll
                  movies={party.poll_movies}
                  voteCounts={pollVoteCounts}
                  onOpenPoll={handleOpenPoll}
                  onClosePoll={handleClosePoll}
                  onRemoveFromPoll={handleRemoveFromPoll}
                  onAddMovie={handleAddMovieToPoll}
                  isVotingOpen={party.voting_open}
                  isAddingToPoll={isAddingToPoll}
                  setIsAddingToPoll={setIsAddingToPoll}
                  SearchComponent={(props) => (
                    <MovieSearchInput
                      {...props}
                      existingIds={[
                        ...party.poll_movies.map((m) => m.id),
                        party.now_playing_tmdb_id,
                      ]}
                    />
                  )}
                />
                <ViewerSuggestions
                  suggestions={suggestions}
                  onMoveToPoll={handleMoveSuggestionToPoll}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConductorDashboard;
