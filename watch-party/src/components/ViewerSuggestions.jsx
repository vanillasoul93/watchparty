import React from "react";
import { PlusCircle } from "lucide-react";
import { useAutoAnimate } from "@formkit/auto-animate/react";

const ViewerSuggestions = ({ suggestions, onMoveToPoll, onSelectMovie }) => {
  const [parent] = useAutoAnimate({ duration: 500 });
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 shadow-xl shadow-black/10 p-4 rounded-lg">
      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
        <PlusCircle size={20} /> Viewer Suggestions
      </h3>
      {suggestions && suggestions.length > 0 ? (
        <ul className="space-y-2 max-h-100 overflow-y-auto p-1" ref={parent}>
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.id}
              className="bg-gray-900/80 shadow-lg shadow-black/20 p-3 rounded-md flex items-center justify-between transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/10 hover:ring-2 hover:ring-indigo-500/30"
            >
              <div
                onClick={() => onSelectMovie(suggestion.movie_tmdb_id)}
                className="flex items-center gap-4 cursor-pointer"
              >
                <img
                  src={suggestion.movie_image_url}
                  alt={suggestion.movie_title}
                  className="w-14 h-[88px] object-cover rounded"
                />
                <div className="flex flex-col">
                  <span className="text-gray-300">
                    {suggestion.movie_title} ({suggestion.movie_year})
                  </span>
                  <span className="text-xs text-gray-500">
                    Suggested by:{" "}
                    {
                      // Check the privacy flag from the joined profiles table.
                      // If true, show 'Anonymous'.
                      // If false, show the 'username' that is stored directly on the suggestion itself.
                      suggestion.profiles?.suggest_anonymously
                        ? "Anonymous"
                        : suggestion.username || "Anonymous"
                    }
                  </span>
                </div>
              </div>
              <button
                onClick={() => onMoveToPoll(suggestion)}
                className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition hover:bg-green-700 flex-shrink-0"
              >
                Add to Poll
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400 text-center py-4">
          No suggestions from viewers yet.
        </p>
      )}
    </div>
  );
};

export default ViewerSuggestions;
