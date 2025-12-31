import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import { useSchoolSubscription } from "../../context/SchoolSubscriptionContext";
import Layout from "../../components/Layout";
import Card from "../../components/Card";
import Table from "../../components/Table";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Modal from "../../components/Modal";
import Alert from "../../components/Alert";
import LimitWarning from "../../components/Subscription/LimitWarning";
import SchoolSubscriptionWidget from "../../components/Subscription/SchoolSubscriptionWidget";
import { exportResultsToPDF, exportResultsToExcel } from "../../utils/exportResults";
import SubjectRegistrationModal from "../../components/Subject/SubjectRegistrationModal";
import StudentRegistrationModal from "../../components/Student/StudentRegistrationModal";
import {
  registerSubject,
  subscribeToTeacherSubjects,
  deleteSubject,
  incrementSubjectExamCount,
  decrementSubjectExamCount
} from "../../firebase/subjectService";
import { registerStudent, deactivateStudent } from "../../firebase/studentService";

const EmployerDashboard = () => {
  const { user, userData } = useAuth();
  const {
    checkLimit,
    incrementUsage,
    decrementUsage,
    subjectUsage,
    studentUsage,
    isNearLimit,
    school,
    isAdmin,
    teacherUsage,
    questionLimit
  } = useSchoolSubscription();
  const [interviews, setInterviews] = useState([]);
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [alert, setAlert] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showMathTools, setShowMathTools] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitModalType, setLimitModalType] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [registeredStudentId, setRegisteredStudentId] = useState(null);

  // Form states
  const [interviewForm, setinterviewForm] = useState({
    title: "",
    subject: "",
    timeLimit: "",
    interviewDate: "",
    description: "",
  });
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    questionText: "",
    type: "objective",
    options: ["", "", "", ""],
    correctOption: 0,
  });

  useEffect(() => {
    if (user) {
      fetchTeacherData();
    }
  }, [user]);

  // Subscribe to teacher's subjects
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

  const fetchTeacherData = async () => {
    setLoading(true);
    try {
      // Fetch Interviews created by this teacher
      const interviewsQuery = query(
        collection(db, "interviews"),
        where("teacherId", "==", user.uid),
      );
      const interviewsSnapshot = await getDocs(interviewsQuery);
      const interviewsData = interviewsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setInterviews(interviewsData);

      // Fetch students from the same school
      if (userData?.schoolId) {
        const studentsQuery = query(
          collection(db, "users"),
          where("role", "==", "student"),
          where("schoolId", "==", userData.schoolId),
          where("status", "==", "active"),
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        const studentsData = studentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStudents(studentsData);
      }

      // Fetch results for this employer's interviews
      const interviewIds = interviewsData.map((e) => e.id);
      if (interviewIds.length > 0) {
        const resultsQuery = query(collection(db, "results"));
        const resultsSnapshot = await getDocs(resultsQuery);
        const resultsData = resultsSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((result) => interviewIds.includes(result.interviewId));
        setResults(resultsData);
      }
    } catch (error) {
      console.error("Error fetching teacher data:", error);
      showAlert("error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleinterviewFormChange = (e) => {
    setinterviewForm({
      ...interviewForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleQuestionChange = (field, value) => {
    setCurrentQuestion({
      ...currentQuestion,
      [field]: value,
    });
  };

  const insertMathSymbol = (symbol) => {
    setCurrentQuestion({
      ...currentQuestion,
      questionText: currentQuestion.questionText + symbol,
    });
  };

  const insertMathSymbolInOption = (index, symbol) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = newOptions[index] + symbol;
    setCurrentQuestion({
      ...currentQuestion,
      options: newOptions,
    });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion({
      ...currentQuestion,
      options: newOptions,
    });
  };

  const addQuestion = () => {
    if (!currentQuestion.questionText.trim()) {
      showAlert("error", "Please enter a question");
      return;
    }

    if (currentQuestion.type === 'objective' && currentQuestion.options.some((opt) => !opt.trim())) {
      showAlert("error", "Please fill all options");
      return;
    }

    // Check question limit
    if (questions.length >= questionLimit) {
      showAlert("error", `You've reached the maximum of ${questionLimit} questions for your plan. ${school?.planTier === 'free' ? 'Upgrade to add more questions.' : ''}`);
      return;
    }

    setQuestions([...questions, { ...currentQuestion }]);
    setCurrentQuestion({
      questionText: "",
      type: "objective",
      options: ["", "", "", ""],
      correctOption: 0,
    });
    showAlert("success", "Question added successfully");
  };

  const removeQuestion = (index) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
    showAlert("success", "Question removed");
  };

  const handleCreateInterview = async () => {
    // Validation
    if (!interviewForm.title.trim()) {
      showAlert("error", "Please enter interview title");
      return;
    }

    if (!selectedSubject) {
      showAlert("error", "Please select a subject");
      return;
    }

    if (!interviewForm.timeLimit || interviewForm.timeLimit <= 0) {
      showAlert("error", "Please enter valid time limit");
      return;
    }

    if (questions.length === 0) {
      showAlert("error", "Please add at least one question");
      return;
    }

    setLoading(true);

    try {
      // Generate unique Interview Code (6 characters)
      const interviewCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create Interview document
      const interviewRef = await addDoc(collection(db, "interviews"), {
        title: interviewForm.title,
        subject: selectedSubject.name,
        subjectId: selectedSubject.id,
        subjectCode: selectedSubject.code,
        timeLimit: parseInt(interviewForm.timeLimit),
        interviewDate: interviewForm.interviewDate || null,
        description: interviewForm.description,
        teacherId: user.uid,
        teacherName: userData?.name || "Unknown",
        schoolId: userData?.schoolId || null,
        createdAt: new Date(),
        totalQuestions: questions.length,
        interviewCode: interviewCode,
      });

      // Create questions subcollection
      for (let i = 0; i < questions.length; i++) {
        await addDoc(collection(db, "interviews", interviewRef.id, "questions"), {
          ...questions[i],
          questionNumber: i + 1,
        });
      }

      // Increment subject interview count
      await incrementSubjectExamCount(selectedSubject.id);

      showAlert("success", `Interview created successfully! Code: ${interviewCode}`);
      setShowCreateModal(false);
      resetForm();
      fetchTeacherData();
    } catch (error) {
      console.error("Error creating interview:", error);
      showAlert("error", "Failed to Create Interview");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setinterviewForm({
      title: "",
      subject: "",
      timeLimit: "",
      interviewDate: "",
      description: "",
    });
    setQuestions([]);
    setCurrentQuestion({
      questionText: "",
      type: "objective",
      options: ["", "", "", ""],
      correctOption: 0,
    });
    setSelectedSubject(null);
  };

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
      showAlert('success', `Subject "${subjectData.name}" registered successfully!`);
    } catch (error) {
      console.error('Error registering subject:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (subjectId, interviewCount) => {
    if (interviewCount > 0) {
      showAlert('error', 'Cannot delete subject with existing interviews. Delete interviews first.');
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

  const handleRegisterStudent = async (studentData) => {
    if (!checkLimit('student')) {
      setLimitModalType('student');
      setShowLimitModal(true);
      throw new Error('Applicant limit reached');
    }

    try {
      setLoading(true);
      const result = await registerStudent(user.uid, userData?.schoolId, studentData);
      await incrementUsage('student');

      // Store the student ID to show in a modal
      setRegisteredStudentId(result.studentId);

      showAlert('success', `Student "${result.name}" registered successfully!`);
      fetchTeacherData(); // Refresh student list

      return result;
    } catch (error) {
      console.error('Error registering student:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (window.confirm(`Are you sure you want to remove ${studentName}? They will no longer be able to access the system.`)) {
      try {
        await deactivateStudent(studentId);
        await decrementUsage('student');
        showAlert("success", "Applicant removed successfully");
        fetchTeacherData();
      } catch (error) {
        console.error("Error removing student:", error);
        showAlert("error", "Failed to remove student");
      }
    }
  };

  const handleDeleteInterview = async (interview) => {
    if (window.confirm("Are you sure you want to delete this interview?")) {
      try {
        const interviewId = typeof interview === 'string' ? interview : interview.id;

        // Delete questions subcollection
        const questionsSnapshot = await getDocs(
          collection(db, "interviews", interviewId, "questions"),
        );
        for (const doc of questionsSnapshot.docs) {
          await deleteDoc(doc.ref);
        }

        // Delete interview document
        await deleteDoc(doc(db, "interviews", interviewId));

        // Decrement subject interview count if interview has subjectId
        if (interview.subjectId) {
          await decrementSubjectExamCount(interview.subjectId);
        }

        showAlert("success", "Interview deleted successfully");
        fetchTeacherData();
      } catch (error) {
        console.error("Error deleting interview:", error);
        showAlert("error", "Failed to delete interview");
      }
    }
  };

  const handleViewInterview = async (interview) => {
    try {
      const questionsSnapshot = await getDocs(
        collection(db, "interviews", interview.id, "questions"),
      );
      const questionsData = questionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setSelectedInterview({ ...interview, questions: questionsData });
      setShowViewModal(true);
    } catch (error) {
      console.error("Error fetching interview details:", error);
      showAlert("error", "Failed to load interview details");
    }
  };

  const interviewColumns = [
    { header: "Title", accessor: "title" },
    { header: "Subject", accessor: "subject" },
    {
      header: "Interview Code",
      render: (row) => (
        <div className="flex items-center gap-2">
          <code className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono text-sm font-bold">
            {row.interviewCode || row.id.substring(0, 6).toUpperCase()}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(row.interviewCode || row.id);
              showAlert("success", "Interview Code copied!");
            }}
            className="text-gray-400 hover:text-blue-600 transition-colors"
            title="Copy Interview Code"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
        </div>
      ),
    },
    {
      header: "Questions",
      render: (row) => row.totalQuestions || 0,
    },
    {
      header: "Time Limit",
      render: (row) => `${row.timeLimit} mins`,
    },
    {
      header: "Created",
      render: (row) => row.createdAt?.toDate().toLocaleDateString() || "N/A",
    },
  ];

  const resultColumns = [
    {
      header: "Applicant",
      render: (row) => {
        const student = students.find((s) => s.id === row.studentId);
        return student?.name || "Unknown";
      },
    },
    {
      header: "Interview",
      render: (row) => {
        const interview = interviews.find((e) => e.id === row.interviewId);
        return interview?.title || "Unknown";
      },
    },
    {
      header: "Score",
      render: (row) => `${row.score}/${row.totalQuestions}`,
    },
    {
      header: "Percentage",
      render: (row) => {
        const percentage = (row.score / row.totalQuestions) * 100;
        return (
          <span
            className={`font-semibold ${percentage >= 50 ? "text-green-600" : "text-red-600"}`}
          >
            {percentage.toFixed(1)}%
          </span>
        );
      },
    },
    {
      header: "Date",
      render: (row) => row.timestamp?.toDate().toLocaleDateString() || "N/A",
    },
  ];

  // Calculate statistics
  const totalInterviews = interviews.length;
  const totalSubmissions = results.length;
  const averageScore =
    results.length > 0
      ? (
        results.reduce(
          (sum, result) => sum + (result.score / result.totalQuestions) * 100,
          0,
        ) / results.length
      ).toFixed(2)
      : 0;
  const passRate =
    results.length > 0
      ? (
        (results.filter((r) => (r.score / r.totalQuestions) * 100 >= 50)
          .length /
          results.length) *
        100
      ).toFixed(1)
      : 0;

  // Check if teacher is approved
  if (userData?.status === "pending") {
    return (
      <Layout>
        <Card className="text-center py-12">
          <svg
            className="mx-auto h-16 w-16 text-yellow-500 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Account Pending Approval
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Your teacher account is awaiting approval from your school
            administrator. You will be able to access the dashboard once your
            account is approved.
          </p>
        </Card>
      </Layout>
    );
  }

  if (userData?.status === "rejected") {
    return (
      <Layout>
        <Card className="text-center py-12">
          <svg
            className="mx-auto h-16 w-16 text-red-500 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Account Rejected
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Your teacher account has been rejected by your school administrator.
            Please contact your school for more information.
          </p>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout title="Employer Dashboard">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
          className="mb-6"
        />
      )}

      {/* Limit Warning Component */}
      <LimitWarning
        onUpgradeClick={() => {
          // Navigate to subscription settings
          window.location.href = '/employer/subscription';
        }}
      />

      {/* School Subscription Widget */}
      <div className="mb-6">
        <SchoolSubscriptionWidget />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Interviews</p>
              <p className="text-3xl font-bold mt-2">{totalInterviews}</p>
              <p className="text-blue-100 text-xs mt-1">Interviews created</p>
            </div>
            <svg
              className="h-12 w-12 text-blue-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Submissions</p>
              <p className="text-3xl font-bold mt-2">{totalSubmissions}</p>
              <p className="text-green-100 text-xs mt-1">Total submissions</p>
            </div>
            <svg
              className="h-12 w-12 text-green-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Avg Score</p>
              <p className="text-3xl font-bold mt-2">{averageScore}%</p>
              <p className="text-purple-100 text-xs mt-1">Average score</p>
            </div>
            <svg
              className="h-12 w-12 text-purple-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Pass Rate</p>
              <p className="text-3xl font-bold mt-2">{passRate}%</p>
              <p className="text-orange-100 text-xs mt-1">Applicants passing</p>
            </div>
            <svg
              className="h-12 w-12 text-orange-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>
        </Card>
      </div>

      {/* Action Button */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Your Interviews</h3>
          <p className="text-sm text-gray-600">
            Create and manage Your Interviews. Each interview counts as one subject toward your school's plan limit.
          </p>
        </div>
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
          <svg
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          {subjects.length === 0 ? 'Register First Subject' : 'Create New Interview'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {["overview", "subjects", "interviews", "results", "applicants"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors duration-200`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <Card title="Recent Interviews" subtitle="Your recently created interviews">
            <Table
              columns={interviewColumns}
              data={interviews.slice(0, 5)}
              loading={loading}
              emptyMessage="No Interviews created yet"
              actions={(row) => (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewInterview(row)}
                  >
                    View
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteInterview(row)}
                  >
                    Delete
                  </Button>
                </>
              )}
            />
          </Card>

          <Card title="Recent Results" subtitle="Latest interview submissions">
            <Table
              columns={resultColumns}
              data={results.slice(0, 5)}
              loading={loading}
              emptyMessage="No results yet"
            />
          </Card>
        </div>
      )}

      {activeTab === "subjects" && (
        <div className="space-y-6">
          <Card
            title="Your Registered Subjects"
            subtitle="Subjects you can Create Interviews for"
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
              columns={[
                { header: "Subject Name", accessor: "name" },
                { header: "Code", accessor: "code" },
                { header: "Description", accessor: "description" },
                {
                  header: "interviews",
                  render: (row) => row.interviewCount || 0
                },
                {
                  header: "Created",
                  render: (row) => row.createdAt?.toDate().toLocaleDateString() || "N/A",
                },
              ]}
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
                    Create Interview
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteSubject(row.id, row.interviewCount)}
                    disabled={row.interviewCount > 0}
                    title={row.interviewCount > 0 ? "Delete all interviews first" : "Delete subject"}
                  >
                    Delete
                  </Button>
                </>
              )}
            />
          </Card>
        </div>
      )}

      {activeTab === "interviews" && (
        <div className="space-y-6">
          {/* Subscription Limit Info */}
          {school && subjectUsage && (
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Subject Registration</h3>
                  <p className="text-sm text-gray-600">
                    {school.name} - {school.planTier.toUpperCase()} Plan
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-600">
                    {subjectUsage.current} / {subjectUsage.limit}
                  </p>
                  <p className="text-xs text-gray-600">Subjects Used</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">School-Wide Usage</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {subjectUsage.percentage.toFixed(0)}%
                  </span>
                </div>
                <div className={`w-full rounded-full h-3 ${subjectUsage.percentage >= 100 ? 'bg-red-100' :
                  subjectUsage.percentage >= 80 ? 'bg-yellow-100' :
                    'bg-green-100'
                  }`}>
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${subjectUsage.percentage >= 100 ? 'bg-red-500' :
                      subjectUsage.percentage >= 80 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                    style={{ width: `${Math.min(subjectUsage.percentage, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Your Contribution */}
              {teacherUsage && (
                <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Your Subjects:</span>
                    <span className="text-lg font-bold text-blue-600">{teacherUsage.subjects}</span>
                  </div>
                </div>
              )}

              {/* Warning or Upgrade Message */}
              {subjectUsage.percentage >= 100 ? (
                <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-3 rounded">
                  <p className="text-sm text-red-800">
                    <strong>Limit Reached!</strong> Your school has reached the maximum number of subjects.
                    {isAdmin ? ' Upgrade your plan to add more subjects.' : ' Contact your school admin to upgrade.'}
                  </p>
                </div>
              ) : subjectUsage.percentage >= 80 ? (
                <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>Approaching Limit!</strong> Your school is using {subjectUsage.percentage.toFixed(0)}% of available subjects.
                  </p>
                </div>
              ) : null}
            </Card>
          )}

          {/* Interviews Table */}
          <Card title="Your Registered Subjects" subtitle="Interviews you have created">
            <Table
              columns={interviewColumns}
              data={interviews}
              loading={loading}
              emptyMessage="No subjects registered yet. Click 'Create New Interview' to get started."
              actions={(row) => (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewInterview(row)}
                  >
                    View
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteInterview(row)}
                  >
                    Delete
                  </Button>
                </>
              )}
            />
          </Card>
        </div>
      )}

      {activeTab === "results" && (
        <Card
          title="All Results"
          subtitle="Interview submission results"
          action={
            results.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportResultsToPDF(results, students, interviews, { name: school?.name })}
                >
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportResultsToExcel(results, students, interviews, { name: school?.name })}
                >
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Excel
                </Button>
              </div>
            )
          }
        >
          <Table
            columns={resultColumns}
            data={results}
            loading={loading}
            emptyMessage="No results yet"
          />
        </Card>
      )}

      {activeTab === "applicants" && (
        <Card
          title="Your Registered Applicants"
          subtitle="Applicants you have registered"
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowStudentModal(true)}
              disabled={!checkLimit('student')}
            >
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Register Student
            </Button>
          }
        >
          <Table
            columns={[
              { header: "Name", accessor: "name" },
              {
                header: "Applicant ID",
                render: (row) => (
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono text-sm font-bold">
                      {row.studentId || 'N/A'}
                    </code>
                    {row.studentId && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(row.studentId);
                          showAlert("success", "Applicant ID copied!");
                        }}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Copy Student ID"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}
                  </div>
                )
              },
              {
                header: "Contact",
                render: (row) => row.email || row.phoneNumber || 'N/A'
              },
              {
                header: "Status",
                render: (row) => (
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${row.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                      }`}
                  >
                    {row.status}
                  </span>
                ),
              },
            ]}
            data={students}
            loading={loading}
            emptyMessage="No students registered yet. Click 'Register Student' to get started."
            actions={(row) => (
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeleteStudent(row.id, row.name)}
              >
                Remove
              </Button>
            )}
          />
        </Card>
      )}

      {/* Create Interview Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New Interview"
        size="xl"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateInterview}
              loading={loading}
            >
              Create Interview
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Info Box */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-start">
              <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  {school?.planTier?.toUpperCase() || 'FREE'} Plan Limits
                </p>
                <div className="text-xs text-blue-800 space-y-1">
                  <p>
                    <span className="font-semibold">Questions per interview:</span> Up to {questionLimit} questions
                  </p>
                  {subjectUsage && (
                    <p>
                      <span className="font-semibold">Subjects:</span> {subjectUsage.current}/{subjectUsage.limit} used
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Summary */}
          {questions.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-green-600 p-2 rounded-lg">
                    <svg
                      className="h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-semibold text-green-900">
                      {questions.length} / {questionLimit} Question{questions.length !== 1 ? 's' : ''} Added
                    </p>
                    <p className="text-xs text-green-700">
                      {questions.length >= questionLimit ? 'Limit reached' : 'Ready to Create Interview'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {questions.length} / {questionLimit}
                  </p>
                  <p className="text-xs text-green-700">Questions</p>
                </div>
              </div>
            </div>
          )}

          {/* interview details */}
          <div>
            <div className="flex items-center mb-4">
              <div className="bg-blue-600 p-2 rounded-lg">
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h4 className="ml-3 text-lg font-semibold text-gray-900">
                interview details
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Interview Title"
                name="title"
                value={interviewForm.title}
                onChange={handleinterviewFormChange}
                placeholder="e.g., Technical Interview"
                required
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Subject <span className="text-red-500">*</span>
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
                        type="button"
                        onClick={() => setSelectedSubject(subject)}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${selectedSubject?.id === subject.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                          }`}
                      >
                        <div className="font-semibold text-gray-900">{subject.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{subject.code}</div>
                        {subject.interviewCount > 0 && (
                          <div className="text-xs text-blue-600 mt-1">
                            {subject.interviewCount} interview{subject.interviewCount !== 1 ? 's' : ''}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Input
                label="Time Limit (minutes)"
                type="number"
                name="timeLimit"
                value={interviewForm.timeLimit}
                onChange={handleinterviewFormChange}
                placeholder="e.g., 60"
                required
              />
              <Input
                label="Interview Date (Optional)"
                type="date"
                name="interviewDate"
                value={interviewForm.interviewDate}
                onChange={handleinterviewFormChange}
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={interviewForm.description}
                onChange={handleinterviewFormChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description about the interview..."
              />
            </div>
          </div>

          {/* Questions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-purple-600 p-2 rounded-lg">
                  <svg
                    className="h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h4 className="ml-3 text-lg font-semibold text-gray-900">
                  Interview Questions
                </h4>
              </div>
              {questions.length > 0 && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
                  {questions.length} added
                </span>
              )}
            </div>

            {/* Current Question Form */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-6 rounded-xl mb-4">
              <div className="flex items-center mb-4">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <svg
                    className="h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <h5 className="ml-3 text-base font-semibold text-gray-900">
                  Add New Question
                </h5>
              </div>

              {/* Question Type Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Type
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-blue-600"
                      name="questionType"
                      value="objective"
                      checked={currentQuestion.type === 'objective'}
                      onChange={(e) => handleQuestionChange('type', 'objective')}
                    />
                    <span className="ml-2">Objective (Multiple Choice)</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-blue-600"
                      name="questionType"
                      value="theory"
                      checked={currentQuestion.type === 'theory'}
                      onChange={(e) => handleQuestionChange('type', 'theory')}
                    />
                    <span className="ml-2">Theory (Essay/Text)</span>
                  </label>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Question Text
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowMathTools(!showMathTools)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    {showMathTools ? "Hide" : "Show"} Math Symbols
                  </button>
                </div>

                {showMathTools && (
                  <div className="mb-2 p-3 bg-white border border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2 font-medium">Click to insert:</p>
                    <div className="grid grid-cols-8 gap-2">
                      {[
                        { symbol: "×", label: "Multiply" },
                        { symbol: "÷", label: "Divide" },
                        { symbol: "±", label: "Plus-minus" },
                        { symbol: "≠", label: "Not equal" },
                        { symbol: "≈", label: "Approximately" },
                        { symbol: "≤", label: "Less than or equal" },
                        { symbol: "≥", label: "Greater than or equal" },
                        { symbol: "∞", label: "Infinity" },
                        { symbol: "√", label: "Square root" },
                        { symbol: "∛", label: "Cube root" },
                        { symbol: "²", label: "Squared" },
                        { symbol: "³", label: "Cubed" },
                        { symbol: "π", label: "Pi" },
                        { symbol: "°", label: "Degree" },
                        { symbol: "∠", label: "Angle" },
                        { symbol: "△", label: "Triangle" },
                        { symbol: "∑", label: "Sum" },
                        { symbol: "∫", label: "Integral" },
                        { symbol: "∂", label: "Partial derivative" },
                        { symbol: "α", label: "Alpha" },
                        { symbol: "β", label: "Beta" },
                        { symbol: "θ", label: "Theta" },
                        { symbol: "λ", label: "Lambda" },
                        { symbol: "μ", label: "Mu" },
                      ].map((item) => (
                        <button
                          key={item.symbol}
                          type="button"
                          onClick={() => insertMathSymbol(item.symbol)}
                          className="p-2 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded text-lg font-semibold transition-colors"
                          title={item.label}
                        >
                          {item.symbol}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Input
                  value={currentQuestion.questionText}
                  onChange={(e) =>
                    handleQuestionChange("questionText", e.target.value)
                  }
                  placeholder="Enter your question here... (e.g., What is 5 × 3?)"
                />
              </div>

              <div className="mt-4">
                {currentQuestion.type === 'objective' && (
                  <>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Answer Options
                    </label>
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center font-semibold text-gray-700 border-2 border-gray-300">
                            {String.fromCharCode(65 + index)}
                          </div>
                          <Input
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            placeholder={`Enter option ${String.fromCharCode(65 + index)}`}
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {currentQuestion.type === 'objective' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Correct Answer
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {currentQuestion.options.map((option, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleQuestionChange("correctOption", index)}
                        className={`p-3 rounded-lg border-2 transition-all ${currentQuestion.correctOption === index
                          ? "border-green-500 bg-green-50 text-green-700 font-semibold"
                          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                          }`}
                      >
                        <div className="text-center">
                          <div className="text-lg font-bold">
                            {String.fromCharCode(65 + index)}
                          </div>
                          {currentQuestion.correctOption === index && (
                            <svg
                              className="h-4 w-4 mx-auto mt-1 text-green-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {questions.length} / {questionLimit} questions added
                  {questions.length >= questionLimit && (
                    <span className="ml-2 text-orange-600 font-semibold">
                      (Limit reached)
                    </span>
                  )}
                </p>
                <Button
                  variant="primary"
                  onClick={addQuestion}
                  disabled={questions.length >= questionLimit}
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Question to Interview
                </Button>
              </div>
            </div>

            {/* Added Questions List */}
            {questions.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-semibold text-gray-700">
                    Added Questions ({questions.length})
                  </h5>
                  <span className="text-xs text-gray-500">
                    Scroll to see all questions
                  </span>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {questions.map((q, index) => (
                    <div
                      key={index}
                      className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-3">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-white ${q.type === 'theory' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${q.type === 'theory' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {q.type === 'theory' ? 'Theory' : 'Objective'}
                                </span>
                              </div>
                              <p className="font-medium text-gray-900">
                                {q.questionText}
                              </p>
                            </div>
                          </div>
                          {q.type === 'objective' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-11">
                              {q.options.map((opt, i) => (
                                <div
                                  key={i}
                                  className={`flex items-center p-2 rounded-lg text-sm ${i === q.correctOption
                                    ? "bg-green-50 border-2 border-green-500 text-green-900 font-semibold"
                                    : "bg-gray-50 border border-gray-200 text-gray-700"
                                    }`}
                                >
                                  <span className="font-bold mr-2">
                                    {String.fromCharCode(65 + i)}.
                                  </span>
                                  <span className="flex-1">{opt}</span>
                                  {i === q.correctOption && (
                                    <svg
                                      className="h-4 w-4 text-green-600 ml-2"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {q.type === 'theory' && (
                            <div className="ml-11 text-sm text-gray-500 italic block border-l-2 border-purple-200 pl-3 py-2 bg-purple-50 rounded-r">
                              Student will provide a text answer for this question.
                            </div>
                          )}
                        </div>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => removeQuestion(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm">No questions added yet</p>
                <p className="text-xs mt-1">Add your first question above</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* View Interview Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setselectedInterview(null);
        }}
        title={selectedInterview?.title || "interview details"}
        size="lg"
      >
        {selectedInterview && (
          <div className="space-y-4">
            {/* Interview Code Banner */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Share this code with students</p>
                  <div className="flex items-center gap-3">
                    <code className="text-3xl font-bold font-mono tracking-wider">
                      {selectedInterview.interviewCode || selectedInterview.id.substring(0, 6).toUpperCase()}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedInterview.interviewCode || selectedInterview.id);
                        showAlert("success", "Interview Code copied to clipboard!");
                      }}
                      className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-all"
                      title="Copy Interview Code"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm mb-1">Interview ID</p>
                  <p className="text-xs font-mono opacity-75">
                    {selectedInterview.id.substring(0, 12)}...
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-4 border-b">
              <div>
                <p className="text-sm text-gray-600">Subject</p>
                <p className="font-semibold">{selectedInterview.subject}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Time Limit</p>
                <p className="font-semibold">
                  {selectedInterview.timeLimit} minutes
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Questions</p>
                <p className="font-semibold">
                  {selectedInterview.questions?.length || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-semibold">
                  {selectedInterview.createdAt?.toDate().toLocaleDateString() ||
                    "N/A"}
                </p>
              </div>
            </div>

            {selectedInterview.description && (
              <div className="pb-4 border-b">
                <p className="text-sm text-gray-600 mb-1">Description</p>
                <p className="text-gray-900">{selectedInterview.description}</p>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Questions</h4>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {selectedInterview.questions?.map((q, index) => (
                  <div
                    key={q.id}
                    className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                  >
                    <p className="font-medium text-gray-900 mb-3">
                      Question {index + 1}: {q.questionText}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt, i) => (
                        <div
                          key={i}
                          className={`flex items-center p-2 rounded ${i === q.correctOption
                            ? "bg-green-100 border border-green-300"
                            : "bg-white border border-gray-200"
                            }`}
                        >
                          <span
                            className={`font-semibold mr-2 ${i === q.correctOption
                              ? "text-green-700"
                              : "text-gray-700"
                              }`}
                          >
                            {String.fromCharCode(65 + i)}.
                          </span>
                          <span
                            className={
                              i === q.correctOption
                                ? "text-green-900"
                                : "text-gray-900"
                            }
                          >
                            {opt}
                          </span>
                          {i === q.correctOption && (
                            <span className="ml-auto text-green-600 font-semibold">
                              ✓ Correct
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Limit Reached Modal */}
      <Modal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        title="Limit Reached"
        size="md"
        closeOnOverlayClick={false}
      >
        <div className="space-y-4">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-red-100 p-3">
              <svg
                className="h-12 w-12 text-red-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
          </div>

          {/* Message */}
          <div className="text-center">
            <p className="text-gray-700 mb-4">
              {limitModalType === 'subject'
                ? `Your school has reached the limit of ${subjectUsage.limit} subjects. Upgrade the school plan to add more subjects.`
                : `Your school has reached the limit of ${studentUsage.limit} applicants. Upgrade the school plan to add more applicants.`
              }
            </p>

            {school && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">Current Plan:</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {school.planTier} Plan
                </p>
                <div className="mt-3 text-sm text-gray-600">
                  <p>Subjects: {subjectUsage.current} / {subjectUsage.limit}</p>
                  <p>Applicants: {studentUsage.current} / {studentUsage.limit}</p>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-600">
              Upgrade to a higher plan to continue adding {limitModalType}s and unlock more features.
            </p>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            fullWidth
            onClick={() => setShowLimitModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={() => {
              setShowLimitModal(false);
              window.location.href = '/employer/subscription';
            }}
          >
            Upgrade Now
          </Button>
        </div>
      </Modal>

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

      {/* Student Registration Modal */}
      <StudentRegistrationModal
        isOpen={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        onRegister={handleRegisterStudent}
        loading={loading}
        canRegister={checkLimit('student')}
        currentUsage={studentUsage?.current || 0}
        limit={studentUsage?.limit || 0}
      />

      {/* Student ID Display Modal */}
      {
        registeredStudentId && (
          <Modal
            isOpen={!!registeredStudentId}
            onClose={() => setRegisteredStudentId(null)}
            title="Applicant Registered Successfully!"
            size="md"
          >
            <div className="text-center space-y-4">
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <svg className="h-16 w-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-600 mb-2">Student ID</p>
                <code className="text-3xl font-bold text-blue-600 font-mono">
                  {registeredStudentId}
                </code>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Important:</strong> Please share this Student ID with the student.
                  They will use it to login to the system.
                </p>
              </div>

              <Button
                variant="primary"
                onClick={() => {
                  navigator.clipboard.writeText(registeredStudentId);
                  showAlert("success", "Applicant ID copied to clipboard!");
                }}
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Student ID
              </Button>
            </div>
          </Modal>
        )
      }
    </Layout >
  );
};

export default EmployerDashboard;


