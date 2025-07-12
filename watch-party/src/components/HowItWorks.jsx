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
} from "lucide-react";

export default function HowItWorks() {
  return (
    <div>
      <section className="py-20 bg-gray-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-2">How It Works</h2>
          <p className="text-gray-400 mb-12">
            Get started in just three simple steps.
          </p>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="bg-gray-900 p-8 rounded-xl shadow-lg transform hover:-translate-y-2 transition-transform duration-300">
              <div className="bg-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <User size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                1. Create or Join a Watch Party.
              </h3>
              <p className="text-gray-400">
                Create your own Watch Party, even private ones with invite codes
                or Join one of the Conductors parties.
              </p>
            </div>
            <div className="bg-gray-900 p-8 rounded-xl shadow-lg transform hover:-translate-y-2 transition-transform duration-300">
              <div className="bg-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Vote size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">2. Vote.</h3>
              <p className="text-gray-400">
                Vote for next up movies and for info on current movies.
              </p>
            </div>
            <div className="bg-gray-900 p-8 rounded-xl shadow-lg transform hover:-translate-y-2 transition-transform duration-300">
              <div className="bg-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Users size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                3. Make Suggestions.
              </h3>
              <p className="text-gray-400">
                Make movie suggestions for a chance to have your pick pulled by
                the conductor.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
