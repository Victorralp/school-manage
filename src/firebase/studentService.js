import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from './config';

/**
 * Generate a unique student ID
 * Format: STU-XXXXXX (6 random alphanumeric characters)
 */
const generateStudentId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar looking characters
  let id = 'STU-';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

/**
 * Check if student ID already exists
 */
const studentIdExists = async (studentId) => {
  const q = query(collection(db, 'users'), where('studentId', '==', studentId));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

/**
 * Generate a unique student ID (ensures no duplicates)
 */
const generateUniqueStudentId = async () => {
  let studentId;
  let exists = true;
  let attempts = 0;
  const maxAttempts = 10;

  while (exists && attempts < maxAttempts) {
    studentId = generateStudentId();
    exists = await studentIdExists(studentId);
    attempts++;
  }

  if (exists) {
    throw new Error('Failed to generate unique student ID. Please try again.');
  }

  return studentId;
};

/**
 * Register a new student by teacher
 * @param {string} teacherId - The teacher's user ID
 * @param {string} schoolId - The school ID
 * @param {object} studentData - Student data (name, email or phoneNumber)
 * @returns {Promise<object>} - The created student data with studentId
 */
export const registerStudent = async (teacherId, schoolId, studentData) => {
  try {
    // Check if email/phone already exists
    if (studentData.email) {
      const emailQuery = query(
        collection(db, 'users'),
        where('email', '==', studentData.email.toLowerCase()),
        where('role', '==', 'student')
      );
      const emailSnapshot = await getDocs(emailQuery);
      if (!emailSnapshot.empty) {
        throw new Error('A student with this email already exists');
      }
    }

    if (studentData.phoneNumber) {
      const phoneQuery = query(
        collection(db, 'users'),
        where('phoneNumber', '==', studentData.phoneNumber),
        where('role', '==', 'student')
      );
      const phoneSnapshot = await getDocs(phoneQuery);
      if (!phoneSnapshot.empty) {
        throw new Error('A student with this phone number already exists');
      }
    }

    // Generate unique student ID
    const studentId = await generateUniqueStudentId();

    // Create student document
    const studentRef = await addDoc(collection(db, 'users'), {
      name: studentData.name,
      email: studentData.email || null,
      phoneNumber: studentData.phoneNumber || null,
      studentId: studentId,
      role: 'student',
      schoolId: schoolId,
      registeredBy: teacherId,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return {
      id: studentRef.id,
      studentId: studentId,
      name: studentData.name,
      email: studentData.email,
      phoneNumber: studentData.phoneNumber
    };
  } catch (error) {
    console.error('Error registering student:', error);
    throw error;
  }
};

/**
 * Get all students for a school
 * @param {string} schoolId - The school ID
 * @returns {Promise<Array>} - Array of student documents
 */
export const getSchoolStudents = async (schoolId) => {
  try {
    const studentsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'student'),
      where('schoolId', '==', schoolId),
      where('status', '==', 'active')
    );
    const snapshot = await getDocs(studentsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching school students:', error);
    throw error;
  }
};

/**
 * Get students registered by a specific teacher
 * @param {string} teacherId - The teacher's user ID
 * @returns {Promise<Array>} - Array of student documents
 */
export const getTeacherStudents = async (teacherId) => {
  try {
    const studentsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'student'),
      where('registeredBy', '==', teacherId),
      where('status', '==', 'active')
    );
    const snapshot = await getDocs(studentsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching teacher students:', error);
    throw error;
  }
};

/**
 * Update student information
 * @param {string} studentId - The student's document ID
 * @param {object} updates - Fields to update
 * @returns {Promise<void>}
 */
export const updateStudent = async (studentId, updates) => {
  try {
    const studentRef = doc(db, 'users', studentId);
    await updateDoc(studentRef, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating student:', error);
    throw error;
  }
};

/**
 * Deactivate a student (soft delete)
 * @param {string} studentId - The student's document ID
 * @returns {Promise<void>}
 */
export const deactivateStudent = async (studentId) => {
  try {
    const studentRef = doc(db, 'users', studentId);
    await updateDoc(studentRef, {
      status: 'inactive',
      deactivatedAt: new Date(),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error deactivating student:', error);
    throw error;
  }
};

/**
 * Get student by student ID (for login)
 * @param {string} studentId - The student ID (e.g., STU-ABC123)
 * @returns {Promise<object|null>} - Student document or null
 */
export const getStudentByStudentId = async (studentId) => {
  try {
    const q = query(
      collection(db, 'users'),
      where('studentId', '==', studentId.toUpperCase()),
      where('role', '==', 'student')
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('Error fetching student by ID:', error);
    throw error;
  }
};

/**
 * Verify student ID and return student data
 * @param {string} studentId - The student ID
 * @returns {Promise<object>} - Student data if valid
 */
export const verifyStudentId = async (studentId) => {
  const student = await getStudentByStudentId(studentId);
  
  if (!student) {
    throw new Error('Invalid Student ID');
  }
  
  if (student.status !== 'active') {
    throw new Error('Student account is inactive');
  }
  
  return student;
};
