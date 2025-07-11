import React from "react";
import {
  PlayCircle,
  Search,
  Calendar,
  Users,
  Star,
  Twitter,
  Facebook,
  Instagram,
} from "lucide-react";

export default function FeaturedMovies() {
  const featuredMovies = [
    {
      title: "Inception",
      genre: "Sci-Fi",
      imageUrl:
        "https://image.tmdb.org/t/p/w600_and_h900_bestv2/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    },
    {
      title: "The Matrix",
      genre: "Sci-Fi",
      imageUrl:
        "https://image.tmdb.org/t/p/w600_and_h900_bestv2/p96dm7sCMn4VYAStA6siNz30G1r.jpg",
    },
    {
      title: "Interstellar",
      genre: "Sci-Fi",
      imageUrl:
        "https://image.tmdb.org/t/p/w600_and_h900_bestv2/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    },
    {
      title: "Parasite",
      genre: "Thriller",
      imageUrl:
        "https://image.tmdb.org/t/p/w600_and_h900_bestv2/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    },
  ];
  return (
    <div>
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            Popular Movies
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredMovies.map((movie) => (
              <div
                key={movie.title}
                className="bg-gray-800 rounded-lg overflow-hidden shadow-lg group transform hover:scale-105 transition-transform duration-300"
              >
                <img
                  src={movie.imageUrl}
                  alt={movie.title}
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://placehold.co/400x600/1a202c/ffffff?text=Image+Error";
                  }}
                />
                <div className="p-4">
                  <h3 className="text-xl font-bold text-white">
                    {movie.title}
                  </h3>
                  <p className="text-gray-400">{movie.genre}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
