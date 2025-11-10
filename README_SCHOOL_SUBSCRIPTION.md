# School-Based Subscription System

## Overview

This is a complete school-based subscription system where schools (not individual teachers) hold subscriptions and pay for plans. Teachers belong to schools and share the school's subscription limits.

## Key Features

- 🏫 **School-Based Model**: Schools hold subscriptions, not individual teachers
- 👥 **Multi-Teacher Support**: Multiple teachers per school sharing limits
- 🔐 **Role-Based Access**: School admins manage subscriptions, teachers use the system
- 📊 **Usage Tracking**: Both school-wide and individual teacher usage tracked
- 💳 **Centralized Payments**: School admins process payments for entire school
- 🔗 **Invitation System**: Easy teacher onboarding via invitation links
- 📈 **Real-Time Updates**: Live subscription and usage updates
- 🛡️ **Limit Enforcement**: School-wide limits enforced across all teachers

## Architecture

### Data Model

```
School
├── Subscription (Free/Premium/VIP)
├── School-wide limits
├── School-wide usage (aggregated)
└── Teachers
    ├── Admin (manages subscription)
    └── Teachers (use the system)
```

### Collections

- **schools**: School documents with subscription data
- **teachers**: Teacher-school relationships with individual usage
- **transactions**: Payment transactions linked to schools
- **subscriptions**: Legacy collection (for backward compatibility)

## Quick Start

### 1. Installation

```bash
npm install react-paystack
```

### 2. Environment Setup

Add to `.env`:
```env
VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
VITE_PAYSTACK_SECRET_KEY=sk_test_xxxxx
```

### 3. Wrap Your App

```javascript
import { SchoolSubscriptionProvider } from './context/SchoolSubscriptionContext';

<SchoolSubscriptionProvider>
  <YourApp />
</SchoolSubscriptionProvider>
```

### 4. Use in Components

```javascript
import { useSchoolSubscription } from './context/SchoolSubscriptionContext';

function MyComponent() {
  const { 
    school,           // School data
    isAdmin,          // Is user admin?
    canAddSubject,    // Check if can add
    incrementUsage    // Update usage
  } = useSchoolSubscription();
}
```

## File Structure

```
src/
├── firebase/
│   ├── subscriptionModels.js      # Data models
│   ├── schoolService.js           # School CRUD operations
│   └── subscriptionService.js     # Legacy service
├── context/
│   ├── SchoolSubscriptionContext.jsx  # New context
│   └── SubscriptionContext.jsx        # Legacy context
├── components/
│   └── School/
│       ├── SchoolSetupWizard.jsx      # Onboarding
│       ├── CreateSchoolModal.jsx      # Create school
│       ├── JoinSchoolModal.jsx        # Join school
│       ├── SchoolManagement.jsx       # Admin dashboard
│       ├── InviteTeachers.jsx         # Invitation system
│       └── SchoolGuard.jsx            # Route protection
├── utils/
│   ├── migrateToSchoolBased.js        # Migration script
│   ├── schoolInitialization.js        # School setup
│   └── schoolPaymentVerification.js   # Payment processing
└── pages/
    └── JoinSchoolPage.jsx             # Invitation landing

docs/
├── MIGRATION_GUIDE.md                 # Migration instructions
├── DEVELOPER_QUICK_START.md           # Quick reference
├── INTEGRATION_EXAMPLE.md             # Code examples
├── IMPLEMENTATION_CHECKLIST.md        # Task checklist
├── NEXT_STEPS.md                      # What to do next
└── SCHOOL_BASED_SUBSCRIPTION_SUMMARY.md  # Overview
```

## Documentation

### For Developers
- **[Developer Quick Start](DEVELOPER_QUICK_START.md)** - Quick reference guide
- **[Integration Examples](INTEGRATION_EXAMPLE.md)** - Code examples
- **[API Reference](src/context/SchoolSubscriptionContext.jsx)** - Context API

### For Implementation
- **[Next Steps](NEXT_STEPS.md)** - What to do next
- **[Implementation Checklist](IMPLEMENTATION_CHECKLIST.md)** - Complete task list
- **[Migration Guide](MIGRATION_GUIDE.md)** - Step-by-step migration

### For Planning
- **[Summary](SCHOOL_BASED_SUBSCRIPTION_SUMMARY.md)** - System overview
- **[Design Document](.kiro/specs/subscription-plan-system/school-based-design-addendum.md)** - Detailed design
- **[Requirements](.kiro/specs/subscription-plan-system/requirements.md)** - Updated requirements

## Usage Examples

### Check Limits Before Registration

```javascript
const { canAddSubject, isAdmin } = useSchoolSubscription();

if (!canAddSubject()) {
  if (isAdmin) {
    showUpgradeModal();
  } else {
    alert('Contact your admin to upgrade');
  }
  return;
}

// Proceed with registration
```

### Display Usage

```javascript
const { subjectUsage, teacherUsage } = useSchoolSubscription();

<div>
  <p>School: {subjectUsage.current} / {subjectUsage.limit}</p>
  <p>Your contribution: {teacherUsage.subjects}</p>
</div>
```

### Admin-Only Actions

```javascript
const { isAdmin, upgradePlan } = useSchoolSubscription();

if (!isAdmin) {
  return <p>Only admins can upgrade</p>;
}

<button onClick={() => upgradePlan('premium', 'NGN')}>
  Upgrade
</button>
```

## Migration

### From Teacher-Based to School-Based

```javascript
import { migrateAllToSchoolBased } from './utils/migrateToSchoolBased';

// Run migration
const results = await migrateAllToSchoolBased();

// Each teacher becomes a school admin
// Their subscription becomes the school's subscription
```

See [Migration Guide](MIGRATION_GUIDE.md) for details.

## Database Setup

### Deploy Indexes

```bash
firebase deploy --only firestore:indexes
```

### Update Security Rules

```bash
firebase deploy --only firestore:rules
```

See [Firestore Index Setup](FIRESTORE_INDEX_SETUP.md) for details.

## Testing

### Unit Tests

```javascript
import { render } from '@testing-library/react';
import { SchoolSubscriptionProvider } from './context/SchoolSubscriptionContext';

test('displays school usage', () => {
  render(
    <SchoolSubscriptionProvider>
      <MyComponent />
    </SchoolSubscriptionProvider>
  );
});
```

### Integration Tests

- School creation flow
- Teacher invitation flow
- Multi-teacher usage aggregation
- Limit enforcement
- Payment processing

See [Implementation Checklist](IMPLEMENTATION_CHECKLIST.md) for complete test scenarios.

## API Reference

### useSchoolSubscription Hook

```javascript
const {
  // Data
  school,              // School document
  teacherRelationship, // Teacher-school relationship
  isAdmin,             // Boolean: is user admin?
  currentPlan,         // Current plan details
  availablePlans,      // All available plans
  
  // Usage
  subjectUsage,        // { current, limit, percentage }
  studentUsage,        // { current, limit, percentage }
  teacherUsage,        // { subjects, students }
  
  // Actions
  incrementUsage,      // (type) => Promise<void>
  decrementUsage,      // (type) => Promise<void>
  upgradePlan,         // (tier, currency) => Promise<object>
  cancelSubscription,  // () => Promise<object>
  
  // Helpers
  canAddSubject,       // () => boolean
  canAddStudent,       // () => boolean
  checkLimit,          // (type) => boolean
  isNearLimit,         // (type) => boolean
  isInGracePeriod,     // () => boolean
  exceedsLimits,       // () => { subjects, students }
  
  // State
  loading,             // boolean
  error                // string | null
} = useSchoolSubscription();
```

## Subscription Plans

### Free Plan
- 3 subjects (school-wide)
- 10 students (school-wide)
- Unlimited teachers
- Basic features

### Premium Plan
- 6 subjects (school-wide)
- 15-20 students (school-wide)
- Unlimited teachers
- Priority support
- ₦1,500/month or $1/month

### VIP Plan
- 6-10 subjects (school-wide)
- 30 students (school-wide)
- Unlimited teachers
- 24/7 support
- Custom features
- ₦4,500/month or $3/month

## Support

### Documentation
- [Migration Guide](MIGRATION_GUIDE.md)
- [Developer Quick Start](DEVELOPER_QUICK_START.md)
- [Integration Examples](INTEGRATION_EXAMPLE.md)

### Issues
- Check existing documentation
- Test in staging first
- Document issues encountered
- Update documentation with solutions

## Contributing

When making changes:

1. Update relevant documentation
2. Add tests for new features
3. Test in staging environment
4. Update this README if needed

## License

[Your License Here]

## Changelog

### Version 2.0.0 (School-Based Model)
- Converted from teacher-based to school-based subscriptions
- Added school management features
- Added invitation system
- Added role-based access control
- Added migration utilities
- Updated all documentation

### Version 1.0.0 (Teacher-Based Model)
- Initial teacher-based subscription system
- Basic payment integration
- Limit enforcement
- Usage tracking
