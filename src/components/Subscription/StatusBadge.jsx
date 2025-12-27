import React from 'react';
import { getStatusConfig } from './subscriptionThemes';

/**
 * CheckCircle Icon - Used for active status
 */
const CheckCircleIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

/**
 * ExclamationTriangle Icon - Used for grace_period status
 */
const ExclamationTriangleIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

/**
 * XCircle Icon - Used for expired status
 */
const XCircleIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

/**
 * Icon mapping for status types
 */
const ICON_MAP = {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon
};

/**
 * StatusBadge Component
 * Displays subscription status with color-coded styling and appropriate icon
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 * 
 * @param {string} status - Subscription status (active, grace_period, expired)
 * @param {string} className - Additional CSS classes
 */
const StatusBadge = ({ status = 'active', className = '' }) => {
  const config = getStatusConfig(status);
  const IconComponent = ICON_MAP[config.icon] || CheckCircleIcon;
  
  // Build animation class - use subtle pulse for grace_period
  const animationClass = config.animation || '';
  
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 
        rounded-full text-xs font-medium border
        status-badge-transition
        ${config.color}
        ${animationClass}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      role="status"
      aria-label={`Subscription status: ${config.label}`}
    >
      <IconComponent className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
