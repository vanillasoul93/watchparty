import React, { useState, useEffect, useCallback, useRef } from "react";
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
  View,
  List,
  Grid,
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

  // --- MODIFIED useEffect ---
  useEffect(() => {
    const fetchCardDetails = async () => {
      // This logic for fetching Now Playing/Up Next should only run for ACTIVE parties.
      if (!isConcluded) {
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
      }

      // This logic will now run for BOTH active and concluded parties.
      const movieIdForImages =
        party.now_playing_tmdb_id || party.featured_movie_tmdb_id;
      if (movieIdForImages) {
        const backdropUrls = await getMovieBackdrops(movieIdForImages);
        setBackdrops(backdropUrls);
      }
    };
    fetchCardDetails();
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
    <div className="bg-gradient-to-br from-slate-800 to-slate-900/20 rounded-xl shadow-lg shadow-black/40 border border-transparent hover:border-indigo-500 transition-all duration-300 flex flex-col h-full ">
      <div className="relative w-full h-48 flex-shrink-0">
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
            <h3 className="text-2xl font-bold text-white h-16 line-clamp-2">
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

        {/* --- ADD flex-grow to this div --- */}
        <div className="flex-grow space-y-3 text-gray-300 mb-4">
          {isConcluded ? (
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-indigo-400" />
              <span>{`Ended: ${formatTime(party.end_time)}`}</span>
            </div>
          ) : (
            <>
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
                <span>{party.viewers_count || "0"} viewers</span>
              </div>
            </>
          )}
        </div>
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
                Join
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
                <Trash2 size={18} /> Delete
              </button>
            </div>
          ) : (
            <button
              onClick={() => alert("Review feature coming soon!")}
              className="w-full bg-gray-700 hover:bg-sky-950 text-sky-400 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
            >
              <Star size={18} />
              Review
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- MODIFIED: Compact Card View ---
const CompactPartyCard = ({
  party,
  currentUser,
  onCrashParty,
  onReopenParty,
  onDeleteParty,
  onSelectDashboard,
  onJoinParty,
  isConcluded,
}) => {
  const navigate = useNavigate();
  const [nowPlayingDetails, setNowPlayingDetails] = useState(null);
  const [upNextDetails, setUpNextDetails] = useState(null);
  const [intermissionTime, setIntermissionTime] = useState(0);

  useEffect(() => {
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
      const timerId = setTimeout(
        () => setIntermissionTime(intermissionTime - 1),
        1000
      );
      return () => clearTimeout(timerId);
    }
  }, [intermissionTime]);

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
    <div className="bg-gradient-to-br from-slate-800 to-slate-900/20 rounded-xl shadow-lg border border-slate-800 hover:border-indigo-500 transition-all duration-300 flex flex-col p-4 justify-between">
      <div>
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-bold text-white truncate">
            {party.party_name}
          </h3>
          <div
            className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${
              !isConcluded
                ? "bg-green-500/20 text-green-400"
                : "bg-gray-600/30 text-gray-300"
            }`}
          >
            {!isConcluded ? (
              <PlayCircle size={14} />
            ) : (
              <CheckCircle size={14} />
            )}
            <span>{!isConcluded ? "Active" : "Concluded"}</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          by {party.conductor_username || "Anonymous"}
        </p>

        <div className="space-y-2 text-sm">
          {/* --- ADDED: "Voting is Open" indicator --- */}
          {party.voting_open && (
            <div className="flex items-center gap-2 text-blue-300">
              <Vote size={16} />
              <span className="font-semibold">Voting is Open!</span>
            </div>
          )}
          {isIntermission ? (
            <div className="flex items-center gap-2 text-yellow-300">
              <Timer size={16} />
              <span>Intermission: {formatTimer(intermissionTime)}</span>
            </div>
          ) : (
            <div
              className={`flex items-center gap-2 ${
                isPlaying ? "text-green-400" : "text-yellow-400"
              }`}
            >
              {isPlaying ? <PlayCircle size={16} /> : <PauseCircle size={16} />}
              <span className="truncate">
                {isPlaying ? "Playing" : "Paused"}: {nowPlayingDetails?.title}{" "}
                {nowPlayingDetails?.year && `(${nowPlayingDetails.year})`}
              </span>
            </div>
          )}
          {upNextDetails && (
            <div className="flex items-center gap-2 text-gray-300">
              <SkipForward size={16} className="text-purple-400" />
              <span className="truncate">
                Up Next: {upNextDetails.title}{" "}
                {upNextDetails.year && `(${upNextDetails.year})`}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-300">
            <Users size={16} className="text-indigo-400" />
            <span>{party.viewers_count || "0"} viewers</span>
          </div>
        </div>
      </div>
      <div className="mt-4">
        {isConcluded ? (
          isConductor ? (
            <div className="flex items-center gap-2">
              {canReopen && (
                <button
                  onClick={() => onReopenParty(party.id)}
                  className="w-full bg-gray-700 hover:bg-indigo-900 text-indigo-400 font-bold py-2 px-3 rounded-lg text-sm"
                >
                  Re-Open
                </button>
              )}
              <button
                onClick={() => onDeleteParty(party.id)}
                className="w-full bg-gray-700 hover:bg-red-900 text-red-400 font-bold py-2 px-3 rounded-lg text-sm"
              >
                Delete
              </button>
            </div>
          ) : (
            <button
              onClick={() => alert("Review feature coming soon!")}
              className="w-full bg-gray-700 hover:bg-sky-950 text-sky-400 font-bold py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2"
            >
              <Star size={16} /> Review Party
            </button>
          )
        ) : isConductor ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/dashboard/${party.id}`)}
              className="w-full bg-gray-700 hover:bg-indigo-900 text-indigo-400 font-bold py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2"
            >
              <LayoutDashboard size={16} /> Dashboard
            </button>
            <button
              onClick={() => onCrashParty(party.id)}
              className="flex-shrink-0 bg-gray-700 hover:bg-red-900 text-red-400 p-2 rounded-lg"
            >
              <XCircle size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate(`/party/${party.id}`)}
            className="w-full bg-gray-700 hover:bg-indigo-900 text-indigo-400 font-bold py-2 px-3 rounded-lg text-sm"
          >
            Join Party
          </button>
        )}
      </div>
    </div>
  );
};

// --- MODIFIED: List View ---
const ListPartyCard = ({
  party,
  currentUser,
  onCrashParty,
  onReopenParty,
  onDeleteParty,
  onSelectDashboard,
  onJoinParty,
  isConcluded,
}) => {
  const navigate = useNavigate();
  const isConductor = currentUser && currentUser.id === party.conductor_id;
  const canReopen =
    isConductor &&
    party.end_time &&
    new Date() - new Date(party.end_time) < 3600000;

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900/20 shadow-lg shadow-black/20 rounded-lg p-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 truncate">
        <img
          src={
            party.featured_movie_image_url ||
            "https://placehold.co/100x100/1a202c/ffffff?text=?"
          }
          alt={party.featured_movie}
          className="w-15 h-24 object-cover rounded-md flex-shrink-0"
        />
        <div className="truncate">
          <p className="font-semibold text-white truncate">
            {party.party_name}
          </p>
          <p className="text-sm text-gray-400 truncate">
            by {party.conductor_username || "Anonymous"}
          </p>
        </div>
      </div>
      <div className="flex-shrink-0">
        {isConcluded ? (
          isConductor ? (
            <div className="flex items-center gap-2">
              {canReopen && (
                <button
                  onClick={() => onReopenParty(party.id)}
                  className="bg-gray-700 hover:bg-indigo-900 text-indigo-400 font-bold py-2 px-3 rounded-lg text-sm"
                >
                  Re-Open
                </button>
              )}
              <button
                onClick={() => onDeleteParty(party.id)}
                className="bg-gray-700 hover:bg-red-900 text-red-400 font-bold py-2 px-3 rounded-lg text-sm"
              >
                Delete
              </button>
            </div>
          ) : (
            <button
              onClick={() => alert("Review feature coming soon!")}
              className="bg-gray-700 hover:bg-sky-950 text-sky-400 font-bold py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2"
            >
              <Star size={16} /> Review
            </button>
          )
        ) : isConductor ? (
          <button
            onClick={() => navigate(`/dashboard/${party.id}`)}
            className="bg-gray-700 hover:bg-indigo-900 text-indigo-400 font-bold py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2"
          >
            <LayoutDashboard size={16} /> Dashboard
          </button>
        ) : (
          <button
            onClick={() => navigate(`/party/${party.id}`)}
            className="w-full bg-gray-700 hover:bg-indigo-900 text-indigo-400 font-bold py-2 px-3 rounded-lg text-sm"
          >
            Join
          </button>
        )}
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
  // --- NEW: State to manage the active tab ---
  const [activeTab, setActiveTab] = useState("conducting"); // 'conducting', 'active', 'concluded'

  const [viewMode, setViewMode] = useState("card"); // 'card', 'compact', or 'list'

  // --- 1. fetchParties is now defined in the component scope and wrapped in useCallback ---
  const fetchParties = useCallback(async () => {
    // We don't set loading to true here because this will be called by the real-time listener.
    // The main useEffect will handle the initial loading state.
    setError(null);
    const { data, error } = await supabase
      .from("watch_parties")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching parties:", error);
      setError(error.message);
    } else if (data && user) {
      const allActive = data.filter((p) => p.status === "active");
      setMyActiveParties(allActive.filter((p) => p.conductor_id === user.id));
      setActivePublicParties(
        allActive.filter((p) => p.conductor_id !== user.id && p.is_public)
      );
      setConcludedParties(
        data.filter((p) => p.status === "concluded" && p.is_public)
      );
    }
  }, [user]); // It correctly depends on the user object

  // --- 2. A single, unified useEffect for the initial data load and the subscription ---
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchParties().then(() => {
      setLoading(false);
    });

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
    if (!inviteCodeInput.trim()) {
      setJoinError("Please enter an invite code.");
      return;
    }
    setJoinError("");

    const { data, error } = await supabase
      .from("watch_parties")
      .select("id")
      .eq("invite_code", inviteCodeInput.trim().toUpperCase())
      .single();

    if (error || !data) {
      setJoinError("Invalid invite code. Please try again.");
    } else {
      setShowJoinModal(false);
      setInviteCodeInput("");
      navigate(`/party/${data.id}`);
    }
  };

  // Helper to choose the right card component based on viewMode
  const renderPartyCard = (party, isConcluded = false) => {
    const props = {
      party,
      currentUser: user,
      onCrashParty: handleCrashParty,
      onReopenParty: handleReopenParty,
      onDeleteParty: handleDeleteParty,
      isConcluded,
    };
    switch (viewMode) {
      case "compact":
        return <CompactPartyCard key={party.id} {...props} />;
      case "list":
        return <ListPartyCard key={party.id} {...props} />;
      case "card":
      default:
        // The PartyCard no longer needs a special wrapper
        return <PartyCard key={party.id} {...props} />;
    }
  };

  // --- 3. These handlers now correctly call the accessible fetchParties function ---
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

  // 3. Create a new handler for tab clicks
  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    // Scroll the content area into view with a smooth behavior
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      {showJoinModal && (
        <div className="fixed inset-0 bg-gray-900/90 flex items-center justify-center z-70 p-4 h-screen">
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
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-5xl font-extrabold text-white">
              Conductor Hub
            </h1>
            <div className="flex items-center gap-4">
              <div className="bg-gray-800 p-1 rounded-lg flex items-center gap-1">
                <button
                  onClick={() => setViewMode("card")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "card"
                      ? "bg-indigo-600 text-white"
                      : "text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  <Grid size={20} />
                </button>
                <button
                  onClick={() => setViewMode("compact")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "compact"
                      ? "bg-indigo-600 text-white"
                      : "text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  <View size={20} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "list"
                      ? "bg-indigo-600 text-white"
                      : "text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  <List size={20} />
                </button>
              </div>
              <button
                onClick={() => setShowJoinModal(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                <KeyRound size={20} /> Join Private Party
              </button>
            </div>
          </div>

          {/* --- NEW: Tab Navigation --- */}
          <div className="sticky top-17 z-60  bg-gray-900/80 backdrop-blur-sm p-4 shadow-lg mb-8 border-b border-gray-700">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => handleTabClick("conducting")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "conducting"
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500"
                }`}
              >
                Conducting ({myActiveParties.length})
              </button>
              <button
                onClick={() => handleTabClick("active")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "active"
                    ? "border-green-500 text-green-400"
                    : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500"
                }`}
              >
                Active Public Parties ({activePublicParties.length})
              </button>
              <button
                onClick={() => handleTabClick("concluded")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "concluded"
                    ? "border-amber-500 text-amber-400"
                    : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500"
                }`}
              >
                Recently Concluded ({concludedParties.length})
              </button>
            </nav>
          </div>

          {/* --- NEW: Conditional Rendering of Tab Content --- */}
          <div>
            {activeTab === "conducting" && (
              <section>
                <h2 className="text-3xl font-bold text-white mb-6 border-l-4 border-indigo-500 pl-4 flex items-center gap-3">
                  <UserCheck size={28} /> Conducting
                </h2>
                {myActiveParties.length > 0 ? (
                  // --- This container now handles all three view modes vertically ---
                  <div
                    className={
                      viewMode === "list"
                        ? "space-y-3"
                        : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8"
                    }
                  >
                    {myActiveParties.map((party) =>
                      renderPartyCard(party, false)
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 bg-gray-800 p-6 rounded-lg">
                    You have no active parties.
                  </p>
                )}
              </section>
            )}

            {activeTab === "active" && (
              <section>
                <h2 className="text-3xl font-bold text-white mb-6 border-l-4 border-green-500 pl-4 flex items-center gap-3">
                  <Vote size={28} /> Active
                </h2>
                {activePublicParties.length > 0 ? (
                  <div
                    className={
                      viewMode === "list"
                        ? "space-y-3"
                        : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8"
                    }
                  >
                    {activePublicParties.map((party) =>
                      renderPartyCard(party, false)
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 bg-gray-800 p-6 rounded-lg">
                    No active public parties at the moment.
                  </p>
                )}
              </section>
            )}

            {activeTab === "concluded" && (
              <section>
                <h2 className="text-3xl font-bold text-white mb-6 border-l-4 border-amber-500 pl-4 flex items-center gap-3">
                  <Timer size={28} /> Recently Concluded
                </h2>
                {concludedParties.length > 0 ? (
                  <div
                    className={
                      viewMode === "list"
                        ? "space-y-3"
                        : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8"
                    }
                  >
                    {concludedParties.map((party) =>
                      renderPartyCard(party, true)
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 bg-gray-800 p-6 rounded-lg">
                    No recently concluded public parties found.
                  </p>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ConductorsPage;
