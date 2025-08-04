import React from "react";
import { Routes, Route, Outlet, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/Auth";

// Import all your page/layout components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import FeaturedMovies from "./components/FeaturedMovies";
import CreateWatchParty from "./components/CreateWatchParty";
import Login from "./components/Auth/Login";
import SignUp from "./components/Auth/SignUp";
import ConductorsPage from "./components/ConductorsPage";
import PublicProfilePage from "./components/PublicProfilePage";
import ProfilePage from "./components/ProfilePage";
import ConductorDashboard from "./components/ConductorDashboard";
import ViewWatchParty from "./components/ViewWatchParty";
import ProtectedRoute from "./components/ProtectedRoute"; // Import our new component
import ReviewParty from "./components/ReviewParty";

// This Layout component includes the shared Navbar and Footer.
// The <Outlet> component renders the specific child route component.
const AppLayout = () => (
  <div className="bg-gray-900 min-h-screen">
    <Navbar />
    <main>
      <Outlet />
    </main>
    <Footer />
  </div>
);

// We create a dedicated component for the home page content
const HomePage = () => {
  const navigate = useNavigate();
  return (
    <>
      <Hero
        setActiveLink={(page) =>
          navigate(`/${page.toLowerCase().replace(" ", "-")}`)
        }
      />
      <HowItWorks />
      <FeaturedMovies />
    </>
  );
};

// The main AppContent now just defines the routes for the entire application.
const AppContent = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* --- Protected Routes (User must be logged in) --- */}
      <Route element={<ProtectedRoute />}>
        {/* Routes with Navbar and Footer */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/conductor-hub" element={<ConductorsPage />} />
          <Route path="/create-party" element={<CreateWatchParty />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:username" element={<PublicProfilePage />} />
          <Route path="/review-party/:partyId" element={<ReviewParty />} />
        </Route>

        {/* Full-screen routes without Navbar/Footer */}
        <Route path="/dashboard/:partyId" element={<ConductorDashboard />} />
        <Route path="/party/:partyId" element={<ViewWatchParty />} />
      </Route>

      {/* --- Public/Auth Routes (User should NOT be logged in) --- */}
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" /> : <SignUp />} />

      {/* Optional: A catch-all route for 404 Not Found pages */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

// The final App component is clean and simple.
const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
