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

export default function Footer() {
  return (
    <div>
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center space-x-6 mb-4">
            <a
              href="#"
              className="hover:text-white transition-colors duration-300"
            >
              <Twitter />
            </a>
            <a
              href="#"
              className="hover:text-white transition-colors duration-300"
            >
              <Facebook />
            </a>
            <a
              href="#"
              className="hover:text-white transition-colors duration-300"
            >
              <Instagram />
            </a>
          </div>
          <p>
            &copy; {new Date().getFullYear()} WatchParty. All Rights Reserved.
          </p>
          <p className="text-sm">Created with fun by movie lovers.</p>
        </div>
      </footer>
    </div>
  );
}
