import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {
  User,
  Lock,
  Film,
  Clapperboard,
  Award,
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

const PublicProfilePage = () => {
  const { username } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("favorites");

  // State for the different sections
  const [favoriteMovies, setFavoriteMovies] = useState([]);
  const [movieHistory, setMovieHistory] = useState([]);
  const [partyHistory, setPartyHistory] = useState([]);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);

      // 1. Fetch the profile by calling our new database function
      const { data: profileData, error: profileError } = await supabase
        .rpc("get_profile_by_username", { p_username: username })
        .single();

      if (profileError || !profileData) {
        setError("User not found.");
        setLoading(false);
        return;
      }
      setProfile(profileData);

      // 2. Check if the profile is private
      if (!profileData.is_profile_public) {
        setLoading(false);
        // We don't need to fetch anything else
        return;
      }

      // 3. Conditionally fetch the rest of the data based on privacy settings
      const fetches = [];
      if (profileData.is_favorites_public) {
        fetches.push(Promise.resolve(profileData.favorite_movies || []));
      } else {
        fetches.push(Promise.resolve([]));
      }

      if (profileData.is_movie_history_public) {
        fetches.push(
          supabase
            .from("movie_watch_history")
            .select("*")
            .eq("user_id", profileData.id)
            .order("watched_at", { ascending: false })
        );
      } else {
        fetches.push(Promise.resolve({ data: [] }));
      }

      if (profileData.is_party_history_public) {
        fetches.push(
          supabase
            .from("party_viewers")
            .select("watch_parties(*)")
            .eq("user_id", profileData.id)
            .eq("watch_parties.is_public", true)
        );
      } else {
        fetches.push(Promise.resolve({ data: [] }));
      }

      const [favsData, movieHistoryRes, partyHistoryRes] = await Promise.all(
        fetches
      );

      setFavoriteMovies(favsData);
      setMovieHistory(movieHistoryRes.data || []);
      setPartyHistory(partyHistoryRes.data || []);

      setLoading(false);
    };

    fetchProfileData();
  }, [username]);

  if (loading)
    return (
      <div className="text-center text-white pt-40">Loading profile...</div>
    );
  if (error)
    return <div className="text-center text-red-500 pt-40">{error}</div>;

  // Render a private profile message
  if (!profile.is_profile_public) {
    return (
      <div className="bg-gray-900 min-h-screen pt-40 text-center">
        <Lock size={48} className="mx-auto text-gray-500" />
        <h1 className="text-2xl font-bold text-white mt-4">
          {username}'s Profile is Private
        </h1>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
          <img
            src={
              profile.avatar_url ||
              `https://placehold.co/200x200/1a202c/ffffff?text=${
                profile.username?.[0] || "A"
              }`
            }
            alt="Avatar"
            className="w-40 h-40 rounded-full object-cover border-4 border-indigo-500"
          />
          <div className="text-center md:text-left">
            <h1 className="text-5xl font-extrabold text-white">{username}</h1>
            {profile.about_me && (
              <p className="text-gray-400 mt-2 max-w-xl">{profile.about_me}</p>
            )}
          </div>
        </div>

        {/* Stats Section */}
        {profile.is_stats_public && (
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8 grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">
                {profile.movies_conducted_count || 0}
              </p>
              <p className="text-sm text-gray-400">Parties Conducted</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {profile.movies_watched_count || 0}
              </p>
              <p className="text-sm text-gray-400">Movies Watched</p>
            </div>
            <div className="col-span-2 md:col-span-1">
              <p className="text-2xl font-bold text-white truncate">
                {profile.most_watched_movie || "N/A"}
              </p>
              <p className="text-sm text-gray-400">Top Movie</p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8 border-b border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {profile.is_favorites_public && (
              <button
                onClick={() => setActiveTab("favorites")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "favorites"
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500"
                }`}
              >
                Favorites
              </button>
            )}
            {profile.is_movie_history_public && (
              <button
                onClick={() => setActiveTab("movies")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "movies"
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500"
                }`}
              >
                Movie History
              </button>
            )}
            {profile.is_party_history_public && (
              <button
                onClick={() => setActiveTab("parties")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "parties"
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500"
                }`}
              >
                Party History
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "favorites" && profile.is_favorites_public && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteMovies.map((movie, index) => (
                <div
                  key={index}
                  className="bg-gray-800 p-3 rounded-lg flex items-center gap-4"
                >
                  <img
                    src={movie.imageUrl}
                    alt={movie.title}
                    className="w-16 h-24 object-cover rounded-md"
                  />
                  <div>
                    <h4 className="font-bold text-white">{movie.title}</h4>
                    <p className="text-sm text-gray-400">{movie.year}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeTab === "movies" && profile.is_movie_history_public && (
            <div className="space-y-4">
              {movieHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-800 p-4 rounded-lg flex gap-4"
                >
                  <img
                    src={item.movie_image_url}
                    alt={item.movie_title}
                    className="w-16 h-24 object-cover rounded-md"
                  />
                  <div>
                    <h4 className="font-bold text-white">{item.movie_title}</h4>
                    <p className="text-sm text-gray-300 italic">
                      "{item.review || "No review."}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeTab === "parties" && profile.is_party_history_public && (
            <div className="space-y-3">
              {partyHistory.map(({ watch_parties: party }) =>
                party ? (
                  <Link
                    to={`/party/${party.id}`}
                    key={party.id}
                    className="block bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition"
                  >
                    <p className="font-semibold text-white">
                      {party.party_name}
                    </p>
                    <p className="text-sm text-gray-400">
                      on {new Date(party.created_at).toLocaleDateString()}
                    </p>
                  </Link>
                ) : null
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicProfilePage;
