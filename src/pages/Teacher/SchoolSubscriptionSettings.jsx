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
import SchoolManagement from '../../components/School/SchoolManagement';
import { getTransactionHistory } from '../../firebase/schoolService';
import { useAuth } from '../../context/AuthContext';

const SchoolSubscriptionSettings = () => {
  const { user } = useAuth();
  const { 
    school, 
    isAdmin, 
    cancelSubscription, 
    upgradePlan,
    teacherRelationship 
  } = useSchoolSubscription();
  const toast = useToast();
  const [showPlanComparison, setShowPlanComparison] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
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
    if (!isAdmin) {
      toast.info('Only school admins can upgrade the plan. Please contact your admin.');
      return;
    }
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

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setPaymentDetails(null);
    setSelectedPlan(null);
    toast.success('🎉 School plan upgraded successfully! All teachers now have access to new limits.');
    fetchTransactions();
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
      <Layout title="Subscription Settings">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading school information...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="School Subscription Settings">
      <div className="space-y-6">
        {/* School Info Banner */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{school.name}</h2>
              <p className="text-sm text-gray-600">
                {isAdmin ? 'You are the school admin' : 'Teacher account'}
              </p>
            </div>
            {isAdmin && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                Admin
              </span>
            )}
          </div>
        </Card>

        {/* Subscription Dashboard */}
        <SubscriptionDashboard onUpgradeClick={handleUpgradeClick} />

        {/* School Management (Admin Only) */}
        {isAdmin && (
          <SchoolManagement />
        )}

        {/* Plan Management */}
        <Card
          title="Plan Management"
          subtitle={isAdmin ? "Upgrade or manage your school's subscription plan" : "View your school's subscription plan"}
        >
          <div className="space-y-4">
            {isAdmin ? (
              <>
                <Button
                  variant="primary"
                  onClick={handleUpgradeClick}
                  fullWidth
                >
                  View All Plans
                </Button>

                {school.planTier !== 'free' && (
                  <Button
                    variant="danger"
                    onClick={() => setShowCancelModal(true)}
                    fullWidth
                  >
                    Cancel School Subscription
                  </Button>
                )}
              </>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> Only school admins can upgrade or manage the subscription plan. 
                  If you need to upgrade, please contact your school admin.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Payment History (Admin Only) */}
        {isAdmin && (
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                          {transaction.planTier}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            transaction.status === 'success'
                              ? 'bg-green-100 text-green-800'
                              : transaction.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {transaction.paystackReference?.substring(0, 12)}...
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Teacher Usage Info */}
        {teacherRelationship && (
          <Card
            title="Your Contribution"
            subtitle="Your individual usage within the school"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Subjects Registered</p>
                <p className="text-2xl font-bold text-gray-900">{teacherRelationship.currentSubjects}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Students Registered</p>
                <p className="text-2xl font-bold text-gray-900">{teacherRelationship.currentStudents}</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Plan Comparison Modal */}
      <Modal
        isOpen={showPlanComparison}
        onClose={() => setShowPlanComparison(false)}
        title="Choose Your School Plan"
        size="full"
      >
        <PlanComparison onSelectPlan={handleSelectPlan} />
      </Modal>

      {/* Payment Modal */}
      {showPaymentModal && paymentDetails && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={handlePaymentCancel}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          planDetails={paymentDetails}
        />
      )}

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
    </Layout>
  );
};

export default SchoolSubscriptionSettings;
