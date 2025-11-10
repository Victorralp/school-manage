# School-Based Subscription - Quick Reference Card

## 🚀 Quick Start

### Deploy Indexes
```bash
firebase deploy --only firestore:indexes
```

### Deploy Security Rules
```bash
firebase deploy --only firestore:rules
```

### Start Development
```bash
npm run dev
```

## 📦 Key Imports

```javascript
// Context
import { useSchoolSubscription } from './context/SchoolSubscriptionContext';

// Services
import { 
  createSchool, 
  getSchool, 
  incrementUsage,
  decrementUsage 
} from './firebase/schoolService';

// Utilities
import { 
  initializeNewSchool,
  joinExistingSchool,
  getInvitationLink 
} from './utils/schoolInitialization';
```

## 🎯 Common Patterns

### Check if User Can Add Subject
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
```

### Register Subject with Usage Tracking
```javascript
const { incrementUsage } = useSchoolSubscription();

// Register subject
await createSubject(data);

// Update usage
await incrementUsage('subject');
```

### Display School Usage
```javascript
const { subjectUsage, studentUsage, teacherUsage } = useSchoolSubscription();

<div>
  <p>School: {subjectUsage.current}/{subjectUsage.limit}</p>
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

## 📊 Data Structure

### School Document
```javascript
{
  name: "School Name",
  adminUserId: "user123",
  planTier: "free",
  currentSubjects: 2,      // School-wide
  currentStudents: 8,      // School-wide
  subjectLimit: 3,
  studentLimit: 10,
  teacherCount: 5
}
```

### Teacher Document
```javascript
{
  teacherId: "user123",
  schoolId: "school456",
  role: "admin",           // or "teacher"
  currentSubjects: 1,      // Individual
  currentStudents: 3       // Individual
}
```

## 🔑 Context API

```javascript
const {
  // Data
  school,              // School object
  isAdmin,             // Boolean
  teacherRelationship, // Teacher object
  
  // Usage
  subjectUsage,        // { current, limit, percentage }
  studentUsage,        // { current, limit, percentage }
  teacherUsage,        // { subjects, students }
  
  // Actions
  incrementUsage,      // (type) => Promise
  decrementUsage,      // (type) => Promise
  upgradePlan,         // (tier, currency) => Promise
  
  // Helpers
  canAddSubject,       // () => boolean
  canAddStudent,       // () => boolean
  
  // State
  loading,             // boolean
  error                // string | null
} = useSchoolSubscription();
```

## 🛠️ Common Tasks

### Create School
```javascript
import { initializeNewSchool } from './utils/schoolInitialization';

const result = await initializeNewSchool('My School', userId);
if (result.success) {
  console.log('School created:', result.schoolId);
}
```

### Generate Invitation Link
```javascript
import { getInvitationLink } from './utils/schoolInitialization';

const link = getInvitationLink(schoolId);
// Share link with teachers
```

### Join School
```javascript
import { joinExistingSchool } from './utils/schoolInitialization';

const result = await joinExistingSchool(userId, schoolId);
if (result.success) {
  console.log('Joined school');
}
```

### Check School Status
```javascript
import { checkUserSchoolStatus } from './utils/schoolInitialization';

const status = await checkUserSchoolStatus(userId);
if (!status.hasSchool) {
  // Redirect to school setup
}
```

## 🧪 Testing

### Test Migration
```javascript
import { migrateAllToSchoolBased } from './utils/migrateToSchoolBased';

const results = await migrateAllToSchoolBased();
console.log(results);
```

### Verify Migration
```javascript
import { verifyMigration } from './utils/migrateToSchoolBased';

const verification = await verifyMigration();
console.log(verification);
```

## 🔒 Security Rules

```javascript
// Schools - teachers can read their school
match /schools/{schoolId} {
  allow read: if isTeacherInSchool(schoolId);
  allow write: if false;
}

// Teachers - can read own document
match /teachers/{teacherId} {
  allow read: if request.auth.uid == teacherId;
  allow write: if false;
}
```

## 📝 Firestore Indexes

Required indexes:
- `teachers`: schoolId (ASC), role (ASC)
- `schools`: status (ASC), planTier (ASC)
- `transactions`: schoolId (ASC), createdAt (DESC)

Deploy: `firebase deploy --only firestore:indexes`

## 🎨 UI Components

### School Setup Wizard
```javascript
import SchoolSetupWizard from './components/School/SchoolSetupWizard';

<SchoolSetupWizard />
```

### School Management
```javascript
import SchoolManagement from './components/School/SchoolManagement';

<SchoolManagement />
```

### Invite Teachers
```javascript
import InviteTeachers from './components/School/InviteTeachers';

<InviteTeachers />
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Teacher not found" | User needs to create/join school |
| "Only admins can upgrade" | Expected - only admins can pay |
| Index errors | Deploy indexes and wait |
| Payment fails | Check Paystack keys |

## 📚 Documentation

- `NEXT_STEPS.md` - What to do next
- `DEVELOPER_QUICK_START.md` - Detailed guide
- `INTEGRATION_EXAMPLE.md` - Code examples
- `MIGRATION_GUIDE.md` - Migration process

## 🎯 Key Differences from Old System

| Old (Teacher-Based) | New (School-Based) |
|---------------------|-------------------|
| Each teacher pays | School admin pays |
| Limits per teacher | Limits school-wide |
| Individual subscriptions | One school subscription |
| Teacher manages own plan | Admin manages school plan |

## ⚡ Quick Commands

```bash
# Deploy everything
firebase deploy

# Deploy only indexes
firebase deploy --only firestore:indexes

# Deploy only rules
firebase deploy --only firestore:rules

# Start dev server
npm run dev

# Run tests
npm test
```

## 📞 Support

- Check `IMPLEMENTATION_COMPLETE.md` for status
- See `TROUBLESHOOTING.md` for common issues
- Review `MIGRATION_GUIDE.md` for deployment
- Read `README_SCHOOL_SUBSCRIPTION.md` for overview

---

**Remember:** Schools pay, teachers share limits, admins manage subscriptions!
