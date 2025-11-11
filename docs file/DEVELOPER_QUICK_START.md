# School-Based Subscription - Developer Quick Start

## Quick Overview

Schools pay for subscriptions. Teachers belong to schools. Limits apply school-wide.

## Using the New System

### 1. Import the Context

```javascript
import { useSchoolSubscription } from './context/SchoolSubscriptionContext';
```

### 2. Use in Components

```javascript
function MyComponent() {
  const {
    school,              // School data
    isAdmin,             // Is current user admin?
    subjectUsage,        // { current, limit, percentage }
    studentUsage,        // { current, limit, percentage }
    teacherUsage,        // { subjects, students } - individual
    canAddSubject,       // Function to check if can add
    canAddStudent,       // Function to check if can add
    incrementUsage,      // Function to increment usage
    decrementUsage,      // Function to decrement usage
    upgradePlan,         // Function to upgrade (admin only)
  } = useSchoolSubscription();
  
  // Your component logic
}
```

### 3. Check Limits Before Registration

```javascript
async function registerSubject(subjectData) {
  // Check if can add
  if (!canAddSubject()) {
    if (isAdmin) {
      showUpgradeModal();
    } else {
      showContactAdminModal();
    }
    return;
  }
  
  // Register subject
  await createSubject(subjectData);
  
  // Increment usage
  await incrementUsage('subject');
}
```

### 4. Display Usage

```javascript
function UsageDisplay() {
  const { subjectUsage, studentUsage, teacherUsage } = useSchoolSubscription();
  
  return (
    <div>
      <h3>School-Wide Usage</h3>
      <p>Subjects: {subjectUsage.current} / {subjectUsage.limit}</p>
      <p>Students: {studentUsage.current} / {studentUsage.limit}</p>
      
      <h3>Your Usage</h3>
      <p>Subjects: {teacherUsage.subjects}</p>
      <p>Students: {teacherUsage.students}</p>
    </div>
  );
}
```

### 5. Admin-Only Actions

```javascript
function UpgradeButton() {
  const { isAdmin, upgradePlan } = useSchoolSubscription();
  
  if (!isAdmin) {
    return <p>Contact your admin to upgrade</p>;
  }
  
  const handleUpgrade = async () => {
    try {
      const paymentDetails = await upgradePlan('premium', 'NGN');
      // Show payment modal with paymentDetails
    } catch (error) {
      console.error('Upgrade failed:', error);
    }
  };
  
  return <button onClick={handleUpgrade}>Upgrade Plan</button>;
}
```

## Creating a School

```javascript
import { initializeNewSchool } from './utils/schoolInitialization';

async function createSchool(schoolName, userId) {
  const result = await initializeNewSchool(schoolName, userId);
  
  if (result.success) {
    console.log('School created:', result.schoolId);
    // Redirect to dashboard
  } else {
    console.error('Failed:', result.error);
  }
}
```

## Joining a School

```javascript
import { joinExistingSchool, validateInvitationCode } from './utils/schoolInitialization';

async function joinSchool(invitationCode, userId) {
  // Validate code
  const validation = validateInvitationCode(invitationCode);
  
  if (!validation.valid) {
    console.error('Invalid code:', validation.error);
    return;
  }
  
  // Join school
  const result = await joinExistingSchool(userId, validation.schoolId);
  
  if (result.success) {
    console.log('Joined school successfully');
    // Redirect to dashboard
  } else {
    console.error('Failed:', result.error);
  }
}
```

## Generating Invitation Links

```javascript
import { getInvitationLink } from './utils/schoolInitialization';

function InviteTeachers({ schoolId }) {
  const invitationLink = getInvitationLink(schoolId);
  
  return (
    <div>
      <p>Share this link with teachers:</p>
      <input value={invitationLink} readOnly />
      <button onClick={() => navigator.clipboard.writeText(invitationLink)}>
        Copy Link
      </button>
    </div>
  );
}
```

## Common Patterns

### Pattern 1: Conditional Rendering Based on Role

```javascript
function SubscriptionSettings() {
  const { isAdmin } = useSchoolSubscription();
  
  return (
    <div>
      <h2>Subscription Settings</h2>
      {isAdmin ? (
        <AdminControls />
      ) : (
        <TeacherView />
      )}
    </div>
  );
}
```

### Pattern 2: Warning at 80% Usage

```javascript
function UsageWarning() {
  const { subjectUsage, isNearLimit } = useSchoolSubscription();
  
  if (isNearLimit('subject')) {
    return (
      <div className="warning">
        Warning: You've used {subjectUsage.percentage}% of your subject limit
      </div>
    );
  }
  
  return null;
}
```

### Pattern 3: Blocking at 100% Usage

```javascript
function RegisterButton() {
  const { canAddSubject, isAdmin } = useSchoolSubscription();
  
  const handleClick = () => {
    if (!canAddSubject()) {
      if (isAdmin) {
        showUpgradeModal();
      } else {
        alert('Your school has reached the limit. Contact your admin.');
      }
      return;
    }
    
    // Proceed with registration
    showRegistrationForm();
  };
  
  return <button onClick={handleClick}>Register Subject</button>;
}
```

## Service Functions

### School Service

```javascript
import {
  createSchool,
  getSchool,
  getSchoolByTeacherId,
  addTeacherToSchool,
  removeTeacherFromSchool,
  incrementUsage,
  decrementUsage,
  updateSchoolPlan,
  getSchoolTeachers,
  isSchoolAdmin
} from './firebase/schoolService';

// Create a school
const schoolId = await createSchool('My School', userId);

// Get school data
const school = await getSchool(schoolId);

// Get teacher's school
const school = await getSchoolByTeacherId(teacherId);

// Add teacher to school
await addTeacherToSchool(teacherId, schoolId, 'teacher');

// Remove teacher
await removeTeacherFromSchool(teacherId);

// Update usage
await incrementUsage(teacherId, 'subject');
await decrementUsage(teacherId, 'student');

// Update plan
await updateSchoolPlan(schoolId, 'premium', { amount: 1500, currency: 'NGN' });

// Get all teachers in school
const teachers = await getSchoolTeachers(schoolId);

// Check if user is admin
const isAdmin = await isSchoolAdmin(teacherId);
```

## Migration

### Run Migration

```javascript
import { migrateAllToSchoolBased, verifyMigration } from './utils/migrateToSchoolBased';

// Run migration
const results = await migrateAllToSchoolBased();
console.log('Migration results:', results);

// Verify
const verification = await verifyMigration();
console.log('Verification:', verification);
```

### Rollback (if needed)

```javascript
import { rollbackMigration } from './utils/migrateToSchoolBased';

// WARNING: This deletes all schools and teacher documents!
const rollbackResults = await rollbackMigration();
console.log('Rollback results:', rollbackResults);
```

## Testing

### Unit Test Example

```javascript
import { render, screen } from '@testing-library/react';
import { SchoolSubscriptionProvider } from './context/SchoolSubscriptionContext';

test('displays school usage', () => {
  render(
    <SchoolSubscriptionProvider>
      <UsageDisplay />
    </SchoolSubscriptionProvider>
  );
  
  expect(screen.getByText(/School-Wide Usage/i)).toBeInTheDocument();
});
```

### Mock Context for Testing

```javascript
const mockSchoolSubscription = {
  school: { id: '123', name: 'Test School', planTier: 'free' },
  isAdmin: true,
  subjectUsage: { current: 2, limit: 3, percentage: 67 },
  studentUsage: { current: 5, limit: 10, percentage: 50 },
  canAddSubject: jest.fn(() => true),
  incrementUsage: jest.fn(),
};

jest.mock('./context/SchoolSubscriptionContext', () => ({
  useSchoolSubscription: () => mockSchoolSubscription
}));
```

## Troubleshooting

### Issue: "Teacher not found in any school"

**Solution:** User needs to create or join a school first.

```javascript
import { checkUserSchoolStatus } from './utils/schoolInitialization';

const status = await checkUserSchoolStatus(userId);
if (!status.hasSchool) {
  // Redirect to school setup
}
```

### Issue: "Only school admins can upgrade plans"

**Solution:** Check if user is admin before showing upgrade options.

```javascript
const { isAdmin } = useSchoolSubscription();
if (!isAdmin) {
  // Hide upgrade button or show "Contact admin" message
}
```

### Issue: Usage counts don't match

**Solution:** Usage is aggregated. Check both teacher and school documents.

```javascript
// Individual teacher usage
const teacherDoc = await getTeacherSchoolRelationship(teacherId);
console.log('Teacher usage:', teacherDoc.currentSubjects);

// School-wide usage
const school = await getSchool(schoolId);
console.log('School usage:', school.currentSubjects);
```

## Best Practices

1. **Always check limits before registration**
2. **Update usage after successful registration**
3. **Show appropriate messages based on admin status**
4. **Display both school-wide and individual usage**
5. **Handle errors gracefully**
6. **Use loading states during async operations**
7. **Cache school data in context to reduce reads**
8. **Use batch operations for multiple updates**

## Resources

- Full Migration Guide: `MIGRATION_GUIDE.md`
- Design Document: `.kiro/specs/subscription-plan-system/school-based-design-addendum.md`
- Summary: `SCHOOL_BASED_SUBSCRIPTION_SUMMARY.md`
- Requirements: `.kiro/specs/subscription-plan-system/requirements.md`
