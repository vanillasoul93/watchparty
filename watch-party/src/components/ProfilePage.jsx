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
  Users as PartyIcon,
} from "lucide-react";

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

  // State for profile stats
  const [profileStats, setProfileStats] = useState({
    movies_watched_count: 0,
    movies_conducted_count: 0,
    most_watched_movie: "N/A",
  });

  // State for UI feedback and functionality
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
          setProfileStats({
            movies_watched_count: profileRes.data.movies_watched_count || 0,
            movies_conducted_count: profileRes.data.movies_conducted_count || 0,
            most_watched_movie: profileRes.data.most_watched_movie || "N/A",
          });
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
  }, [user]);

  const updateProfile = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const updates = {
        id: user.id,
        about_me: aboutMe,
        avatar_url: avatarUrl,
        prompt_for_reviews: promptForReviews,
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
    if (!password) {
      setError("Please enter a new password.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: password });
      if (error) throw error;
      setMessage("Password updated successfully!");
      setPassword("");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
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
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg space-y-4">
              <h3 className="text-xl font-bold text-white">Change Password</h3>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            </div>
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <PartyIcon /> Party History
              </h3>
              <PartyHistoryList history={partyHistory} />
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

            <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <History /> Movie Watch History
              </h3>
              <MovieHistoryList history={movieHistory} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
