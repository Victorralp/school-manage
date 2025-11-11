# Quick Start Guide - Subject Registration System

## 🚀 Get Started in 5 Minutes

### Step 1: Copy the New Files (Already Done ✅)
The following files have been created:
- `src/components/Subject/SubjectRegistrationModal.jsx`
- `src/firebase/subjectService.js`

### Step 2: Update TeacherDashboard.jsx

Open `src/pages/Teacher/TeacherDashboard.jsx` and make these changes:

#### A. Add Imports (at the top)
```javascript
import SubjectRegistrationModal from "../../components/Subject/SubjectRegistrationModal";
import { 
  registerSubject, 
  subscribeToTeacherSubjects,
  deleteSubject,
  incrementSubjectExamCount,
  decrementSubjectExamCount
} from "../../firebase/subjectService";
```

#### B. Add State Variables (after existing useState declarations)
```javascript
const [subjects, setSubjects] = useState([]);
const [showSubjectModal, setShowSubjectModal] = useState(false);
const [selectedSubject, setSelectedSubject] = useState(null);
```

#### C. Add Subject Subscription (after existing useEffect)
```javascript
useEffect(() => {
  if (!user) return;
  const unsubscribe = subscribeToTeacherSubjects(user.uid, (subjectsData, error) => {
    if (error) {
      console.error('Error loading subjects:', error);
      return;
    }
    setSubjects(subjectsData || []);
  });
  return () => unsubscribe();
}, [user]);
```

#### D. Add Handler Functions (after existing handlers)
```javascript
const handleRegisterSubject = async (subjectData) => {
  if (!checkLimit('subject')) {
    setLimitModalType('subject');
    setShowLimitModal(true);
    throw new Error('Subject limit reached');
  }
  try {
    setLoading(true);
    await registerSubject(user.uid, userData?.schoolId, subjectData);
    await incrementUsage('subject');
    showAlert('success', `Subject "${subjectData.name}" registered!`);
  } catch (error) {
    throw error;
  } finally {
    setLoading(false);
  }
};

const handleDeleteSubject = async (subjectId, examCount) => {
  if (examCount > 0) {
    showAlert('error', 'Cannot delete subject with existing exams.');
    return;
  }
  if (window.confirm("Delete this subject?")) {
    try {
      await deleteSubject(subjectId);
      await decrementUsage('subject');
      showAlert("success", "Subject deleted");
    } catch (error) {
      showAlert("error", "Failed to delete subject");
    }
  }
};
```

#### E. Update handleCreateExam (replace the validation section)
```javascript
// Replace the subject validation with:
if (!selectedSubject) {
  showAlert("error", "Please select a subject");
  return;
}

// In the exam document creation, add:
subject: selectedSubject.name,
subjectId: selectedSubject.id,
subjectCode: selectedSubject.code,

// After creating exam, add:
await incrementSubjectExamCount(selectedSubject.id);
```

#### F. Update handleDeleteExam (add subject exam count decrement)
```javascript
// After deleting exam, add:
if (exam.subjectId) {
  await decrementSubjectExamCount(exam.subjectId);
}
```

#### G. Update resetForm (add at the end)
```javascript
setSelectedSubject(null);
```

#### H. Update Tabs Array
```javascript
// Change from:
{["overview", "exams", "results", "students"].map((tab) => (

// To:
{["overview", "subjects", "exams", "results", "students"].map((tab) => (
```

#### I. Add Subjects Tab (after overview tab content)
```javascript
{activeTab === "subjects" && (
  <Card 
    title="Your Registered Subjects"
    action={
      <Button
        variant="primary"
        size="sm"
        onClick={() => setShowSubjectModal(true)}
        disabled={!checkLimit('subject')}
      >
        Register Subject
      </Button>
    }
  >
    <Table
      columns={[
        { header: "Name", accessor: "name" },
        { header: "Code", accessor: "code" },
        { header: "Exams", render: (row) => row.examCount || 0 },
      ]}
      data={subjects}
      loading={loading}
      emptyMessage="No subjects yet. Click 'Register Subject' to start."
      actions={(row) => (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedSubject(row);
              setShowCreateModal(true);
            }}
          >
            Create Exam
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDeleteSubject(row.id, row.examCount)}
            disabled={row.examCount > 0}
          >
            Delete
          </Button>
        </>
      )}
    />
  </Card>
)}
```

#### J. Update Create Exam Modal (replace subject input)
```javascript
{/* Replace the subject Input field with: */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Select Subject *
  </label>
  {subjects.length === 0 ? (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <p className="text-sm text-yellow-800">
        No subjects registered. 
        <button
          onClick={() => {
            setShowCreateModal(false);
            setShowSubjectModal(true);
          }}
          className="ml-1 font-semibold underline"
        >
          Register a subject first
        </button>
      </p>
    </div>
  ) : (
    <div className="grid grid-cols-2 gap-3">
      {subjects.map((subject) => (
        <button
          key={subject.id}
          onClick={() => setSelectedSubject(subject)}
          className={`p-4 border-2 rounded-lg text-left ${
            selectedSubject?.id === subject.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="font-semibold">{subject.name}</div>
          <div className="text-xs text-gray-500">{subject.code}</div>
        </button>
      ))}
    </div>
  )}
</div>
```

#### K. Add Subject Registration Modal (before closing Layout tag)
```javascript
<SubjectRegistrationModal
  isOpen={showSubjectModal}
  onClose={() => setShowSubjectModal(false)}
  onRegister={handleRegisterSubject}
  loading={loading}
  canRegister={checkLimit('subject')}
  currentUsage={subjectUsage?.current || 0}
  limit={subjectUsage?.limit || 0}
/>
```

### Step 3: Update Firestore Rules

Add to your `firestore.rules`:

```javascript
match /subjects/{subjectId} {
  allow read: if request.auth != null && 
                 resource.data.teacherId == request.auth.uid;
  allow create: if request.auth != null && 
                   request.resource.data.teacherId == request.auth.uid;
  allow update, delete: if request.auth != null && 
                           resource.data.teacherId == request.auth.uid;
}
```

Deploy: `firebase deploy --only firestore:rules`

### Step 4: Test It!

1. **Register a subject**
   - Go to "Subjects" tab
   - Click "Register Subject"
   - Enter name and code
   - Submit

2. **Create an exam**
   - Go to "Exams" tab or click "Create Exam" from subject
   - Select your registered subject
   - Add questions
   - Create exam

3. **Verify limits**
   - Register 3 subjects (Free plan limit)
   - Try to register a 4th (should be blocked)
   - Create multiple exams for one subject (should work)

## 📊 What Changed?

### Before
```
Create Exam → Type subject name → Counts toward limit
```

### After
```
Register Subject → Counts toward limit (once)
Create Exam → Select subject → Doesn't count toward limit
```

## 🎯 Key Points

- ✅ Each subject counts as 1 toward your limit
- ✅ Create unlimited exams per subject
- ✅ Subjects must be registered before creating exams
- ✅ Cannot delete subjects with exams
- ✅ Each teacher has their own subject allocation

## 🆘 Troubleshooting

**"No subjects showing"**
- Check browser console for errors
- Verify Firestore rules are deployed
- Check that teacherId matches user.uid

**"Cannot register subject"**
- Check if limit is reached (3 for Free plan)
- Verify subscription context is loaded
- Check Firestore permissions

**"Subject selector not showing in exam modal"**
- Verify subjects state is populated
- Check that subscribeToTeacherSubjects is called
- Look for errors in console

## 📚 Full Documentation

For complete details, see:
- `TEACHER_DASHBOARD_SUBJECT_INTEGRATION.md` - Full integration guide
- `SUBJECT_REGISTRATION_SUMMARY.md` - System overview
- `SUBJECT_SYSTEM_DIAGRAM.md` - Visual diagrams

## ✨ You're Done!

Your subject registration system is now ready. Teachers can register subjects (which count toward their limit) and create unlimited exams for each subject.
