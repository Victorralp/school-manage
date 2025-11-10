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
  writeBatch
} from 'firebase/firestore';
import { db } from './config';
import { 
  createSchoolDocument,
  createTeacherSchoolDocument,
  createTransactionDocument,
  PLAN_TIERS,
  SUBSCRIPTION_STATUS,
  SCHOOL_ROLES
} from './subscriptionModels';

// Collection names
const SCHOOLS_COLLECTION = 'schools';
const TEACHERS_COLLECTION = 'teachers';
const TRANSACTIONS_COLLECTION = 'transactions';
const CONFIG_COLLECTION = 'config';

/**
 * Create a new school with admin user
 * @param {string} schoolName - The school's name
 * @param {string} adminUserId - The user ID of the school admin
 * @param {string} planTier - Initial plan tier (default: free)
 * @returns {Promise<string>} - The created school ID
 */
export const createSchool = async (schoolName, adminUserId, planTier = PLAN_TIERS.FREE) => {
  const batch = writeBatch(db);
  
  // Create school document
  const schoolRef = doc(collection(db, SCHOOLS_COLLECTION));
  const schoolData = createSchoolDocument(schoolName, adminUserId, planTier);
  batch.set(schoolRef, schoolData);
  
  // Create teacher-school relationship for admin
  const teacherRef = doc(db, TEACHERS_COLLECTION, adminUserId);
  const teacherData = createTeacherSchoolDocument(adminUserId, schoolRef.id, SCHOOL_ROLES.ADMIN);
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
  
  return onSnapshot(schoolRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error listening to school:', error);
    callback(null, error);
  });
};

/**
 * Get teacher's school relationship
 * @param {string} teacherId - The teacher's user ID
 * @returns {Promise<object|null>} - The teacher document or null
 */
export const getTeacherSchoolRelationship = async (teacherId) => {
  const teacherRef = doc(db, TEACHERS_COLLECTION, teacherId);
  const teacherDoc = await getDoc(teacherRef);
  
  if (teacherDoc.exists()) {
    return { id: teacherDoc.id, ...teacherDoc.data() };
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
export const addTeacherToSchool = async (teacherId, schoolId, role = SCHOOL_ROLES.TEACHER) => {
  const batch = writeBatch(db);
  
  // Create teacher-school relationship
  const teacherRef = doc(db, TEACHERS_COLLECTION, teacherId);
  const teacherData = createTeacherSchoolDocument(teacherId, schoolId, role);
  batch.set(teacherRef, teacherData);
  
  // Increment teacher count in school
  const schoolRef = doc(db, SCHOOLS_COLLECTION, schoolId);
  batch.update(schoolRef, {
    teacherCount: increment(1),
    updatedAt: serverTimestamp()
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
    throw new Error('Teacher not found in any school');
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
    updatedAt: serverTimestamp()
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
    throw new Error('Teacher not found in any school');
  }
  
  const batch = writeBatch(db);
  const field = type === 'subject' ? 'currentSubjects' : 'currentStudents';
  
  // Update teacher's individual usage
  const teacherRef = doc(db, TEACHERS_COLLECTION, teacherId);
  batch.update(teacherRef, {
    [field]: increment(1),
    updatedAt: serverTimestamp()
  });
  
  // Update school's total usage
  const schoolRef = doc(db, SCHOOLS_COLLECTION, teacherRelationship.schoolId);
  batch.update(schoolRef, {
    [field]: increment(1),
    updatedAt: serverTimestamp()
  });
  
  await batch.commit();
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
    throw new Error('Teacher not found in any school');
  }
  
  const batch = writeBatch(db);
  const field = type === 'subject' ? 'currentSubjects' : 'currentStudents';
  
  // Update teacher's individual usage
  const teacherRef = doc(db, TEACHERS_COLLECTION, teacherId);
  batch.update(teacherRef, {
    [field]: increment(-1),
    updatedAt: serverTimestamp()
  });
  
  // Update school's total usage
  const schoolRef = doc(db, SCHOOLS_COLLECTION, teacherRelationship.schoolId);
  batch.update(schoolRef, {
    [field]: increment(-1),
    updatedAt: serverTimestamp()
  });
  
  await batch.commit();
};

/**
 * Update school's subscription plan
 * @param {string} schoolId - The school's ID
 * @param {string} planTier - New plan tier
 * @param {object} paymentData - Payment information
 * @returns {Promise<void>}
 */
export const updateSchoolPlan = async (schoolId, planTier, paymentData = {}) => {
  const schoolRef = doc(db, SCHOOLS_COLLECTION, schoolId);
  
  const updateData = {
    planTier,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    updatedAt: serverTimestamp(),
    ...paymentData
  };
  
  await updateDoc(schoolRef, updateData);
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
    createdAt: serverTimestamp()
  });
  
  return transactionRef.id;
};

/**
 * Update transaction status
 * @param {string} transactionId - Transaction ID
 * @param {string} status - New status
 * @param {object} paystackResponse - Paystack response data
 * @returns {Promise<void>}
 */
export const updateTransaction = async (transactionId, status, paystackResponse = null) => {
  const transactionRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
  
  await updateDoc(transactionRef, {
    status,
    paystackResponse,
    completedAt: serverTimestamp()
  });
};

/**
 * Get transaction history for a school
 * @param {string} schoolId - The school's ID
 * @returns {Promise<array>} - Array of transaction documents
 */
export const getTransactionHistory = async (schoolId) => {
  const transactionsQuery = query(
    collection(db, TRANSACTIONS_COLLECTION),
    where('schoolId', '==', schoolId)
  );
  
  const querySnapshot = await getDocs(transactionsQuery);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get all teachers in a school
 * @param {string} schoolId - The school's ID
 * @returns {Promise<array>} - Array of teacher documents
 */
export const getSchoolTeachers = async (schoolId) => {
  const teachersQuery = query(
    collection(db, TEACHERS_COLLECTION),
    where('schoolId', '==', schoolId)
  );
  
  const querySnapshot = await getDocs(teachersQuery);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
  const configRef = doc(db, CONFIG_COLLECTION, 'plans');
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
  const configRef = doc(db, CONFIG_COLLECTION, 'plans');
  await setDoc(configRef, planConfig);
};
