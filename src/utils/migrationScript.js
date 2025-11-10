import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc 
} from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Migration script to create Free plan subscriptions for all existing teachers
 * This script:
 * 1. Finds all teachers in the system
 * 2. Counts their existing subjects (exams) and students
 * 3. Creates a subscription document with Free plan limits
 * 4. Populates current usage counts
 */

const FREE_PLAN_CONFIG = {
  planTier: 'free',
  status: 'active',
  subjectLimit: 3,
  studentLimit: 10,
  amount: 0,
  currency: 'NGN',
  expiryDate: null,
  lastPaymentDate: null,
  paystackCustomerCode: null,
  paystackSubscriptionCode: null
};

/**
 * Count subjects (exams) created by a teacher
 */
const countTeacherSubjects = async (teacherId) => {
  try {
    const examsQuery = query(
      collection(db, "exams"),
      where("teacherId", "==", teacherId)
    );
    const examsSnapshot = await getDocs(examsQuery);
    return examsSnapshot.size;
  } catch (error) {
    console.error(`Error counting subjects for teacher ${teacherId}:`, error);
    return 0;
  }
};

/**
 * Count students in the same school as the teacher
 */
const countTeacherStudents = async (teacherId, schoolId) => {
  try {
    if (!schoolId) {
      return 0;
    }

    const studentsQuery = query(
      collection(db, "users"),
      where("role", "==", "student"),
      where("schoolId", "==", schoolId),
      where("status", "==", "active")
    );
    const studentsSnapshot = await getDocs(studentsQuery);
    return studentsSnapshot.size;
  } catch (error) {
    console.error(`Error counting students for teacher ${teacherId}:`, error);
    return 0;
  }
};

/**
 * Create subscription document for a teacher
 */
const createSubscriptionForTeacher = async (teacherId, teacherData, subjectCount, studentCount) => {
  try {
    const subscriptionRef = doc(db, "subscriptions", teacherId);
    
    // Check if subscription already exists
    const existingDoc = await getDoc(subscriptionRef);
    if (existingDoc.exists()) {
      console.log(`Subscription already exists for teacher ${teacherId}, skipping...`);
      return { success: true, skipped: true };
    }

    const subscriptionData = {
      ...FREE_PLAN_CONFIG,
      teacherId,
      currentSubjects: subjectCount,
      currentStudents: studentCount,
      startDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(subscriptionRef, subscriptionData);
    
    console.log(`✓ Created subscription for teacher ${teacherId} (${teacherData.name || 'Unknown'})`);
    console.log(`  - Subjects: ${subjectCount}/${FREE_PLAN_CONFIG.subjectLimit}`);
    console.log(`  - Students: ${studentCount}/${FREE_PLAN_CONFIG.studentLimit}`);
    
    return { success: true, skipped: false };
  } catch (error) {
    console.error(`Error creating subscription for teacher ${teacherId}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Main migration function
 */
export const migrateExistingTeachers = async () => {
  console.log("=== Starting Teacher Subscription Migration ===\n");
  
  const results = {
    total: 0,
    created: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };

  try {
    // Fetch all teachers
    const teachersQuery = query(
      collection(db, "users"),
      where("role", "==", "teacher")
    );
    
    const teachersSnapshot = await getDocs(teachersQuery);
    results.total = teachersSnapshot.size;
    
    console.log(`Found ${results.total} teachers to migrate\n`);

    if (results.total === 0) {
      console.log("No teachers found in the system.");
      return results;
    }

    // Process each teacher
    for (const teacherDoc of teachersSnapshot.docs) {
      const teacherId = teacherDoc.id;
      const teacherData = teacherDoc.data();
      
      console.log(`\nProcessing teacher: ${teacherData.name || 'Unknown'} (${teacherId})`);
      
      // Count existing subjects and students
      const subjectCount = await countTeacherSubjects(teacherId);
      const studentCount = await countTeacherStudents(teacherId, teacherData.schoolId);
      
      // Create subscription
      const result = await createSubscriptionForTeacher(
        teacherId, 
        teacherData, 
        subjectCount, 
        studentCount
      );
      
      if (result.success) {
        if (result.skipped) {
          results.skipped++;
        } else {
          results.created++;
        }
      } else {
        results.failed++;
        results.errors.push({
          teacherId,
          teacherName: teacherData.name || 'Unknown',
          error: result.error
        });
      }
    }

    // Print summary
    console.log("\n=== Migration Summary ===");
    console.log(`Total teachers: ${results.total}`);
    console.log(`Subscriptions created: ${results.created}`);
    console.log(`Already existed (skipped): ${results.skipped}`);
    console.log(`Failed: ${results.failed}`);
    
    if (results.errors.length > 0) {
      console.log("\n=== Errors ===");
      results.errors.forEach(err => {
        console.log(`- ${err.teacherName} (${err.teacherId}): ${err.error}`);
      });
    }
    
    console.log("\n=== Migration Complete ===");
    
    return results;
  } catch (error) {
    console.error("Fatal error during migration:", error);
    throw error;
  }
};

/**
 * Validate migration results
 */
export const validateMigration = async () => {
  console.log("\n=== Validating Migration ===\n");
  
  const validation = {
    teachersWithoutSubscriptions: [],
    subscriptionsWithIncorrectCounts: [],
    totalTeachers: 0,
    totalSubscriptions: 0
  };

  try {
    // Get all teachers
    const teachersQuery = query(
      collection(db, "users"),
      where("role", "==", "teacher")
    );
    const teachersSnapshot = await getDocs(teachersQuery);
    validation.totalTeachers = teachersSnapshot.size;

    // Get all subscriptions
    const subscriptionsSnapshot = await getDocs(collection(db, "subscriptions"));
    validation.totalSubscriptions = subscriptionsSnapshot.size;

    console.log(`Total teachers: ${validation.totalTeachers}`);
    console.log(`Total subscriptions: ${validation.totalSubscriptions}`);

    // Check each teacher has a subscription
    for (const teacherDoc of teachersSnapshot.docs) {
      const teacherId = teacherDoc.id;
      const teacherData = teacherDoc.data();
      
      const subscriptionRef = doc(db, "subscriptions", teacherId);
      const subscriptionDoc = await getDoc(subscriptionRef);
      
      if (!subscriptionDoc.exists()) {
        validation.teachersWithoutSubscriptions.push({
          id: teacherId,
          name: teacherData.name || 'Unknown'
        });
      } else {
        // Validate usage counts
        const subscription = subscriptionDoc.data();
        const actualSubjects = await countTeacherSubjects(teacherId);
        const actualStudents = await countTeacherStudents(teacherId, teacherData.schoolId);
        
        if (subscription.currentSubjects !== actualSubjects || 
            subscription.currentStudents !== actualStudents) {
          validation.subscriptionsWithIncorrectCounts.push({
            teacherId,
            teacherName: teacherData.name || 'Unknown',
            expected: { subjects: actualSubjects, students: actualStudents },
            actual: { subjects: subscription.currentSubjects, students: subscription.currentStudents }
          });
        }
      }
    }

    // Print validation results
    console.log("\n=== Validation Results ===");
    
    if (validation.teachersWithoutSubscriptions.length === 0) {
      console.log("✓ All teachers have subscriptions");
    } else {
      console.log(`✗ ${validation.teachersWithoutSubscriptions.length} teachers without subscriptions:`);
      validation.teachersWithoutSubscriptions.forEach(t => {
        console.log(`  - ${t.name} (${t.id})`);
      });
    }

    if (validation.subscriptionsWithIncorrectCounts.length === 0) {
      console.log("✓ All usage counts are accurate");
    } else {
      console.log(`✗ ${validation.subscriptionsWithIncorrectCounts.length} subscriptions with incorrect counts:`);
      validation.subscriptionsWithIncorrectCounts.forEach(s => {
        console.log(`  - ${s.teacherName} (${s.teacherId})`);
        console.log(`    Expected: ${s.expected.subjects} subjects, ${s.expected.students} students`);
        console.log(`    Actual: ${s.actual.subjects} subjects, ${s.actual.students} students`);
      });
    }

    console.log("\n=== Validation Complete ===");
    
    return validation;
  } catch (error) {
    console.error("Error during validation:", error);
    throw error;
  }
};
