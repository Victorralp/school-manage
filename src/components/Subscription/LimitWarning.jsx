import { useState, useEffect } from 'react';
import { useSubscription } from '../../context/SubscriptionContext';
import Alert from '../Alert';
import Modal from '../Modal';
import Button from '../Button';

// Fix for Alert component - need to wrap children properly
const AlertWithChildren = ({ children, ...props }) => {
  return (
    <Alert {...props}>
      {children}
    </Alert>
  );
};

const LimitWarning = ({ onUpgradeClick }) => {
  const { subjectUsage, studentUsage, subscription } = useSubscription();
  const [dismissedWarnings, setDismissedWarnings] = useState({});
  const [showBlockingModal, setShowBlockingModal] = useState(false);
  const [blockingType, setBlockingType] = useState(null);

  // Load dismissed warnings from session storage
  useEffect(() => {
    const stored = sessionStorage.getItem('dismissedLimitWarnings');
    if (stored) {
      try {
        setDismissedWarnings(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing dismissed warnings:', e);
      }
    }
  }, []);

  // Save dismissed warnings to session storage
  const dismissWarning = (type) => {
    const newDismissed = { ...dismissedWarnings, [type]: true };
    setDismissedWarnings(newDismissed);
    sessionStorage.setItem('dismissedLimitWarnings', JSON.stringify(newDismissed));
  };

  // Check if we should show warning banner (80% threshold)
  const shouldShowSubjectWarning = 
    subjectUsage.percentage >= 80 && 
    subjectUsage.percentage < 100 && 
    !dismissedWarnings.subject;

  const shouldShowStudentWarning = 
    studentUsage.percentage >= 80 && 
    studentUsage.percentage < 100 && 
    !dismissedWarnings.student;

  // Function to show blocking modal (100% limit reached)
  const showLimitReachedModal = (type) => {
    setBlockingType(type);
    setShowBlockingModal(true);
  };

  // Export function to be called from parent components
  useEffect(() => {
    // Attach to window for external access
    window.showLimitReachedModal = showLimitReachedModal;
    return () => {
      delete window.showLimitReachedModal;
    };
  }, []);

  const handleUpgrade = () => {
    setShowBlockingModal(false);
    if (onUpgradeClick) {
      onUpgradeClick();
    }
  };

  const getWarningMessage = (type, usage) => {
    const remaining = usage.limit - usage.current;
    return `You've used ${usage.percentage}% of your ${type} limit. Only ${remaining} ${type}${remaining !== 1 ? 's' : ''} remaining.`;
  };

  const getBlockingMessage = (type) => {
    return `You've reached your ${type} limit of ${type === 'subject' ? subjectUsage.limit : studentUsage.limit}. Upgrade your plan to add more ${type}s.`;
  };

  return (
    <>
      {/* Warning Banners */}
      <div className="space-y-4">
        {shouldShowSubjectWarning && (
          <div className="mb-4">
            <Alert
              type="warning"
              title="Subject Limit Warning"
              message={getWarningMessage('subject', subjectUsage)}
              onClose={() => dismissWarning('subject')}
            />
            <div className="mt-3">
              <Button
                variant="warning"
                size="sm"
                onClick={handleUpgrade}
              >
                Upgrade Now
              </Button>
            </div>
          </div>
        )}

        {shouldShowStudentWarning && (
          <div className="mb-4">
            <Alert
              type="warning"
              title="Student Limit Warning"
              message={getWarningMessage('student', studentUsage)}
              onClose={() => dismissWarning('student')}
            />
            <div className="mt-3">
              <Button
                variant="warning"
                size="sm"
                onClick={handleUpgrade}
              >
                Upgrade Now
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Blocking Modal for 100% Limit */}
      <Modal
        isOpen={showBlockingModal}
        onClose={() => setShowBlockingModal(false)}
        title="Limit Reached"
        size="md"
        closeOnOverlayClick={false}
      >
        <div className="space-y-4">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-red-100 p-3">
              <svg
                className="h-12 w-12 text-red-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
          </div>

          {/* Message */}
          <div className="text-center">
            <p className="text-gray-700 mb-4">
              {blockingType && getBlockingMessage(blockingType)}
            </p>
            
            {subscription && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">Current Plan:</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {subscription.planTier} Plan
                </p>
                <div className="mt-3 text-sm text-gray-600">
                  <p>Subjects: {subjectUsage.current} / {subjectUsage.limit}</p>
                  <p>Students: {studentUsage.current} / {studentUsage.limit}</p>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-600">
              Upgrade to a higher plan to continue adding {blockingType}s and unlock more features.
            </p>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            fullWidth
            onClick={() => setShowBlockingModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleUpgrade}
          >
            Upgrade Now
          </Button>
        </div>
      </Modal>
    </>
  );
};

// Export helper function to trigger blocking modal from anywhere
export const triggerLimitReachedModal = (type) => {
  if (window.showLimitReachedModal) {
    window.showLimitReachedModal(type);
  }
};

export default LimitWarning;
