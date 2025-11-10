# Firestore Index Setup Guide - School-Based Subscription System

## Issue
The school-based subscription system requires composite indexes in Firestore for efficient queries. You may see errors like:

```
FirebaseError: The query requires an index. You can create it here: https://console.firebase.google.com/...
```

## Solution

The required indexes are defined in `firestore.indexes.json`. You need to deploy them to Firebase.

### Option 1: Deploy via Firebase CLI (Recommended)

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Set Active Project** (if not already set):
   ```bash
   firebase use school-e49b2
   ```

4. **Deploy Firestore Indexes**:
   ```bash
   firebase deploy --only firestore:indexes
   ```

5. **Wait for deployment** (usually takes 1-2 minutes)

### Option 2: Create Manually via Firebase Console

If you see an error message with a link, you can:

1. Click the link in the error message
2. It will open Firebase Console with pre-filled index configuration
3. Click "Create Index"
4. Wait for the index to build (usually 1-2 minutes)

## Required Indexes

The following indexes are defined in `firestore.indexes.json`:

### School-Based Collections (New)

#### Teachers Collection

1. **Teachers by School and Role**
   - Collection: `teachers`
   - Fields:
     - `schoolId` (Ascending)
     - `role` (Ascending)
   - Used by: School management, teacher listing, admin checks

#### Schools Collection

2. **Schools by Status and Plan**
   - Collection: `schools`
   - Fields:
     - `status` (Ascending)
     - `planTier` (Ascending)
   - Used by: Admin analytics, subscription metrics

3. **Schools by Expiry Date**
   - Collection: `schools`
   - Fields:
     - `status` (Ascending)
     - `expiryDate` (Ascending)
   - Used by: Grace period checks, renewal reminders

#### Transactions Collection (Updated)

4. **School Transactions Query**
   - Collection: `transactions`
   - Fields:
     - `schoolId` (Ascending)
     - `createdAt` (Descending)
   - Used by: School payment history, admin transaction viewing

5. **Status-based Transactions**
   - Collection: `transactions`
   - Fields:
     - `status` (Ascending)
     - `createdAt` (Descending)
   - Used by: Admin analytics, payment monitoring

6. **Plan Tier Transactions**
   - Collection: `transactions`
   - Fields:
     - `planTier` (Ascending)
     - `createdAt` (Descending)
   - Used by: Revenue analytics by plan

### Legacy Collections (For Backward Compatibility)

#### Subscriptions Collection (Old)

7. **Teacher Subscription Lookup**
   - Collection: `subscriptions`
   - Fields:
     - `teacherId` (Ascending)
     - `status` (Ascending)
   - Used by: Migration verification, legacy support

8. **Legacy Transactions**
   - Collection: `transactions`
   - Fields:
     - `teacherId` (Ascending)
     - `createdAt` (Descending)
   - Used by: Migration, legacy transaction queries

## Complete firestore.indexes.json

```json
{
  "indexes": [
    {
      "collectionGroup": "teachers",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "schoolId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "role",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "schools",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "planTier",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "schools",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "expiryDate",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "schoolId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "planTier",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "subscriptions",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "teacherId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "teacherId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

## Verification

After deploying indexes, verify they're active:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Firestore Database → Indexes
4. Check that all indexes show status "Enabled"

## Troubleshooting

### Index Build Failed
- Check that field names match exactly (case-sensitive)
- Ensure you have sufficient permissions
- Try deleting and recreating the index

### Index Still Not Working
- Clear browser cache
- Wait a few more minutes (complex indexes can take up to 5 minutes)
- Check Firebase Console for index status

### Duplicate Index Error
If you see "Index already exists" errors:
- This is normal if indexes were created automatically
- The deployment will skip existing indexes
- Verify all required indexes exist in Firebase Console

### Local Development (Emulator)
If using Firebase Emulator:
```bash
firebase emulators:start
```
The emulator automatically creates indexes as needed, so you won't see these errors locally.

## Migration Notes

When migrating from teacher-based to school-based subscriptions:

1. **Deploy new indexes first** before running migration
2. **Keep legacy indexes** for backward compatibility during transition
3. **Monitor index usage** in Firebase Console after migration
4. **Remove legacy indexes** after 30 days if no longer needed

## Additional Resources

- [Firebase Composite Indexes Documentation](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Migration Guide](./MIGRATION_GUIDE.md)
