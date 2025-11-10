# Subscription Migration Tools

This directory contains tools for migrating existing teachers to the new subscription system.

## Overview

The migration system creates Free plan subscriptions for all existing teachers in the system, counting their current subjects (exams) and students to populate accurate usage data.

## Files

### `migrationScript.js`
Core migration logic with two main functions:
- `migrateExistingTeachers()` - Creates subscriptions for all teachers
- `validateMigration()` - Validates that all teachers have correct subscriptions

### `migrationTestHelper.js`
Test utilities for setting up sample data:
- `setupTestEnvironment()` - Creates test teachers, exams, and students
- `cleanupTestData()` - Removes all test data
- `verifyTestMigration()` - Verifies test migration results

### `__tests__/migrationScript.test.js`
Unit tests for the migration script covering:
- Subscription creation
- Usage count calculation
- Error handling
- Validation logic

## Usage

### Option 1: Admin UI (Recommended)

1. Navigate to `/admin/migration-tool` in your browser
2. Click "Run Migration" to migrate all teachers
3. Click "Validate Migration" to verify results
4. Review the results dashboard

### Option 2: Testing UI

1. Navigate to `/admin/migration-test` in your browser
2. Click "Run Full Test" to test with sample data
3. Review test results and logs
4. Test data is automatically cleaned up

### Option 3: Programmatic

```javascript
import { migrateExistingTeachers, validateMigration } from './utils/migrationScript';

// Run migration
const results = await migrateExistingTeachers();
console.log(`Created: ${results.created}, Failed: ${results.failed}`);

// Validate results
const validation = await validateMigration();
console.log(`Teachers without subscriptions: ${validation.teachersWithoutSubscriptions.length}`);
```

## Migration Process

The migration script performs the following steps for each teacher:

1. **Find all teachers** - Queries Firestore for users with role="teacher"
2. **Count subjects** - Counts exams created by each teacher
3. **Count students** - Counts active students in each teacher's school
4. **Create subscription** - Creates a Free plan subscription document with:
   - `planTier: 'free'`
   - `subjectLimit: 3`
   - `studentLimit: 10`
   - `currentSubjects: <actual count>`
   - `currentStudents: <actual count>`
   - `status: 'active'`
5. **Skip existing** - Skips teachers who already have subscriptions
6. **Handle errors** - Logs errors but continues processing other teachers

## Validation

The validation function checks:

1. **All teachers have subscriptions** - Ensures no teacher is missing a subscription
2. **Usage counts are accurate** - Verifies currentSubjects and currentStudents match actual data
3. **Reports discrepancies** - Lists any teachers with incorrect data

## Testing

Run the unit tests:

```bash
npm test -- src/utils/__tests__/migrationScript.test.js
```

The tests cover:
- Creating subscriptions for multiple teachers
- Skipping teachers with existing subscriptions
- Handling teachers with no subjects or students
- Setting correct Free plan limits
- Error handling and recovery
- Usage count accuracy
- Validation logic

## Important Notes

### Data Retention
- Migration **never deletes** existing data
- Teachers who exceed Free plan limits will have their data retained
- They will be blocked from creating new subjects/students until they upgrade or remove data

### Idempotency
- Running migration multiple times is safe
- Existing subscriptions are skipped, not overwritten
- No duplicate subscriptions will be created

### Performance
- Migration processes teachers sequentially
- Large databases may take several minutes
- Progress is logged to console in real-time

### Error Handling
- Individual teacher failures don't stop the migration
- All errors are collected and reported at the end
- Failed teachers can be re-processed by running migration again

## Troubleshooting

### Teachers without subscriptions after migration
- Check the error log for specific failures
- Verify Firestore permissions allow writes to subscriptions collection
- Re-run migration to retry failed teachers

### Incorrect usage counts
- Verify exams collection has correct teacherId fields
- Verify students have correct schoolId fields
- Check that status="active" filter is working correctly

### Migration takes too long
- Consider running during off-peak hours
- Check Firestore indexes are properly configured
- Monitor Firestore quota usage

## Security

### Firestore Rules
Ensure these security rules are in place:

```javascript
match /subscriptions/{teacherId} {
  allow read: if request.auth != null && request.auth.uid == teacherId;
  allow write: if false;  // Only backend/migration can write
}
```

### Admin Access
- Migration tools should only be accessible to administrators
- Add authentication checks to migration UI pages
- Consider adding audit logging for migration runs

## Next Steps

After successful migration:

1. Verify all teachers can see their subscription status
2. Test limit enforcement on subject/student creation
3. Monitor for any edge cases or issues
4. Consider setting up automated validation checks
5. Document the migration in your deployment notes
