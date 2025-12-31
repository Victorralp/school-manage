import Modal from '../Modal';
import Button from '../Button';

const ReceiptModal = ({ isOpen, onClose, transaction }) => {
  if (!transaction) return null;

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount, currency = 'NGN') => {
    if (amount === null || amount === undefined) return 'N/A';
    const symbol = currency === 'USD' ? '$' : '₦';
    return `${symbol}${Number(amount).toLocaleString()}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment Receipt" size="md">
      <div className="print:p-8" id="receipt-content">
        {/* Header */}
        <div className="text-center border-b pb-6 mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Receipt</h2>
          <p className="text-gray-500 mt-1">Transaction Details</p>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center mb-6">
          <span className={`px-4 py-2 rounded-full text-sm font-semibold capitalize ${getStatusColor(transaction.status)}`}>
            {transaction.status}
          </span>
        </div>

        {/* Amount */}
        <div className="text-center mb-8">
          <p className="text-gray-500 text-sm">Amount Paid</p>
          <p className="text-4xl font-bold text-gray-900">
            {formatCurrency(transaction.amount, transaction.currency)}
          </p>
          {transaction.discountAmount > 0 && (
            <p className="text-green-600 text-sm mt-1">
              Discount: -{formatCurrency(transaction.discountAmount, transaction.currency)}
              {transaction.promoCode && ` (${transaction.promoCode})`}
            </p>
          )}
        </div>

        {/* Details */}
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Date</span>
            <span className="font-medium text-gray-900">{formatDate(transaction.createdAt)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Plan</span>
            <span className="font-medium text-gray-900 capitalize">{transaction.planTier} Plan</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Payment Method</span>
            <span className="font-medium text-gray-900 capitalize">{transaction.paymentProvider || 'Monnify'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Reference</span>
            <span className="font-medium text-gray-900 font-mono text-sm">
              {transaction.monnifyReference || transaction.paystackReference || transaction.reference || 'N/A'}
            </span>
          </div>

          {transaction.monnifyResponse?.customerEmail && (
            <div className="flex justify-between">
              <span className="text-gray-600">Email</span>
              <span className="font-medium text-gray-900">{transaction.monnifyResponse.customerEmail}</span>
            </div>
          )}

          {transaction.completedAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">Completed</span>
              <span className="font-medium text-gray-900">{formatDate(transaction.completedAt)}</span>
            </div>
          )}
        </div>

        {/* Transaction ID */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">Transaction ID</p>
          <p className="text-sm font-mono text-gray-600">{transaction.id}</p>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-3 print:hidden">
          <Button variant="outline" fullWidth onClick={handlePrint}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Receipt
          </Button>
          <Button variant="primary" fullWidth onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ReceiptModal;
