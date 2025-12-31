import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSchoolSubscription } from "../../context/SchoolSubscriptionContext";
import { useAuth } from "../../context/AuthContext";
import { initializeSchoolSubscription } from "../../utils/subscriptionInit";
import Card from "../Card";
import Button from "../Button";
import Alert from "../Alert";

// Import new enhanced components
import CircularProgress from "./CircularProgress";
import StatusBadge from "./StatusBadge";
import ExpiryDisplay from "./ExpiryDisplay";
import ContributionPanel from "./ContributionPanel";
import { getPlanTheme } from "./subscriptionThemes";

/**
 * Star Icon - Used for Free tier
 */
const StarIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
    />
  </svg>
);

/**
 * Sparkles Icon - Used for Premium tier
 */
const SparklesIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
    />
  </svg>
);

/**
 * Crown Icon - Used for VIP tier
 */
const CrownIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 10l3-3 4 4 4-8 4 8 3-3v10H3V10z"
    />
  </svg>
);

/**
 * Book Icon - Used for subjects in CircularProgress
 */
const BookIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
    />
  </svg>
);

/**
 * Users Icon - Used for students in CircularProgress
 */
const UsersIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

/**
 * Icon mapping for plan tiers
 */
const TIER_ICONS = {
  StarIcon,
  SparklesIcon,
  CrownIcon
};

/**
 * Get tier icon component based on plan theme
 */
const getTierIcon = (iconName) => {
  return TIER_ICONS[iconName] || StarIcon;
};

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

  // Handle navigation based on current path
  const handleNavigate = (destination) => {
    const path = window.location.pathname;
    if (path.startsWith('/company')) {
      navigate('/company/subscription');
    } else {
      navigate('/employer/subscription');
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

  // Get theme configuration based on plan tier
  const planTier = school.planTier || 'free';
  const theme = getPlanTheme(planTier);
  const TierIcon = getTierIcon(theme.icon);
  
  // Determine subscription status
  const subscriptionStatus = school.status || 'active';
  
  // Check if we should show warning
  const showWarning = isNearLimit('subject') || isNearLimit('student');

  // Prepare school usage data for ContributionPanel
  const schoolUsageData = {
    subjects: subjectUsage?.current || 0,
    students: studentUsage?.current || 0
  };

  return (
    <Card 
      className={`card-transition bg-gradient-to-br ${theme.gradient} border-2 ${theme.borderColor}`}
      role="region"
      aria-label="School subscription information"
    >
      {/* Enhanced Header with Plan Theme - Task 6.1 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          {/* Tier Icon with themed background */}
          <div className={`${theme.iconBg} p-2.5 rounded-xl shadow-sm`}>
            <TierIcon className={`h-6 w-6 text-${theme.accentColor}`} />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-bold text-gray-900">
              {school.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {/* Plan tier badge with theme colors */}
              <span 
                className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${theme.badgeColor} shadow-sm`}
                aria-label={`${planTier} plan`}
              >
                {planTier.toUpperCase()}
              </span>
              {isAdmin && (
                <span className="text-xs text-blue-600 font-semibold">(Admin)</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Status Badge - Task 6.1 */}
        <StatusBadge status={subscriptionStatus} />
      </div>

      {/* Warning Banner */}
      {showWarning && (
        <div 
          className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded"
          role="alert"
          aria-label="Usage limit warning"
        >
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-yellow-400 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
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

      {/* School-Wide Usage with Circular Progress - Task 6.2 */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          School-Wide Usage
        </h4>
        <div 
          className="grid grid-cols-2 sm:grid-cols-2 gap-4 sm:gap-6 justify-items-center subscription-usage-grid"
          role="group"
          aria-label="Usage statistics"
        >
          {/* Subjects CircularProgress */}
          <CircularProgress
            current={subjectUsage?.current || 0}
            limit={subjectUsage?.limit || 0}
            label="Subjects"
            icon={<BookIcon className="w-full h-full" />}
            size="md"
          />
          
          {/* Students CircularProgress */}
          <CircularProgress
            current={studentUsage?.current || 0}
            limit={studentUsage?.limit || 0}
            label="Students"
            icon={<UsersIcon className="w-full h-full" />}
            size="md"
          />
        </div>
      </div>

      {/* Contribution Panel and Expiry Display - Task 6.3 */}
      <div className="space-y-3 mb-4">
        {/* Teacher Contribution Panel */}
        {teacherUsage && (
          <ContributionPanel
            teacherUsage={teacherUsage}
            schoolUsage={schoolUsageData}
          />
        )}
        
        {/* Expiry Display for paid plans */}
        {planTier !== 'free' && school.expiryDate && (
          <div className="flex justify-center">
            <ExpiryDisplay 
              expiryDate={school.expiryDate} 
              showFullDate={true}
            />
          </div>
        )}
      </div>

      {/* Enhanced Action Buttons - Task 6.4, 7.1, 7.2 */}
      <div className="flex flex-col sm:flex-row gap-2 action-buttons-stack sm:action-buttons-row">
        <Button
          variant={theme.buttonVariant}
          size="sm"
          fullWidth
          onClick={() => handleNavigate('details')}
          className={`
            btn-hover-scale touch-target
            transition-all duration-200 
            focus:ring-2 focus:ring-offset-2 focus:ring-${theme.accentColor}
          `}
          aria-label="View subscription details"
        >
          View Details
        </Button>
        
        {isAdmin && planTier === 'free' && (
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={() => handleNavigate('upgrade')}
            className={`
              btn-upgrade-glow touch-target
              bg-gradient-to-r from-amber-500 to-orange-500 
              hover:from-amber-600 hover:to-orange-600
              text-white font-semibold
              focus:ring-2 focus:ring-offset-2 focus:ring-amber-500
            `}
            aria-label="Upgrade subscription plan"
          >
            <svg
              className="h-4 w-4 mr-1.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
            Upgrade Plan
          </Button>
        )}
        
        {isAdmin && planTier !== 'free' && (
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={() => handleNavigate('manage')}
            className={`
              btn-hover-scale touch-target
              transition-all duration-200 
              focus:ring-2 focus:ring-offset-2 focus:ring-${theme.accentColor}
            `}
            aria-label="Manage subscription"
          >
            Manage Plan
          </Button>
        )}
        
        {!isAdmin && planTier === 'free' && (
          <Button
            variant="outline"
            size="sm"
            fullWidth
            disabled
            title="Only admins can upgrade"
            className="touch-target"
            aria-label="Contact admin to upgrade (only admins can upgrade)"
          >
            Contact Admin
          </Button>
        )}
      </div>
    </Card>
  );
};

export default SchoolSubscriptionWidget;
