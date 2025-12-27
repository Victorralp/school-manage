import React from 'react';
import { getExpiryConfig, formatExpiryDate, calculateDaysRemaining } from './subscriptionThemes';

/**
 * Calendar Icon - Used for dates more than 7 days away
 */
const CalendarIcon = ({ className }) => (
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
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

/**
 * Clock Icon - Used for urgent expiry (within 7 days)
 */
const ClockIcon = ({ className }) => (
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
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

/**
 * ExclamationCircle Icon - Used for expired status
 */
const ExclamationCircleIcon = ({ className }) => (
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
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

/**
 * Icon mapping for expiry display types
 */
const ICON_MAP = {
  CalendarIcon,
  ClockIcon,
  ExclamationCircleIcon
};

/**
 * ExpiryDisplay Component
 * Displays subscription expiry date with urgency-based styling
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 * 
 * @param {Date|string} expiryDate - The subscription expiry date
 * @param {string} className - Additional CSS classes
 * @param {boolean} showFullDate - Whether to always show the full formatted date
 */
const ExpiryDisplay = ({ expiryDate, className = '', showFullDate = false }) => {
  // Handle null/undefined expiry date
  if (!expiryDate) {
    return null;
  }

  const config = getExpiryConfig(expiryDate);
  const IconComponent = ICON_MAP[config.icon] || CalendarIcon;
  const daysRemaining = calculateDaysRemaining(expiryDate);
  const formattedDate = formatExpiryDate(expiryDate);

  // Determine what to display
  const displayLabel = config.showDays ? config.label : formattedDate;
  const secondaryLabel = config.showDays && showFullDate ? formattedDate : null;
  
  // Add urgent pulse animation for critical expiry (3 days or less)
  const urgentAnimation = daysRemaining !== null && daysRemaining <= 3 && daysRemaining > 0 
    ? 'animate-urgent-pulse' 
    : '';

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-1.5
        rounded-lg text-sm font-medium border
        status-badge-transition
        ${config.style}
        ${urgentAnimation}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      role="status"
      aria-label={`Subscription expires: ${formattedDate}${daysRemaining !== null && daysRemaining > 0 ? `, ${daysRemaining} days remaining` : ''}`}
    >
      <IconComponent className="w-4 h-4 flex-shrink-0" />
      <div className="flex flex-col">
        <span>{displayLabel}</span>
        {secondaryLabel && (
          <span className="text-xs opacity-75">{secondaryLabel}</span>
        )}
      </div>
    </div>
  );
};

export default ExpiryDisplay;
