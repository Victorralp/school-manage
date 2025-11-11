import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { initializeCurrentSchoolSubscription } from '../../utils/initializeSchoolSubscriptions';
import Button from '../Button';
import Card from '../Card';

export default function InitializeSchoolSubscription() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleInitialize = async () => {
    if (!user) return;

    setLoading(true);
    setResult(null);

    try {
      const initResult = await initializeCurrentSchoolSubscription(user.uid);
      setResult(initResult);

      if (initResult.success) {
        // Reload page immediately to show new subscription
        setTimeout(() => {
          window.location.reload(true); // Force reload from server
        }, 1500);
      }
    } catch (error) {
      console.error('Error initializing subscription:', error);
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-blue-50 border-2 border-blue-200">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-8 w-8 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Initialize School Subscription
          </h3>
          <p className="text-sm text-blue-800 mb-4">
            Set up your school's subscription system. This is a one-time setup that will:
          </p>
          <ul className="text-sm text-blue-700 space-y-1 mb-4 list-disc list-inside">
            <li>Create your school subscription with a Free plan</li>
            <li>Count your existing subjects and students</li>
            <li>Enable subscription management features</li>
          </ul>

          {result && (
            <div className={`mb-4 p-3 rounded-lg ${
              result.success 
                ? 'bg-green-100 border border-green-300' 
                : 'bg-red-100 border border-red-300'
            }`}>
              <p className={`text-sm font-medium ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.success 
                  ? '✓ Subscription initialized successfully! Reloading...' 
                  : `✗ Error: ${result.error}`
                }
              </p>
              {result.success && result.data && (
                <div className="mt-2 text-xs text-green-700">
                  <p>Subjects: {result.data.currentSubjects}</p>
                  <p>Students: {result.data.currentStudents}</p>
                  <p>Teachers: {result.data.teacherCount}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={handleInitialize}
              loading={loading}
              disabled={result?.success}
            >
              {loading ? 'Initializing...' : 'Initialize Subscription'}
            </Button>
            {result?.success && (
              <Button
                variant="secondary"
                onClick={() => window.location.reload(true)}
              >
                Refresh Page
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
