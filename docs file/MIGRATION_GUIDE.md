# Migration Guide: Teacher-Based to School-Based Subscriptions

## Overview

This guide walks you through migrating from the teacher-based subscription model to the school-based subscription model. In the new model, schools hold subscriptions and teachers belong to schools.

## Pre-Migration Checklist

- [ ] Backup Firestore database
- [ ] Test migration script in staging environment
- [ ] Notify all users about the upcoming change
- [ ] Prepare rollback plan
- [ ] Schedule maintenance window
- [ ] Review security rules
- [ ] Update Firestore indexes

## Migration Steps

### Step 1: Backup Current Data

```bash
# Export Firestore data
gcloud firestore export gs://[BUCKET_NAME]/[EXPORT_FOLDER]

# Or use Firebase CLI
firebase firestore:export backup-$(date +%Y%m%d)
```

### Step 2: Deploy New Code

1. **Deploy new data models and services:**
   - `src/firebase/subscriptionModels.js` (updated)
   - `src/firebase/schoolService.js` (new)
   - `src/context/SchoolSubscriptionContext.jsx` (new)

2. **Keep backward compatibility:**
   - Keep `src/firebase/subscriptionService.js` for now
   - Keep `src/context/SubscriptionContext.jsx` for now

3. **Deploy migration utilities:**
   - `src/utils/migrateToSchoolBased.js`
   - `src/utils/schoolInitialization.js`

### Step 3: Update Firestore Security Rules

Deploy the new security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Schools collection
    match /schools/{schoolId} {
      // All teachers in school can read
      allow read: if request.auth != null && 
                     exists(/databases/$(database)/documents/teachers/$(request.auth.uid)) &&
                     get(/databases/$(database)/documents/teachers/$(request.auth.uid)).data.schoolId == schoolId;
      
      // Only backend can write
      allow write: if false;
    }
    
    // Teachers collection
    match /teachers/{teacherId} {
      // Teachers can read their own document
      allow read: if request.auth != null && request.auth.uid == teacherId;
      
      // Only backend can write
      allow write: if false;
    }
    
    // Transactions collection (updated)
    match /transactions/{transactionId} {
      // School members can read school's transactions
      allow read: if request.auth != null && 
                     exists(/databases/$(database)/documents/teachers/$(request.auth.uid)) &&
                     resource.data.schoolId == get(/databases/$(database)/documents/teachers/$(request.auth.uid)).data.schoolId;
      
      // Only backend can write
      allow write: if false;
    }
    
    // Keep old subscriptions collection for backward compatibility (read-only)
    match /subscriptions/{teacherId} {
      allow read: if request.auth != null && request.auth.uid == teacherId;
      allow write: if false;
    }
  }
}
```

### Step 4: Create Firestore Indexes

Create the following composite indexes:

```bash
# Index for teachers by schoolId
firebase firestore:indexes:create \
  --collection-group=teachers \
  --field=schoolId \
  --field=role

# Index for transactions by schoolId
firebase firestore:indexes:create \
  --collection-group=transactions \
  --field=schoolId \
  --field=createdAt

# Index for schools by status
firebase firestore:indexes:create \
  --collection-group=schools \
  --field=status \
  --field=planTier
```

Or add to `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "teachers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "schoolId", "order": "ASCENDING" },
        { "fieldPath": "role", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "schoolId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "schools",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "planTier", "order": "ASCENDING" }
      ]
    }
  ]
}
```

### Step 5: Run Migration Script

**In your application console or admin panel:**

```javascript
import { migrateAllToSchoolBased, verifyMigration } from './src/utils/migrateToSchoolBased';

// Run migration
const results = await migrateAllToSchoolBased();
console.log('Migration results:', results);

// Verify migration
const verification = await verifyMigration();
console.log('Verification results:', verification);
```

**Or create a migration endpoint (recommended):**

```javascript
// In your backend/Cloud Functions
import { migrateAllToSchoolBased } from './utils/migrateToSchoolBased';

export const runMigration = functions.https.onCall(async (data, context) => {
  // Verify admin access
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  try {
    const results = await migrateAllToSchoolBased();
    return results;
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

### Step 6: Verify Migration

Check the migration results:

```javascript
// Expected output:
{
  total: 150,              // Total teachers migrated
  successful: 150,         // Successfully migrated
  failed: 0,               // Failed migrations
  transactionsMigrated: 45, // Transactions updated
  errors: []               // Any errors
}
```

Run verification:

```javascript
const verification = await verifyMigration();

// Expected output:
{
  teachersChecked: 150,
  schoolsFound: 150,
  teacherDocsFound: 150,
  missingSchools: [],
  missingTeacherDocs: [],
  usageMismatches: []
}
```

### Step 7: Update Frontend Components

1. **Update App.jsx to use new context:**

```javascript
import { SchoolSubscriptionProvider } from './context/SchoolSubscriptionContext';

function App() {
  return (
    <AuthProvider>
      <SchoolSubscriptionProvider>
        {/* Your app components */}
      </SchoolSubscriptionProvider>
    </AuthProvider>
  );
}
```

2. **Update components to use new hook:**

```javascript
// Old
import { useSubscription } from './context/SubscriptionContext';

// New
import { useSchoolSubscription } from './context/SchoolSubscriptionContext';

function MyComponent() {
  const { 
    school, 
    isAdmin, 
    subjectUsage, 
    canAddSubject 
  } = useSchoolSubscription();
  
  // Use school-based data
}
```

3. **Update registration forms:**

```javascript
// Before registering a subject
if (!canAddSubject()) {
  if (isAdmin) {
    showUpgradeModal();
  } else {
    showContactAdminModal();
  }
  return;
}

// Register subject
await registerSubject(subjectData);
await incrementUsage('subject');
```

### Step 8: Deploy Updated Frontend

1. Build the application
2. Deploy to production
3. Monitor for errors
4. Check user feedback

### Step 9: Post-Migration Cleanup (After 30 Days)

Once you're confident the migration is successful:

1. **Archive old subscriptions collection:**
   - Export to backup
   - Optionally delete (keep backup!)

2. **Remove deprecated code:**
   - Remove old `SubscriptionContext.jsx`
   - Remove old `subscriptionService.js`
   - Update imports throughout codebase

3. **Update documentation:**
   - Update API documentation
   - Update user guides
   - Update developer documentation

## Rollback Plan

If something goes wrong, you can rollback:

```javascript
import { rollbackMigration } from './src/utils/migrateToSchoolBased';

// WARNING: This deletes all schools and teacher documents!
const rollbackResults = await rollbackMigration();
console.log('Rollback results:', rollbackResults);
```

Then:
1. Restore from backup if needed
2. Redeploy previous version of code
3. Investigate issues
4. Fix and retry migration

## Testing in Staging

Before running in production, test in staging:

1. **Create test data:**
   - Create 10-20 test teachers with subscriptions
   - Create various plan tiers (free, premium, vip)
   - Create transactions for paid plans

2. **Run migration:**
   - Execute migration script
   - Verify all data migrated correctly
   - Test frontend with new context

3. **Test scenarios:**
   - Teacher registration (should work)
   - Subject/student registration (should enforce school limits)
   - Admin upgrade (should work)
   - Regular teacher upgrade attempt (should be blocked)
   - Multi-teacher usage aggregation

4. **Performance testing:**
   - Test with 100+ teachers
   - Verify query performance
   - Check real-time updates

## Common Issues and Solutions

### Issue: Migration fails for some teachers

**Solution:**
- Check error logs in migration results
- Manually migrate failed teachers
- Verify user data exists

### Issue: Usage counts don't match

**Solution:**
- Run verification script
- Manually correct mismatches
- Check for concurrent updates during migration

### Issue: Teachers can't see school data

**Solution:**
- Verify security rules are deployed
- Check teacher-school relationship exists
- Verify Firestore indexes are built

### Issue: Payment fails after migration

**Solution:**
- Verify transaction documents have schoolId
- Check payment verification logic uses schoolId
- Update Paystack webhook handler

## User Communication

### Email Template: Pre-Migration

**Subject:** Important Update: School-Based Subscriptions Coming Soon

Dear [Teacher Name],

We're excited to announce an important update to our subscription system! Starting [DATE], we're introducing school-based subscriptions.

**What's changing:**
- Schools will hold subscriptions instead of individual teachers
- You'll be automatically set up as the admin of your own school
- You can invite other teachers to join your school
- All teachers in a school share the subscription limits

**What you need to do:**
- Nothing! We'll handle the migration automatically
- After migration, you can invite other teachers to join your school
- You'll retain all your current data and subscription level

**When:**
- Migration scheduled for [DATE] at [TIME]
- Expected downtime: 30 minutes

If you have any questions, please contact support.

Best regards,
The Team

### Email Template: Post-Migration

**Subject:** Migration Complete: Welcome to School-Based Subscriptions

Dear [Teacher Name],

The migration to school-based subscriptions is complete! Your account has been successfully migrated.

**Your school:**
- School name: [School Name]
- Your role: School Admin
- Current plan: [Plan Tier]
- Subscription limits: [Limits]

**Next steps:**
1. Log in to your account
2. Review your school settings
3. Invite other teachers to join your school (optional)
4. Continue using the system as normal

**Need help?**
- Visit our help center: [LINK]
- Contact support: [EMAIL]

Thank you for your patience during this transition!

Best regards,
The Team

## Support Resources

- **Documentation:** [Link to updated docs]
- **Video Tutorial:** [Link to migration video]
- **FAQ:** [Link to FAQ]
- **Support Email:** support@example.com
- **Support Hours:** Monday-Friday, 9am-5pm

## Monitoring and Metrics

After migration, monitor:

1. **Error rates:** Check for increased errors
2. **User complaints:** Monitor support tickets
3. **Usage patterns:** Verify usage tracking works
4. **Payment success rate:** Ensure payments process correctly
5. **Performance:** Check query performance and load times

## Success Criteria

Migration is successful when:

- [ ] All teachers have corresponding schools
- [ ] All teachers have teacher-school relationships
- [ ] Usage counts are accurate
- [ ] Payments work correctly
- [ ] No increase in error rates
- [ ] Users can register subjects/students
- [ ] Admins can upgrade plans
- [ ] Real-time updates work
- [ ] No critical support tickets
- [ ] Performance is acceptable
