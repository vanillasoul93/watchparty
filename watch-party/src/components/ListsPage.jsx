import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";
import { List, Search, Star, ThumbsUp, ThumbsDown, Film } from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";

const ListCard = ({ list }) => {
  return (
    <Link
      to={`/list/${list.id}`}
      className="block bg-gradient-to-br from-slate-800 to-slate-900/20 shadow-lg shadow-black/10 rounded-xl p-6 hover:ring-2 hover:ring-indigo-500 transition-all"
    >
      <h3 className="text-xl font-bold text-white truncate">
        {list.list_name}
      </h3>
      {/* The username is now a direct property of the list object */}
      <p className="text-sm text-gray-400 mb-3">
        by {list.username || "Anonymous"}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {list.tags?.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="bg-indigo-600/50 text-indigo-200 text-xs font-semibold px-2.5 py-1 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-400 border-t border-gray-700 pt-3">
        <div className="flex items-center gap-1">
          <Film size={16} />
          <span>{list.movies?.length || 0} movies</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-green-400">
            <ThumbsUp size={16} /> {list.upvotes}
          </div>
          <div className="flex items-center gap-1 text-red-400">
            <ThumbsDown size={16} /> {list.downvotes}
          </div>
        </div>
      </div>
    </Link>
  );
};

const ListsPage = () => {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    const fetchLists = async () => {
      setLoading(true);
      setError(null);

      // --- THIS IS THE CORRECTED QUERY ---
      // We are now calling the database function using rpc().
      const { data, error } = await supabase.rpc("get_public_movie_lists");

      if (error) {
        setError("Could not fetch movie lists.");
        console.error(error);
      } else {
        setLists(data || []);
      }
      setLoading(false);
    };
    fetchLists();
  }, []);

  const filteredLists = useMemo(() => {
    if (!debouncedSearchTerm) return lists;
    const lowercasedTerm = debouncedSearchTerm.toLowerCase();
    return lists.filter(
      (list) =>
        list.list_name.toLowerCase().includes(lowercasedTerm) ||
        (list.username &&
          list.username.toLowerCase().includes(lowercasedTerm)) || // Check if username exists
        list.tags?.some((tag) => tag.toLowerCase().includes(lowercasedTerm))
    );
  }, [lists, debouncedSearchTerm]);

  if (loading)
    return <div className="text-center text-white pt-40">Loading lists...</div>;
  if (error)
    return <div className="text-center text-red-500 pt-40">{error}</div>;

  return (
    <div className="bg-gray-900 min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-white">
            Movie Lists Hub
          </h1>
          <p className="text-gray-400 mt-2">
            Browse and discover lists curated by the community.
          </p>
        </div>
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={20} />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border-2 border-gray-700 text-white rounded-full p-4 pl-12 text-lg outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search by list name, creator, or tag..."
            />
          </div>
        </div>
        {filteredLists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredLists.map((list) => (
              <ListCard key={list.id} list={list} />
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center bg-gray-800 p-8 rounded-xl">
            No lists found. Try a different search!
          </p>
        )}
      </div>
    </div>
  );
};

export default ListsPage;
