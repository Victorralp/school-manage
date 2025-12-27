import { useSchoolSubscription } from '../../context/SchoolSubscriptionContext';
import { useSubscription } from '../../context/SubscriptionContext';
import Card from '../Card';
import Button from '../Button';
import SkeletonLoader from './SkeletonLoader';

// Import enhanced components
import CircularProgress from './CircularProgress';
import StatusBadge from './StatusBadge';
import ExpiryDisplay from './ExpiryDisplay';
import { getPlanTheme } from './subscriptionThemes';

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
 * Book Icon - Used for subjects
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
 * Users Icon - Used for students
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

const SubscriptionDashboard = ({ onUpgradeClick, useSchoolContext = true }) => {
  // Use school subscription context
  const schoolContext = useSchoolSubscription();
  // Use individual subscription context  
  const individualContext = useSubscription();
  
  // Determine which context to use - prefer school subscription if available and enabled
  const isSchoolBased = useSchoolContext && schoolContext?.school != null;
  
  const {
    loading,
    error,
    currentPlan,
    subjectUsage,
    studentUsage,
  } = isSchoolBased ? schoolContext : (individualContext || {});
  
  // Use school or individual subscription data
  const subscription = isSchoolBased ? schoolContext?.school : individualContext?.subscription;

  if (loading) {
    return <SkeletonLoader type="dashboard" />;
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Subscription</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (!subscription || !currentPlan) {
    return (
      <Card>
        <p className="text-gray-600">No subscription found. Please contact support.</p>
      </Card>
    );
  }

  // Get theme configuration based on plan tier
  const planTier = subscription.planTier || 'free';
  const theme = getPlanTheme(planTier);
  const TierIcon = getTierIcon(theme.icon);

  // Ensure usage data has default values
  const safeSubjectUsage = subjectUsage || { current: 0, limit: 0, percentage: 0 };
  const safeStudentUsage = studentUsage || { current: 0, limit: 0, percentage: 0 };

  const isPaidPlan = subscription.planTier !== 'free';
  const showUpgradeButton = subscription.planTier === 'free' || 
                            (subscription.planTier === 'premium' && safeSubjectUsage.percentage >= 80) ||
                            (subscription.planTier === 'premium' && safeStudentUsage.percentage >= 80);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Enhanced Current Plan Card */}
      <Card
        className={`card-transition bg-gradient-to-br ${theme.gradient} border-2 ${theme.borderColor}`}
        role="region"
        aria-label="Current subscription plan"
      >
        <div className="space-y-4">
          {/* Plan Header with Theme */}
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              {/* Tier Icon with themed background */}
              <div className={`${theme.iconBg} p-3 rounded-xl shadow-sm`}>
                <TierIcon className={`h-7 w-7 text-${theme.accentColor}`} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Current Plan
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {/* Plan tier badge with theme colors */}
                  <span 
                    className={`px-3 py-1 text-sm font-semibold rounded-full ${theme.badgeColor} shadow-sm`}
                    aria-label={`${planTier} plan`}
                  >
                    {planTier.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Status Badge */}
            <StatusBadge status={subscription.status || 'active'} />
          </div>

          {/* Expiry Display for paid plans */}
          {isPaidPlan && subscription.expiryDate && (
            <div className="flex justify-start">
              <ExpiryDisplay 
                expiryDate={subscription.expiryDate} 
                showFullDate={true}
              />
            </div>
          )}

          {/* Upgrade Button */}
          {showUpgradeButton && onUpgradeClick && (
            <div className="pt-4 border-t border-gray-200 border-opacity-50">
              <Button
                variant="primary"
                onClick={onUpgradeClick}
                fullWidth
                className={`
                  btn-hover-scale touch-target
                  ${subscription.planTier === 'free' 
                    ? 'btn-upgrade-glow bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600' 
                    : ''
                  }
                `}
                aria-label={subscription.planTier === 'free' ? 'Upgrade subscription plan' : 'Upgrade to VIP plan'}
              >
                <svg
                  className="h-4 w-4 mr-2"
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
                {subscription.planTier === 'free' ? 'Upgrade Plan' : 'Upgrade to VIP'}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Enhanced Usage Card with Circular Progress */}
      <Card 
        title="Usage Statistics"
        className="card-transition"
        role="region"
        aria-label="Usage statistics"
      >
        <div 
          className="grid grid-cols-2 gap-6 sm:gap-8 justify-items-center py-4 subscription-usage-grid"
          role="group"
          aria-label="Resource usage indicators"
        >
          {/* Subjects CircularProgress */}
          <CircularProgress
            current={safeSubjectUsage.current}
            limit={safeSubjectUsage.limit}
            label="Subjects"
            icon={<BookIcon className="w-full h-full" />}
            size="lg"
          />
          
          {/* Students CircularProgress */}
          <CircularProgress
            current={safeStudentUsage.current}
            limit={safeStudentUsage.limit}
            label="Students"
            icon={<UsersIcon className="w-full h-full" />}
            size="lg"
          />
        </div>
        
        {/* Usage Summary Text */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Subjects Used</p>
              <p className="text-sm font-semibold text-gray-700">
                {safeSubjectUsage.percentage}% of limit
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Students Used</p>
              <p className="text-sm font-semibold text-gray-700">
                {safeStudentUsage.percentage}% of limit
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SubscriptionDashboard;
