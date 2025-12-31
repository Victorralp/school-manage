import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./AuthContext";
import { processPayment } from "../utils/paymentVerification";
import { logSubscriptionCancellation } from "../utils/subscriptionEventLogger";

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availablePlans, setAvailablePlans] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);

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
          // Set default plan configuration if not in Firestore
          const defaultPlans = {
            free: {
              name: "Free Plan",
              price: { NGN: 0 },
              subjectLimit: 2,
              studentLimit: 2,
              features: [
                "2 subjects per teacher",
                "Up to 2 applicants per teacher",
                "Limited support",
              ],
            },
            premium: {
              name: "Premium Plan",
              price: { NGN: 15200 },
              subjectLimit: 20,
              studentLimit: 30,
              billingCycle: "monthly",
              features: [
                "20 subjects per teacher",
                "30 applicants per teacher",
                "Priority support",
                "Advanced analytics",
              ],
            },
            vip: {
              name: "VIP Plan",
              price: { NGN: 50000 },
              subjectLimit: 30,
              studentLimit: 100,
              billingCycle: "monthly",
              features: [
                "30 subjects per teacher",
                "100 applicants per teacher",
                "24/7 support",
                "Custom features",
              ],
            },
            master: {
              name: "Master Plan",
              price: { NGN: 200000 },
              subjectLimit: "unlimited",
              studentLimit: 1000,
              billingCycle: "monthly",
              features: [
                "Unlimited subjects",
                "1000 applicants total",
                "Dedicated account manager",
                "White-label options",
              ],
            },
            enterprise: {
              name: "Enterprise Plan",
              price: { NGN: null },
              subjectLimit: "unlimited",
              studentLimit: "unlimited",
              billingCycle: "custom",
              contactSales: true,
              features: [
                "Unlimited everything",
                "Custom integrations",
                "Dedicated support team",
                "SLA guarantee",
              ],
            },
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

  // Real-time subscription listener
  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setCurrentPlan(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const subscriptionRef = doc(db, "subscriptions", user.uid);

    const unsubscribe = onSnapshot(
      subscriptionRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const subData = docSnapshot.data();
          setSubscription(subData);

          // Set current plan details
          if (availablePlans && subData.planTier) {
            setCurrentPlan(availablePlans[subData.planTier]);
          }

          setError(null);
        } else {
          // No subscription document exists
          setSubscription(null);
          setCurrentPlan(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error listening to subscription:", err);
        setError("Failed to load subscription data");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user, availablePlans]);

  // Update current plan when subscription or available plans change
  useEffect(() => {
    if (subscription && availablePlans) {
      setCurrentPlan(availablePlans[subscription.planTier]);
    }
  }, [subscription, availablePlans]);

  // Helper function to get actual limit value (handles ranges)
  const getActualLimit = useCallback((limitValue) => {
    // Handle "unlimited" string
    if (limitValue === "unlimited" || limitValue === "Unlimited") {
      return Infinity;
    }
    if (typeof limitValue === "object" && limitValue.max) {
      return limitValue.max;
    }
    return limitValue;
  }, []);

  // Calculate usage metrics
  const subjectUsage = useMemo(() => {
    if (!subscription || !currentPlan) {
      return { current: 0, limit: 0, percentage: 0 };
    }
    const limit = getActualLimit(currentPlan.subjectLimit);
    const current = subscription.currentSubjects || 0;
    const percentage = limit > 0 ? Math.round((current / limit) * 100) : 0;
    return { current, limit, percentage };
  }, [subscription, currentPlan, getActualLimit]);

  const studentUsage = useMemo(() => {
    if (!subscription || !currentPlan) {
      return { current: 0, limit: 0, percentage: 0 };
    }
    const limit = getActualLimit(currentPlan.studentLimit);
    const current = subscription.currentStudents || 0;
    const percentage = limit > 0 ? Math.round((current / limit) * 100) : 0;
    return { current, limit, percentage };
  }, [subscription, currentPlan, getActualLimit]);

  // Increment usage count
  const incrementUsage = useCallback(
    async (type) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      try {
        const subscriptionRef = doc(db, "subscriptions", user.uid);
        const field =
          type === "subject" ? "currentSubjects" : "currentStudents";

        await updateDoc(subscriptionRef, {
          [field]: increment(1),
          updatedAt: new Date(),
        });
      } catch (err) {
        console.error(`Error incrementing ${type} usage:`, err);
        throw new Error(`Failed to update ${type} count`);
      }
    },
    [user],
  );

  // Decrement usage count
  const decrementUsage = useCallback(
    async (type) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      try {
        const subscriptionRef = doc(db, "subscriptions", user.uid);
        const field =
          type === "subject" ? "currentSubjects" : "currentStudents";

        await updateDoc(subscriptionRef, {
          [field]: increment(-1),
          updatedAt: new Date(),
        });
      } catch (err) {
        console.error(`Error decrementing ${type} usage:`, err);
        throw new Error(`Failed to update ${type} count`);
      }
    },
    [user],
  );

  // Check if adding new item would exceed limit
  const checkLimit = useCallback(
    (type) => {
      if (!subscription || !currentPlan) {
        return false;
      }

      const usage = type === "subject" ? subjectUsage : studentUsage;

      // Block new registrations if in grace period
      if (subscription.status === "grace_period") {
        return false;
      }

      // Block new registrations if current usage already exceeds limit
      // This handles the case where user was downgraded with excess data
      if (usage.current >= usage.limit) {
        return false;
      }

      return usage.current < usage.limit;
    },
    [subscription, currentPlan, subjectUsage, studentUsage],
  );

  // Helper methods
  const canAddSubject = useCallback(() => {
    return checkLimit("subject");
  }, [checkLimit]);

  const canAddStudent = useCallback(() => {
    return checkLimit("student");
  }, [checkLimit]);

  // Check if near limit (80% threshold)
  const isNearLimit = useCallback(
    (type) => {
      const usage = type === "subject" ? subjectUsage : studentUsage;
      return usage.percentage >= 80;
    },
    [subjectUsage, studentUsage],
  );

  // Check if subscription is in grace period
  const isInGracePeriod = useCallback(() => {
    return subscription?.status === "grace_period";
  }, [subscription]);

  // Check if current usage exceeds limits (after downgrade)
  const exceedsLimits = useCallback(() => {
    if (!subscription || !currentPlan) {
      return { subjects: false, students: false };
    }

    return {
      subjects: subjectUsage.current > subjectUsage.limit,
      students: studentUsage.current > studentUsage.limit,
    };
  }, [subscription, currentPlan, subjectUsage, studentUsage]);

  // Validate plan upgrade/downgrade
  const validatePlanChange = useCallback(
    (newPlanTier) => {
      if (!availablePlans || !availablePlans[newPlanTier]) {
        return { valid: false, message: "Invalid plan tier" };
      }

      if (!subscription) {
        return { valid: false, message: "No active subscription found" };
      }

      const currentTier = subscription.planTier;
      if (currentTier === newPlanTier) {
        return { valid: false, message: "Already on this plan" };
      }

      return { valid: true, message: "Plan change is valid" };
    },
    [availablePlans, subscription],
  );

  // Upgrade plan (initiates payment flow)
  const upgradePlan = useCallback(
    async (planTier, currency = "NGN") => {
      if (!user) {
        throw new Error("User not authenticated");
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
      };
    },
    [user, availablePlans, validatePlanChange, getActualLimit],
  );

  // Process payment after successful Monnify transaction
  const handlePaymentSuccess = useCallback(
    async (paymentData) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      try {
        const result = await processPayment(user.uid, paymentData);

        if (!result.success) {
          throw new Error(result.error || "Payment processing failed");
        }

        return result;
      } catch (err) {
        console.error("Error processing payment:", err);
        throw err;
      }
    },
    [user],
  );

  // Cancel subscription
  const cancelSubscription = useCallback(async () => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    if (!subscription) {
      throw new Error("No active subscription found");
    }

    if (subscription.planTier === "free") {
      throw new Error("Cannot cancel free plan");
    }

    try {
      const subscriptionRef = doc(db, "subscriptions", user.uid);

      // Update subscription to mark for cancellation
      // The actual downgrade will be handled by backend/Cloud Functions
      await updateDoc(subscriptionRef, {
        status: "grace_period",
        cancelledAt: new Date(),
        updatedAt: new Date(),
      });

      // Log cancellation event
      await logSubscriptionCancellation(
        user.uid,
        subscription.planTier,
        "user_requested",
      );

      return { success: true, message: "Subscription marked for cancellation" };
    } catch (err) {
      console.error("Error cancelling subscription:", err);
      throw new Error("Failed to cancel subscription");
    }
  }, [user, subscription]);

  const value = {
    subscription,
    loading,
    error,
    availablePlans,
    currentPlan,
    subjectUsage,
    studentUsage,
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
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider",
    );
  }
  return context;
};
