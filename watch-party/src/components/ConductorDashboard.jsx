import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/Auth";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  getMovieDetails,
  searchTMDb,
  getMovieDetailsWithCredits,
} from "../api/tmdb";
import WatchList from "./WatchList";
import VerticalDashboardControls from "./VerticalDashboardControls";
import MoviePoll from "./MoviePoll";
import MovieDetailsModal from "./MovieDetailsModal";
import ViewerSuggestions from "./ViewerSuggestions";
import ViewersList from "./ViewersList";
import ReviewMovieModal from "./ReviewMovieModal";
import NotificationModal from "./NotificationModal";
import {
  ArrowLeft,
  Search,
  LinkIcon,
  Edit3,
  Save,
  X,
  Settings,
  ChevronUp,
  ChevronDown,
  Copy,
  Check,
  KeyRound,
} from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";

// --- NEW: A dedicated component for invite links ---
const PartyInviteCard = ({ party }) => {
  const [linkCopied, setLinkCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const partyUrl = `${window.location.origin}/party/${party.id}`;

  const handleCopy = (textToCopy, setCopied) => {
    navigator.clipboard.writeText(textToCopy).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        console.error("Failed to copy: ", err);
      }
    );
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 shadow-xl shadow-black/10 p-6 rounded-lg space-y-4">
      {/* Shareable Link */}
      <div>
        <h3 className="font-bold text-white mb-2 flex items-center gap-2">
          <LinkIcon size={20} /> Invite Link
        </h3>
        <div className="flex items-center gap-2">
          <p className="text-indigo-400 font-mono text-sm truncate flex-grow bg-gray-800 p-2 rounded-md">
            {partyUrl}
          </p>
          <button
            onClick={() => handleCopy(partyUrl, setLinkCopied)}
            className={`p-2 rounded-lg transition-colors ${
              linkCopied
                ? "bg-green-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-indigo-600"
            }`}
          >
            {linkCopied ? <Check size={20} /> : <Copy size={20} />}
          </button>
        </div>
      </div>

      {/* Invite Code (only for private parties) */}
      {!party.is_public && party.invite_code && (
        <div>
          <h3 className="font-bold text-white mb-2 flex items-center gap-2">
            <KeyRound size={20} /> Invite Code
          </h3>
          <div className="flex items-center gap-2">
            <p className="text-amber-400 font-mono text-lg tracking-widest flex-grow bg-gray-800 p-2 rounded-md text-center">
              {party.invite_code}
            </p>
            <button
              onClick={() => handleCopy(party.invite_code, setCodeCopied)}
              className={`p-2 rounded-lg transition-colors ${
                codeCopied
                  ? "bg-green-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-indigo-600"
              }`}
            >
              {codeCopied ? <Check size={20} /> : <Copy size={20} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const MovieSearchInput = ({ onSelect, existingIds = [] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // 2. Use the hook to create a debounced version of the search term.
  // It will wait 500ms after the user stops typing before updating.
  const debouncedSearchTerm = useDebounce(searchTerm, 250);

  // 3. Create a useEffect that runs only when the DEBOUNCED term changes.
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
        className="w-full bg-slate-800 border-2 border-gray-600 text-white rounded-lg p-3 pl-10 focus:border-indigo-700 focus:outline-none transition"
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

const StreamLinkCard = ({ initialUrl, onUpdate }) => {
  const [url, setUrl] = useState(initialUrl || "");
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdate = () => {
    onUpdate(url);
    setIsEditing(false);
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 shadow-xl shadow-black/10 p-6 rounded-lg">
      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
        <LinkIcon size={20} /> Stream Link
      </h3>
      {isEditing ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full bg-gray-700 border-2 border-gray-600 text-white rounded-lg p-2"
            placeholder="https://..."
          />
          <button
            onClick={handleUpdate}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Save
          </button>
        </div>
      ) : (
        <div className="flex justify-between items-center">
          <p className="text-indigo-400 font-mono text-sm truncate">
            {url || "No link set"}
          </p>
          <button
            onClick={() => setIsEditing(true)}
            className="bg-gray-700 hover:bg-indigo-900 text-indigo-400 font-bold py-2 px-4 rounded-lg"
          >
            {url ? "Edit" : "Set Link"}
          </button>
        </div>
      )}
    </div>
  );
};

const PartySettings = ({ party, onUpdate }) => {
  const [votes, setVotes] = useState(party.votes_per_user);
  const [suggestions, setSuggestions] = useState(party.suggestions_per_user);

  const handleSave = () => {
    onUpdate({
      votes_per_user: parseInt(votes, 10),
      suggestions_per_user: parseInt(suggestions, 10),
    });
  };

  // Helper functions to increment/decrement values
  const handleVoteChange = (amount) => {
    const newValue = Math.max(1, Math.min(10, votes + amount));
    setVotes(newValue);
  };
  const handleSuggestionChange = (amount) => {
    const newValue = Math.max(0, Math.min(5, suggestions + amount));
    setSuggestions(newValue);
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 shadow-xl shadow-black/10 p-6 rounded-lg flex flex-col h-full">
      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
        <Settings size={20} /> Party Settings
      </h3>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-gray-300">Votes per Viewer</label>
          {/* --- MODIFIED: Input with custom buttons --- */}
          <div className="relative">
            <input
              type="number"
              value={votes}
              onChange={(e) => setVotes(parseInt(e.target.value, 10))}
              // This class hides the default spinners
              className="w-24 bg-slate-800 border-2 border-gray-600 text-white rounded-lg p-2 text-center focus:outline-none focus:border-indigo-600 hover:border-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              min="1"
              max="10"
            />
            <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-center">
              <button
                onClick={() => handleVoteChange(1)}
                className="px-1 text-gray-300 hover:text-green-400"
              >
                <ChevronUp size={16} />
              </button>
              <button
                onClick={() => handleVoteChange(-1)}
                className="px-1 text-gray-300 hover:text-red-400"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <label className="text-gray-300">Suggestions per Viewer</label>
          {/* --- MODIFIED: Input with custom buttons --- */}
          <div className="relative">
            <input
              type="number"
              value={suggestions}
              onChange={(e) => setSuggestions(parseInt(e.target.value, 10))}
              className="w-24 bg-slate-800 border-2 border-gray-600 text-white rounded-lg p-2 text-center focus:outline-none focus:border-indigo-600 hover:border-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              min="0"
              max="5"
            />
            <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-center">
              <button
                onClick={() => handleSuggestionChange(1)}
                className="px-1 text-gray-300 hover:text-green-400"
              >
                <ChevronUp size={16} />
              </button>
              <button
                onClick={() => handleSuggestionChange(-1)}
                className="px-1 text-gray-300 hover:text-red-400"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-grow"></div>
      <div>
        <button
          onClick={handleSave}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg mt-6"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};

const ConductorDashboard = () => {
  const { partyId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromTab = searchParams.get("from"); // This will be 'conducting', 'active', etc.
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
  const [tiedMovies, setTiedMovies] = useState([]);
  // --- NEW STATE for inline editing the party title ---
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [partyTitleInput, setPartyTitleInput] = useState("");
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [modalMovieData, setModalMovieData] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);

  const [allFavoriteMovies, setAllFavoriteMovies] = useState([]);
  const [isAuthorized, setIsAuthorized] = useState(false);

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
    setMovieToReview(movie); // This opens the review modal
  };

  const handleUpdateSettings = (settings) => {
    updatePartyStatus(settings);
  };

  const handleEditTitle = () => {
    setPartyTitleInput(party.party_name); // Pre-fill the input with the current name
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    if (partyTitleInput.trim()) {
      updatePartyStatus({ party_name: partyTitleInput.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setPartyTitleInput(""); // Clear the input
  };

  const handleUpdateStreamUrl = (newUrl) => {
    updatePartyStatus({ stream_url: newUrl });
  };

  useEffect(() => {
    userProfileRef.current = userProfile;
  }, [userProfile]);

  // This single, unified useEffect handles both initial data fetching and all Realtime subscriptions
  useEffect(() => {
    if (!partyId || !user) return;

    const refreshVoteCounts = async () => {
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
    };

    const refreshSuggestionData = async () => {
      const { data, error } = await supabase
        .from("suggestions")
        .select("*, profiles (suggest_anonymously)")
        .eq("party_id", partyId);
      if (error) {
        console.error("Error fetching suggestions:", error);
      } else if (data) {
        setSuggestions(data);
      }
    };

    // Fetch initial data (but don't do the security check yet)
    const fetchInitialData = async () => {
      const [partyRes, profileRes] = await Promise.all([
        supabase.from("watch_parties").select("*").eq("id", partyId).single(),
        supabase
          .from("profiles")
          .select("prompt_for_reviews, all_favorite_movies")
          .eq("id", user.id)
          .single(),
      ]);

      if (partyRes.error) {
        setError("Failed to load party details.");
      } else {
        setParty(partyRes.data);
      }

      if (profileRes.data) {
        setUserProfile(profileRes.data);
        setAllFavoriteMovies(
          Array.isArray(profileRes.data.all_favorite_movies)
            ? profileRes.data.all_favorite_movies
            : []
        );
      }

      await Promise.all([refreshVoteCounts(), refreshSuggestionData()]);
    };

    fetchInitialData();

    // Now, set up the subscription with the locally defined refresh functions.
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
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        refreshSuggestionData
      )
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await partyChannel.track({
            user_id: user.id,
            username: user.user_metadata?.username || "Conductor",
            is_conductor: true,
          });
        }
      });

    return () => {
      supabase.removeChannel(partyChannel);
    };
  }, [partyId, user]); // This effect re-runs ONLY if the party or user changes.

  // --- NEW: A separate useEffect dedicated to the security check ---
  useEffect(() => {
    // Only run this check if we have both the user and the party data.
    if (user && party) {
      if (party.conductor_id === user.id) {
        setIsAuthorized(true);
        setLoading(false); // We are authorized and ready to show the page
      } else {
        setError("Access Denied: You are not the conductor of this party.");
        setLoading(false);
        setTimeout(() => navigate("/conductors"), 3000);
      }
    }
  }, [party, user, navigate]); // This runs whenever party or user data changes

  // This effect manages adding/removing the conductor from the persistent viewers table,
  // which in turn triggers the database functions to update the count.
  useEffect(() => {
    if (!partyId || !user) {
      setLoading(false); // Stop loading if we don't have what we need
      return;
    }

    const joinParty = async () => {
      await supabase.from("party_viewers").upsert(
        {
          party_id: partyId,
          user_id: user.id,
          username: user.user_metadata?.username || "Conductor",
        },
        { onConflict: "party_id, user_id" }
      );
    };

    joinParty();

    // The return function runs when the component unmounts (conductor leaves the page)
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
    // Case 1: A movie is already loaded and just needs to be un-paused.
    if (nowPlayingMovieDetails) {
      const paused_duration = party.last_pause_time
        ? new Date().getTime() - new Date(party.last_pause_time).getTime()
        : 0;
      const new_start_time = new Date(
        new Date(party.playback_start_time).getTime() + paused_duration
      );

      updatePartyStatus({
        party_state: { status: "playing" },
        playback_start_time: new_start_time.toISOString(),
        last_pause_time: null,
      });
      return;
    }

    // Case 2: No movie is playing, but there is one "Up Next".
    if (upNextMovie) {
      const newPollList = party.poll_movies.filter(
        (movie) => movie.id !== upNextMovie.id
      );

      // --- FIXED: Added missing fields to the update ---
      updatePartyStatus({
        now_playing_tmdb_id: upNextMovie.id,
        now_playing_title: upNextMovie.title, // This was missing
        now_playing_image_url: upNextMovie.imageUrl, // This was missing
        poll_movies: newPollList,
        party_state: { status: "playing" },
        up_next_tmdb_id: null,
        playback_start_time: new Date().toISOString(),
        last_pause_time: null,
      });
      setUpNextMovie(null);
    } else {
      // Case 3: No movie is paused and nothing is up next.
      setError("No movie is queued up. Please select one from the poll.");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handlePause = () => {
    updatePartyStatus({
      party_state: { status: "paused" },
      last_pause_time: new Date().toISOString(), // Record the time it was paused
    });
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
      handleConfirmCrash(false);
    }
  };

  const handleConfirmCrash = (markAsWatched) => {
    const channel = supabase.channel(`party:${partyId}`);
    channel.send({
      type: "broadcast",
      event: "party-crashed",
      payload: { message: "The conductor has ended the party." },
    });
    supabase.removeChannel(channel);
    console.log("PARTY ID = " + partyId);
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
    navigate("/review-party/" + partyId);
  };

  const handleCancelCrash = () => {
    setShowCrashConfirmation(false);
  };

  const handleOpenPoll = () => {
    // Reset the vote counts to zero before opening the new poll
    setPollVoteCounts({});

    // Then, open the poll
    updatePartyStatus({ voting_open: true });
  };

  const handleClosePoll = () => {
    if (!party.poll_movies || party.poll_movies.length === 0) {
      alert("Poll canceled: The poll was empty.");
      updatePartyStatus({ voting_open: false });
      return;
    }

    const totalVotes = Object.values(pollVoteCounts).reduce(
      (sum, count) => sum + count,
      0
    );

    if (totalVotes === 0) {
      setShowZeroVotesDialog(true);
      return;
    }

    let highestVoteCount = 0;
    let winners = [];
    party.poll_movies.forEach((movie) => {
      const voteCount = pollVoteCounts[movie.id] || 0;
      if (voteCount > highestVoteCount) {
        highestVoteCount = voteCount;
        winners = [movie];
      } else if (voteCount === highestVoteCount) {
        winners.push(movie);
      }
    });

    if (winners.length === 1) {
      const winner = winners[0];

      // --- NEW LOGIC ---
      // Start with the current poll list
      let newPollList = [...party.poll_movies];
      // If a movie is getting bumped from "Up Next", add it back to the poll
      if (upNextMovie) {
        newPollList.push(upNextMovie);
      }
      // Then, remove the new winner from the poll list
      newPollList = newPollList.filter((movie) => movie.id !== winner.id);
      // --- END NEW LOGIC ---

      setUpNextMovie(winner);
      updatePartyStatus({
        voting_open: false,
        up_next_tmdb_id: winner.id,
        poll_movies: newPollList,
      });
    } else {
      setTiedMovies(winners);
    }
    // Reset the vote counts to zero before opening the new poll
    setPollVoteCounts({});
  };

  const handleManualSelect = (winner) => {
    // Remove the selected winner from the poll list
    const newPollList = party.poll_movies.filter(
      (movie) => movie.id !== winner.id
    );

    // Set the winner as "Up Next"
    setUpNextMovie(winner);
    updatePartyStatus({
      voting_open: false,
      up_next_tmdb_id: winner.id,
      poll_movies: newPollList,
    });

    // Close the dialog
    setShowZeroVotesDialog(false);
  };

  // This new function handles the conductor's choice from the tie-breaker modal
  const handleTiebreakerSelect = (winner) => {
    // --- NEW LOGIC ---
    let newPollList = [...party.poll_movies];
    if (upNextMovie) {
      newPollList.push(upNextMovie);
    }
    newPollList = newPollList.filter((movie) => movie.id !== winner.id);
    // --- END NEW LOGIC ---

    setUpNextMovie(winner);
    updatePartyStatus({
      voting_open: false,
      up_next_tmdb_id: winner.id,
      poll_movies: newPollList,
    });
    setTiedMovies([]);
  };

  const handleSelectRandom = () => {
    const randomIndex = Math.floor(Math.random() * party.poll_movies.length);
    const randomMovie = party.poll_movies[randomIndex];

    // --- NEW LOGIC ---
    let newPollList = [...party.poll_movies];
    if (upNextMovie) {
      newPollList.push(upNextMovie);
    }
    newPollList = newPollList.filter((movie) => movie.id !== randomMovie.id);
    // --- END NEW LOGIC ---

    setUpNextMovie(randomMovie);
    updatePartyStatus({
      voting_open: false,
      up_next_tmdb_id: randomMovie.id,
      poll_movies: newPollList,
    });
    setShowZeroVotesDialog(false);
  };

  const handleCrashFromDialog = () => {
    setShowZeroVotesDialog(false);
    handleCrashParty();
  };

  const handleCancelPoll = async () => {
    // 1. Delete all votes for this party from the database
    await supabase.from("votes").delete().eq("party_id", partyId);

    // 2. Reset the local vote counts in the UI
    setPollVoteCounts({});

    // 3. Update the party status to close the poll
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

    setNotification({
      show: true,
      message: `${movieToReview.title} has been added to your movie history!`,
      type: "success",
    });
  };

  // --- NEW: Handler to add a movie to the full favorites list ---
  const handleAddToFavorites = async (movieToAdd) => {
    if (!movieToAdd) return;

    const isAlreadyFavorite = allFavoriteMovies.some(
      (fav) => fav.id === movieToAdd.id
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

    const newFavorites = [
      ...allFavoriteMovies,
      {
        id: movieToAdd.id,
        title: movieToAdd.title,
        year: movieToAdd.year,
        imageUrl: movieToAdd.imageUrl,
      },
    ];

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

  if (loading)
    return (
      <div className="text-center text-white pt-40">Verifying access...</div>
    );
  if (error)
    return <div className="text-center text-red-500 pt-40">{error}</div>;

  // Do not render the dashboard until authorization is confirmed
  if (!isAuthorized) return null;

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
      {showCrashConfirmation && (
        <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50">
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
        <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-8 max-w-lg w-full text-center shadow-2xl shadow-black/20">
            <h2 className="text-2xl font-bold text-white mb-4">
              No Votes Received
            </h2>
            <p className="text-gray-300 mb-6">
              The poll closed with zero votes. Please select a movie from the
              list or choose another option.
            </p>

            {/* --- NEW: List of movies to choose from --- */}
            <div className="space-y-3 mb-6 max-h-140 overflow-y-auto pr-2">
              {party.poll_movies.map((movie) => (
                <button
                  key={movie.id}
                  onClick={() => handleManualSelect(movie)}
                  className="w-full bg-gray-700 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg text-left flex items-center gap-4 transition-colors"
                >
                  <img
                    src={movie.imageUrl}
                    alt={movie.title}
                    className="w-10 h-16 object-cover rounded"
                  />
                  <span>
                    {movie.title} ({movie.year})
                  </span>
                </button>
              ))}
            </div>

            <hr className="border-gray-600 mb-6" />

            {/* Existing Options */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSelectRandom}
                className="bg-gray-600 hover:bg-blue-900 text-blue-400 font-bold py-2 px-4 rounded-lg"
              >
                Random Movie
              </button>
              <button
                onClick={handleReturnToPoll}
                className="bg-gray-600 hover:bg-purple-900 text-purple-400 font-bold py-2 px-4 rounded-lg"
              >
                Return to Poll
              </button>
              <button
                onClick={handleCancelPoll}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                Cancel Poll
              </button>
              <button
                onClick={handleCrashFromDialog}
                className="bg-gray-600 hover:bg-red-900 text-red-400 font-bold py-2 px-4 rounded-lg"
              >
                Crash Party
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- NEW Tiebreaker Modal --- */}
      {tiedMovies.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 max-w-lg w-full text-center shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">It's a Tie!</h2>
            <p className="text-gray-300 mb-6">
              Multiple movies received the highest number of votes. Please
              select the winner.
            </p>
            <div className="space-y-3">
              {tiedMovies.map((movie) => (
                <button
                  key={movie.id}
                  onClick={() => handleTiebreakerSelect(movie)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg text-left flex items-center gap-4"
                >
                  <img
                    src={movie.imageUrl}
                    alt={movie.title}
                    className="w-10 h-16 object-cover rounded"
                  />
                  <span>
                    {movie.title} ({movie.year})
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* --- 4. Render the NotificationModal conditionally --- */}
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
          {error && (
            <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-center">
              {error}
            </div>
          )}
          {/* --- NEW: Editable Party Title --- */}
          <div className="text-center mb-8">
            {isEditingTitle ? (
              <div className="flex justify-center items-center gap-2">
                <input
                  type="text"
                  value={partyTitleInput}
                  onChange={(e) => setPartyTitleInput(e.target.value)}
                  className="bg-slate-800 border-2 border-gray-600 text-white text-4xl md:text-5xl font-extrabold text-center rounded-lg p-2 focus:outline-none focus:border-indigo-700"
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-2 text-green-400 hover:bg-gray-700 rounded-full"
                >
                  <Save size={24} />
                </button>
                <button
                  onClick={handleCancelEditTitle}
                  className="p-2 text-red-400 hover:bg-gray-700 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>
            ) : (
              <div className="flex justify-center items-center gap-4">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white">
                  {party.party_name}
                </h1>
                <button
                  onClick={handleEditTitle}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full"
                >
                  <Edit3 size={20} />
                </button>
              </div>
            )}
            <p className="text-lg text-gray-400 pt-2">
              You are the conductor of this party.
            </p>
          </div>

          <div className="bg-transparent rounded-xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 flex flex-col space-y-6">
                <WatchList
                  party={party}
                  watchedMovies={watchedMovieDetails}
                  nowPlaying={nowPlayingMovieDetails}
                  upNext={upNextMovie}
                  onMarkWatched={() => handleFinishMovie("watched")}
                  onSkipMovie={() => handleFinishMovie("skipped")}
                  onRemoveWatched={handleRemoveFromWatched}
                  playState={party.party_state?.status}
                  intermissionTime={intermissionTime}
                  isConductor={true}
                  onShowReviewModal={setMovieToReview}
                  onAddToFavorites={handleAddToFavorites}
                />
                <StreamLinkCard
                  initialUrl={party.stream_url}
                  onUpdate={handleUpdateStreamUrl}
                />
                <PartyInviteCard party={party} />

                <ViewersList viewers={viewers} />
              </div>
              <div className="lg:col-span-2 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ensures Controls is first on mobile */}
                  <VerticalDashboardControls
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

                  {/* Ensures Settings is second on mobile */}
                  <PartySettings
                    party={party}
                    onUpdate={handleUpdateSettings}
                  />
                </div>

                {/* Ensures these are last on mobile */}
                <MoviePoll
                  movies={party.poll_movies}
                  voteCounts={pollVoteCounts}
                  onOpenPoll={handleOpenPoll}
                  onClosePoll={handleClosePoll}
                  onCancelPoll={handleCancelPoll} // Add this line
                  onRemoveFromPoll={handleRemoveFromPoll}
                  onAddMovie={handleAddMovieToPoll}
                  isVotingOpen={party.voting_open}
                  isAddingToPoll={isAddingToPoll}
                  setIsAddingToPoll={setIsAddingToPoll}
                  onSelectMovie={setSelectedMovieId}
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
                  onSelectMovie={setSelectedMovieId}
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
