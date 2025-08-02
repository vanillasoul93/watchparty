const MovieReviewHistoryModal = ({
  movieTitle,
  reviews,
  onClose,
  onEditReview,
}) => {
  if (!reviews || reviews.length === 0) return null;

  return (
    <div className="fixed inset-0 ...">
      <div className="bg-gray-800 ...">
        <h2 className="text-2xl font-bold">Review History for {movieTitle}</h2>
        <div className="space-y-4 mt-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-gray-700 p-4 rounded-lg">
              <p>"{review.review}"</p>
              <p>Rating: {review.rating}/5</p>
              <p>
                Logged on: {new Date(review.watched_at).toLocaleDateString()}
              </p>
              <button onClick={() => onEditReview(review)}>Edit</button>
            </div>
          ))}
        </div>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};
