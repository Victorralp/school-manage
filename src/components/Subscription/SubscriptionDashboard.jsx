import { useSubscription } from '../../context/SubscriptionContext';
import Card from '../Card';
import Button from '../Button';
import SkeletonLoader from './SkeletonLoader';

const SubscriptionDashboard = ({ onUpgradeClick }) => {
  const {
    subscription,
    loading,
    error,
    currentPlan,
    subjectUsage,
    studentUsage,
  } = useSubscription();

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

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-red-600';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-600';
  };

  const getProgressBarColor = (percentage) => {
    if (percentage >= 100) return 'bg-red-100';
    if (percentage >= 80) return 'bg-yellow-100';
    return 'bg-green-100';
  };

  const isPaidPlan = subscription.planTier !== 'free';
  const showUpgradeButton = subscription.planTier === 'free' || 
                            (subscription.planTier === 'premium' && subjectUsage.percentage >= 80) ||
                            (subscription.planTier === 'premium' && studentUsage.percentage >= 80);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Current Plan Card */}
      <Card
        title="Current Plan"
        subtitle={`You are on the ${currentPlan.name}`}
      >
        <div className="space-y-3 sm:space-y-4">
          {/* Plan Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Plan Tier</p>
              <p className="text-base sm:text-lg font-semibold text-gray-900 capitalize">
                {subscription.planTier}
              </p>
            </div>
            
            {isPaidPlan && subscription.expiryDate && (
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Expires On</p>
                <p className="text-base sm:text-lg font-semibold text-gray-900">
                  {formatDate(subscription.expiryDate)}
                </p>
              </div>
            )}
            
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Status</p>
              <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${
                subscription.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : subscription.status === 'grace_period'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {subscription.status === 'active' ? 'Active' : 
                 subscription.status === 'grace_period' ? 'Grace Period' : 
                 'Expired'}
              </span>
            </div>
          </div>

          {/* Upgrade Button */}
          {showUpgradeButton && onUpgradeClick && (
            <div className="pt-4 border-t border-gray-200">
              <Button
                variant="primary"
                onClick={onUpgradeClick}
                fullWidth
              >
                {subscription.planTier === 'free' ? 'Upgrade Plan' : 'Upgrade to VIP'}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Usage Card */}
      <Card title="Usage Statistics">
        <div className="space-y-4 sm:space-y-6">
          {/* Subject Usage */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs sm:text-sm font-medium text-gray-700">Subjects</span>
              <span className="text-xs sm:text-sm text-gray-600">
                {subjectUsage.current} / {subjectUsage.limit}
              </span>
            </div>
            <div className={`w-full ${getProgressBarColor(subjectUsage.percentage)} rounded-full h-2 sm:h-3 overflow-hidden`}>
              <div
                className={`h-full ${getProgressColor(subjectUsage.percentage)} transition-all duration-300 rounded-full`}
                style={{ width: `${Math.min(subjectUsage.percentage, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {subjectUsage.percentage}% used
            </p>
          </div>

          {/* Student Usage */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs sm:text-sm font-medium text-gray-700">Students</span>
              <span className="text-xs sm:text-sm text-gray-600">
                {studentUsage.current} / {studentUsage.limit}
              </span>
            </div>
            <div className={`w-full ${getProgressBarColor(studentUsage.percentage)} rounded-full h-2 sm:h-3 overflow-hidden`}>
              <div
                className={`h-full ${getProgressColor(studentUsage.percentage)} transition-all duration-300 rounded-full`}
                style={{ width: `${Math.min(studentUsage.percentage, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {studentUsage.percentage}% used
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SubscriptionDashboard;
