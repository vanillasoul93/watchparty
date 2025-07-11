import React, { useState, useEffect } from "react";
import {
  Film,
  Clock,
  Users,
  PlusCircle,
  X,
  Star,
  ListVideo,
  Copy,
} from "lucide-react";

// Mock movie data - you can replace this with a real API call
const mockMovieApi = [
  "Inception",
  "The Matrix",
  "Interstellar",
  "Parasite",
  "The Godfather",
  "Pulp Fiction",
  "The Dark Knight",
  "Forrest Gump",
  "Fight Club",
  "Goodfellas",
  "The Shawshank Redemption",
  "Se7en",
  "The Silence of the Lambs",
  "Star Wars: Episode IV - A New Hope",
  "Jurassic Park",
  "Back to the Future",
  "The Lion King",
  "Spirited Away",
  "Gladiator",
  "Saving Private Ryan",
  "The Departed",
  "Whiplash",
  "The Prestige",
  "Alien",
  "Blade Runner 2049",
];

const CreateWatchParty = () => {
  // State for form inputs
  const [partyName, setPartyName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [inviteCode, setInviteCode] = useState(null);
  const [featuredMovie, setFeaturedMovie] = useState("");
  const [votableMovies, setVotableMovies] = useState([]);
  const [votableMovieInput, setVotableMovieInput] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [friends, setFriends] = useState([]);
  const [friendInput, setFriendInput] = useState("");

  // State for autocomplete suggestions
  const [featuredMovieSuggestions, setFeaturedMovieSuggestions] = useState([]);
  const [votableMovieSuggestions, setVotableMovieSuggestions] = useState([]);

  // --- Helper Functions ---

  // Generates a random 5-character alphanumeric code
  const generateInviteCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Copies text to the clipboard
  const copyToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
    document.body.removeChild(textArea);
  };

  // Effect to generate or clear invite code when visibility changes
  useEffect(() => {
    if (!isPublic) {
      setInviteCode(generateInviteCode());
    } else {
      setInviteCode(null);
    }
  }, [isPublic]);

  // --- Autocomplete Handlers ---

  const handleFeaturedMovieChange = (e) => {
    const value = e.target.value;
    setFeaturedMovie(value);
    if (value.length > 1) {
      const filtered = mockMovieApi.filter((movie) =>
        movie.toLowerCase().includes(value.toLowerCase())
      );
      setFeaturedMovieSuggestions(filtered);
    } else {
      setFeaturedMovieSuggestions([]);
    }
  };

  const handleVotableMovieChange = (e) => {
    const value = e.target.value;
    setVotableMovieInput(value);
    if (value.length > 1) {
      const filtered = mockMovieApi.filter(
        (movie) =>
          movie.toLowerCase().includes(value.toLowerCase()) &&
          !votableMovies.includes(movie) &&
          featuredMovie !== movie
      );
      setVotableMovieSuggestions(filtered);
    } else {
      setVotableMovieSuggestions([]);
    }
  };

  const selectFeaturedMovie = (movie) => {
    setFeaturedMovie(movie);
    setFeaturedMovieSuggestions([]);
  };

  const selectVotableMovie = (movie) => {
    if (!votableMovies.includes(movie) && votableMovies.length < 10) {
      setVotableMovies([...votableMovies, movie]);
    }
    setVotableMovieInput("");
    setVotableMovieSuggestions([]);
  };

  // --- List Management Handlers ---

  const handleAddVotableMovie = () => {
    if (
      votableMovieInput &&
      !votableMovies.includes(votableMovieInput) &&
      votableMovies.length < 10
    ) {
      setVotableMovies([...votableMovies, votableMovieInput]);
      setVotableMovieInput("");
    }
  };

  const handleRemoveVotableMovie = (movieToRemove) => {
    setVotableMovies(votableMovies.filter((movie) => movie !== movieToRemove));
  };

  const handleAddFriend = () => {
    if (friendInput && !friends.includes(friendInput)) {
      setFriends([...friends, friendInput]);
      setFriendInput("");
    }
  };

  const handleRemoveFriend = (friendToRemove) => {
    setFriends(friends.filter((friend) => friend !== friendToRemove));
  };

  // --- Form Submission ---

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({
      partyName,
      isPublic,
      inviteCode,
      featuredMovie,
      votableMovies,
      scheduleTime,
      friends,
    });
    const confirmationMessage = document.getElementById("confirmation-message");
    if (confirmationMessage) {
      confirmationMessage.style.display = "block";
      setTimeout(() => {
        confirmationMessage.style.display = "none";
      }, 3000);
    }
  };

  return (
    <div className="bg-gray-800 min-h-screen pt-24 pb-12 flex items-center justify-center">
      <div className="bg-gray-900 p-8 md:p-12 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 relative">
        <div
          id="confirmation-message"
          className="hidden absolute top-5 right-5 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-20"
        >
          Watch Party Created!
        </div>

        <h1 className="text-4xl font-bold text-white text-center mb-2">
          Create Your Watch Party
        </h1>
        <p className="text-gray-400 text-center mb-8">
          Fill out the details below to get started.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Party Name Input */}
          <div>
            <label
              htmlFor="partyName"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Party Name
            </label>
            <input
              type="text"
              id="partyName"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              className="w-full bg-gray-800 border-2 border-gray-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="e.g., Friday Night Movie Marathon"
              required
            />
          </div>

          {/* Public/Private Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Party Visibility
            </label>
            <div className="flex items-center space-x-4">
              <span
                className={`font-medium transition-colors ${
                  isPublic ? "text-white" : "text-gray-500"
                }`}
              >
                Public
              </span>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  isPublic ? "bg-indigo-600" : "bg-gray-600"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                    isPublic ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span
                className={`font-medium transition-colors ${
                  !isPublic ? "text-white" : "text-gray-500"
                }`}
              >
                Private
              </span>
            </div>
          </div>

          {/* Invite Code Display */}
          {!isPublic && inviteCode && (
            <div className="bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg p-4 text-center">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Your Private Invite Code
              </label>
              <div className="flex items-center justify-center space-x-3">
                <p className="text-2xl font-bold text-white tracking-widest">
                  {inviteCode}
                </p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(inviteCode)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Copy size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Featured Movie Input with Autocomplete */}
          <div className="relative">
            <label
              htmlFor="featuredMovie"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Featured Film
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Star className="text-yellow-400" size={20} />
              </div>
              <input
                type="text"
                id="featuredMovie"
                value={featuredMovie}
                onChange={handleFeaturedMovieChange}
                onBlur={() =>
                  setTimeout(() => setFeaturedMovieSuggestions([]), 200)
                }
                className="w-full bg-gray-800 border-2 border-gray-700 text-white rounded-lg p-3 pl-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                placeholder="Search for the main movie..."
                required
                autoComplete="off"
              />
            </div>
            {featuredMovieSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-gray-800 border-2 border-gray-700 rounded-lg mt-1 max-h-48 overflow-y-auto">
                {featuredMovieSuggestions.map((movie) => (
                  <li
                    key={movie}
                    onClick={() => selectFeaturedMovie(movie)}
                    className="px-4 py-2 text-white hover:bg-indigo-600 cursor-pointer"
                  >
                    {movie}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Votable Movies Input with Autocomplete */}
          <div className="relative">
            <label
              htmlFor="votableMovies"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Movies to Vote On (up to 10)
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ListVideo className="text-gray-400" size={20} />
                </div>
                <input
                  type="text"
                  id="votableMovies"
                  value={votableMovieInput}
                  onChange={handleVotableMovieChange}
                  onBlur={() =>
                    setTimeout(() => setVotableMovieSuggestions([]), 200)
                  }
                  className="w-full bg-gray-800 border-2 border-gray-700 text-white rounded-lg p-3 pl-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  placeholder="Add a movie to the voting list"
                  disabled={votableMovies.length >= 10}
                  autoComplete="off"
                />
              </div>
              <button
                type="button"
                onClick={handleAddVotableMovie}
                className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-600"
                disabled={votableMovies.length >= 10}
              >
                <PlusCircle size={24} />
              </button>
            </div>
            {votableMovieSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-gray-800 border-2 border-gray-700 rounded-lg mt-1 max-h-48 overflow-y-auto">
                {votableMovieSuggestions.map((movie) => (
                  <li
                    key={movie}
                    onClick={() => selectVotableMovie(movie)}
                    className="px-4 py-2 text-white hover:bg-indigo-600 cursor-pointer"
                  >
                    {movie}
                  </li>
                ))}
              </ul>
            )}
            {votableMovies.length >= 10 && (
              <p className="text-red-500 text-xs mt-2">
                You have reached the 10 movie limit.
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              {votableMovies.map((movie) => (
                <span
                  key={movie}
                  className="bg-gray-700 text-white text-sm font-medium px-3 py-1 rounded-full flex items-center gap-2"
                >
                  {movie}
                  <button
                    type="button"
                    onClick={() => handleRemoveVotableMovie(movie)}
                  >
                    <X size={16} className="hover:text-red-500 transition" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Schedule Time Input */}
          <div>
            <label
              htmlFor="scheduleTime"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Schedule Time
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock className="text-gray-400" size={20} />
              </div>
              <input
                type="datetime-local"
                id="scheduleTime"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full bg-gray-800 border-2 border-gray-700 text-white rounded-lg p-3 pl-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                required
              />
            </div>
          </div>

          {/* Invite Friends Input */}
          <div>
            <label
              htmlFor="friends"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Invite Friends (Usernames)
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="text-gray-400" size={20} />
                </div>
                <input
                  type="text"
                  id="friends"
                  value={friendInput}
                  onChange={(e) => setFriendInput(e.target.value)}
                  className="w-full bg-gray-800 border-2 border-gray-700 text-white rounded-lg p-3 pl-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  placeholder="Add a friend's username"
                />
              </div>
              <button
                type="button"
                onClick={handleAddFriend}
                className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition"
              >
                <PlusCircle size={24} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {friends.map((friend) => (
                <span
                  key={friend}
                  className="bg-gray-700 text-white text-sm font-medium px-3 py-1 rounded-full flex items-center gap-2"
                >
                  {friend}
                  <button
                    type="button"
                    onClick={() => handleRemoveFriend(friend)}
                  >
                    <X size={16} className="hover:text-red-500 transition" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-indigo-600/40"
          >
            Create Watch Party
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateWatchParty;
