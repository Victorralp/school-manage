# Subject Registration Implementation Checklist

## ✅ Completed Files

- [x] `src/components/Subject/SubjectRegistrationModal.jsx` - Modal for registering new subjects
- [x] `src/firebase/subjectService.js` - Service functions for subject CRUD operations
- [x] `TEACHER_DASHBOARD_SUBJECT_INTEGRATION.md` - Step-by-step integration guide
- [x] `FIRESTORE_SUBJECTS_RULES.md` - Security rules and indexes for subjects collection

## 📋 Implementation Steps

### 1. Update TeacherDashboard.jsx
Follow the guide in `TEACHER_DASHBOARD_SUBJECT_INTEGRATION.md` to:
- [ ] Add imports (Step 1)
- [ ] Add state variables (Step 2)
- [ ] Add subject subscription (Step 3)
- [ ] Add subject registration handler (Step 4)
- [ ] Add subject delete handler (Step 5)
- [ ] Update handleCreateExam (Step 6)
- [ ] Update handleDeleteExam (Step 7)
- [ ] Update resetForm (Step 8)
- [ ] Add subject columns (Step 9)
- [ ] Update tabs array (Step 10)
- [ ] Add subjects tab content (Step 11)
- [ ] Update create exam modal (Step 12)
- [ ] Add subject registration modal (Step 13)
- [ ] Update action button (Step 14)

### 2. Update Firestore Configuration
- [ ] Update `firestore.rules` with subject collection rules
- [ ] Update `firestore.indexes.json` with composite indexes
- [ ] Deploy rules: `firebase deploy --only firestore:rules`
- [ ] Deploy indexes: `firebase deploy --only firestore:indexes`

### 3. Update Exams Collection (Optional Migration)
If you have existing exams without subjectId:
- [ ] Create a migration script to add subjectId to existing exams
- [ ] Or handle null subjectId gracefully in the UI

### 4. Testing Checklist
- [ ] Register a new subject (should increment usage count)
- [ ] Try to register subject when at limit (should show error)
- [ ] Create exam using registered subject
- [ ] Verify exam shows correct subject info
- [ ] Delete exam (should decrement subject exam count)
- [ ] Try to delete subject with exams (should be blocked)
- [ ] Delete subject without exams (should decrement usage count)
- [ ] Verify subjects tab shows all registered subjects
- [ ] Verify subject selector in create exam modal works
- [ ] Test with multiple teachers in same school (each has their own subjects)

## 🎯 Key Features

### Subject Registration
- Teachers register subjects first (counts toward their per-teacher limit)
- Each subject has a name, code, and optional description
- Subjects are tracked per teacher, not school-wide

### Exam Creation
- Teachers select from their registered subjects when creating exams
- Exams are linked to subjects via subjectId
- Subject exam count is automatically tracked

### Subject Management
- Dedicated "Subjects" tab in teacher dashboard
- View all registered subjects with exam counts
- Delete subjects (only if no exams exist)
- Create exams directly from subject list

### Limit Enforcement
- Subject registration checks per-teacher limits
- Each subject counts as 1 toward the limit
- Multiple exams can be created per subject without additional limit usage

## 📊 Data Flow

```
1. Teacher registers subject
   ↓
2. Subject document created in Firestore
   ↓
3. Usage count incremented (per teacher)
   ↓
4. Teacher creates exam for that subject
   ↓
5. Exam linked to subject via subjectId
   ↓
6. Subject exam count incremented
   ↓
7. Teacher can create more exams for same subject (no additional limit usage)
```

## 🔄 Migration Notes

### For Existing Exams
Existing exams have a `subject` field (string) but no `subjectId`. Options:

**Option 1: Graceful Handling**
- Display subject name from `subject` field if `subjectId` is null
- New exams will have both fields

**Option 2: Migration Script**
- Create subjects from unique exam subjects
- Link exams to newly created subjects
- Update usage counts

### For Existing Teachers
- Teachers with existing exams will need to register subjects
- Their usage count should reflect registered subjects, not exams
- Consider a one-time migration to create subjects from existing exams

## 🚀 Deployment Order

1. Deploy new components and services (no breaking changes)
2. Update TeacherDashboard.jsx
3. Deploy Firestore rules and indexes
4. Test in development
5. Run migration script if needed
6. Deploy to production

## 📝 Notes

- Subjects are per-teacher, not shared across school
- Each teacher on Free plan can register 3 subjects
- Each subject can have unlimited exams
- Deleting a subject requires deleting all its exams first
- Subject codes must be unique per teacher
