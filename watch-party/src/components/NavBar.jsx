import React from "react";
import { PlayCircle, LogOut, User } from "lucide-react";
import { useAuth } from "../contexts/Auth"; // Import the useAuth hook

// Add 'Profile' to the navigation links
const navLinks = ["Home", "Conductors", "Create Party", "Profile"];

const Navbar = ({ activeLink, setActiveLink }) => {
  const { user, signOut } = useAuth(); // Get user and signOut function from context

  return (
    <nav className="bg-gray-900/80 backdrop-blur-sm p-4 shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto flex justify-between items-center px-4">
        <div className="text-white text-2xl font-bold">
          <a
            href="#"
            className="hover:text-indigo-400 transition-colors duration-300 flex items-center gap-2"
            onClick={() => setActiveLink("Home")}
          >
            <PlayCircle size={28} />
            <span>WatchParty</span>
          </a>
        </div>

        {user && (
          <ul className="hidden md:flex items-center space-x-2">
            {navLinks.map((link) => (
              <li key={link}>
                <a
                  href="#"
                  onClick={() => setActiveLink(link)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                    activeLink === link
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  {link}
                </a>
              </li>
            ))}
            <li>
              <button
                onClick={signOut}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ml-4"
              >
                <LogOut size={16} />
                Logout
              </button>
            </li>
          </ul>
        )}

        <button className="md:hidden text-white">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16m-7 6h7"
            ></path>
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
