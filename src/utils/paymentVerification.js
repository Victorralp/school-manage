/**
 * Payment Verification Utility
 * Handles Paystack payment verification and transaction processing
 */

import { doc, setDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getPaystackSecretKey } from './paystackConfig';
import { sendPaymentConfirmationEmail, createReceipt } from './emailNotifications';
import { logPaymentTransaction, logPlanUpgrade } from './subscriptionEventLogger';

/**
 * Verify payment with Paystack API
 * @param {string} reference - Paystack transaction reference
 * @returns {Promise<Object>} Verification result
 */
export const verifyPaystackPayment = async (reference) => {
  try {
    const secretKey = getPaystackSecretKey();
    
    if (!secretKey) {
      throw new Error('Paystack secret key not configured');
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Payment verification failed');
    }

    const data = await response.json();
    
    if (!data.status) {
      throw new Error(data.message || 'Payment verification failed');
    }

    return {
      success: true,
      data: data.data
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Create transaction record in Firestore
 * @param {string} teacherId - Teacher's user ID
 * @param {Object} paymentData - Payment details
 * @returns {Promise<string>} Transaction ID
 */
export const createTransactionRecord = async (teacherId, paymentData) => {
  try {
    const {
      reference,
      planTier,
      amount,
      currency,
      status,
      paystackResponse
    } = paymentData;

    const transactionRef = doc(db, 'transactions', reference);
    
    const transactionData = {
      teacherId,
      planTier,
      amount,
      currency,
      status: status || 'success',
      paystackReference: reference,
      paystackResponse: paystackResponse || {},
      createdAt: serverTimestamp(),
      completedAt: serverTimestamp()
    };

    await setDoc(transactionRef, transactionData);
    
    return reference;
  } catch (error) {
    console.error('Error creating transaction record:', error);
    throw new Error('Failed to create transaction record');
  }
};

/**
 * Update subscription with new plan details
 * @param {string} teacherId - Teacher's user ID
 * @param {Object} planDetails - New plan details
 * @returns {Promise<void>}
 */
export const updateSubscriptionPlan = async (teacherId, planDetails) => {
  try {
    const { planTier, subjectLimit, studentLimit, amount, currency } = planDetails;
    
    const subscriptionRef = doc(db, 'subscriptions', teacherId);
    
    // Get current subscription to preserve usage counts
    const subscriptionDoc = await getDoc(subscriptionRef);
    const currentData = subscriptionDoc.exists() ? subscriptionDoc.data() : {};

    // Calculate expiry date (30 days from now for monthly plans)
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    const updateData = {
      planTier,
      status: 'active',
      subjectLimit,
      studentLimit,
      amount,
      currency,
      startDate,
      expiryDate,
      lastPaymentDate: new Date(),
      updatedAt: serverTimestamp(),
      // Preserve current usage counts
      currentSubjects: currentData.currentSubjects || 0,
      currentStudents: currentData.currentStudents || 0
    };

    // If subscription doesn't exist, create it
    if (!subscriptionDoc.exists()) {
      updateData.teacherId = teacherId;
      updateData.createdAt = serverTimestamp();
      await setDoc(subscriptionRef, updateData);
    } else {
      await updateDoc(subscriptionRef, updateData);
    }
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw new Error('Failed to update subscription');
  }
};

/**
 * Process complete payment flow
 * @param {string} teacherId - Teacher's user ID
 * @param {Object} paymentDetails - Payment and plan details
 * @returns {Promise<Object>} Processing result
 */
export const processPayment = async (teacherId, paymentDetails) => {
  try {
    const {
      reference,
      planTier,
      planName,
      amount,
      currency,
      subjectLimit,
      studentLimit,
      userEmail,
      userName,
      verifyWithPaystack = true
    } = paymentDetails;

    // Step 1: Verify payment with Paystack (if enabled)
    if (verifyWithPaystack) {
      const verificationResult = await verifyPaystackPayment(reference);
      
      if (!verificationResult.success) {
        throw new Error(verificationResult.error || 'Payment verification failed');
      }

      // Check if payment was successful
      if (verificationResult.data.status !== 'success') {
        throw new Error('Payment was not successful');
      }

      // Verify amount matches
      const paidAmount = verificationResult.data.amount / 100; // Convert from kobo
      if (Math.abs(paidAmount - amount) > 0.01) {
        throw new Error('Payment amount mismatch');
      }
    }

    // Step 2: Create transaction record
    await createTransactionRecord(teacherId, {
      reference,
      planTier,
      amount,
      currency,
      status: 'success',
      paystackResponse: verifyWithPaystack ? paymentDetails.paystackResponse : {}
    });

    // Step 3: Get current plan for logging
    const subscriptionRef = doc(db, 'subscriptions', teacherId);
    const subscriptionDoc = await getDoc(subscriptionRef);
    const currentPlan = subscriptionDoc.exists() ? subscriptionDoc.data().planTier : 'free';

    // Step 4: Update subscription
    await updateSubscriptionPlan(teacherId, {
      planTier,
      subjectLimit,
      studentLimit,
      amount,
      currency
    });

    // Step 5: Log payment transaction
    await logPaymentTransaction(teacherId, planTier, amount, currency, reference, 'success');

    // Step 6: Log plan upgrade if applicable
    if (currentPlan !== planTier) {
      await logPlanUpgrade(teacherId, currentPlan, planTier, amount, currency, reference);
    }

    // Step 7: Create receipt
    const paymentDate = new Date();
    await createReceipt({
      teacherId,
      transactionId: reference,
      planName: planName || `${planTier} Plan`,
      amount,
      currency,
      paymentDate
    });

    // Step 8: Send confirmation email (non-blocking)
    if (userEmail) {
      sendPaymentConfirmationEmail({
        userEmail,
        userName,
        transactionId: reference,
        planName: planName || `${planTier} Plan`,
        planTier,
        amount,
        currency,
        subjectLimit,
        studentLimit,
        paymentDate
      }).catch(err => {
        console.error('Failed to send confirmation email:', err);
        // Don't fail the payment if email fails
      });
    }

    return {
      success: true,
      message: 'Payment processed successfully',
      transactionId: reference
    };
  } catch (error) {
    console.error('Payment processing error:', error);
    
    // Log failed transaction
    try {
      await createTransactionRecord(teacherId, {
        reference: paymentDetails.reference,
        planTier: paymentDetails.planTier,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
        status: 'failed',
        paystackResponse: { error: error.message }
      });
    } catch (logError) {
      console.error('Failed to log transaction error:', logError);
    }

    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Handle webhook payment confirmation (for backend use)
 * This function should be called from a Cloud Function or backend endpoint
 * @param {Object} webhookData - Paystack webhook payload
 * @returns {Promise<Object>} Processing result
 */
export const handlePaymentWebhook = async (webhookData) => {
  try {
    const { event, data } = webhookData;

    // Only process successful charge events
    if (event !== 'charge.success') {
      return {
        success: false,
        message: 'Event not processed'
      };
    }

    // Extract metadata
    const metadata = data.metadata || {};
    const teacherId = metadata.teacher_id;
    const planTier = metadata.plan_tier;

    if (!teacherId || !planTier) {
      throw new Error('Missing required metadata');
    }

    // Get plan configuration to determine limits
    const planConfigRef = doc(db, 'config', 'plans');
    const planConfigDoc = await getDoc(planConfigRef);
    
    if (!planConfigDoc.exists()) {
      throw new Error('Plan configuration not found');
    }

    const plans = planConfigDoc.data();
    const plan = plans[planTier];

    if (!plan) {
      throw new Error('Invalid plan tier');
    }

    // Determine actual limits
    const subjectLimit = typeof plan.subjectLimit === 'object' 
      ? plan.subjectLimit.max 
      : plan.subjectLimit;
    const studentLimit = typeof plan.studentLimit === 'object'
      ? plan.studentLimit.max
      : plan.studentLimit;

    // Process payment
    const result = await processPayment(teacherId, {
      reference: data.reference,
      planTier,
      amount: data.amount / 100, // Convert from kobo
      currency: data.currency,
      subjectLimit,
      studentLimit,
      verifyWithPaystack: false, // Already verified by webhook
      paystackResponse: data
    });

    return result;
  } catch (error) {
    console.error('Webhook processing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  verifyPaystackPayment,
  createTransactionRecord,
  updateSubscriptionPlan,
  processPayment,
  handlePaymentWebhook
};
