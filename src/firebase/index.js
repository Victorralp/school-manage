/**
 * Firebase Module Exports
 * Central export point for all Firebase-related functionality
 */

// Core Firebase configuration
export { auth, db } from './config';

// Subscription models and constants
export {
  PLAN_TIERS,
  SUBSCRIPTION_STATUS,
  CURRENCIES,
  PLAN_CONFIG,
  getActualLimit,
  createSubscriptionDocument,
  createTransactionDocument,
  calculateUsagePercentage,
  isNearLimit,
  isLimitExceeded
} from './subscriptionModels';

// Subscription service functions
export {
  initializeSubscription,
  getSubscription,
  subscribeToSubscription,
  updateSubscriptionPlan,
  incrementUsage,
  decrementUsage,
  createTransaction,
  updateTransaction,
  getTransactionHistory,
  getPlanConfig,
  initializePlanConfig
} from './subscriptionService';

// Plan initialization utilities
export {
  initializePlansInFirestore,
  verifyPlanConfig
} from './initializePlans';
