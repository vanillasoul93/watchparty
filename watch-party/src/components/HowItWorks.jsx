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
  Vote,
  User,
  CircleQuestionMark,
} from "lucide-react";

export default function HowItWorks() {
  return (
    <div>
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-2">How It Works</h2>
          <p className="text-gray-400 mb-12">
            Get started in just three simple steps.
          </p>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900/20 p-8 rounded-xl shadow-lg shadow-black/40 transform hover:-translate-y-2 transition-transform duration-300">
              <div className="bg-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <User size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Conduct or Join a Watch Party
              </h3>
              <p className="text-gray-400">
                Conduct your own Watch Party, review your favorite movies with
                your friends, or meet new people and join a room.
              </p>
            </div>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900/20 p-8 rounded-xl shadow-lg shadow-black/40 transform hover:-translate-y-2 transition-transform duration-300">
              <div className="bg-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Vote size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Vote</h3>
              <p className="text-gray-400">
                Vote for movies when the conductor opens a poll to influence
                what plays next!
              </p>
            </div>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900/20 p-8 rounded-xl shadow-lg shadow-black/40 transform hover:-translate-y-2 transition-transform duration-300">
              <div className="bg-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <CircleQuestionMark size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Make Suggestions
              </h3>
              <p className="text-gray-400">
                Make movie suggestions for a chance to have your pick added to
                the poll by the conductor.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
