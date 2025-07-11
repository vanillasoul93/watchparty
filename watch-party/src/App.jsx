import React, { useState } from "react";
import { AuthProvider, useAuth } from "./contexts/Auth";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import FeaturedMovies from "./components/FeaturedMovies";
import Testimonials from "./components/Testimonials";
import Footer from "./components/Footer";
import CreateWatchParty from "./components/CreateWatchParty";
import Login from "./components/Auth/Login";
import SignUp from "./components/Auth/SignUp";
import ConductorsPage from "./components/ConductorsPage";
import ProfilePage from "./components/ProfilePage";
import ConductorDashboard from "./components/ConductorDashboard"; // Import the new dashboard

const AppContent = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState("Home");
  const [authView, setAuthView] = useState("login");
  const [viewingPartyId, setViewingPartyId] = useState(null); // State to hold the ID of the party dashboard to view

  // If a party dashboard is being viewed, render it exclusively
  if (viewingPartyId) {
    return (
      <ConductorDashboard
        partyId={viewingPartyId}
        onBack={() => setViewingPartyId(null)}
      />
    );
  }

  if (!user) {
    return authView === "login" ? (
      <Login setView={setAuthView} />
    ) : (
      <SignUp setView={setAuthView} />
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case "Create Party":
        return <CreateWatchParty />;
      case "Conductors":
        // Pass the function to set the party ID to the hub
        return <ConductorsPage onSelectDashboard={setViewingPartyId} />;
      case "Profile":
        return <ProfilePage />;
      case "Home":
      default:
        return (
          <main>
            <Hero setActiveLink={setCurrentPage} />
            <HowItWorks />
            <FeaturedMovies />
            <Testimonials />
          </main>
        );
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen">
      <Navbar activeLink={currentPage} setActiveLink={setCurrentPage} />
      {renderPage()}
      <Footer />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
