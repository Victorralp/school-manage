import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Log subscription events to Firestore
 * @param {Object} eventData - Event data to log
 * @param {string} eventData.teacherId - Teacher's user ID
 * @param {string} eventData.eventType - Type of event (upgrade, downgrade, payment, cancellation, etc.)
 * @param {string} eventData.fromPlan - Previous plan tier (for upgrades/downgrades)
 * @param {string} eventData.toPlan - New plan tier (for upgrades/downgrades)
 * @param {number} eventData.amount - Payment amount (for payment events)
 * @param {string} eventData.currency - Currency (NGN/USD)
 * @param {string} eventData.transactionId - Payment transaction ID
 * @param {Object} eventData.metadata - Additional metadata
 */
export const logSubscriptionEvent = async (eventData) => {
  try {
    const eventsRef = collection(db, "subscriptionEvents");
    
    const eventDoc = {
      teacherId: eventData.teacherId,
      eventType: eventData.eventType,
      timestamp: serverTimestamp(),
      ...eventData,
    };

    // Remove undefined fields
    Object.keys(eventDoc).forEach(key => {
      if (eventDoc[key] === undefined) {
        delete eventDoc[key];
      }
    });

    const docRef = await addDoc(eventsRef, eventDoc);
    
    console.log(`Subscription event logged: ${eventData.eventType}`, docRef.id);
    return { success: true, eventId: docRef.id };
  } catch (error) {
    console.error("Error logging subscription event:", error);
    throw new Error("Failed to log subscription event");
  }
};

/**
 * Log plan upgrade event
 */
export const logPlanUpgrade = async (teacherId, fromPlan, toPlan, amount, currency, transactionId) => {
  return logSubscriptionEvent({
    teacherId,
    eventType: "plan_upgrade",
    fromPlan,
    toPlan,
    amount,
    currency,
    transactionId,
    metadata: {
      upgradeType: "user_initiated"
    }
  });
};

/**
 * Log plan downgrade event
 */
export const logPlanDowngrade = async (teacherId, fromPlan, toPlan, reason = "user_cancelled") => {
  return logSubscriptionEvent({
    teacherId,
    eventType: "plan_downgrade",
    fromPlan,
    toPlan,
    metadata: {
      reason
    }
  });
};

/**
 * Log payment transaction
 */
export const logPaymentTransaction = async (teacherId, planTier, amount, currency, transactionId, status = "success") => {
  return logSubscriptionEvent({
    teacherId,
    eventType: "payment_transaction",
    planTier,
    amount,
    currency,
    transactionId,
    status,
    metadata: {
      paymentMethod: "paystack"
    }
  });
};

/**
 * Log subscription cancellation
 */
export const logSubscriptionCancellation = async (teacherId, planTier, reason = "user_requested") => {
  return logSubscriptionEvent({
    teacherId,
    eventType: "subscription_cancelled",
    planTier,
    metadata: {
      reason
    }
  });
};

/**
 * Log subscription renewal
 */
export const logSubscriptionRenewal = async (teacherId, planTier, amount, currency, transactionId, status = "success") => {
  return logSubscriptionEvent({
    teacherId,
    eventType: "subscription_renewal",
    planTier,
    amount,
    currency,
    transactionId,
    status,
    metadata: {
      renewalType: "automatic"
    }
  });
};

/**
 * Log grace period activation
 */
export const logGracePeriodActivation = async (teacherId, planTier, reason = "payment_failed") => {
  return logSubscriptionEvent({
    teacherId,
    eventType: "grace_period_activated",
    planTier,
    metadata: {
      reason
    }
  });
};
