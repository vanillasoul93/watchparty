// This file will hold all functions related to the TMDB API.

const tmdbApiKey = import.meta.env.VITE_TMDB_API_KEY;
const tmdbBaseUrl = "https://api.themoviedb.org/3";
const tmdbImageUrl = "https://image.tmdb.org/t/p/w200";

/**
 * Fetches detailed information for a single movie from TMDB.
 * @param {number} movieId - The TMDB ID of the movie.
 * @returns {Promise<object|null>} A promise that resolves to the movie details object or null if an error occurs.
 */
export const getMovieDetails = async (movieId) => {
  if (!movieId) return null;
  try {
    const response = await fetch(
      `${tmdbBaseUrl}/movie/${movieId}?api_key=${tmdbApiKey}`
    );
    if (!response.ok) throw new Error("Failed to fetch movie details");
    const data = await response.json();
    return {
      id: data.id,
      title: data.title,
      year: data.release_date ? data.release_date.split("-")[0] : "N/A",
      imageUrl: data.poster_path
        ? `https://image.tmdb.org/t/p/w500${data.poster_path}` // Using a slightly larger image for better quality
        : "https://placehold.co/100x150/1a202c/ffffff?text=No+Image",
      runtime: data.runtime || 0,
    };
  } catch (error) {
    console.error("Error fetching movie details:", error);
    return null;
  }
};

/**
 * Searches for movies on TMDB based on a query.
 * @param {string} query - The search term.
 * @returns {Promise<Array>} A promise that resolves to an array of movie results.
 */
export const searchTMDb = async (query) => {
  if (!query) return [];
  try {
    const response = await fetch(
      `${tmdbBaseUrl}/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(
        query
      )}`
    );
    if (!response.ok) throw new Error("Failed to fetch from TMDB");
    const data = await response.json();
    // Fetch detailed results for the top 5 search hits to ensure consistent data shape
    const detailedResults = await Promise.all(
      data.results.slice(0, 5).map((movie) => getMovieDetails(movie.id))
    );
    return detailedResults.filter(Boolean); // Filter out any nulls from failed fetches
  } catch (error) {
    console.error("Error searching TMDB:", error);
    return [];
  }
};
