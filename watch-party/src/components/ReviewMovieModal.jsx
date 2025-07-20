import React, { useState } from "react";
import { Star, X } from "lucide-react";

// A reusable StarRating component we can build right here
const StarRating = ({ rating, setRating }) => {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <div
          key={star}
          className="relative cursor-pointer"
          onMouseLeave={() => {
            /* Prevents flickering */
          }}
        >
          <Star
            size={40}
            className="text-gray-600"
            onClick={() => setRating(star)}
            onMouseEnter={(e) => {
              e.currentTarget.style.fill = "#f59e0b";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.fill = "none";
            }}
          />
          <div
            className="absolute top-0 left-0 h-full overflow-hidden"
            style={{
              width:
                rating >= star
                  ? "100%"
                  : rating > star - 1
                  ? `${(rating % 1) * 100}%`
                  : "0%",
            }}
          >
            <Star
              size={40}
              className="text-amber-500"
              style={{ fill: "#f59e0b" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const ReviewMovieModal = ({ movie, onSave, onClose, onAddToFavorites }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  const handleSave = () => {
    // Pass the local state up to the parent component's save function
    onSave({ rating, review });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-8 max-w-lg w-full text-center shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-white mb-2">Movie Finished!</h2>
        <p className="text-gray-400 mb-6">
          Would you like to add "{movie.title}" to your watch history?
        </p>

        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <img
            src={movie.imageUrl}
            alt={movie.title}
            className="w-32 h-48 object-cover rounded-md mx-auto md:mx-0"
          />
          <div className="flex flex-col items-center md:items-start flex-grow gap-4">
            <p className="text-lg font-semibold text-white">Your Rating</p>
            <StarRating rating={rating} setRating={setRating} />
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Write a short review... (optional)"
              className="w-full bg-gray-700 border-2 border-gray-600 text-white rounded-lg p-3 h-24 mt-2"
            />
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleSave}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg"
          >
            Save to My Watch History
          </button>
          <button
            onClick={onAddToFavorites}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg"
          >
            Add to Favorites
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewMovieModal;
