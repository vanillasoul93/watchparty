import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/Auth";
import {
  User,
  Lock,
  Film,
  Clapperboard,
  Award,
  Star,
  History,
  Search,
  X,
  Users as PartyIcon,
} from "lucide-react";
import { getMovieDetailsWithCredits } from "../api/tmdb"; // We need this for the modal
import MovieDetailsModal from "./MovieDetailsModal"; // Import the modal
import ReviewMovieModal from "./ReviewMovieModal";
import NotificationModal from "./NotificationModal";

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

// --- NEW: A dedicated modal to show a user's review history for one movie ---
const MovieReviewHistoryModal = ({ movieDetails, reviews, onClose }) => {
  if (!movieDetails || !reviews) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-[55] p-4 h-screen">
      <div
        className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative bg-cover bg-center shadow-2xl shadow-black/60"
        style={{
          backgroundImage: `linear-gradient(rgba(17, 24, 39, 0.9), rgba(17, 24, 39, 1)), url(${movieDetails.backdropUrl})`,
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white z-20"
        >
          <X size={28} />
        </button>
        <div className="p-8 md:p-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <img
                src={movieDetails.imageUrl}
                alt={movieDetails.title}
                className="w-full h-auto object-cover rounded-lg shadow-2xl"
              />
            </div>
            <div className="md:col-span-2 text-white">
              <h2 className="text-3xl font-bold mb-2">Review History for</h2>
              <h3 className="text-4xl font-bold text-indigo-300 mb-6">
                {movieDetails.title} ({movieDetails.year})
              </h3>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-gray-800/50 p-4 rounded-lg"
                  >
                    <DisplayRating rating={review.rating} />
                    <p className="text-gray-300 italic mt-2">
                      "{review.review || "No review written."}"
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Logged on:{" "}
                      {new Date(review.watched_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Replace your old, simple PublicMovieHistoryList with this one
const PublicMovieHistoryList = ({ groupedHistory, onSelectMovie }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const filteredMovies = Object.values(groupedHistory).filter((reviews) =>
    reviews[0].movie_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search movie history..."
          className="w-full bg-gray-700 border-2 border-gray-600 text-white rounded-lg p-3 pl-10"
        />
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={20}
        />
      </div>
      <div className="space-y-4 max-h-96 overflow-y-auto p-1">
        {filteredMovies.length > 0 ? (
          filteredMovies.map((reviews) => {
            const latestReview = reviews[0];
            return (
              <div
                key={latestReview.movie_tmdb_id}
                onClick={() => onSelectMovie(reviews)}
                className="bg-gradient-to-br from-slate-800 to-slate-900/20 p-4 rounded-lg flex gap-4 cursor-pointer shadow-lg shadow-black/20 transition-all"
              >
                <img
                  src={latestReview.movie_image_url}
                  alt={latestReview.movie_title}
                  className="w-16 h-24 object-cover rounded-md"
                />
                <div>
                  <h4 className="font-bold text-white">
                    {latestReview.movie_title}
                  </h4>
                  <p className="text-gray-400 text-sm">
                    You've watched this movie {reviews.length} time
                    {reviews.length > 1 ? "s" : ""}.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Last watched on:{" "}
                    {new Date(latestReview.watched_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-400 text-center py-4">
            No movies found in history.
          </p>
        )}
      </div>
    </div>
  );
};

// --- NEW: A read-only card for the public Top 5 list ---
const PublicFavoriteMovieCard = ({ movie, index, isTop }) => {
  const ranking = ["1", "2", "3", "4", "5"][index];
  return (
    <div
      className={`relative group bg-gray-700 rounded-lg transition-opacity w-32 flex-shrink-0 drop-shadow-xl ${
        isTop ? "" : ""
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
    </div>
  );
};

const PublicProfilePage = () => {
  const { username } = useParams();
  const { user } = useAuth(); // 2. Get the currently logged-in user

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("favorites");
  const [favoriteMovies, setFavoriteMovies] = useState([]);
  const [movieHistory, setMovieHistory] = useState([]);
  const [partyHistory, setPartyHistory] = useState([]);

  // --- NEW: State for the logged-in user's data ---
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [allFavoriteMovies, setAllFavoriteMovies] = useState([]);
  const [movieToReview, setMovieToReview] = useState(null);

  // --- State for the modals ---
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [modalMovieData, setModalMovieData] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);
  const [selectedMovieHistory, setSelectedMovieHistory] = useState(null);
  const [historyModalDetails, setHistoryModalDetails] = useState(null);

  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  // --- Group the movie history using useMemo ---
  const groupedMovieHistory = useMemo(() => {
    if (!movieHistory) return {};
    return movieHistory.reduce((acc, item) => {
      acc[item.movie_tmdb_id] = acc[item.movie_tmdb_id] || [];
      acc[item.movie_tmdb_id].push(item);
      return acc;
    }, {});
  }, [movieHistory]);

  // --- useEffect to fetch data for the Review History Modal ---
  useEffect(() => {
    const fetchDetailsForHistoryModal = async () => {
      if (selectedMovieHistory && selectedMovieHistory.length > 0) {
        setLoadingModal(true);
        const movieId = selectedMovieHistory[0].movie_tmdb_id;
        const details = await getMovieDetailsWithCredits(movieId);
        setHistoryModalDetails(details);
        setLoadingModal(false);
      }
    };
    fetchDetailsForHistoryModal();
  }, [selectedMovieHistory]);

  // --- THIS IS THE CORRECTED useEffect FOR THE MODAL ---
  useEffect(() => {
    const fetchModalData = async () => {
      if (selectedMovieId) {
        setLoadingModal(true);
        const fullDetails = await getMovieDetailsWithCredits(selectedMovieId);
        setModalMovieData(fullDetails);
        setLoadingModal(false);
      } else {
        // This else block is the fix. It ensures the modal data is cleared.
        setModalMovieData(null);
      }
    };
    fetchModalData();
  }, [selectedMovieId]);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);

      // Fetch the public profile being viewed
      const { data: profileData, error: profileError } = await supabase
        .rpc("get_profile_by_username", { p_username: username })
        .single();
      if (profileError || !profileData) {
        setError("User not found.");
        setLoading(false);
        return;
      }
      setProfile(profileData);

      // Fetch the logged-in user's profile to get their favorites list
      if (user) {
        const { data: currentUserData } = await supabase
          .from("profiles")
          .select("all_favorite_movies")
          .eq("id", user.id)
          .single();
        if (currentUserData) {
          setAllFavoriteMovies(
            Array.isArray(currentUserData.all_favorite_movies)
              ? currentUserData.all_favorite_movies
              : []
          );
        }
      }

      if (profileError || !profileData) {
        setError("User not found.");
        setLoading(false);
        return;
      }
      setProfile(profileData);

      // Set both favorite lists from the profile data
      if (profileData.is_favorites_public) {
        setFavoriteMovies(
          Array.isArray(profileData.favorite_movies)
            ? profileData.favorite_movies
            : []
        );
        // --- THIS IS THE FIX: Set the state for all favorites ---
        setAllFavoriteMovies(
          Array.isArray(profileData.all_favorite_movies)
            ? profileData.all_favorite_movies
            : []
        );
      }

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

  const handleAddToFavorites = async (movieToAdd) => {
    if (!user) {
      setNotification({
        show: true,
        message: "You must be logged in to add favorites.",
        type: "warning",
      });
      return;
    }
    if (!movieToAdd) return;
    const isAlreadyFavorite = allFavoriteMovies.some(
      (fav) => fav.id === movieToAdd.id
    );
    if (isAlreadyFavorite) {
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
    setAllFavoriteMovies(newFavorites);
    const { error } = await supabase
      .from("profiles")
      .update({ all_favorite_movies: newFavorites })
      .eq("id", user.id);
    if (!error) {
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
    }
  };

  const handleAddToHistory = (movie) => {
    if (!user) {
      setNotification({
        show: true,
        message: "You must be logged in to log movies.",
        type: "warning",
      });
      return;
    }
    setSelectedMovieId(null);
    setMovieToReview(movie);
  };

  const handleSaveReview = async ({ rating, review }) => {
    if (!movieToReview) return;
    await supabase.from("movie_watch_history").insert({
      user_id: user.id,
      movie_tmdb_id: movieToReview.id,
      movie_title: movieToReview.title,
      movie_image_url: movieToReview.imageUrl,
      rating,
      review,
      watched_at: new Date().toISOString(),
    });
    setMovieToReview(null);
    setNotification({
      show: true,
      message: `${movieToReview.title} added to your watch history!`,
      type: "success",
    });
  };

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

  // Filter out the top 5 from the "all favorites" list to avoid duplicates
  const otherFavorites = allFavoriteMovies.filter(
    (movie) => !favoriteMovies.some((top5) => top5.id === movie.id)
  );

  return (
    <>
      {/* --- Render the NotificationModal conditionally --- */}
      {notification.show && (
        <NotificationModal
          message={notification.message}
          type={notification.type}
          onClose={() =>
            setNotification({ show: false, message: "", type: "" })
          }
        />
      )}
      <MovieDetailsModal
        movie={modalMovieData}
        isLoading={loadingModal}
        onClose={() => setSelectedMovieId(null)}
        onAddToHistory={handleAddToHistory}
        onAddToFavorites={handleAddToFavorites}
      />
      <ReviewMovieModal
        movie={movieToReview}
        onSave={handleSaveReview}
        onClose={() => setMovieToReview(null)}
        onAddToFavorites={() => handleAddToFavorites(movieToReview)}
      />
      <MovieReviewHistoryModal
        movieDetails={historyModalDetails}
        reviews={selectedMovieHistory}
        onClose={() => setSelectedMovieHistory(null)}
      />
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
                <p className="text-gray-400 mt-2 max-w-xl">
                  {profile.about_me}
                </p>
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
              <div className="space-y-8">
                {/* --- Top 5 Favorites Section --- */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">
                    Top 5 Favorites
                  </h3>
                  <div className="flex items-start gap-4 overflow-x-auto pb-4">
                    {favoriteMovies.map((movie, index) => (
                      <div
                        key={movie.id}
                        onClick={() => setSelectedMovieId(movie.id)}
                        className="cursor-pointer"
                      >
                        <PublicFavoriteMovieCard
                          movie={movie}
                          index={index}
                          isTop={profile.most_watched_movie === movie.title}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* --- All Favorites Collection --- */}
                {otherFavorites.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">
                      Favorites Collection
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto p-1 pr-3">
                      {otherFavorites.map((movie) => (
                        <div
                          key={movie.id}
                          onClick={() => setSelectedMovieId(movie.id)}
                          className="bg-gradient-to-br from-slate-800 to-slate-900/20 p-3 rounded-lg flex items-center gap-4 cursor-pointer hover:bg-slate-700 transition-colors shadow-lg shadow-black/20"
                        >
                          <img
                            src={movie.imageUrl}
                            alt={movie.title}
                            className="w-12 h-20 object-cover rounded-md"
                          />
                          <div>
                            <h4 className="font-bold text-white">
                              {movie.title}
                            </h4>
                            <p className="text-sm text-gray-400">
                              {movie.year}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === "movies" && profile.is_movie_history_public && (
              <PublicMovieHistoryList
                groupedHistory={groupedMovieHistory}
                onSelectMovie={setSelectedMovieHistory}
              />
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
    </>
  );
};

export default PublicProfilePage;
