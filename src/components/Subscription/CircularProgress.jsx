import React, { useEffect, useState } from 'react';
import { getUsageColor, calculatePercentage } from './subscriptionThemes';

/**
 * CircularProgress Component
 * Displays usage statistics with a circular progress ring visualization
 * Requirements: 3.1, 3.5, 3.6
 * 
 * @param {number} current - Current usage count
 * @param {number} limit - Maximum limit
 * @param {string} label - Label text (e.g., "Subjects" or "Students")
 * @param {React.ReactNode} icon - Icon to display in center
 * @param {'sm' | 'md' | 'lg'} size - Size variant
 */
const CircularProgress = ({ 
  current = 0, 
  limit = 0, 
  label = '', 
  icon = null, 
  size = 'md' 
}) => {
  const [animatedOffset, setAnimatedOffset] = useState(283); // Full circumference (no progress)
  
  // Size configurations
  const sizeConfig = {
    sm: { width: 80, strokeWidth: 6, fontSize: 'text-xs', iconSize: 'w-4 h-4' },
    md: { width: 100, strokeWidth: 8, fontSize: 'text-sm', iconSize: 'w-5 h-5' },
    lg: { width: 120, strokeWidth: 10, fontSize: 'text-base', iconSize: 'w-6 h-6' }
  };

  const config = sizeConfig[size] || sizeConfig.md;
  const { width, strokeWidth, fontSize, iconSize } = config;
  
  // SVG circle calculations
  const radius = (width - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate percentage and colors
  const percentage = calculatePercentage(current, limit);
  const colors = getUsageColor(percentage);
  
  // Calculate stroke offset for progress (0 = full, circumference = empty)
  const targetOffset = circumference - (percentage / 100) * circumference;

  // Animate progress on mount and when values change
  useEffect(() => {
    // Start from full circumference (empty) and animate to target
    setAnimatedOffset(circumference);
    
    // Small delay to trigger animation
    const timer = setTimeout(() => {
      setAnimatedOffset(targetOffset);
    }, 50);

    return () => clearTimeout(timer);
  }, [targetOffset, circumference]);

  return (
    <div className="flex flex-col items-center">
      {/* SVG Circular Progress */}
      <div className="relative" style={{ width, height: width }}>
        <svg
          className="transform -rotate-90"
          width={width}
          height={width}
          aria-label={`${label}: ${current} of ${limit} used (${percentage}%)`}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={limit}
        >
          {/* Background circle */}
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className={colors.bg}
          />
          {/* Progress circle */}
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className={`${colors.stroke} progress-ring-transition`}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: animatedOffset
            }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {icon && (
            <div className={`${iconSize} ${colors.text} mb-1`}>
              {icon}
            </div>
          )}
          <span className={`font-bold ${colors.text} ${fontSize}`}>
            {current}/{limit}
          </span>
        </div>
      </div>
      
      {/* Label below */}
      {label && (
        <span className={`mt-2 font-medium text-gray-700 ${fontSize}`}>
          {label}
        </span>
      )}
    </div>
  );
};

export default CircularProgress;
