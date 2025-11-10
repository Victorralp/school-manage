/**
 * School Payment Verification
 * Handles payment verification for school-based subscriptions
 */

import { updateSchoolPlan, createTransaction, updateTransaction } from '../firebase/schoolService';
import { PLAN_CONFIG, getActualLimit } from '../firebase/subscriptionModels';

/**
 * Process payment for school subscription
 * @param {string} schoolId - The school's ID
 * @param {object} paymentData - Payment data from Paystack
 * @param {boolean} isSchoolPayment - Flag to indicate school payment (default: true)
 * @returns {Promise<object>} - Processing result
 */
export async function processSchoolPayment(schoolId, paymentData, isSchoolPayment = true) {
  try {
    const {
      reference,
      planTier,
      amount,
      currency,
      paidByUserId,
      paystackResponse
    } = paymentData;

    // Verify payment with Paystack
    const verificationResult = await verifyPaystackTransaction(reference);

    if (!verificationResult.success) {
      throw new Error('Payment verification failed');
    }

    // Create transaction record
    const transactionId = await createTransaction({
      schoolId,
      paidByUserId,
      planTier,
      amount,
      currency,
      status: 'pending',
      paystackReference: reference,
      paystackResponse: verificationResult.data
    });

    // Get plan configuration
    const plan = PLAN_CONFIG[planTier];
    if (!plan) {
      throw new Error('Invalid plan tier');
    }

    // Calculate expiry date (30 days from now for monthly plans)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    // Update school subscription
    await updateSchoolPlan(schoolId, planTier, {
      subjectLimit: getActualLimit(plan.subjectLimit),
      studentLimit: getActualLimit(plan.studentLimit),
      amount,
      currency,
      expiryDate,
      lastPaymentDate: new Date(),
      paystackCustomerCode: verificationResult.data.customer?.customer_code || null,
      paystackSubscriptionCode: verificationResult.data.subscription?.subscription_code || null
    });

    // Update transaction status
    await updateTransaction(transactionId, 'success', verificationResult.data);

    return {
      success: true,
      transactionId,
      message: 'Payment processed successfully',
      schoolId,
      planTier,
      expiryDate
    };

  } catch (error) {
    console.error('Error processing school payment:', error);
    return {
      success: false,
      error: error.message,
      message: 'Payment processing failed'
    };
  }
}

/**
 * Verify transaction with Paystack
 * @param {string} reference - Paystack transaction reference
 * @returns {Promise<object>} - Verification result
 */
async function verifyPaystackTransaction(reference) {
  try {
    const secretKey = import.meta.env.VITE_PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      throw new Error('Paystack secret key not configured');
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = await response.json();

    if (!response.ok || !result.status) {
      throw new Error(result.message || 'Verification failed');
    }

    // Check if payment was successful
    if (result.data.status !== 'success') {
      throw new Error('Payment was not successful');
    }

    return {
      success: true,
      data: result.data
    };

  } catch (error) {
    console.error('Error verifying Paystack transaction:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle payment webhook from Paystack
 * This should be called from a backend endpoint
 * @param {object} webhookData - Webhook data from Paystack
 * @returns {Promise<object>} - Processing result
 */
export async function handlePaymentWebhook(webhookData) {
  try {
    const { event, data } = webhookData;

    // Only process successful charges
    if (event !== 'charge.success') {
      return {
        success: true,
        message: 'Event ignored'
      };
    }

    // Extract metadata
    const { schoolId, planTier, paidByUserId } = data.metadata || {};

    if (!schoolId || !planTier || !paidByUserId) {
      throw new Error('Missing required metadata');
    }

    // Process the payment
    const result = await processSchoolPayment(schoolId, {
      reference: data.reference,
      planTier,
      amount: data.amount / 100, // Paystack amounts are in kobo/cents
      currency: data.currency,
      paidByUserId,
      paystackResponse: data
    });

    return result;

  } catch (error) {
    console.error('Error handling payment webhook:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Initialize Paystack payment for school upgrade
 * @param {object} paymentDetails - Payment details
 * @returns {object} - Paystack configuration
 */
export function initializeSchoolPayment(paymentDetails) {
  const {
    schoolId,
    schoolName,
    planTier,
    amount,
    currency,
    paidByUserId,
    email
  } = paymentDetails;

  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

  if (!publicKey) {
    throw new Error('Paystack public key not configured');
  }

  return {
    publicKey,
    email,
    amount: amount * 100, // Convert to kobo/cents
    currency,
    ref: `${schoolId}_${Date.now()}`,
    metadata: {
      schoolId,
      schoolName,
      planTier,
      paidByUserId,
      custom_fields: [
        {
          display_name: 'School Name',
          variable_name: 'school_name',
          value: schoolName
        },
        {
          display_name: 'Plan',
          variable_name: 'plan_tier',
          value: planTier
        }
      ]
    },
    onSuccess: (reference) => {
      console.log('Payment successful:', reference);
      return reference;
    },
    onClose: () => {
      console.log('Payment modal closed');
    }
  };
}

/**
 * Calculate prorated amount for plan upgrade
 * @param {object} currentPlan - Current plan details
 * @param {object} newPlan - New plan details
 * @param {Date} expiryDate - Current plan expiry date
 * @returns {number} - Prorated amount
 */
export function calculateProratedAmount(currentPlan, newPlan, expiryDate) {
  if (!expiryDate) {
    // No current paid plan, charge full amount
    return newPlan.price;
  }

  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)));
  const daysInMonth = 30;

  // Calculate unused portion of current plan
  const unusedAmount = (currentPlan.price * daysRemaining) / daysInMonth;

  // Calculate prorated new plan amount
  const proratedAmount = newPlan.price - unusedAmount;

  return Math.max(0, proratedAmount);
}
