import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentModal from '../PaymentModal';
import { useAuth } from '../../../context/AuthContext';

// Mock dependencies
vi.mock('../../../context/AuthContext');
vi.mock('react-paystack', () => ({
  PaystackButton: ({ text, onSuccess, onClose, disabled, className }) => (
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
  formatCurrency: vi.fn((amount, currency) => `${currency === 'NGN' ? '₦' : '$'}${amount}`),
  generateTransactionReference: vi.fn(() => 'TEST_REF_123'),
  getPaystackPublicKey: vi.fn(() => 'pk_test_123')
}));

describe('PaymentModal', () => {
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User'
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    planTier: 'premium',
    planName: 'Premium Plan',
    amount: 1500,
    currency: 'NGN',
    features: ['6 subjects', '15-20 students', 'Priority support'],
    subjectLimit: 6,
    studentLimit: 20,
    onSuccess: vi.fn(),
    onError: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser });
  });

  it('should render payment modal with plan details', () => {
    render(<PaymentModal {...defaultProps} />);

    expect(screen.getByText('Upgrade to Premium Plan')).toBeInTheDocument();
    expect(screen.getByText('6 subjects')).toBeInTheDocument();
    expect(screen.getByText('20 students')).toBeInTheDocument();
    expect(screen.getByText('Monthly')).toBeInTheDocument();
  });

  it('should display all features', () => {
    render(<PaymentModal {...defaultProps} />);

    defaultProps.features.forEach(feature => {
      expect(screen.getByText(feature)).toBeInTheDocument();
    });
  });

  it('should show currency selector with NGN and USD options', () => {
    render(<PaymentModal {...defaultProps} />);

    expect(screen.getByText('Nigerian Naira')).toBeInTheDocument();
    expect(screen.getByText('US Dollar')).toBeInTheDocument();
  });

  it('should allow currency selection', async () => {
    const user = userEvent.setup();
    render(<PaymentModal {...defaultProps} />);

    const usdButton = screen.getByText('US Dollar').closest('button');
    await user.click(usdButton);

    // USD button should have active styling
    expect(usdButton).toHaveClass('border-blue-600');
  });

  it('should display total amount', () => {
    render(<PaymentModal {...defaultProps} />);

    expect(screen.getByText('Total Amount:')).toBeInTheDocument();
    expect(screen.getByText('₦1500')).toBeInTheDocument();
  });

  it('should call onSuccess when payment succeeds', async () => {
    const user = userEvent.setup();
    render(<PaymentModal {...defaultProps} />);

    const paystackButton = screen.getByTestId('paystack-button');
    await user.click(paystackButton);

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          reference: 'TEST_REF_123',
          status: 'success',
          planTier: 'premium',
          amount: 1500,
          currency: 'NGN'
        })
      );
    });
  });

  it('should disable payment button when user has no email', () => {
    useAuth.mockReturnValue({ user: { ...mockUser, email: null } });
    render(<PaymentModal {...defaultProps} />);

    const paystackButton = screen.getByTestId('paystack-button');
    expect(paystackButton).toBeDisabled();
    expect(screen.getByText(/Please ensure you are logged in/i)).toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<PaymentModal {...defaultProps} />);

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should show security notice', () => {
    render(<PaymentModal {...defaultProps} />);

    expect(screen.getByText(/Payments are securely processed by Paystack/i)).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(<PaymentModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Upgrade to Premium Plan')).not.toBeInTheDocument();
  });
});
