import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/Auth";
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
} from "lucide-react";

// --- TMDB API Helper ---
const tmdbApiKey = import.meta.env.VITE_TMDB_API_KEY;
const tmdbBaseUrl = "https://api.themoviedb.org/3";
const tmdbImageUrl = "https://image.tmdb.org/t/p/w200";

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
    return data.results.map((movie) => ({
      id: movie.id,
      title: movie.title,
      year: movie.release_date ? movie.release_date.split("-")[0] : "N/A",
      imageUrl: movie.poster_path
        ? `${tmdbImageUrl}${movie.poster_path}`
        : "https://placehold.co/100x150/1a202c/ffffff?text=No+Image",
    }));
  } catch (error) {
    console.error("Error searching TMDB:", error);
    return [];
  }
};
// --- End TMDB API Helper ---

const FavoriteMovieCard = ({
  movie,
  index,
  onRemove,
  onDragStart,
  onDragEnter,
  onDragEnd,
  isDragging,
}) => {
  const ranking = ["1st", "2nd", "3rd", "4th", "5th"][index];
  return (
    <div
      draggable="true"
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className={`flex items-center bg-gray-700 p-3 rounded-lg gap-4 cursor-grab transition-opacity ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <img
        src={movie.imageUrl}
        alt={movie.title}
        className="w-16 h-24 object-cover rounded-md"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src =
            "https://placehold.co/100x150/1a202c/ffffff?text=Error";
        }}
      />
      <div className="flex-grow">
        <h4 className="font-bold text-white">{movie.title}</h4>
        <p className="text-sm text-gray-400">{movie.year}</p>
        <p className="text-xs font-semibold text-indigo-400 mt-1">
          {ranking} Favorite
        </p>
      </div>
      <button
        onClick={() => onRemove(index)}
        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
      >
        <Trash2 size={20} />
      </button>
    </div>
  );
};

const AddFavoriteMovie = ({ onAdd, existingFavorites }) => {
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
    const existingIds = existingFavorites.map((fav) => fav.id);
    setResults(searchResults.filter((res) => !existingIds.includes(res.id)));
    setLoading(false);
  };

  const handleSelectMovie = (movie) => {
    onAdd(movie);
    setSearchTerm("");
    setResults([]);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearch}
        className="w-full bg-gray-700 border-2 border-gray-600 text-white rounded-lg p-3"
        placeholder="Search to add a favorite movie..."
      />
      {loading && <p className="text-sm text-gray-400 mt-1">Searching...</p>}
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

const ProfilePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // State for profile data
  const [aboutMe, setAboutMe] = useState("");
  const [favoriteMovies, setFavoriteMovies] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [profileStats, setProfileStats] = useState({
    movies_watched_count: 0,
    movies_conducted_count: 0,
    most_watched_movie: "N/A",
  });

  // State for UI feedback and functionality
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // State for Drag and Drop
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  useEffect(() => {
    const getProfile = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("profiles")
          .select(
            "about_me, favorite_movies, movies_watched_count, movies_conducted_count, most_watched_movie, avatar_url"
          )
          .eq("id", user.id)
          .single();

        if (error && error.code !== "PGRST116") throw error;

        if (data) {
          setAboutMe(data.about_me || "");
          setAvatarUrl(data.avatar_url);
          setFavoriteMovies(
            Array.isArray(data.favorite_movies) ? data.favorite_movies : []
          );
          setProfileStats({
            movies_watched_count: data.movies_watched_count || 0,
            movies_conducted_count: data.movies_conducted_count || 0,
            most_watched_movie: data.most_watched_movie || "N/A",
          });
        }
      } catch (error) {
        setError("Could not fetch profile data.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    getProfile();
  }, [user.id]);

  const updateProfile = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const updates = {
        id: user.id,
        about_me: aboutMe,
        favorite_movies: favoriteMovies,
        avatar_url: avatarUrl,
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

  // Drag and Drop Handlers
  const handleDragSort = () => {
    const newFavoriteMovies = [...favoriteMovies];
    const draggedItemContent = newFavoriteMovies.splice(dragItem.current, 1)[0];
    newFavoriteMovies.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setFavoriteMovies(newFavoriteMovies);
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
      <div className="container mx-auto px-4 max-w-4xl">
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

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1 flex flex-col items-center space-y-6">
            <div className="relative">
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
              className="cursor-pointer w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition"
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
            <div className="w-full bg-gray-800 p-6 rounded-xl shadow-lg space-y-4">
              <div className="flex items-center gap-4">
                <User className="text-indigo-400" size={24} />
                <p className="text-lg text-white truncate">{username}</p>
              </div>
              <div className="flex items-center gap-4">
                <Mail className="text-indigo-400" size={24} />
                <p className="text-lg text-white truncate">{userEmail}</p>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-8">
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
              <div>
                <label className="block text-xl font-bold text-white mb-2">
                  Top 5 Favorite Movies
                </label>
                <div className="space-y-3">
                  {favoriteMovies.map((movie, index) => (
                    <FavoriteMovieCard
                      key={movie.id || index}
                      movie={movie}
                      index={index}
                      onRemove={handleRemoveFavorite}
                      onDragStart={() => (dragItem.current = index)}
                      onDragEnter={() => (dragOverItem.current = index)}
                      onDragEnd={handleDragSort}
                      isDragging={dragItem.current === index}
                    />
                  ))}
                  {favoriteMovies.length < 5 && (
                    <AddFavoriteMovie
                      onAdd={handleAddFavorite}
                      existingFavorites={favoriteMovies}
                    />
                  )}
                </div>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
