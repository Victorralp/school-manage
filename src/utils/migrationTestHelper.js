import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc,
  getDocs,
  query,
  where
} from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Test helper functions for migration script
 * These functions help set up test data and clean up after testing
 */

/**
 * Create sample teachers for testing
 */
export const createSampleTeachers = async () => {
  console.log("Creating sample teachers for testing...\n");
  
  const sampleTeachers = [
    {
      id: "test-teacher-1",
      name: "John Doe",
      email: "john.doe@test.com",
      role: "teacher",
      schoolId: "test-school-1",
      status: "active",
      createdAt: new Date()
    },
    {
      id: "test-teacher-2",
      name: "Jane Smith",
      email: "jane.smith@test.com",
      role: "teacher",
      schoolId: "test-school-1",
      status: "active",
      createdAt: new Date()
    },
    {
      id: "test-teacher-3",
      name: "Bob Johnson",
      email: "bob.johnson@test.com",
      role: "teacher",
      schoolId: "test-school-2",
      status: "active",
      createdAt: new Date()
    },
    {
      id: "test-teacher-4",
      name: "Alice Williams",
      email: "alice.williams@test.com",
      role: "teacher",
      schoolId: null, // Teacher without school
      status: "active",
      createdAt: new Date()
    }
  ];

  for (const teacher of sampleTeachers) {
    const teacherRef = doc(db, "users", teacher.id);
    await setDoc(teacherRef, teacher);
    console.log(`✓ Created teacher: ${teacher.name} (${teacher.id})`);
  }

  console.log(`\nCreated ${sampleTeachers.length} sample teachers\n`);
  return sampleTeachers;
};

/**
 * Create sample exams (subjects) for testing
 */
export const createSampleExams = async () => {
  console.log("Creating sample exams for testing...\n");
  
  const sampleExams = [
    // Teacher 1: 2 exams (within free limit)
    {
      id: "test-exam-1",
      title: "Math Final",
      subject: "Mathematics",
      teacherId: "test-teacher-1",
      teacherName: "John Doe",
      schoolId: "test-school-1",
      totalQuestions: 10,
      timeLimit: 60,
      createdAt: new Date()
    },
    {
      id: "test-exam-2",
      title: "Science Quiz",
      subject: "Science",
      teacherId: "test-teacher-1",
      teacherName: "John Doe",
      schoolId: "test-school-1",
      totalQuestions: 15,
      timeLimit: 45,
      createdAt: new Date()
    },
    // Teacher 2: 5 exams (exceeds free limit)
    {
      id: "test-exam-3",
      title: "English Test",
      subject: "English",
      teacherId: "test-teacher-2",
      teacherName: "Jane Smith",
      schoolId: "test-school-1",
      totalQuestions: 20,
      timeLimit: 90,
      createdAt: new Date()
    },
    {
      id: "test-exam-4",
      title: "History Exam",
      subject: "History",
      teacherId: "test-teacher-2",
      teacherName: "Jane Smith",
      schoolId: "test-school-1",
      totalQuestions: 25,
      timeLimit: 120,
      createdAt: new Date()
    },
    {
      id: "test-exam-5",
      title: "Geography Quiz",
      subject: "Geography",
      teacherId: "test-teacher-2",
      teacherName: "Jane Smith",
      schoolId: "test-school-1",
      totalQuestions: 12,
      timeLimit: 30,
      createdAt: new Date()
    },
    {
      id: "test-exam-6",
      title: "Physics Test",
      subject: "Physics",
      teacherId: "test-teacher-2",
      teacherName: "Jane Smith",
      schoolId: "test-school-1",
      totalQuestions: 18,
      timeLimit: 75,
      createdAt: new Date()
    },
    {
      id: "test-exam-7",
      title: "Chemistry Exam",
      subject: "Chemistry",
      teacherId: "test-teacher-2",
      teacherName: "Jane Smith",
      schoolId: "test-school-1",
      totalQuestions: 22,
      timeLimit: 100,
      createdAt: new Date()
    },
    // Teacher 3: 0 exams
    // Teacher 4: 1 exam
    {
      id: "test-exam-8",
      title: "Art Project",
      subject: "Art",
      teacherId: "test-teacher-4",
      teacherName: "Alice Williams",
      schoolId: null,
      totalQuestions: 5,
      timeLimit: 30,
      createdAt: new Date()
    }
  ];

  for (const exam of sampleExams) {
    const examRef = doc(db, "exams", exam.id);
    await setDoc(examRef, exam);
    console.log(`✓ Created exam: ${exam.title} (Teacher: ${exam.teacherName})`);
  }

  console.log(`\nCreated ${sampleExams.length} sample exams\n`);
  return sampleExams;
};

/**
 * Create sample students for testing
 */
export const createSampleStudents = async () => {
  console.log("Creating sample students for testing...\n");
  
  const sampleStudents = [
    // School 1: 8 students (within free limit)
    ...Array.from({ length: 8 }, (_, i) => ({
      id: `test-student-school1-${i + 1}`,
      name: `Student ${i + 1} School 1`,
      email: `student${i + 1}.school1@test.com`,
      role: "student",
      schoolId: "test-school-1",
      status: "active",
      createdAt: new Date()
    })),
    // School 2: 15 students (exceeds free limit)
    ...Array.from({ length: 15 }, (_, i) => ({
      id: `test-student-school2-${i + 1}`,
      name: `Student ${i + 1} School 2`,
      email: `student${i + 1}.school2@test.com`,
      role: "student",
      schoolId: "test-school-2",
      status: "active",
      createdAt: new Date()
    }))
  ];

  for (const student of sampleStudents) {
    const studentRef = doc(db, "users", student.id);
    await setDoc(studentRef, student);
  }

  console.log(`✓ Created ${sampleStudents.length} sample students`);
  console.log(`  - School 1: 8 students`);
  console.log(`  - School 2: 15 students\n`);
  
  return sampleStudents;
};

/**
 * Clean up all test data
 */
export const cleanupTestData = async () => {
  console.log("\nCleaning up test data...\n");
  
  let deletedCount = 0;

  try {
    // Delete test teachers
    const teachersQuery = query(
      collection(db, "users"),
      where("email", ">=", ""),
      where("email", "<=", "~")
    );
    const teachersSnapshot = await getDocs(teachersQuery);
    
    for (const docSnapshot of teachersSnapshot.docs) {
      if (docSnapshot.id.startsWith("test-")) {
        await deleteDoc(doc(db, "users", docSnapshot.id));
        deletedCount++;
      }
    }

    // Delete test exams
    const examsQuery = query(collection(db, "exams"));
    const examsSnapshot = await getDocs(examsQuery);
    
    for (const docSnapshot of examsSnapshot.docs) {
      if (docSnapshot.id.startsWith("test-")) {
        await deleteDoc(doc(db, "exams", docSnapshot.id));
        deletedCount++;
      }
    }

    // Delete test subscriptions
    const subscriptionsQuery = query(collection(db, "subscriptions"));
    const subscriptionsSnapshot = await getDocs(subscriptionsQuery);
    
    for (const docSnapshot of subscriptionsSnapshot.docs) {
      if (docSnapshot.id.startsWith("test-")) {
        await deleteDoc(doc(db, "subscriptions", docSnapshot.id));
        deletedCount++;
      }
    }

    console.log(`✓ Deleted ${deletedCount} test documents\n`);
    return { success: true, deletedCount };
  } catch (error) {
    console.error("Error cleaning up test data:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Set up complete test environment
 */
export const setupTestEnvironment = async () => {
  console.log("=== Setting Up Test Environment ===\n");
  
  try {
    // Clean up any existing test data first
    await cleanupTestData();
    
    // Create test data
    const teachers = await createSampleTeachers();
    const exams = await createSampleExams();
    const students = await createSampleStudents();
    
    console.log("=== Test Environment Ready ===");
    console.log(`Teachers: ${teachers.length}`);
    console.log(`Exams: ${exams.length}`);
    console.log(`Students: ${students.length}\n`);
    
    return {
      success: true,
      teachers,
      exams,
      students
    };
  } catch (error) {
    console.error("Error setting up test environment:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verify migration results for test data
 */
export const verifyTestMigration = async () => {
  console.log("\n=== Verifying Test Migration ===\n");
  
  const expectedResults = {
    "test-teacher-1": { subjects: 2, students: 8 },
    "test-teacher-2": { subjects: 5, students: 8 },
    "test-teacher-3": { subjects: 0, students: 15 },
    "test-teacher-4": { subjects: 1, students: 0 }
  };

  const results = {
    passed: [],
    failed: []
  };

  for (const [teacherId, expected] of Object.entries(expectedResults)) {
    const subscriptionRef = doc(db, "subscriptions", teacherId);
    const subscriptionDoc = await getDocs(subscriptionRef);
    
    if (!subscriptionDoc.exists()) {
      results.failed.push({
        teacherId,
        reason: "Subscription not found"
      });
      continue;
    }

    const subscription = subscriptionDoc.data();
    
    if (subscription.currentSubjects === expected.subjects && 
        subscription.currentStudents === expected.students) {
      results.passed.push(teacherId);
      console.log(`✓ ${teacherId}: Correct (${expected.subjects} subjects, ${expected.students} students)`);
    } else {
      results.failed.push({
        teacherId,
        expected,
        actual: {
          subjects: subscription.currentSubjects,
          students: subscription.currentStudents
        }
      });
      console.log(`✗ ${teacherId}: Incorrect`);
      console.log(`  Expected: ${expected.subjects} subjects, ${expected.students} students`);
      console.log(`  Actual: ${subscription.currentSubjects} subjects, ${subscription.currentStudents} students`);
    }
  }

  console.log(`\n=== Verification Complete ===`);
  console.log(`Passed: ${results.passed.length}/${Object.keys(expectedResults).length}`);
  console.log(`Failed: ${results.failed.length}/${Object.keys(expectedResults).length}\n`);

  return results;
};
