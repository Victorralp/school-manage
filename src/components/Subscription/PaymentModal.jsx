import { useState, useEffect } from 'react';
import { PaystackButton } from 'react-paystack';
import Modal from '../Modal';
import Button from '../Button';
import { 
  validatePaystackConfig, 
  convertToKobo, 
  formatCurrency,
  generateTransactionReference,
  getPaystackPublicKey
} from '../../utils/paystackConfig';
import { useAuth } from '../../context/AuthContext';

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  planTier, 
  planName,
  amount,
  currency = 'NGN',
  features = [],
  subjectLimit,
  studentLimit,
  onSuccess,
  onError
}) => {
  const { user } = useAuth();
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [configValid, setConfigValid] = useState(false);

  // Validate Paystack configuration on mount
  useEffect(() => {
    try {
      validatePaystackConfig();
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

  // Get plan details based on selected currency
  const getPlanDetails = () => {
    // In a real implementation, you'd fetch different prices for different currencies
    // For now, we'll use the provided amount
    return {
      amount: amount,
      currency: selectedCurrency,
      amountInKobo: convertToKobo(amount, selectedCurrency)
    };
  };

  const planDetails = getPlanDetails();

  // Paystack configuration
  const paystackConfig = {
    reference: generateTransactionReference(user?.uid || 'unknown', planTier),
    email: user?.email || '',
    amount: planDetails.amountInKobo,
    currency: selectedCurrency,
    publicKey: getPaystackPublicKey(),
    metadata: {
      custom_fields: [
        {
          display_name: 'Plan Tier',
          variable_name: 'plan_tier',
          value: planTier
        },
        {
          display_name: 'Teacher ID',
          variable_name: 'teacher_id',
          value: user?.uid || ''
        },
        {
          display_name: 'Plan Name',
          variable_name: 'plan_name',
          value: planName
        }
      ]
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = (reference) => {
    setIsProcessing(true);
    
    // Call the onSuccess callback with payment details
    if (onSuccess) {
      onSuccess({
        reference: reference.reference,
        status: reference.status,
        message: reference.message,
        transaction: reference.transaction,
        planTier,
        amount: planDetails.amount,
        currency: selectedCurrency
      });
    }
    
    setIsProcessing(false);
  };

  // Handle payment closure (user closed popup)
  const handlePaymentClose = () => {
    setIsProcessing(false);
    // Don't close the modal automatically, let user decide
  };

  // Handle payment error
  const handlePaymentError = (error) => {
    setIsProcessing(false);
    const errorMessage = error?.message || 'Payment failed. Please try again.';
    setError(errorMessage);
    
    if (onError) {
      onError(error);
    }
  };

  // Paystack component props
  const componentProps = {
    ...paystackConfig,
    text: `Pay ${formatCurrency(planDetails.amount, selectedCurrency)}`,
    onSuccess: handlePaymentSuccess,
    onClose: handlePaymentClose,
    onError: handlePaymentError
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
              className={`p-2 sm:p-3 border-2 rounded-lg text-center transition-all ${
                selectedCurrency === 'NGN'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="text-xs sm:text-sm font-semibold">Nigerian Naira</div>
              <div className="text-base sm:text-lg font-bold mt-1">₦{amount.toLocaleString()}</div>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCurrency('USD')}
              disabled={isProcessing}
              className={`p-2 sm:p-3 border-2 rounded-lg text-center transition-all ${
                selectedCurrency === 'USD'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="text-xs sm:text-sm font-semibold">US Dollar</div>
              <div className="text-base sm:text-lg font-bold mt-1">${amount.toLocaleString()}</div>
            </button>
          </div>
        </div>

        {/* Payment Amount */}
        <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Total Amount:</span>
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(planDetails.amount, selectedCurrency)}
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
            <div className="flex-1">
              <PaystackButton 
                {...componentProps}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={isProcessing || !user?.email}
              />
            </div>
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
          Payments are securely processed by Paystack. Your payment information is encrypted and secure.
        </p>
      </div>
    </Modal>
  );
};

export default PaymentModal;
