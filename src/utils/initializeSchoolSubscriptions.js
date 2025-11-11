/**
 * Initialize School Subscriptions for Existing School Role Users
 * 
 * This script creates school subscription documents for users with role="school"
 * Run this once to migrate existing school accounts to the new subscription system
 */

import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { createSchoolDocument } from '../firebase/subscriptionModels';

/**
 * Initialize subscription for a single school
 * @param {string} schoolId - The school's user ID
 * @param {object} schoolUserData - The school's user data
 * @returns {Promise<object>} - Result
 */
export async function initializeSchoolSubscription(schoolId, schoolUserData) {
  try {
    // Check if school subscription already exists
    const schoolRef = doc(db, 'schools', schoolId);
    const schoolDoc = await getDoc(schoolRef);
    
    if (schoolDoc.exists()) {
      const existingData = schoolDoc.data();
      // Check if it already has subscription fields
      if (existingData.planTier && existingData.subjectLimit) {
        console.log(`School ${schoolId} already has subscription`);
        return {
          success: true,
          message: 'School subscription already exists',
          schoolId
        };
      }
      // If it exists but doesn't have subscription fields, we'll update it below
      console.log(`School ${schoolId} exists but needs subscription fields`);
    }

    // Count existing subjects and students for this school
    const subjectsQuery = query(
      collection(db, 'exams'),
      where('schoolId', '==', schoolId)
    );
    const subjectsSnapshot = await getDocs(subjectsQuery);
    const currentSubjects = subjectsSnapshot.size;

    const studentsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'student'),
      where('schoolId', '==', schoolId),
      where('status', '==', 'active')
    );
    const studentsSnapshot = await getDocs(studentsQuery);
    const currentStudents = studentsSnapshot.size;

    // Count teachers
    const teachersQuery = query(
      collection(db, 'users'),
      where('role', '==', 'teacher'),
      where('schoolId', '==', schoolId),
      where('status', '==', 'active')
    );
    const teachersSnapshot = await getDocs(teachersQuery);
    const teacherCount = teachersSnapshot.size;

    // Create school subscription document
    const schoolData = createSchoolDocument(
      schoolUserData.name || 'School',
      schoolId,
      'free' // Start with free plan
    );

    // Update with actual usage
    schoolData.currentSubjects = currentSubjects;
    schoolData.currentStudents = currentStudents;
    schoolData.teacherCount = teacherCount;

    // Save to Firestore
    await setDoc(schoolRef, schoolData);

    console.log(`✓ Initialized subscription for school ${schoolId}`);
    console.log(`  - Subjects: ${currentSubjects}`);
    console.log(`  - Students: ${currentStudents}`);
    console.log(`  - Teachers: ${teacherCount}`);

    return {
      success: true,
      message: 'School subscription initialized',
      schoolId,
      data: {
        currentSubjects,
        currentStudents,
        teacherCount
      }
    };

  } catch (error) {
    console.error(`Error initializing school ${schoolId}:`, error);
    return {
      success: false,
      error: error.message,
      schoolId
    };
  }
}

/**
 * Initialize subscriptions for all school role users
 * @returns {Promise<object>} - Summary of results
 */
export async function initializeAllSchoolSubscriptions() {
  console.log('Starting school subscription initialization...');

  const results = {
    total: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  try {
    // Get all users with role="school"
    const schoolsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'school')
    );
    const schoolsSnapshot = await getDocs(schoolsQuery);
    
    results.total = schoolsSnapshot.size;
    console.log(`Found ${results.total} school accounts`);

    // Initialize each school
    for (const schoolDoc of schoolsSnapshot.docs) {
      const schoolId = schoolDoc.id;
      const schoolData = schoolDoc.data();

      console.log(`\nProcessing school: ${schoolData.name || schoolId}`);

      const result = await initializeSchoolSubscription(schoolId, schoolData);

      if (result.success) {
        if (result.message === 'School subscription already exists') {
          results.skipped++;
        } else {
          results.successful++;
        }
      } else {
        results.failed++;
        results.errors.push({
          schoolId,
          error: result.error
        });
      }

      // Small delay to avoid overwhelming Firestore
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n=== Initialization Summary ===');
    console.log(`Total schools: ${results.total}`);
    console.log(`Successful: ${results.successful}`);
    console.log(`Skipped (already exists): ${results.skipped}`);
    console.log(`Failed: ${results.failed}`);

    if (results.errors.length > 0) {
      console.log('\nErrors:');
      results.errors.forEach(err => {
        console.log(`- School ${err.schoolId}: ${err.error}`);
      });
    }

    return results;

  } catch (error) {
    console.error('Fatal error during initialization:', error);
    throw error;
  }
}

/**
 * Initialize subscription for the current logged-in school
 * @param {string} userId - Current user ID
 * @returns {Promise<object>} - Result
 */
export async function initializeCurrentSchoolSubscription(userId) {
  try {
    // Get user data
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();

    if (userData.role !== 'school') {
      throw new Error('User is not a school account');
    }

    // Initialize subscription
    const result = await initializeSchoolSubscription(userId, userData);

    return result;

  } catch (error) {
    console.error('Error initializing current school subscription:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
