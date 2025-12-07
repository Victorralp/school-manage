import { useState, useEffect } from 'react';
import { useMonnifyPayment } from 'react-monnify';
import Modal from '../Modal';
import Button from '../Button';
import {
  validateMonnifyConfig,
  formatCurrency,
  generateTransactionReference,
  getMonnifyApiKey,
  getMonnifyContractCode,
  isMonnifyTestMode
} from '../../utils/monnifyConfig';
import { useAuth } from '../../context/AuthContext';

const PaymentModal = ({
  isOpen,
  onClose,
  // Support both individual props and planDetails object
  planDetails,
  planTier: propPlanTier,
  planName: propPlanName,
  amount: propAmount,
  currency: propCurrency = 'NGN',
  features: propFeatures = [],
  subjectLimit: propSubjectLimit,
  studentLimit: propStudentLimit,
  onSuccess,
  onError
}) => {
  const { user } = useAuth();

  // Extract values from planDetails if provided, otherwise use individual props
  const planTier = planDetails?.planTier ?? propPlanTier;
  const planName = planDetails?.planName ?? propPlanName ?? 'Subscription';
  const amount = planDetails?.amount ?? propAmount ?? 0;
  const currency = planDetails?.currency ?? propCurrency ?? 'NGN';
  const features = planDetails?.features ?? propFeatures ?? [];
  const subjectLimit = planDetails?.subjectLimit ?? propSubjectLimit ?? 0;
  const studentLimit = planDetails?.studentLimit ?? propStudentLimit ?? 0;

  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [configValid, setConfigValid] = useState(false);

  // Validate Monnify configuration on mount
  useEffect(() => {
    try {
      validateMonnifyConfig();
      setConfigValid(true);
      setError(null);
    } catch (err) {
      setConfigValid(false);
      setError(err.message);
    }
  }, []);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedCurrency(currency);
      setIsProcessing(false);
      setError(null);
    }
  }, [isOpen, currency]);

  // Safe amount for display
  const safeAmount = amount || 0;

  // Monnify configuration
  const monnifyConfig = {
    amount: safeAmount, // Monnify uses main currency unit (not kobo)
    currency: selectedCurrency,
    reference: generateTransactionReference(user?.uid, planTier),
    customerFullName: user?.displayName || 'Customer',
    customerEmail: user?.email || '',
    apiKey: getMonnifyApiKey(),
    contractCode: getMonnifyContractCode(),
    paymentDescription: `${planName} Subscription`,
    isTestMode: isMonnifyTestMode(),
    metadata: {
      plan_tier: planTier,
      teacher_id: user?.uid || '',
      plan_name: planName
    }
  };

  // Handle successful payment
  const handlePaymentComplete = (response) => {
    setIsProcessing(true);

    // Call the onSuccess callback with payment details
    if (onSuccess) {
      onSuccess({
        reference: response.paymentReference,
        transactionReference: response.transactionReference,
        status: response.paymentStatus,
        message: response.paymentDescription,
        amountPaid: response.amountPaid,
        planTier,
        amount: parseFloat(response.amountPaid) || safeAmount,
        currency: selectedCurrency,
        monnifyResponse: response
      });
    }

    setIsProcessing(false);
  };

  // Handle payment closure (user closed popup)
  const handlePaymentClose = (data) => {
    setIsProcessing(false);
    // Check if user cancelled
    if (data?.paymentStatus === 'USER_CANCELLED') {
      console.log('User cancelled the payment');
    }
  };

  // Initialize Monnify payment hook
  const initializePayment = useMonnifyPayment(monnifyConfig);

  // Handle pay button click
  const handlePayClick = () => {
    if (!user?.email) {
      setError('Please ensure you are logged in with a valid email address.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      initializePayment(handlePaymentComplete, handlePaymentClose);
    } catch (err) {
      setIsProcessing(false);
      const errorMessage = err?.message || 'Payment initialization failed. Please try again.';
      setError(errorMessage);

      if (onError) {
        onError(err);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Upgrade to ${planName}`}
      size="md"
      closeOnOverlayClick={!isProcessing}
      className="sm:max-w-md"
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-red-400 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Payment Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Plan Details */}
        <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
          <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{planName}</h4>
          <div className="space-y-2 text-xs sm:text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Subject Limit:</span>
              <span className="font-semibold">{subjectLimit} subjects</span>
            </div>
            <div className="flex justify-between">
              <span>Student Limit:</span>
              <span className="font-semibold">{studentLimit} students</span>
            </div>
            <div className="flex justify-between">
              <span>Billing Cycle:</span>
              <span className="font-semibold">Monthly</span>
            </div>
          </div>
        </div>

        {/* Features List */}
        {features && features.length > 0 && (
          <div>
            <h5 className="text-sm font-semibold text-gray-900 mb-2">Features Included:</h5>
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start text-sm text-gray-700">
                  <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Currency Selector */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Select Currency
          </label>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setSelectedCurrency('NGN')}
              disabled={isProcessing}
              className={`p-2 sm:p-3 border-2 rounded-lg text-center transition-all ${selectedCurrency === 'NGN'
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="text-xs sm:text-sm font-semibold">Nigerian Naira</div>
              <div className="text-base sm:text-lg font-bold mt-1">₦{safeAmount.toLocaleString()}</div>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCurrency('USD')}
              disabled={isProcessing}
              className={`p-2 sm:p-3 border-2 rounded-lg text-center transition-all ${selectedCurrency === 'USD'
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="text-xs sm:text-sm font-semibold">US Dollar</div>
              <div className="text-base sm:text-lg font-bold mt-1">${safeAmount.toLocaleString()}</div>
            </button>
          </div>
        </div>

        {/* Payment Amount */}
        <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Total Amount:</span>
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(safeAmount, selectedCurrency)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            fullWidth
            onClick={onClose}
            disabled={isProcessing}
            size="md"
          >
            Cancel
          </Button>

          {configValid ? (
            <Button
              variant="primary"
              fullWidth
              onClick={handlePayClick}
              disabled={isProcessing || !user?.email}
              size="md"
              className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
            >
              {isProcessing ? 'Processing...' : `Pay ${formatCurrency(safeAmount, selectedCurrency)}`}
            </Button>
          ) : (
            <Button
              variant="primary"
              fullWidth
              disabled
              size="md"
            >
              Payment Unavailable
            </Button>
          )}
        </div>

        {/* User Info Notice */}
        {!user?.email && (
          <p className="text-sm text-red-600 text-center">
            Please ensure you are logged in with a valid email address.
          </p>
        )}

        {/* Processing Notice */}
        {isProcessing && (
          <div className="text-center text-sm text-gray-600">
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing payment...
            </div>
          </div>
        )}

        {/* Security Notice */}
        <p className="text-xs text-gray-500 text-center">
          Payments are securely processed by Monnify (Moniepoint). Your payment information is encrypted and secure.
        </p>
      </div>
    </Modal>
  );
};

export default PaymentModal;
