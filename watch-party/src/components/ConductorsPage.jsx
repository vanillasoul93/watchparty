import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/Auth";
import { useNavigate } from "react-router-dom";
import { getMovieDetails } from "../api/tmdb";
import {
  PlayCircle,
  CheckCircle,
  Clock,
  Users,
  Film,
  XCircle,
  Star,
  LayoutDashboard,
  RefreshCw,
  PauseCircle,
  SkipForward,
  Timer,
  Trash2,
  Vote,
} from "lucide-react";

const PartyCard = ({
  party,
  currentUser,
  onCrashParty,
  onReopenParty,
  onDeleteParty,
  isConcluded,
}) => {
  const navigate = useNavigate();

  const [nowPlayingDetails, setNowPlayingDetails] = useState(null);
  const [upNextDetails, setUpNextDetails] = useState(null);
  const [intermissionTime, setIntermissionTime] = useState(0);

  useEffect(() => {
    if (isConcluded) return; // Don't fetch details for concluded cards
    const fetchCardMovieDetails = async () => {
      setNowPlayingDetails(
        party.now_playing_tmdb_id
          ? await getMovieDetails(party.now_playing_tmdb_id)
          : null
      );
      setUpNextDetails(
        party.up_next_tmdb_id
          ? await getMovieDetails(party.up_next_tmdb_id)
          : null
      );
    };
    fetchCardMovieDetails();
  }, [party.now_playing_tmdb_id, party.up_next_tmdb_id, isConcluded]);

  useEffect(() => {
    if (isConcluded) return; // Don't run timer logic for concluded cards
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
  }, [party.party_state, isConcluded]);

  useEffect(() => {
    if (intermissionTime > 0) {
      const timerId = setTimeout(
        () => setIntermissionTime(intermissionTime - 1),
        1000
      );
      return () => clearTimeout(timerId);
    }
  }, [intermissionTime]);

  const formatTime = (time) => new Date(time).toLocaleString();
  const formatTimer = (seconds) =>
    `${Math.floor(seconds / 60)}:${("0" + (seconds % 60)).slice(-2)}`;
  const isConductor = currentUser && currentUser.id === party.conductor_id;
  const canReopen =
    isConductor &&
    party.end_time &&
    new Date() - new Date(party.end_time) < 3600000;

  const isPlaying = party.party_state?.status === "playing";
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
              !isConcluded
                ? "bg-green-500/20 text-green-400"
                : "bg-gray-600/30 text-gray-300"
            }`}
          >
            {!isConcluded ? (
              <PlayCircle size={16} />
            ) : (
              <CheckCircle size={16} />
            )}
            <span>{!isConcluded ? "Active" : "Concluded"}</span>
          </div>
        </div>

        {/* --- Conditional Info Display --- */}
        {isConcluded ? (
          <div className="space-y-3 text-gray-300 mb-4">
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-indigo-400" />
              <span>{`Ended: ${formatTime(party.end_time)}`}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-gray-300 mb-4">
            {party.voting_open && (
              <div className="flex items-center gap-3 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-md">
                <Vote size={18} />
                <span className="font-semibold">Voting is Open!</span>
              </div>
            )}
            {isIntermission ? (
              <div className="flex items-center gap-3 p-2 rounded-md bg-yellow-500/20 text-yellow-300">
                <Timer size={18} className="text-yellow-400" />
                <span className="font-semibold">
                  Intermission: {formatTimer(intermissionTime)}
                </span>
              </div>
            ) : (
              <div
                className={`flex items-center gap-3 p-2 rounded-md ${
                  isPlaying
                    ? "bg-green-500/20 text-green-300"
                    : "bg-yellow-500/20 text-yellow-300"
                }`}
              >
                {isPlaying ? (
                  <PlayCircle size={18} className="text-green-400" />
                ) : (
                  <PauseCircle size={18} className="text-yellow-400" />
                )}
                <span>
                  {isPlaying ? "Playing: " : "Paused: "}
                  <span className="font-semibold text-white ml-1">
                    {nowPlayingDetails?.title || "N/A"}
                  </span>
                </span>
              </div>
            )}
            {upNextDetails && (
              <div className="flex items-center gap-3 bg-purple-500/20 text-purple-300 px-3 py-1 rounded-md">
                <SkipForward size={18} />
                <span className="font-semibold">
                  Up Next: {upNextDetails.title}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Users size={18} className="text-indigo-400" />
              <span>{party.viewers_count || "1"} viewers</span>
            </div>
          </div>
        )}

        <div className="mt-auto">
          {/* --- Conditional Button Display --- */}
          {!isConcluded ? (
            // Active Party Buttons
            isConductor ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/dashboard/${party.id}`)}
                  className="w-full bg-gray-700 hover:bg-indigo-900 text-indigo-400 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                >
                  <LayoutDashboard size={18} /> Dashboard
                </button>
                <button
                  onClick={() => onCrashParty(party.id)}
                  className="flex-shrink-0 bg-gray-700 hover:bg-red-900 text-red-400 p-2 rounded-lg"
                >
                  <XCircle size={20} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate(`/party/${party.id}`)}
                className="w-full bg-gray-700 hover:bg-indigo-900 text-indigo-400 font-bold py-2 px-4 rounded-lg"
              >
                Join Party
              </button>
            )
          ) : // Concluded Party Buttons
          isConductor ? (
            <div className="grid grid-cols-3 gap-2">
              {canReopen && (
                <button
                  onClick={() => onReopenParty(party.id)}
                  className="col-span-3 bg-gray-700 hover:bg-indigo-900 text-indigo-400 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} /> Re-Open
                </button>
              )}
              <button
                onClick={() => alert("Review feature coming soon!")}
                className="col-span-3 bg-gray-700 hover:bg-sky-950 text-sky-400 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
              >
                <Star size={18} /> Review
              </button>
              <button
                onClick={() => onDeleteParty(party.id)}
                className="col-span-3 bg-gray-700 hover:bg-red-900 text-red-400 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
              >
                <Trash2 size={18} /> Delete Party
              </button>
            </div>
          ) : (
            <button
              onClick={() => alert("Review feature coming soon!")}
              className="w-full bg-gray-700 hover:bg-sky-950 text-sky-400 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
            >
              <Star size={18} />
              Review Party
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ConductorsPage = () => {
  const { user } = useAuth();

  const [activeParties, setActiveParties] = useState([]);
  const [concludedParties, setConcludedParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchParties = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("watch_parties")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching parties:", error);
      setError(error.message);
    } else {
      setActiveParties(data.filter((p) => p.status === "active"));
      setConcludedParties(data.filter((p) => p.status === "concluded"));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchParties();
  }, []);

  const handleCrashParty = async (partyId) => {
    const { error } = await supabase
      .from("watch_parties")
      .update({ status: "concluded", end_time: new Date().toISOString() })
      .eq("id", partyId);
    if (!error) fetchParties();
  };
  const handleReopenParty = async (partyId) => {
    const { error } = await supabase
      .from("watch_parties")
      .update({ status: "active", end_time: null })
      .eq("id", partyId);
    if (!error) fetchParties();
  };
  const handleDeleteParty = async (partyId) => {
    const { error } = await supabase
      .from("watch_parties")
      .delete()
      .eq("id", partyId);
    if (!error) fetchParties();
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
                  onDeleteParty={handleDeleteParty}
                  isConcluded={false}
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
                  onDeleteParty={handleDeleteParty}
                  isConcluded={true}
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
