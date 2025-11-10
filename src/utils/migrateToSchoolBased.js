/**
 * Migration Script: Teacher-Based to School-Based Subscriptions
 * 
 * This script migrates existing teacher subscriptions to the new school-based model.
 * Each teacher becomes a school admin with their own school.
 * 
 * IMPORTANT: Run this script once during deployment. Test in staging first!
 */

import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  writeBatch,
  query,
  where 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { createSchoolDocument, createTeacherSchoolDocument, SCHOOL_ROLES } from '../firebase/subscriptionModels';

/**
 * Migrate a single teacher subscription to school-based model
 * @param {object} teacherSubscription - The teacher's subscription data
 * @param {string} teacherId - The teacher's user ID
 * @param {object} userData - The teacher's user data (for school name)
 * @returns {Promise<object>} - Migration result
 */
async function migrateTeacherToSchool(teacherSubscription, teacherId, userData) {
  const batch = writeBatch(db);
  
  try {
    // Create school document
    const schoolRef = doc(collection(db, 'schools'));
    const schoolName = userData?.displayName 
      ? `${userData.displayName}'s School` 
      : `School ${teacherId.substring(0, 8)}`;
    
    const schoolData = {
      name: schoolName,
      adminUserId: teacherId,
      planTier: teacherSubscription.planTier || 'free',
      status: teacherSubscription.status || 'active',
      
      // Copy limits from teacher subscription
      subjectLimit: teacherSubscription.subjectLimit || 3,
      studentLimit: teacherSubscription.studentLimit || 10,
      
      // Copy usage from teacher subscription
      currentSubjects: teacherSubscription.currentSubjects || 0,
      currentStudents: teacherSubscription.currentStudents || 0,
      
      // Single teacher initially
      teacherCount: 1,
      
      // Copy payment info
      amount: teacherSubscription.amount || 0,
      currency: teacherSubscription.currency || 'NGN',
      
      // Copy timestamps
      startDate: teacherSubscription.startDate || new Date(),
      expiryDate: teacherSubscription.expiryDate || null,
      lastPaymentDate: teacherSubscription.lastPaymentDate || null,
      
      // Copy payment tracking
      paystackCustomerCode: teacherSubscription.paystackCustomerCode || null,
      paystackSubscriptionCode: teacherSubscription.paystackSubscriptionCode || null,
      
      // Metadata
      createdAt: teacherSubscription.createdAt || new Date(),
      updatedAt: new Date(),
      migratedFrom: teacherId,
      migrationDate: new Date()
    };
    
    batch.set(schoolRef, schoolData);
    
    // Create teacher-school relationship
    const teacherRef = doc(db, 'teachers', teacherId);
    const teacherData = createTeacherSchoolDocument(teacherId, schoolRef.id, SCHOOL_ROLES.ADMIN);
    
    // Copy individual usage
    teacherData.currentSubjects = teacherSubscription.currentSubjects || 0;
    teacherData.currentStudents = teacherSubscription.currentStudents || 0;
    teacherData.joinedAt = teacherSubscription.createdAt || new Date();
    
    batch.set(teacherRef, teacherData);
    
    // Commit the batch
    await batch.commit();
    
    return {
      success: true,
      teacherId,
      schoolId: schoolRef.id,
      schoolName,
      message: `Successfully migrated teacher ${teacherId} to school ${schoolRef.id}`
    };
    
  } catch (error) {
    console.error(`Error migrating teacher ${teacherId}:`, error);
    return {
      success: false,
      teacherId,
      error: error.message,
      message: `Failed to migrate teacher ${teacherId}`
    };
  }
}

/**
 * Migrate transaction documents to include schoolId
 * @param {string} teacherId - The teacher's user ID
 * @param {string} schoolId - The new school ID
 * @returns {Promise<number>} - Number of transactions updated
 */
async function migrateTeacherTransactions(teacherId, schoolId) {
  try {
    // Get all transactions for this teacher
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('teacherId', '==', teacherId)
    );
    
    const transactionsSnapshot = await getDocs(transactionsQuery);
    
    if (transactionsSnapshot.empty) {
      return 0;
    }
    
    const batch = writeBatch(db);
    let count = 0;
    
    transactionsSnapshot.forEach((transactionDoc) => {
      const transactionRef = doc(db, 'transactions', transactionDoc.id);
      batch.update(transactionRef, {
        schoolId,
        paidByUserId: teacherId,
        migratedAt: new Date()
      });
      count++;
    });
    
    await batch.commit();
    return count;
    
  } catch (error) {
    console.error(`Error migrating transactions for teacher ${teacherId}:`, error);
    return 0;
  }
}

/**
 * Get user data for a teacher
 * @param {string} teacherId - The teacher's user ID
 * @returns {Promise<object|null>} - User data or null
 */
async function getUserData(teacherId) {
  try {
    const userRef = doc(db, 'users', teacherId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data();
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching user data for ${teacherId}:`, error);
    return null;
  }
}

/**
 * Main migration function
 * Migrates all teacher subscriptions to school-based model
 * @returns {Promise<object>} - Migration summary
 */
export async function migrateAllToSchoolBased() {
  console.log('Starting migration to school-based subscriptions...');
  
  const results = {
    total: 0,
    successful: 0,
    failed: 0,
    transactionsMigrated: 0,
    errors: [],
    details: []
  };
  
  try {
    // Get all teacher subscriptions
    const subscriptionsSnapshot = await getDocs(collection(db, 'subscriptions'));
    results.total = subscriptionsSnapshot.size;
    
    console.log(`Found ${results.total} teacher subscriptions to migrate`);
    
    // Migrate each teacher
    for (const subscriptionDoc of subscriptionsSnapshot.docs) {
      const teacherId = subscriptionDoc.id;
      const subscriptionData = subscriptionDoc.data();
      
      console.log(`Migrating teacher ${teacherId}...`);
      
      // Get user data for school name
      const userData = await getUserData(teacherId);
      
      // Migrate teacher to school
      const migrationResult = await migrateTeacherToSchool(
        subscriptionData,
        teacherId,
        userData
      );
      
      results.details.push(migrationResult);
      
      if (migrationResult.success) {
        results.successful++;
        
        // Migrate transactions
        const transactionCount = await migrateTeacherTransactions(
          teacherId,
          migrationResult.schoolId
        );
        
        results.transactionsMigrated += transactionCount;
        
        console.log(`✓ Migrated teacher ${teacherId} (${transactionCount} transactions)`);
      } else {
        results.failed++;
        results.errors.push({
          teacherId,
          error: migrationResult.error
        });
        
        console.error(`✗ Failed to migrate teacher ${teacherId}`);
      }
      
      // Add a small delay to avoid overwhelming Firestore
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\nMigration Summary:');
    console.log(`Total teachers: ${results.total}`);
    console.log(`Successful: ${results.successful}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Transactions migrated: ${results.transactionsMigrated}`);
    
    if (results.errors.length > 0) {
      console.log('\nErrors:');
      results.errors.forEach(err => {
        console.log(`- Teacher ${err.teacherId}: ${err.error}`);
      });
    }
    
    return results;
    
  } catch (error) {
    console.error('Fatal error during migration:', error);
    throw error;
  }
}

/**
 * Verify migration results
 * Checks that all teachers have corresponding schools and teacher documents
 * @returns {Promise<object>} - Verification results
 */
export async function verifyMigration() {
  console.log('Verifying migration...');
  
  const verification = {
    teachersChecked: 0,
    schoolsFound: 0,
    teacherDocsFound: 0,
    missingSchools: [],
    missingTeacherDocs: [],
    usageMismatches: []
  };
  
  try {
    // Get all subscriptions
    const subscriptionsSnapshot = await getDocs(collection(db, 'subscriptions'));
    verification.teachersChecked = subscriptionsSnapshot.size;
    
    for (const subscriptionDoc of subscriptionsSnapshot.docs) {
      const teacherId = subscriptionDoc.id;
      const subscriptionData = subscriptionDoc.data();
      
      // Check if teacher document exists
      const teacherRef = doc(db, 'teachers', teacherId);
      const teacherDoc = await getDoc(teacherRef);
      
      if (teacherDoc.exists()) {
        verification.teacherDocsFound++;
        
        const teacherData = teacherDoc.data();
        
        // Check if school exists
        const schoolRef = doc(db, 'schools', teacherData.schoolId);
        const schoolDoc = await getDoc(schoolRef);
        
        if (schoolDoc.exists()) {
          verification.schoolsFound++;
          
          // Verify usage matches
          const schoolData = schoolDoc.data();
          if (
            schoolData.currentSubjects !== subscriptionData.currentSubjects ||
            schoolData.currentStudents !== subscriptionData.currentStudents
          ) {
            verification.usageMismatches.push({
              teacherId,
              schoolId: teacherData.schoolId,
              subscription: {
                subjects: subscriptionData.currentSubjects,
                students: subscriptionData.currentStudents
              },
              school: {
                subjects: schoolData.currentSubjects,
                students: schoolData.currentStudents
              }
            });
          }
        } else {
          verification.missingSchools.push(teacherId);
        }
      } else {
        verification.missingTeacherDocs.push(teacherId);
      }
    }
    
    console.log('\nVerification Results:');
    console.log(`Teachers checked: ${verification.teachersChecked}`);
    console.log(`Schools found: ${verification.schoolsFound}`);
    console.log(`Teacher docs found: ${verification.teacherDocsFound}`);
    console.log(`Missing schools: ${verification.missingSchools.length}`);
    console.log(`Missing teacher docs: ${verification.missingTeacherDocs.length}`);
    console.log(`Usage mismatches: ${verification.usageMismatches.length}`);
    
    if (verification.missingSchools.length > 0) {
      console.log('\nTeachers with missing schools:');
      verification.missingSchools.forEach(id => console.log(`- ${id}`));
    }
    
    if (verification.missingTeacherDocs.length > 0) {
      console.log('\nTeachers with missing teacher docs:');
      verification.missingTeacherDocs.forEach(id => console.log(`- ${id}`));
    }
    
    if (verification.usageMismatches.length > 0) {
      console.log('\nUsage mismatches:');
      verification.usageMismatches.forEach(mismatch => {
        console.log(`- Teacher ${mismatch.teacherId}:`);
        console.log(`  Subscription: ${mismatch.subscription.subjects} subjects, ${mismatch.subscription.students} students`);
        console.log(`  School: ${mismatch.school.subjects} subjects, ${mismatch.school.students} students`);
      });
    }
    
    return verification;
    
  } catch (error) {
    console.error('Error during verification:', error);
    throw error;
  }
}

/**
 * Rollback migration (use with caution!)
 * This will delete all schools and teacher documents created during migration
 * @returns {Promise<object>} - Rollback results
 */
export async function rollbackMigration() {
  console.warn('WARNING: Rolling back migration. This will delete all schools and teacher documents!');
  
  const results = {
    schoolsDeleted: 0,
    teacherDocsDeleted: 0,
    errors: []
  };
  
  try {
    // Delete all schools
    const schoolsSnapshot = await getDocs(collection(db, 'schools'));
    const schoolBatch = writeBatch(db);
    
    schoolsSnapshot.forEach((schoolDoc) => {
      schoolBatch.delete(doc(db, 'schools', schoolDoc.id));
      results.schoolsDeleted++;
    });
    
    await schoolBatch.commit();
    console.log(`Deleted ${results.schoolsDeleted} schools`);
    
    // Delete all teacher documents
    const teachersSnapshot = await getDocs(collection(db, 'teachers'));
    const teacherBatch = writeBatch(db);
    
    teachersSnapshot.forEach((teacherDoc) => {
      teacherBatch.delete(doc(db, 'teachers', teacherDoc.id));
      results.teacherDocsDeleted++;
    });
    
    await teacherBatch.commit();
    console.log(`Deleted ${results.teacherDocsDeleted} teacher documents`);
    
    console.log('Rollback complete');
    return results;
    
  } catch (error) {
    console.error('Error during rollback:', error);
    results.errors.push(error.message);
    throw error;
  }
}

// Export individual functions for testing
export {
  migrateTeacherToSchool,
  migrateTeacherTransactions,
  getUserData
};
