# Implementation Plan: Subscription Widget UI Enhancement

## Overview

This plan transforms the plain subscription widget into a visually engaging, modern UI with tier-specific themes, circular progress indicators, animated status badges, and enhanced contribution panels.

## Tasks

- [x] 1. Create theme configuration and utility functions
  - [x] 1.1 Create plan tier theme configuration
    - Create `src/components/Subscription/subscriptionThemes.js`
    - Define PLAN_THEMES object with gradient, accent, badge, icon, and border colors for free/premium/vip
    - Define STATUS_CONFIG object with color, icon, label, and animation for each status
    - Export helper function `getPlanTheme(planTier)` with fallback to free
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.2 Create usage color utility functions
    - Add `getUsageColor(percentage)` function returning stroke, bg, text classes based on thresholds
    - Add `calculatePercentage(current, limit)` with division-by-zero handling
    - Add `calculateContribution(teacherCount, schoolTotal)` function
    - _Requirements: 3.2, 3.3, 3.4, 4.3_

  - [x] 1.3 Create expiry display utility functions
    - Add `getExpiryConfig(expiryDate)` function returning style, icon, label based on days remaining
    - Add `calculateDaysRemaining(expiryDate)` function
    - Add `formatExpiryDate(date)` for human-readable formatting
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [ ]* 1.4 Write property tests for utility functions
    - **Property 3: Usage Color Thresholds** - Test color selection for all percentage ranges
    - **Property 6: Expiry Urgency Styling** - Test urgency styling for all day ranges
    - **Property 7: Days Remaining Calculation** - Test days calculation accuracy
    - **Validates: Requirements 3.2, 3.3, 3.4, 5.2, 5.3, 5.5**

- [x] 2. Create CircularProgress component
  - [x] 2.1 Build CircularProgress SVG component
    - Create `src/components/Subscription/CircularProgress.jsx`
    - Implement SVG circle with stroke-dasharray/dashoffset for progress ring
    - Accept props: current, limit, label, icon, size
    - Apply color classes based on percentage using getUsageColor
    - Display count/limit text in center
    - _Requirements: 3.1, 3.5_

  - [x] 2.2 Add progress animation
    - Add CSS transition for stroke-dashoffset changes
    - Implement smooth fill animation on mount
    - _Requirements: 3.6_

  - [ ]* 2.3 Write unit tests for CircularProgress
    - Test correct SVG attributes are rendered
    - Test color classes applied at different percentages
    - Test count/limit display
    - **Property 4: Usage Display Values**
    - **Validates: Requirements 3.1, 3.5**

- [x] 3. Create StatusBadge component
  - [x] 3.1 Build StatusBadge component
    - Create `src/components/Subscription/StatusBadge.jsx`
    - Accept status prop (active, grace_period, expired)
    - Render appropriate icon (CheckCircle, ExclamationTriangle, XCircle)
    - Apply color classes from STATUS_CONFIG
    - Add pulse animation class for grace_period
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 3.2 Write unit tests for StatusBadge
    - Test correct icon rendered for each status
    - Test correct color classes applied
    - Test pulse animation class for grace_period
    - **Property 2: Status Badge Styling**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

- [x] 4. Create ExpiryDisplay component
  - [x] 4.1 Build ExpiryDisplay component
    - Create `src/components/Subscription/ExpiryDisplay.jsx`
    - Accept expiryDate prop
    - Calculate days remaining and urgency level
    - Display formatted date or days remaining based on proximity
    - Apply urgency styling (red/amber/blue/neutral)
    - Include calendar/clock icon
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 4.2 Write unit tests for ExpiryDisplay
    - Test date formatting
    - Test days remaining display
    - Test urgency styling at boundaries
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.5**

- [x] 5. Create ContributionPanel component
  - [x] 5.1 Build ContributionPanel component
    - Create `src/components/Subscription/ContributionPanel.jsx`
    - Accept teacherUsage and schoolUsage props
    - Display subjects count with book icon
    - Display students count with users icon
    - Calculate and display percentage of school total
    - Apply card styling with shadow and border
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 5.2 Write unit tests for ContributionPanel
    - Test counts display correctly
    - Test percentage calculation
    - Test icons rendered
    - **Property 5: Contribution Percentage Calculation**
    - **Validates: Requirements 4.1, 4.3**

- [x] 6. Enhance SchoolSubscriptionWidget with new components
  - [x] 6.1 Refactor widget header with plan theme
    - Apply tier-specific gradient background from PLAN_THEMES
    - Add tier icon (Star/Sparkles/Crown) based on plan
    - Style plan name badge with tier colors
    - Integrate StatusBadge component
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1_

  - [x] 6.2 Replace usage bars with CircularProgress
    - Replace linear progress bars with CircularProgress components
    - Add subjects CircularProgress with book icon
    - Add students CircularProgress with users icon
    - Arrange in responsive grid layout
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 6.3 Integrate ContributionPanel and ExpiryDisplay
    - Replace plain contribution section with ContributionPanel
    - Add ExpiryDisplay component for paid plans
    - Arrange in visually balanced layout
    - _Requirements: 4.1, 4.3, 5.1, 5.2, 5.3_

  - [x] 6.4 Enhance action buttons with theme styling
    - Apply tier-consistent button styling
    - Add hover transitions with scale/color effects
    - Style upgrade button prominently
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 6.5 Add accessibility attributes
    - Add ARIA labels to progress indicators
    - Add ARIA labels to status badge
    - Add role attributes to interactive elements
    - Ensure proper contrast ratios
    - _Requirements: 6.5_

- [x] 7. Add CSS animations and polish
  - [x] 7.1 Add animation styles
    - Add pulse-subtle animation for grace period badge
    - Add progress-fill animation for circular progress
    - Add hover transitions for buttons
    - Ensure animations use GPU-accelerated properties
    - _Requirements: 1.6, 2.5, 3.6, 6.3, 7.1_

  - [x] 7.2 Add responsive styling
    - Stack circular progress indicators on mobile
    - Adjust spacing for smaller screens
    - Ensure touch targets are adequate size
    - _Requirements: 6.4_

- [x] 8. Final integration and testing
  - [ ]* 8.1 Write integration tests for enhanced widget
    - Test widget renders with all new components
    - Test theme changes correctly with plan tier
    - Test all sub-components integrate properly
    - **Property 1: Plan Tier Visual Representation**
    - **Property 8: Accessibility Attributes**
    - **Property 9: Button Theme Consistency**
    - **Validates: Requirements 1.1, 1.5, 6.5, 7.3**

  - [x] 8.2 Manual visual testing
    - Test all three plan tiers display correctly
    - Test all status states display correctly
    - Test usage indicators at various percentages
    - Test expiry display at various day ranges
    - Test responsive behavior on mobile
    - _Requirements: 1.1, 2.1, 3.1, 5.1, 6.4_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- All components use existing Tailwind CSS classes for consistency
- SVG icons can use Heroicons library already in the project
- Property tests use fast-check library for comprehensive coverage