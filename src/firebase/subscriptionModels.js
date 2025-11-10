/**
 * Subscription Data Models and Constants
 * Defines the structure for subscription plans and related data
 * SCHOOL-BASED MODEL: Schools pay for subscriptions, teachers belong to schools
 */

// Plan tier constants
export const PLAN_TIERS = {
  FREE: 'free',
  PREMIUM: 'premium',
  VIP: 'vip'
};

// Subscription status constants
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  GRACE_PERIOD: 'grace_period',
  CANCELLED: 'cancelled'
};

// Currency constants
export const CURRENCIES = {
  NGN: 'NGN',
  USD: 'USD'
};

// School role constants
export const SCHOOL_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher'
};

// Plan configuration with limits and pricing
export const PLAN_CONFIG = {
  free: {
    name: "Free Plan",
    price: { NGN: 0, USD: 0 },
    subjectLimit: 3,
    studentLimit: 10,
    features: [
      "Basic subject management",
      "Up to 10 students",
      "Limited support"
    ],
    billingCycle: null
  },
  premium: {
    name: "Premium Plan",
    price: { NGN: 1500, USD: 1 },
    subjectLimit: 6,
    studentLimit: { min: 15, max: 20 },
    features: [
      "6 subjects",
      "15-20 students",
      "Priority support",
      "Advanced analytics"
    ],
    billingCycle: "monthly"
  },
  vip: {
    name: "VIP Plan",
    price: { NGN: 4500, USD: 3 },
    subjectLimit: { min: 6, max: 10 },
    studentLimit: 30,
    features: [
      "6-10 subjects",
      "30 students",
      "24/7 support",
      "Custom features",
      "Priority processing"
    ],
    billingCycle: "monthly"
  }
};

/**
 * Get the actual limit value (handles both number and range objects)
 * @param {number|object} limit - The limit value or range object
 * @returns {number} - The actual limit to use
 */
export const getActualLimit = (limit) => {
  if (typeof limit === 'number') {
    return limit;
  }
  // For ranges, use the maximum value
  return limit.max;
};

/**
 * Create a new school document structure
 * @param {string} schoolName - The school's name
 * @param {string} adminUserId - The user ID of the school admin
 * @param {string} planTier - The plan tier (free, premium, vip)
 * @returns {object} - School document structure
 */
export const createSchoolDocument = (schoolName, adminUserId, planTier = PLAN_TIERS.FREE) => {
  const plan = PLAN_CONFIG[planTier];
  const now = new Date();
  
  return {
    name: schoolName,
    adminUserId,
    planTier,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    
    // Limits (apply to entire school)
    subjectLimit: getActualLimit(plan.subjectLimit),
    studentLimit: getActualLimit(plan.studentLimit),
    
    // Usage tracking (aggregated across all teachers)
    currentSubjects: 0,
    currentStudents: 0,
    
    // Teacher tracking
    teacherCount: 1, // Admin is the first teacher
    
    // Payment info
    amount: 0,
    currency: CURRENCIES.NGN,
    
    // Timestamps
    startDate: now,
    expiryDate: null, // null for free plan
    lastPaymentDate: null,
    
    // Payment tracking (for paid plans)
    paystackCustomerCode: null,
    paystackSubscriptionCode: null,
    
    // Metadata
    createdAt: now,
    updatedAt: now
  };
};

/**
 * Create a teacher-school relationship document
 * @param {string} teacherId - The teacher's user ID
 * @param {string} schoolId - The school's ID
 * @param {string} role - The teacher's role (admin or teacher)
 * @returns {object} - Teacher document structure
 */
export const createTeacherSchoolDocument = (teacherId, schoolId, role = SCHOOL_ROLES.TEACHER) => {
  return {
    teacherId,
    schoolId,
    role,
    // Individual teacher usage (for tracking purposes)
    currentSubjects: 0,
    currentStudents: 0,
    joinedAt: new Date(),
    updatedAt: new Date()
  };
};

/**
 * Create a new subscription document structure (DEPRECATED - kept for backward compatibility)
 * @deprecated Use createSchoolDocument instead
 * @param {string} teacherId - The teacher's user ID
 * @param {string} planTier - The plan tier (free, premium, vip)
 * @returns {object} - Subscription document structure
 */
export const createSubscriptionDocument = (teacherId, planTier = PLAN_TIERS.FREE) => {
  const plan = PLAN_CONFIG[planTier];
  const now = new Date();
  
  return {
    teacherId,
    planTier,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    
    // Limits
    subjectLimit: getActualLimit(plan.subjectLimit),
    studentLimit: getActualLimit(plan.studentLimit),
    
    // Usage tracking
    currentSubjects: 0,
    currentStudents: 0,
    
    // Payment info
    amount: 0,
    currency: CURRENCIES.NGN,
    
    // Timestamps
    startDate: now,
    expiryDate: null, // null for free plan
    lastPaymentDate: null,
    
    // Payment tracking (for paid plans)
    paystackCustomerCode: null,
    paystackSubscriptionCode: null,
    
    // Metadata
    createdAt: now,
    updatedAt: now
  };
};

/**
 * Create a payment transaction document structure
 * @param {string} schoolId - The school's ID
 * @param {string} paidByUserId - The user ID who made the payment
 * @param {string} planTier - The plan tier being purchased
 * @param {number} amount - Payment amount
 * @param {string} currency - Currency (NGN or USD)
 * @param {string} paystackReference - Paystack transaction reference
 * @returns {object} - Transaction document structure
 */
export const createTransactionDocument = (schoolId, paidByUserId, planTier, amount, currency, paystackReference) => {
  return {
    schoolId,
    paidByUserId,
    planTier,
    amount,
    currency,
    status: 'pending',
    paystackReference,
    paystackResponse: null,
    createdAt: new Date(),
    completedAt: null
  };
};

/**
 * Calculate usage percentage
 * @param {number} current - Current usage count
 * @param {number} limit - Maximum limit
 * @returns {number} - Percentage (0-100)
 */
export const calculateUsagePercentage = (current, limit) => {
  if (limit === 0) return 0;
  return Math.round((current / limit) * 100);
};

/**
 * Check if usage is near limit (80% threshold)
 * @param {number} current - Current usage count
 * @param {number} limit - Maximum limit
 * @returns {boolean} - True if at or above 80%
 */
export const isNearLimit = (current, limit) => {
  return calculateUsagePercentage(current, limit) >= 80;
};

/**
 * Check if limit is exceeded
 * @param {number} current - Current usage count
 * @param {number} limit - Maximum limit
 * @returns {boolean} - True if limit is exceeded
 */
export const isLimitExceeded = (current, limit) => {
  return current >= limit;
};
