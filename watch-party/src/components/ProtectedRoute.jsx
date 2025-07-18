import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/Auth";

const ProtectedRoute = () => {
  const { user } = useAuth();

  // If the user is not logged in, redirect them to the /login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If the user is logged in, render the child route's component
  return <Outlet />;
};

export default ProtectedRoute;
