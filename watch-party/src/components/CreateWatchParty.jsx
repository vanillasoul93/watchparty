import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/Auth";
import { useNavigate } from "react-router-dom"; // 1. Import useNavigate
import {
  Film,
  Clock,
  Users,
  PlusCircle,
  X,
  Star,
  ListVideo,
  Copy,
  Trash2,
  Search,
} from "lucide-react";

// --- TMDB API Helper ---
const tmdbApiKey = import.meta.env.VITE_TMDB_API_KEY;
const tmdbBaseUrl = "https://api.themoviedb.org/3";
const tmdbImageUrl = "https://image.tmdb.org/t/p/w200";

const getMovieDetails = async (movieId) => {
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
        className="w-full bg-gray-800 border-2 border-gray-700 text-white rounded-lg p-3 pl-10 focus:ring-2 focus:ring-indigo-500 transition"
        placeholder="Search for a movie..."
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

const CreateWatchParty = () => {
  const { user } = useAuth();
  const navigate = useNavigate(); // 2. Initialize the navigate function
  const [partyName, setPartyName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [inviteCode, setInviteCode] = useState(null);
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [votableMovies, setVotableMovies] = useState([]);
  const [scheduleTime, setScheduleTime] = useState("");
  const [votingEnabled, setVotingEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formMessage, setFormMessage] = useState("");

  const generateInviteCode = () =>
    crypto.randomUUID().substring(0, 6).toUpperCase();

  const copyToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
    document.body.removeChild(textArea);
  };

  useEffect(() => {
    if (!isPublic) setInviteCode(generateInviteCode());
    else setInviteCode(null);
  }, [isPublic]);

  const handleAddVotableMovie = (movie) => {
    if (votableMovies.length < 10) {
      setVotableMovies([...votableMovies, movie]);
    }
  };

  const handleRemoveVotableMovie = (index) => {
    const newVotableMovies = [...votableMovies];
    newVotableMovies.splice(index, 1);
    setVotableMovies(newVotableMovies);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!featuredMovie) {
      setFormError("You must select a featured film.");
      return;
    }
    setLoading(true);
    setFormError(null);
    setFormMessage("");

    const partyData = {
      party_name: partyName,
      conductor_id: user.id,
      conductor_username: user.user_metadata?.username || "conductor",
      is_public: isPublic,
      invite_code: inviteCode,
      status: "active",
      party_state: { status: "paused" }, // The playback status starts as 'paused'
      // Static featured movie info
      featured_movie: featuredMovie.title,
      featured_movie_image_url: featuredMovie.imageUrl,
      // Dynamic "now playing" info, starting with the featured movie
      now_playing_tmdb_id: featuredMovie.id,
      now_playing_title: featuredMovie.title,
      now_playing_image_url: featuredMovie.imageUrl,
      poll_movies: votableMovies,
      voting_open: votingEnabled,
      scheduled_start_time: scheduleTime,
      actual_start_time: new Date().toISOString(),
      viewers_count: 0,
      watching_users: [
        {
          userId: user.id,
          username: user.user_metadata?.username || "conductor",
        },
      ],
      party_state: { status: "playing" }, // Start in a playing state
    };

    // 3. Modify the insert query to get the new party's data back
    const { data: newParty, error } = await supabase
      .from("watch_parties")
      .insert([partyData])
      .select()
      .single();

    if (error) {
      console.error("Error creating party:", error);
      setFormError("Could not create the watch party. Please try again.");
      setLoading(false);
    } else {
      // 4. Redirect to the new dashboard on success
      if (newParty) {
        navigate(`/dashboard/${newParty.id}`);
      }
    }
  };

  return (
    <div className="bg-gray-800 min-h-screen pt-24 pb-12 flex items-center justify-center">
      <div className="bg-gray-900 p-8 md:p-12 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 relative">
        <h1 className="text-4xl font-bold text-white text-center mb-2">
          Create Your Watch Party
        </h1>
        <p className="text-gray-400 text-center mb-8">
          Fill out the details below to get started.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="partyName"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Party Name
            </label>
            <input
              type="text"
              id="partyName"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              className="w-full bg-gray-800 border-2 border-gray-700 text-white rounded-lg p-3"
              placeholder="e.g., Friday Night Movie Marathon"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Party Visibility
              </label>
              <div className="flex items-center space-x-4">
                <span
                  className={`font-medium transition-colors ${
                    isPublic ? "text-white" : "text-gray-500"
                  }`}
                >
                  Public
                </span>
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    isPublic ? "bg-indigo-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      isPublic ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span
                  className={`font-medium transition-colors ${
                    !isPublic ? "text-white" : "text-gray-500"
                  }`}
                >
                  Private
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Enable Voting
              </label>
              <div className="flex items-center space-x-4">
                <span
                  className={`font-medium transition-colors ${
                    !votingEnabled ? "text-white" : "text-gray-500"
                  }`}
                >
                  Off
                </span>
                <button
                  type="button"
                  onClick={() => setVotingEnabled(!votingEnabled)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    votingEnabled ? "bg-indigo-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      votingEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span
                  className={`font-medium transition-colors ${
                    votingEnabled ? "text-white" : "text-gray-500"
                  }`}
                >
                  On
                </span>
              </div>
            </div>
          </div>
          {!isPublic && inviteCode && (
            <div className="bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg p-4 text-center">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Your Private Invite Code
              </label>
              <div className="flex items-center justify-center space-x-3">
                <p className="text-2xl font-bold text-white tracking-widest">
                  {inviteCode}
                </p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(inviteCode)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Copy size={20} />
                </button>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Featured Film
            </label>
            {featuredMovie ? (
              <div className="flex items-center bg-gray-800 p-3 rounded-lg gap-4">
                <img
                  src={featuredMovie.imageUrl}
                  alt={featuredMovie.title}
                  className="w-16 h-24 object-cover rounded-md"
                />
                <div className="flex-grow">
                  <h4 className="font-bold text-white">
                    {featuredMovie.title}
                  </h4>
                  <p className="text-sm text-gray-400">{featuredMovie.year}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFeaturedMovie(null)}
                  className="p-2 text-gray-400 hover:text-red-500"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <MovieSearchInput onSelect={setFeaturedMovie} />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Movies to Vote On (up to 10)
            </label>
            <div className="space-y-3">
              {votableMovies.map((movie, index) => (
                <div
                  key={movie.id}
                  className="flex items-center bg-gray-800 p-2 rounded-lg gap-3"
                >
                  <img
                    src={movie.imageUrl}
                    alt={movie.title}
                    className="w-10 h-16 object-cover rounded-md"
                  />
                  <p className="flex-grow text-white">{movie.title}</p>
                  <button
                    type="button"
                    onClick={() => handleRemoveVotableMovie(index)}
                    className="p-2 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            {votableMovies.length < 10 && (
              <div className="mt-3">
                <MovieSearchInput
                  onSelect={handleAddVotableMovie}
                  existingIds={votableMovies.map((m) => m.id)}
                />
              </div>
            )}
          </div>
          <div>
            <label
              htmlFor="scheduleTime"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Schedule Time
            </label>
            <input
              type="datetime-local"
              id="scheduleTime"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="w-full bg-gray-800 border-2 border-gray-700 text-white rounded-lg p-3"
              required
            />
          </div>
          <div className="pt-2">
            {formError && (
              <p className="text-red-500 text-center mb-4">{formError}</p>
            )}
            {formMessage && (
              <p className="text-green-500 text-center mb-4">{formMessage}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition disabled:opacity-50"
            >
              {loading ? "Creating Party..." : "Create Watch Party"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWatchParty;
