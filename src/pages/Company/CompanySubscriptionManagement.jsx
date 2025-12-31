import { useState, useEffect } from 'react';
import { useSchoolSubscription } from '../../context/SchoolSubscriptionContext';
import { useToast } from '../../context/ToastContext';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import SubscriptionDashboard from '../../components/Subscription/SubscriptionDashboard';
import PlanComparison from '../../components/Subscription/PlanComparison';
import PaymentModal from '../../components/Subscription/PaymentModal';
import ReceiptModal from '../../components/Subscription/ReceiptModal';
import SchoolManagement from '../../components/School/SchoolManagement';
import { getTransactionHistory } from '../../firebase/schoolService';
import { useAuth } from '../../context/AuthContext';

const CompanySubscriptionManagement = () => {
  const { user } = useAuth();
  const {
    school,
    isAdmin,
    cancelSubscription,
    upgradePlan,
    teacherRelationship,
    subjectUsage,
    studentUsage,
    handlePaymentSuccess: processPaymentContext
  } = useSchoolSubscription();
  const toast = useToast();
  const [showPlanComparison, setShowPlanComparison] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    if (school && isAdmin) {
      fetchTransactions();
    }
  }, [school, isAdmin]);

  const fetchTransactions = async () => {
    if (!school) return;

    setLoadingTransactions(true);
    try {
      const transactionsData = await getTransactionHistory(school.id);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleUpgradeClick = () => {
    console.log('handleUpgradeClick called');
    console.log('isAdmin:', isAdmin);
    console.log('Current showPlanComparison:', showPlanComparison);

    if (!isAdmin) {
      toast.info('Only school admins can upgrade the plan.');
      return;
    }

    console.log('Setting showPlanComparison to true');
    setShowPlanComparison(true);
  };

  const handleSelectPlan = async (planTier) => {
    if (!isAdmin) {
      toast.error('Only school admins can change plans');
      return;
    }

    if (planTier === 'free') {
      setShowCancelModal(true);
      return;
    }

    try {
      setLoading(true);
      const details = await upgradePlan(planTier, 'NGN');
      setPaymentDetails(details);
      setSelectedPlan(planTier);
      setShowPlanComparison(false);
      setShowPaymentModal(true);
    } catch (error) {
      console.error('Error preparing upgrade:', error);
      toast.error(error.message || 'Failed to prepare upgrade');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    try {
      setLoading(true);
      await processPaymentContext(paymentData);

      setShowPaymentModal(false);
      setPaymentDetails(null);
      setSelectedPlan(null);
      toast.success('🎉 School plan upgraded successfully! All teachers now have access to new limits.');
      fetchTransactions();
    } catch (error) {
      console.error("Payment processing error:", error);
      toast.error(error.message || 'Payment recorded failed. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (error) => {
    toast.error('Payment failed. Please try again or contact support.');
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setPaymentDetails(null);
    setSelectedPlan(null);
  };

  const handleCancelSubscription = async () => {
    if (!isAdmin) {
      toast.error('Only school admins can cancel subscriptions');
      return;
    }

    try {
      setLoading(true);
      const result = await cancelSubscription();

      if (result.success) {
        toast.warning('School subscription cancelled. The school will be downgraded to Free plan after the grace period.');
        setShowCancelModal(false);
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error(error.message || 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount, currency) => {
    if (currency === 'NGN') {
      return `₦${amount.toLocaleString()}`;
    }
    return `$${amount}`;
  };

  if (!school) {
    return (
      <Layout title="Subscription Management">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading school information...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="School Subscription">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">{school.name}</h1>
              <p className="text-blue-100 text-sm sm:text-base">
                School Subscription Management
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm text-white text-sm font-semibold rounded-full border border-white border-opacity-30">
                👑 Admin
              </span>
              <span className="px-4 py-2 bg-white text-blue-700 text-xs sm:text-sm font-bold rounded-full uppercase">
                {school.planTier} Plan
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Teachers</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{school.teacherCount || 0}</p>
              </div>
              <div className="bg-blue-200 p-3 rounded-full">
                <svg className="h-6 w-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Subjects</p>
                <p className="text-3xl font-bold text-green-900 mt-1">{subjectUsage.current}/{subjectUsage.limit}</p>
              </div>
              <div className="bg-green-200 p-3 rounded-full">
                <svg className="h-6 w-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Applicants</p>
                <p className="text-3xl font-bold text-purple-900 mt-1">{studentUsage.current}/{studentUsage.limit}</p>
              </div>
              <div className="bg-purple-200 p-3 rounded-full">
                <svg className="h-6 w-6 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Status</p>
                <p className="text-lg font-bold text-orange-900 mt-1 capitalize">{school.status}</p>
              </div>
              <div className="bg-orange-200 p-3 rounded-full">
                <svg className="h-6 w-6 text-orange-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Subscription Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subscription Dashboard */}
            <SubscriptionDashboard onUpgradeClick={handleUpgradeClick} />

            {/* Plan Management */}
            <Card
              title="🎯 Plan Management"
              subtitle="Upgrade or manage your school's subscription"
            >
              <div className="space-y-3">
                <Button
                  variant="primary"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleUpgradeClick();
                  }}
                  fullWidth
                  type="button"
                  className="text-base py-3"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  View All Plans & Upgrade
                </Button>

                {school.planTier !== 'free' && (
                  <Button
                    variant="danger"
                    onClick={() => setShowCancelModal(true)}
                    fullWidth
                    className="text-base py-3"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel Subscription
                  </Button>
                )}


              </div>
            </Card>

            {/* School Management */}
            <SchoolManagement />
          </div>

          {/* Right Column - Quick Info */}
          <div className="space-y-6">
            {/* Your Contribution */}
            {teacherRelationship && (
              <Card
                title="👤 Your Contribution"
                subtitle="Your individual usage"
              >
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Subjects Registered</p>
                    <p className="text-3xl font-bold text-blue-600">{teacherRelationship.currentSubjects || 0}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Students Registered</p>
                    <p className="text-3xl font-bold text-purple-600">{teacherRelationship.currentStudents || 0}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Plan Info */}
            <Card
              title="📋 Plan Information"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Current Plan</span>
                  <span className="text-sm font-semibold text-gray-900 uppercase">{school.planTier}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`text-sm font-semibold capitalize ${school.status === 'active' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                    {school.status}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Subject Limit</span>
                  <span className="text-sm font-semibold text-gray-900">{school.subjectLimit}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Applicant Limit</span>
                  <span className="text-sm font-semibold text-gray-900">{school.studentLimit}</span>
                </div>
              </div>
            </Card>

            {/* Upgrade CTA */}
            {school.planTier === 'free' && (
              <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300">
                <div className="text-center">
                  <div className="bg-yellow-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Unlock More Features</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Upgrade to Premium or VIP for more subjects, students, and priority support!
                  </p>
                  <Button
                    variant="primary"
                    onClick={handleUpgradeClick}
                    fullWidth
                  >
                    Explore Plans
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Payment History */}
        <Card
          title="Payment History"
          subtitle="School transaction history"
        >
          {loadingTransactions ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-600 mt-2">No transactions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr 
                      key={transaction.id}
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setShowReceiptModal(true);
                      }}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(transaction.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {transaction.planTier}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(transaction.amount, transaction.currency)}
                        {transaction.promoCode && (
                          <div className="text-xs text-green-600 mt-1">
                            <span className="font-medium">{transaction.promoCode}</span>
                            {transaction.discountAmount > 0 && (
                              <span className="ml-1">
                                (-{formatCurrency(transaction.discountAmount, transaction.currency)})
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${transaction.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : transaction.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                          }`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {(transaction.monnifyReference || transaction.paystackReference)?.substring(0, 12)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div >

      {/* Plan Comparison Modal */}
      < Modal
        isOpen={showPlanComparison}
        onClose={() => {
          console.log('Modal close clicked');
          setShowPlanComparison(false);
        }}
        title="Choose Your School Plan"
        size="xl"
      >
        <PlanComparison onSelectPlan={handleSelectPlan} />
      </Modal >

      {/* Payment Modal */}
      {
        showPaymentModal && paymentDetails && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={handlePaymentCancel}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            planDetails={paymentDetails}
          />
        )
      }



      {/* Cancel Subscription Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel School Subscription"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-yellow-100 p-3">
              <svg
                className="h-12 w-12 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Are you sure you want to cancel the school subscription?
            </h3>
            <p className="text-gray-600 mb-4">
              The school subscription will be cancelled and all teachers will be downgraded to the Free plan after a 3-day grace period.
            </p>
            <div className="bg-blue-50 rounded-lg p-4 text-left">
              <p className="text-sm text-blue-900 font-medium mb-2">What happens next:</p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>3-day grace period for all teachers</li>
                <li>All school data will be retained</li>
                <li>School limited to Free plan features</li>
                <li>All teachers will be notified</li>
                <li>Can upgrade again anytime</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            fullWidth
            onClick={() => setShowCancelModal(false)}
          >
            Keep Subscription
          </Button>
          <Button
            variant="danger"
            fullWidth
            onClick={handleCancelSubscription}
            loading={loading}
          >
            Cancel School Subscription
          </Button>
        </div>
      </Modal>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
      />
    </Layout >
  );
};

export default CompanySubscriptionManagement;
