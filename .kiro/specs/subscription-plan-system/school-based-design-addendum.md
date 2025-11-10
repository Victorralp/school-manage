# School-Based Subscription System - Design Addendum

## Overview

This document describes the architectural changes to convert from a teacher-based subscription model to a school-based subscription model. In this new model, schools hold subscriptions and pay for plans, while teachers belong to schools and share the school's subscription limits.

## Key Changes

### Conceptual Model Shift

**Before (Teacher-Based):**
- Each teacher has their own subscription
- Each teacher pays for their own plan
- Limits apply per teacher

**After (School-Based):**
- Schools have subscriptions
- School admins pay for the school's plan
- Limits apply school-wide (aggregated across all teachers)
- Teachers belong to schools and inherit the school's plan

## Updated Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   School     │  │   Payment    │  │  School-Wide │     │
│  │ Subscription │  │  Component   │  │    Usage     │     │
│  │   Context    │  │ (Admin Only) │  │   Monitor    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Firebase Services                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Firestore   │  │     Auth     │  │   Functions  │     │
│  │  - schools   │  │              │  │  (Backend)   │     │
│  │  - teachers  │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Paystack Payment API                       │
│         (School Admin Processes Payments)                   │
└─────────────────────────────────────────────────────────────┘
```

### Updated Data Flow

1. **School Creation**: New user creates school → Becomes admin → School gets Free plan
2. **Teacher Joining**: Teacher joins school → Inherits school's plan limits
3. **Plan Upgrade**: School admin selects plan → Processes payment → All teachers get new limits
4. **Limit Enforcement**: Any teacher registers → Check school-wide usage → Validate → Allow/Reject
5. **Usage Tracking**: Teacher action → Update teacher's usage → Update school's total usage

## Updated Data Models

### School Document (`schools/{schoolId}`)

```javascript
{
  name: string,                   // School name
  adminUserId: string,            // User ID of school admin
  planTier: string,               // "free" | "premium" | "vip"
  status: string,                 // "active" | "expired" | "grace_period"
  
  // School-wide limits
  subjectLimit: number,           // Total subjects allowed across all teachers
  studentLimit: number,           // Total students allowed across all teachers
  
  // School-wide usage (aggregated)
  currentSubjects: number,        // Total subjects registered by all teachers
  currentStudents: number,        // Total students registered by all teachers
  
  // Teacher tracking
  teacherCount: number,           // Number of teachers in school
  
  // Payment info
  amount: number,                 // Amount paid (0 for free)
  currency: string,               // "NGN" | "USD"
  
  // Timestamps
  startDate: timestamp,           // When school was created
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

### Teacher-School Relationship Document (`teachers/{teacherId}`)

```javascript
{
  teacherId: string,              // User ID
  schoolId: string,               // Reference to school document
  role: string,                   // "admin" | "teacher"
  
  // Individual teacher usage (for tracking/reporting)
  currentSubjects: number,        // Subjects registered by this teacher
  currentStudents: number,        // Students registered by this teacher
  
  // Metadata
  joinedAt: timestamp,
  updatedAt: timestamp
}
```

### Updated Transaction Document (`transactions/{transactionId}`)

```javascript
{
  schoolId: string,               // School that made payment
  paidByUserId: string,           // Admin who processed payment
  planTier: string,
  amount: number,
  currency: string,
  status: string,                 // "pending" | "success" | "failed"
  paystackReference: string,
  paystackResponse: object,
  createdAt: timestamp,
  completedAt: timestamp
}
```

## Updated React Context - SchoolSubscriptionContext

```javascript
// src/context/SchoolSubscriptionContext.jsx

interface SchoolSubscriptionContextValue {
  // School data
  school: School | null,
  teacherRelationship: TeacherSchool | null,
  loading: boolean,
  error: string | null,
  isAdmin: boolean,                // Whether current user is school admin
  
  // Plan information
  availablePlans: PlanConfig[],
  currentPlan: PlanConfig | null,
  
  // School-wide usage metrics
  subjectUsage: { current: number, limit: number, percentage: number },
  studentUsage: { current: number, limit: number, percentage: number },
  
  // Individual teacher usage (for display)
  teacherUsage: { subjects: number, students: number },
  
  // Actions (admin-only for payment)
  upgradePlan: (planTier: string, currency: string) => Promise<void>,
  cancelSubscription: () => Promise<void>,
  
  // Actions (all teachers)
  checkLimit: (type: 'subject' | 'student') => boolean,
  incrementUsage: (type: 'subject' | 'student') => Promise<void>,
  decrementUsage: (type: 'subject' | 'student') => Promise<void>,
  
  // Helpers
  canAddSubject: () => boolean,
  canAddStudent: () => boolean,
  isNearLimit: (type: 'subject' | 'student') => boolean
}
```

## New Components

### 1. School Creation Component

```javascript
// src/components/School/CreateSchoolModal.jsx

interface CreateSchoolModalProps {
  onSuccess: (schoolId: string) => void,
  onCancel: () => void
}

// Features:
// - School name input
// - Creates school with Free plan
// - Sets user as admin
// - Redirects to dashboard
```

### 2. Join School Component

```javascript
// src/components/School/JoinSchoolModal.jsx

interface JoinSchoolModalProps {
  onSuccess: () => void,
  onCancel: () => void
}

// Features:
// - School invitation code input
// - Validates invitation
// - Adds teacher to school
// - Redirects to dashboard
```

### 3. School Management Component (Admin Only)

```javascript
// src/components/School/SchoolManagement.jsx

// Features:
// - Display school name and teacher count
// - List all teachers in school
// - Generate invitation links
// - Remove teachers (admin only)
// - View school-wide usage breakdown
```

### 4. Updated Subscription Dashboard

```javascript
// src/components/Subscription/SchoolSubscriptionDashboard.jsx

// Features:
// - Display school name and plan
// - Show school-wide usage (all teachers combined)
// - Show individual teacher's contribution
// - Upgrade button (visible only to admins)
// - Admin badge indicator
// - Teacher list (for admins)
```

## Updated Security Rules

```javascript
// Firestore security rules

// Schools collection
match /schools/{schoolId} {
  // All teachers in school can read
  allow read: if request.auth != null && 
                 exists(/databases/$(database)/documents/teachers/$(request.auth.uid)) &&
                 get(/databases/$(database)/documents/teachers/$(request.auth.uid)).data.schoolId == schoolId;
  
  // Only backend functions can write
  allow write: if false;
}

// Teachers collection
match /teachers/{teacherId} {
  // Teachers can read their own document
  allow read: if request.auth != null && request.auth.uid == teacherId;
  
  // Only backend functions can write
  allow write: if false;
}

// Transactions collection
match /transactions/{transactionId} {
  // School admin can read school's transactions
  allow read: if request.auth != null && 
                 resource.data.schoolId == get(/databases/$(database)/documents/teachers/$(request.auth.uid)).data.schoolId;
  
  // Only backend functions can write
  allow write: if false;
}
```

## Migration Strategy

### Phase 1: Data Structure Migration

1. **Create Schools Collection**
   - For each existing teacher subscription, create a school
   - School name: "{Teacher Name}'s School"
   - Set teacher as admin
   - Copy subscription data to school

2. **Create Teachers Collection**
   - For each teacher, create teacher-school relationship
   - Set role as "admin" (since they're the only teacher)
   - Copy individual usage data

3. **Update Transactions**
   - Add schoolId field to existing transactions
   - Map teacherId to corresponding schoolId

### Phase 2: Code Migration

1. **Deploy New Services**
   - Deploy schoolService.js
   - Keep subscriptionService.js for backward compatibility

2. **Deploy New Context**
   - Deploy SchoolSubscriptionContext
   - Keep SubscriptionContext for gradual migration

3. **Update Components**
   - Update registration forms to use new context
   - Update dashboard to show school-based data
   - Add admin-only payment controls

### Phase 3: User Migration

1. **Notify Users**
   - Email all users about the change
   - Explain school-based model benefits
   - Provide migration guide

2. **Gradual Rollout**
   - Enable for new users first
   - Migrate existing users in batches
   - Monitor for issues

3. **Support Period**
   - Provide support for questions
   - Handle edge cases
   - Collect feedback

## Updated UI/UX Considerations

### For School Admins

- **Admin Badge**: Display "School Admin" badge in header
- **Payment Controls**: Show upgrade/payment buttons
- **School Management**: Access to teacher management
- **Usage Breakdown**: See which teachers are using what

### For Regular Teachers

- **School Info**: Display school name and plan
- **Usage Visibility**: See school-wide usage and their contribution
- **No Payment Controls**: Hide upgrade buttons, show "Contact admin to upgrade"
- **Limit Messages**: "Your school has reached the limit. Ask your admin to upgrade."

### School Creation Flow

1. New user registers
2. Prompt: "Create a new school or join existing?"
3. If create: Enter school name → Becomes admin → Free plan assigned
4. If join: Enter invitation code → Joins as teacher → Inherits school plan

### Invitation System

- **Admin generates invitation link**: `app.com/join?code=ABC123`
- **Teacher clicks link**: Validates code → Joins school
- **Alternative**: Admin enters teacher email → System sends invitation

## Testing Considerations

### Additional Test Scenarios

1. **School Creation**
   - Test school creation with valid data
   - Test duplicate school names
   - Verify admin role assignment

2. **Multi-Teacher Usage**
   - Teacher A registers 2 subjects
   - Teacher B registers 1 subject
   - Verify school total is 3
   - Verify individual counts are correct

3. **Admin-Only Actions**
   - Regular teacher attempts upgrade → Blocked
   - Admin upgrades plan → Success
   - All teachers see new limits

4. **Teacher Removal**
   - Admin removes teacher
   - Verify school usage decrements
   - Verify teacher loses access

5. **School-Wide Limits**
   - School at limit (3 subjects)
   - Any teacher attempts to add → Blocked
   - Admin upgrades → All teachers can add

## Performance Considerations

### Aggregation Optimization

- **Batch Updates**: When teacher registers, update both teacher and school in single batch
- **Eventual Consistency**: Accept slight delays in usage aggregation
- **Caching**: Cache school data in context to reduce reads

### Scalability

- **Large Schools**: Consider pagination for teacher lists in schools with 50+ teachers
- **Usage Queries**: Index on schoolId for efficient teacher queries
- **Real-time Updates**: Use Firestore listeners efficiently to avoid excessive reads

## Benefits of School-Based Model

1. **Cost Efficiency**: Schools pay once for all teachers
2. **Centralized Management**: Admins control subscription for entire school
3. **Better Collaboration**: Teachers share resources within school limits
4. **Simplified Billing**: One payment per school instead of per teacher
5. **Institutional Adoption**: Easier for schools to adopt as an institution
