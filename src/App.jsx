import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { SchoolSubscriptionProvider } from "./context/SchoolSubscriptionContext";
import { useEffect } from "react";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import CompanyRoutes from "./pages/Company/CompanyRoutes";
import EmployerRoutes from "./pages/Employer/EmployerRoutes";
import ApplicantDashboard from "./pages/Applicant/ApplicantDashboard";
import TakeInterview from "./pages/Applicant/Interview/TakeInterview";
import Login from "./pages/Login";
import AdminSetup from "./pages/AdminSetup";

import CheckAccounts from "./pages/CheckAccounts";
import Welcome from "./pages/Welcome";
import JoinSchoolPage from "./pages/JoinSchoolPage";
import ProtectedRoute from "./routes/ProtectedRoute";

function AppContent() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  // Keyboard shortcut: Ctrl + Shift + A to navigate to admin
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === "A") {
        event.preventDefault();
        if (user && role === "admin") {
          navigate("/admin");
        } else if (user) {
          alert("You don't have admin access!");
        } else {
          alert("Please login first!");
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [user, role, navigate]);

  // Redirect root based on authentication
  const RootRedirect = () => {
    if (!user) {
      return <Welcome />;
    }

    if (role) {
      // Map roles to their routes
      const roleRouteMap = {
        'teacher': '/employer',
        'school': '/company',
        'student': '/applicant'
      };
      const redirectPath = roleRouteMap[role] || `/${role}`;
      return <Navigate to={redirectPath} replace />;
    }

    return <Welcome />;
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/join-school" element={<JoinSchoolPage />} />
      <Route path="/admin-setup" element={<AdminSetup />} />

      <Route path="/check-accounts" element={<CheckAccounts />} />

      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Company Routes */}
      <Route
        path="/company/*"
        element={
          <ProtectedRoute requiredRole="school">
            <CompanyRoutes />
          </ProtectedRoute>
        }
      />

      {/* Employer Routes */}
      <Route
        path="/employer/*"
        element={
          <ProtectedRoute requiredRole="teacher">
            <EmployerRoutes />
          </ProtectedRoute>
        }
      />

      {/* Applicant Routes */}
      <Route
        path="/applicant"
        element={
          <ProtectedRoute requiredRole="student">
            <ApplicantDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/applicant/interview/:interviewId"
        element={
          <ProtectedRoute requiredRole="student">
            <TakeInterview />
          </ProtectedRoute>
        }
      />

      {/* Root Route */}
      <Route path="/" element={<RootRedirect />} />

      {/* 404 Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <SchoolSubscriptionProvider>
        <AppContent />
      </SchoolSubscriptionProvider>
    </Router>
  );
}

export default App;
