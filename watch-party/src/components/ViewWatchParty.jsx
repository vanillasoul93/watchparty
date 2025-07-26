import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { getMovieDetails, searchTMDb } from "../api/tmdb";
import ReviewMovieModal from "./ReviewMovieModal";
import WatchList from "./WatchList";
import ShareableLink from "./ShareableLink";
import { useDebounce } from "../hooks/useDebounce";

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

const ViewWatchParty = () => {
  const { partyId } = useParams();
  const navigate = useNavigate();
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

  // Fetch the user's profile to check their review prompt setting
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("prompt_for_reviews, suggest_anonymously")
        .eq("id", user.id)
        .single();
      setUserProfile(data);
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
      await supabase.from("party_viewers").insert(
        {
          party_id: partyId,
          user_id: user.id,
          username: user.user_metadata?.username || "Anonymous",
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
    if (!partyId || !user) return;

    const fetchInitialData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("watch_parties")
        .select("*")
        .eq("id", partyId)
        .single();
      if (error) {
        setError("Failed to load party details.");
        setLoading(false);
      } else {
        setParty(data);
        await Promise.all([refreshVoteData(), refreshSuggestionData()]);
        setLoading(false);
      }
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
  }, [partyId, user, refreshVoteData, refreshSuggestionData]);

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
    return <div className="text-center text-white pt-40">Joining Party...</div>;
  if (!party)
    return (
      <div className="text-center text-red-500 pt-40">
        Could not find this party.
      </div>
    );

  const sortedPollMovies = [...(party?.poll_movies || [])].sort(
    (a, b) => (pollVoteCounts[b.id] || 0) - (pollVoteCounts[a.id] || 0)
  );
  const remainingVotes = (party?.votes_per_user || 3) - userVotes.length;
  const remainingSuggestions =
    (party?.suggestions_per_user || 2) - userSuggestionCount;

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
      <div className="bg-gray-900 min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate("/conductor-hub")}
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
          <div className="bg-gray-800 rounded-xl shadow-lg p-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-1 space-y-6">
                <WatchList
                  party={party}
                  watchedMovies={watchedMovieDetails}
                  nowPlaying={nowPlayingMovieDetails}
                  upNext={upNextMovieDetails}
                  playState={party?.party_state?.status}
                  intermissionTime={intermissionTime}
                  isConductor={user.id === party.conductor_id}
                />
                <div className="bg-gray-900 p-4 rounded-lg">
                  <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                    <Users size={20} /> Viewers ({viewers.length})
                  </h3>
                  <ul className="space-y-1">
                    {viewers.map((viewer) => (
                      <li
                        key={viewer.user_id}
                        className={
                          viewer.is_conductor
                            ? "font-bold text-indigo-400"
                            : "text-gray-300"
                        }
                      >
                        {viewer.username}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="md:col-span-2 space-y-8">
                <div className="bg-gray-900 p-4 rounded-lg">
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
                <div className="bg-gray-900 p-4 rounded-lg">
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
                  <ul className="space-y-2 mb-4 max-h-100 overflow-y-auto pr-2">
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
                            className={`bg-gray-800 p-3 rounded-md flex items-center justify-between border-2 border-dashed ${
                              isMySuggestion
                                ? "border-indigo-600"
                                : "border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <img
                                src={suggestion.movie_image_url}
                                alt={suggestion.movie_title}
                                className="w-10 h-16 object-cover rounded"
                              />
                              <div className="flex flex-col">
                                <span className="text-gray-300">
                                  {suggestion.movie_title} (
                                  {suggestion.movie_year})
                                </span>
                                <span className="text-xs text-gray-500">
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
