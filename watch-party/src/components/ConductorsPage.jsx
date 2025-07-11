import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/Auth";
import {
  PlayCircle,
  CheckCircle,
  Clock,
  Users,
  Film,
  Vote,
  XCircle,
  Star,
  LayoutDashboard,
  RefreshCw,
  PauseCircle,
  SkipForward,
  Timer,
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

const PartyCard = ({
  party,
  currentUser,
  onCrashParty,
  onReopenParty,
  onSelectDashboard,
}) => {
  const [nowPlayingDetails, setNowPlayingDetails] = useState(null);
  const [upNextDetails, setUpNextDetails] = useState(null);
  const [intermissionTime, setIntermissionTime] = useState(0);

  useEffect(() => {
    const fetchCardMovieDetails = async () => {
      if (party.now_playing_tmdb_id) {
        const details = await getMovieDetails(party.now_playing_tmdb_id);
        setNowPlayingDetails(details);
      } else {
        setNowPlayingDetails(null);
      }

      if (party.up_next_tmdb_id) {
        const details = await getMovieDetails(party.up_next_tmdb_id);
        setUpNextDetails(details);
      } else {
        setUpNextDetails(null);
      }
    };
    fetchCardMovieDetails();
  }, [party.now_playing_tmdb_id, party.up_next_tmdb_id]);

  useEffect(() => {
    if (
      party.party_state?.status === "intermission" &&
      party.party_state.ends_at
    ) {
      const endsAt = new Date(party.party_state.ends_at).getTime();
      const now = new Date().getTime();
      const remaining = Math.round((endsAt - now) / 1000);
      setIntermissionTime(remaining > 0 ? remaining : 0);
    } else {
      setIntermissionTime(0);
    }
  }, [party.party_state]);

  useEffect(() => {
    if (intermissionTime > 0) {
      const timer = setTimeout(
        () => setIntermissionTime(intermissionTime - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [intermissionTime]);

  const formatTime = (time) => new Date(time).toLocaleString();
  const formatTimer = (seconds) =>
    `${Math.floor(seconds / 60)}:${("0" + (seconds % 60)).slice(-2)}`;
  const isConductor = currentUser && currentUser.id === party.conductor_id;
  const canReopen =
    isConductor &&
    party.status === "concluded" &&
    party.end_time &&
    new Date() - new Date(party.end_time) < 3600000;

  const isPlaying = party.party_state?.status === "playing";
  const isPaused = party.party_state?.status === "paused";
  const isIntermission = party.party_state?.status === "intermission";

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 hover:border-indigo-500 transition-all duration-300 flex flex-col">
      <img
        src={
          nowPlayingDetails?.imageUrl ||
          party.featured_movie_image_url ||
          "https://placehold.co/400x225/1a202c/ffffff?text=No+Image"
        }
        alt={nowPlayingDetails?.title || party.featured_movie}
        className="w-full h-48 object-cover rounded-t-xl"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src =
            "https://placehold.co/400x225/1a202c/ffffff?text=Error";
        }}
      />
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-bold text-white">
              {party.party_name}
            </h3>
            <p className="text-sm text-gray-400">
              by {party.conductor_username || "Anonymous"}
            </p>
          </div>
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
              party.status === "active"
                ? "bg-green-500/20 text-green-400"
                : "bg-gray-600/30 text-gray-300"
            }`}
          >
            {party.status === "active" ? (
              <PlayCircle size={16} />
            ) : (
              <CheckCircle size={16} />
            )}
            <span>{party.status === "active" ? "Active" : "Concluded"}</span>
          </div>
        </div>

        <div className="space-y-3 text-gray-300 mb-4">
          {party.voting_open && (
            <div className="flex items-center gap-3 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-md">
              <Vote size={18} />
              <span className="font-semibold">Voting is Open!</span>
            </div>
          )}

          {isIntermission ? (
            <div className="flex items-center gap-3 p-2 rounded-md bg-yellow-500/20 text-yellow-300">
              <Timer size={18} />
              <span>Intermission: {formatTimer(intermissionTime)}</span>
            </div>
          ) : (
            <div
              className={`flex items-center gap-3 p-2 rounded-md ${
                isPlaying
                  ? "bg-green-500/20 text-green-300"
                  : isPaused
                  ? "bg-yellow-500/20 text-yellow-300"
                  : ""
              }`}
            >
              {isPlaying && <PlayCircle size={18} className="text-green-400" />}
              {isPaused && (
                <PauseCircle size={18} className="text-yellow-400" />
              )}
              {!isPlaying && !isPaused && (
                <Film size={18} className="text-indigo-400" />
              )}

              <span>
                {isPaused ? "Paused: " : "Now Playing: "}
                <span className="font-semibold text-white ml-1">
                  {nowPlayingDetails?.title || "N/A"} (
                  {nowPlayingDetails?.year || "..."})
                </span>
              </span>
            </div>
          )}

          {upNextDetails && (
            <div className="flex items-center gap-3 bg-purple-500/20 text-purple-300 px-3 py-1 rounded-md">
              <SkipForward size={18} />
              <span className="font-semibold">
                Up Next: {upNextDetails.title} ({upNextDetails.year})
              </span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Clock size={18} className="text-indigo-400" />
            <span>
              {party.status === "active"
                ? `Starts: ${formatTime(party.scheduled_start_time)}`
                : `Ended: ${formatTime(party.end_time)}`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Users size={18} className="text-indigo-400" />
            <span>{party.viewers_count} viewers</span>
          </div>
        </div>

        <div className="mt-auto">
          {party.status === "active" ? (
            isConductor ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectDashboard(party.id)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <LayoutDashboard size={18} />
                  Dashboard
                </button>
                <button
                  onClick={() => onCrashParty(party.id)}
                  className="flex-shrink-0 bg-red-600 hover:bg-red-700 text-white font-bold p-3 rounded-lg transition-all duration-300"
                >
                  <XCircle size={18} />
                </button>
              </div>
            ) : (
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300">
                Join Party
              </button>
            )
          ) : canReopen ? (
            <button
              onClick={() => onReopenParty(party.id)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Re-Open Party
            </button>
          ) : (
            <button className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2">
              <Star size={18} />
              Review Party
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ConductorsPage = ({
  activeParties,
  concludedParties,
  loading,
  error,
  onSelectDashboard,
  refreshParties,
}) => {
  const { user } = useAuth();

  const handleCrashParty = async (partyId) => {
    const { error } = await supabase
      .from("watch_parties")
      .update({ status: "concluded", end_time: new Date().toISOString() })
      .eq("id", partyId);

    if (error) {
      console.error("Could not end the party:", error);
    } else {
      refreshParties();
    }
  };

  const handleReopenParty = async (partyId) => {
    const { error } = await supabase
      .from("watch_parties")
      .update({ status: "active", end_time: null })
      .eq("id", partyId);

    if (error) {
      console.error("Could not re-open the party:", error);
    } else {
      refreshParties();
    }
  };

  if (loading) {
    return (
      <div className="text-center text-white pt-40">Loading parties...</div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 pt-40">Error: {error}</div>;
  }

  return (
    <div className="bg-gray-900 min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <h1 className="text-5xl font-extrabold text-white text-center mb-12">
          Conductor Hub
        </h1>

        <section>
          <h2 className="text-3xl font-bold text-white mb-6 border-l-4 border-green-500 pl-4">
            Active Now
          </h2>
          {activeParties.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeParties.map((party) => (
                <PartyCard
                  key={party.id}
                  party={party}
                  currentUser={user}
                  onCrashParty={handleCrashParty}
                  onReopenParty={handleReopenParty}
                  onSelectDashboard={onSelectDashboard}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-400 bg-gray-800 p-6 rounded-lg">
              No active watch parties at the moment. Why not start one?
            </p>
          )}
        </section>

        <section className="mt-16">
          <h2 className="text-3xl font-bold text-white mb-6 border-l-4 border-gray-500 pl-4">
            Recently Concluded
          </h2>
          {concludedParties.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {concludedParties.map((party) => (
                <PartyCard
                  key={party.id}
                  party={party}
                  currentUser={user}
                  onCrashParty={handleCrashParty}
                  onReopenParty={handleReopenParty}
                  onSelectDashboard={onSelectDashboard}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-400 bg-gray-800 p-6 rounded-lg">
              No recently concluded parties found.
            </p>
          )}
        </section>
      </div>
    </div>
  );
};

export default ConductorsPage;
