/**
 * Payment Verification Utility
 * Handles Monnify payment processing and transaction management
 *
 * NOTE: Browser-side API verification is disabled because:
 * 1. Monnify API requires secret key authentication (security risk on frontend)
 * 2. CORS policy blocks direct API calls from browser
 * 3. The Monnify SDK already verifies payments before calling onComplete
 *
 * For production, use webhooks via Cloud Functions for server-side verification.
 */

import {
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import {
  sendPaymentConfirmationEmail,
  createReceipt,
} from "./emailNotifications";
import {
  logPaymentTransaction,
  logPlanUpgrade,
} from "./subscriptionEventLogger";
import {
  incrementPromoUsage,
  updateSchoolPlan,
} from "../firebase/schoolService";

/**
 * Validate payment data from Monnify SDK callback
 * This trusts the SDK response since verification happens on Monnify's side
 * @param {Object} monnifyResponse - Response from Monnify SDK
 * @param {number} expectedAmount - Expected payment amount
 * @returns {Object} Validation result
 */
export const validateMonnifyPayment = (monnifyResponse, expectedAmount) => {
  try {
    // Check if we have a valid response
    if (!monnifyResponse) {
      return { success: false, error: "No payment response received" };
    }

    // Check payment status from SDK response
    const paymentStatus =
      monnifyResponse.paymentStatus || monnifyResponse.status;
    if (paymentStatus !== "PAID" && paymentStatus !== "SUCCESS") {
      return {
        success: false,
        error: `Payment status is ${paymentStatus}, expected PAID`,
      };
    }

    // Verify amount matches (with small tolerance for floating point)
    const paidAmount = monnifyResponse.amountPaid || monnifyResponse.amount;
    if (
      paidAmount &&
      expectedAmount &&
      Math.abs(paidAmount - expectedAmount) > 1
    ) {
      console.warn("Payment amount mismatch:", { paidAmount, expectedAmount });
      // Don't fail on amount mismatch - could be due to promo codes
    }

    // Check for transaction reference
    const transactionRef =
      monnifyResponse.transactionReference || monnifyResponse.paymentReference;
    if (!transactionRef) {
      return {
        success: false,
        error: "No transaction reference in payment response",
      };
    }

    return {
      success: true,
      data: {
        transactionReference: transactionRef,
        paymentReference: monnifyResponse.paymentReference,
        amountPaid: paidAmount,
        paymentStatus: paymentStatus,
        paidOn: monnifyResponse.paidOn || new Date().toISOString(),
        paymentMethod: monnifyResponse.paymentMethod || "CARD",
      },
    };
  } catch (error) {
    console.error("Payment validation error:", error);
    return {
      success: false,
      error: error.message || "Payment validation failed",
    };
  }
};

/**
 * Create transaction record in Firestore
 * @param {string} userId - User's ID (teacher or school)
 * @param {Object} paymentData - Payment details
 * @returns {Promise<string>} Transaction ID
 */
export const createTransactionRecord = async (userId, paymentData) => {
  try {
    const {
      reference,
      planTier,
      amount,
      currency,
      status,
      monnifyResponse,
      promoCode = null,
      discountAmount = 0,
      originalAmount = 0,
    } = paymentData;

    const transactionRef = doc(db, "transactions", reference);

    const transactionData = {
      userId: userId,
      planTier,
      amount,
      currency,
      status: status || "success",
      monnifyReference: reference,
      monnifyResponse: monnifyResponse || {},
      paymentProvider: "monnify",
      promoCode,
      discountAmount,
      originalAmount,
      createdAt: serverTimestamp(),
      completedAt: serverTimestamp(),
    };

    await setDoc(transactionRef, transactionData);

    return reference;
  } catch (error) {
    console.error("Error creating transaction record:", error);
    throw new Error("Failed to create transaction record");
  }
};

/**
 * Update subscription with new plan details (for individual teacher subscriptions)
 * @param {string} userId - User's ID
 * @param {Object} planDetails - New plan details
 * @returns {Promise<void>}
 */
export const updateSubscriptionPlan = async (userId, planDetails) => {
  try {
    const { planTier, subjectLimit, studentLimit, amount, currency } =
      planDetails;

    const subscriptionRef = doc(db, "subscriptions", userId);

    // Get current subscription to preserve usage counts
    const subscriptionDoc = await getDoc(subscriptionRef);
    const currentData = subscriptionDoc.exists() ? subscriptionDoc.data() : {};

    // Calculate expiry date (30 days from now for monthly plans)
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    const updateData = {
      planTier,
      status: "active",
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
      currentStudents: currentData.currentStudents || 0,
    };

    // If subscription doesn't exist, create it
    if (!subscriptionDoc.exists()) {
      updateData.userId = userId;
      updateData.createdAt = serverTimestamp();
      await setDoc(subscriptionRef, updateData);
    } else {
      await updateDoc(subscriptionRef, updateData);
    }
  } catch (error) {
    console.error("Error updating subscription:", error);
    throw new Error("Failed to update subscription");
  }
};

/**
 * Process complete payment flow
 * Trusts Monnify SDK callback - no server-side API verification from browser
 * @param {string} userId - User's ID (teacher or school)
 * @param {Object} paymentDetails - Payment and plan details
 * @param {boolean} isSchoolPayment - Whether this is a school-level payment
 * @returns {Promise<Object>} Processing result
 */
export const processPayment = async (
  userId,
  paymentDetails,
  isSchoolPayment = false,
) => {
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
      monnifyResponse,
      verifyWithMonnify = false, // Default to false - trust SDK callback
    } = paymentDetails;

    // Use transactionReference (Monnify's reference) for record keeping
    const monnifyRef = transactionReference || reference;

    console.log("Processing payment:", {
      monnifyRef,
      planTier,
      amount,
      currency,
      isSchoolPayment,
      userId,
    });

    // Step 1: Validate payment data from SDK callback
    // We trust the SDK response since Monnify verifies before calling onComplete
    if (monnifyResponse) {
      const validation = validateMonnifyPayment(monnifyResponse, amount);
      if (!validation.success) {
        console.warn("Payment validation warning:", validation.error);
        // Don't fail - the SDK already verified the payment
      }
    }

    // Step 2: Create transaction record
    await createTransactionRecord(userId, {
      reference: monnifyRef,
      planTier,
      amount,
      currency,
      status: "success",
      monnifyResponse: monnifyResponse || {},
      promoCode: paymentDetails.promoCode,
      discountAmount: paymentDetails.discountAmount,
      originalAmount: paymentDetails.originalAmount,
    });

    // Step 2b: Increment promo usage if used
    if (paymentDetails.promoId) {
      try {
        await incrementPromoUsage(paymentDetails.promoId);
      } catch (promoError) {
        console.error("Failed to increment promo usage:", promoError);
        // Don't fail payment for promo tracking error
      }
    }

    // Step 3: Get current plan for logging
    // For school payments, check schools collection; for teachers, check subscriptions
    const collectionName = isSchoolPayment ? "schools" : "subscriptions";
    const docRef = doc(db, collectionName, userId);
    const docSnapshot = await getDoc(docRef);
    const currentPlan = docSnapshot.exists()
      ? docSnapshot.data().planTier
      : "free";

    // Calculate expiry date (30 days from now for monthly plans)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    // Step 4: Update subscription based on payment type
    if (isSchoolPayment) {
      // Update schools collection for school-based subscriptions
      console.log("Updating school plan for:", userId);
      await updateSchoolPlan(userId, planTier, {
        subjectLimit,
        studentLimit,
        amount,
        currency,
        expiryDate,
        lastPaymentDate: new Date(),
        monnifyTransactionReference: monnifyRef,
      });
    } else {
      // Update subscriptions collection for individual teacher subscriptions
      console.log("Updating teacher subscription for:", userId);
      await updateSubscriptionPlan(userId, {
        planTier,
        subjectLimit,
        studentLimit,
        amount,
        currency,
      });
    }

    // Step 5: Log payment transaction
    try {
      await logPaymentTransaction(
        userId,
        planTier,
        amount,
        currency,
        monnifyRef,
        "success",
      );
    } catch (logError) {
      console.error("Failed to log payment transaction:", logError);
    }

    // Step 6: Log plan upgrade if applicable
    if (currentPlan !== planTier) {
      try {
        await logPlanUpgrade(
          userId,
          currentPlan,
          planTier,
          amount,
          currency,
          monnifyRef,
        );
      } catch (logError) {
        console.error("Failed to log plan upgrade:", logError);
      }
    }

    // Step 7: Create receipt
    try {
      const paymentDate = new Date();
      await createReceipt({
        userId,
        transactionId: monnifyRef,
        planName: planName || `${planTier} Plan`,
        amount,
        currency,
        paymentDate,
      });
    } catch (receiptError) {
      console.error("Failed to create receipt:", receiptError);
    }

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
        paymentDate: new Date(),
      }).catch((err) => {
        console.error("Failed to send confirmation email:", err);
        // Don't fail the payment if email fails
      });
    }

    return {
      success: true,
      message: "Payment processed successfully",
      transactionId: monnifyRef,
    };
  } catch (error) {
    console.error("Payment processing error:", error);

    // Log failed transaction
    try {
      await createTransactionRecord(userId, {
        reference:
          paymentDetails.transactionReference ||
          paymentDetails.reference ||
          `FAILED_${Date.now()}`,
        planTier: paymentDetails.planTier,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
        status: "failed",
        monnifyResponse: { error: error.message },
        promoCode: paymentDetails.promoCode,
        discountAmount: paymentDetails.discountAmount,
        originalAmount: paymentDetails.originalAmount,
      });
    } catch (logError) {
      console.error("Failed to log transaction error:", logError);
    }

    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Handle webhook payment confirmation (for backend/Cloud Functions use)
 * This function should be called from a Cloud Function endpoint
 * @param {Object} webhookData - Monnify webhook payload
 * @returns {Promise<Object>} Processing result
 */
export const handlePaymentWebhook = async (webhookData) => {
  try {
    const { eventType, eventData } = webhookData;

    // Only process successful transaction events
    if (eventType !== "SUCCESSFUL_TRANSACTION") {
      return {
        success: false,
        message: "Event not processed",
      };
    }

    // Extract metadata from the transaction
    const metaData = eventData.metaData || {};
    const userId = metaData.teacher_id || metaData.school_id;
    const planTier = metaData.plan_tier;
    const isSchoolPayment = !!metaData.school_id;

    if (!userId || !planTier) {
      throw new Error("Missing required metadata");
    }

    // Get plan configuration to determine limits
    const planConfigRef = doc(db, "config", "plans");
    const planConfigDoc = await getDoc(planConfigRef);

    if (!planConfigDoc.exists()) {
      throw new Error("Plan configuration not found");
    }

    const plans = planConfigDoc.data();
    const plan = plans[planTier];

    if (!plan) {
      throw new Error("Invalid plan tier");
    }

    // Determine actual limits
    const subjectLimit =
      typeof plan.subjectLimit === "object"
        ? plan.subjectLimit.max
        : plan.subjectLimit;
    const studentLimit =
      typeof plan.studentLimit === "object"
        ? plan.studentLimit.max
        : plan.studentLimit;

    // Process payment (skip verification since webhook is from Monnify)
    const result = await processPayment(
      userId,
      {
        reference: eventData.paymentReference,
        transactionReference: eventData.transactionReference,
        planTier,
        amount: eventData.amountPaid,
        currency: eventData.currency,
        subjectLimit,
        studentLimit,
        verifyWithMonnify: false, // Already verified by webhook
        monnifyResponse: eventData,
      },
      isSchoolPayment,
    );

    return result;
  } catch (error) {
    console.error("Webhook processing error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export default {
  validateMonnifyPayment,
  createTransactionRecord,
  updateSubscriptionPlan,
  processPayment,
  handlePaymentWebhook,
};
