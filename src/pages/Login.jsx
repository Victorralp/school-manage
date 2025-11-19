import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { initializeTeacherSubscription, initializeSchoolSubscription } from "../utils/subscriptionInit";
import { verifyStudentId } from "../firebase/studentService";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Input from "../components/Input";
import Button from "../components/Button";
import Alert from "../components/Alert";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'studentId'
  const [studentId, setStudentId] = useState('');
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    role: "teacher",
    schoolId: "",
    schoolName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { role } = useAuth();

  // Redirect if already logged in
  React.useEffect(() => {
    if (role) {
      navigate(`/${role}`);
    }
  }, [role, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (loginMethod === 'studentId') {
        // Student ID login
        if (!studentId.trim()) {
          setError("Please enter your Student ID");
          setLoading(false);
          return;
        }

        // Verify student ID and get student data
        const student = await verifyStudentId(studentId.trim().toUpperCase());
        
        // Check if student has email (required for Firebase Auth)
        if (!student.email) {
          setError("This student account doesn't have an email. Please contact your teacher.");
          setLoading(false);
          return;
        }

        // Use Student ID as password (Firebase requires email/password)
        // This is secure because Student ID is unique and only known to the student
        const password = studentId.trim().toUpperCase();
        
        try {
          // Try to sign in with email and Student ID as password
          const userCredential = await signInWithEmailAndPassword(auth, student.email, password);
          
          // Check if user document exists for AuthContext
          const authUserDoc = await getDoc(doc(db, "users", userCredential.user.uid));
          
          if (!authUserDoc.exists()) {
            // Create user document with auth UID if it doesn't exist
            await setDoc(doc(db, "users", userCredential.user.uid), {
              name: student.name,
              email: student.email,
              phoneNumber: student.phoneNumber,
              studentId: student.studentId,
              role: 'student',
              schoolId: student.schoolId,
              registeredBy: student.registeredBy,
              status: 'active',
              originalDocId: student.id,
              authUid: userCredential.user.uid,
              lastLogin: new Date(),
              createdAt: new Date()
            });
          } else {
            // Update last login
            await updateDoc(doc(db, "users", userCredential.user.uid), {
              lastLogin: new Date()
            });
          }
        } catch (signInError) {
          // If sign-in fails, the account might not exist yet
          // Create account with Student ID as password
          if (
            signInError.code === 'auth/user-not-found' || 
            signInError.code === 'auth/wrong-password' ||
            signInError.code === 'auth/invalid-login-credentials' ||
            signInError.code === 'auth/invalid-email'
          ) {
            try {
              // Create new Firebase Auth account
              const userCredential = await createUserWithEmailAndPassword(auth, student.email, password);
              
              // Create a user document with the auth UID that AuthContext can find
              await setDoc(doc(db, "users", userCredential.user.uid), {
                name: student.name,
                email: student.email,
                phoneNumber: student.phoneNumber,
                studentId: student.studentId,
                role: 'student',
                schoolId: student.schoolId,
                registeredBy: student.registeredBy,
                status: 'active',
                originalDocId: student.id, // Reference to original document
                authUid: userCredential.user.uid,
                lastLogin: new Date(),
                createdAt: new Date()
              });
              
              console.log('Student account created successfully');
            } catch (createError) {
              console.error('Error creating account:', createError);
              
              // If account exists but password is wrong
              if (createError.code === 'auth/email-already-in-use') {
                throw new Error("Account exists with different credentials. Please contact your teacher.");
              }
              
              // If email is invalid
              if (createError.code === 'auth/invalid-email') {
                throw new Error("Invalid email address. Please contact your teacher to update your email.");
              }
              
              // If password is too weak (shouldn't happen with Student ID)
              if (createError.code === 'auth/weak-password') {
                throw new Error("Student ID format is invalid. Please contact your teacher.");
              }
              
              throw createError;
            }
          } else {
            throw signInError;
          }
        }

        // Navigation will be handled by AuthContext
      } else {
        // Email/password login
        await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password,
        );

        // Navigation will be handled by AuthContext
      }
    } catch (err) {
      console.error("Login error:", err);
      if (loginMethod === 'studentId') {
        setError(err.message || "Invalid Student ID. Please check and try again.");
      } else {
        setError(err.message || "Failed to login. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (formData.role === "school" && !formData.schoolName.trim()) {
      setError("School name is required");
      return;
    }

    if (formData.role === "teacher" && !formData.schoolId.trim()) {
      setError("School ID is required for teacher registration");
      return;
    }

    setLoading(true);

    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );

      // Create user document in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: formData.email,
        name: formData.name,
        role: formData.role,
        schoolId:
          formData.role === "school"
            ? userCredential.user.uid
            : formData.schoolId || null,
        status:
          formData.role === "student" || formData.role === "teacher"
            ? "pending"
            : formData.role === "school"
              ? "pending"
              : "active",
        createdAt: new Date(),
      });

      // If school registration, create school document
      if (formData.role === "school") {
        await setDoc(doc(db, "schools", userCredential.user.uid), {
          schoolId: userCredential.user.uid,
          name: formData.schoolName || formData.name,
          email: formData.email,
          adminName: formData.name,
          status: "pending",
          createdAt: new Date(),
        });

        // Initialize Free plan subscription for school
        const schoolSubscriptionResult = await initializeSchoolSubscription(userCredential.user.uid);
        if (!schoolSubscriptionResult.success) {
          console.error("Failed to initialize school subscription:", schoolSubscriptionResult.message);
          // Don't block registration if subscription init fails
        }
      }

      // If teacher registration, initialize Free plan subscription
      if (formData.role === "teacher") {
        const subscriptionResult = await initializeTeacherSubscription(userCredential.user.uid);
        if (!subscriptionResult.success) {
          console.error("Failed to initialize subscription:", subscriptionResult.message);
          // Don't block registration if subscription init fails
        }
      }

      // Navigation will be handled by AuthContext
    } catch (err) {
      setError(err.message || "Failed to register. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex">
      {/* Left Side - Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center mb-8">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
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
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h1 className="ml-4 text-2xl font-bold text-white">
              School Exam System
            </h1>
          </div>

          <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
            Modern Exam Management Platform
          </h2>
          <p className="text-xl text-blue-100 mb-12">
            Streamline your educational assessments with our comprehensive
            online examination system.
          </p>

          {/* Features */}
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg backdrop-blur-sm">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-white mb-1">
                  Real-Time Grading
                </h3>
                <p className="text-blue-100">
                  Instant results and automated scoring for efficient assessment
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg backdrop-blur-sm">
                <svg
                  className="h-6 w-6 text-white"
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
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-white mb-1">
                  Secure & Reliable
                </h3>
                <p className="text-blue-100">
                  Role-based access control and secure data management
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg backdrop-blur-sm">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-white mb-1">
                  Performance Analytics
                </h3>
                <p className="text-blue-100">
                  Track progress and analyze results with detailed insights
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-6 mt-12">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">4</div>
            <div className="text-sm text-blue-100">User Roles</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">∞</div>
            <div className="text-sm text-blue-100">Exams</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">24/7</div>
            <div className="text-sm text-blue-100">Available</div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-600 p-4 rounded-2xl">
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
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              School Exam System
            </h2>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isLogin ? "Welcome Back!" : "Get Started"}
            </h2>
            <p className="text-gray-600">
              {isLogin
                ? "Sign in to access your dashboard"
                : "Create your account to begin"}
            </p>
          </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          {error && (
            <Alert
              type="error"
              message={error}
              onClose={() => setError("")}
              className="mb-4"
            />
          )}

          <form onSubmit={isLogin ? handleLogin : handleRegister}>
            {!isLogin && (
              <>
                <Input
                  label="Full Name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  icon={
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
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

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="teacher">Teacher</option>
                    <option value="school">School Administrator</option>
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    <strong>Students:</strong> You will be registered by your teacher. Use Student ID to login.
                  </p>
                </div>

                {formData.role === "school" && (
                  <Input
                    label="School Name"
                    type="text"
                    name="schoolName"
                    value={formData.schoolName}
                    onChange={handleChange}
                    placeholder="Enter your school name"
                    required
                    helperText="Official name of your school or institution"
                    icon={
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    }
                  />
                )}

                {formData.role === "teacher" && (
                  <Input
                    label="School ID"
                    type="text"
                    name="schoolId"
                    value={formData.schoolId}
                    onChange={handleChange}
                    placeholder="Enter your school ID"
                    required
                    helperText="Contact your school administrator for the School ID"
                    icon={
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    }
                  />
                )}


              </>
            )}

            {/* Login Method Toggle (only for login, not register) */}
            {isLogin && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Login Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLoginMethod('email')}
                    className={`py-3 px-4 rounded-lg border-2 transition-all font-medium ${
                      loginMethod === 'email'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    📧 Email/Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('studentId')}
                    className={`py-3 px-4 rounded-lg border-2 transition-all font-medium ${
                      loginMethod === 'studentId'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    🎓 Student ID
                  </button>
                </div>
              </div>
            )}

            {/* Student ID Input */}
            {isLogin && loginMethod === 'studentId' ? (
              <div>
                <Input
                  label="Student ID"
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                  placeholder="e.g., STU-A3B7K9"
                  required
                  helperText="Enter the Student ID provided by your teacher"
                  icon={
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                      />
                    </svg>
                  }
                />
                <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Don't have a Student ID?</strong> Contact your teacher to register you in the system.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  icon={
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
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
                  placeholder="••••••••"
                  required
                  helperText={!isLogin ? "Minimum 6 characters" : ""}
                  icon={
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
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
              </>
            )}

            {!isLogin && (
              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                icon={
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
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
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              className="mt-2"
            >
              {isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          {/* Divider */}
          <div className="mt-6 mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  {isLogin ? "New to the platform?" : "Already registered?"}
                </span>
              </div>
            </div>
          </div>

          {/* Toggle between login and register */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setFormData({
                  email: "",
                  password: "",
                  confirmPassword: "",
                  name: "",
                  role: "teacher",
                  schoolId: "",
                  schoolName: "",
                });
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              {isLogin
                ? "Create a new account →"
                : "← Back to sign in"}
            </button>
          </div>

          {/* Info text */}
          {!isLogin && (
            <div className="mt-4 space-y-3">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start">
                  <svg
                    className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0"
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
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      Registration Instructions
                    </p>
                    <p className="text-xs text-blue-800">
                      {formData.role === "school" ? (
                        <>
                          <strong>School Administrators:</strong> Provide your
                          school name and admin details. Your registration will
                          be reviewed by the system admin before approval.
                        </>
                      ) : formData.role === "teacher" ? (
                        <>
                          <strong>Teachers:</strong> Enter your School ID
                          (provided by your school admin). Your registration
                          will be reviewed by your school before approval.
                        </>
                      ) : (
                        <>
                          <strong>Students:</strong> Enter your School ID
                          (provided by your school admin). Your registration
                          will be reviewed by your school before approval.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {(formData.role === "teacher" || formData.role === "student") && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-xs text-yellow-800">
                    <strong>Need School ID?</strong> Contact your school
                    administrator to get your School ID before registering.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="mt-8 flex items-center justify-center gap-6 text-sm">
          <button
            onClick={() => navigate("/")}
            className="text-gray-600 hover:text-gray-900 font-medium transition-colors flex items-center"
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Home
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => navigate("/check-accounts")}
            className="text-gray-600 hover:text-gray-900 font-medium transition-colors flex items-center"
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Check Accounts
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => navigate("/admin-setup")}
            className="text-gray-600 hover:text-gray-900 font-medium transition-colors flex items-center"
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
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Admin Setup
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} School Exam Management System. All
            rights reserved.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Secure • Reliable • Easy to Use
          </p>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
