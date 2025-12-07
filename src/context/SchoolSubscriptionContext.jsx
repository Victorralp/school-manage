import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./AuthContext";
import {
  getSchoolByTeacherId,
  getTeacherSchoolRelationship,
  subscribeToSchool,
  incrementUsage as incrementSchoolUsage,
  decrementUsage as decrementSchoolUsage,
  isSchoolAdmin as checkIsSchoolAdmin,
  updateSchoolPlan,
  createTransaction
} from "../firebase/schoolService";
import { processPayment } from "../utils/paymentVerification";
import { logSubscriptionCancellation } from "../utils/subscriptionEventLogger";

const SchoolSubscriptionContext = createContext();

export const SchoolSubscriptionProvider = ({ children }) => {
  const { user } = useAuth();
  const [school, setSchool] = useState(null);
  const [teacherRelationship, setTeacherRelationship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availablePlans, setAvailablePlans] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch and cache plan configuration
  useEffect(() => {
    const fetchPlanConfig = async () => {
      try {
        const planConfigRef = doc(db, "config", "plans");
        const planConfigDoc = await getDoc(planConfigRef);

        if (planConfigDoc.exists()) {
          const plans = planConfigDoc.data();
          setAvailablePlans(plans);
        } else {
          // Set default plan configuration
          const defaultPlans = {
            free: {
              name: "Free Plan",
              price: { NGN: 0, USD: 0 },
              subjectLimit: 3,
              studentLimit: 10,
              features: ["3 subjects per teacher", "Up to 10 students per teacher", "Limited support"]
            },
            premium: {
              name: "Premium Plan",
              price: { NGN: 1500, USD: 1 },
              subjectLimit: 6,
              studentLimit: { min: 15, max: 20 },
              billingCycle: "monthly",
              features: ["6 subjects per teacher", "15-20 students per teacher", "Priority support", "Advanced analytics"]
            },
            vip: {
              name: "VIP Plan",
              price: { NGN: 4500, USD: 3 },
              subjectLimit: { min: 6, max: 10 },
              studentLimit: 30,
              billingCycle: "monthly",
              features: ["6-10 subjects per teacher", "30 students per teacher", "24/7 support", "Custom features"]
            }
          };
          setAvailablePlans(defaultPlans);
        }
      } catch (err) {
        console.error("Error fetching plan configuration:", err);
        setError("Failed to load plan configuration");
      }
    };

    fetchPlanConfig();
  }, []);

  // Load teacher's school relationship and check admin status
  useEffect(() => {
    if (!user) {
      setTeacherRelationship(null);
      setSchool(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const loadTeacherData = async () => {
      try {
        setLoading(true);

        // Check if user has "school" role (they ARE the school)
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();

        if (userData?.role === 'school') {
          // User is a school admin - load school data directly
          // For school role, the user.uid IS the schoolId
          setTeacherRelationship({
            teacherId: user.uid,
            schoolId: user.uid,
            role: 'admin',
            currentSubjects: 0,
            currentStudents: 0
          });
          setIsAdmin(true);
        } else if (userData?.role === 'teacher') {
          // User is a teacher - get teacher-school relationship
          let relationship = await getTeacherSchoolRelationship(user.uid);

          // MIGRATION CASE: If no relationship exists but user has schoolId, create a temporary relationship
          if (!relationship && userData.schoolId) {
            console.log('Migration case: Teacher has schoolId but no relationship document');
            relationship = {
              teacherId: user.uid,
              schoolId: userData.schoolId,
              role: 'teacher',
              currentSubjects: 0,
              currentStudents: 0,
              status: 'active',
              joinedAt: new Date()
            };
          }

          setTeacherRelationship(relationship);

          if (relationship) {
            // Check if user is admin
            const adminStatus = await checkIsSchoolAdmin(user.uid);
            setIsAdmin(adminStatus);
          } else {
            setIsAdmin(false);
          }
        } else {
          // Not a school or teacher role
          setTeacherRelationship(null);
          setIsAdmin(false);
        }

        setError(null);
      } catch (err) {
        console.error("Error loading teacher data:", err);
        setError("Failed to load teacher information");
      } finally {
        setLoading(false);
      }
    };

    loadTeacherData();
  }, [user]);

  // Real-time school subscription listener
  useEffect(() => {
    if (!teacherRelationship?.schoolId) {
      console.log('No teacherRelationship.schoolId, skipping school subscription');
      setSchool(null);
      setCurrentPlan(null);
      return;
    }

    console.log('Subscribing to school:', teacherRelationship.schoolId);

    const unsubscribe = subscribeToSchool(
      teacherRelationship.schoolId,
      (schoolData, err) => {
        if (err) {
          console.error("Error listening to school:", err);
          setError("Failed to load school subscription data");
          return;
        }

        if (schoolData) {
          console.log('School data loaded:', schoolData);
          setSchool(schoolData);

          // Set current plan details
          if (availablePlans && schoolData.planTier) {
            setCurrentPlan(availablePlans[schoolData.planTier]);
          }

          setError(null);
        } else {
          console.log('No school data found for ID:', teacherRelationship.schoolId);
          setSchool(null);
          setCurrentPlan(null);
        }
      }
    );

    return () => unsubscribe();
  }, [teacherRelationship, availablePlans]);

  // Real-time teacher usage subscription
  useEffect(() => {
    if (!user || !teacherRelationship?.teacherId) {
      return;
    }

    const teacherRef = doc(db, 'teachers', user.uid);
    const unsubscribe = onSnapshot(
      teacherRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const teacherData = docSnapshot.data();
          // Update teacherRelationship with latest usage data
          setTeacherRelationship(prev => ({
            ...prev,
            currentSubjects: teacherData.currentSubjects || 0,
            currentStudents: teacherData.currentStudents || 0,
            updatedAt: teacherData.updatedAt
          }));
        }
      },
      (error) => {
        console.error('Error listening to teacher usage:', error);
      }
    );

    return () => unsubscribe();
  }, [user, teacherRelationship?.teacherId]);

  // Update current plan when school or available plans change
  useEffect(() => {
    if (school && availablePlans) {
      setCurrentPlan(availablePlans[school.planTier]);
    }
  }, [school, availablePlans]);

  // Helper function to get actual limit value (handles ranges)
  const getActualLimit = useCallback((limitValue) => {
    if (typeof limitValue === 'object' && limitValue.max) {
      return limitValue.max;
    }
    return limitValue;
  }, []);

  // Calculate usage metrics (SCHOOL-WIDE - all teachers share the pool)
  const subjectUsage = useMemo(() => {
    if (!school || !currentPlan) {
      return { current: 0, limit: 0, percentage: 0 };
    }
    const limit = getActualLimit(currentPlan.subjectLimit);
    const current = school.currentSubjects || 0;
    const percentage = limit > 0 ? Math.round((current / limit) * 100) : 0;
    return { current, limit, percentage };
  }, [school, currentPlan, getActualLimit]);

  const studentUsage = useMemo(() => {
    if (!school || !currentPlan) {
      return { current: 0, limit: 0, percentage: 0 };
    }
    const limit = getActualLimit(currentPlan.studentLimit);
    const current = school.currentStudents || 0;
    const percentage = limit > 0 ? Math.round((current / limit) * 100) : 0;
    return { current, limit, percentage };
  }, [school, currentPlan, getActualLimit]);

  // Teacher's individual usage
  const teacherUsage = useMemo(() => {
    if (!teacherRelationship) {
      return { subjects: 0, students: 0 };
    }
    return {
      subjects: teacherRelationship.currentSubjects || 0,
      students: teacherRelationship.currentStudents || 0
    };
  }, [teacherRelationship]);

  // Get question limit for current plan
  const questionLimit = useMemo(() => {
    if (!currentPlan) {
      return 10; // Default to free plan limit
    }
    return currentPlan.questionLimit || 10;
  }, [currentPlan]);

  // Increment usage count
  const incrementUsage = useCallback(async (type) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      await incrementSchoolUsage(user.uid, type);
    } catch (err) {
      console.error(`Error incrementing ${type} usage:`, err);
      throw new Error(`Failed to update ${type} count`);
    }
  }, [user]);

  // Decrement usage count
  const decrementUsage = useCallback(async (type) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      await decrementSchoolUsage(user.uid, type);
    } catch (err) {
      console.error(`Error decrementing ${type} usage:`, err);
      throw new Error(`Failed to update ${type} count`);
    }
  }, [user]);

  // Check if adding new item would exceed school-wide limit
  const checkLimit = useCallback((type) => {
    if (!school || !currentPlan) {
      return false;
    }

    const usage = type === 'subject' ? subjectUsage : studentUsage;

    // Block new registrations if school is in grace period
    if (school.status === 'grace_period') {
      return false;
    }

    // Block new registrations if school's current usage already exceeds the limit
    if (usage.current >= usage.limit) {
      return false;
    }

    return usage.current < usage.limit;
  }, [school, currentPlan, subjectUsage, studentUsage]);

  // Helper methods
  const canAddSubject = useCallback(() => {
    return checkLimit('subject');
  }, [checkLimit]);

  const canAddStudent = useCallback(() => {
    return checkLimit('student');
  }, [checkLimit]);

  // Check if near limit (80% threshold)
  const isNearLimit = useCallback((type) => {
    const usage = type === 'subject' ? subjectUsage : studentUsage;
    return usage.percentage >= 80;
  }, [subjectUsage, studentUsage]);

  // Check if subscription is in grace period
  const isInGracePeriod = useCallback(() => {
    return school?.status === 'grace_period';
  }, [school]);

  // Check if school's current usage exceeds limits (after downgrade)
  const exceedsLimits = useCallback(() => {
    if (!school || !currentPlan) {
      return { subjects: false, students: false };
    }

    return {
      subjects: subjectUsage.current > subjectUsage.limit,
      students: studentUsage.current > studentUsage.limit,
    };
  }, [school, currentPlan, subjectUsage, studentUsage]);

  // Validate plan upgrade/downgrade (admin only)
  const validatePlanChange = useCallback((newPlanTier) => {
    if (!isAdmin) {
      return { valid: false, message: "Only school admins can change plans" };
    }

    if (!availablePlans || !availablePlans[newPlanTier]) {
      return { valid: false, message: "Invalid plan tier" };
    }

    if (!school) {
      return { valid: false, message: "No school subscription found" };
    }

    const currentTier = school.planTier;
    if (currentTier === newPlanTier) {
      return { valid: false, message: "Already on this plan" };
    }

    return { valid: true, message: "Plan change is valid" };
  }, [isAdmin, availablePlans, school]);

  // Upgrade plan (initiates payment flow) - admin only
  const upgradePlan = useCallback(async (planTier, currency = 'NGN') => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    if (!isAdmin) {
      throw new Error("Only school admins can upgrade plans");
    }

    const validation = validatePlanChange(planTier);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    const newPlan = availablePlans[planTier];
    if (!newPlan) {
      throw new Error("Plan not found");
    }

    // Return payment details for the payment component to handle
    return {
      planTier,
      planName: newPlan.name,
      amount: newPlan.price[currency],
      currency,
      features: newPlan.features,
      subjectLimit: getActualLimit(newPlan.subjectLimit),
      studentLimit: getActualLimit(newPlan.studentLimit),
      schoolId: school.id,
      schoolName: school.name
    };
  }, [user, isAdmin, availablePlans, school, validatePlanChange, getActualLimit]);

  // Process payment after successful Monnify transaction (admin only)
  const handlePaymentSuccess = useCallback(async (paymentData) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    if (!isAdmin) {
      throw new Error("Only school admins can process payments");
    }

    if (!school) {
      throw new Error("No school found");
    }

    try {
      // Process payment with school ID instead of teacher ID
      const result = await processPayment(school.id, paymentData, true); // true flag for school payment

      if (!result.success) {
        throw new Error(result.error || "Payment processing failed");
      }

      return result;
    } catch (err) {
      console.error("Error processing payment:", err);
      throw err;
    }
  }, [user, isAdmin, school]);

  // Cancel subscription (admin only)
  const cancelSubscription = useCallback(async () => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    if (!isAdmin) {
      throw new Error("Only school admins can cancel subscriptions");
    }

    if (!school) {
      throw new Error("No school subscription found");
    }

    if (school.planTier === 'free') {
      throw new Error("Cannot cancel free plan");
    }

    try {
      const schoolRef = doc(db, "schools", school.id);

      // Update subscription to mark for cancellation
      await updateDoc(schoolRef, {
        status: 'grace_period',
        cancelledAt: new Date(),
        updatedAt: new Date()
      });

      // Log cancellation event
      await logSubscriptionCancellation(school.id, school.planTier, 'admin_requested');

      return { success: true, message: "School subscription marked for cancellation" };
    } catch (err) {
      console.error("Error cancelling subscription:", err);
      throw new Error("Failed to cancel subscription");
    }
  }, [user, isAdmin, school]);

  const value = {
    school,
    teacherRelationship,
    loading,
    error,
    availablePlans,
    currentPlan,
    isAdmin,
    subjectUsage,
    studentUsage,
    teacherUsage,
    questionLimit,
    incrementUsage,
    decrementUsage,
    checkLimit,
    canAddSubject,
    canAddStudent,
    isNearLimit,
    isInGracePeriod,
    exceedsLimits,
    upgradePlan,
    handlePaymentSuccess,
    cancelSubscription,
  };

  return (
    <SchoolSubscriptionContext.Provider value={value}>
      {children}
    </SchoolSubscriptionContext.Provider>
  );
};

export const useSchoolSubscription = () => {
  const context = useContext(SchoolSubscriptionContext);
  if (!context) {
    throw new Error("useSchoolSubscription must be used within a SchoolSubscriptionProvider");
  }
  return context;
};
