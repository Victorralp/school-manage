import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSchoolSubscription } from "../../context/SchoolSubscriptionContext";
import { useAuth } from "../../context/AuthContext";
import { initializeSchoolSubscription } from "../../utils/subscriptionInit";
import Card from "../Card";
import Button from "../Button";
import Alert from "../Alert";

const SchoolSubscriptionWidget = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    school,
    currentPlan,
    subjectUsage,
    studentUsage,
    teacherUsage,
    loading,
    isNearLimit,
    isAdmin,
  } = useSchoolSubscription();
  
  const [initializing, setInitializing] = useState(false);
  const [alert, setAlert] = useState(null);

  const handleInitializeSubscription = async () => {
    setInitializing(true);
    try {
      const result = await initializeSchoolSubscription(user.uid);
      if (result.success) {
        setAlert({ type: 'success', message: 'Subscription initialized successfully! Refreshing...' });
        // Reload the page to fetch the new subscription data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setAlert({ type: 'error', message: result.message });
      }
    } catch (error) {
      console.error('Error initializing subscription:', error);
      setAlert({ type: 'error', message: 'Failed to initialize subscription' });
    } finally {
      setInitializing(false);
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded"></div>
      </Card>
    );
  }

  if (!school || !currentPlan) {
    // Show message that school subscription is being set up
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
            className="mb-4"
          />
        )}
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="bg-blue-100 p-3 rounded-full">
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              School Subscription Not Initialized
            </h3>
            <p className="text-sm text-gray-700 mb-3">
              Your school's subscription system needs to be set up to manage subjects and students.
            </p>
            <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-blue-200 mb-4">
              <p className="text-xs text-gray-600 mb-2">
                <strong>Free Plan Includes:</strong>
              </p>
              <ul className="text-xs text-gray-600 ml-4 list-disc space-y-1">
                <li>10 subjects (school-wide)</li>
                <li>50 students (school-wide)</li>
                <li>Unlimited exams</li>
                <li>Upgrade anytime</li>
              </ul>
            </div>
            <Button
              variant="primary"
              fullWidth
              loading={initializing}
              onClick={handleInitializeSubscription}
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Initialize Free Plan
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getProgressBgColor = (percentage) => {
    if (percentage >= 100) return "bg-red-100";
    if (percentage >= 80) return "bg-yellow-100";
    return "bg-green-100";
  };

  const showWarning = isNearLimit('subject') || isNearLimit('student');

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="bg-blue-600 p-2 rounded-lg">
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-bold text-gray-900">
              {school.name}
            </h3>
            <p className="text-sm text-gray-600 capitalize">
              {school.planTier} Plan {isAdmin && <span className="text-blue-600 font-semibold">(Admin)</span>}
            </p>
          </div>
        </div>
        {school.planTier === 'free' && (
          <span className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded-full">
            FREE
          </span>
        )}
      </div>

      {/* Warning Banner */}
      {showWarning && (
        <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-yellow-400 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm font-medium text-yellow-800">
              School approaching limit! {isAdmin ? 'Consider upgrading.' : 'Contact your admin.'}
            </p>
          </div>
        </div>
      )}

      {/* School-Wide Usage Summary */}
      <div className="mb-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          School-Wide Usage
        </h4>
        <div className="space-y-3">
          {/* Subjects Usage */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Subjects</span>
              <span className="text-sm font-semibold text-gray-900">
                {subjectUsage.current} / {subjectUsage.limit}
              </span>
            </div>
            <div className={`w-full ${getProgressBgColor(subjectUsage.percentage)} rounded-full h-2`}>
              <div
                className={`${getProgressColor(subjectUsage.percentage)} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${Math.min(subjectUsage.percentage, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Students Usage */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Students</span>
              <span className="text-sm font-semibold text-gray-900">
                {studentUsage.current} / {studentUsage.limit}
              </span>
            </div>
            <div className={`w-full ${getProgressBgColor(studentUsage.percentage)} rounded-full h-2`}>
              <div
                className={`${getProgressColor(studentUsage.percentage)} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${Math.min(studentUsage.percentage, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Teacher Usage */}
      {teacherUsage && (
        <div className="mb-4 bg-white bg-opacity-60 rounded-lg p-3 border border-blue-200">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Your Contribution
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-600">Subjects</p>
              <p className="text-lg font-bold text-gray-900">{teacherUsage.subjects}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Students</p>
              <p className="text-lg font-bold text-gray-900">{teacherUsage.students}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          fullWidth
          onClick={() => {
            // Navigate based on user role
            const path = window.location.pathname;
            if (path.startsWith('/school')) {
              // School role user
              navigate('/school/subscription');
            } else {
              // Teacher role user
              navigate('/teacher/subscription');
            }
          }}
        >
          View Details
        </Button>
        {isAdmin && school.planTier === 'free' && (
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={() => {
              // Navigate based on user role
              const path = window.location.pathname;
              if (path.startsWith('/school')) {
                // School role user
                navigate('/school/subscription');
              } else {
                // Teacher role user
                navigate('/teacher/subscription');
              }
            }}
          >
            Upgrade Plan
          </Button>
        )}
        {!isAdmin && school.planTier === 'free' && (
          <Button
            variant="outline"
            size="sm"
            fullWidth
            disabled
            title="Only admins can upgrade"
          >
            Contact Admin
          </Button>
        )}
      </div>
    </Card>
  );
};

export default SchoolSubscriptionWidget;
