import { useSchoolSubscription } from '../../context/SchoolSubscriptionContext';
import Button from '../Button';
import SkeletonLoader from './SkeletonLoader';

const PlanComparison = ({ onSelectPlan }) => {
  const { availablePlans, school, loading, error } = useSchoolSubscription();
  
  // Use school as subscription for compatibility
  const subscription = school;

  if (loading || !availablePlans) {
    return <SkeletonLoader type="planComparison" />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Plans</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  const currentPlanTier = subscription?.planTier || 'free';

  const formatLimit = (limit, isSubject = false) => {
    if (typeof limit === 'object' && limit.min && limit.max) {
      return `${limit.min}-${limit.max}`;
    }
    // Handle "unlimited" string
    if (limit === "unlimited" || limit === "Unlimited") {
      return 'Unlimited';
    }
    return limit;
  };

  const planOrder = ['free', 'premium', 'vip', 'master', 'enterprise'];
  const planCards = planOrder.map((planKey) => {
    const plan = availablePlans[planKey];
    if (!plan) return null;

    const isCurrentPlan = currentPlanTier === planKey;
    const isPremium = planKey === 'premium';
    const isVip = planKey === 'vip';
    const isMaster = planKey === 'master';
    const isEnterprise = planKey === 'enterprise';

    return (
      <div
        key={planKey}
        className={`relative rounded-lg border-2 ${
          isCurrentPlan
            ? 'border-blue-600 shadow-lg'
            : 'border-gray-200 hover:border-gray-300'
        } bg-white overflow-hidden transition-all duration-200 flex flex-col`}
      >
        {/* Popular Badge for Premium */}
        {isPremium && (
          <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-semibold px-2 sm:px-3 py-1 rounded-bl-lg z-10">
            Popular
          </div>
        )}

        {/* Best Value Badge for Master */}
        {isMaster && (
          <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-semibold px-2 sm:px-3 py-1 rounded-bl-lg z-10">
            Best Value
          </div>
        )}

        {/* Enterprise Badge */}
        {isEnterprise && (
          <div className="absolute top-0 right-0 bg-gray-800 text-white text-xs font-semibold px-2 sm:px-3 py-1 rounded-bl-lg z-10">
            Custom
          </div>
        )}

        {/* Current Plan Badge */}
        {isCurrentPlan && (
          <div className="bg-blue-600 text-white text-center py-2 text-xs sm:text-sm font-semibold">
            Current Plan
          </div>
        )}

        <div className="p-6 sm:p-8 flex-1 flex flex-col">
          {/* Plan Name */}
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            {plan.name}
          </h3>

          {/* Price */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-baseline">
              {plan.contactSales ? (
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                  Contact Sales
                </span>
              ) : (
                <>
                  <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                    ₦{plan.price.NGN.toLocaleString()}
                  </span>
                  {planKey !== 'free' && (
                    <span className="ml-2 text-gray-600 text-sm">/month</span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Limits */}
          <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mr-3 flex-shrink-0"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7"></path>
              </svg>
              <span className="text-base sm:text-lg text-gray-700">
                <span className="font-semibold">{formatLimit(plan.subjectLimit, true)}</span> subjects
              </span>
            </div>
            <div className="flex items-center">
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mr-3 flex-shrink-0"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7"></path>
              </svg>
              <span className="text-base sm:text-lg text-gray-700">
                <span className="font-semibold">{formatLimit(plan.studentLimit)}</span> applicants
              </span>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-6 sm:mb-8 flex-1">
            <p className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">Features:</p>
            {plan.features.map((feature, index) => (
              <div key={index} className="flex items-start">
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 mr-3 flex-shrink-0 mt-0.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="text-sm sm:text-base text-gray-600">{feature}</span>
              </div>
            ))}
          </div>

          {/* Action Button */}
          <div className="mt-auto pt-4">
            {isCurrentPlan ? (
              <Button
                variant="outline"
                fullWidth
                disabled
              >
                Current Plan
              </Button>
            ) : plan.contactSales ? (
              <Button
                variant="outline"
                fullWidth
                onClick={() => window.open('mailto:sales@yourcompany.com?subject=Enterprise Plan Inquiry', '_blank')}
              >
                Contact Sales
              </Button>
            ) : (
              <Button
                variant={isPremium || isVip || isMaster ? 'primary' : 'outline'}
                fullWidth
                onClick={() => onSelectPlan && onSelectPlan(planKey)}
              >
                {planKey === 'free' ? 'Downgrade' : 'Select Plan'}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  });

  return (
    <div className="px-2 sm:px-0">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Choose Your Plan
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Select the plan that best fits your needs
        </p>
      </div>

      {/* Plan Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {planCards}
      </div>

      {/* Additional Info */}
      <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-600">
        <p>All plans include basic features. Upgrade anytime to unlock more capabilities.</p>
      </div>
    </div>
  );
};

export default PlanComparison;
