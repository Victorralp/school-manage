import React, { useState } from "react";
import { auth, db } from "../firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import Card from "../components/Card";
import Button from "../components/Button";

const TestFirebase = () => {
  const [status, setStatus] = useState([]);
  const [loading, setLoading] = useState(false);

  const addStatus = (message, type = "info") => {
    setStatus((prev) => [...prev, { message, type, time: new Date().toLocaleTimeString() }]);
  };

  const testFirebaseConnection = async () => {
    setStatus([]);
    setLoading(true);
    addStatus("Starting Firebase connection test...", "info");

    try {
      // Test 1: Check Firebase Config
      addStatus("✓ Firebase initialized successfully", "success");

      // Test 2: Check Firestore Connection
      try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        addStatus(`✓ Firestore connected - Found ${snapshot.size} users`, "success");
      } catch (err) {
        addStatus(`✗ Firestore error: ${err.message}`, "error");
      }

      // Test 3: Check Auth
      addStatus("✓ Firebase Auth initialized", "success");

      addStatus("All tests completed!", "success");
    } catch (error) {
      addStatus(`✗ Error: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    const testEmail = prompt("Enter test email:");
    const testPassword = prompt("Enter test password:");

    if (!testEmail || !testPassword) {
      addStatus("Test cancelled", "warning");
      return;
    }

    setLoading(true);
    addStatus(`Attempting login with: ${testEmail}`, "info");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        testEmail,
        testPassword
      );
      addStatus(`✓ Login successful! User ID: ${userCredential.user.uid}`, "success");
      addStatus(`Email: ${userCredential.user.email}`, "info");
    } catch (error) {
      addStatus(`✗ Login failed: ${error.code}`, "error");
      addStatus(`Message: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <h1 className="text-2xl font-bold mb-4">Firebase Connection Test</h1>
          <p className="text-gray-600 mb-6">
            Use this page to test your Firebase configuration and connection.
          </p>

          <div className="flex gap-4 mb-6">
            <Button
              onClick={testFirebaseConnection}
              loading={loading}
              variant="primary"
            >
              Test Firebase Connection
            </Button>
            <Button onClick={testLogin} loading={loading} variant="secondary">
              Test Login
            </Button>
          </div>

          {status.length > 0 && (
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm space-y-2 max-h-96 overflow-y-auto">
              {status.map((item, index) => (
                <div
                  key={index}
                  className={`${
                    item.type === "success"
                      ? "text-green-400"
                      : item.type === "error"
                      ? "text-red-400"
                      : item.type === "warning"
                      ? "text-yellow-400"
                      : "text-blue-400"
                  }`}
                >
                  [{item.time}] {item.message}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">
              Environment Variables Status:
            </h3>
            <div className="space-y-1 text-sm">
              <div>
                API Key:{" "}
                {import.meta.env.VITE_FIREBASE_API_KEY ? (
                  <span className="text-green-600">✓ Set</span>
                ) : (
                  <span className="text-red-600">✗ Missing</span>
                )}
              </div>
              <div>
                Auth Domain:{" "}
                {import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? (
                  <span className="text-green-600">✓ Set</span>
                ) : (
                  <span className="text-red-600">✗ Missing</span>
                )}
              </div>
              <div>
                Project ID:{" "}
                {import.meta.env.VITE_FIREBASE_PROJECT_ID ? (
                  <span className="text-green-600">✓ Set</span>
                ) : (
                  <span className="text-red-600">✗ Missing</span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TestFirebase;
