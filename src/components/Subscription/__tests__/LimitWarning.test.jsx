import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LimitWarning from '../LimitWarning';
import { useSubscription } from '../../../context/SubscriptionContext';

vi.mock('../../../context/SubscriptionContext');

describe('LimitWarning', () => {
  const mockOnUpgradeClick = vi.fn();

  const mockSubscriptionData = {
    subscription: {
      planTier: 'free'
    },
    subjectUsage: {
      current: 2,
      limit: 3,
      percentage: 67
    },
    studentUsage: {
      current: 8,
      limit: 10,
      percentage: 80
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    useSubscription.mockReturnValue(mockSubscriptionData);
  });

  afterEach(() => {
    delete window.showLimitReachedModal;
  });

  it('should show warning banner when usage is at 80%', () => {
    render(<LimitWarning onUpgradeClick={mockOnUpgradeClick} />);

    expect(screen.getByText('Student Limit Warning')).toBeInTheDocument();
    expect(screen.getByText(/You've used 80% of your student limit/)).toBeInTheDocument();
  });

  it('should not show warning when usage is below 80%', () => {
    useSubscription.mockReturnValue({
      ...mockSubscriptionData,
      studentUsage: {
        current: 5,
        limit: 10,
        percentage: 50
      }
    });

    render(<LimitWarning onUpgradeClick={mockOnUpgradeClick} />);

    expect(screen.queryByText('Student Limit Warning')).not.toBeInTheDocument();
  });

  it('should not show warning when usage is at 100%', () => {
    useSubscription.mockReturnValue({
      ...mockSubscriptionData,
      studentUsage: {
        current: 10,
        limit: 10,
        percentage: 100
      }
    });

    render(<LimitWarning onUpgradeClick={mockOnUpgradeClick} />);

    expect(screen.queryByText('Student Limit Warning')).not.toBeInTheDocument();
  });

  it('should dismiss warning and save to session storage', async () => {
    const user = userEvent.setup();
    render(<LimitWarning onUpgradeClick={mockOnUpgradeClick} />);

    const closeButton = screen.getByRole('button', { name: /dismiss/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Student Limit Warning')).not.toBeInTheDocument();
    });

    const stored = sessionStorage.getItem('dismissedLimitWarnings');
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored)).toHaveProperty('student', true);
  });

  it('should show upgrade button in warning banner', () => {
    render(<LimitWarning onUpgradeClick={mockOnUpgradeClick} />);

    const upgradeButtons = screen.getAllByText('Upgrade Now');
    expect(upgradeButtons.length).toBeGreaterThan(0);
  });

  it('should call onUpgradeClick when upgrade button is clicked', async () => {
    const user = userEvent.setup();
    render(<LimitWarning onUpgradeClick={mockOnUpgradeClick} />);

    const upgradeButton = screen.getAllByText('Upgrade Now')[0];
    await user.click(upgradeButton);

    expect(mockOnUpgradeClick).toHaveBeenCalled();
  });

  it('should show both subject and student warnings when both are at 80%', () => {
    useSubscription.mockReturnValue({
      ...mockSubscriptionData,
      subjectUsage: {
        current: 5,
        limit: 6,
        percentage: 83
      },
      studentUsage: {
        current: 16,
        limit: 20,
        percentage: 80
      }
    });

    render(<LimitWarning onUpgradeClick={mockOnUpgradeClick} />);

    expect(screen.getByText('Subject Limit Warning')).toBeInTheDocument();
    expect(screen.getByText('Student Limit Warning')).toBeInTheDocument();
  });

  it('should attach showLimitReachedModal to window', () => {
    render(<LimitWarning onUpgradeClick={mockOnUpgradeClick} />);

    expect(window.showLimitReachedModal).toBeDefined();
    expect(typeof window.showLimitReachedModal).toBe('function');
  });

  it('should display blocking modal when triggered', async () => {
    render(<LimitWarning onUpgradeClick={mockOnUpgradeClick} />);

    window.showLimitReachedModal('subject');

    await waitFor(() => {
      expect(screen.getByText('Limit Reached')).toBeInTheDocument();
    });
  });

  it('should show correct message in blocking modal', async () => {
    useSubscription.mockReturnValue({
      ...mockSubscriptionData,
      subjectUsage: {
        current: 3,
        limit: 3,
        percentage: 100
      }
    });

    render(<LimitWarning onUpgradeClick={mockOnUpgradeClick} />);

    window.showLimitReachedModal('subject');

    await waitFor(() => {
      expect(screen.getByText(/You've reached your subject limit of 3/)).toBeInTheDocument();
    });
  });

  it('should close blocking modal when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<LimitWarning onUpgradeClick={mockOnUpgradeClick} />);

    window.showLimitReachedModal('student');

    await waitFor(() => {
      expect(screen.getByText('Limit Reached')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Limit Reached')).not.toBeInTheDocument();
    });
  });

  it('should call onUpgradeClick from blocking modal', async () => {
    const user = userEvent.setup();
    render(<LimitWarning onUpgradeClick={mockOnUpgradeClick} />);

    window.showLimitReachedModal('subject');

    await waitFor(() => {
      expect(screen.getByText('Limit Reached')).toBeInTheDocument();
    });

    const upgradeButtons = screen.getAllByText('Upgrade Now');
    const modalUpgradeButton = upgradeButtons[upgradeButtons.length - 1];
    await user.click(modalUpgradeButton);

    expect(mockOnUpgradeClick).toHaveBeenCalled();
  });

  it('should not show dismissed warnings after page reload simulation', () => {
    sessionStorage.setItem('dismissedLimitWarnings', JSON.stringify({ student: true }));

    render(<LimitWarning onUpgradeClick={mockOnUpgradeClick} />);

    expect(screen.queryByText('Student Limit Warning')).not.toBeInTheDocument();
  });
});
