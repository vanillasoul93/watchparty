import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/Auth";
import { supabase } from "./supabaseClient";

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
import ConductorDashboard from "./components/ConductorDashboard";
import ViewWatchParty from "./components/ViewWatchParty"; // Import the new viewer page

const AppContent = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState("Home");
  const [authView, setAuthView] = useState("login");
  const [dashboardPartyId, setDashboardPartyId] = useState(null);
  const [viewingPartyId, setViewingPartyId] = useState(null); // State for the viewer page

  const [activeParties, setActiveParties] = useState([]);
  const [concludedParties, setConcludedParties] = useState([]);
  const [loadingParties, setLoadingParties] = useState(true);
  const [partyError, setPartyError] = useState(null);

  const fetchParties = async () => {
    setLoadingParties(true);
    setPartyError(null);
    const { data, error } = await supabase
      .from("watch_parties")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching parties:", error);
      setPartyError(error.message);
    } else {
      setActiveParties(data.filter((p) => p.status === "active"));
      setConcludedParties(
        data.filter((p) => p.status === "concluded").slice(0, 10)
      );
    }
    setLoadingParties(false);
  };

  useEffect(() => {
    if (currentPage === "Conductors") {
      fetchParties();
    }
  }, [currentPage]);

  const handleReturnFromDashboard = () => {
    setDashboardPartyId(null);
    fetchParties();
  };

  const handleReturnFromViewer = () => {
    setViewingPartyId(null);
    fetchParties();
  };

  if (dashboardPartyId) {
    return (
      <ConductorDashboard
        partyId={dashboardPartyId}
        onBack={handleReturnFromDashboard}
      />
    );
  }

  if (viewingPartyId) {
    return (
      <ViewWatchParty
        partyId={viewingPartyId}
        onBack={handleReturnFromViewer}
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
        return (
          <ConductorsPage
            activeParties={activeParties}
            concludedParties={concludedParties}
            loading={loadingParties}
            error={partyError}
            onSelectDashboard={setDashboardPartyId}
            onJoinParty={setViewingPartyId} // Pass join function
            refreshParties={fetchParties}
          />
        );
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
