// Add these imports at the top of TeacherDashboard.jsx
import SubjectRegistrationModal from "../../components/Subject/SubjectRegistrationModal";
import { 
  registerSubject, 
  subscribeToTeacherSubjects,
  deleteSubject,
  incrementSubjectExamCount,
  decrementSubjectExamCount
} from "../../firebase/subjectService";

// Add these state variables in the component
const [subjects, setSubjects] = useState([]);
const [showSubjectModal, setShowSubjectModal] = useState(false);
const [selectedSubject, setSelectedSubject] = useState(null);

// Add this useEffect to subscribe to subjects
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

// Add this function to handle subject registration
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

// Update handleDeleteExam to also decrement subject exam count
const handleDeleteExam = async (examId, subjectId) => {
  if (window.confirm("Are you sure you want to delete this exam?")) {
    try {
      // Delete questions subcollection
      const questionsSnapshot = await getDocs(
        collection(db, "exams", examId, "questions"),
      );
      for (const doc of questionsSnapshot.docs) {
        await deleteDoc(doc.ref);
      }

      // Delete exam document
      await deleteDoc(doc(db, "exams", examId));

      // Decrement subject exam count
      if (subjectId) {
        await decrementSubjectExamCount(subjectId);
      }

      showAlert("success", "Exam deleted successfully");
      fetchTeacherData();
    } catch (error) {
      console.error("Error deleting exam:", error);
      showAlert("error", "Failed to delete exam");
    }
  }
};

// Update handleCreateExam to use selected subject
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
    // Generate unique exam code (6 characters)
    const examCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Create exam document
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

    // Create questions subcollection
    for (let i = 0; i < questions.length; i++) {
      await addDoc(collection(db, "exams", examRef.id, "questions"), {
        ...questions[i],
        questionNumber: i + 1,
      });
    }

    // Increment subject exam count
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

// Update resetForm to clear selected subject
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

// Add subject columns for subjects tab
const subjectColumns = [
  { header: "Subject Name", accessor: "name" },
  { header: "Code", accessor: "code" },
  { 
    header: "Exams", 
    render: (row) => row.examCount || 0
  },
  {
    header: "Created",
    render: (row) => row.createdAt?.toDate().toLocaleDateString() || "N/A",
  },
];

// Update the examColumns to show subject info
const examColumns = [
  { header: "Title", accessor: "title" },
  { 
    header: "Subject", 
    render: (row) => (
      <div>
        <div className="font-medium">{row.subject}</div>
        {row.subjectCode && (
          <div className="text-xs text-gray-500">{row.subjectCode}</div>
        )}
      </div>
    )
  },
  // ... rest of columns
];
