import React, { useState } from "react";
import { migrateExistingTeachers, validateMigration } from "../../utils/migrationScript";
import Layout from "../../components/Layout";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Alert from "../../components/Alert";

const MigrationTool = () => {
  const [migrationResults, setMigrationResults] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleRunMigration = async () => {
    if (!window.confirm(
      "This will create Free plan subscriptions for all existing teachers. Continue?"
    )) {
      return;
    }

    setLoading(true);
    setMigrationResults(null);
    
    try {
      const results = await migrateExistingTeachers();
      setMigrationResults(results);
      
      if (results.failed === 0) {
        showAlert("success", `Migration completed successfully! Created ${results.created} subscriptions.`);
      } else {
        showAlert("warning", `Migration completed with ${results.failed} errors.`);
      }
    } catch (error) {
      console.error("Migration error:", error);
      showAlert("error", `Migration failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateMigration = async () => {
    setLoading(true);
    setValidationResults(null);
    
    try {
      const results = await validateMigration();
      setValidationResults(results);
      
      if (results.teachersWithoutSubscriptions.length === 0 && 
          results.subscriptionsWithIncorrectCounts.length === 0) {
        showAlert("success", "Validation passed! All teachers have correct subscriptions.");
      } else {
        showAlert("warning", "Validation found some issues. See details below.");
      }
    } catch (error) {
      console.error("Validation error:", error);
      showAlert("error", `Validation failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Subscription Migration Tool">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
          className="mb-6"
        />
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Instructions Card */}
        <Card>
          <div className="space-y-4">
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
                  Migration Instructions
                </h3>
                <div className="mt-2 text-sm text-gray-600 space-y-2">
                  <p>
                    This tool migrates existing teachers to the new subscription system.
                    It will:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Create Free plan subscriptions for all teachers</li>
                    <li>Count existing subjects (exams) for each teacher</li>
                    <li>Count students in each teacher's school</li>
                    <li>Set appropriate limits based on the Free plan (3 subjects, 10 students)</li>
                  </ul>
                  <p className="mt-3 font-medium text-gray-700">
                    Note: Teachers with existing subscriptions will be skipped.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <Card>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={handleRunMigration}
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Run Migration
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={handleValidateMigration}
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Validate Migration
              </Button>
            </div>
          </div>
        </Card>

        {/* Migration Results */}
        {migrationResults && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Migration Results
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium">Total Teachers</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {migrationResults.total}
                </p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600 font-medium">Created</p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {migrationResults.created}
                </p>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-yellow-600 font-medium">Skipped</p>
                <p className="text-2xl font-bold text-yellow-900 mt-1">
                  {migrationResults.skipped}
                </p>
              </div>
              
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-red-600 font-medium">Failed</p>
                <p className="text-2xl font-bold text-red-900 mt-1">
                  {migrationResults.failed}
                </p>
              </div>
            </div>

            {migrationResults.errors && migrationResults.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-red-900 mb-2">Errors:</h4>
                <div className="bg-red-50 rounded-lg p-4 space-y-2">
                  {migrationResults.errors.map((err, index) => (
                    <div key={index} className="text-sm text-red-700">
                      <span className="font-medium">{err.teacherName}</span> ({err.teacherId}): {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Validation Results */}
        {validationResults && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Validation Results
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium">Total Teachers</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {validationResults.totalTeachers}
                </p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600 font-medium">Total Subscriptions</p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {validationResults.totalSubscriptions}
                </p>
              </div>
            </div>

            {/* Teachers without subscriptions */}
            {validationResults.teachersWithoutSubscriptions.length > 0 ? (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-red-900 mb-2">
                  Teachers Without Subscriptions ({validationResults.teachersWithoutSubscriptions.length}):
                </h4>
                <div className="bg-red-50 rounded-lg p-4 space-y-1">
                  {validationResults.teachersWithoutSubscriptions.map((teacher, index) => (
                    <div key={index} className="text-sm text-red-700">
                      {teacher.name} ({teacher.id})
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-4 flex items-center text-green-700 bg-green-50 rounded-lg p-3">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-medium">All teachers have subscriptions</span>
              </div>
            )}

            {/* Incorrect counts */}
            {validationResults.subscriptionsWithIncorrectCounts.length > 0 ? (
              <div>
                <h4 className="text-sm font-semibold text-yellow-900 mb-2">
                  Subscriptions with Incorrect Counts ({validationResults.subscriptionsWithIncorrectCounts.length}):
                </h4>
                <div className="bg-yellow-50 rounded-lg p-4 space-y-3">
                  {validationResults.subscriptionsWithIncorrectCounts.map((sub, index) => (
                    <div key={index} className="text-sm text-yellow-800">
                      <div className="font-medium">{sub.teacherName} ({sub.teacherId})</div>
                      <div className="ml-4 mt-1 space-y-1">
                        <div>Expected: {sub.expected.subjects} subjects, {sub.expected.students} students</div>
                        <div>Actual: {sub.actual.subjects} subjects, {sub.actual.students} students</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center text-green-700 bg-green-50 rounded-lg p-3">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-medium">All usage counts are accurate</span>
              </div>
            )}
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default MigrationTool;
