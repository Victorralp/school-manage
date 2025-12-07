/**
 * Payment Verification Utility
 * Handles Monnify payment verification and transaction processing
 */

import { doc, setDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getMonnifyAuthHeader, getMonnifyApiBaseUrl } from './monnifyConfig';
import { sendPaymentConfirmationEmail, createReceipt } from './emailNotifications';
import { logPaymentTransaction, logPlanUpgrade } from './subscriptionEventLogger';

/**
 * Verify payment with Monnify API
 * @param {string} transactionReference - Monnify transaction reference
 * @returns {Promise<Object>} Verification result
 */
export const verifyMonnifyPayment = async (transactionReference) => {
  try {
    const authHeader = getMonnifyAuthHeader();
    const baseUrl = getMonnifyApiBaseUrl();

    const response = await fetch(
      `${baseUrl}/api/v2/transactions/${encodeURIComponent(transactionReference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.responseMessage || 'Payment verification failed');
    }

    const data = await response.json();

    if (!data.requestSuccessful) {
      throw new Error(data.responseMessage || 'Payment verification failed');
    }

    return {
      success: true,
      data: data.responseBody
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
      monnifyResponse
    } = paymentData;

    const transactionRef = doc(db, 'transactions', reference);

    const transactionData = {
      teacherId,
      planTier,
      amount,
      currency,
      status: status || 'success',
      monnifyReference: reference,
      monnifyResponse: monnifyResponse || {},
      paymentProvider: 'monnify',
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
 * @param {boolean} isSchoolPayment - Whether this is a school-level payment
 * @returns {Promise<Object>} Processing result
 */
export const processPayment = async (teacherId, paymentDetails, isSchoolPayment = false) => {
  try {
    const {
      reference,
      transactionReference,
      planTier,
      planName,
      amount,
      currency,
      subjectLimit,
      studentLimit,
      userEmail,
      userName,
      verifyWithMonnify = true
    } = paymentDetails;

    // Use transactionReference (Monnify's reference) for verification
    const monnifyRef = transactionReference || reference;

    // Step 1: Verify payment with Monnify (if enabled)
    if (verifyWithMonnify) {
      const verificationResult = await verifyMonnifyPayment(monnifyRef);

      if (!verificationResult.success) {
        throw new Error(verificationResult.error || 'Payment verification failed');
      }

      // Check if payment was successful
      const paymentStatus = verificationResult.data.paymentStatus;
      if (paymentStatus !== 'PAID') {
        throw new Error(`Payment status is ${paymentStatus}, expected PAID`);
      }

      // Verify amount matches
      const paidAmount = verificationResult.data.amountPaid;
      if (Math.abs(paidAmount - amount) > 0.01) {
        throw new Error('Payment amount mismatch');
      }
    }

    // Step 2: Create transaction record
    await createTransactionRecord(teacherId, {
      reference: monnifyRef,
      planTier,
      amount,
      currency,
      status: 'success',
      monnifyResponse: paymentDetails.monnifyResponse || {}
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
    await logPaymentTransaction(teacherId, planTier, amount, currency, monnifyRef, 'success');

    // Step 6: Log plan upgrade if applicable
    if (currentPlan !== planTier) {
      await logPlanUpgrade(teacherId, currentPlan, planTier, amount, currency, monnifyRef);
    }

    // Step 7: Create receipt
    const paymentDate = new Date();
    await createReceipt({
      teacherId,
      transactionId: monnifyRef,
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
        transactionId: monnifyRef,
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
      transactionId: monnifyRef
    };
  } catch (error) {
    console.error('Payment processing error:', error);

    // Log failed transaction
    try {
      await createTransactionRecord(teacherId, {
        reference: paymentDetails.transactionReference || paymentDetails.reference,
        planTier: paymentDetails.planTier,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
        status: 'failed',
        monnifyResponse: { error: error.message }
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
 * @param {Object} webhookData - Monnify webhook payload
 * @returns {Promise<Object>} Processing result
 */
export const handlePaymentWebhook = async (webhookData) => {
  try {
    const { eventType, eventData } = webhookData;

    // Only process successful transaction events
    if (eventType !== 'SUCCESSFUL_TRANSACTION') {
      return {
        success: false,
        message: 'Event not processed'
      };
    }

    // Extract metadata from the transaction
    const metaData = eventData.metaData || {};
    const teacherId = metaData.teacher_id;
    const planTier = metaData.plan_tier;

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
      reference: eventData.paymentReference,
      transactionReference: eventData.transactionReference,
      planTier,
      amount: eventData.amountPaid,
      currency: eventData.currency,
      subjectLimit,
      studentLimit,
      verifyWithMonnify: false, // Already verified by webhook
      monnifyResponse: eventData
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
  verifyMonnifyPayment,
  createTransactionRecord,
  updateSubscriptionPlan,
  processPayment,
  handlePaymentWebhook
};
