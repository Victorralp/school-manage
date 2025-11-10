import React, { useState, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  doc,
  setDoc,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import Alert from "../components/Alert";

const AdminSetup = () => {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [setupComplete, setSetupComplete] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [existingAdmins, setExistingAdmins] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    checkExistingAdmins();
  }, []);

  const checkExistingAdmins = async () => {
    setCheckingExisting(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("role", "==", "admin"));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const admins = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setExistingAdmins(admins);
      }
    } catch (error) {
      console.error("Error checking admins:", error);
      showAlert("error", "Failed to check existing admins");
    } finally {
      setCheckingExisting(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSetup = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      showAlert("error", "Name is required");
      return;
    }

    if (!formData.email.trim()) {
      showAlert("error", "Email is required");
      return;
    }

    if (formData.password.length < 6) {
      showAlert("error", "Password must be at least 6 characters long");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showAlert("error", "Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // Create authentication account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );

      // Create admin user document in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: formData.email,
        name: formData.name,
        role: "admin",
        status: "active",
        createdAt: new Date(),
      });

      setSetupComplete(true);
      showAlert("success", "Admin account created successfully!");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("Error creating admin account:", error);

      if (error.code === "auth/email-already-in-use") {
        showAlert("error", "This email is already registered. Please use a different email or login.");
      } else if (error.code === "auth/invalid-email") {
        showAlert("error", "Invalid email address");
      } else {
        showAlert("error", error.message || "Failed to create admin account");
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingExisting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Checking existing admins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-4 rounded-full">
              <svg
                className="h-12 w-12 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900">
            Administrator Setup
          </h2>
          <p className="mt-2 text-base text-gray-600">
            Create a new system administrator account
          </p>
        </div>

        {/* Existing Admins Warning */}
        {existingAdmins.length > 0 && !setupComplete && (
          <Card className="mb-6 border-l-4 border-yellow-500">
            <div className="flex items-start">
              <svg
                className="h-6 w-6 text-yellow-600 mr-3 flex-shrink-0 mt-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                  Admin Account(s) Already Exist
                </h3>
                <p className="text-sm text-yellow-800 mb-3">
                  The following administrator account(s) are already registered:
                </p>
                <div className="bg-yellow-50 rounded-lg p-3 space-y-2">
                  {existingAdmins.map((admin) => (
                    <div
                      key={admin.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div>
                        <p className="font-semibold text-yellow-900">
                          {admin.name}
                        </p>
                        <p className="text-yellow-700">{admin.email}</p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-yellow-800 mt-3">
                  You can still create additional admin accounts below, or{" "}
                  <button
                    onClick={() => navigate("/login")}
                    className="font-semibold underline hover:text-yellow-900"
                  >
                    go to login
                  </button>
                  .
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Setup Card */}
        <Card>
          {alert && (
            <Alert
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
              className="mb-6"
            />
          )}

          {setupComplete ? (
            <div className="text-center py-12">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
                <svg
                  className="h-12 w-12 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Admin Account Created!
              </h3>
              <p className="text-gray-600 mb-2">
                Your administrator account has been set up successfully.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 max-w-sm mx-auto mb-6">
                <p className="text-sm text-gray-700">
                  <strong>Email:</strong> {formData.email}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Name:</strong> {formData.name}
                </p>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Redirecting to login page...
              </p>
              <div className="flex justify-center">
                <div className="spinner"></div>
              </div>
            </div>
          ) : (
            <>
              {/* Info Banner */}
              <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5">
                <div className="flex items-start">
                  <svg
                    className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <h3 className="text-base font-semibold text-blue-900 mb-2">
                      Administrator Account Setup
                    </h3>
                    <p className="text-sm text-blue-800">
                      Create a system administrator account with full access to
                      manage schools, teachers, students, and exams. Admin
                      accounts can approve school registrations and monitor the
                      entire platform.
                    </p>
                  </div>
                </div>
              </div>

              {/* Setup Form */}
              <form onSubmit={handleSetup} className="space-y-5">
                <Input
                  label="Full Name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter administrator name"
                  required
                  icon={
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  }
                />

                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                  required
                  helperText="Use a valid email address for account recovery"
                  icon={
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                  }
                />

                <Input
                  label="Password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter a secure password"
                  required
                  helperText="Minimum 6 characters"
                  icon={
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  }
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  required
                  icon={
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  }
                />

                <div className="pt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={loading}
                  >
                    <svg
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                      />
                    </svg>
                    Create Administrator Account
                  </Button>
                </div>
              </form>

              {/* Footer Links */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
                  >
                    <svg
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                      />
                    </svg>
                    Back to Login
                  </button>
                  <a
                    href="https://console.firebase.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-700 font-medium flex items-center"
                  >
                    Firebase Console
                    <svg
                      className="h-4 w-4 ml-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} School Exam Management System
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;
