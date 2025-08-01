import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/Auth";
import { Link } from "react-router-dom";
import {
  User,
  Lock,
  Mail,
  Film,
  Save,
  Clapperboard,
  Award,
  Trash2,
  PlusCircle,
  Star,
  History,
  Eye,
  EyeOff,
  Search,
  Users as PartyIcon,
} from "lucide-react";
import { searchTMDb } from "../api/tmdb"; // Assuming your centralized search is here
import { useDebounce } from "../hooks/useDebounce"; // Assuming you have this hook

// Helper component to render stars from a numeric rating
const DisplayRating = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex text-amber-400">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} size={16} fill="currentColor" />
      ))}
      {halfStar && (
        <Star
          key="half"
          size={16}
          fill="currentColor"
          style={{ clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)" }}
        />
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star
          key={`empty-${i}`}
          size={16}
          className="text-gray-600"
          fill="currentColor"
        />
      ))}
    </div>
  );
};

const FavoriteMovieCard = ({
  movie,
  index,
  onRemove,
  onSetTop,
  isTop,
  onDragStart,
  onDragEnter,
  onDragEnd,
  isDragging,
}) => {
  const ranking = ["1", "2", "3", "4", "5"][index];
  return (
    <div
      draggable="true"
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className={`relative group bg-gray-700 rounded-lg cursor-grab transition-opacity w-32 flex-shrink-0 ${
        isDragging ? "opacity-30" : "opacity-100"
      }`}
    >
      <img
        src={movie.imageUrl}
        alt={movie.title}
        className="w-full h-48 object-cover rounded-lg"
      />
      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col p-2 text-center justify-end">
        <h4 className="font-bold text-white text-sm">{movie.title}</h4>
        <p className="text-xs text-gray-400">{movie.year}</p>
      </div>
      <div
        className={`absolute top-1 left-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition-colors ${
          isTop ? "bg-yellow-400 text-black" : ""
        }`}
      >
        {ranking}
      </div>
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex flex-col gap-1">
        <button
          onClick={() => onSetTop(movie.title)}
          className={`p-1.5 bg-black/50 rounded-full transition-colors ${
            isTop ? "text-yellow-400" : "text-gray-400 hover:text-yellow-400"
          }`}
        >
          <Star size={14} />
        </button>
        <button
          onClick={() => onRemove(index)}
          className="p-1.5 bg-black/50 text-gray-400 hover:text-red-500 rounded-full transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

const AddFavoriteMovie = ({ onAdd, existingFavorites = [] }) => {
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
      // Correctly get existing IDs from the prop
      const existingIds = existingFavorites.map((fav) => fav.id);
      setResults(searchResults.filter((res) => !existingIds.includes(res.id)));
      setLoading(false);
    };
    search();
  }, [debouncedSearchTerm, existingFavorites]); // Added existingFavorites to the dependency array

  const handleSelectMovie = (movie) => {
    onAdd(movie);
    setSearchTerm("");
    setResults([]);
  };

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="text-gray-400" size={20} />
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full bg-gray-700 border-2 border-gray-600 text-white rounded-lg p-3 pl-10 focus:ring-2 focus:ring-indigo-500 transition"
        placeholder="Search to add a favorite..."
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
              className="px-3 py-2 text-white hover:bg-indigo-600 cursor-pointer flex items-center gap-2 text-sm"
            >
              <img
                src={movie.imageUrl}
                alt={movie.title}
                className="w-8 h-12 object-cover rounded"
              />
              <span className="flex-grow">
                {movie.title} ({movie.year})
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// New component to display the Movie Watch History
const MovieHistoryList = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <p className="text-gray-400 text-center py-4">No movie history found.</p>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((item) => (
        <div key={item.id} className="bg-gray-700 p-4 rounded-lg flex gap-4">
          <img
            src={item.movie_image_url}
            alt={item.movie_title}
            className="w-16 h-24 object-cover rounded-md"
          />
          <div className="flex-grow">
            <h4 className="font-bold text-white">{item.movie_title}</h4>
            <div className="flex items-center gap-2 my-1">
              <DisplayRating rating={item.rating} />
              <span className="text-sm text-gray-300">({item.rating}/5.0)</span>
            </div>
            <p className="text-sm text-gray-300 italic">
              "{item.review || "No review."}"
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Logged on: {new Date(item.watched_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// New component to display Party History
const PartyHistoryList = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <p className="text-gray-400 text-center py-4">No party history found.</p>
    );
  }

  return (
    <div className="space-y-3">
      {history.map(({ watch_parties: party }) =>
        party ? (
          <Link
            to={`/party/${party.id}`}
            key={party.id}
            className="block bg-gray-700 p-3 rounded-lg hover:bg-gray-600 transition"
          >
            <p className="font-semibold text-white">{party.party_name}</p>
            <p className="text-sm text-gray-400">
              on {new Date(party.created_at).toLocaleDateString()}
            </p>
          </Link>
        ) : null
      )}
    </div>
  );
};

// A new reusable component for the privacy toggles
const PrivacyToggle = ({ label, isPublic, setIsPublic }) => (
  <div className="flex items-center justify-between py-2">
    <label className="text-gray-300">{label}</label>
    <button
      type="button"
      onClick={() => setIsPublic(!isPublic)}
      className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
        isPublic
          ? "bg-green-500/20 text-green-400"
          : "bg-gray-700 text-gray-400"
      }`}
    >
      {isPublic ? <Eye size={14} /> : <EyeOff size={14} />}
      {isPublic ? "Public" : "Private"}
    </button>
  </div>
);

const ProfilePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Profile data state
  const [aboutMe, setAboutMe] = useState("");
  const [favoriteMovies, setFavoriteMovies] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  // --- NEW STATE for history lists ---
  const [movieHistory, setMovieHistory] = useState([]);
  const [partyHistory, setPartyHistory] = useState([]);

  //State setting if a user wants review prompts.
  const [promptForReviews, setPromptForReviews] = useState(true);

  // State for Drag and Drop
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  // State for profile stats
  const [profileStats, setProfileStats] = useState({
    movies_watched_count: 0,
    movies_conducted_count: 0,
    most_watched_movie: "N/A",
  });

  // --- 1. NEW: State for all privacy settings ---
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [isStatsPublic, setIsStatsPublic] = useState(true);
  const [isFavoritesPublic, setIsFavoritesPublic] = useState(true);
  const [isMovieHistoryPublic, setIsMovieHistoryPublic] = useState(true);
  const [isPartyHistoryPublic, setIsPartyHistoryPublic] = useState(true);

  const [suggestAnonymously, setSuggestAnonymously] = useState(false);

  // State for UI feedback and functionality
  // Replace the old 'password' state with these two
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handlePasswordReset = async () => {
    setError("");
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: window.location.origin, // Redirects back to your app
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Password reset email sent! Please check your inbox.");
    }
  };

  useEffect(() => {
    const getProfileAndHistory = async () => {
      try {
        setLoading(true);
        if (!user) return;

        // Fetch profile, movie history, and party history concurrently
        const [profileRes, movieHistoryRes, partyHistoryRes] =
          await Promise.all([
            supabase.from("profiles").select("*").eq("id", user.id).single(),
            supabase
              .from("movie_watch_history")
              .select("*")
              .eq("user_id", user.id)
              .order("watched_at", { ascending: false }),
            supabase
              .from("party_viewers")
              .select("watch_parties(*)")
              .eq("user_id", user.id),
          ]);

        // Process profile data
        if (profileRes.error && profileRes.error.code !== "PGRST116")
          throw profileRes.error;

        if (profileRes.data) {
          setAboutMe(profileRes.data.about_me || "");
          setAvatarUrl(profileRes.data.avatar_url);
          setPromptForReviews(profileRes.data.prompt_for_reviews);
          setFavoriteMovies(
            Array.isArray(profileRes.data.favorite_movies)
              ? profileRes.data.favorite_movies
              : []
          );

          // --- THIS IS THE FIX ---
          // The profile stats are now correctly set from the fetched data.
          setProfileStats({
            movies_watched_count: profileRes.data.movies_watched_count || 0,
            movies_conducted_count: profileRes.data.movies_conducted_count || 0,
            most_watched_movie: profileRes.data.most_watched_movie || "N/A",
          });
          // --- END FIX ---

          // Set all the new privacy states
          setIsProfilePublic(profileRes.data.is_profile_public);
          setIsStatsPublic(profileRes.data.is_stats_public);
          setIsFavoritesPublic(profileRes.data.is_favorites_public);
          setIsMovieHistoryPublic(profileRes.data.is_movie_history_public);
          setIsPartyHistoryPublic(profileRes.data.is_party_history_public);
          setSuggestAnonymously(profileRes.data.suggest_anonymously);
        }

        // Process movie history data
        if (movieHistoryRes.error) throw movieHistoryRes.error;
        setMovieHistory(movieHistoryRes.data || []);

        // Process party history data
        if (partyHistoryRes.error) throw partyHistoryRes.error;
        setPartyHistory(partyHistoryRes.data || []);
      } catch (error) {
        setError("Could not fetch profile data.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    getProfileAndHistory();
  }, [user]); // The dependency array is correct

  const handleAddFavorite = (movie) => {
    if (favoriteMovies.length < 5) {
      setFavoriteMovies([...favoriteMovies, movie]);
    }
  };

  const handleRemoveFavorite = (index) => {
    const newFavs = [...favoriteMovies];
    newFavs.splice(index, 1);
    setFavoriteMovies(newFavs);
  };

  const handleSetTopMovie = (movieTitle) => {
    setProfileStats((prevStats) => ({
      ...prevStats,
      most_watched_movie: movieTitle,
    }));
  };

  // --- 3. MODIFIED: updateProfile function to save new settings ---
  const updateProfile = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const updates = {
        id: user.id,
        about_me: aboutMe,
        favorite_movies: favoriteMovies, // Save the list of favorites
        most_watched_movie: profileStats.most_watched_movie, // Save the top movie
        favorite_movies: favoriteMovies,
        avatar_url: avatarUrl,
        // Add all the new privacy settings to the update object
        is_profile_public: isProfilePublic,
        is_stats_public: isStatsPublic,
        is_favorites_public: isFavoritesPublic,
        is_movie_history_public: isMovieHistoryPublic,
        is_party_history_public: isPartyHistoryPublic,
        updated_at: new Date(),
      };
      const { error } = await supabase.from("profiles").upsert(updates);
      if (error) throw error;
      setMessage("Profile updated successfully!");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (event) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0)
        throw new Error("You must select an image to upload.");
      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(publicUrl);
      setMessage('Avatar updated! Click "Save Profile" to finalize.');
    } catch (error) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  const updatePassword = async () => {
    setError("");
    setMessage("");

    if (!currentPassword || !newPassword) {
      setError("Please fill out both password fields.");
      return;
    }

    setLoading(true);

    // First, verify the current password is correct by trying to sign in with it.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      setError("Your current password is not correct.");
      setLoading(false);
      return;
    }

    // If the current password was correct, proceed to update the user's password.
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
    }

    setLoading(false);
  };
  const handleDragSort = () => {
    const newFavoriteMovies = [...favoriteMovies];
    const draggedItemContent = newFavoriteMovies.splice(dragItem.current, 1)[0];
    newFavoriteMovies.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setFavoriteMovies(newFavoriteMovies);
  };

  const username = user?.user_metadata?.username || "No username";
  const userEmail = user?.email;

  if (loading)
    return (
      <div className="text-center text-white pt-40">Loading profile...</div>
    );

  return (
    <div className="bg-gray-900 min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <h1 className="text-5xl font-extrabold text-white text-center mb-12">
          {username}'s Profile
        </h1>

        {message && (
          <p className="bg-green-500/20 text-green-400 p-3 rounded-lg mb-6 text-center">
            {message}
          </p>
        )}
        {error && (
          <p className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-center">
            {error}
          </p>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col items-center text-center">
              <div className="relative mb-4">
                <img
                  src={
                    avatarUrl ||
                    `https://placehold.co/200x200/1a202c/ffffff?text=${
                      username?.[0] || "A"
                    }`
                  }
                  alt="Avatar"
                  className="w-48 h-48 rounded-full object-cover border-4 border-indigo-500"
                />
              </div>
              <div className="flex w-50 gap-4 flex-col">
                <label
                  htmlFor="avatar-upload"
                  className="cursor-pointer w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  {uploading ? "Uploading..." : "Upload Image"}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={uploadAvatar}
                  disabled={uploading}
                  className="hidden"
                />
                <button
                  onClick={updateProfile}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <Save size={20} /> {loading ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl shadow-lg space-y-4">
              <div className="flex items-center gap-4">
                <User className="text-indigo-400" size={24} />
                <p className="text-lg text-white truncate">{username}</p>
              </div>
              <div className="flex items-center gap-4">
                <Mail className="text-indigo-400" size={24} />
                <p className="text-lg text-white truncate">{userEmail}</p>
              </div>
            </div>
            {/* --- 4. NEW: Privacy Settings Card --- */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-white mb-2">
                Privacy Settings
              </h3>
              <div className="divide-y divide-gray-700">
                <PrivacyToggle
                  label="Profile Visibility"
                  isPublic={isProfilePublic}
                  setIsPublic={setIsProfilePublic}
                />
                <PrivacyToggle
                  label="Show Stats"
                  isPublic={isStatsPublic}
                  setIsPublic={setIsStatsPublic}
                />
                <PrivacyToggle
                  label="Show Favorites"
                  isPublic={isFavoritesPublic}
                  setIsPublic={setIsFavoritesPublic}
                />
                <PrivacyToggle
                  label="Show Movie History"
                  isPublic={isMovieHistoryPublic}
                  setIsPublic={setIsMovieHistoryPublic}
                />
                <PrivacyToggle
                  label="Show Party History"
                  isPublic={isPartyHistoryPublic}
                  setIsPublic={setIsPartyHistoryPublic}
                />
              </div>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg space-y-6">
              {/* --- NEW Suggest Anonymously Toggle --- */}
              <div className="flex items-center justify-between">
                <label className="text-white font-medium">
                  Suggest Movies Anonymously
                </label>
                <button
                  type="button"
                  onClick={() => setSuggestAnonymously(!suggestAnonymously)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 ${
                    suggestAnonymously ? "bg-indigo-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      suggestAnonymously ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-white font-medium">
                  Prompt for Reviews on Finish
                </label>
                <button
                  type="button"
                  onClick={() => setPromptForReviews(!promptForReviews)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 ${
                    promptForReviews ? "bg-indigo-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      promptForReviews ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <div>
                <label
                  htmlFor="aboutMe"
                  className="block text-xl font-bold text-white mb-2"
                >
                  About Me
                </label>
                <textarea
                  id="aboutMe"
                  value={aboutMe}
                  onChange={(e) => setAboutMe(e.target.value)}
                  className="w-full bg-gray-700 border-2 border-gray-600 text-white rounded-lg p-3 h-24"
                  placeholder="Tell us something about yourself..."
                />
              </div>

              <button
                onClick={updateProfile}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <Save size={20} /> {loading ? "Saving..." : "Save Profile"}
              </button>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg space-y-4">
              <h3 className="text-xl font-bold text-white">Change Password</h3>
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-gray-700 border-2 border-gray-600 text-white rounded-lg p-3"
                />
              </div>
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-700 border-2 border-gray-600 text-white rounded-lg p-3"
                />
              </div>
              <button
                onClick={updatePassword}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <Lock size={20} /> Update Password
              </button>
              <div className="text-center">
                <button
                  onClick={handlePasswordReset}
                  className="text-sm text-indigo-400 hover:underline"
                >
                  Forgot your password?
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg space-y-4">
              <h3 className="text-xl font-bold text-white">Your Stats</h3>
              <div className="flex items-center gap-4">
                <Clapperboard className="text-indigo-400" size={24} />
                <p className="text-lg text-white">
                  {profileStats.movies_conducted_count} parties conducted
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Film className="text-indigo-400" size={24} />
                <p className="text-lg text-white">
                  {profileStats.movies_watched_count} movies watched
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Award className="text-indigo-400" size={24} />
                <p className="text-lg text-white">
                  Top Movie: {profileStats.most_watched_movie}
                </p>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl shadow-lg space-y-6">
              <div>
                <label className="block text-xl font-bold text-white mb-2">
                  Top 5 Favorite Movies
                </label>
                <p className="text-sm text-gray-400 mb-4">
                  Drag and drop to reorder your favorites. Click the star to set
                  your top movie.
                </p>
                {/* --- CORRECTED LAYOUT --- */}
                <div className="flex items-start gap-4 overflow-x-auto pb-4">
                  {favoriteMovies.map((movie, index) => (
                    <FavoriteMovieCard
                      key={movie.id || index}
                      movie={movie}
                      index={index}
                      onRemove={handleRemoveFavorite}
                      onSetTop={handleSetTopMovie}
                      isTop={profileStats.most_watched_movie === movie.title}
                      onDragStart={() => (dragItem.current = index)}
                      onDragEnter={() => (dragOverItem.current = index)}
                      onDragEnd={handleDragSort}
                      isDragging={dragItem.current === index}
                    />
                  ))}
                </div>

                {favoriteMovies.length < 5 && (
                  <div className="mt-4">
                    <AddFavoriteMovie
                      onAdd={handleAddFavorite}
                      existingFavorites={favoriteMovies} // Pass the correct prop
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <History /> Movie Watch History
              </h3>
              <MovieHistoryList history={movieHistory} />
            </div>
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <PartyIcon /> Party History
              </h3>
              <PartyHistoryList history={partyHistory} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
