/**
 * Firestore Service for School-Based Subscription Management
 * Handles all database operations for schools, teachers, and subscriptions
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
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";
import {
  createSchoolDocument,
  createTeacherSchoolDocument,
  createTransactionDocument,
  PLAN_TIERS,
  SUBSCRIPTION_STATUS,
  SCHOOL_ROLES,
} from "./subscriptionModels";

// Collection names
const SCHOOLS_COLLECTION = "schools";
const TEACHERS_COLLECTION = "teachers";
const TRANSACTIONS_COLLECTION = "transactions";
const CONFIG_COLLECTION = "config";

/**
 * Create a new school with admin user
 * @param {string} schoolName - The school's name
 * @param {string} adminUserId - The user ID of the school admin
 * @param {string} planTier - Initial plan tier (default: free)
 * @returns {Promise<string>} - The created school ID
 */
export const createSchool = async (
  schoolName,
  adminUserId,
  planTier = PLAN_TIERS.FREE,
) => {
  const batch = writeBatch(db);

  // Create school document
  const schoolRef = doc(collection(db, SCHOOLS_COLLECTION));
  const schoolData = createSchoolDocument(schoolName, adminUserId, planTier);
  batch.set(schoolRef, schoolData);

  // Create teacher-school relationship for admin
  const teacherRef = doc(db, TEACHERS_COLLECTION, adminUserId);
  const teacherData = createTeacherSchoolDocument(
    adminUserId,
    schoolRef.id,
    SCHOOL_ROLES.ADMIN,
  );
  batch.set(teacherRef, teacherData);

  await batch.commit();

  return schoolRef.id;
};

/**
 * Get school by ID
 * @param {string} schoolId - The school's ID
 * @returns {Promise<object|null>} - The school document or null
 */
export const getSchool = async (schoolId) => {
  const schoolRef = doc(db, SCHOOLS_COLLECTION, schoolId);
  const schoolDoc = await getDoc(schoolRef);

  if (schoolDoc.exists()) {
    return { id: schoolDoc.id, ...schoolDoc.data() };
  }

  return null;
};

/**
 * Get school by teacher ID
 * @param {string} teacherId - The teacher's user ID
 * @returns {Promise<object|null>} - The school document or null
 */
export const getSchoolByTeacherId = async (teacherId) => {
  const teacherRef = doc(db, TEACHERS_COLLECTION, teacherId);
  const teacherDoc = await getDoc(teacherRef);

  if (!teacherDoc.exists()) {
    return null;
  }

  const teacherData = teacherDoc.data();
  return await getSchool(teacherData.schoolId);
};

/**
 * Subscribe to real-time school updates
 * @param {string} schoolId - The school's ID
 * @param {function} callback - Callback function to handle updates
 * @returns {function} - Unsubscribe function
 */
export const subscribeToSchool = (schoolId, callback) => {
  const schoolRef = doc(db, SCHOOLS_COLLECTION, schoolId);

  return onSnapshot(
    schoolRef,
    (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error("Error listening to school:", error);
      callback(null, error);
    },
  );
};

/**
 * Get teacher's school relationship
 * @param {string} teacherId - The teacher's user ID
 * @returns {Promise<object|null>} - The teacher document or null
 */
export const getTeacherSchoolRelationship = async (teacherId) => {
  // First try to get from teachers collection
  const teacherRef = doc(db, TEACHERS_COLLECTION, teacherId);
  const teacherDoc = await getDoc(teacherRef);

  if (teacherDoc.exists()) {
    return { id: teacherDoc.id, ...teacherDoc.data() };
  }

  // Fallback: Get schoolId from users collection
  const userRef = doc(db, "users", teacherId);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    const userData = userDoc.data();
    if (userData.schoolId) {
      // Return a basic relationship object
      return {
        teacherId: teacherId,
        schoolId: userData.schoolId,
        role: userData.role === "school" ? "admin" : "teacher",
        currentSubjects: 0,
        currentStudents: 0,
      };
    }
  }

  return null;
};

/**
 * Add a teacher to a school
 * @param {string} teacherId - The teacher's user ID
 * @param {string} schoolId - The school's ID
 * @param {string} role - The teacher's role (default: teacher)
 * @returns {Promise<void>}
 */
export const addTeacherToSchool = async (
  teacherId,
  schoolId,
  role = SCHOOL_ROLES.TEACHER,
) => {
  const batch = writeBatch(db);

  // Create teacher-school relationship
  const teacherRef = doc(db, TEACHERS_COLLECTION, teacherId);
  const teacherData = createTeacherSchoolDocument(teacherId, schoolId, role);
  batch.set(teacherRef, teacherData);

  // Increment teacher count in school
  const schoolRef = doc(db, SCHOOLS_COLLECTION, schoolId);
  batch.update(schoolRef, {
    teacherCount: increment(1),
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
};

/**
 * Remove a teacher from a school
 * @param {string} teacherId - The teacher's user ID
 * @returns {Promise<void>}
 */
export const removeTeacherFromSchool = async (teacherId) => {
  const teacherRelationship = await getTeacherSchoolRelationship(teacherId);

  if (!teacherRelationship) {
    throw new Error("Teacher not found in any school");
  }

  const batch = writeBatch(db);

  // Get teacher's current usage
  const teacherRef = doc(db, TEACHERS_COLLECTION, teacherId);

  // Decrement school's usage by teacher's usage
  const schoolRef = doc(db, SCHOOLS_COLLECTION, teacherRelationship.schoolId);
  batch.update(schoolRef, {
    currentSubjects: increment(-teacherRelationship.currentSubjects),
    currentStudents: increment(-teacherRelationship.currentStudents),
    teacherCount: increment(-1),
    updatedAt: serverTimestamp(),
  });

  // Delete teacher-school relationship
  batch.delete(teacherRef);

  await batch.commit();
};

/**
 * Increment usage count for subjects or students (school-wide)
 * @param {string} teacherId - The teacher's user ID
 * @param {string} type - 'subject' or 'student'
 * @returns {Promise<void>}
 */
export const incrementUsage = async (teacherId, type) => {
  const teacherRelationship = await getTeacherSchoolRelationship(teacherId);

  if (!teacherRelationship) {
    throw new Error("Teacher not found in any school");
  }

  const field = type === "subject" ? "currentSubjects" : "currentStudents";

  // Update teacher's individual usage using set with merge to handle non-existent docs
  const teacherRef = doc(db, TEACHERS_COLLECTION, teacherId);
  await setDoc(
    teacherRef,
    {
      teacherId: teacherId,
      schoolId: teacherRelationship.schoolId,
      role: teacherRelationship.role || "teacher",
      [field]: increment(1),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  // Update school's total usage
  const schoolRef = doc(db, SCHOOLS_COLLECTION, teacherRelationship.schoolId);
  await setDoc(
    schoolRef,
    {
      [field]: increment(1),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
};

/**
 * Decrement usage count for subjects or students (school-wide)
 * @param {string} teacherId - The teacher's user ID
 * @param {string} type - 'subject' or 'student'
 * @returns {Promise<void>}
 */
export const decrementUsage = async (teacherId, type) => {
  const teacherRelationship = await getTeacherSchoolRelationship(teacherId);

  if (!teacherRelationship) {
    throw new Error("Teacher not found in any school");
  }

  const field = type === "subject" ? "currentSubjects" : "currentStudents";

  // Update teacher's individual usage using set with merge
  const teacherRef = doc(db, TEACHERS_COLLECTION, teacherId);
  await setDoc(
    teacherRef,
    {
      teacherId: teacherId,
      schoolId: teacherRelationship.schoolId,
      role: teacherRelationship.role || "teacher",
      [field]: increment(-1),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  // Update school's total usage
  const schoolRef = doc(db, SCHOOLS_COLLECTION, teacherRelationship.schoolId);
  await setDoc(
    schoolRef,
    {
      [field]: increment(-1),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
};

/**
 * Update school's subscription plan
 * Uses setDoc with merge to handle cases where some fields might not exist
 * @param {string} schoolId - The school's ID
 * @param {string} planTier - New plan tier
 * @param {object} paymentData - Payment information
 * @returns {Promise<void>}
 */
export const updateSchoolPlan = async (
  schoolId,
  planTier,
  paymentData = {},
) => {
  const schoolRef = doc(db, SCHOOLS_COLLECTION, schoolId);

  const updateData = {
    planTier,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    updatedAt: serverTimestamp(),
    ...paymentData,
  };

  // Use setDoc with merge to handle documents that might not have all fields
  await setDoc(schoolRef, updateData, { merge: true });
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
 * Get transaction history for a school
 * Checks both schoolId and teacherId fields for backwards compatibility
 * @param {string} schoolId - The school's ID
 * @returns {Promise<array>} - Array of transaction documents
 */
export const getTransactionHistory = async (schoolId) => {
  // Query by schoolId
  const schoolQuery = query(
    collection(db, TRANSACTIONS_COLLECTION),
    where("schoolId", "==", schoolId),
  );

  // Also query by teacherId (for backwards compatibility - some transactions may use teacherId)
  const teacherQuery = query(
    collection(db, TRANSACTIONS_COLLECTION),
    where("teacherId", "==", schoolId),
  );

  // Also query by paidByUserId (for transactions where user paid)
  const paidByQuery = query(
    collection(db, TRANSACTIONS_COLLECTION),
    where("paidByUserId", "==", schoolId),
  );

  // Also query by userId (another possible field name)
  const userQuery = query(
    collection(db, TRANSACTIONS_COLLECTION),
    where("userId", "==", schoolId),
  );

  const [schoolSnapshot, teacherSnapshot, paidBySnapshot, userSnapshot] = await Promise.all([
    getDocs(schoolQuery),
    getDocs(teacherQuery),
    getDocs(paidByQuery),
    getDocs(userQuery),
  ]);

  // Combine results and deduplicate by id
  const transactionsMap = new Map();
  
  schoolSnapshot.docs.forEach((doc) => {
    transactionsMap.set(doc.id, { id: doc.id, ...doc.data() });
  });
  
  teacherSnapshot.docs.forEach((doc) => {
    if (!transactionsMap.has(doc.id)) {
      transactionsMap.set(doc.id, { id: doc.id, ...doc.data() });
    }
  });

  paidBySnapshot.docs.forEach((doc) => {
    if (!transactionsMap.has(doc.id)) {
      transactionsMap.set(doc.id, { id: doc.id, ...doc.data() });
    }
  });

  userSnapshot.docs.forEach((doc) => {
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
 * Get all teachers in a school
 * @param {string} schoolId - The school's ID
 * @returns {Promise<array>} - Array of teacher documents
 */
export const getSchoolTeachers = async (schoolId) => {
  const teachersQuery = query(
    collection(db, TEACHERS_COLLECTION),
    where("schoolId", "==", schoolId),
  );

  const querySnapshot = await getDocs(teachersQuery);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Check if user is school admin
 * @param {string} teacherId - The teacher's user ID
 * @returns {Promise<boolean>} - True if user is admin
 */
export const isSchoolAdmin = async (teacherId) => {
  const teacherRelationship = await getTeacherSchoolRelationship(teacherId);
  return teacherRelationship?.role === SCHOOL_ROLES.ADMIN;
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

  return null;
};

/**
 * Initialize plan configuration in Firestore (admin function)
 * @param {object} planConfig - Plan configuration object
 * @returns {Promise<void>}
 */
export const initializePlanConfig = async (planConfig) => {
  const configRef = doc(db, CONFIG_COLLECTION, "plans");
  await setDoc(configRef, planConfig);
};

// Promo Code System

/**
 * Get promo code details
 * @param {string} code - The promo code to validate
 * @returns {Promise<object|null>} - Promo code document or null
 */
export const getPromoCode = async (code) => {
  try {
    const q = query(
      collection(db, "promos"),
      where("code", "==", code),
      where("status", "==", "active"),
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const promoDoc = querySnapshot.docs[0];
    const promoData = promoDoc.data();

    // Check expiry
    if (promoData.expiryDate && promoData.expiryDate.toDate() < new Date()) {
      return null;
    }

    // Check usage limits
    if (promoData.maxUses && promoData.currentUses >= promoData.maxUses) {
      return null;
    }

    return { id: promoDoc.id, ...promoData };
  } catch (error) {
    console.error("Error fetching promo code:", error);
    return null;
  }
};

/**
 * Create a new promo code (Admin only)
 * @param {object} promoData - Promo code data
 * @returns {Promise<string>} - Promo code ID
 */
export const createPromoCode = async (promoData) => {
  const promoRef = doc(collection(db, "promos"));
  await setDoc(promoRef, {
    ...promoData,
    status: "active",
    currentUses: 0,
    createdAt: serverTimestamp(),
  });
  return promoRef.id;
};

/**
 * Increment promo code usage
 * @param {string} promoCodeId - The promo code ID
 * @returns {Promise<void>}
 */
export const incrementPromoUsage = async (promoCodeId) => {
  const promoRef = doc(db, "promos", promoCodeId);
  await updateDoc(promoRef, {
    currentUses: increment(1),
  });
};

/**
 * Get all promo codes (Admin management)
 * @returns {Promise<array>} - List of promo codes
 */
export const getPromos = async () => {
  const q = query(collection(db, "promos"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};
