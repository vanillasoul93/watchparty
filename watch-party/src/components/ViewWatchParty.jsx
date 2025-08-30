import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/Auth";
import {
  ArrowLeft,
  Users,
  Vote,
  Trash2,
  Search,
  PlusCircle,
} from "lucide-react";
import {
  getMovieDetails,
  searchTMDb,
  getMovieDetailsWithCredits,
} from "../api/tmdb";
import MovieDetailsModal from "./MovieDetailsModal";
import ReviewMovieModal from "./ReviewMovieModal";
import WatchList from "./WatchList";
import ShareableLink from "./ShareableLink";
import ViewersList from "./ViewersList";
import NotificationModal from "./NotificationModal";
import { useDebounce } from "../hooks/useDebounce";
import { useAutoAnimate } from "@formkit/auto-animate/react";

const MovieSearchInput = ({ onSelect, existingIds = [] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    const search = async () => {
      if (debouncedSearchTerm.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      const searchResults = await searchTMDb(debouncedSearchTerm);
      setResults(searchResults.filter((res) => !existingIds.includes(res.id)));
      setLoading(false);
    };
    search();
  }, [debouncedSearchTerm]); // The API call is now driven by the debounced term

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
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full bg-slate-800 border-2 border-gray-600 text-white rounded-lg p-3 pl-10 focus:outline-none focus:border-indigo-600 transition"
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

const ViewWatchParty = () => {
  const { partyId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromTab = searchParams.get("from"); // This will be 'conducting', 'active', etc.
  const { user } = useAuth();
  const userProfileRef = useRef();

  const [party, setParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewers, setViewers] = useState([]);
  const [watchedMovieDetails, setWatchedMovieDetails] = useState([]);
  const [nowPlayingMovieDetails, setNowPlayingMovieDetails] = useState(null);
  const [upNextMovieDetails, setUpNextMovieDetails] = useState(null);
  const [userVotes, setUserVotes] = useState([]);
  const [pollVoteCounts, setPollVoteCounts] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [userSuggestionCount, setUserSuggestionCount] = useState(0);
  const [movieToReview, setMovieToReview] = useState(null);
  const prevMoviesWatchedRef = useRef([]);
  const prevVotingOpen = useRef(false);
  const [intermissionTime, setIntermissionTime] = useState(0);
  const [userProfile, setUserProfile] = useState(null);

  const [pollListRef] = useAutoAnimate({ duration: 500 });
  const [suggestionsListRef] = useAutoAnimate({ duration: 500 });

  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [modalMovieData, setModalMovieData] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);

  // --- NEW: State for the full favorites list ---
  const [allFavoriteMovies, setAllFavoriteMovies] = useState([]);

  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  useEffect(() => {
    const fetchModalData = async () => {
      if (selectedMovieId) {
        setLoadingModal(true);
        const fullDetails = await getMovieDetailsWithCredits(selectedMovieId);
        setModalMovieData(fullDetails);
        setLoadingModal(false);
      } else {
        setModalMovieData(null);
      }
    };
    fetchModalData();
  }, [selectedMovieId]);

  const handleAddToHistoryFromModal = (movie) => {
    setSelectedMovieId(null);
    setMovieToReview(movie);
  };

  // Fetch the user's profile to check their review prompt setting
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("prompt_for_reviews, suggest_anonymously, all_favorite_movies")
        .eq("id", user.id)
        .single();
      setUserProfile(data);
      if (data) {
        setAllFavoriteMovies(
          Array.isArray(data.all_favorite_movies)
            ? data.all_favorite_movies
            : []
        );
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    userProfileRef.current = userProfile;
  }, [userProfile]);

  const refreshVoteData = useCallback(async () => {
    if (!partyId || !user) return;
    const { data: allVotesData } = await supabase
      .from("votes")
      .select("id, movie_tmdb_id")
      .eq("party_id", partyId);
    const counts = allVotesData
      ? allVotesData.reduce((acc, vote) => {
          acc[vote.movie_tmdb_id] = (acc[vote.movie_tmdb_id] || 0) + 1;
          return acc;
        }, {})
      : {};
    setPollVoteCounts(counts);
    const { data: userVotesData } = await supabase
      .from("votes")
      .select("id, movie_tmdb_id")
      .eq("party_id", partyId)
      .eq("user_id", user.id);
    setUserVotes(
      userVotesData
        ? userVotesData.map((v) => ({ voteId: v.id, movieId: v.movie_tmdb_id }))
        : []
    );
  }, [partyId, user]);

  const refreshSuggestionData = useCallback(async () => {
    if (!partyId) return;

    // This query gets all suggestion data, AND joins with profiles
    // ONLY to get the 'suggest_anonymously' flag.
    const { data, error } = await supabase
      .from("suggestions")
      .select("*, profiles (suggest_anonymously)") // Note: we are NOT asking for username here
      .eq("party_id", partyId);

    if (error) {
      console.error("Error fetching suggestions with profiles:", error);
    } else if (data) {
      setSuggestions(data);
      if (user) {
        setUserSuggestionCount(
          data.filter((s) => s.user_id === user.id).length
        );
      }
    }
  }, [partyId, user]);

  // This effect manages adding/removing the user from the persistent viewers table,
  // which in turn triggers the database functions to update the count.
  useEffect(() => {
    if (!partyId || !user) return;

    const joinParty = async () => {
      await supabase.from("party_viewers").upsert(
        {
          party_id: partyId,
          user_id: user.id,
        },
        { onConflict: "party_id, user_id" }
      ); // Use onConflict to prevent errors on refresh
    };

    joinParty();

    // The return function runs when the component unmounts (user leaves the page)
    return () => {
      const leaveParty = async () => {
        await supabase
          .from("party_viewers")
          .delete()
          .match({ party_id: partyId, user_id: user.id });
      };
      leaveParty();
    };
  }, [partyId, user]);

  useEffect(() => {
    if (!partyId || !user) {
      setLoading(false); // Stop loading if we don't have what we need
      return;
    }

    const fetchInitialData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("watch_parties")
        .select("*")
        .eq("id", partyId)
        .single();
      if (error || !data) {
        setError("This party could not be found.");
        setLoading(false);
        return;
      }

      // --- THIS IS THE FIX ---
      // 1. First, check if the party is concluded and redirect if so.
      if (data.status === "concluded") {
        navigate(`/review-party/${partyId}`, { replace: true });
        return; // Stop execution
      }

      // --- THIS IS THE SECURITY FIX ---
      // After fetching the party, check if the current user is the conductor.
      if (data.conductor_id === user.id) {
        // If they are, redirect them to the dashboard immediately.
        navigate(`/dashboard/${partyId}`, { replace: true });
        return; // Stop further execution for this component
      }
      setParty(data);
      const { data: profileData } = await supabase
        .from("profiles")
        .select("prompt_for_reviews, suggest_anonymously, all_favorite_movies")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setUserProfile(profileData);
        setAllFavoriteMovies(
          Array.isArray(profileData.all_favorite_movies)
            ? profileData.all_favorite_movies
            : []
        );
      }

      await Promise.all([refreshVoteData(), refreshSuggestionData()]);
      setLoading(false);
    };

    fetchInitialData();

    const partyChannel = supabase.channel(`party:${partyId}`, {
      config: { presence: { key: user.id } },
    });

    partyChannel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "watch_parties",
          filter: `id=eq.${partyId}`,
        },
        (payload) => {
          const updatedParty = payload.new;
          // --- ADDED: A fallback check ---
          // If the party status changes to 'concluded', redirect the viewer.
          if (updatedParty.status === "concluded") {
            navigate(`/review-party/${partyId}`);
          } else {
            setParty(updatedParty);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "votes",
          filter: `party_id=eq.${partyId}`,
        },
        refreshVoteData
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
      .on("broadcast", { event: "movie-finished" }, async ({ payload }) => {
        console.log("VIEWER received broadcast:", payload); // For debugging
        if (userProfileRef.current?.prompt_for_reviews) {
          const movieDetails = await getMovieDetails(payload.movieId);
          if (movieDetails) setMovieToReview(movieDetails);
        }
      })
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        (payload) => {
          console.log(
            "A profile has been updated, refreshing suggestions...",
            payload
          );
          // Simply re-run the function to get the latest data
          refreshSuggestionData();
        }
      )
      .on("broadcast", { event: "party-crashed" }, (payload) => {
        console.log("Party crashed event received!", payload);
        // Redirect the viewer to the review page.
        navigate(`/review-party/${partyId}`);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          partyChannel.on(
            "broadcast",
            { event: "movie-finished" },
            async (payload) => {
              if (userProfile?.prompt_for_reviews) {
                const movieDetails = await getMovieDetails(
                  payload.payload.movieId
                );
                if (movieDetails) setMovieToReview(movieDetails);
              }
            }
          );
          await partyChannel.track({
            user_id: user.id,
            username: user.user_metadata?.username || "Anonymous",
            is_conductor: false,
          });
        }
      });

    return () => {
      supabase.removeChannel(partyChannel);
    };
  }, [partyId, user, refreshVoteData, refreshSuggestionData, navigate]);

  useEffect(() => {
    const currentVotingOpen = party?.voting_open;
    if (currentVotingOpen && !prevVotingOpen.current) {
      const resetUserVotes = async () => {
        if (!user || !partyId) return;
        await supabase
          .from("votes")
          .delete()
          .match({ user_id: user.id, party_id: partyId });
        refreshVoteData();
      };
      resetUserVotes();
    }
    prevVotingOpen.current = currentVotingOpen;
  }, [party?.voting_open, partyId, user, refreshVoteData]);

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
      const remaining = Math.round(
        (new Date(endsAt).getTime() - new Date().getTime()) / 1000
      );
      if (remaining > 0) setIntermissionTime(remaining);
      else {
        setIntermissionTime(0);
        clearInterval(intervalId);
      }
    }, 1000);
    const initialRemaining = Math.round((endsAt - new Date().getTime()) / 1000);
    setIntermissionTime(initialRemaining > 0 ? initialRemaining : 0);
    return () => clearInterval(intervalId);
  }, [party?.party_state]);

  useEffect(() => {
    const fetchAllMovieDetails = async () => {
      if (party) {
        setNowPlayingMovieDetails(
          party.now_playing_tmdb_id
            ? await getMovieDetails(party.now_playing_tmdb_id)
            : null
        );
        setUpNextMovieDetails(
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

  // This effect tracks the user's active watch time
  useEffect(() => {
    let intervalId = null;
    const incrementInterval = 15; // We'll update the database every 15 seconds

    // The interval should only run when the party is actively playing
    if (party?.party_state?.status === "playing") {
      intervalId = setInterval(() => {
        if (document.visibilityState === "visible") {
          // Only track if the tab is active
          supabase
            .rpc("increment_view_time", {
              p_party_id: partyId,
              p_user_id: user.id,
              p_seconds: incrementInterval,
            })
            .then(({ error }) => {
              if (error) console.error("Failed to update view time:", error);
            });
        }
      }, incrementInterval * 1000);
    }

    // Cleanup the interval when the component unmounts or the play state changes
    return () => clearInterval(intervalId);
  }, [party?.party_state?.status, partyId, user]);

  const handleVote = async (movieTmdbId) => {
    // Use the dynamic value from the party object, with a fallback to 3
    const voteLimit = party?.votes_per_user || 3;
    if (userVotes.length >= voteLimit) return;

    await supabase.from("votes").insert({
      party_id: partyId,
      user_id: user.id,
      movie_tmdb_id: movieTmdbId,
    });
  };

  const handleRemoveVote = async (movieTmdbId) => {
    const voteToRemove = userVotes.find((v) => v.movieId === movieTmdbId);
    if (!voteToRemove) return;

    // Try to delete the vote from the database
    const { error } = await supabase
      .from("votes")
      .delete()
      .eq("id", voteToRemove.voteId);

    // If the deletion was successful, refresh the vote data immediately
    if (!error) {
      refreshVoteData();
    }
  };

  const handleSuggestMovie = async (movie) => {
    // Use the dynamic value from the party object, with a fallback to 2
    const suggestionLimit = party?.suggestions_per_user || 2;
    if (userSuggestionCount >= suggestionLimit) return;

    await supabase.from("suggestions").insert({
      party_id: partyId,
      user_id: user.id,
      username: user.user_metadata?.username,
      movie_tmdb_id: movie.id,
      movie_title: movie.title,
      movie_year: movie.year,
      movie_image_url: movie.imageUrl,
    });
  };

  const handleRemoveSuggestion = async (suggestionId) => {
    const { error } = await supabase
      .from("suggestions")
      .delete()
      .eq("id", suggestionId);
    if (!error) {
      refreshSuggestionData(); // Optimistic update
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
    setNotification({
      show: true,
      message: `${movieToReview.title} has been added to your movie history!`,
      type: "success",
    });
    setMovieToReview(null);
  };

  // --- This is the fully implemented handler function ---
  const handleAddToFavorites = async (movieToAdd) => {
    if (!movieToAdd) return;

    const movieData = {
      id: movieToAdd.id || movieToAdd.movie_tmdb_id,
      title: movieToAdd.title || movieToAdd.movie_title,
      year: movieToAdd.year,
      imageUrl: movieToAdd.imageUrl || movieToAdd.movie_image_url,
    };

    const isAlreadyFavorite = allFavoriteMovies.some(
      (fav) => fav.id === movieData.id
    );
    if (isAlreadyFavorite) {
      //Show a "warning" notification
      setNotification({
        show: true,
        message: `${movieToAdd.title} is already in your favorites!`,
        type: "warning",
      });
      return;
    }

    const newFavorites = [...allFavoriteMovies, movieData];
    setAllFavoriteMovies(newFavorites); // Optimistic UI update

    const { error } = await supabase
      .from("profiles")
      .update({ all_favorite_movies: newFavorites })
      .eq("id", user.id);

    if (!error) {
      //Show a "success" notification
      setNotification({
        show: true,
        message: `${movieToAdd.title} has been added to your favorites!`,
        type: "success",
      });
    } else {
      setNotification({
        show: true,
        message: "Failed to add to favorites.",
        type: "error",
      });
      setAllFavoriteMovies(allFavoriteMovies);
    }
  };

  const sortedPollMovies = [...(party?.poll_movies || [])].sort(
    (a, b) => (pollVoteCounts[b.id] || 0) - (pollVoteCounts[a.id] || 0)
  );
  const remainingVotes = (party?.votes_per_user || 3) - userVotes.length;
  const remainingSuggestions =
    (party?.suggestions_per_user || 2) - userSuggestionCount;

  if (loading)
    return <div className="text-center text-white pt-40">Joining Party...</div>;
  if (error)
    return <div className="text-center text-red-500 pt-40">{error}</div>;
  // If the user is the conductor, this component will have redirected,
  // so we can be sure `party` is valid here for viewers.
  if (!party) return null;

  return (
    <>
      {/* --- ADD: Render the new modal --- */}
      <MovieDetailsModal
        movie={modalMovieData}
        isLoading={loadingModal}
        onClose={() => setSelectedMovieId(null)}
        onAddToHistory={handleAddToHistoryFromModal}
        onAddToFavorites={() => handleAddToFavorites(modalMovieData)}
      />
      {movieToReview && (
        <ReviewMovieModal
          movie={movieToReview}
          onSave={handleSaveReview}
          onClose={() => setMovieToReview(null)}
          onAddToFavorites={() => handleAddToFavorites(movieToReview)}
        />
      )}
      {/* --- Render the NotificationModal conditionally --- */}
      {notification.show && (
        <NotificationModal
          message={notification.message}
          type={notification.type}
          onClose={() =>
            setNotification({ show: false, message: "", type: "" })
          }
        />
      )}
      <div className="bg-gray-900 min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4">
          <button
            onClick={() =>
              navigate("/conductor-hub", { state: { fromTab: fromTab } })
            }
            className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-6"
          >
            <ArrowLeft size={20} /> Back to Hub
          </button>
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white">
              {party.party_name}
            </h1>
            <p className="text-lg text-gray-400 pt-2">
              Conducted by{" "}
              <span className="font-semibold text-indigo-400">
                {party.conductor_username}
              </span>
            </p>
          </div>
          {party.stream_url && (
            <div className="mb-8 max-w-2xl mx-auto">
              <ShareableLink link={party.stream_url} />
            </div>
          )}
          <div className="bg-gray-900 p-3">
            <div className="grid md:grid-cols-3 gap-8">
              {/* --- MODIFIED: Added flex flex-col to the column wrapper --- */}
              <div className="md:col-span-1 space-y-6 flex flex-col">
                {/* --- ADDED: A wrapper with min-h-0 around WatchList --- */}
                <div className="flex-grow min-h-0">
                  <WatchList
                    party={party}
                    watchedMovies={watchedMovieDetails}
                    nowPlaying={nowPlayingMovieDetails}
                    upNext={upNextMovieDetails}
                    playState={party?.party_state?.status}
                    intermissionTime={intermissionTime}
                    isConductor={user.id === party.conductor_id}
                    onShowReviewModal={setMovieToReview}
                    onAddToFavorites={handleAddToFavorites}
                  />
                </div>

                <div className="flex-shrink-0">
                  <ViewersList viewers={viewers} />
                </div>
              </div>
              <div className="md:col-span-2 space-y-8">
                <div
                  className={`bg-gradient-to-br from-slate-800 to-slate-900 shadow-xl shadow-black/10 p-4 rounded-lg transition-all duration-300 ${
                    party.voting_open
                      ? "shadow-sm shadow-indigo-500/20 ring-1 ring-indigo-500/50"
                      : "shadow-none"
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <Vote size={20} /> Movie Poll
                    </h3>
                    <span className="text-indigo-400 font-semibold">
                      {remainingVotes} {remainingVotes === 1 ? "Vote" : "Votes"}{" "}
                      Left
                    </span>
                  </div>
                  {party.voting_open ? (
                    <ul
                      className="space-y-2 max-h-100 overflow-y-auto p-1 pr-2 [overflow-anchor:none] "
                      ref={pollListRef}
                    >
                      {sortedPollMovies.map((movie) => (
                        <li
                          key={movie.id}
                          className="bg-gray-900/80 p-3 rounded-md flex items-center justify-between  transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/10 hover:ring-2 hover:ring-indigo-500/30"
                        >
                          <div
                            onClick={() => setSelectedMovieId(movie.id)}
                            className="flex items-center gap-4 cursor-pointer"
                          >
                            <img
                              src={movie.imageUrl}
                              alt={movie.title}
                              className="w-14 h-[88px] object-cover rounded"
                            />
                            <span className="text-gray-300">
                              {movie.title} ({movie.year})
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-white">
                              {pollVoteCounts[movie.id] || 0} Votes
                            </span>
                            {userVotes.some((v) => v.movieId === movie.id) && (
                              <button
                                onClick={() => handleRemoveVote(movie.id)}
                                className="bg-red-600 text-white font-bold p-2 rounded-full transition hover:bg-red-700"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => handleVote(movie.id)}
                              disabled={remainingVotes <= 0}
                              className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                              Vote
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 text-center py-4">
                      The poll is currently closed.
                    </p>
                  )}
                </div>
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 shadow-xl shadow-black/10 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <PlusCircle size={20} /> Suggestions
                    </h3>
                    <span className="text-indigo-400 font-semibold">
                      {remainingSuggestions}{" "}
                      {remainingSuggestions === 1
                        ? "Suggestion"
                        : "Suggestions"}{" "}
                      Left
                    </span>
                  </div>
                  <ul
                    className="space-y-2 mb-4 max-h-100 overflow-y-auto pr-2"
                    ref={suggestionsListRef}
                  >
                    {[...suggestions]
                      .sort(
                        (a, b) =>
                          (b.user_id === user.id) - (a.user_id === user.id)
                      )
                      .map((suggestion) => {
                        // Check if the current suggestion belongs to the logged-in user
                        const isMySuggestion = suggestion.user_id === user.id;

                        return (
                          <li
                            key={suggestion.id}
                            // Conditionally add the border class
                            className={`bg-gray-900/80 p-3 rounded-md flex items-center justify-between border-2 border-dashed hover:border-solid ${
                              isMySuggestion
                                ? "border-indigo-600"
                                : "border-transparent"
                            }`}
                          >
                            <div
                              onClick={() =>
                                setSelectedMovieId(suggestion.movie_tmdb_id)
                              }
                              className="flex items-center gap-4 cursor-pointer"
                            >
                              <img
                                src={suggestion.movie_image_url}
                                alt={suggestion.movie_title}
                                className="w-14 h-[88px] object-cover rounded"
                              />
                              <div className="flex flex-col">
                                <span className="text-gray-300 text-xl pb-0.5">
                                  {suggestion.movie_title} (
                                  {suggestion.movie_year})
                                </span>
                                <span className="text-sm text-gray-500">
                                  Suggested by:{" "}
                                  {
                                    // Check the privacy flag from the joined profiles table.
                                    // If true, show 'Anonymous'.
                                    // If false, show the 'username' that is stored directly on the suggestion itself.
                                    suggestion.profiles?.suggest_anonymously
                                      ? "Anonymous"
                                      : suggestion.username || "Anonymous"
                                  }
                                </span>
                              </div>
                            </div>
                            {isMySuggestion && (
                              <button
                                onClick={() =>
                                  handleRemoveSuggestion(suggestion.id)
                                }
                                className="p-2 text-gray-500 hover:text-red-500"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </li>
                        );
                      })}
                  </ul>
                  {remainingSuggestions > 0 && (
                    <MovieSearchInput
                      onSelect={handleSuggestMovie}
                      existingIds={[
                        ...(party?.poll_movies || []).map((m) => m.id),
                        ...suggestions.map((s) => s.movie_tmdb_id),
                        party?.now_playing_tmdb_id,
                      ].filter(Boolean)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewWatchParty;
