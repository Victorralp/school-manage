import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { SubscriptionProvider, useSubscription } from '../context/SubscriptionContext';

// Mock Firebase
vi.mock('../firebase/config', () => ({
  db: {},
  auth: {}
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(() => Promise.resolve({ 
    exists: () => true,
    data: () => ({
      free: {
        name: "Free Plan",
        price: { NGN: 0, USD: 0 },
        subjectLimit: 3,
        studentLimit: 10,
        features: []
      },
      premium: {
        name: "Premium Plan",
        price: { NGN: 1500, USD: 1 },
        subjectLimit: 6,
        studentLimit: { min: 15, max: 20 },
        features: []
      }
    })
  })),
  onSnapshot: vi.fn((ref, callback) => {
    callback({
      exists: () => true,
      data: () => ({
        teacherId: 'test-user',
        planTier: 'free',
        status: 'active',
        subjectLimit: 3,
        studentLimit: 10,
        currentSubjects: 2,
        currentStudents: 8
      })
    });
    return vi.fn();
  }),
  updateDoc: vi.fn(() => Promise.resolve()),
  increment: vi.fn((val) => val)
}));

// Mock Auth context
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user', email: 'test@example.com' },
    role: 'teacher'
  })
}));

const wrapper = ({ children }) => (
  <SubscriptionProvider>{children}</SubscriptionProvider>
);

describe('SubscriptionContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide subscription data', async () => {
    const { result } = renderHook(() => useSubscription(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.subscription).toBeDefined();
    expect(result.current.availablePlans).toBeDefined();
  });

  it('should calculate usage percentages correctly', async () => {
    const { result } = renderHook(() => useSubscription(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // 2 subjects out of 3 = 67%
    expect(result.current.subjectUsage.current).toBe(2);
    expect(result.current.subjectUsage.limit).toBe(3);
    expect(result.current.subjectUsage.percentage).toBeGreaterThan(60);

    // 8 students out of 10 = 80%
    expect(result.current.studentUsage.current).toBe(8);
    expect(result.current.studentUsage.limit).toBe(10);
    expect(result.current.studentUsage.percentage).toBe(80);
  });

  it('should check if near limit (80% threshold)', async () => {
    const { result } = renderHook(() => useSubscription(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Students at 80% should be near limit
    expect(result.current.isNearLimit('student')).toBe(true);
    
    // Subjects at 67% should not be near limit
    expect(result.current.isNearLimit('subject')).toBe(false);
  });

  it('should validate if can add more items', async () => {
    const { result } = renderHook(() => useSubscription(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Can add subject (2/3)
    expect(result.current.canAddSubject()).toBe(true);
    
    // Can add student (8/10)
    expect(result.current.canAddStudent()).toBe(true);
  });
});
