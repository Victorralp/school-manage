import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';

// Mock Firebase before importing context
vi.mock('../firebase/config', () => ({
  db: {},
  auth: {}
}));

// Mock AuthContext
vi.mock('./AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-123' }
  })
}));

// Mock Firestore functions
vi.mock('firebase/firestore', async () => {
  return {
    doc: vi.fn(),
    getDoc: vi.fn(),
    onSnapshot: vi.fn(),
    updateDoc: vi.fn(),
    increment: vi.fn((value) => value)
  };
});

// Import after mocks
const { SubscriptionProvider, useSubscription } = await import('./SubscriptionContext.jsx');
const firestore = await import('firebase/firestore');

describe('SubscriptionContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Usage tracking', () => {
    it('should calculate subject usage percentage correctly', async () => {
      const mockSubscription = {
        planTier: 'free',
        currentSubjects: 2,
        currentStudents: 5,
        subjectLimit: 3,
        studentLimit: 10
      };

      const mockPlans = {
        free: {
          name: 'Free Plan',
          subjectLimit: 3,
          studentLimit: 10
        }
      };

      // Mock getDoc for plan config
      firestore.getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockPlans
      });

      // Mock onSnapshot for subscription
      firestore.onSnapshot.mockImplementation((ref, callback) => {
        callback({
          exists: () => true,
          data: () => mockSubscription
        });
        return vi.fn(); // unsubscribe function
      });

      const wrapper = ({ children }) => (
        <SubscriptionProvider>{children}</SubscriptionProvider>
      );

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.subjectUsage.current).toBe(2);
      expect(result.current.subjectUsage.limit).toBe(3);
      expect(result.current.subjectUsage.percentage).toBe(67);
    });

    it('should increment usage count', async () => {
      const mockSubscription = {
        planTier: 'free',
        currentSubjects: 2,
        currentStudents: 5
      };

      firestore.getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          free: { name: 'Free Plan', subjectLimit: 3, studentLimit: 10 }
        })
      });

      firestore.onSnapshot.mockImplementation((ref, callback) => {
        callback({
          exists: () => true,
          data: () => mockSubscription
        });
        return vi.fn();
      });

      firestore.updateDoc.mockResolvedValueOnce();

      const wrapper = ({ children }) => (
        <SubscriptionProvider>{children}</SubscriptionProvider>
      );

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.incrementUsage('subject');

      expect(firestore.updateDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          currentSubjects: 1
        })
      );
    });

    it('should decrement usage count', async () => {
      const mockSubscription = {
        planTier: 'free',
        currentSubjects: 2,
        currentStudents: 5
      };

      firestore.getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          free: { name: 'Free Plan', subjectLimit: 3, studentLimit: 10 }
        })
      });

      firestore.onSnapshot.mockImplementation((ref, callback) => {
        callback({
          exists: () => true,
          data: () => mockSubscription
        });
        return vi.fn();
      });

      firestore.updateDoc.mockResolvedValueOnce();

      const wrapper = ({ children }) => (
        <SubscriptionProvider>{children}</SubscriptionProvider>
      );

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.decrementUsage('student');

      expect(firestore.updateDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          currentStudents: -1
        })
      );
    });
  });

  describe('Limit validation', () => {
    it('should return true when under limit', async () => {
      const mockSubscription = {
        planTier: 'free',
        currentSubjects: 2,
        currentStudents: 5,
        subjectLimit: 3,
        studentLimit: 10
      };

      firestore.getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          free: { name: 'Free Plan', subjectLimit: 3, studentLimit: 10 }
        })
      });

      firestore.onSnapshot.mockImplementation((ref, callback) => {
        callback({
          exists: () => true,
          data: () => mockSubscription
        });
        return vi.fn();
      });

      const wrapper = ({ children }) => (
        <SubscriptionProvider>{children}</SubscriptionProvider>
      );

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.canAddSubject()).toBe(true);
      expect(result.current.canAddStudent()).toBe(true);
    });

    it('should return false when at limit', async () => {
      const mockSubscription = {
        planTier: 'free',
        currentSubjects: 3,
        currentStudents: 10,
        subjectLimit: 3,
        studentLimit: 10
      };

      firestore.getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          free: { name: 'Free Plan', subjectLimit: 3, studentLimit: 10 }
        })
      });

      firestore.onSnapshot.mockImplementation((ref, callback) => {
        callback({
          exists: () => true,
          data: () => mockSubscription
        });
        return vi.fn();
      });

      const wrapper = ({ children }) => (
        <SubscriptionProvider>{children}</SubscriptionProvider>
      );

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.canAddSubject()).toBe(false);
      expect(result.current.canAddStudent()).toBe(false);
    });

    it('should detect near limit at 80% threshold', async () => {
      const mockSubscription = {
        planTier: 'free',
        currentSubjects: 2,
        currentStudents: 8,
        subjectLimit: 3,
        studentLimit: 10
      };

      firestore.getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          free: { name: 'Free Plan', subjectLimit: 3, studentLimit: 10 }
        })
      });

      firestore.onSnapshot.mockImplementation((ref, callback) => {
        callback({
          exists: () => true,
          data: () => mockSubscription
        });
        return vi.fn();
      });

      const wrapper = ({ children }) => (
        <SubscriptionProvider>{children}</SubscriptionProvider>
      );

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isNearLimit('student')).toBe(true);
    });
  });

  describe('Plan upgrade logic', () => {
    it('should return payment details for valid upgrade', async () => {
      const mockSubscription = {
        planTier: 'free',
        currentSubjects: 2,
        currentStudents: 5
      };

      const mockPlans = {
        free: { name: 'Free Plan', subjectLimit: 3, studentLimit: 10, price: { NGN: 0, USD: 0 } },
        premium: {
          name: 'Premium Plan',
          subjectLimit: 6,
          studentLimit: 20,
          price: { NGN: 1500, USD: 1 },
          features: ['6 subjects', '20 students']
        }
      };

      firestore.getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockPlans
      });

      firestore.onSnapshot.mockImplementation((ref, callback) => {
        callback({
          exists: () => true,
          data: () => mockSubscription
        });
        return vi.fn();
      });

      const wrapper = ({ children }) => (
        <SubscriptionProvider>{children}</SubscriptionProvider>
      );

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const paymentDetails = await result.current.upgradePlan('premium', 'NGN');

      expect(paymentDetails.planTier).toBe('premium');
      expect(paymentDetails.amount).toBe(1500);
      expect(paymentDetails.currency).toBe('NGN');
    });

    it('should throw error for invalid plan upgrade', async () => {
      const mockSubscription = {
        planTier: 'free',
        currentSubjects: 2,
        currentStudents: 5
      };

      firestore.getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          free: { name: 'Free Plan', subjectLimit: 3, studentLimit: 10 }
        })
      });

      firestore.onSnapshot.mockImplementation((ref, callback) => {
        callback({
          exists: () => true,
          data: () => mockSubscription
        });
        return vi.fn();
      });

      const wrapper = ({ children }) => (
        <SubscriptionProvider>{children}</SubscriptionProvider>
      );

      const { result } = renderHook(() => useSubscription(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.upgradePlan('invalid-plan')).rejects.toThrow();
    });
  });
});
