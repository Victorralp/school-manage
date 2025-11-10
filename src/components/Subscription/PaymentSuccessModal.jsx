import Modal from '../Modal';
import Button from '../Button';
import { formatCurrency } from '../../utils/paystackConfig';

const PaymentSuccessModal = ({
  isOpen,
  onClose,
  transactionDetails
}) => {
  const {
    reference,
    planName,
    planTier,
    amount,
    currency,
    subjectLimit,
    studentLimit,
    timestamp
  } = transactionDetails || {};

  // Format date
  const formattedDate = timestamp 
    ? new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Payment Successful!"
      size="md"
      closeOnOverlayClick={true}
    >
      <div className="space-y-6">
        {/* Success Icon with Animation */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75"></div>
            <div className="relative bg-green-100 rounded-full p-6">
              <svg 
                className="h-16 w-16 text-green-600" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Welcome to {planName}!
          </h3>
          <p className="text-gray-600">
            Your subscription has been activated successfully.
          </p>
        </div>

        {/* Transaction Details */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-gray-900 mb-3">Transaction Details</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction ID:</span>
              <span className="font-mono text-gray-900 text-xs">{reference}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="text-gray-900">{formattedDate}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Plan:</span>
              <span className="font-semibold text-gray-900">{planName}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Amount Paid:</span>
              <span className="font-bold text-green-600">
                {formatCurrency(amount, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* New Plan Limits */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Your New Limits</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{subjectLimit}</div>
              <div className="text-sm text-gray-600 mt-1">Subjects</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{studentLimit}</div>
              <div className="text-sm text-gray-600 mt-1">Students</div>
            </div>
          </div>
        </div>

        {/* Receipt Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg 
              className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                clipRule="evenodd" 
              />
            </svg>
            <div className="ml-3">
              <h5 className="text-sm font-medium text-yellow-800">Receipt Sent</h5>
              <p className="text-sm text-yellow-700 mt-1">
                A confirmation email with your receipt has been sent to your registered email address.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            fullWidth
            onClick={() => {
              // Copy transaction ID to clipboard
              if (reference) {
                navigator.clipboard.writeText(reference);
                // You could add a toast notification here
              }
            }}
          >
            Copy Transaction ID
          </Button>
          
          <Button
            variant="primary"
            fullWidth
            onClick={onClose}
          >
            Continue
          </Button>
        </div>

        {/* Support Notice */}
        <p className="text-xs text-gray-500 text-center">
          If you have any questions about your subscription, please contact our support team.
        </p>
      </div>
    </Modal>
  );
};

export default PaymentSuccessModal;
