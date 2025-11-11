# Teacher Dashboard - Subject Registration Integration Guide

## Overview
This guide shows how to integrate proper subject registration into the Teacher Dashboard, so that:
1. Teachers register subjects first (counts toward their limit)
2. When creating exams, they select from registered subjects
3. Subjects can be managed separately from exams

## Step 1: Add Imports

Add these imports at the top of `src/pages/Teacher/TeacherDashboard.jsx`:

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

## Step 2: Add State Variables

Add these state variables after the existing state declarations:

```javascript
const [subjects, setSubjects] = useState([]);
const [showSubjectModal, setShowSubjectModal] = useState(false);
const [selectedSubject, setSelectedSubject] = useState(null);
```

## Step 3: Add Subject Subscription

Add this useEffect to load subjects in real-time:

```javascript
useEffect(() => {
  if (!user) return;

  const unsubscribe = subscribeToTeacherSubjects(user.uid, (subjectsData, error) => {
    if (error) {
      console.error('Error loading subjects:', error);
      showAlert('error', 'Failed to load subjects');
      return;
    }
    setSubjects(subjectsData || []);
  });

  return () => unsubscribe();
}, [user]);
```

## Step 4: Add Subject Registration Handler

```javascript
const handleRegisterSubject = async (subjectData) => {
  if (!checkLimit('subject')) {
    setLimitModalType('subject');
    setShowLimitModal(true);
    throw new Error('Subject limit reached');
  }

  try {
    setLoading(true);
    const subjectId = await registerSubject(user.uid, userData?.schoolId, subjectData);
    
    // Increment usage count
    await incrementUsage('subject');
    
    showAlert('success', `Subject "${subjectData.name}" registered successfully!`);
    return subjectId;
  } catch (error) {
    console.error('Error registering subject:', error);
    throw error;
  } finally {
    setLoading(false);
  }
};
```

## Step 5: Add Subject Delete Handler

```javascript
const handleDeleteSubject = async (subjectId, examCount) => {
  if (examCount > 0) {
    showAlert('error', 'Cannot delete subject with existing exams. Delete exams first.');
    return;
  }

  if (window.confirm("Are you sure you want to delete this subject?")) {
    try {
      await deleteSubject(subjectId);
      await decrementUsage('subject');
      showAlert("success", "Subject deleted successfully");
    } catch (error) {
      console.error("Error deleting subject:", error);
      showAlert("error", "Failed to delete subject");
    }
  }
};
```

## Step 6: Update handleCreateExam

Replace the existing `handleCreateExam` function to use selected subject:

```javascript
const handleCreateExam = async () => {
  // Validation
  if (!examForm.title.trim()) {
    showAlert("error", "Please enter exam title");
    return;
  }

  if (!selectedSubject) {
    showAlert("error", "Please select a subject");
    return;
  }

  if (!examForm.timeLimit || examForm.timeLimit <= 0) {
    showAlert("error", "Please enter valid time limit");
    return;
  }

  if (questions.length === 0) {
    showAlert("error", "Please add at least one question");
    return;
  }

  setLoading(true);

  try {
    const examCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const examRef = await addDoc(collection(db, "exams"), {
      title: examForm.title,
      subject: selectedSubject.name,
      subjectId: selectedSubject.id,
      subjectCode: selectedSubject.code,
      timeLimit: parseInt(examForm.timeLimit),
      examDate: examForm.examDate || null,
      description: examForm.description,
      teacherId: user.uid,
      teacherName: userData?.name || "Unknown",
      schoolId: userData?.schoolId || null,
      createdAt: new Date(),
      totalQuestions: questions.length,
      examCode: examCode,
    });

    for (let i = 0; i < questions.length; i++) {
      await addDoc(collection(db, "exams", examRef.id, "questions"), {
        ...questions[i],
        questionNumber: i + 1,
      });
    }

    await incrementSubjectExamCount(selectedSubject.id);

    showAlert("success", `Exam created successfully! Code: ${examCode}`);
    setShowCreateModal(false);
    resetForm();
    fetchTeacherData();
  } catch (error) {
    console.error("Error creating exam:", error);
    showAlert("error", "Failed to create exam");
  } finally {
    setLoading(false);
  }
};
```

## Step 7: Update handleDeleteExam

Update to decrement subject exam count:

```javascript
const handleDeleteExam = async (examId, exam) => {
  if (window.confirm("Are you sure you want to delete this exam?")) {
    try {
      const questionsSnapshot = await getDocs(
        collection(db, "exams", examId, "questions"),
      );
      for (const doc of questionsSnapshot.docs) {
        await deleteDoc(doc.ref);
      }

      await deleteDoc(doc(db, "exams", examId));

      if (exam.subjectId) {
        await decrementSubjectExamCount(exam.subjectId);
      }

      showAlert("success", "Exam deleted successfully");
      fetchTeacherData();
    } catch (error) {
      console.error("Error deleting exam:", error);
      showAlert("error", "Failed to delete exam");
    }
  }
};
```

## Step 8: Update resetForm

```javascript
const resetForm = () => {
  setExamForm({
    title: "",
    subject: "",
    timeLimit: "",
    examDate: "",
    description: "",
  });
  setQuestions([]);
  setCurrentQuestion({
    questionText: "",
    options: ["", "", "", ""],
    correctOption: 0,
  });
  setSelectedSubject(null);
};
```

## Step 9: Add Subject Columns

```javascript
const subjectColumns = [
  { header: "Subject Name", accessor: "name" },
  { header: "Code", accessor: "code" },
  { header: "Description", accessor: "description" },
  { 
    header: "Exams", 
    render: (row) => row.examCount || 0
  },
  {
    header: "Created",
    render: (row) => row.createdAt?.toDate().toLocaleDateString() || "N/A",
  },
];
```

## Step 10: Update Tabs

Change the tabs array to include "subjects":

```javascript
{["overview", "subjects", "exams", "results", "students"].map((tab) => (
  // ... existing tab code
))}
```

## Step 11: Add Subjects Tab Content

Add this after the "overview" tab content:

```javascript
{activeTab === "subjects" && (
  <div className="space-y-6">
    <Card 
      title="Your Registered Subjects" 
      subtitle="Subjects you can create exams for"
      action={
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowSubjectModal(true)}
          disabled={!checkLimit('subject')}
        >
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Register Subject
        </Button>
      }
    >
      <Table
        columns={subjectColumns}
        data={subjects}
        loading={loading}
        emptyMessage="No subjects registered yet. Click 'Register Subject' to get started."
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
  </div>
)}
```

## Step 12: Update Create Exam Modal

Replace the subject input field in the create exam modal with a subject selector:

```javascript
{/* Subject Selection */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Select Subject *
  </label>
  {subjects.length === 0 ? (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <p className="text-sm text-yellow-800">
        You haven't registered any subjects yet. 
        <button
          onClick={() => {
            setShowCreateModal(false);
            setShowSubjectModal(true);
          }}
          className="ml-1 text-yellow-900 font-semibold underline hover:no-underline"
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
          className={`p-4 border-2 rounded-lg text-left transition-all ${
            selectedSubject?.id === subject.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="font-semibold text-gray-900">{subject.name}</div>
          <div className="text-xs text-gray-500 mt-1">{subject.code}</div>
          {subject.examCount > 0 && (
            <div className="text-xs text-blue-600 mt-1">
              {subject.examCount} exam{subject.examCount !== 1 ? 's' : ''}
            </div>
          )}
        </button>
      ))}
    </div>
  )}
</div>
```

## Step 13: Add Subject Registration Modal

Add this before the closing Layout tag:

```javascript
{/* Subject Registration Modal */}
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

## Step 14: Update Action Button Text

Change the "Register New Subject" button to "Create New Exam":

```javascript
<Button
  variant="primary"
  size="lg"
  onClick={() => {
    if (subjects.length === 0) {
      setShowSubjectModal(true);
    } else {
      setShowCreateModal(true);
    }
  }}
>
  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
  {subjects.length === 0 ? 'Register First Subject' : 'Create New Exam'}
</Button>
```

## Summary

After these changes:
- Teachers must register subjects first (each counts toward their limit)
- When creating exams, they select from registered subjects
- Subjects can be managed in a dedicated "Subjects" tab
- Exam count is tracked per subject
- Subjects with exams cannot be deleted
