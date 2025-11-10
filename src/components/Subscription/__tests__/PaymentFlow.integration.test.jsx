import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SubscriptionManager from '../SubscriptionManager';
import { useSubscription } from '../../../context/SubscriptionContext';
import { useAuth } from '../../../context/AuthContext';

// Mock dependencies
vi.mock('../../../context/SubscriptionContext');
vi.mock('../../../context/AuthContext');
vi.mock('react-paystack', () => ({
  PaystackButton: ({ text, onSuccess, disabled, className }) => (
    <button
      data-testid="paystack-button"
      onClick={() => onSuccess({ 
        reference: 'TEST_REF_123', 
        status: 'success',
        message: 'Payment successful',
        transaction: 'TXN_123'
      })}
      disabled={disabled}
      className={className}
    >
      {text}
    </button>
  )
}));

vi.mock('../../../utils/paystackConfig', () => ({
  validatePaystackConfig: vi.fn(() => true),
  convertToKobo: vi.fn((amount) => amount * 100),
  formatCurrency: vi.fn((amount, currency) => `${currency === 'NGN' ? '₦' : '$'}${amount.toLocaleString()}`),
  generateTransactionReference: vi.fn(() => 'TEST_REF_123'),
  getPaystackPublicKey: vi.fn(() => 'pk_test_123')
}));

describe('Payment Flow Integration', () => {
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User'
  };

  const mockSubscription = {
    teacherId: 'test-user-123',
    planTier: 'free',
    status: 'active',
    subjectLimit: 3,
    studentLimit: 10,
    currentSubjects: 2,
    currentStudents: 5
  };

  const mockAvailablePlans = {
    free: {
      name: 'Free Plan',
      price: { NGN: 0, USD: 0 },
      subjectLimit: 3,
      studentLimit: 10,
      features: ['Basic subject management', 'Up to 10 students']
    },
    premium: {
      name: 'Premium Plan',
      price: { NGN: 1500, USD: 1 },
      subjectLimit: 6,
      studentLimit: 20,
      billingCycle: 'monthly',
      features: ['6 subjects', '15-20 students', 'Priority support']
    },
    vip: {
      name: 'VIP Plan',
      price: { NGN: 4500, USD: 3 },
      subjectLimit: 10,
      studentLimit: 30,
      billingCycle: 'monthly',
      features: ['6-10 subjects', '30 students', '24/7 support']
    }
  };

  const mockUpgradePlan = vi.fn();
  const mockHandlePaymentSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    useAuth.mockReturnValue({ user: mockUser });
    
    useSubscription.mockReturnValue({
      subscription: mockSubscription,
      currentPlan: mockAvailablePlans.free,
      availablePlans: mockAvailablePlans,
      loading: false,
      upgradePlan: mockUpgradePlan,
      handlePaymentSuccess: mockHandlePaymentSuccess
    });

    mockUpgradePlan.mockResolvedValue({
      planTier: 'premium',
      planName: 'Premium Plan',
      amount: 1500,
      currency: 'NGN',
      features: ['6 subjects', '15-20 students', 'Priority support'],
      subjectLimit: 6,
      studentLimit: 20
    });

    mockHandlePaymentSuccess.mockResolvedValue({
      success: true,
      message: 'Payment processed successfully',
      transactionId: 'TEST_REF_123'
    });
  });

  it('should display current plan and available plans', () => {
    render(<SubscriptionManager />);

    expect(screen.getByText('Current Plan')).toBeInTheDocument();
    expect(screen.getByText('Free Plan')).toBeInTheDocument();
    expect(screen.getByText('Available Plans')).toBeInTheDocument();
    expect(screen.getByText('Premium Plan')).toBeInTheDocument();
    expect(screen.getByText('VIP Plan')).toBeInTheDocument();
  });

  it('should complete full payment flow from plan selection to success', async () => {
    const user = userEvent.setup();
    render(<SubscriptionManager />);

    // Step 1: Click upgrade button for Premium plan
    const upgradeButtons = screen.getAllByText('Upgrade');
    await user.click(upgradeButtons[0]); // Click first upgrade button (Premium)

    // Step 2: Verify payment modal opens
    await waitFor(() => {
      expect(screen.getByText('Upgrade to Premium Plan')).toBeInTheDocument();
    });

    expect(mockUpgradePlan).toHaveBeenCalledWith('premium', 'NGN');

    // Step 3: Verify plan details are displayed
    expect(screen.getByText('6 subjects')).toBeInTheDocument();
    expect(screen.getByText('20 students')).toBeInTheDocument();

    // Step 4: Click Paystack payment button
    const paystackButton = screen.getByTestId('paystack-button');
    await user.click(paystackButton);

    // Step 5: Verify payment processing
    await waitFor(() => {
      expect(mockHandlePaymentSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          reference: 'TEST_REF_123',
          planTier: 'premium',
          amount: 1500,
          currency: 'NGN',
          subjectLimit: 6,
          studentLimit: 20
        })
      );
    });

    // Step 6: Verify success modal appears
    await waitFor(() => {
      expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
      expect(screen.getByText('Welcome to Premium Plan!')).toBeInTheDocument();
    });

    // Step 7: Verify transaction details are shown
    expect(screen.getByText('Transaction Details')).toBeInTheDocument();
    expect(screen.getByText('TEST_REF_123')).toBeInTheDocument();
  });

  it('should handle payment failure gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock payment failure
    mockHandlePaymentSuccess.mockResolvedValue({
      success: false,
      error: 'Payment verification failed'
    });

    render(<SubscriptionManager />);

    // Click upgrade button
    const upgradeButtons = screen.getAllByText('Upgrade');
    await user.click(upgradeButtons[0]);

    // Wait for modal
    await waitFor(() => {
      expect(screen.getByText('Upgrade to Premium Plan')).toBeInTheDocument();
    });

    // Click payment button
    const paystackButton = screen.getByTestId('paystack-button');
    await user.click(paystackButton);

    // Verify error is displayed
    await waitFor(() => {
      expect(screen.getByText(/Payment verification failed/i)).toBeInTheDocument();
    });

    // Success modal should not appear
    expect(screen.queryByText('Payment Successful!')).not.toBeInTheDocument();
  });

  it('should allow currency selection before payment', async () => {
    const user = userEvent.setup();
    render(<SubscriptionManager />);

    // Open payment modal
    const upgradeButtons = screen.getAllByText('Upgrade');
    await user.click(upgradeButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Select Currency')).toBeInTheDocument();
    });

    // Click USD option
    const usdButton = screen.getByText('US Dollar').closest('button');
    await user.click(usdButton);

    // Verify USD is selected
    expect(usdButton).toHaveClass('border-blue-600');
  });

  it('should close payment modal when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<SubscriptionManager />);

    // Open payment modal
    const upgradeButtons = screen.getAllByText('Upgrade');
    await user.click(upgradeButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Upgrade to Premium Plan')).toBeInTheDocument();
    });

    // Click cancel
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText('Upgrade to Premium Plan')).not.toBeInTheDocument();
    });
  });

  it('should close success modal and reset state', async () => {
    const user = userEvent.setup();
    render(<SubscriptionManager />);

    // Complete payment flow
    const upgradeButtons = screen.getAllByText('Upgrade');
    await user.click(upgradeButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('paystack-button')).toBeInTheDocument();
    });

    const paystackButton = screen.getByTestId('paystack-button');
    await user.click(paystackButton);

    // Wait for success modal
    await waitFor(() => {
      expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
    });

    // Click continue button
    const continueButton = screen.getByText('Continue');
    await user.click(continueButton);

    // Success modal should close
    await waitFor(() => {
      expect(screen.queryByText('Payment Successful!')).not.toBeInTheDocument();
    });
  });

  it('should disable upgrade button for current plan', () => {
    render(<SubscriptionManager />);

    // Find the Free Plan card (current plan)
    const currentPlanBadge = screen.getByText('Current Plan');
    expect(currentPlanBadge).toBeInTheDocument();

    // The button in the same card should be disabled
    const freePlanCard = currentPlanBadge.closest('div').closest('div');
    const button = freePlanCard.querySelector('button');
    expect(button).toBeDisabled();
  });

  it('should show loading state', () => {
    useSubscription.mockReturnValue({
      ...useSubscription(),
      loading: true
    });

    render(<SubscriptionManager />);

    expect(screen.getByRole('generic')).toHaveClass('animate-spin');
  });

  it('should handle upgrade plan error', async () => {
    const user = userEvent.setup();
    
    mockUpgradePlan.mockRejectedValue(new Error('Already on this plan'));

    render(<SubscriptionManager />);

    const upgradeButtons = screen.getAllByText('Upgrade');
    await user.click(upgradeButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Already on this plan/i)).toBeInTheDocument();
    });
  });
});
