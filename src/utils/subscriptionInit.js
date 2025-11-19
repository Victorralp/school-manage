import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Initialize a Free plan subscription for a new teacher
 * @param {string} teacherId - The teacher's user ID
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const initializeTeacherSubscription = async (teacherId) => {
  try {
    const subscriptionRef = doc(db, "subscriptions", teacherId);
    
    // Check if subscription already exists
    const existingSubscription = await getDoc(subscriptionRef);
    if (existingSubscription.exists()) {
      return {
        success: true,
        message: "Subscription already exists"
      };
    }

    // Create Free plan subscription
    const subscriptionData = {
      teacherId,
      planTier: "free",
      status: "active",
      
      // Free plan limits
      subjectLimit: 3,
      studentLimit: 10,
      
      // Initial usage counts
      currentSubjects: 0,
      currentStudents: 0,
      
      // Payment info (free plan)
      amount: 0,
      currency: "NGN",
      
      // Timestamps
      startDate: new Date(),
      expiryDate: null, // Free plan doesn't expire
      lastPaymentDate: null,
      
      // Payment tracking (null for free plan)
      paystackCustomerCode: null,
      paystackSubscriptionCode: null,
      
      // Metadata
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(subscriptionRef, subscriptionData);

    return {
      success: true,
      message: "Free plan subscription created successfully"
    };
  } catch (error) {
    console.error("Error initializing teacher subscription:", error);
    return {
      success: false,
      message: error.message || "Failed to initialize subscription"
    };
  }
};

/**
 * Initialize a Free plan subscription for a new school
 * @param {string} schoolId - The school's ID
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const initializeSchoolSubscription = async (schoolId) => {
  try {
    const schoolRef = doc(db, "schools", schoolId);
    
    // Check if school document exists
    const schoolDoc = await getDoc(schoolRef);
    if (!schoolDoc.exists()) {
      return {
        success: false,
        message: "School document not found"
      };
    }

    // Check if subscription already exists
    const schoolData = schoolDoc.data();
    if (schoolData.planTier) {
      return {
        success: true,
        message: "Subscription already exists"
      };
    }

    // Update school document with Free plan subscription
    const subscriptionData = {
      planTier: "free",
      status: "active",
      
      // Free plan limits (school-wide)
      subjectLimit: 10,
      studentLimit: 50,
      
      // Initial usage counts
      currentSubjects: 0,
      currentStudents: 0,
      
      // Payment info (free plan)
      amount: 0,
      currency: "NGN",
      
      // Timestamps
      startDate: new Date(),
      expiryDate: null, // Free plan doesn't expire
      lastPaymentDate: null,
      
      // Payment tracking (null for free plan)
      paystackCustomerCode: null,
      paystackSubscriptionCode: null,
      
      // Metadata
      subscriptionCreatedAt: new Date(),
      subscriptionUpdatedAt: new Date()
    };

    await setDoc(schoolRef, subscriptionData, { merge: true });

    return {
      success: true,
      message: "Free plan subscription created successfully for school"
    };
  } catch (error) {
    console.error("Error initializing school subscription:", error);
    return {
      success: false,
      message: error.message || "Failed to initialize school subscription"
    };
  }
};

/**
 * Check if a user needs subscription initialization
 * @param {string} userId - The user ID
 * @param {string} role - The user role
 * @returns {boolean}
 */
export const needsSubscriptionInit = (role) => {
  return role === "teacher" || role === "school";
};
