# School-Based Subscription Implementation Checklist

## Pre-Implementation

- [ ] Review all documentation
  - [ ] Read `SCHOOL_BASED_SUBSCRIPTION_SUMMARY.md`
  - [ ] Read `MIGRATION_GUIDE.md`
  - [ ] Read `.kiro/specs/subscription-plan-system/school-based-design-addendum.md`
  - [ ] Review updated requirements in `requirements.md`

- [ ] Set up staging environment
  - [ ] Create staging Firebase project
  - [ ] Copy production data to staging
  - [ ] Configure environment variables

- [ ] Backup production data
  - [ ] Export Firestore database
  - [ ] Document current state
  - [ ] Store backup securely

## Code Implementation

### Backend/Services

- [ ] Data Models
  - [ ] Update `src/firebase/subscriptionModels.js`
    - [ ] Add `SCHOOL_ROLES` constant
    - [ ] Add `createSchoolDocument()` function
    - [ ] Add `createTeacherSchoolDocument()` function
    - [ ] Update `createTransactionDocument()` signature
    - [ ] Keep old functions for backward compatibility

- [ ] School Service
  - [ ] Create `src/firebase/schoolService.js`
    - [ ] Implement `createSchool()`
    - [ ] Implement `getSchool()`
    - [ ] Implement `getSchoolByTeacherId()`
    - [ ] Implement `subscribeToSchool()`
    - [ ] Implement `getTeacherSchoolRelationship()`
    - [ ] Implement `addTeacherToSchool()`
    - [ ] Implement `removeTeacherFromSchool()`
    - [ ] Implement `incrementUsage()`
    - [ ] Implement `decrementUsage()`
    - [ ] Implement `updateSchoolPlan()`
    - [ ] Implement `createTransaction()`
    - [ ] Implement `updateTransaction()`
    - [ ] Implement `getTransactionHistory()`
    - [ ] Implement `getSchoolTeachers()`
    - [ ] Implement `isSchoolAdmin()`

### Frontend/Context

- [ ] School Subscription Context
  - [ ] Create `src/context/SchoolSubscriptionContext.jsx`
    - [ ] Implement `SchoolSubscriptionProvider`
    - [ ] Fetch plan configuration
    - [ ] Load teacher-school relationship
    - [ ] Subscribe to school updates
    - [ ] Calculate school-wide usage
    - [ ] Calculate individual teacher usage
    - [ ] Implement `incrementUsage()`
    - [ ] Implement `decrementUsage()`
    - [ ] Implement `checkLimit()`
    - [ ] Implement `canAddSubject()`
    - [ ] Implement `canAddStudent()`
    - [ ] Implement `isNearLimit()`
    - [ ] Implement `upgradePlan()` (admin only)
    - [ ] Implement `handlePaymentSuccess()` (admin only)
    - [ ] Implement `cancelSubscription()` (admin only)
    - [ ] Export `useSchoolSubscription()` hook

### Utilities

- [ ] Migration Script
  - [ ] Create `src/utils/migrateToSchoolBased.js`
    - [ ] Implement `migrateTeacherToSchool()`
    - [ ] Implement `migrateTeacherTransactions()`
    - [ ] Implement `getUserData()`
    - [ ] Implement `migrateAllToSchoolBased()`
    - [ ] Implement `verifyMigration()`
    - [ ] Implement `rollbackMigration()`

- [ ] School Initialization
  - [ ] Create `src/utils/schoolInitialization.js`
    - [ ] Implement `initializeNewSchool()`
    - [ ] Implement `joinExistingSchool()`
    - [ ] Implement `generateInvitationCode()`
    - [ ] Implement `validateInvitationCode()`
    - [ ] Implement `getInvitationLink()`
    - [ ] Implement `checkUserSchoolStatus()`
    - [ ] Implement `validateSchoolName()`

### Components (To Be Created)

- [ ] School Management
  - [ ] Create `src/components/School/CreateSchoolModal.jsx`
  - [ ] Create `src/components/School/JoinSchoolModal.jsx`
  - [ ] Create `src/components/School/SchoolSetupWizard.jsx`
  - [ ] Create `src/components/School/SchoolManagement.jsx`
  - [ ] Create `src/components/School/InviteTeachers.jsx`

- [ ] Subscription UI (Update Existing)
  - [ ] Update `src/components/Subscription/SubscriptionDashboard.jsx`
    - [ ] Show school name and plan
    - [ ] Show school-wide usage
    - [ ] Show individual teacher usage
    - [ ] Show admin badge if admin
    - [ ] Hide upgrade button for non-admins
  - [ ] Update `src/components/Subscription/PlanComparison.jsx`
    - [ ] Update messaging for school-based model
    - [ ] Show "Contact admin" for non-admins
  - [ ] Update `src/components/Subscription/LimitWarning.jsx`
    - [ ] Update messages for school-wide limits
    - [ ] Different CTAs for admins vs teachers
  - [ ] Update `src/components/Subscription/PaymentModal.jsx`
    - [ ] Verify only admins can access
    - [ ] Update confirmation messages

### Registration Forms (Update Existing)

- [ ] Subject Registration
  - [ ] Update to use `useSchoolSubscription()`
  - [ ] Check school-wide limits
  - [ ] Show appropriate error messages
  - [ ] Increment school usage on success

- [ ] Student Registration
  - [ ] Update to use `useSchoolSubscription()`
  - [ ] Check school-wide limits
  - [ ] Show appropriate error messages
  - [ ] Increment school usage on success

## Database Setup

### Firestore Indexes

- [ ] Create/update `firestore.indexes.json`
  - [ ] Add teachers by schoolId and role index
  - [ ] Add schools by status and planTier index
  - [ ] Add schools by status and expiryDate index
  - [ ] Add transactions by schoolId and createdAt index
  - [ ] Keep legacy indexes for backward compatibility

- [ ] Deploy indexes
  - [ ] Run `firebase deploy --only firestore:indexes`
  - [ ] Verify indexes are building in Firebase Console
  - [ ] Wait for indexes to complete (check status)

### Security Rules

- [ ] Update Firestore security rules
  - [ ] Add rules for schools collection
  - [ ] Add rules for teachers collection
  - [ ] Update rules for transactions collection
  - [ ] Keep rules for subscriptions collection (read-only)

- [ ] Deploy security rules
  - [ ] Run `firebase deploy --only firestore:rules`
  - [ ] Test rules in Firebase Console
  - [ ] Verify access control works

## Testing

### Unit Tests

- [ ] Test Data Models
  - [ ] Test `createSchoolDocument()`
  - [ ] Test `createTeacherSchoolDocument()`
  - [ ] Test limit calculations

- [ ] Test School Service
  - [ ] Test school creation
  - [ ] Test teacher addition/removal
  - [ ] Test usage increment/decrement
  - [ ] Test plan updates
  - [ ] Mock Firestore operations

- [ ] Test School Subscription Context
  - [ ] Test usage calculations
  - [ ] Test limit checks
  - [ ] Test admin-only actions
  - [ ] Mock Firebase and auth

- [ ] Test Migration Script
  - [ ] Test single teacher migration
  - [ ] Test transaction migration
  - [ ] Test verification logic
  - [ ] Use test data

### Integration Tests

- [ ] Test School Creation Flow
  - [ ] User creates school
  - [ ] User becomes admin
  - [ ] School gets Free plan
  - [ ] Usage starts at 0

- [ ] Test Teacher Joining Flow
  - [ ] Generate invitation code
  - [ ] Teacher joins with code
  - [ ] Teacher gets teacher role
  - [ ] Teacher sees school data

- [ ] Test Multi-Teacher Usage
  - [ ] Teacher A registers subject
  - [ ] Teacher B registers subject
  - [ ] School usage aggregates correctly
  - [ ] Individual usage tracked

- [ ] Test Limit Enforcement
  - [ ] School reaches limit
  - [ ] Any teacher blocked from registering
  - [ ] Admin can upgrade
  - [ ] After upgrade, all can register

- [ ] Test Payment Flow
  - [ ] Admin initiates upgrade
  - [ ] Payment processes
  - [ ] School plan updates
  - [ ] All teachers see new limits

### Manual Testing in Staging

- [ ] Test school creation
  - [ ] Create school with valid name
  - [ ] Verify school document created
  - [ ] Verify user is admin
  - [ ] Verify Free plan assigned

- [ ] Test teacher invitation
  - [ ] Generate invitation link
  - [ ] Join with invitation code
  - [ ] Verify teacher added to school
  - [ ] Verify teacher role assigned

- [ ] Test usage tracking
  - [ ] Register subjects as different teachers
  - [ ] Verify school usage aggregates
  - [ ] Verify individual usage tracked
  - [ ] Delete subject, verify usage decrements

- [ ] Test limit enforcement
  - [ ] Reach school limit
  - [ ] Attempt registration as any teacher
  - [ ] Verify blocked with appropriate message
  - [ ] Verify admin sees upgrade option
  - [ ] Verify teacher sees contact admin message

- [ ] Test admin upgrade
  - [ ] Log in as admin
  - [ ] Initiate plan upgrade
  - [ ] Process test payment
  - [ ] Verify school plan updates
  - [ ] Verify all teachers see new limits

- [ ] Test non-admin restrictions
  - [ ] Log in as regular teacher
  - [ ] Verify cannot access payment
  - [ ] Verify cannot upgrade plan
  - [ ] Verify sees "Contact admin" messages

## Migration

### Pre-Migration

- [ ] Notify all users
  - [ ] Send email 1 week before
  - [ ] Send email 1 day before
  - [ ] Post announcement in app

- [ ] Prepare migration environment
  - [ ] Test migration in staging
  - [ ] Verify migration script works
  - [ ] Prepare rollback plan
  - [ ] Schedule maintenance window

### Migration Execution

- [ ] Run migration
  - [ ] Put app in maintenance mode
  - [ ] Run `migrateAllToSchoolBased()`
  - [ ] Monitor progress
  - [ ] Check for errors

- [ ] Verify migration
  - [ ] Run `verifyMigration()`
  - [ ] Check all teachers have schools
  - [ ] Verify usage counts match
  - [ ] Test sample accounts

- [ ] Deploy frontend updates
  - [ ] Deploy new context
  - [ ] Deploy updated components
  - [ ] Verify app works
  - [ ] Test critical flows

- [ ] Exit maintenance mode
  - [ ] Enable app access
  - [ ] Monitor error rates
  - [ ] Watch for user issues

### Post-Migration

- [ ] Monitor system
  - [ ] Check error logs
  - [ ] Monitor support tickets
  - [ ] Track user feedback
  - [ ] Verify payments work

- [ ] Send confirmation email
  - [ ] Notify users migration complete
  - [ ] Explain new features
  - [ ] Provide help resources

- [ ] Document issues
  - [ ] Log any problems
  - [ ] Document solutions
  - [ ] Update FAQ

## Documentation

- [ ] Update user documentation
  - [ ] Create school setup guide
  - [ ] Create invitation guide
  - [ ] Update subscription guide
  - [ ] Create admin guide

- [ ] Update developer documentation
  - [ ] Update API documentation
  - [ ] Update component documentation
  - [ ] Update architecture diagrams
  - [ ] Update code comments

- [ ] Create support resources
  - [ ] Create FAQ
  - [ ] Create video tutorials
  - [ ] Create troubleshooting guide
  - [ ] Update help center

## Cleanup (After 30 Days)

- [ ] Remove deprecated code
  - [ ] Remove old `SubscriptionContext.jsx`
  - [ ] Remove old `subscriptionService.js`
  - [ ] Update all imports
  - [ ] Remove backward compatibility code

- [ ] Archive old data
  - [ ] Export subscriptions collection
  - [ ] Store backup securely
  - [ ] Optionally delete old collection

- [ ] Remove legacy indexes
  - [ ] Verify not in use
  - [ ] Delete from Firebase Console
  - [ ] Update `firestore.indexes.json`

- [ ] Update documentation
  - [ ] Remove migration references
  - [ ] Update to reflect current state
  - [ ] Archive migration guides

## Success Criteria

- [ ] All teachers migrated successfully
- [ ] No data loss
- [ ] Usage tracking accurate
- [ ] Payments processing correctly
- [ ] No increase in error rates
- [ ] User satisfaction maintained
- [ ] Performance acceptable
- [ ] Support tickets manageable

## Rollback Triggers

Rollback if:
- [ ] More than 5% of migrations fail
- [ ] Critical functionality broken
- [ ] Payment processing fails
- [ ] Error rate increases significantly
- [ ] Major user complaints
- [ ] Data integrity issues

## Notes

- Keep this checklist updated as you progress
- Mark items complete as you finish them
- Document any deviations from plan
- Note any issues encountered
- Track time spent on each phase
