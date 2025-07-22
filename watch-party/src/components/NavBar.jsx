import React, { useState } from "react"; // Import useState
import { NavLink, useNavigate } from "react-router-dom";
import { PlayCircle, LogOut, X, Menu } from "lucide-react"; // Import Menu and X icons
import { useAuth } from "../contexts/Auth";

const navLinks = ["Home", "Conductor Hub", "Create Party", "Profile"];

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // 1. State for mobile menu

  const handleSignOut = () => {
    signOut();
    navigate("/login");
  };

  const getPath = (link) => {
    if (link === "Home") return "/";
    // Consistent path generation
    return `/${link.toLowerCase().replace(" ", "-")}`;
  };

  return (
    <nav className="bg-gray-900/80 backdrop-blur-sm p-4 shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto flex justify-between items-center px-4">
        {/* Logo */}
        <NavLink
          to="/"
          className="text-white text-2xl font-bold hover:text-indigo-400 transition-colors duration-300 flex items-center gap-2"
        >
          <PlayCircle size={28} />
          <span>WatchParty</span>
        </NavLink>

        {/* Desktop Menu */}
        {user && (
          <ul className="hidden md:flex items-center space-x-2">
            {navLinks.map((link) => (
              <li key={link}>
                <NavLink
                  to={getPath(link)}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-md"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`
                  }
                >
                  {link}
                </NavLink>
              </li>
            ))}
            <li>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ml-4"
              >
                <LogOut size={16} />
                Logout
              </button>
            </li>
          </ul>
        )}

        {/* Hamburger Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* 2. Mobile Menu (conditionally rendered) */}
      {isMenuOpen && user && (
        <div className="md:hidden mt-4 bg-gray-900 rounded-lg p-4">
          <ul className="flex flex-col items-center space-y-4">
            {navLinks.map((link) => (
              <li key={link}>
                <NavLink
                  to={getPath(link)}
                  // 3. Close menu on link click
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `w-full text-center px-4 py-2 rounded-md font-medium ${
                      isActive ? "bg-indigo-600 text-white" : "text-gray-300"
                    }`
                  }
                >
                  {link}
                </NavLink>
              </li>
            ))}
            <li>
              <button
                onClick={() => {
                  handleSignOut();
                  setIsMenuOpen(false);
                }}
                className="w-full flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium"
              >
                <LogOut size={16} />
                Logout
              </button>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
