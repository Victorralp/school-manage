/**
 * School Initialization Utilities
 * Helper functions for creating schools and managing teacher relationships
 */

import { createSchool, addTeacherToSchool } from '../firebase/schoolService';
import { PLAN_TIERS, SCHOOL_ROLES } from '../firebase/subscriptionModels';

/**
 * Initialize a new school for a user
 * This is called when a new user registers and chooses to create a school
 * @param {string} schoolName - The name of the school
 * @param {string} adminUserId - The user ID of the school admin
 * @param {string} planTier - Initial plan tier (default: free)
 * @returns {Promise<object>} - Result with schoolId
 */
export async function initializeNewSchool(schoolName, adminUserId, planTier = PLAN_TIERS.FREE) {
  try {
    if (!schoolName || !schoolName.trim()) {
      throw new Error('School name is required');
    }
    
    if (!adminUserId) {
      throw new Error('Admin user ID is required');
    }
    
    // Create the school (this also creates the admin's teacher relationship)
    const schoolId = await createSchool(schoolName.trim(), adminUserId, planTier);
    
    console.log(`School created successfully: ${schoolId}`);
    
    return {
      success: true,
      schoolId,
      message: 'School created successfully'
    };
    
  } catch (error) {
    console.error('Error initializing school:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to create school'
    };
  }
}

/**
 * Add a teacher to an existing school
 * This is called when a user joins an existing school via invitation
 * @param {string} teacherId - The teacher's user ID
 * @param {string} schoolId - The school's ID
 * @returns {Promise<object>} - Result
 */
export async function joinExistingSchool(teacherId, schoolId) {
  try {
    if (!teacherId) {
      throw new Error('Teacher ID is required');
    }
    
    if (!schoolId) {
      throw new Error('School ID is required');
    }
    
    // Add teacher to school with teacher role
    await addTeacherToSchool(teacherId, schoolId, SCHOOL_ROLES.TEACHER);
    
    console.log(`Teacher ${teacherId} joined school ${schoolId}`);
    
    return {
      success: true,
      message: 'Successfully joined school'
    };
    
  } catch (error) {
    console.error('Error joining school:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to join school'
    };
  }
}

/**
 * Generate a school invitation code
 * This creates a simple invitation code that can be shared with teachers
 * @param {string} schoolId - The school's ID
 * @returns {string} - Invitation code
 */
export function generateInvitationCode(schoolId) {
  // Simple base64 encoding of schoolId with timestamp
  const timestamp = Date.now();
  const data = `${schoolId}:${timestamp}`;
  return btoa(data);
}

/**
 * Validate and decode an invitation code
 * @param {string} invitationCode - The invitation code
 * @returns {object} - Decoded data with schoolId and timestamp
 */
export function validateInvitationCode(invitationCode) {
  try {
    const decoded = atob(invitationCode);
    const [schoolId, timestamp] = decoded.split(':');
    
    if (!schoolId || !timestamp) {
      throw new Error('Invalid invitation code format');
    }
    
    // Check if code is not too old (e.g., 30 days)
    const codeAge = Date.now() - parseInt(timestamp);
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    
    if (codeAge > maxAge) {
      throw new Error('Invitation code has expired');
    }
    
    return {
      valid: true,
      schoolId,
      timestamp: parseInt(timestamp)
    };
    
  } catch (error) {
    console.error('Error validating invitation code:', error);
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Get invitation link for a school
 * @param {string} schoolId - The school's ID
 * @param {string} baseUrl - The base URL of the application
 * @returns {string} - Full invitation link
 */
export function getInvitationLink(schoolId, baseUrl = window.location.origin) {
  const code = generateInvitationCode(schoolId);
  return `${baseUrl}/join-school?code=${code}`;
}

/**
 * Check if a user needs to create or join a school
 * This is called after user registration to determine next steps
 * @param {string} userId - The user's ID
 * @returns {Promise<object>} - Status indicating if user has a school
 */
export async function checkUserSchoolStatus(userId) {
  try {
    const { getTeacherSchoolRelationship } = await import('../firebase/schoolService');
    
    const relationship = await getTeacherSchoolRelationship(userId);
    
    if (relationship) {
      return {
        hasSchool: true,
        schoolId: relationship.schoolId,
        role: relationship.role
      };
    }
    
    return {
      hasSchool: false,
      needsSetup: true
    };
    
  } catch (error) {
    console.error('Error checking user school status:', error);
    return {
      hasSchool: false,
      error: error.message
    };
  }
}

/**
 * Validate school name
 * @param {string} schoolName - The school name to validate
 * @returns {object} - Validation result
 */
export function validateSchoolName(schoolName) {
  if (!schoolName || !schoolName.trim()) {
    return {
      valid: false,
      message: 'School name is required'
    };
  }
  
  if (schoolName.trim().length < 3) {
    return {
      valid: false,
      message: 'School name must be at least 3 characters'
    };
  }
  
  if (schoolName.trim().length > 100) {
    return {
      valid: false,
      message: 'School name must be less than 100 characters'
    };
  }
  
  return {
    valid: true,
    message: 'School name is valid'
  };
}
