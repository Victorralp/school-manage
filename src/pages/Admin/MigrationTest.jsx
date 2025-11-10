import React, { useState } from "react";
import {
  setupTestEnvironment,
  cleanupTestData,
  verifyTestMigration
} from "../../utils/migrationTestHelper";
import { migrateExistingTeachers, validateMigration } from "../../utils/migrationScript";
import Layout from "../../components/Layout";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Alert from "../../components/Alert";

const MigrationTest = () => {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [testLog, setTestLog] = useState([]);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const addLog = (message, type = "info") => {
    setTestLog(prev => [...prev, { message, type, timestamp: new Date() }]);
  };

  const clearLog = () => {
    setTestLog([]);
  };

  const handleRunFullTest = async () => {
    if (!window.confirm(
      "This will create test data, run migration, and validate results. Continue?"
    )) {
      return;
    }

    setLoading(true);
    clearLog();
    setTestResults(null);

    const results = {
      setup: null,
      migration: null,
      validation: null,
      verification: null,
      cleanup: null,
      success: false
    };

    try {
      // Step 1: Setup test environment
      addLog("Step 1: Setting up test environment...", "info");
      const setupResult = await setupTestEnvironment();
      results.setup = setupResult;
      
      if (!setupResult.success) {
        addLog(`Setup failed: ${setupResult.error}`, "error");
        throw new Error("Test environment setup failed");
      }
      
      addLog(`✓ Created ${setupResult.teachers.length} teachers, ${setupResult.exams.length} exams, ${setupResult.students.length} students`, "success");

      // Step 2: Run migration
      addLog("\nStep 2: Running migration...", "info");
      const migrationResult = await migrateExistingTeachers();
      results.migration = migrationResult;
      
      addLog(`✓ Migration completed: ${migrationResult.created} created, ${migrationResult.skipped} skipped, ${migrationResult.failed} failed`, 
        migrationResult.failed > 0 ? "warning" : "success");

      // Step 3: Validate migration
      addLog("\nStep 3: Validating migration...", "info");
      const validationResult = await validateMigration();
      results.validation = validationResult;
      
      const validationPassed = 
        validationResult.teachersWithoutSubscriptions.length === 0 &&
        validationResult.subscriptionsWithIncorrectCounts.length === 0;
      
      addLog(
        validationPassed 
          ? "✓ Validation passed: All teachers have correct subscriptions"
          : `✗ Validation found issues: ${validationResult.teachersWithoutSubscriptions.length} missing, ${validationResult.subscriptionsWithIncorrectCounts.length} incorrect`,
        validationPassed ? "success" : "error"
      );

      // Step 4: Verify test-specific results
      addLog("\nStep 4: Verifying test results...", "info");
      const verificationResult = await verifyTestMigration();
      results.verification = verificationResult;
      
      const verificationPassed = verificationResult.failed.length === 0;
      addLog(
        verificationPassed
          ? `✓ Verification passed: ${verificationResult.passed.length} teachers verified`
          : `✗ Verification failed: ${verificationResult.failed.length} teachers have incorrect data`,
        verificationPassed ? "success" : "error"
      );

      // Step 5: Cleanup
      addLog("\nStep 5: Cleaning up test data...", "info");
      const cleanupResult = await cleanupTestData();
      results.cleanup = cleanupResult;
      
      if (cleanupResult.success) {
        addLog(`✓ Cleanup completed: ${cleanupResult.deletedCount} documents deleted`, "success");
      } else {
        addLog(`✗ Cleanup failed: ${cleanupResult.error}`, "error");
      }

      // Determine overall success
      results.success = 
        setupResult.success &&
        migrationResult.failed === 0 &&
        validationPassed &&
        verificationPassed &&
        cleanupResult.success;

      addLog(
        results.success 
          ? "\n=== ALL TESTS PASSED ===" 
          : "\n=== SOME TESTS FAILED ===",
        results.success ? "success" : "error"
      );

      setTestResults(results);
      showAlert(
        results.success ? "success" : "error",
        results.success 
          ? "All migration tests passed successfully!"
          : "Some migration tests failed. Check the log for details."
      );

    } catch (error) {
      console.error("Test error:", error);
      addLog(`Fatal error: ${error.message}`, "error");
      showAlert("error", `Test failed: ${error.message}`);
      setTestResults(results);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupOnly = async () => {
    setLoading(true);
    clearLog();
    
    try {
      addLog("Setting up test environment...", "info");
      const result = await setupTestEnvironment();
      
      if (result.success) {
        addLog("✓ Test environment created successfully", "success");
        showAlert("success", "Test environment created. You can now run migration manually.");
      } else {
        addLog(`✗ Setup failed: ${result.error}`, "error");
        showAlert("error", `Setup failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Setup error:", error);
      addLog(`Fatal error: ${error.message}`, "error");
      showAlert("error", `Setup failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupOnly = async () => {
    if (!window.confirm("This will delete all test data. Continue?")) {
      return;
    }

    setLoading(true);
    clearLog();
    
    try {
      addLog("Cleaning up test data...", "info");
      const result = await cleanupTestData();
      
      if (result.success) {
        addLog(`✓ Cleanup completed: ${result.deletedCount} documents deleted`, "success");
        showAlert("success", "Test data cleaned up successfully.");
      } else {
        addLog(`✗ Cleanup failed: ${result.error}`, "error");
        showAlert("error", `Cleanup failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Cleanup error:", error);
      addLog(`Fatal error: ${error.message}`, "error");
      showAlert("error", `Cleanup failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Migration Testing">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
          className="mb-6"
        />
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Instructions */}
        <Card>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-blue-600"
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
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Migration Testing Tool
              </h3>
              <div className="mt-2 text-sm text-gray-600 space-y-2">
                <p>
                  This tool tests the migration script with sample data. It will:
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Create 4 test teachers with varying numbers of exams and students</li>
                  <li>Run the migration script to create subscriptions</li>
                  <li>Validate that all teachers have correct subscriptions</li>
                  <li>Verify usage counts match actual data</li>
                  <li>Clean up all test data</li>
                </ol>
                <p className="mt-3 font-medium text-yellow-700">
                  Note: This creates temporary test data with "test-" prefix that will be cleaned up automatically.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Actions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={handleRunFullTest}
              loading={loading}
              className="w-full"
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
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Run Full Test
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={handleSetupOnly}
              loading={loading}
              className="w-full"
            >
              Setup Test Data
            </Button>

            <Button
              variant="danger"
              size="lg"
              onClick={handleCleanupOnly}
              loading={loading}
              className="w-full"
            >
              Cleanup Test Data
            </Button>
          </div>
        </Card>

        {/* Test Log */}
        {testLog.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Test Log</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={clearLog}
              >
                Clear Log
              </Button>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
              {testLog.map((log, index) => (
                <div
                  key={index}
                  className={`mb-1 ${
                    log.type === "error" ? "text-red-400" :
                    log.type === "success" ? "text-green-400" :
                    log.type === "warning" ? "text-yellow-400" :
                    "text-gray-300"
                  }`}
                >
                  {log.message}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Test Results Summary */}
        {testResults && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Test Results Summary
            </h3>
            
            <div className={`rounded-lg p-6 mb-6 ${
              testResults.success 
                ? "bg-green-50 border-2 border-green-200" 
                : "bg-red-50 border-2 border-red-200"
            }`}>
              <div className="flex items-center">
                <svg
                  className={`h-8 w-8 ${testResults.success ? "text-green-600" : "text-red-600"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {testResults.success ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  )}
                </svg>
                <div className="ml-3">
                  <h4 className={`text-xl font-bold ${
                    testResults.success ? "text-green-900" : "text-red-900"
                  }`}>
                    {testResults.success ? "All Tests Passed" : "Some Tests Failed"}
                  </h4>
                  <p className={`text-sm ${
                    testResults.success ? "text-green-700" : "text-red-700"
                  }`}>
                    {testResults.success 
                      ? "Migration script is working correctly"
                      : "Please review the test log for details"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className={`rounded-lg p-4 ${
                testResults.setup?.success ? "bg-green-50" : "bg-red-50"
              }`}>
                <p className="text-sm font-medium text-gray-700">Setup</p>
                <p className={`text-lg font-bold mt-1 ${
                  testResults.setup?.success ? "text-green-900" : "text-red-900"
                }`}>
                  {testResults.setup?.success ? "✓ Pass" : "✗ Fail"}
                </p>
              </div>

              <div className={`rounded-lg p-4 ${
                testResults.migration?.failed === 0 ? "bg-green-50" : "bg-red-50"
              }`}>
                <p className="text-sm font-medium text-gray-700">Migration</p>
                <p className={`text-lg font-bold mt-1 ${
                  testResults.migration?.failed === 0 ? "text-green-900" : "text-red-900"
                }`}>
                  {testResults.migration?.failed === 0 ? "✓ Pass" : "✗ Fail"}
                </p>
              </div>

              <div className={`rounded-lg p-4 ${
                testResults.validation?.teachersWithoutSubscriptions?.length === 0 &&
                testResults.validation?.subscriptionsWithIncorrectCounts?.length === 0
                  ? "bg-green-50" : "bg-red-50"
              }`}>
                <p className="text-sm font-medium text-gray-700">Validation</p>
                <p className={`text-lg font-bold mt-1 ${
                  testResults.validation?.teachersWithoutSubscriptions?.length === 0 &&
                  testResults.validation?.subscriptionsWithIncorrectCounts?.length === 0
                    ? "text-green-900" : "text-red-900"
                }`}>
                  {testResults.validation?.teachersWithoutSubscriptions?.length === 0 &&
                   testResults.validation?.subscriptionsWithIncorrectCounts?.length === 0
                    ? "✓ Pass" : "✗ Fail"}
                </p>
              </div>

              <div className={`rounded-lg p-4 ${
                testResults.verification?.failed?.length === 0 ? "bg-green-50" : "bg-red-50"
              }`}>
                <p className="text-sm font-medium text-gray-700">Verification</p>
                <p className={`text-lg font-bold mt-1 ${
                  testResults.verification?.failed?.length === 0 ? "text-green-900" : "text-red-900"
                }`}>
                  {testResults.verification?.failed?.length === 0 ? "✓ Pass" : "✗ Fail"}
                </p>
              </div>

              <div className={`rounded-lg p-4 ${
                testResults.cleanup?.success ? "bg-green-50" : "bg-red-50"
              }`}>
                <p className="text-sm font-medium text-gray-700">Cleanup</p>
                <p className={`text-lg font-bold mt-1 ${
                  testResults.cleanup?.success ? "text-green-900" : "text-red-900"
                }`}>
                  {testResults.cleanup?.success ? "✓ Pass" : "✗ Fail"}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default MigrationTest;
