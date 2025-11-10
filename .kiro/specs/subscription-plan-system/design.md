# Subscription Plan System Design

## Overview

The subscription plan system enables teachers to select and manage subscription tiers (Free, Premium, VIP) that determine limits on subject and student registrations. The system integrates with Firebase Firestore for data persistence, Firebase Authentication for user management, and Paystack for payment processing (supporting both Naira and USD).

### Key Design Principles

- **Limit Enforcement**: All subject and student registration operations must validate against current plan limits before execution
- **Data Retention**: Downgrading plans never deletes existing data, only prevents new registrations beyond limits
- **Payment Integration**: Seamless integration with Paystack for Nigerian market (Naira) with USD fallback
- **Real-time Updates**: Subscription status and usage metrics update in real-time using Firestore listeners
- **Graceful Degradation**: Failed payments trigger grace periods before downgrading to Free plan

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Subscription │  │   Payment    │  │    Usage     │     │
│  │   Context    │  │  Component   │  │   Monitor    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Firebase Services                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Firestore   │  │     Auth     │  │   Functions  │     │
│  │  (Database)  │  │              │  │  (Backend)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Paystack Payment API                       │
│              (NGN & USD Payment Processing)                 │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Plan Selection**: Teacher selects plan → Frontend validates → Displays payment modal (if paid plan)
2. **Payment Processing**: Payment initiated → Paystack processes → Webhook confirms → Backend updates subscription
3. **Limit Enforcement**: Registration attempt → Check current usage → Validate against plan limits → Allow/Reject
4. **Usage Monitoring**: Real-time Firestore listener → Update usage counts → Display warnings at 80% threshold

## Components and Interfaces

### 1. Firestore Data Models

#### Subscription Document (`subscriptions/{teacherId}`)

```javascript
{
  teacherId: string,              // Reference to user document
  planTier: string,               // "free" | "premium" | "vip"
  status: string,                 // "active" | "expired" | "grace_period"
  
  // Limits
  subjectLimit: number,           // 3, 6, or 6-10
  studentLimit: number,           // 10, 15-20, or 30
  
  // Usage tracking
  currentSubjects: number,        // Current count of registered subjects
  currentStudents: number,        // Current count of registered students
  
  // Payment info
  amount: number,                 // Amount paid (0 for free)
  currency: string,               // "NGN" | "USD"
  
  // Timestamps
  startDate: timestamp,           // When plan started
  expiryDate: timestamp,          // When plan expires (null for free)
  lastPaymentDate: timestamp,     // Last successful payment
  
  // Payment tracking
  paystackCustomerCode: string,   // For recurring payments
  paystackSubscriptionCode: string,
  
  // Metadata
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Plan Configuration Document (`config/plans`)

```javascript
{
  free: {
    name: "Free Plan",
    price: { NGN: 0, USD: 0 },
    subjectLimit: 3,
    studentLimit: 10,
    features: ["Basic subject management", "Up to 10 students", "Limited support"]
  },
  premium: {
    name: "Premium Plan",
    price: { NGN: 1500, USD: 1 },
    subjectLimit: 6,
    studentLimit: { min: 15, max: 20 },
    billingCycle: "monthly",
    features: ["6 subjects", "15-20 students", "Priority support", "Advanced analytics"]
  },
  vip: {
    name: "VIP Plan",
    price: { NGN: 4500, USD: 3 },
    subjectLimit: { min: 6, max: 10 },
    studentLimit: 30,
    billingCycle: "monthly",
    features: ["6-10 subjects", "30 students", "24/7 support", "Custom features"]
  }
}
```

#### Payment Transaction Document (`transactions/{transactionId}`)

```javascript
{
  teacherId: string,
  planTier: string,
  amount: number,
  currency: string,
  status: string,                 // "pending" | "success" | "failed"
  paystackReference: string,
  paystackResponse: object,       // Full Paystack response
  createdAt: timestamp,
  completedAt: timestamp
}
```

### 2. React Context - SubscriptionContext

```javascript
// src/context/SubscriptionContext.jsx

interface SubscriptionContextValue {
  // Current subscription data
  subscription: Subscription | null,
  loading: boolean,
  error: string | null,
  
  // Plan information
  availablePlans: PlanConfig[],
  currentPlan: PlanConfig | null,
  
  // Usage metrics
  subjectUsage: { current: number, limit: number, percentage: number },
  studentUsage: { current: number, limit: number, percentage: number },
  
  // Actions
  upgradePlan: (planTier: string, currency: string) => Promise<void>,
  cancelSubscription: () => Promise<void>,
  checkLimit: (type: 'subject' | 'student') => boolean,
  incrementUsage: (type: 'subject' | 'student') => Promise<void>,
  decrementUsage: (type: 'subject' | 'student') => Promise<void>,
  
  // Helpers
  canAddSubject: () => boolean,
  canAddStudent: () => boolean,
  isNearLimit: (type: 'subject' | 'student') => boolean  // 80% threshold
}
```

### 3. Payment Component

```javascript
// src/components/Subscription/PaymentModal.jsx

interface PaymentModalProps {
  planTier: 'premium' | 'vip',
  onSuccess: () => void,
  onCancel: () => void
}

// Features:
// - Currency selection (NGN/USD)
// - Paystack integration
// - Payment verification
// - Error handling
// - Loading states
```

### 4. Subscription Management Component

```javascript
// src/components/Subscription/SubscriptionManager.jsx

// Features:
// - Display current plan and usage
// - Show available plans with comparison
// - Upgrade/downgrade buttons
// - Payment modal integration
// - Usage warnings (80% threshold)
// - Plan expiry notifications
```

### 5. Limit Enforcement Hook

```javascript
// src/hooks/useSubscriptionLimits.js

interface UseSubscriptionLimits {
  validateSubjectRegistration: () => Promise<{ allowed: boolean, message: string }>,
  validateStudentRegistration: () => Promise<{ allowed: boolean, message: string }>,
  showLimitWarning: (type: 'subject' | 'student') => void,
  getRemainingSlots: (type: 'subject' | 'student') => number
}
```

## Data Models

### Plan Tier Enum

```javascript
const PLAN_TIERS = {
  FREE: 'free',
  PREMIUM: 'premium',
  VIP: 'vip'
};

const PLAN_LIMITS = {
  free: { subjects: 3, students: 10 },
  premium: { subjects: 6, students: { min: 15, max: 20 } },
  vip: { subjects: { min: 6, max: 10 }, students: 30 }
};
```

### Subscription Status Enum

```javascript
const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  GRACE_PERIOD: 'grace_period',
  CANCELLED: 'cancelled'
};
```

## Error Handling

### Error Types

```javascript
class SubscriptionError extends Error {
  constructor(code, message, details) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

// Error codes:
// - LIMIT_EXCEEDED: Attempting to register beyond plan limits
// - PAYMENT_FAILED: Payment processing failed
// - INVALID_PLAN: Invalid plan tier selected
// - SUBSCRIPTION_EXPIRED: Attempting action with expired subscription
// - NETWORK_ERROR: Firebase or Paystack connection issues
```

### Error Handling Strategy

1. **Limit Exceeded**: Display modal with current usage, limit, and upgrade options
2. **Payment Failed**: Show error message, retry option, and support contact
3. **Network Errors**: Implement retry logic with exponential backoff (3 attempts)
4. **Subscription Expired**: Show renewal modal with grace period information
5. **Invalid Operations**: Log to console, show user-friendly message, prevent action

### User Feedback

- **Success Messages**: Toast notifications for successful upgrades, payments
- **Warning Messages**: Persistent banner when approaching limits (80%)
- **Error Messages**: Modal dialogs for critical errors with action buttons
- **Loading States**: Skeleton screens during data fetching, spinners for actions

## Testing Strategy

### Unit Tests

1. **Subscription Context**
   - Test plan limit calculations
   - Test usage increment/decrement
   - Test limit validation logic
   - Test plan upgrade/downgrade logic

2. **Payment Integration**
   - Mock Paystack API responses
   - Test payment success flow
   - Test payment failure handling
   - Test currency conversion

3. **Limit Enforcement**
   - Test subject registration validation
   - Test student registration validation
   - Test edge cases (exactly at limit, over limit)
   - Test warning threshold (80%)

### Integration Tests

1. **End-to-End Subscription Flow**
   - New teacher gets Free plan
   - Teacher upgrades to Premium
   - Payment processes successfully
   - Limits update correctly
   - Teacher can register within new limits

2. **Limit Enforcement Flow**
   - Teacher at limit attempts registration
   - System blocks registration
   - System shows upgrade modal
   - Teacher upgrades
   - Registration succeeds

3. **Downgrade Flow**
   - Teacher with Premium plan cancels
   - Grace period activates
   - Payment fails during grace period
   - System downgrades to Free
   - Existing data retained
   - New registrations blocked until within limits

### Manual Testing Scenarios

1. **Payment Testing**
   - Test with Paystack test cards
   - Verify webhook handling
   - Test both NGN and USD payments
   - Test payment failures

2. **Limit Testing**
   - Register subjects up to limit
   - Attempt to exceed limit
   - Verify warning at 80%
   - Test downgrade with excess data

3. **UI/UX Testing**
   - Verify all modals display correctly
   - Test responsive design on mobile
   - Verify loading states
   - Test error message clarity

## Implementation Considerations

### Paystack Integration

- **API Keys**: Store in environment variables (VITE_PAYSTACK_PUBLIC_KEY, VITE_PAYSTACK_SECRET_KEY)
- **Webhook URL**: Configure in Paystack dashboard for payment verification
- **Test Mode**: Use test keys during development
- **Currency Support**: Paystack supports NGN natively, USD through international payments

### Firebase Security Rules

```javascript
// Firestore security rules for subscriptions collection
match /subscriptions/{teacherId} {
  allow read: if request.auth != null && request.auth.uid == teacherId;
  allow write: if false;  // Only backend functions can write
}

match /transactions/{transactionId} {
  allow read: if request.auth != null && 
                 resource.data.teacherId == request.auth.uid;
  allow write: if false;  // Only backend functions can write
}
```

### Performance Optimization

1. **Caching**: Cache plan configuration in memory to reduce Firestore reads
2. **Batch Operations**: Use Firestore batch writes for usage updates
3. **Indexes**: Create composite indexes for subscription queries
4. **Lazy Loading**: Load payment history only when requested

### Scalability Considerations

1. **Usage Tracking**: Consider moving to Cloud Functions for high-volume updates
2. **Payment Webhooks**: Implement idempotency to handle duplicate webhook calls
3. **Rate Limiting**: Implement rate limiting on payment endpoints
4. **Monitoring**: Set up Firebase Performance Monitoring and error tracking

### Migration Strategy

1. **Existing Teachers**: Create Free plan subscriptions for all existing teachers
2. **Data Migration**: Run script to count existing subjects/students and populate usage
3. **Backward Compatibility**: Ensure existing features work during rollout
4. **Gradual Rollout**: Enable for new teachers first, then migrate existing users

## UI/UX Design Notes

### Subscription Dashboard

- **Current Plan Card**: Display plan name, limits, usage bars, expiry date
- **Usage Indicators**: Progress bars with color coding (green < 50%, yellow 50-80%, red > 80%)
- **Upgrade CTA**: Prominent button when approaching limits or on Free plan
- **Plan Comparison Table**: Side-by-side comparison of all plans with current plan highlighted

### Payment Flow

1. Teacher clicks "Upgrade to Premium/VIP"
2. Modal shows plan details and price in both NGN and USD
3. Currency selector (default to NGN for Nigerian users)
4. Paystack payment form embedded in modal
5. Loading state during payment processing
6. Success message with confetti animation
7. Dashboard updates with new plan immediately

### Limit Warning System

- **80% Warning**: Yellow banner at top of dashboard
- **100% Blocking**: Modal dialog when attempting to register beyond limit
- **Upgrade Prompt**: Both warnings include "Upgrade Now" button
- **Dismissible**: Warnings can be dismissed but reappear on next session

### Mobile Responsiveness

- Stack plan comparison cards vertically on mobile
- Simplify payment modal for smaller screens
- Use bottom sheets for upgrade prompts on mobile
- Ensure touch targets are at least 44x44px
