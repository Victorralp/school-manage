const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

/**
 * Scheduled function to check for expiring subscriptions daily
 * Runs every day at 9:00 AM UTC
 */
exports.checkExpiringSubscriptions = functions.pubsub
  .schedule("0 9 * * *")
  .timeZone("UTC")
  .onRun(async (context) => {
    try {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Query subscriptions expiring within 7 days
      const expiringSubscriptions = await db
        .collection("subscriptions")
        .where("status", "==", "active")
        .where("planTier", "in", ["premium", "vip"])
        .where("expiryDate", "<=", sevenDaysFromNow)
        .where("expiryDate", ">", now)
        .get();

      const renewalPromises = [];

      expiringSubscriptions.forEach((doc) => {
        const subscription = doc.data();
        const teacherId = doc.id;

        // Send renewal reminder email
        renewalPromises.push(
          sendRenewalReminder(teacherId, subscription)
        );
      });

      await Promise.all(renewalPromises);

      console.log(`Processed ${renewalPromises.length} expiring subscriptions`);
      return null;
    } catch (error) {
      console.error("Error checking expiring subscriptions:", error);
      throw error;
    }
  });

/**
 * Scheduled function to process subscription renewals
 * Runs every day at 10:00 AM UTC
 */
exports.processSubscriptionRenewals = functions.pubsub
  .schedule("0 10 * * *")
  .timeZone("UTC")
  .onRun(async (context) => {
    try {
      const now = new Date();

      // Query expired subscriptions
      const expiredSubscriptions = await db
        .collection("subscriptions")
        .where("status", "==", "active")
        .where("planTier", "in", ["premium", "vip"])
        .where("expiryDate", "<=", now)
        .get();

      const renewalPromises = [];

      expiredSubscriptions.forEach((doc) => {
        const subscription = doc.data();
        const teacherId = doc.id;

        // Attempt automatic renewal
        renewalPromises.push(
          attemptAutomaticRenewal(teacherId, subscription)
        );
      });

      await Promise.all(renewalPromises);

      console.log(`Processed ${renewalPromises.length} subscription renewals`);
      return null;
    } catch (error) {
      console.error("Error processing subscription renewals:", error);
      throw error;
    }
  });

/**
 * Send renewal reminder email to teacher
 */
async function sendRenewalReminder(teacherId, subscription) {
  try {
    // Get teacher details
    const teacherDoc = await db.collection("users").doc(teacherId).get();
    if (!teacherDoc.exists) {
      console.error(`Teacher ${teacherId} not found`);
      return;
    }

    const teacher = teacherDoc.data();
    const daysUntilExpiry = Math.ceil(
      (subscription.expiryDate.toDate() - new Date()) / (1000 * 60 * 60 * 24)
    );

    // Create email notification document
    await db.collection("mail").add({
      to: teacher.email,
      template: {
        name: "subscription-renewal-reminder",
        data: {
          teacherName: teacher.name,
          planTier: subscription.planTier,
          expiryDate: subscription.expiryDate.toDate().toLocaleDateString(),
          daysUntilExpiry,
        },
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Renewal reminder sent to ${teacher.email}`);
  } catch (error) {
    console.error(`Error sending renewal reminder to ${teacherId}:`, error);
  }
}

/**
 * Attempt automatic renewal using stored payment method
 */
async function attemptAutomaticRenewal(teacherId, subscription) {
  try {
    const subscriptionRef = db.collection("subscriptions").doc(teacherId);

    // Check if we have stored payment method
    if (!subscription.paystackCustomerCode || !subscription.paystackSubscriptionCode) {
      console.log(`No stored payment method for ${teacherId}, activating grace period`);
      
      // Activate grace period
      await activateGracePeriod(teacherId, subscription);
      return;
    }

    // Attempt to charge using Paystack subscription
    // Note: This requires Paystack API integration
    // For now, we'll simulate the renewal attempt
    const renewalSuccess = await chargePaystackSubscription(
      subscription.paystackSubscriptionCode,
      subscription.amount,
      subscription.currency
    );

    if (renewalSuccess) {
      // Renewal successful - extend subscription
      const newExpiryDate = new Date(subscription.expiryDate.toDate());
      newExpiryDate.setMonth(newExpiryDate.getMonth() + 1);

      await subscriptionRef.update({
        expiryDate: admin.firestore.Timestamp.fromDate(newExpiryDate),
        lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Send success notification
      await sendRenewalSuccessNotification(teacherId, subscription);

      console.log(`Subscription renewed successfully for ${teacherId}`);
    } else {
      // Renewal failed - activate grace period
      console.log(`Renewal failed for ${teacherId}, activating grace period`);
      await activateGracePeriod(teacherId, subscription);
    }
  } catch (error) {
    console.error(`Error attempting renewal for ${teacherId}:`, error);
    // On error, activate grace period
    await activateGracePeriod(teacherId, subscription);
  }
}

/**
 * Charge Paystack subscription
 * This is a placeholder - actual implementation requires Paystack API
 */
async function chargePaystackSubscription(subscriptionCode, amount, currency) {
  // TODO: Implement actual Paystack API call
  // For now, return false to simulate failed renewal
  return false;
}

/**
 * Activate grace period for failed renewal
 */
async function activateGracePeriod(teacherId, subscription) {
  try {
    const subscriptionRef = db.collection("subscriptions").doc(teacherId);
    const gracePeriodEnd = new Date();
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3); // 3-day grace period

    await subscriptionRef.update({
      status: "grace_period",
      gracePeriodEnd: admin.firestore.Timestamp.fromDate(gracePeriodEnd),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send grace period notification
    await sendGracePeriodNotification(teacherId, subscription, gracePeriodEnd);

    console.log(`Grace period activated for ${teacherId}`);
  } catch (error) {
    console.error(`Error activating grace period for ${teacherId}:`, error);
  }
}

/**
 * Send renewal success notification
 */
async function sendRenewalSuccessNotification(teacherId, subscription) {
  try {
    const teacherDoc = await db.collection("users").doc(teacherId).get();
    if (!teacherDoc.exists) return;

    const teacher = teacherDoc.data();

    await db.collection("mail").add({
      to: teacher.email,
      template: {
        name: "subscription-renewal-success",
        data: {
          teacherName: teacher.name,
          planTier: subscription.planTier,
          amount: subscription.amount,
          currency: subscription.currency,
        },
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error sending renewal success notification:`, error);
  }
}

/**
 * Send grace period notification
 */
async function sendGracePeriodNotification(teacherId, subscription, gracePeriodEnd) {
  try {
    const teacherDoc = await db.collection("users").doc(teacherId).get();
    if (!teacherDoc.exists) return;

    const teacher = teacherDoc.data();

    await db.collection("mail").add({
      to: teacher.email,
      template: {
        name: "subscription-grace-period",
        data: {
          teacherName: teacher.name,
          planTier: subscription.planTier,
          gracePeriodEnd: gracePeriodEnd.toLocaleDateString(),
        },
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error sending grace period notification:`, error);
  }
}

module.exports = {
  checkExpiringSubscriptions: exports.checkExpiringSubscriptions,
  processSubscriptionRenewals: exports.processSubscriptionRenewals,
};

/**
 * Scheduled function to process grace period expirations
 * Runs every day at 11:00 AM UTC
 */
exports.processGracePeriodExpirations = functions.pubsub
  .schedule("0 11 * * *")
  .timeZone("UTC")
  .onRun(async (context) => {
    try {
      const now = new Date();

      // Query subscriptions in grace period that have expired
      const expiredGracePeriods = await db
        .collection("subscriptions")
        .where("status", "==", "grace_period")
        .where("gracePeriodEnd", "<=", admin.firestore.Timestamp.fromDate(now))
        .get();

      const downgradePromises = [];

      expiredGracePeriods.forEach((doc) => {
        const subscription = doc.data();
        const teacherId = doc.id;

        // Downgrade to Free plan
        downgradePromises.push(
          downgradeToFreePlan(teacherId, subscription)
        );
      });

      await Promise.all(downgradePromises);

      console.log(`Processed ${downgradePromises.length} grace period expirations`);
      return null;
    } catch (error) {
      console.error("Error processing grace period expirations:", error);
      throw error;
    }
  });

/**
 * Downgrade subscription to Free plan after grace period expires
 */
async function downgradeToFreePlan(teacherId, subscription) {
  try {
    const subscriptionRef = db.collection("subscriptions").doc(teacherId);

    // Get current usage counts
    const currentSubjects = subscription.currentSubjects || 0;
    const currentStudents = subscription.currentStudents || 0;

    // Free plan limits
    const freePlanLimits = {
      subjectLimit: 3,
      studentLimit: 10,
    };

    // Check if current usage exceeds Free plan limits
    const exceedsSubjectLimit = currentSubjects > freePlanLimits.subjectLimit;
    const exceedsStudentLimit = currentStudents > freePlanLimits.studentLimit;

    // Update subscription to Free plan
    await subscriptionRef.update({
      planTier: "free",
      status: "active",
      subjectLimit: freePlanLimits.subjectLimit,
      studentLimit: freePlanLimits.studentLimit,
      amount: 0,
      currency: "NGN",
      expiryDate: null,
      gracePeriodEnd: null,
      lastPaymentDate: null,
      paystackCustomerCode: null,
      paystackSubscriptionCode: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      // Keep currentSubjects and currentStudents unchanged (data retention)
    });

    // Send downgrade notification
    await sendDowngradeNotification(
      teacherId,
      subscription,
      exceedsSubjectLimit,
      exceedsStudentLimit,
      freePlanLimits
    );

    console.log(`Downgraded ${teacherId} to Free plan`);
  } catch (error) {
    console.error(`Error downgrading ${teacherId} to Free plan:`, error);
  }
}

/**
 * Send downgrade notification to teacher
 */
async function sendDowngradeNotification(
  teacherId,
  subscription,
  exceedsSubjectLimit,
  exceedsStudentLimit,
  freePlanLimits
) {
  try {
    const teacherDoc = await db.collection("users").doc(teacherId).get();
    if (!teacherDoc.exists) return;

    const teacher = teacherDoc.data();

    const message = exceedsSubjectLimit || exceedsStudentLimit
      ? `Your account has been downgraded to the Free plan. You currently have ${subscription.currentSubjects} subjects and ${subscription.currentStudents} students, which exceeds the Free plan limits (${freePlanLimits.subjectLimit} subjects, ${freePlanLimits.studentLimit} students). Your existing data has been retained, but you will not be able to register new subjects or students until you remove some or upgrade your plan.`
      : `Your account has been downgraded to the Free plan. All your data has been retained.`;

    await db.collection("mail").add({
      to: teacher.email,
      template: {
        name: "subscription-downgrade",
        data: {
          teacherName: teacher.name,
          previousPlan: subscription.planTier,
          currentSubjects: subscription.currentSubjects,
          currentStudents: subscription.currentStudents,
          subjectLimit: freePlanLimits.subjectLimit,
          studentLimit: freePlanLimits.studentLimit,
          exceedsLimits: exceedsSubjectLimit || exceedsStudentLimit,
          message,
        },
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Downgrade notification sent to ${teacher.email}`);
  } catch (error) {
    console.error(`Error sending downgrade notification:`, error);
  }
}

/**
 * HTTP function to manually trigger downgrade (for testing or admin use)
 */
exports.manualDowngrade = functions.https.onCall(async (data, context) => {
  // Verify admin authentication
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admins can manually trigger downgrades"
    );
  }

  const { teacherId } = data;

  if (!teacherId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "teacherId is required"
    );
  }

  try {
    const subscriptionDoc = await db.collection("subscriptions").doc(teacherId).get();
    
    if (!subscriptionDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Subscription not found"
      );
    }

    const subscription = subscriptionDoc.data();
    await downgradeToFreePlan(teacherId, subscription);

    return {
      success: true,
      message: `Successfully downgraded ${teacherId} to Free plan`,
    };
  } catch (error) {
    console.error("Error in manual downgrade:", error);
    throw new functions.https.HttpsError(
      "internal",
      error.message || "Failed to downgrade subscription"
    );
  }
});
