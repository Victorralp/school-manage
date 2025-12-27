# Subscription Widget UI Enhancement Design

## Overview

This design document outlines the visual enhancement of the School Subscription Widget component. The goal is to transform the current plain, text-heavy widget into a visually engaging, modern UI that provides clear information hierarchy and delightful user experience while maintaining full functionality.

The enhanced widget will feature:
- Tier-specific color schemes and gradients
- Circular progress indicators for usage statistics
- Animated status badges
- Enhanced contribution panels with icons
- Urgency-aware expiry displays
- Smooth micro-animations and transitions

## Architecture

### Component Structure

```
┌─────────────────────────────────────────────────────────────┐
│                 SchoolSubscriptionWidget                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   PlanHeader                          │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │  PlanIcon   │  │  PlanTitle  │  │ StatusBadge │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  UsageSection                         │  │
│  │  ┌────────────────┐    ┌────────────────┐           │  │
│  │  │ CircularProgress│    │ CircularProgress│           │  │
│  │  │   (Subjects)    │    │   (Students)    │           │  │
│  │  └────────────────┘    └────────────────┘           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              ContributionPanel                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │ SubjectStat │  │ StudentStat │  │ ExpiryDate  │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  ActionButtons                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Props/Context Input**: Widget receives subscription data from SchoolSubscriptionContext
2. **Theme Calculation**: Plan tier determines color scheme and gradient
3. **Usage Calculation**: Current/limit values calculate percentages and warning states
4. **Expiry Calculation**: Expiry date determines urgency level and display format
5. **Render**: Components render with calculated styles and values

## Components and Interfaces

### 1. Plan Tier Theme Configuration

```javascript
// Theme configuration for each plan tier
const PLAN_THEMES = {
  free: {
    gradient: 'from-slate-100 via-blue-50 to-slate-100',
    accentColor: 'blue-500',
    badgeColor: 'bg-slate-200 text-slate-700',
    icon: 'StarIcon', // outline star
    iconBg: 'bg-slate-100',
    borderColor: 'border-slate-200',
    buttonVariant: 'outline'
  },
  premium: {
    gradient: 'from-amber-50 via-yellow-50 to-orange-50',
    accentColor: 'amber-500',
    badgeColor: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white',
    icon: 'SparklesIcon', // sparkles/stars
    iconBg: 'bg-amber-100',
    borderColor: 'border-amber-200',
    buttonVariant: 'primary'
  },
  vip: {
    gradient: 'from-purple-50 via-indigo-50 to-violet-50',
    accentColor: 'purple-500',
    badgeColor: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white',
    icon: 'CrownIcon', // crown
    iconBg: 'bg-purple-100',
    borderColor: 'border-purple-200',
    buttonVariant: 'primary'
  }
};
```

### 2. Status Badge Configuration

```javascript
const STATUS_CONFIG = {
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
    animation: 'animate-pulse'
  },
  expired: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: 'XCircleIcon',
    label: 'Expired',
    animation: null
  }
};
```

### 3. CircularProgress Component Interface

```javascript
// src/components/Subscription/CircularProgress.jsx

interface CircularProgressProps {
  current: number;        // Current usage count
  limit: number;          // Maximum limit
  label: string;          // "Subjects" or "Students"
  icon: ReactNode;        // Icon to display in center
  size?: 'sm' | 'md' | 'lg';  // Size variant
}

// Features:
// - SVG-based circular progress ring
// - Color transitions based on percentage (green → yellow → red)
// - Animated stroke-dashoffset for smooth transitions
// - Center displays icon and count/limit
```

### 4. Usage Color Thresholds

```javascript
const getUsageColor = (percentage) => {
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
```

### 5. Expiry Display Configuration

```javascript
const getExpiryConfig = (expiryDate) => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  
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
    label: formatDate(expiryDate),
    showDays: false
  };
};
```

## Data Models

### Enhanced Widget Props

```javascript
interface EnhancedWidgetData {
  // School info
  school: {
    name: string;
    planTier: 'free' | 'premium' | 'vip';
    status: 'active' | 'grace_period' | 'expired';
    expiryDate: Date | null;
  };
  
  // Usage metrics
  subjectUsage: {
    current: number;
    limit: number;
    percentage: number;
  };
  
  studentUsage: {
    current: number;
    limit: number;
    percentage: number;
  };
  
  // Teacher contribution
  teacherUsage: {
    subjects: number;
    students: number;
  };
  
  // Computed values
  teacherContributionPercentage: {
    subjects: number;  // (teacherSubjects / totalSubjects) * 100
    students: number;  // (teacherStudents / totalStudents) * 100
  };
  
  // Permissions
  isAdmin: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Plan Tier Visual Representation

*For any* plan tier (free, premium, vip), the Subscription_Widget SHALL render with the correct theme configuration including gradient classes, badge styling, and tier icon.

**Validates: Requirements 1.1, 1.5**

### Property 2: Status Badge Styling

*For any* subscription status (active, grace_period, expired), the Status_Badge SHALL render with the correct color classes and icon based on the status configuration.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 3: Usage Color Thresholds

*For any* usage percentage value, the Usage_Indicator SHALL apply the correct color styling based on thresholds: green for <50%, yellow for 50-79%, amber for 80-99%, and red for >=100%.

**Validates: Requirements 3.2, 3.3, 3.4**

### Property 4: Usage Display Values

*For any* usage data (current count and limit), the Usage_Indicator SHALL correctly display both values and calculate the percentage for the progress visualization.

**Validates: Requirements 3.1, 3.5**

### Property 5: Contribution Percentage Calculation

*For any* teacher contribution data, the Contribution_Panel SHALL correctly calculate and display the percentage of school total (teacherCount / schoolTotal * 100).

**Validates: Requirements 4.1, 4.3**

### Property 6: Expiry Urgency Styling

*For any* expiry date, the Expiry_Display SHALL apply the correct urgency styling based on days remaining: red for <=3 days, amber for 4-7 days, blue for 8-30 days, and neutral for >30 days.

**Validates: Requirements 5.2, 5.3, 5.5**

### Property 7: Days Remaining Calculation

*For any* expiry date within 30 days of the current date, the Expiry_Display SHALL correctly calculate and display the number of days remaining.

**Validates: Requirements 5.1, 5.5**

### Property 8: Accessibility Attributes

*For any* rendered Subscription_Widget, all interactive elements SHALL have appropriate ARIA labels and roles for screen reader accessibility.

**Validates: Requirements 6.5**

### Property 9: Button Theme Consistency

*For any* plan tier, the action buttons SHALL use styling classes that are consistent with the plan tier's theme configuration.

**Validates: Requirements 7.3**

## Error Handling

### Error Scenarios

1. **Missing Data**: If subscription data is null/undefined, display loading skeleton
2. **Invalid Plan Tier**: Default to 'free' theme if plan tier is unrecognized
3. **Invalid Status**: Default to 'active' status styling if status is unrecognized
4. **Missing Expiry Date**: Hide expiry display for free plans or when date is null
5. **Division by Zero**: Handle case where limit is 0 (show 0% progress)

### Fallback Behavior

```javascript
// Safe percentage calculation
const calculatePercentage = (current, limit) => {
  if (!limit || limit <= 0) return 0;
  return Math.min(Math.round((current / limit) * 100), 100);
};

// Safe contribution percentage
const calculateContribution = (teacherCount, schoolTotal) => {
  if (!schoolTotal || schoolTotal <= 0) return 0;
  return Math.round((teacherCount / schoolTotal) * 100);
};
```

## Testing Strategy

### Unit Tests

1. **Theme Selection**
   - Test that correct theme is returned for each plan tier
   - Test fallback to free theme for invalid tier

2. **Usage Color Logic**
   - Test color selection at boundary values (0%, 49%, 50%, 79%, 80%, 99%, 100%)
   - Test edge cases (negative values, values > 100)

3. **Expiry Calculation**
   - Test days remaining calculation
   - Test urgency level at boundaries (0, 3, 7, 30 days)
   - Test with past dates (expired)

4. **Percentage Calculations**
   - Test usage percentage calculation
   - Test contribution percentage calculation
   - Test division by zero handling

### Property-Based Tests

Property-based tests will use fast-check library to verify:

1. **Property 3 (Usage Color Thresholds)**: For all percentage values 0-100, correct color is applied
2. **Property 6 (Expiry Urgency)**: For all dates, correct urgency styling is applied
3. **Property 7 (Days Remaining)**: For all expiry dates, days remaining is calculated correctly

### Component Tests

1. **CircularProgress Component**
   - Renders with correct SVG attributes
   - Displays correct count/limit text
   - Applies correct color classes

2. **StatusBadge Component**
   - Renders correct icon for each status
   - Applies correct color classes
   - Shows pulse animation for grace_period

3. **ExpiryDisplay Component**
   - Formats date correctly
   - Shows days remaining when appropriate
   - Applies urgency styling

### Integration Tests

1. **Full Widget Rendering**
   - Test widget renders with all sub-components
   - Test theme changes when plan tier changes
   - Test responsive behavior

## Implementation Notes

### CSS Animations

```css
/* Pulse animation for grace period badge */
@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.animate-pulse-subtle {
  animation: pulse-subtle 2s ease-in-out infinite;
}

/* Progress ring animation */
@keyframes progress-fill {
  from { stroke-dashoffset: 283; }
}

.animate-progress {
  animation: progress-fill 1s ease-out forwards;
}
```

### Tailwind Configuration

Ensure these colors are available in tailwind.config.js:
- Amber shades for Premium tier
- Purple/Indigo shades for VIP tier
- Standard green/yellow/red for status indicators

### Performance Considerations

1. **Memoization**: Memoize theme and color calculations to prevent unnecessary recalculations
2. **SVG Optimization**: Use simple SVG paths for circular progress
3. **Animation Performance**: Use CSS transforms and opacity for animations (GPU accelerated)
