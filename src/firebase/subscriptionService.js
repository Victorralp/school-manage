/**
 * Firestore Service for Subscription Management
 * Handles all database operations for subscriptions and transactions
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "./config";
import {
  createSubscriptionDocument,
  createTransactionDocument,
  PLAN_TIERS,
  SUBSCRIPTION_STATUS,
} from "./subscriptionModels";

// Collection names
const SUBSCRIPTIONS_COLLECTION = "subscriptions";
const TRANSACTIONS_COLLECTION = "transactions";
const CONFIG_COLLECTION = "config";

/**
 * Initialize a subscription for a new teacher
 * @param {string} teacherId - The teacher's user ID
 * @returns {Promise<object>} - The created subscription document
 */
export const initializeSubscription = async (teacherId) => {
  const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, teacherId);

  // Check if subscription already exists
  const existingDoc = await getDoc(subscriptionRef);
  if (existingDoc.exists()) {
    return existingDoc.data();
  }

  // Create new free plan subscription
  const subscriptionData = createSubscriptionDocument(
    teacherId,
    PLAN_TIERS.FREE,
  );
  await setDoc(subscriptionRef, subscriptionData);

  return subscriptionData;
};

/**
 * Get a teacher's subscription
 * @param {string} teacherId - The teacher's user ID
 * @returns {Promise<object|null>} - The subscription document or null
 */
export const getSubscription = async (teacherId) => {
  const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, teacherId);
  const subscriptionDoc = await getDoc(subscriptionRef);

  if (subscriptionDoc.exists()) {
    return { id: subscriptionDoc.id, ...subscriptionDoc.data() };
  }

  return null;
};

/**
 * Subscribe to real-time subscription updates
 * @param {string} teacherId - The teacher's user ID
 * @param {function} callback - Callback function to handle updates
 * @returns {function} - Unsubscribe function
 */
export const subscribeToSubscription = (teacherId, callback) => {
  const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, teacherId);

  return onSnapshot(
    subscriptionRef,
    (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error("Error listening to subscription:", error);
      callback(null, error);
    },
  );
};

/**
 * Update subscription plan
 * @param {string} teacherId - The teacher's user ID
 * @param {string} planTier - New plan tier
 * @param {object} paymentData - Payment information
 * @returns {Promise<void>}
 */
export const updateSubscriptionPlan = async (
  teacherId,
  planTier,
  paymentData = {},
) => {
  const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, teacherId);

  const updateData = {
    planTier,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    updatedAt: serverTimestamp(),
    ...paymentData,
  };

  await updateDoc(subscriptionRef, updateData);
};

/**
 * Increment usage count for subjects or students
 * @param {string} teacherId - The teacher's user ID
 * @param {string} type - 'subject' or 'student'
 * @returns {Promise<void>}
 */
export const incrementUsage = async (teacherId, type) => {
  const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, teacherId);
  const field = type === "subject" ? "currentSubjects" : "currentStudents";

  await updateDoc(subscriptionRef, {
    [field]: increment(1),
    updatedAt: serverTimestamp(),
  });
};

/**
 * Decrement usage count for subjects or students
 * @param {string} teacherId - The teacher's user ID
 * @param {string} type - 'subject' or 'student'
 * @returns {Promise<void>}
 */
export const decrementUsage = async (teacherId, type) => {
  const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, teacherId);
  const field = type === "subject" ? "currentSubjects" : "currentStudents";

  await updateDoc(subscriptionRef, {
    [field]: increment(-1),
    updatedAt: serverTimestamp(),
  });
};

/**
 * Create a payment transaction record
 * @param {object} transactionData - Transaction data
 * @returns {Promise<string>} - Transaction ID
 */
export const createTransaction = async (transactionData) => {
  const transactionRef = doc(collection(db, TRANSACTIONS_COLLECTION));
  await setDoc(transactionRef, {
    ...transactionData,
    createdAt: serverTimestamp(),
  });

  return transactionRef.id;
};

/**
 * Update transaction status
 * @param {string} transactionId - Transaction ID
 * @param {string} status - New status
 * @param {object} paymentResponse - Payment provider response data (Monnify)
 * @returns {Promise<void>}
 */
export const updateTransaction = async (
  transactionId,
  status,
  paymentResponse = null,
) => {
  const transactionRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);

  await updateDoc(transactionRef, {
    status,
    monnifyResponse: paymentResponse,
    completedAt: serverTimestamp(),
  });
};

/**
 * Get transaction history for a teacher
 * @param {string} teacherId - The teacher's user ID
 * @returns {Promise<array>} - Array of transaction documents
 */
export const getTransactionHistory = async (teacherId) => {
  // Query by teacherId
  const teacherQuery = query(
    collection(db, TRANSACTIONS_COLLECTION),
    where("teacherId", "==", teacherId),
  );

  // Also query by userId (another possible field name)
  const userQuery = query(
    collection(db, TRANSACTIONS_COLLECTION),
    where("userId", "==", teacherId),
  );

  // Also query by schoolId (in case teacherId is actually a schoolId)
  const schoolQuery = query(
    collection(db, TRANSACTIONS_COLLECTION),
    where("schoolId", "==", teacherId),
  );

  // Also query by paidByUserId
  const paidByQuery = query(
    collection(db, TRANSACTIONS_COLLECTION),
    where("paidByUserId", "==", teacherId),
  );

  const [teacherSnapshot, userSnapshot, schoolSnapshot, paidBySnapshot] = await Promise.all([
    getDocs(teacherQuery),
    getDocs(userQuery),
    getDocs(schoolQuery),
    getDocs(paidByQuery),
  ]);

  // Combine results and deduplicate by id
  const transactionsMap = new Map();
  
  teacherSnapshot.docs.forEach((doc) => {
    transactionsMap.set(doc.id, { id: doc.id, ...doc.data() });
  });
  
  userSnapshot.docs.forEach((doc) => {
    if (!transactionsMap.has(doc.id)) {
      transactionsMap.set(doc.id, { id: doc.id, ...doc.data() });
    }
  });

  schoolSnapshot.docs.forEach((doc) => {
    if (!transactionsMap.has(doc.id)) {
      transactionsMap.set(doc.id, { id: doc.id, ...doc.data() });
    }
  });

  paidBySnapshot.docs.forEach((doc) => {
    if (!transactionsMap.has(doc.id)) {
      transactionsMap.set(doc.id, { id: doc.id, ...doc.data() });
    }
  });

  // Sort by createdAt descending
  return Array.from(transactionsMap.values()).sort((a, b) => {
    const dateA = a.createdAt?.seconds || 0;
    const dateB = b.createdAt?.seconds || 0;
    return dateB - dateA;
  });
};

/**
 * Get plan configuration from Firestore
 * @returns {Promise<object>} - Plan configuration
 */
export const getPlanConfig = async () => {
  const configRef = doc(db, CONFIG_COLLECTION, "plans");
  const configDoc = await getDoc(configRef);

  if (configDoc.exists()) {
    return configDoc.data();
  }

  // Return default config if not found in Firestore
  return null;
};

/**
 * Initialize plan configuration in Firestore (admin function)
 * This should be run once to set up the plan configuration
 * @param {object} planConfig - Plan configuration object
 * @returns {Promise<void>}
 */
export const initializePlanConfig = async (planConfig) => {
  const configRef = doc(db, CONFIG_COLLECTION, "plans");
  await setDoc(configRef, planConfig);
};
