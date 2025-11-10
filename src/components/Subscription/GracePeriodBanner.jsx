import { useSubscription } from "../../context/SubscriptionContext";

const GracePeriodBanner = () => {
  const { subscription, isInGracePeriod, exceedsLimits } = useSubscription();

  if (!subscription) return null;

  const limits = exceedsLimits();
  const hasExceededLimits = limits.subjects || limits.students;

  // Grace period warning
  if (isInGracePeriod()) {
    const gracePeriodEnd = subscription.gracePeriodEnd?.toDate();
    const daysRemaining = gracePeriodEnd
      ? Math.ceil((gracePeriodEnd - new Date()) / (1000 * 60 * 60 * 24))
      : 0;

    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Payment Failed - Grace Period Active
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                Your subscription renewal failed. You have {daysRemaining} day
                {daysRemaining !== 1 ? "s" : ""} remaining in your grace period
                to update your payment method. After that, your account will be
                downgraded to the Free plan.
              </p>
            </div>
            <div className="mt-4">
              <button
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                onClick={() => {
                  // Navigate to payment/subscription settings
                  window.location.href = "/subscription";
                }}
              >
                Update Payment Method
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Exceeded limits warning (after downgrade)
  if (hasExceededLimits) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Usage Exceeds Free Plan Limits
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Your account has been downgraded to the Free plan. You currently
                have:
              </p>
              <ul className="list-disc list-inside mt-2">
                {limits.subjects && (
                  <li>
                    {subscription.currentSubjects} subjects (limit:{" "}
                    {subscription.subjectLimit})
                  </li>
                )}
                {limits.students && (
                  <li>
                    {subscription.currentStudents} students (limit:{" "}
                    {subscription.studentLimit})
                  </li>
                )}
              </ul>
              <p className="mt-2">
                Your existing data has been retained, but you cannot register
                new subjects or students until you remove some or upgrade your
                plan.
              </p>
            </div>
            <div className="mt-4">
              <button
                className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700"
                onClick={() => {
                  window.location.href = "/subscription";
                }}
              >
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default GracePeriodBanner;
