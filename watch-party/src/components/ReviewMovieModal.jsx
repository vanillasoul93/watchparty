import React, { useState, useEffect } from "react";
import { Star, X } from "lucide-react";
import { getMovieDetailsWithCredits } from "../api/tmdb"; // We'll fetch details for the backdrop

// --- StarRating Component remains the same ---
const StarRating = ({ rating, setRating }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex items-center" onMouseLeave={() => setHoverRating(0)}>
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const isFilled = (hoverRating || rating) >= starIndex;
        const isHalf =
          (hoverRating || rating) > starIndex - 1 &&
          (hoverRating || rating) < starIndex;

        return (
          <div
            key={starIndex}
            className="relative cursor-pointer"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const isLeftHalf = e.clientX - rect.left < rect.width / 2;
              setHoverRating(isLeftHalf ? starIndex - 0.5 : starIndex);
            }}
            onClick={() => setRating(hoverRating)}
          >
            <Star size={40} className="text-gray-600" />
            <div
              className="absolute top-0 left-0 h-full overflow-hidden"
              style={{ width: isHalf ? "50%" : isFilled ? "100%" : "0%" }}
            >
              <Star
                size={40}
                className="text-amber-500"
                style={{ fill: "#f59e0b" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ReviewMovieModal = ({ movie, onSave, onClose, onAddToFavorites }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [backdropUrl, setBackdropUrl] = useState("");

  // --- MODIFIED: This effect now pre-fills the form for editing ---
  useEffect(() => {
    const fetchBackdrop = async () => {
      if (movie) {
        // Pre-fill the state with the item's existing data if it exists
        setRating(movie.rating || 0);
        setReview(movie.review || "");

        // Fetch backdrop using the correct ID, whether it's a new movie or a history item
        const movieId = movie.movie_tmdb_id || movie.id;
        const details = await getMovieDetailsWithCredits(movieId);
        if (details?.backdropUrl) {
          setBackdropUrl(details.backdropUrl);
        }
      }
    };
    fetchBackdrop();
  }, [movie]); // Re-run when the movie to review/edit changes

  const handleSave = () => {
    onSave({ rating, review });
  };

  if (!movie) return null;

  // Check if we are in "edit mode" (the movie object has a `created_at` field from the history table)
  const isEditMode = !!movie.created_at;

  return (
    <div className="fixed inset-0 bg-gray-900/90 flex items-center justify-center z-50 p-4 h-screen">
      <div
        className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative bg-cover bg-center shadow-2xl shadow-black/60"
        style={{
          backgroundImage: `linear-gradient(rgba(17, 24, 39, 0.9), rgba(17, 24, 39, 1)), url(${backdropUrl})`,
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
                src={movie.imageUrl || movie.movie_image_url}
                alt={movie.title || movie.movie_title}
                className="w-full h-auto object-cover rounded-lg shadow-2xl"
              />
            </div>
            <div className="md:col-span-2 text-white flex flex-col">
              {/* --- MODIFIED: Dynamic Header --- */}
              <h2 className="text-3xl font-bold mb-2">
                {isEditMode ? "Edit Your Review" : "Movie Finished!"}
              </h2>
              <p className="text-gray-400 mb-6">
                Log your thoughts for "{movie.title || movie.movie_title}"
              </p>

              <div className="space-y-6 flex-grow">
                <div>
                  <label className="block text-lg font-semibold text-white mb-2">
                    Your Rating
                  </label>
                  <StarRating rating={rating} setRating={setRating} />
                </div>
                <div>
                  <label className="block text-lg font-semibold text-white mb-2">
                    Your Review
                  </label>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Write a short review... (optional)"
                    className="w-full bg-gray-800/50 border-2 border-gray-700 text-white rounded-lg p-3 h-28"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
                <button
                  onClick={handleSave}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg"
                >
                  {isEditMode ? "Update Review" : "Save to My Watch History"}
                </button>
                <button
                  onClick={onAddToFavorites}
                  disabled={isEditMode} // Disable "Add to Favorites" when editing
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                  Add to Favorites
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewMovieModal;
