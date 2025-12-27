/**
 * School Payment Verification
 * Handles payment verification for school-based subscriptions using Monnify
 */

import {
  updateSchoolPlan,
  createTransaction,
  updateTransaction,
} from "../firebase/schoolService";
import { PLAN_CONFIG, getActualLimit } from "../firebase/subscriptionModels";
import {
  getMonnifyAuthHeader,
  getMonnifyApiBaseUrl,
  getMonnifyApiKey,
  getMonnifyContractCode,
  isMonnifyTestMode,
  generateTransactionReference,
  formatCurrency,
} from "./monnifyConfig";

/**
 * Process payment for school subscription
 * @param {string} schoolId - The school's ID
 * @param {object} paymentData - Payment data from Monnify
 * @param {boolean} isSchoolPayment - Flag to indicate school payment (default: true)
 * @returns {Promise<object>} - Processing result
 */
export async function processSchoolPayment(
  schoolId,
  paymentData,
  isSchoolPayment = true,
) {
  try {
    const {
      reference,
      transactionReference,
      planTier,
      amount,
      currency,
      paidByUserId,
      monnifyResponse,
    } = paymentData;

    // Use transactionReference for Monnify verification
    const monnifyRef = transactionReference || reference;

    // Verify payment with Monnify
    const verificationResult = await verifyMonnifyTransaction(monnifyRef);

    if (!verificationResult.success) {
      throw new Error("Payment verification failed");
    }

    // Create transaction record
    const transactionId = await createTransaction({
      schoolId,
      paidByUserId,
      planTier,
      amount,
      currency,
      status: "pending",
      monnifyReference: monnifyRef,
      monnifyResponse: verificationResult.data,
      paymentProvider: "monnify",
    });

    // Get plan configuration
    const plan = PLAN_CONFIG[planTier];
    if (!plan) {
      throw new Error("Invalid plan tier");
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
      monnifyCustomerEmail: verificationResult.data.customerEmail || null,
      monnifyTransactionReference: monnifyRef,
    });

    // Update transaction status
    await updateTransaction(transactionId, "success", verificationResult.data);

    return {
      success: true,
      transactionId,
      message: "Payment processed successfully",
      schoolId,
      planTier,
      expiryDate,
    };
  } catch (error) {
    console.error("Error processing school payment:", error);
    return {
      success: false,
      error: error.message,
      message: "Payment processing failed",
    };
  }
}

/**
 * Verify transaction with Monnify
 * @param {string} transactionReference - Monnify transaction reference
 * @returns {Promise<object>} - Verification result
 */
async function verifyMonnifyTransaction(transactionReference) {
  try {
    const authHeader = getMonnifyAuthHeader();
    const baseUrl = getMonnifyApiBaseUrl();
    const url = `${baseUrl}/api/v2/transactions/${encodeURIComponent(transactionReference)}`;

    console.log("Verifying Monnify Transaction:", {
      transactionReference,
      baseUrl,
      url,
    });

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (!response.ok || !result.requestSuccessful) {
      throw new Error(result.responseMessage || "Verification failed");
    }

    // Check if payment was successful
    if (result.responseBody.paymentStatus !== "PAID") {
      throw new Error(
        `Payment status is ${result.responseBody.paymentStatus}, expected PAID`,
      );
    }

    return {
      success: true,
      data: result.responseBody,
    };
  } catch (error) {
    console.error("Error verifying Monnify transaction:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Handle payment webhook from Monnify
 * This should be called from a backend endpoint (Cloud Function)
 * @param {object} webhookData - Webhook data from Monnify
 * @returns {Promise<object>} - Processing result
 */
export async function handlePaymentWebhook(webhookData) {
  try {
    const { eventType, eventData } = webhookData;

    // Only process successful transaction events
    if (eventType !== "SUCCESSFUL_TRANSACTION") {
      return {
        success: true,
        message: "Event ignored",
      };
    }

    // Extract metadata from the transaction
    const metaData = eventData.metaData || {};
    const { schoolId, planTier, paidByUserId } = metaData;

    if (!schoolId || !planTier || !paidByUserId) {
      throw new Error("Missing required metadata");
    }

    // Process the payment
    const result = await processSchoolPayment(schoolId, {
      reference: eventData.paymentReference,
      transactionReference: eventData.transactionReference,
      planTier,
      amount: eventData.amountPaid,
      currency: eventData.currency,
      paidByUserId,
      monnifyResponse: eventData,
    });

    return result;
  } catch (error) {
    console.error("Error handling payment webhook:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Initialize Monnify payment configuration for school upgrade
 * @param {object} paymentDetails - Payment details
 * @returns {object} - Monnify configuration
 */
export function initializeSchoolPayment(paymentDetails) {
  const {
    schoolId,
    schoolName,
    planTier,
    amount,
    currency,
    paidByUserId,
    email,
    customerName,
  } = paymentDetails;

  const apiKey = getMonnifyApiKey();
  const contractCode = getMonnifyContractCode();

  if (!apiKey || !contractCode) {
    throw new Error(
      "Monnify configuration not complete. Please check API key and contract code.",
    );
  }

  const reference = generateTransactionReference(schoolId, planTier);

  return {
    amount,
    currency,
    reference,
    customerFullName: customerName || schoolName,
    customerEmail: email,
    apiKey,
    contractCode,
    paymentDescription: `${planTier.charAt(0).toUpperCase() + planTier.slice(1)} Plan - ${schoolName}`,
    isTestMode: isMonnifyTestMode(),
    metadata: {
      schoolId,
      schoolName,
      planTier,
      paidByUserId,
      custom_fields: [
        {
          display_name: "School Name",
          variable_name: "school_name",
          value: schoolName,
        },
        {
          display_name: "Plan",
          variable_name: "plan_tier",
          value: planTier,
        },
      ],
    },
    onSuccess: (response) => {
      console.log("Payment successful:", response);
      return response;
    },
    onClose: () => {
      console.log("Payment modal closed");
    },
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
  const daysRemaining = Math.max(
    0,
    Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)),
  );
  const daysInMonth = 30;

  // Calculate unused portion of current plan
  const unusedAmount = (currentPlan.price * daysRemaining) / daysInMonth;

  // Calculate prorated new plan amount
  const proratedAmount = newPlan.price - unusedAmount;

  return Math.max(0, proratedAmount);
}

/**
 * Get formatted payment amount for display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (NGN or USD)
 * @returns {string} - Formatted amount string
 */
export function getFormattedAmount(amount, currency = "NGN") {
  return formatCurrency(amount, currency);
}

export default {
  processSchoolPayment,
  handlePaymentWebhook,
  initializeSchoolPayment,
  calculateProratedAmount,
  getFormattedAmount,
};
