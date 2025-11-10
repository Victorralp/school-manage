import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  verifyPaystackPayment,
  createTransactionRecord,
  updateSubscriptionPlan,
  processPayment
} from '../paymentVerification';

// Mock Firebase
vi.mock('../../firebase/config', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((db, collection, id) => ({ collection, id })),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  getDoc: vi.fn(),
  serverTimestamp: vi.fn(() => new Date())
}));

vi.mock('../paystackConfig', () => ({
  getPaystackSecretKey: vi.fn(() => 'sk_test_123')
}));

vi.mock('../emailNotifications', () => ({
  sendPaymentConfirmationEmail: vi.fn(() => Promise.resolve('email-123')),
  createReceipt: vi.fn(() => Promise.resolve('receipt-123'))
}));

describe('Payment Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('verifyPaystackPayment', () => {
    it('should successfully verify payment', async () => {
      const mockResponse = {
        status: true,
        message: 'Verification successful',
        data: {
          status: 'success',
          reference: 'TEST_REF_123',
          amount: 150000,
          currency: 'NGN'
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await verifyPaystackPayment('TEST_REF_123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.paystack.co/transaction/verify/TEST_REF_123',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer sk_test_123'
          })
        })
      );
    });

    it('should handle verification failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Transaction not found' })
      });

      const result = await verifyPaystackPayment('INVALID_REF');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Transaction not found');
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await verifyPaystackPayment('TEST_REF_123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('createTransactionRecord', () => {
    it('should create transaction record in Firestore', async () => {
      const { setDoc } = await import('firebase/firestore');
      
      const paymentData = {
        reference: 'TEST_REF_123',
        planTier: 'premium',
        amount: 1500,
        currency: 'NGN',
        status: 'success',
        paystackResponse: { data: 'test' }
      };

      const result = await createTransactionRecord('user-123', paymentData);

      expect(result).toBe('TEST_REF_123');
      expect(setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ collection: 'transactions', id: 'TEST_REF_123' }),
        expect.objectContaining({
          teacherId: 'user-123',
          planTier: 'premium',
          amount: 1500,
          currency: 'NGN',
          status: 'success'
        })
      );
    });
  });

  describe('updateSubscriptionPlan', () => {
    it('should update existing subscription', async () => {
      const { getDoc, updateDoc } = await import('firebase/firestore');
      
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          currentSubjects: 2,
          currentStudents: 5
        })
      });

      const planDetails = {
        planTier: 'premium',
        subjectLimit: 6,
        studentLimit: 20,
        amount: 1500,
        currency: 'NGN'
      };

      await updateSubscriptionPlan('user-123', planDetails);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ collection: 'subscriptions', id: 'user-123' }),
        expect.objectContaining({
          planTier: 'premium',
          status: 'active',
          subjectLimit: 6,
          studentLimit: 20,
          currentSubjects: 2,
          currentStudents: 5
        })
      );
    });

    it('should create new subscription if none exists', async () => {
      const { getDoc, setDoc } = await import('firebase/firestore');
      
      getDoc.mockResolvedValueOnce({
        exists: () => false
      });

      const planDetails = {
        planTier: 'premium',
        subjectLimit: 6,
        studentLimit: 20,
        amount: 1500,
        currency: 'NGN'
      };

      await updateSubscriptionPlan('user-123', planDetails);

      expect(setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ collection: 'subscriptions', id: 'user-123' }),
        expect.objectContaining({
          teacherId: 'user-123',
          planTier: 'premium',
          status: 'active',
          currentSubjects: 0,
          currentStudents: 0
        })
      );
    });
  });

  describe('processPayment', () => {
    it('should process successful payment flow', async () => {
      const { setDoc, getDoc, updateDoc } = await import('firebase/firestore');
      
      // Mock Paystack verification
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: true,
          data: {
            status: 'success',
            amount: 150000,
            reference: 'TEST_REF_123'
          }
        })
      });

      // Mock existing subscription
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          currentSubjects: 2,
          currentStudents: 5
        })
      });

      const paymentDetails = {
        reference: 'TEST_REF_123',
        planTier: 'premium',
        planName: 'Premium Plan',
        amount: 1500,
        currency: 'NGN',
        subjectLimit: 6,
        studentLimit: 20,
        userEmail: 'test@example.com',
        userName: 'Test User',
        verifyWithPaystack: true
      };

      const result = await processPayment('user-123', paymentDetails);

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('TEST_REF_123');
      expect(setDoc).toHaveBeenCalled(); // Transaction and receipt created
      expect(updateDoc).toHaveBeenCalled(); // Subscription updated
    });

    it('should handle payment verification failure', async () => {
      const { setDoc } = await import('firebase/firestore');
      
      // Mock failed Paystack verification
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid transaction' })
      });

      const paymentDetails = {
        reference: 'INVALID_REF',
        planTier: 'premium',
        amount: 1500,
        currency: 'NGN',
        subjectLimit: 6,
        studentLimit: 20,
        verifyWithPaystack: true
      };

      const result = await processPayment('user-123', paymentDetails);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      // Should still log failed transaction
      expect(setDoc).toHaveBeenCalled();
    });

    it('should handle amount mismatch', async () => {
      // Mock Paystack verification with different amount
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: true,
          data: {
            status: 'success',
            amount: 100000, // Different from expected 150000
            reference: 'TEST_REF_123'
          }
        })
      });

      const paymentDetails = {
        reference: 'TEST_REF_123',
        planTier: 'premium',
        amount: 1500,
        currency: 'NGN',
        subjectLimit: 6,
        studentLimit: 20,
        verifyWithPaystack: true
      };

      const result = await processPayment('user-123', paymentDetails);

      expect(result.success).toBe(false);
      expect(result.error).toContain('mismatch');
    });

    it('should skip Paystack verification when disabled', async () => {
      const { setDoc, getDoc, updateDoc } = await import('firebase/firestore');
      
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          currentSubjects: 2,
          currentStudents: 5
        })
      });

      const paymentDetails = {
        reference: 'TEST_REF_123',
        planTier: 'premium',
        amount: 1500,
        currency: 'NGN',
        subjectLimit: 6,
        studentLimit: 20,
        verifyWithPaystack: false
      };

      const result = await processPayment('user-123', paymentDetails);

      expect(result.success).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalled();
    });
  });
});
