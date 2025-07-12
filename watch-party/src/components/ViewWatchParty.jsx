import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/Auth";
import {
  ArrowLeft,
  Users,
  Clapperboard,
  Timer,
  Vote,
  Film,
  PlayCircle,
  PauseCircle,
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
// --- End TMDB API Helper ---

const ViewWatchParty = ({ partyId, onBack }) => {
  const { user } = useAuth();
  const [party, setParty] = useState(null);
  const [watchedMovieDetails, setWatchedMovieDetails] = useState([]);
  const [nowPlayingMovieDetails, setNowPlayingMovieDetails] = useState(null);
  const [upNextMovieDetails, setUpNextMovieDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userVotes, setUserVotes] = useState([]); // Will now store objects: { voteId, movieId }
  const [pollVoteCounts, setPollVoteCounts] = useState({});

  const remainingVotes = 3 - userVotes.length;

  const refreshVoteData = async () => {
    if (!partyId) return;
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
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!partyId) return;
      setLoading(true);

      const { data: partyData, error: partyError } = await supabase
        .from("watch_parties")
        .select("*")
        .eq("id", partyId)
        .single();

      if (partyError) {
        setError("Failed to load party details.");
        console.error(partyError);
        setLoading(false);
        return;
      }
      setParty(partyData);
      await refreshVoteData();
      setLoading(false);
    };

    fetchInitialData();

    const channel = supabase
      .channel(`party-votes-${partyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "votes",
          filter: `party_id=eq.${partyId}`,
        },
        (payload) => {
          refreshVoteData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partyId, user.id]);

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
          setUpNextMovieDetails(upNextDetails);
        } else {
          setUpNextMovieDetails(null);
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

  const handleVote = async (movieTmdbId) => {
    if (remainingVotes <= 0) {
      setError("You have no votes left.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    const { data, error } = await supabase
      .from("votes")
      .insert({
        party_id: partyId,
        user_id: user.id,
        movie_tmdb_id: movieTmdbId,
      })
      .select()
      .single();

    if (error) {
      setError("Could not cast vote. Please try again.");
      setTimeout(() => setError(""), 3000);
    } else {
      setUserVotes((prev) => [
        ...prev,
        { voteId: data.id, movieId: movieTmdbId },
      ]);
      setPollVoteCounts((prev) => ({
        ...prev,
        [movieTmdbId]: (prev[movieTmdbId] || 0) + 1,
      }));
    }
  };

  const handleRemoveVote = async (movieTmdbId) => {
    const voteToRemove = userVotes.find((v) => v.movieId === movieTmdbId);
    if (!voteToRemove) return;

    const { error } = await supabase
      .from("votes")
      .delete()
      .eq("id", voteToRemove.voteId);

    if (error) {
      setError("Could not remove vote. Please try again.");
      setTimeout(() => setError(""), 3000);
    } else {
      setUserVotes((prev) =>
        prev.filter((v) => v.voteId !== voteToRemove.voteId)
      );
      setPollVoteCounts((prev) => ({
        ...prev,
        [movieTmdbId]: (prev[movieTmdbId] || 1) - 1,
      }));
    }
  };

  if (loading)
    return <div className="text-center text-white pt-40">Joining Party...</div>;
  if (!party)
    return (
      <div className="text-center text-red-500 pt-40">
        Could not find this party.
      </div>
    );

  const userVotesForMovie = (movieId) =>
    userVotes.filter((v) => v.movieId === movieId).length;

  // **FIXED**: Sort the poll movies by vote count in descending order before rendering.
  const sortedPollMovies = [...(party?.poll_movies || [])].sort((a, b) => {
    const votesA = pollVoteCounts[a.id] || 0;
    const votesB = pollVoteCounts[b.id] || 0;
    return votesB - votesA;
  });

  return (
    <div className="bg-gray-900 min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-6"
        >
          <ArrowLeft size={20} /> Back to Hub
        </button>

        <div className="bg-gray-800 rounded-xl shadow-lg p-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Left Column: Watch List & Viewers */}
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
                    </li>
                  ))}
                  {nowPlayingMovieDetails && (
                    <li className="flex items-center gap-3 border-2 border-green-500 p-2 rounded-lg">
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
                    </li>
                  )}
                  {upNextMovieDetails && (
                    <li className="flex items-center gap-3 border-2 border-dashed border-blue-500 p-2 rounded-lg">
                      <img
                        src={upNextMovieDetails.imageUrl}
                        alt={upNextMovieDetails.title}
                        className="w-12 h-18 object-cover rounded"
                      />
                      <div>
                        <p className="font-semibold text-white">
                          {upNextMovieDetails.title} ({upNextMovieDetails.year})
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

            {/* Right Column: Poll */}
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
                          {userVotesForMovie(movie.id) > 0 && (
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
                {error && (
                  <p className="text-red-400 text-center mt-4">{error}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewWatchParty;
