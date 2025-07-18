import React from "react";
import { PlusCircle } from "lucide-react";

const ViewerSuggestions = ({ suggestions, onMoveToPoll }) => {
  return (
    <div className="bg-gray-900 p-4 rounded-lg">
      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
        <PlusCircle size={20} /> Viewer Suggestions
      </h3>
      {suggestions.length > 0 ? (
        <ul className="space-y-2">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.id}
              className="bg-gray-800 p-3 rounded-md flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <img
                  src={suggestion.movie_image_url}
                  alt={suggestion.movie_title}
                  className="w-10 h-16 object-cover rounded"
                />
                <span className="text-gray-300">
                  {suggestion.movie_title} ({suggestion.movie_year})
                </span>
              </div>
              <button
                onClick={() => onMoveToPoll(suggestion)}
                className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition hover:bg-green-700"
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
