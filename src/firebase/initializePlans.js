/**
 * Utility script to initialize plan configuration in Firestore
 * This should be run once by an admin to set up the plan configuration
 * 
 * Usage: Import and call initializePlansInFirestore() from a component or admin panel
 */

import { initializePlanConfig } from './subscriptionService';
import { PLAN_CONFIG } from './subscriptionModels';

/**
 * Initialize plan configuration in Firestore
 * This creates the config/plans document with all plan details
 */
export const initializePlansInFirestore = async () => {
  try {
    await initializePlanConfig(PLAN_CONFIG);
    console.log('✓ Plan configuration initialized successfully in Firestore');
    return { success: true, message: 'Plan configuration initialized' };
  } catch (error) {
    console.error('✗ Error initializing plan configuration:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verify plan configuration exists in Firestore
 */
export const verifyPlanConfig = async () => {
  try {
    const { getPlanConfig } = await import('./subscriptionService');
    const config = await getPlanConfig();
    
    if (config) {
      console.log('✓ Plan configuration exists in Firestore');
      return { success: true, config };
    } else {
      console.log('⚠ Plan configuration not found in Firestore');
      return { success: false, message: 'Configuration not found' };
    }
  } catch (error) {
    console.error('✗ Error verifying plan configuration:', error);
    return { success: false, error: error.message };
  }
};
