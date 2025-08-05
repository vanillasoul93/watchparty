import React, { useState, useEffect } from "react";
import {
  useParams,
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "../contexts/Auth";
import { supabase } from "../supabaseClient";
import { getMovieDetails, getMovieDetailsWithCredits } from "../api/tmdb"; // We'll use this to get movie posters
import { Clapperboard, Check, SkipForward } from "lucide-react";
import MovieDetailsModal from "./MovieDetailsModal";
import ReviewMovieModal from "./ReviewMovieModal"; // 2. Import the necessary modals
import NotificationModal from "./NotificationModal";

const ReviewParty = () => {
  const { partyId } = useParams();
  const { user } = useAuth();
  const [party, setParty] = useState(null);
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- 3. NEW: State to manage the MovieDetailsModal ---
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [modalMovieData, setModalMovieData] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);
  const [movieToReview, setMovieToReview] = useState(null);
  const [allFavoriteMovies, setAllFavoriteMovies] = useState([]);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromTab = searchParams.get("from"); // This will be 'conducting', 'active', etc.

  useEffect(() => {
    const fetchPartyDetails = async () => {
      if (!partyId) return;

      setLoading(true);
      setError(null);

      // 1. Fetch the main party data
      const { data: partyData, error: partyError } = await supabase
        .from("watch_parties")
        .select("*")
        .eq("id", partyId)
        .single();

      if (partyError || !partyData) {
        setError("Could not find details for this party.");
        setLoading(false);
        return;
      }
      setParty(partyData);

      // 2. Fetch full movie details for each watched/skipped movie
      if (partyData.movies_watched && partyData.movies_watched.length > 0) {
        const movieDetailsPromises = partyData.movies_watched.map(
          async (movieLog) => {
            const details = await getMovieDetails(movieLog.id);
            return details ? { ...details, status: movieLog.status } : null;
          }
        );

        const detailedMovies = (await Promise.all(movieDetailsPromises)).filter(
          Boolean
        );
        setWatchedMovies(detailedMovies);
      }

      setLoading(false);
    };

    fetchPartyDetails();
  }, [partyId]);

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

  useEffect(() => {
    const fetchUserFavorites = async () => {
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("all_favorite_movies")
        .eq("id", user.id)
        .single();
      if (profile) {
        setAllFavoriteMovies(
          Array.isArray(profile.all_favorite_movies)
            ? profile.all_favorite_movies
            : []
        );
      }
    };
    fetchUserFavorites();
  }, [user]);

  // --- 6. NEW: Handlers for modal actions ---
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
        message: `${movieToAdd.title} added to your favorites!`,
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
    const { error } = await supabase.from("movie_watch_history").insert({
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
    if (!error) {
      setNotification({
        show: true,
        message: `${movieToReview.title} added to your watch history!`,
        type: "success",
      });
    } else {
      setNotification({
        show: true,
        message: "Failed to save review.",
        type: "error",
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center text-white pt-40">
        Loading party summary...
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 pt-40">{error}</div>;
  }

  return (
    <>
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
        // These actions are not available on the review page, so they show an alert.
        onAddToHistory={handleAddToHistory}
        onAddToFavorites={handleAddToFavorites}
      />
      <ReviewMovieModal
        movie={movieToReview}
        onSave={handleSaveReview}
        onClose={() => setMovieToReview(null)}
        onAddToFavorites={() => handleAddToFavorites(movieToReview)}
      />
      <div className="bg-gray-900 min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center text-white mb-12">
            <p className="text-indigo-400 font-semibold">
              Watch Party Concluded
            </p>
            <h1 className="text-5xl font-extrabold mt-2">
              {party?.party_name}
            </h1>
            <p className="text-gray-400 mt-2">
              on {new Date(party?.end_time).toLocaleDateString()}
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-lg shadow-black/30">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Clapperboard /> Watched & Skipped
            </h3>
            <div className="space-y-3">
              {watchedMovies.length > 0 ? (
                watchedMovies.map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => setSelectedMovieId(movie.id)}
                    className="bg-slate-900 p-3 rounded-lg flex items-center gap-4 shadow-lg shadow-black/20 hover:bg-slate-800 hover:outline-1 hover:outline-indigo-600 cursor-pointer"
                  >
                    <img
                      src={movie.imageUrl}
                      alt={movie.title}
                      className="w-16 h-24 object-cover rounded-md"
                    />
                    <div className="flex-grow">
                      <p className="font-semibold text-white">
                        {movie.title} ({movie.year})
                      </p>
                      {movie.status === "watched" ? (
                        <div className="flex items-center text-xs text-green-400 mt-1">
                          <Check size={14} className="mr-1" />
                          <span>Watched</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-xs text-yellow-400 mt-1">
                          <SkipForward size={14} className="mr-1" />
                          <span>Skipped</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">
                  No movies were watched or skipped in this party.
                </p>
              )}
            </div>
          </div>

          <div className="text-center mt-8">
            <button
              className="bg-slate-800 hover:bg-indigo-900 text-indigo-400 font-bold py-3 px-6 rounded-lg transition-colors"
              onClick={() =>
                navigate("/conductor-hub", { state: { fromTab: fromTab } })
              }
            >
              Back to Hub
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReviewParty;
