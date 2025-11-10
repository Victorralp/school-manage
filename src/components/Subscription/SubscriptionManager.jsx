import { useState } from 'react';
import { useSubscription } from '../../context/SubscriptionContext';
import { useAuth } from '../../context/AuthContext';
import PaymentModal from './PaymentModal';
import PaymentSuccessModal from './PaymentSuccessModal';
import Button from '../Button';

const SubscriptionManager = () => {
  const { user } = useAuth();
  const {
    subscription,
    currentPlan,
    availablePlans,
    loading,
    upgradePlan,
    handlePaymentSuccess
  } = useSubscription();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState(null);

  // Handle plan selection and open payment modal
  const handleSelectPlan = async (planTier) => {
    try {
      setError(null);
      
      // Get plan details from upgradePlan
      const planDetails = await upgradePlan(planTier, 'NGN');
      
      setSelectedPlan(planDetails);
      setIsPaymentModalOpen(true);
    } catch (err) {
      setError(err.message);
      console.error('Error selecting plan:', err);
    }
  };

  // Handle successful payment from Paystack
  const handlePaymentComplete = async (paymentData) => {
    try {
      setProcessingPayment(true);
      setError(null);
      
      // Process payment with backend
      const result = await handlePaymentSuccess({
        reference: paymentData.reference,
        planTier: paymentData.planTier,
        planName: selectedPlan?.planName,
        amount: paymentData.amount,
        currency: paymentData.currency,
        subjectLimit: selectedPlan?.subjectLimit,
        studentLimit: selectedPlan?.studentLimit,
        userEmail: user?.email,
        userName: user?.displayName || user?.email,
        verifyWithPaystack: true
      });

      if (result.success) {
        // Close payment modal
        setIsPaymentModalOpen(false);
        
        // Set transaction details for success modal
        setTransactionDetails({
          reference: paymentData.reference,
          planName: selectedPlan?.planName,
          planTier: paymentData.planTier,
          amount: paymentData.amount,
          currency: paymentData.currency,
          subjectLimit: selectedPlan?.subjectLimit,
          studentLimit: selectedPlan?.studentLimit,
          timestamp: new Date().toISOString()
        });
        
        // Show success modal
        setIsSuccessModalOpen(true);
      } else {
        throw new Error(result.error || 'Payment processing failed');
      }
    } catch (err) {
      setError(err.message);
      console.error('Payment processing error:', err);
    } finally {
      setProcessingPayment(false);
    }
  };

  // Handle payment error
  const handlePaymentError = (error) => {
    setError(error?.message || 'Payment failed. Please try again.');
    console.error('Payment error:', error);
  };

  // Close success modal and reset state
  const handleSuccessModalClose = () => {
    setIsSuccessModalOpen(false);
    setSelectedPlan(null);
    setPaymentDetails(null);
    setTransactionDetails(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-red-400 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Current Plan Display */}
      {subscription && currentPlan && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-600">{currentPlan.name}</p>
              <p className="text-sm text-gray-600 mt-1">
                {subscription.planTier === 'free' ? 'Free Forever' : 'Monthly Subscription'}
              </p>
            </div>
            {subscription.planTier !== 'free' && subscription.expiryDate && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Expires on</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(subscription.expiryDate.seconds * 1000).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Available Plans */}
      {availablePlans && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(availablePlans).map(([tier, plan]) => {
              const isCurrentPlan = subscription?.planTier === tier;
              const subjectLimit = typeof plan.subjectLimit === 'object' 
                ? plan.subjectLimit.max 
                : plan.subjectLimit;
              const studentLimit = typeof plan.studentLimit === 'object'
                ? plan.studentLimit.max
                : plan.studentLimit;

              return (
                <div
                  key={tier}
                  className={`bg-white rounded-lg shadow-md p-6 ${
                    isCurrentPlan ? 'ring-2 ring-blue-600' : ''
                  }`}
                >
                  {isCurrentPlan && (
                    <div className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-3">
                      Current Plan
                    </div>
                  )}
                  
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h4>
                  
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">
                      ₦{plan.price.NGN.toLocaleString()}
                    </span>
                    <span className="text-gray-600 ml-2">
                      {tier === 'free' ? '' : '/ month'}
                    </span>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-sm text-gray-700">
                      <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {subjectLimit} Subjects
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {studentLimit} Students
                    </div>
                  </div>

                  {plan.features && (
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start text-sm text-gray-600">
                          <svg className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}

                  <Button
                    variant={isCurrentPlan ? 'outline' : 'primary'}
                    fullWidth
                    disabled={isCurrentPlan || tier === 'free'}
                    onClick={() => handleSelectPlan(tier)}
                  >
                    {isCurrentPlan ? 'Current Plan' : tier === 'free' ? 'Free Plan' : 'Upgrade'}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            if (!processingPayment) {
              setIsPaymentModalOpen(false);
              setSelectedPlan(null);
            }
          }}
          planTier={selectedPlan.planTier}
          planName={selectedPlan.planName}
          amount={selectedPlan.amount}
          currency={selectedPlan.currency}
          features={selectedPlan.features}
          subjectLimit={selectedPlan.subjectLimit}
          studentLimit={selectedPlan.studentLimit}
          onSuccess={handlePaymentComplete}
          onError={handlePaymentError}
        />
      )}

      {/* Success Modal */}
      {transactionDetails && (
        <PaymentSuccessModal
          isOpen={isSuccessModalOpen}
          onClose={handleSuccessModalClose}
          transactionDetails={transactionDetails}
        />
      )}
    </div>
  );
};

export default SubscriptionManager;
