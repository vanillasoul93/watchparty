// This file will hold all functions related to the TMDB API.

const tmdbApiKey = import.meta.env.VITE_TMDB_API_KEY;
const tmdbBaseUrl = "https://api.themoviedb.org/3";
const tmdbImageUrl = "https://image.tmdb.org/t/p/w500";

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
      data.results.slice(0, 15).map((movie) => getMovieDetails(movie.id))
    );
    return detailedResults.filter(Boolean); // Filter out any nulls from failed fetches
  } catch (error) {
    console.error("Error searching TMDB:", error);
    return [];
  }
};

const tmdbImageBaseUrl = "https://image.tmdb.org/t/p/";

/**
 * Fetches a list of English or language-neutral backdrop images for a movie.
 * @param {number} movieId - The TMDB ID of the movie.
 * @returns {Promise<string[]>} A promise that resolves to an array of full image URLs.
 */
export const getMovieBackdrops = async (movieId) => {
  if (!movieId) return [];
  try {
    const response = await fetch(
      `${tmdbBaseUrl}/movie/${movieId}/images?api_key=${tmdbApiKey}`
    );
    if (!response.ok) throw new Error("Failed to fetch movie images");
    const data = await response.json();

    if (data.backdrops && data.backdrops.length > 0) {
      const filteredBackdrops = data.backdrops.filter(
        // Filter for English ("en") or language-neutral (null) backdrops
        (backdrop) => backdrop.iso_639_1 === "en" || backdrop.iso_639_1 === null
      );

      // Return an array of full image URLs
      return filteredBackdrops.map(
        (backdrop) => `${tmdbImageBaseUrl}w780${backdrop.file_path}`
      );
    }
    return [];
  } catch (error) {
    console.error("Error fetching movie backdrops:", error);
    return [];
  }
};

export const getMovieDetailsWithCredits = async (movieId) => {
  if (!movieId) return null;
  try {
    // We add 'videos' to the append_to_response query
    const response = await fetch(
      `${tmdbBaseUrl}/movie/${movieId}?api_key=${tmdbApiKey}&append_to_response=credits,videos`
    );
    if (!response.ok) throw new Error("Failed to fetch movie details");
    const data = await response.json();

    // Find the official trailer from the videos results
    const officialTrailer = data.videos?.results?.find(
      (vid) => vid.site === "YouTube" && vid.type === "Trailer"
    );

    // Find the Director and Screenwriter(s)
    const director = data.credits?.crew?.find(
      (person) => person.job === "Director"
    );
    const screenplay = data.credits?.crew?.filter(
      (person) => person.job === "Screenplay"
    );

    return {
      id: data.id,
      title: data.title,
      year: data.release_date ? data.release_date.split("-")[0] : "N/A",
      imageUrl: data.poster_path
        ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
        : "https://placehold.co/300x450/1a202c/ffffff?text=No+Image",
      backdropUrl: data.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}`
        : null,
      runtime: data.runtime || 0,
      description: data.overview,
      rating: data.vote_average?.toFixed(1),
      cast:
        data.credits?.cast.slice(0, 5).map((actor) => ({
          id: actor.id,
          name: actor.name,
          character: actor.character,
          profileUrl: actor.profile_path
            ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
            : "https://placehold.co/100x100/718096/ffffff?text=NA",
        })) || [],
      genres: data.genres || [],
      trailerUrl: officialTrailer
        ? `https://www.youtube.com/watch?v=${officialTrailer.key}`
        : null,
      budget: data.budget,
      revenue: data.revenue,
      originalLanguage: data.original_language,
      director: director,
      screenplay: screenplay,
    };
  } catch (error) {
    console.error("Error fetching full movie details:", error);
    return null;
  }
};
