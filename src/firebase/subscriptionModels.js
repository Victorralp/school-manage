/**
 * Subscription Data Models and Constants
 * Defines the structure for subscription plans and related data
 * SCHOOL-BASED MODEL: Schools pay for subscriptions, teachers belong to schools
 * LIMITS ARE SCHOOL-WIDE: All teachers share the total limit (e.g., 3 subjects total for entire school)
 */

// Plan tier constants
export const PLAN_TIERS = {
  FREE: 'free',
  PREMIUM: 'premium',
  VIP: 'vip',
  MASTER: 'master',
  ENTERPRISE: 'enterprise'
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
// NOTE: Limits are SCHOOL-WIDE, shared by all teachers
export const PLAN_CONFIG = {
  free: {
    name: "Free Plan",
    price: { NGN: 0 },
    subjectLimit: 2, // Total for entire school
    studentLimit: 2, // Total for entire school
    questionLimit: 10, // Per exam
    features: [
      "2 subjects total (shared by all teachers)",
      "Up to 2 applicants total",
      "10 questions per exam",
      "Best for trying out",
      "Limited support"
    ],
    billingCycle: null
  },
  premium: {
    name: "Premium Plan",
    price: { NGN: 15200 },
    subjectLimit: 20, // Total for entire school
    studentLimit: 30, // Total for entire school
    questionLimit: 30, // Per exam
    features: [
      "20 subjects total (shared by all teachers)",
      "30 applicants total",
      "Up to 30 questions per exam",
      "Priority support",
      "Advanced analytics"
    ],
    billingCycle: "monthly"
  },
  vip: {
    name: "VIP Plan",
    price: { NGN: 50000 },
    subjectLimit: 30, // Total for entire school
    studentLimit: 100, // Total for entire school
    questionLimit: 100, // Per exam
    features: [
      "30 subjects total (shared by all teachers)",
      "100 applicants total",
      "Up to 100 questions per exam",
      "24/7 support",
      "Custom features",
      "Priority processing"
    ],
    billingCycle: "monthly"
  },
  master: {
    name: "Master Plan",
    price: { NGN: 200000 },
    subjectLimit: "unlimited",
    studentLimit: 1000, // Total for entire school
    questionLimit: 500, // Per exam
    features: [
      "Unlimited subjects",
      "1000 applicants total",
      "Dedicated account manager",
      "White-label options"
    ],
    billingCycle: "monthly"
  },
  enterprise: {
    name: "Enterprise Plan",
    price: { NGN: null },
    subjectLimit: "unlimited",
    studentLimit: "unlimited",
    questionLimit: "unlimited",
    features: [
      "Unlimited everything",
      "Custom integrations",
      "Dedicated support team",
      "SLA guarantee"
    ],
    billingCycle: "custom",
    contactSales: true
  }
};

/**
 * Get the actual limit value (handles both number and range objects)
 * @param {number|object|string} limit - The limit value or range object
 * @returns {number} - The actual limit to use
 */
export const getActualLimit = (limit) => {
  // Handle "unlimited" - return a very high number for comparison purposes
  if (limit === "unlimited" || limit === "Unlimited") {
    return Infinity;
  }
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
    monnifyTransactionReference: null,
    paymentProvider: 'monnify',

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
    monnifyTransactionReference: null,
    paymentProvider: 'monnify',

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
 * @param {string} monnifyReference - Monnify transaction reference
 * @returns {object} - Transaction document structure
 */
export const createTransactionDocument = (schoolId, paidByUserId, planTier, amount, currency, monnifyReference) => {
  return {
    schoolId,
    paidByUserId,
    planTier,
    amount,
    currency,
    status: 'pending',
    monnifyReference,
    monnifyResponse: null,
    paymentProvider: 'monnify',
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
