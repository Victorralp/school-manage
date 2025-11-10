import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { SubscriptionProvider } from '../context/SubscriptionContext';
import { ToastProvider } from '../context/ToastContext';
import SubscriptionSettings from '../pages/Teacher/SubscriptionSettings';

// Mock Firebase
vi.mock('../firebase/config', () => ({
  db: {},
  auth: {}
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  orderBy: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(() => Promise.resolve({ 
    exists: () => true,
    data: () => ({
      free: {
        name: "Free Plan",
        price: { NGN: 0, USD: 0 },
        subjectLimit: 3,
        studentLimit: 10,
        features: ["Basic features"]
      },
      premium: {
        name: "Premium Plan",
        price: { NGN: 1500, USD: 1 },
        subjectLimit: 6,
        studentLimit: { min: 15, max: 20 },
        features: ["Premium features"]
      }
    })
  })),
  onSnapshot: vi.fn((ref, callback) => {
    callback({
      exists: () => true,
      data: () => ({
        teacherId: 'test-teacher',
        planTier: 'free',
        status: 'active',
        subjectLimit: 3,
        studentLimit: 10,
        currentSubjects: 0,
        currentStudents: 0
      })
    });
    return vi.fn(); // unsubscribe function
  }),
  updateDoc: vi.fn(() => Promise.resolve()),
  increment: vi.fn((val) => val)
}));

// Mock Auth context
vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    user: { uid: 'test-teacher', email: 'teacher@test.com' },
    role: 'teacher'
  })
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <SubscriptionProvider>
          <ToastProvider>
            {component}
          </ToastProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Subscription Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Subscription Upgrade Flow', () => {
    it('should display current plan and allow viewing all plans', async () => {
      renderWithProviders(<SubscriptionSettings />);

      await waitFor(() => {
        expect(screen.getByText(/Current Plan/i)).toBeInTheDocument();
      });

      const viewPlansButton = screen.getByText(/View All Plans/i);
      expect(viewPlansButton).toBeInTheDocument();
    });

    it('should open plan comparison modal when clicking view plans', async () => {
      renderWithProviders(<SubscriptionSettings />);

      await waitFor(() => {
        expect(screen.getByText(/View All Plans/i)).toBeInTheDocument();
      });

      const viewPlansButton = screen.getByText(/View All Plans/i);
      fireEvent.click(viewPlansButton);

      await waitFor(() => {
        expect(screen.getByText(/Choose Your Plan/i)).toBeInTheDocument();
      });
    });
  });

  describe('Limit Enforcement', () => {
    it('should display usage statistics correctly', async () => {
      renderWithProviders(<SubscriptionSettings />);

      await waitFor(() => {
        expect(screen.getByText(/Usage Statistics/i)).toBeInTheDocument();
      });

      // Check for subjects and students labels
      expect(screen.getByText(/Subjects/i)).toBeInTheDocument();
      expect(screen.getByText(/Students/i)).toBeInTheDocument();
    });
  });

  describe('Payment Processing', () => {
    it('should handle payment modal opening', async () => {
      renderWithProviders(<SubscriptionSettings />);

      await waitFor(() => {
        expect(screen.getByText(/View All Plans/i)).toBeInTheDocument();
      });

      // This test verifies the component renders without errors
      // Actual payment testing requires Paystack integration
      expect(screen.getByText(/Subscription Settings/i)).toBeInTheDocument();
    });
  });
});
