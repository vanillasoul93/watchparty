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
                <Search size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                1. Find a Movie
              </h3>
              <p className="text-gray-400">
                Browse our extensive library or search for your favorite film to
                watch.
              </p>
            </div>
            <div className="bg-gray-900 p-8 rounded-xl shadow-lg transform hover:-translate-y-2 transition-transform duration-300">
              <div className="bg-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Calendar size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                2. Create a Party
              </h3>
              <p className="text-gray-400">
                Schedule a watch party and get a unique link to share with your
                friends.
              </p>
            </div>
            <div className="bg-gray-900 p-8 rounded-xl shadow-lg transform hover:-translate-y-2 transition-transform duration-300">
              <div className="bg-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Users size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                3. Invite Friends
              </h3>
              <p className="text-gray-400">
                Send the link to your friends and enjoy watching together in
                real-time.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
