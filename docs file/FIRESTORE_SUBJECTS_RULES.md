# Firestore Security Rules for Subjects Collection

Add these rules to your `firestore.rules` file:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ... existing rules ...
    
    // Subjects collection rules
    match /subjects/{subjectId} {
      // Allow teachers to read their own subjects
      allow read: if request.auth != null && 
                     resource.data.teacherId == request.auth.uid;
      
      // Allow teachers to create subjects for themselves
      allow create: if request.auth != null && 
                       request.resource.data.teacherId == request.auth.uid &&
                       request.resource.data.schoolId is string &&
                       request.resource.data.name is string &&
                       request.resource.data.code is string &&
                       request.resource.data.status == 'active';
      
      // Allow teachers to update their own subjects
      allow update: if request.auth != null && 
                       resource.data.teacherId == request.auth.uid;
      
      // Allow teachers to delete (soft delete) their own subjects
      allow delete: if request.auth != null && 
                       resource.data.teacherId == request.auth.uid;
      
      // Allow school admins to read all subjects in their school
      allow read: if request.auth != null && 
                     exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'school' &&
                     resource.data.schoolId == request.auth.uid;
    }
  }
}
```

## Firestore Indexes

Add these composite indexes to `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "subjects",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "teacherId",
          "order": "ASCENDING"
        },
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
      "collectionGroup": "subjects",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "schoolId",
          "order": "ASCENDING"
        },
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
      "collectionGroup": "subjects",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "teacherId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "code",
          "order": "ASCENDING"
        }
      ]
    }
  ]
}
```

## Deploy Commands

After updating the rules and indexes:

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

## Subject Document Structure

```javascript
{
  name: "Mathematics",           // Subject name
  code: "MATH101",               // Subject code (uppercase)
  description: "Basic algebra",  // Optional description
  teacherId: "teacher_uid",      // Teacher who registered it
  schoolId: "school_id",         // School ID
  examCount: 2,                  // Number of exams for this subject
  status: "active",              // "active" or "inactive"
  createdAt: Timestamp,          // When created
  updatedAt: Timestamp,          // Last updated
  deletedAt: Timestamp           // When soft deleted (if applicable)
}
```
