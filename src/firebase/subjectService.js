import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from './config';

/**
 * Register a new subject for a teacher
 * @param {string} teacherId - The teacher's user ID
 * @param {string} schoolId - The school ID
 * @param {object} subjectData - Subject data (name, code, description)
 * @returns {Promise<string>} - The created subject ID
 */
export const registerSubject = async (teacherId, schoolId, subjectData) => {
  try {
    // Check if subject code already exists for this teacher
    const existingQuery = query(
      collection(db, 'subjects'),
      where('teacherId', '==', teacherId),
      where('code', '==', subjectData.code.toUpperCase())
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      throw new Error('A subject with this code already exists');
    }

    const subjectRef = await addDoc(collection(db, 'subjects'), {
      name: subjectData.name,
      code: subjectData.code.toUpperCase(),
      description: subjectData.description || '',
      teacherId,
      schoolId,
      examCount: 0, // Track number of exams for this subject
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active'
    });

    return subjectRef.id;
  } catch (error) {
    console.error('Error registering subject:', error);
    throw error;
  }
};

/**
 * Get all subjects for a teacher
 * @param {string} teacherId - The teacher's user ID
 * @returns {Promise<Array>} - Array of subject documents
 */
export const getTeacherSubjects = async (teacherId) => {
  try {
    const subjectsQuery = query(
      collection(db, 'subjects'),
      where('teacherId', '==', teacherId),
      where('status', '==', 'active')
    );
    const snapshot = await getDocs(subjectsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching teacher subjects:', error);
    throw error;
  }
};

/**
 * Get all subjects for a school
 * @param {string} schoolId - The school ID
 * @returns {Promise<Array>} - Array of subject documents
 */
export const getSchoolSubjects = async (schoolId) => {
  try {
    const subjectsQuery = query(
      collection(db, 'subjects'),
      where('schoolId', '==', schoolId),
      where('status', '==', 'active')
    );
    const snapshot = await getDocs(subjectsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching school subjects:', error);
    throw error;
  }
};

/**
 * Subscribe to teacher's subjects in real-time
 * @param {string} teacherId - The teacher's user ID
 * @param {function} callback - Callback function to handle updates
 * @returns {function} - Unsubscribe function
 */
export const subscribeToTeacherSubjects = (teacherId, callback) => {
  const subjectsQuery = query(
    collection(db, 'subjects'),
    where('teacherId', '==', teacherId),
    where('status', '==', 'active')
  );

  return onSnapshot(
    subjectsQuery,
    (snapshot) => {
      const subjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(subjects, null);
    },
    (error) => {
      console.error('Error in subjects subscription:', error);
      callback(null, error);
    }
  );
};

/**
 * Delete a subject
 * @param {string} subjectId - The subject ID
 * @returns {Promise<void>}
 */
export const deleteSubject = async (subjectId) => {
  try {
    // Soft delete - mark as inactive
    const subjectRef = doc(db, 'subjects', subjectId);
    await updateDoc(subjectRef, {
      status: 'inactive',
      deletedAt: new Date(),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error deleting subject:', error);
    throw error;
  }
};

/**
 * Update subject details
 * @param {string} subjectId - The subject ID
 * @param {object} updates - Fields to update
 * @returns {Promise<void>}
 */
export const updateSubject = async (subjectId, updates) => {
  try {
    const subjectRef = doc(db, 'subjects', subjectId);
    await updateDoc(subjectRef, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating subject:', error);
    throw error;
  }
};

/**
 * Increment exam count for a subject
 * @param {string} subjectId - The subject ID
 * @returns {Promise<void>}
 */
export const incrementSubjectExamCount = async (subjectId) => {
  try {
    const subjectRef = doc(db, 'subjects', subjectId);
    const subjectDoc = await getDoc(subjectRef);
    
    if (subjectDoc.exists()) {
      const currentCount = subjectDoc.data().examCount || 0;
      await updateDoc(subjectRef, {
        examCount: currentCount + 1,
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error incrementing exam count:', error);
    throw error;
  }
};

/**
 * Decrement exam count for a subject
 * @param {string} subjectId - The subject ID
 * @returns {Promise<void>}
 */
export const decrementSubjectExamCount = async (subjectId) => {
  try {
    const subjectRef = doc(db, 'subjects', subjectId);
    const subjectDoc = await getDoc(subjectRef);
    
    if (subjectDoc.exists()) {
      const currentCount = subjectDoc.data().examCount || 0;
      await updateDoc(subjectRef, {
        examCount: Math.max(0, currentCount - 1),
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error decrementing exam count:', error);
    throw error;
  }
};

/**
 * Get subject by ID
 * @param {string} subjectId - The subject ID
 * @returns {Promise<object>} - Subject document
 */
export const getSubjectById = async (subjectId) => {
  try {
    const subjectRef = doc(db, 'subjects', subjectId);
    const subjectDoc = await getDoc(subjectRef);
    
    if (subjectDoc.exists()) {
      return {
        id: subjectDoc.id,
        ...subjectDoc.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching subject:', error);
    throw error;
  }
};
