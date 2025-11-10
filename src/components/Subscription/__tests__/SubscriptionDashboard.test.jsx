import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SubscriptionDashboard from '../SubscriptionDashboard';
import { useSubscription } from '../../../context/SubscriptionContext';

vi.mock('../../../context/SubscriptionContext');

describe('SubscriptionDashboard', () => {
  const mockOnUpgradeClick = vi.fn();

  const mockSubscriptionData = {
    subscription: {
      planTier: 'free',
      status: 'active',
      currentSubjects: 2,
      currentStudents: 5,
      expiryDate: null
    },
    loading: false,
    currentPlan: {
      name: 'Free Plan',
      subjectLimit: 3,
      studentLimit: 10
    },
    subjectUsage: {
      current: 2,
      limit: 3,
      percentage: 67
    },
    studentUsage: {
      current: 5,
      limit: 10,
      percentage: 50
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useSubscription.mockReturnValue(mockSubscriptionData);
  });

  it('should render current plan information', () => {
    render(<SubscriptionDashboard onUpgradeClick={mockOnUpgradeClick} />);

    expect(screen.getByText('Current Plan')).toBeInTheDocument();
    expect(screen.getByText('free')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should display usage statistics with progress bars', () => {
    render(<SubscriptionDashboard onUpgradeClick={mockOnUpgradeClick} />);

    expect(screen.getByText('Usage Statistics')).toBeInTheDocument();
    expect(screen.getByText('Subjects')).toBeInTheDocument();
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(screen.getByText('67% used')).toBeInTheDocument();
    
    expect(screen.getByText('Students')).toBeInTheDocument();
    expect(screen.getByText('5 / 10')).toBeInTheDocument();
    expect(screen.getByText('50% used')).toBeInTheDocument();
  });

  it('should show upgrade button for free plan', () => {
    render(<SubscriptionDashboard onUpgradeClick={mockOnUpgradeClick} />);

    const upgradeButton = screen.getByText('Upgrade Plan');
    expect(upgradeButton).toBeInTheDocument();
  });

  it('should call onUpgradeClick when upgrade button is clicked', async () => {
    const user = userEvent.setup();
    render(<SubscriptionDashboard onUpgradeClick={mockOnUpgradeClick} />);

    const upgradeButton = screen.getByText('Upgrade Plan');
    await user.click(upgradeButton);

    expect(mockOnUpgradeClick).toHaveBeenCalled();
  });

  it('should display expiry date for paid plans', () => {
    const paidPlanData = {
      ...mockSubscriptionData,
      subscription: {
        ...mockSubscriptionData.subscription,
        planTier: 'premium',
        expiryDate: {
          toDate: () => new Date('2025-12-31')
        }
      }
    };
    useSubscription.mockReturnValue(paidPlanData);

    render(<SubscriptionDashboard onUpgradeClick={mockOnUpgradeClick} />);

    expect(screen.getByText('Expires On')).toBeInTheDocument();
    expect(screen.getByText('December 31, 2025')).toBeInTheDocument();
  });

  it('should show loading skeleton when loading', () => {
    useSubscription.mockReturnValue({
      ...mockSubscriptionData,
      loading: true
    });

    const { container } = render(<SubscriptionDashboard onUpgradeClick={mockOnUpgradeClick} />);

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should display grace period status', () => {
    const gracePeriodData = {
      ...mockSubscriptionData,
      subscription: {
        ...mockSubscriptionData.subscription,
        status: 'grace_period'
      }
    };
    useSubscription.mockReturnValue(gracePeriodData);

    render(<SubscriptionDashboard onUpgradeClick={mockOnUpgradeClick} />);

    expect(screen.getByText('Grace Period')).toBeInTheDocument();
  });

  it('should show upgrade to VIP button for premium users near limit', () => {
    const premiumNearLimitData = {
      ...mockSubscriptionData,
      subscription: {
        ...mockSubscriptionData.subscription,
        planTier: 'premium'
      },
      subjectUsage: {
        current: 5,
        limit: 6,
        percentage: 83
      }
    };
    useSubscription.mockReturnValue(premiumNearLimitData);

    render(<SubscriptionDashboard onUpgradeClick={mockOnUpgradeClick} />);

    expect(screen.getByText('Upgrade to VIP')).toBeInTheDocument();
  });
});
