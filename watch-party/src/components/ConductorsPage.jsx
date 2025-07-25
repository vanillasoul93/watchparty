import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/Auth";
import { useNavigate } from "react-router-dom";
import { getMovieDetails, getMovieBackdrops } from "../api/tmdb";
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
  KeyRound,
  UserCheck,
} from "lucide-react";

const PartyCard = ({
  party,
  currentUser,
  onCrashParty,
  onReopenParty,
  onDeleteParty,
  isConcluded,
}) => {
  // ... PartyCard component remains the same ...
  const navigate = useNavigate();
  const [nowPlayingDetails, setNowPlayingDetails] = useState(null);
  const [upNextDetails, setUpNextDetails] = useState(null);
  const [intermissionTime, setIntermissionTime] = useState(0);
  const [backdrops, setBackdrops] = useState([]);
  const [currentBackdropIndex, setCurrentBackdropIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (isConcluded) return;
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
      const movieIdForImages =
        party.now_playing_tmdb_id || party.featured_movie_tmdb_id;
      if (movieIdForImages) {
        const backdropUrls = await getMovieBackdrops(movieIdForImages);
        setBackdrops(backdropUrls);
      }
    };
    fetchCardMovieDetails();
  }, [
    party.now_playing_tmdb_id,
    party.featured_movie_tmdb_id,
    party.up_next_tmdb_id,
    isConcluded,
  ]);

  useEffect(() => {
    if (backdrops.length > 1) {
      const timer = setInterval(() => {
        setIsFading(true);
        setTimeout(() => {
          setCurrentBackdropIndex(
            (prevIndex) => (prevIndex + 1) % backdrops.length
          );
          setIsFading(false);
        }, 500);
      }, 15000);
      return () => clearInterval(timer);
    }
  }, [backdrops]);

  useEffect(() => {
    if (isConcluded) return;
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
  const currentImage =
    backdrops.length > 0
      ? backdrops[currentBackdropIndex]
      : nowPlayingDetails?.imageUrl ||
        party.featured_movie_image_url ||
        "https://placehold.co/400x225/1a202c/ffffff?text=No+Image";

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 hover:border-indigo-500 transition-all duration-300 flex flex-col">
      <div className="relative w-full h-48">
        <img
          key={currentImage}
          src={currentImage}
          alt={nowPlayingDetails?.title || party.featured_movie}
          className={`w-full h-full object-cover rounded-t-xl absolute top-0 left-0 transition-opacity duration-500 ${
            isFading ? "opacity-0" : "opacity-100"
          }`}
        />
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-bold text-white">
              {party.party_name}
            </h3>
            <p className="text-sm text-gray-400">
              by{" "}
              <span className="font-semibold text-indigo-300">
                {party.conductor_username || "Anonymous"}
              </span>
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
                    {nowPlayingDetails?.title +
                      " (" +
                      nowPlayingDetails?.year +
                      ")" || "N/A"}
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
              <Users size={18} className="text-indigo-400" />
              <span>{party.viewers_count || "1"} viewers</span>
            </div>
          </div>
        )}
        <div className="mt-auto">
          {!isConcluded ? (
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
          ) : isConductor ? (
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
  const navigate = useNavigate();

  const [myActiveParties, setMyActiveParties] = useState([]);
  const [activePublicParties, setActivePublicParties] = useState([]);
  const [concludedParties, setConcludedParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [joinError, setJoinError] = useState("");

  // --- MODIFIED: fetchParties is now outside the useEffect and wrapped in useCallback ---
  const fetchParties = useCallback(async () => {
    // We don't need to set loading to true here because the Realtime handler will call this.
    // Only the initial load should show the full loading screen.
    setError(null);
    const { data, error } = await supabase
      .from("watch_parties")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching parties:", error);
      setError(error.message);
    } else if (data) {
      const allActive = data.filter((p) => p.status === "active");
      if (user) {
        setMyActiveParties(allActive.filter((p) => p.conductor_id === user.id));
        setActivePublicParties(
          allActive.filter((p) => p.conductor_id !== user.id && p.is_public)
        );
      } else {
        setActivePublicParties(allActive.filter((p) => p.is_public));
      }
      setConcludedParties(
        data.filter((p) => p.status === "concluded" && p.is_public)
      );
    }
  }, [user]); // Dependency on user is correct

  // --- MODIFIED: This is now a single, unified useEffect for data and subscriptions ---
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Initial fetch on component mount
    setLoading(true);
    fetchParties().then(() => setLoading(false));

    // Realtime subscription setup
    const subscription = supabase
      .channel("public:watch_parties")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "watch_parties" },
        (payload) => {
          console.log("Party data changed, refreshing list...", payload);
          fetchParties();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, fetchParties]);

  const handleJoinPrivateParty = async () => {
    /* ... remains the same ... */
  };

  // --- MODIFIED: These handlers now correctly call the memoized fetchParties function ---
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

  if (loading)
    return (
      <div className="text-center text-white pt-40">Loading parties...</div>
    );
  if (error)
    return <div className="text-center text-red-500 pt-40">Error: {error}</div>;

  return (
    <>
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 max-w-sm w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">
              Join Private Party
            </h2>
            <p className="text-gray-400 mb-6">
              Enter the invite code below to join the party.
            </p>
            <input
              type="text"
              value={inviteCodeInput}
              onChange={(e) => setInviteCodeInput(e.target.value)}
              className="w-full bg-gray-700 border-2 border-gray-600 text-white rounded-lg p-3 text-center font-mono text-lg tracking-widest"
              placeholder="A1B2C3"
            />
            {joinError && (
              <p className="text-red-400 text-sm mt-2">{joinError}</p>
            )}
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowJoinModal(false)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinPrivateParty}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-gray-900 min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h1 className="text-5xl font-extrabold text-white">
              Conductor Hub
            </h1>
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              <KeyRound size={20} /> Join Private Party
            </button>
          </div>
          <section>
            <h2 className="text-3xl font-bold text-white mb-6 border-l-4 border-indigo-500 pl-4 flex items-center gap-3">
              <UserCheck size={28} /> Conducting
            </h2>
            {myActiveParties.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {myActiveParties.map((party) => (
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
                You have no active parties.
              </p>
            )}
          </section>
          <section className="mt-12">
            <h2 className="text-3xl font-bold text-white mb-6 border-l-4 border-green-500 pl-4">
              Active Public Parties
            </h2>
            {activePublicParties.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {activePublicParties.map((party) => (
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
                No active public parties at the moment.
              </p>
            )}
          </section>
          <section className="mt-12">
            <h2 className="text-3xl font-bold text-white mb-6 border-l-4 border-gray-500 pl-4">
              Recently Concluded Public Parties
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
                No recently concluded public parties found.
              </p>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

export default ConductorsPage;
