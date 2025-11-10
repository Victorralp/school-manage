import React from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "../../context/SubscriptionContext";
import Card from "../Card";
import Button from "../Button";

const SubscriptionWidget = () => {
  const navigate = useNavigate();
  const {
    subscription,
    currentPlan,
    subjectUsage,
    studentUsage,
    loading,
    isNearLimit,
  } = useSubscription();

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded"></div>
      </Card>
    );
  }

  if (!subscription || !currentPlan) {
    return null;
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
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-bold text-gray-900 capitalize">
              {subscription.planTier} Plan
            </h3>
            <p className="text-sm text-gray-600">Your current subscription</p>
          </div>
        </div>
        {subscription.planTier === 'free' && (
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
              Approaching limit! Consider upgrading.
            </p>
          </div>
        </div>
      )}

      {/* Usage Summary */}
      <div className="space-y-3 mb-4">
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

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          fullWidth
          onClick={() => navigate('/teacher/subscription')}
        >
          View Details
        </Button>
        {subscription.planTier === 'free' && (
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={() => navigate('/teacher/subscription')}
          >
            Upgrade Plan
          </Button>
        )}
      </div>
    </Card>
  );
};

export default SubscriptionWidget;
