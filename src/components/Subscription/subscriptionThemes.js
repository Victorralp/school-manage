/**
 * Subscription Widget Theme Configuration
 * Defines visual themes for plan tiers and status indicators
 */

/**
 * Theme configuration for each subscription plan tier
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
export const PLAN_THEMES = {
  free: {
    gradient: 'from-slate-100 via-blue-50 to-slate-100',
    accentColor: 'blue-500',
    badgeColor: 'bg-slate-200 text-slate-700',
    icon: 'StarIcon',
    iconBg: 'bg-slate-100',
    borderColor: 'border-slate-200',
    buttonVariant: 'outline'
  },
  premium: {
    gradient: 'from-amber-50 via-yellow-50 to-orange-50',
    accentColor: 'amber-500',
    badgeColor: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white',
    icon: 'SparklesIcon',
    iconBg: 'bg-amber-100',
    borderColor: 'border-amber-200',
    buttonVariant: 'primary'
  },
  vip: {
    gradient: 'from-purple-50 via-indigo-50 to-violet-50',
    accentColor: 'purple-500',
    badgeColor: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white',
    icon: 'CrownIcon',
    iconBg: 'bg-purple-100',
    borderColor: 'border-purple-200',
    buttonVariant: 'primary'
  }
};

/**
 * Status configuration for subscription states
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export const STATUS_CONFIG = {
  active: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: 'CheckCircleIcon',
    label: 'Active',
    animation: null
  },
  grace_period: {
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: 'ExclamationTriangleIcon',
    label: 'Grace Period',
    animation: 'animate-pulse-subtle'  // Subtle pulse animation for attention
  },
  expired: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: 'XCircleIcon',
    label: 'Expired',
    animation: null
  }
};

/**
 * Get theme configuration for a plan tier with fallback to free
 * @param {string} planTier - The plan tier (free, premium, vip)
 * @returns {object} Theme configuration object
 */
export const getPlanTheme = (planTier) => {
  const normalizedTier = (planTier || '').toLowerCase();
  return PLAN_THEMES[normalizedTier] || PLAN_THEMES.free;
};

/**
 * Get status configuration with fallback to active
 * @param {string} status - The subscription status
 * @returns {object} Status configuration object
 */
export const getStatusConfig = (status) => {
  const normalizedStatus = (status || '').toLowerCase();
  return STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.active;
};


/**
 * Get color configuration based on usage percentage
 * Requirements: 3.2, 3.3, 3.4
 * @param {number} percentage - Usage percentage (0-100+)
 * @returns {object} Color configuration with stroke, bg, text classes and status
 */
export const getUsageColor = (percentage) => {
  if (percentage >= 100) {
    return {
      stroke: 'stroke-red-500',
      bg: 'stroke-red-100',
      text: 'text-red-600',
      status: 'critical'
    };
  }
  if (percentage >= 80) {
    return {
      stroke: 'stroke-amber-500',
      bg: 'stroke-amber-100',
      text: 'text-amber-600',
      status: 'warning'
    };
  }
  if (percentage >= 50) {
    return {
      stroke: 'stroke-yellow-500',
      bg: 'stroke-yellow-100',
      text: 'text-yellow-600',
      status: 'moderate'
    };
  }
  return {
    stroke: 'stroke-green-500',
    bg: 'stroke-green-100',
    text: 'text-green-600',
    status: 'healthy'
  };
};

/**
 * Calculate usage percentage with division-by-zero handling
 * @param {number} current - Current usage count
 * @param {number} limit - Maximum limit
 * @returns {number} Percentage (0-100, capped at 100)
 */
export const calculatePercentage = (current, limit) => {
  if (!limit || limit <= 0) return 0;
  const percentage = (current / limit) * 100;
  return Math.min(Math.round(percentage), 100);
};

/**
 * Calculate teacher contribution percentage of school total
 * Requirements: 4.3
 * @param {number} teacherCount - Teacher's count
 * @param {number} schoolTotal - School's total count
 * @returns {number} Contribution percentage (0-100)
 */
export const calculateContribution = (teacherCount, schoolTotal) => {
  if (!schoolTotal || schoolTotal <= 0) return 0;
  return Math.round((teacherCount / schoolTotal) * 100);
};


/**
 * Parse date from various formats (Firestore Timestamp, string, Date, etc.)
 * @param {any} date - The date in various formats
 * @returns {Date|null} - Parsed Date object or null
 */
const parseDate = (date) => {
  if (!date) return null;
  
  // Handle Firestore Timestamp object
  if (date.toDate && typeof date.toDate === 'function') {
    return date.toDate();
  }
  // Handle Firestore timestamp with seconds
  if (date.seconds) {
    return new Date(date.seconds * 1000);
  }
  // Handle Date object
  if (date instanceof Date) {
    return date;
  }
  // Handle ISO string or regular date string
  if (typeof date === 'string') {
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  // Handle milliseconds number
  if (typeof date === 'number') {
    return new Date(date);
  }
  
  return null;
};

/**
 * Calculate days remaining until expiry
 * Requirements: 5.5
 * @param {Date|string} expiryDate - The expiry date
 * @returns {number} Days remaining (can be negative if expired)
 */
export const calculateDaysRemaining = (expiryDate) => {
  const expiry = parseDate(expiryDate);
  if (!expiry) return null;
  
  const now = new Date();
  const diffTime = expiry - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Format expiry date for human-readable display
 * Requirements: 5.1
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatExpiryDate = (date) => {
  const d = parseDate(date);
  if (!d) return 'N/A';
  
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Get expiry display configuration based on days remaining
 * Requirements: 5.1, 5.2, 5.3, 5.5
 * @param {Date|string} expiryDate - The expiry date
 * @returns {object} Configuration with style, icon, label, and showDays flag
 */
export const getExpiryConfig = (expiryDate) => {
  const daysRemaining = calculateDaysRemaining(expiryDate);
  
  if (daysRemaining === null) {
    return {
      style: 'bg-slate-50 text-slate-700 border-slate-200',
      icon: 'CalendarIcon',
      label: 'No expiry',
      showDays: false
    };
  }
  
  if (daysRemaining <= 0) {
    return {
      style: 'bg-red-100 text-red-800 border-red-200',
      icon: 'ExclamationCircleIcon',
      label: 'Expired',
      showDays: false
    };
  }
  
  if (daysRemaining <= 3) {
    return {
      style: 'bg-red-50 text-red-700 border-red-200',
      icon: 'ClockIcon',
      label: `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left`,
      showDays: true
    };
  }
  
  if (daysRemaining <= 7) {
    return {
      style: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: 'ClockIcon',
      label: `${daysRemaining} days left`,
      showDays: true
    };
  }
  
  if (daysRemaining <= 30) {
    return {
      style: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: 'CalendarIcon',
      label: `${daysRemaining} days left`,
      showDays: true
    };
  }
  
  return {
    style: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: 'CalendarIcon',
    label: formatExpiryDate(expiryDate),
    showDays: false
  };
};
