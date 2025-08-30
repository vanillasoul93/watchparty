import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/Auth";
import { useParams, useNavigate, Link } from "react-router-dom";
import { searchTMDb, getMovieDetailsWithCredits } from "../api/tmdb";
import { useDebounce } from "../hooks/useDebounce";
import { ListPlus, Save, Trash2, Search, ArrowLeft } from "lucide-react";
import MovieDetailsModal from "./MovieDetailsModal"; // Import the modal

// We can reuse the MovieSearchInput component logic here.
const MovieSearchInput = ({ onSelect, existingIds = [] }) => {
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
      setResults(searchResults.filter((res) => !existingIds.includes(res.id)));
      setLoading(false);
    };
    search();
  }, [debouncedSearchTerm, existingIds]);

  const handleSelectMovie = (movie) => {
    onSelect(movie);
    setSearchTerm("");
    setResults([]);
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="text-gray-400" size={20} />
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full bg-slate-800 border-2 border-gray-600 text-white rounded-lg p-3 pl-10 focus:border-indigo-500 transition outline-none"
        placeholder="Search for a movie to add..."
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

const CreateListPage = () => {
  const { listId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isEditMode = !!listId;

  const [listName, setListName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [movies, setMovies] = useState([]);
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // --- NEW: State for the Movie Details Modal ---
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [modalMovieData, setModalMovieData] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);

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
    if (isEditMode) {
      setLoading(true);
      const fetchList = async () => {
        const { data, error } = await supabase
          .from("movie_lists")
          .select("*")
          .eq("id", listId)
          .single();

        if (error || !data) {
          setError("Could not find the list to edit.");
        } else if (data.user_id !== user.id) {
          setError("You are not authorized to edit this list.");
        } else {
          setListName(data.list_name);
          setDescription(data.list_description || "");
          setTags((data.tags || []).join(", "));
          setMovies(data.movies || []);
          setIsPublic(data.is_public);
        }
        setLoading(false);
      };
      fetchList();
    }
  }, [listId, user, isEditMode]);

  const handleAddMovie = (movie) => {
    if (!movies.some((m) => m.id === movie.id)) {
      setMovies([...movies, movie]);
    }
  };

  const handleRemoveMovie = (movieId) => {
    setMovies(movies.filter((m) => m.id !== movieId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const listData = {
      user_id: user.id,
      list_name: listName,
      list_description: description,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      movies: movies,
      is_public: isPublic,
    };

    let result;
    if (isEditMode) {
      result = await supabase
        .from("movie_lists")
        .update(listData)
        .eq("id", listId)
        .select()
        .single();
    } else {
      result = await supabase
        .from("movie_lists")
        .insert(listData)
        .select()
        .single();
    }

    if (result.error) {
      setError("Failed to save the list. Please try again.");
    } else {
      setMessage(
        isEditMode ? "List updated successfully!" : "List created successfully!"
      );
      setTimeout(() => navigate(`/profile`), 2000);
    }
    setLoading(false);
  };

  if (loading && isEditMode)
    return <div className="text-center text-white pt-40">Loading list...</div>;
  if (error)
    return <div className="text-center text-red-500 pt-40">{error}</div>;

  return (
    <>
      <MovieDetailsModal
        movie={modalMovieData}
        isLoading={loadingModal}
        onClose={() => setSelectedMovieId(null)}
        // These actions are not relevant on the list creation page
        onAddToHistory={() =>
          alert("You can mark movies as watched from a watch party.")
        }
        onAddToFavorites={() =>
          alert(
            "You can add to favorites from a watch party or public profile."
          )
        }
      />
      <div className="bg-gray-900 min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link
            to="/profile"
            className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-6"
          >
            <ArrowLeft size={20} /> Back to Profile
          </Link>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900/20 p-8 rounded-2xl shadow-2xl">
            <h1 className="text-4xl font-bold text-white text-center mb-2">
              {isEditMode ? "Edit Your Movie List" : "Create a New Movie List"}
            </h1>
            <p className="text-gray-400 text-center mb-8">
              Curate the perfect collection of films to share.
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="listName"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  List Name
                </label>
                <input
                  type="text"
                  id="listName"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  required
                  className="w-full bg-slate-900/80 border-2 border-gray-700 text-white rounded-lg p-3 outline-none focus:border-indigo-500 transition"
                  placeholder="e.g., Best Action Movies of the 90s"
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900/80 border-2 border-gray-700 text-white rounded-lg outline-none focus:border-indigo-500 p-3 h-24 transition"
                  placeholder="A short description of your list..."
                />
              </div>
              <div>
                <label
                  htmlFor="tags"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full bg-slate-900/80 border-2 border-gray-700 text-white rounded-lg p-3 outline-none focus:border-indigo-500 transition"
                  placeholder="e.g., comedy, funny, scary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Add Movies
                </label>
                <MovieSearchInput
                  onSelect={handleAddMovie}
                  existingIds={movies.map((m) => m.id)}
                />
              </div>
              <div className="space-y-3 max-h-72 overflow-y-auto p-2">
                {movies.map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => setSelectedMovieId(movie.id)}
                    className="bg-gradient-to-br from-slate-800 to-slate-900/20 shadow-lg shadow-black/20 p-2 rounded-lg flex items-center gap-4"
                  >
                    <img
                      src={movie.imageUrl}
                      alt={movie.title}
                      className="w-12 h-20 object-cover rounded-md"
                    />
                    <div className="flex-grow">
                      <p className="font-semibold text-white">
                        {movie.title} ({movie.year})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMovie(movie.id)}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition disabled:opacity-50"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Save size={20} />
                    {loading
                      ? "Saving..."
                      : isEditMode
                      ? "Save Changes"
                      : "Create List"}
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateListPage;
