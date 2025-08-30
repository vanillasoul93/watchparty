import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/Auth";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Film,
  PlusCircle,
  Search,
  X,
  Star,
  Clock,
} from "lucide-react";
import MovieDetailsModal from "./MovieDetailsModal";
import AddToListModal from "./AddToListModal";
import ReviewMovieModal from "./ReviewMovieModal";
import NotificationModal from "./NotificationModal";
import { getMovieDetailsWithCredits } from "../api/tmdb";

// Helper components can be in the same file or imported
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

const PublicListPage = () => {
  const { listId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- 1. State Variables ---
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userVote, setUserVote] = useState(null);
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [movieToAdd, setMovieToAdd] = useState(null);
  const [userLists, setUserLists] = useState([]);
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

  // --- 2. useEffect Hooks ---

  // This hook fetches the main page data (the list itself and the user's vote) and sets up real-time listeners.
  // --- This is the single, unified useEffect that handles all data fetching and subscriptions ---
  useEffect(() => {
    if (!listId) return;

    const fetchPageData = async () => {
      // --- THIS IS THE CORRECTED QUERY ---
      const { data: listData, error: listError } = await supabase
        .rpc("get_public_list_details", { p_list_id: listId })
        .single();

      if (listError || !listData) {
        setError("Could not find this movie list.");
        setList(null);
      } else {
        setList(listData);
      }

      if (user) {
        const { data: voteData, error: voteError } = await supabase
          .rpc("get_user_vote_for_list", {
            p_list_id: listId,
            p_user_id: user.id,
          })
          .single();
        if (voteError && voteError.code !== "PGRST116") {
          // Ignore "No rows found" error
          console.error("Error fetching user vote:", voteError);
        } else {
          setUserVote(voteData || null);
        }
      }
    };

    setLoading(true);
    fetchPageData().finally(() => setLoading(false));

    const channel = supabase.channel(`public:movie_lists:id=eq.${listId}`);
    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "movie_lists",
          filter: `id=eq.${listId}`,
        },
        () => {
          fetchPageData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listId, user]);

  // This hook fetches data for the MovieDetailsModal when a movie is clicked.
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

  // This hook fetches the logged-in user's data (lists and favorites) for modal actions.
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      const [listsRes, profileRes] = await Promise.all([
        supabase
          .from("movie_lists")
          .select("id, list_name, movies")
          .eq("user_id", user.id),
        supabase
          .from("profiles")
          .select("all_favorite_movies")
          .eq("id", user.id)
          .single(),
      ]);

      if (listsRes.data) {
        setUserLists(listsRes.data);
      }
      if (profileRes.data) {
        setAllFavoriteMovies(
          Array.isArray(profileRes.data.all_favorite_movies)
            ? profileRes.data.all_favorite_movies
            : []
        );
      }
    };
    fetchUserData();
  }, [user]);

  // --- 3. Handler Functions ---

  const handleVote = async (voteType) => {
    if (!user) {
      setNotification({
        show: true,
        message: "You must be logged in to vote.",
        type: "warning",
      });
      return;
    }
    const oldVote = userVote;
    let newUpvotes = list.upvotes;
    let newDownvotes = list.downvotes;
    if (oldVote === voteType) {
      setUserVote(null);
      if (voteType === "up") newUpvotes--;
      else newDownvotes--;
    } else {
      setUserVote(voteType);
      if (voteType === "up") newUpvotes++;
      else newDownvotes++;
      if (oldVote === "up") newUpvotes--;
      if (oldVote === "down") newDownvotes--;
    }
    setList((prevList) => ({
      ...prevList,
      upvotes: newUpvotes,
      downvotes: newDownvotes,
    }));
    await supabase.rpc("handle_list_vote", {
      p_list_id: listId,
      p_vote_type: voteType,
    });
  };

  const handleOpenAddToListModal = (movie) => {
    if (!user) {
      setNotification({
        show: true,
        message: "You must be logged in to add movies to a list.",
        type: "warning",
      });
      return;
    }
    setMovieToAdd(movie);
    setShowAddToListModal(true);
  };

  // --- 3. MODIFIED: The handleAddToList handler now uses the notification system ---
  const handleAddToList = async (targetListId) => {
    const targetList = userLists.find((list) => list.id === targetListId);
    if (!targetList || !movieToAdd) return;

    if (targetList.movies.some((m) => m.id === movieToAdd.id)) {
      setNotification({
        show: true,
        message: `${movieToAdd.title} is already in that list.`,
        type: "warning",
      });
      return;
    }

    const updatedMovies = [...targetList.movies, movieToAdd];

    const { error } = await supabase
      .from("movie_lists")
      .update({ movies: updatedMovies })
      .eq("id", targetListId);

    if (!error) {
      // Show a success notification
      setNotification({
        show: true,
        message: `Added ${movieToAdd.title} (${movieToAdd.year}) to "${targetList.list_name}"!`,
        type: "success",
      });

      // Optimistically update the local state
      setUserLists((currentLists) =>
        currentLists.map((list) =>
          list.id === targetListId ? { ...list, movies: updatedMovies } : list
        )
      );
    } else {
      setNotification({
        show: true,
        message: "Failed to add to list.",
        type: "error",
      });
    }

    setShowAddToListModal(false);
  };

  const handleCreateAndAddToList = async (newListName) => {
    const newList = {
      user_id: user.id,
      list_name: newListName,
      movies: [movieToAdd],
    };
    const { data, error } = await supabase
      .from("movie_lists")
      .insert(newList)
      .select()
      .single();
    if (!error && data) {
      setNotification({
        show: true,
        message: `Created list and added movie!`,
        type: "success",
      });
      setShowAddToListModal(false);
      navigate(`/list/${data.id}/edit`);
    } else {
      setNotification({
        show: true,
        message: "Failed to create the list.",
        type: "error",
      });
    }
  };

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
      party_id: null, // This review is not associated with a specific party
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

  if (loading)
    return <div className="text-center text-white pt-40">Loading list...</div>;
  if (error)
    return <div className="text-center text-red-500 pt-40">{error}</div>;
  if (!list) {
    return null; // Or you could return a "List not found" message here.
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
      {showAddToListModal && (
        <AddToListModal
          movie={movieToAdd}
          userLists={userLists}
          onClose={() => setShowAddToListModal(false)}
          onAddToList={handleAddToList}
          onCreateAndAddToList={handleCreateAndAddToList}
        />
      )}
      <MovieDetailsModal
        movie={modalMovieData}
        isLoading={loadingModal}
        onClose={() => setSelectedMovieId(null)}
        onAddToHistory={() => alert("This action is not available here.")}
        onAddToFavorites={() => alert("This action is not available here.")}
      />
      <div className="bg-gray-900 min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link
            to="/lists"
            className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-6"
          >
            <ArrowLeft size={20} /> Back to Lists Hub
          </Link>
          <div className="bg-gradient-to-br from-slate-800 to-slate-950/60 shadow-black/10 rounded-xl shadow-lg p-8">
            <h1 className="text-4xl font-bold text-white">{list.list_name}</h1>
            <p className="text-lg text-gray-400 mt-2">
              Created by{" "}
              <span className="font-semibold text-indigo-400">
                {list.username || "Anonymous"}
              </span>
            </p>
            {list.list_description && (
              <p className="text-gray-300 mt-4">{list.list_description}</p>
            )}
            <div className="flex flex-wrap gap-2 my-6">
              {list.tags?.map((tag) => (
                <span
                  key={tag}
                  className="bg-slate-900/50 text-gray-300 text-xs font-semibold px-2.5 py-2 rounded-full text-center"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="border-t border-gray-700 pt-4 flex items-center gap-4">
              <button
                onClick={() => handleVote("up")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  userVote === "up"
                    ? "bg-green-600 text-white"
                    : "bg-slate-950/50 text-gray-300 hover:bg-green-600/50"
                }`}
              >
                <ThumbsUp size={18} /> {list.upvotes}
              </button>
              <button
                onClick={() => handleVote("down")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  userVote === "down"
                    ? "bg-red-600 text-white"
                    : "bg-slate-950/50 text-gray-300 hover:bg-red-600/50"
                }`}
              >
                <ThumbsDown size={18} /> {list.downvotes}
              </button>
            </div>

            <div className="space-y-3 mt-8">
              {list.movies?.map((movie) => (
                <div
                  key={movie.id}
                  className="bg-gradient-to-br from-slate-800 to-slate-900/20 transition-colors shadow-black/10 shadow-lg p-3 rounded-lg flex items-center justify-between gap-4 hover:bg-indigo-900"
                >
                  <div
                    onClick={() => setSelectedMovieId(movie.id)}
                    className="flex items-center gap-4 cursor-pointer flex-grow"
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
                  <button
                    onClick={() => handleOpenAddToListModal(movie)}
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex-shrink-0 shadow-lg shadow-black/20"
                  >
                    <PlusCircle size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PublicListPage;
