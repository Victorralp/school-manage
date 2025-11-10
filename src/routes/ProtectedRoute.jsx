import React, { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to appropriate dashboard if user is logged in but accessing wrong route
    if (user && role && requiredRole && role !== requiredRole) {
      navigate(`/${role}`, { replace: true });
    }
  }, [user, role, requiredRole, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user account is pending approval
  if (role !== "admin" && user) {
    // This check will be enhanced when we fetch userData
    // For now, we'll allow access
  }

  // Wrong role
  if (requiredRole && role !== requiredRole) {
    return <Navigate to={`/${role}`} replace />;
  }

  return children;
};

export default ProtectedRoute;
