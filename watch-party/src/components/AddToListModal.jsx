import React, { useState } from "react";
import { X, PlusCircle, CheckCircle } from "lucide-react";

const AddToListModal = ({
  movie,
  userLists,
  onClose,
  onAddToList,
  onCreateAndAddToList,
}) => {
  const [newListName, setNewListName] = useState("");
  const [showNewListForm, setShowNewListForm] = useState(false);

  const handleCreateAndAdd = () => {
    if (newListName.trim()) {
      onCreateAndAddToList(newListName.trim());
      setNewListName("");
      setShowNewListForm(false);
    }
  };

  if (!movie) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center z-[70] p-4 h-screen">
      <div className="bg-gradient-to-br from-slate-800 to-slate-950/60 rounded-lg max-w-4xl w-full relative shadow-2xl shadow-black/60 grid md:grid-cols-3">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white z-20"
        >
          <X size={24} />
        </button>

        {/* Left Column: Movie Poster */}
        <div className="hidden md:block md:col-span-1">
          <img
            src={movie.imageUrl}
            alt={movie.title}
            className="w-full h-full object-cover rounded-l-lg"
          />
        </div>

        {/* Right Column: Content */}
        <div className="md:col-span-2 p-8">
          <h2 className="text-2xl font-bold text-white mb-2">Add to a list</h2>
          <p className="text-gray-400 mb-6">
            Add "
            <span className="font-semibold text-indigo-300">
              {movie.title} ({movie.year})
            </span>
            " to one of your lists, or create a new one.
          </p>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 mb-6">
            {userLists.map((list) => {
              const isMovieInList = list.movies?.some((m) => m.id === movie.id);
              return (
                <button
                  key={list.id}
                  onClick={() => onAddToList(list.id)}
                  disabled={isMovieInList}
                  className="w-full text-left bg-gradient-to-br from-slate-800 to-slate-900/20 shadow-lg shadow-black/20 p-3 rounded-lg flex items-center justify-between transition-colors disabled:opacity-50 disabled:bg-slate-600 disabled:cursor-copy hover:bg-indigo-600"
                >
                  <div>
                    <p className="font-semibold text-white">{list.list_name}</p>
                    <p className="text-xs text-gray-400">
                      {list.movies?.length || 0} movies
                    </p>
                  </div>
                  {isMovieInList && (
                    <div className="flex items-center gap-1 text-xs text-green-400 font-semibold">
                      <CheckCircle size={16} />
                      <span>Added</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {showNewListForm ? (
            <div className="space-y-3">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="New list name..."
                className="w-full bg-gray-700 border-2 border-gray-600 text-white rounded-lg p-3"
              />
              <button
                onClick={handleCreateAndAdd}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                Create & Add
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewListForm(true)}
              className="w-full flex items-center justify-center gap-2 bg-indigo-800 hover:bg-indigo-900 text-gray-300 font-bold py-2 px-4 rounded-lg"
            >
              <PlusCircle size={20} /> Create New List
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddToListModal;
