import React, { useState } from "react";

// Import all the component files
import Navbar from "./components/NavBar";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import FeaturedMovies from "./components/FeaturedMovies";
import Testimonials from "./components/Testimonials";
import Footer from "./components/Footer";
import CreateWatchParty from "./components/CreateWatchParty"; // Import the new component

// Main App component
const App = () => {
  // 'activeLink' now controls which page is visible
  const [activeLink, setActiveLink] = useState("Home");

  // A helper function to render the correct page component
  const renderPage = () => {
    switch (activeLink) {
      case "Home":
        return (
          <main>
            <Hero setActiveLink={setActiveLink} />
            <HowItWorks />
            <FeaturedMovies />
            <Testimonials />
          </main>
        );
      case "Create Party":
        return <CreateWatchParty />;
      // Add cases for 'Conductors' and 'History' here later
      default:
        return (
          <main>
            <Hero setActiveLink={setActiveLink} />
            <HowItWorks />
            <FeaturedMovies />
            <Testimonials />
          </main>
        );
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen">
      <Navbar activeLink={activeLink} setActiveLink={setActiveLink} />
      {renderPage()}
      <Footer />
    </div>
  );
};

export default App;
