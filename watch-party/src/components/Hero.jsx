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

export default function Hero({ setActiveLink }) {
  return (
    <div>
      <section className="bg-gray-900 text-white pt-32 pb-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div
          className="absolute inset-0 z-0 opacity-10"
          style={{
            backgroundImage:
              "url(https://www.transparenttextures.com/patterns/stardust.png)",
          }}
        ></div>
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4 leading-tight tracking-tighter animate-fade-in-down">
            Watch Movies Together.{" "}
            <span className="text-indigo-400">Anywhere.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-8 animate-fade-in-up">
            Sync your favorite movies and shows with friends and family in
            perfect harmony. Create private watch parties, chat, and enjoy movie
            night like never before.
          </p>
          {/* This button now changes the active page to 'Create Party' */}
          <button
            onClick={() => setActiveLink("Create Party")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-indigo-600/40"
          >
            Create a Watch Party
          </button>
        </div>
      </section>
    </div>
  );
}
