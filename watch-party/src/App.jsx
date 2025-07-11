import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/Auth";
import { supabase } from "./supabaseClient"; // Import supabase client

// Import all necessary components
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

const AppContent = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState("Home");
  const [authView, setAuthView] = useState("login");
  const [viewingPartyId, setViewingPartyId] = useState(null);

  // --- State and Logic Lifted Up from ConductorsPage ---
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
      const active = data.filter((p) => p.status === "active");
      const concluded = data
        .filter((p) => p.status === "concluded")
        .slice(0, 10);
      setActiveParties(active);
      setConcludedParties(concluded);
    }
    setLoadingParties(false);
  };

  // Fetch parties when the Conductors page is selected
  useEffect(() => {
    if (currentPage === "Conductors") {
      fetchParties();
    }
  }, [currentPage]);

  // When returning from the dashboard, refresh the party list
  const handleReturnFromDashboard = () => {
    setViewingPartyId(null);
    fetchParties(); // Re-fetch data to ensure it's up-to-date
  };

  // If a party dashboard is being viewed, render it exclusively
  if (viewingPartyId) {
    return (
      <ConductorDashboard
        partyId={viewingPartyId}
        onBack={handleReturnFromDashboard}
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
        // Pass the fetched data and the fetch function down as props
        return (
          <ConductorsPage
            activeParties={activeParties}
            concludedParties={concludedParties}
            loading={loadingParties}
            error={partyError}
            onSelectDashboard={setViewingPartyId}
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
