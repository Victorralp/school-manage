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
import SchoolDashboard from "./pages/School/SchoolDashboard";
import TeacherRoutes from "./pages/Teacher/TeacherRoutes";
import StudentDashboard from "./pages/Student/StudentDashboard";
import TakeExam from "./pages/Student/Exam/TakeExam";
import Login from "./pages/Login";
import AdminSetup from "./pages/AdminSetup";
import TestFirebase from "./pages/TestFirebase";
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
      return <Navigate to={`/${role}`} replace />;
    }

    return <Welcome />;
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/join-school" element={<JoinSchoolPage />} />
      <Route path="/admin-setup" element={<AdminSetup />} />
      <Route path="/test-firebase" element={<TestFirebase />} />
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

      {/* School Routes */}
      <Route
        path="/school/*"
        element={
          <ProtectedRoute requiredRole="school">
            <SchoolDashboard />
          </ProtectedRoute>
        }
      />

      {/* Teacher Routes */}
      <Route
        path="/teacher/*"
        element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherRoutes />
          </ProtectedRoute>
        }
      />

      {/* Student Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/exam/:examId"
        element={
          <ProtectedRoute requiredRole="student">
            <TakeExam />
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
