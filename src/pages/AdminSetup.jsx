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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 animate-pulse">Checking existing admins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 overflow-hidden relative selection:bg-indigo-500 selection:text-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[100px] animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-xl w-full relative z-10">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex justify-center mb-6">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-lg shadow-indigo-500/20">
              <svg
                className="h-10 w-10 text-white"
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
            </div>
          </div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight mb-2">
            Administrator Setup
          </h2>
          <p className="text-slate-400">
            Create a master account to manage your institution.
          </p>
        </div>

        {/* Info Banner */}
        {!setupComplete && (
          <div className="mb-8 bg-slate-800/50 backdrop-blur-md border border-indigo-500/20 rounded-xl p-5 flex items-start gap-3">
            <svg className="h-6 w-6 text-indigo-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-slate-300 leading-relaxed">
              <span className="font-semibold text-indigo-400">Admin Privileges:</span> Admin accounts allow full access to manage schools, teachers, students, and system configurations.
            </div>
          </div>
        )}

        {/* Existing Admins Warning */}
        {existingAdmins.length > 0 && !setupComplete && (
          <div className="mb-8 bg-amber-500/10 backdrop-blur-md border border-amber-500/20 rounded-xl p-6">
            <div className="flex items-start">
              <svg className="h-6 w-6 text-amber-500 mr-3 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-400 mb-2">
                  Account(s) Detected
                </h3>
                <p className="text-sm text-amber-200/80 mb-4">
                  The following administrator account(s) are already registered:
                </p>
                <div className="bg-slate-900/50 rounded-lg p-3 space-y-2 mb-4 border border-white/5">
                  {existingAdmins.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold text-white">{admin.name}</p>
                        <p className="text-slate-400 text-xs">{admin.email}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/20">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-amber-200/60">
                  You can create another, or <button onClick={() => navigate("/login")} className="text-amber-400 hover:text-amber-300 font-medium underline">login now</button>.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl">
          {alert && (
            <Alert
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
              className="mb-6"
            />
          )}

          {setupComplete ? (
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-emerald-500/20 mb-6">
                <svg className="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Setup Complete!</h3>
              <p className="text-slate-400 mb-6">Your administrator account is ready.</p>

              <div className="bg-slate-900/50 rounded-xl p-4 max-w-sm mx-auto mb-8 border border-white/5">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">Name</span>
                  <span className="text-white font-medium">{formData.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Email</span>
                  <span className="text-white font-medium">{formData.email}</span>
                </div>
              </div>

              <div className="text-sm text-slate-500 mb-6 flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                Redirecting to login...
              </div>
            </div>
          ) : (
            <>
              {/* Setup Form */}
              <form onSubmit={handleSetup} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Enter administrator name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="admin@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-900 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                        Creating Account...
                      </>
                    ) : (
                      "Create Administrator Account"
                    )}
                  </button>
                </div>
              </form>

              {/* Footer Links */}
              <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-slate-400 hover:text-white font-medium flex items-center transition-colors"
                >
                  <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Login
                </button>
                <a
                  href="https://console.firebase.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-indigo-400 font-medium flex items-center transition-colors"
                >
                  Firebase Console
                  <svg className="h-4 w-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Employment Management System
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;
