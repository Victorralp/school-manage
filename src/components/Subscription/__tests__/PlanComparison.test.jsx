import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlanComparison from '../PlanComparison';
import { useSubscription } from '../../../context/SubscriptionContext';

vi.mock('../../../context/SubscriptionContext');

describe('PlanComparison', () => {
  const mockOnSelectPlan = vi.fn();

  const mockAvailablePlans = {
    free: {
      name: 'Free Plan',
      price: { NGN: 0, USD: 0 },
      subjectLimit: 3,
      studentLimit: 10,
      features: ['Basic subject management', 'Up to 10 students', 'Limited support']
    },
    premium: {
      name: 'Premium Plan',
      price: { NGN: 1500, USD: 1 },
      subjectLimit: 6,
      studentLimit: { min: 15, max: 20 },
      features: ['6 subjects', '15-20 students', 'Priority support']
    },
    vip: {
      name: 'VIP Plan',
      price: { NGN: 4500, USD: 3 },
      subjectLimit: { min: 6, max: 10 },
      studentLimit: 30,
      features: ['6-10 subjects', '30 students', '24/7 support']
    }
  };

  const mockSubscriptionData = {
    availablePlans: mockAvailablePlans,
    subscription: {
      planTier: 'free'
    },
    loading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useSubscription.mockReturnValue(mockSubscriptionData);
  });

  it('should render all three plan cards', () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} />);

    expect(screen.getByText('Free Plan')).toBeInTheDocument();
    expect(screen.getByText('Premium Plan')).toBeInTheDocument();
    expect(screen.getByText('VIP Plan')).toBeInTheDocument();
  });

  it('should display plan prices in NGN and USD', () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} />);

    expect(screen.getByText('₦0')).toBeInTheDocument();
    expect(screen.getByText('₦1,500')).toBeInTheDocument();
    expect(screen.getByText('₦4,500')).toBeInTheDocument();
  });

  it('should display plan limits correctly', () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} />);

    expect(screen.getByText('3 subjects')).toBeInTheDocument();
    expect(screen.getByText('10 students')).toBeInTheDocument();
    expect(screen.getByText('6 subjects')).toBeInTheDocument();
    expect(screen.getByText('15-20 students')).toBeInTheDocument();
    expect(screen.getByText('6-10 subjects')).toBeInTheDocument();
    expect(screen.getByText('30 students')).toBeInTheDocument();
  });

  it('should display all features for each plan', () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} />);

    expect(screen.getByText('Basic subject management')).toBeInTheDocument();
    expect(screen.getByText('Priority support')).toBeInTheDocument();
    expect(screen.getByText('24/7 support')).toBeInTheDocument();
  });

  it('should highlight current plan', () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} />);

    const currentPlanBadge = screen.getByText('Current Plan');
    expect(currentPlanBadge).toBeInTheDocument();
  });

  it('should disable button for current plan', () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} />);

    const currentPlanButtons = screen.getAllByText('Current Plan');
    const buttonElement = currentPlanButtons.find(el => el.tagName === 'BUTTON');
    expect(buttonElement).toBeDisabled();
  });

  it('should show Popular badge on Premium plan', () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} />);

    expect(screen.getByText('Popular')).toBeInTheDocument();
  });

  it('should call onSelectPlan when Select Plan button is clicked', async () => {
    const user = userEvent.setup();
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} />);

    const selectButtons = screen.getAllByText('Select Plan');
    await user.click(selectButtons[0]);

    expect(mockOnSelectPlan).toHaveBeenCalled();
  });

  it('should show loading skeleton when loading', () => {
    useSubscription.mockReturnValue({
      ...mockSubscriptionData,
      loading: true
    });

    const { container } = render(<PlanComparison onSelectPlan={mockOnSelectPlan} />);

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should render responsive grid layout', () => {
    const { container } = render(<PlanComparison onSelectPlan={mockOnSelectPlan} />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-3');
  });

  it('should show Downgrade text for free plan when on paid plan', () => {
    useSubscription.mockReturnValue({
      ...mockSubscriptionData,
      subscription: {
        planTier: 'premium'
      }
    });

    render(<PlanComparison onSelectPlan={mockOnSelectPlan} />);

    expect(screen.getByText('Downgrade')).toBeInTheDocument();
  });
});
