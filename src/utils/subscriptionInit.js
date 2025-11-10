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
 * Check if a user needs subscription initialization
 * @param {string} userId - The user ID
 * @param {string} role - The user role
 * @returns {boolean}
 */
export const needsSubscriptionInit = (role) => {
  return role === "teacher";
};
