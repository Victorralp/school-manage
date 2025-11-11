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

const TeacherDashboard = () => {
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
    teacherUsage
  } = useSchoolSubscription();
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [alert, setAlert] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [showMathTools, setShowMathTools] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitModalType, setLimitModalType] = useState(null);

  // Form states
  const [examForm, setExamForm] = useState({
    title: "",
    subject: "",
    timeLimit: "",
    examDate: "",
    description: "",
  });
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    questionText: "",
    options: ["", "", "", ""],
    correctOption: 0,
  });

  useEffect(() => {
    if (user) {
      fetchTeacherData();
    }
  }, [user]);

  const fetchTeacherData = async () => {
    setLoading(true);
    try {
      // Fetch exams created by this teacher
      const examsQuery = query(
        collection(db, "exams"),
        where("teacherId", "==", user.uid),
      );
      const examsSnapshot = await getDocs(examsQuery);
      const examsData = examsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExams(examsData);

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

      // Fetch results for this teacher's exams
      const examIds = examsData.map((e) => e.id);
      if (examIds.length > 0) {
        const resultsQuery = query(collection(db, "results"));
        const resultsSnapshot = await getDocs(resultsQuery);
        const resultsData = resultsSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((result) => examIds.includes(result.examId));
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

  const handleExamFormChange = (e) => {
    setExamForm({
      ...examForm,
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

    if (currentQuestion.options.some((opt) => !opt.trim())) {
      showAlert("error", "Please fill all options");
      return;
    }

    setQuestions([...questions, { ...currentQuestion }]);
    setCurrentQuestion({
      questionText: "",
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

  const handleCreateExam = async () => {
    // Validation
    if (!examForm.title.trim()) {
      showAlert("error", "Please enter exam title");
      return;
    }

    if (!examForm.subject.trim()) {
      showAlert("error", "Please enter subject");
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

    // Check subscription limit before creating exam
    if (!checkLimit('subject')) {
      setLimitModalType('subject');
      setShowLimitModal(true);
      return;
    }

    setLoading(true);

    try {
      // Generate unique exam code (6 characters)
      const examCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Create exam document
      const examRef = await addDoc(collection(db, "exams"), {
        title: examForm.title,
        subject: examForm.subject,
        timeLimit: parseInt(examForm.timeLimit),
        examDate: examForm.examDate || null,
        description: examForm.description,
        teacherId: user.uid,
        teacherName: userData?.name || "Unknown",
        schoolId: userData?.schoolId || null,
        createdAt: new Date(),
        totalQuestions: questions.length,
        examCode: examCode, // Add exam code
      });

      // Create questions subcollection
      for (let i = 0; i < questions.length; i++) {
        await addDoc(collection(db, "exams", examRef.id, "questions"), {
          ...questions[i],
          questionNumber: i + 1,
        });
      }

      // Increment usage count after successful creation
      await incrementUsage('subject');

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
  };

  const handleDeleteExam = async (examId) => {
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

        // Decrement usage count after successful deletion
        await decrementUsage('subject');

        showAlert("success", "Exam deleted successfully");
        fetchTeacherData();
      } catch (error) {
        console.error("Error deleting exam:", error);
        showAlert("error", "Failed to delete exam");
      }
    }
  };

  const handleViewExam = async (exam) => {
    try {
      const questionsSnapshot = await getDocs(
        collection(db, "exams", exam.id, "questions"),
      );
      const questionsData = questionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setSelectedExam({ ...exam, questions: questionsData });
      setShowViewModal(true);
    } catch (error) {
      console.error("Error fetching exam details:", error);
      showAlert("error", "Failed to load exam details");
    }
  };

  const examColumns = [
    { header: "Title", accessor: "title" },
    { header: "Subject", accessor: "subject" },
    {
      header: "Exam Code",
      render: (row) => (
        <div className="flex items-center gap-2">
          <code className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono text-sm font-bold">
            {row.examCode || row.id.substring(0, 6).toUpperCase()}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(row.examCode || row.id);
              showAlert("success", "Exam code copied!");
            }}
            className="text-gray-400 hover:text-blue-600 transition-colors"
            title="Copy exam code"
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
      header: "Student",
      render: (row) => {
        const student = students.find((s) => s.id === row.studentId);
        return student?.name || "Unknown";
      },
    },
    {
      header: "Exam",
      render: (row) => {
        const exam = exams.find((e) => e.id === row.examId);
        return exam?.title || "Unknown";
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
  const totalExams = exams.length;
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
    <Layout title="Teacher Dashboard">
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
          window.location.href = '/teacher/subscription';
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
              <p className="text-blue-100 text-sm font-medium">Total Exams</p>
              <p className="text-3xl font-bold mt-2">{totalExams}</p>
              <p className="text-blue-100 text-xs mt-1">Exams created</p>
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
              <p className="text-orange-100 text-xs mt-1">Students passing</p>
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
          <h3 className="text-lg font-semibold text-gray-900">Your Exams</h3>
          <p className="text-sm text-gray-600">
            Create and manage your exams. Each exam counts as one subject toward your school's plan limit.
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => {
            console.log("Create Exam button clicked");
            setShowCreateModal(true);
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
          Register New Subject
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {["overview", "exams", "results", "students"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${
                  activeTab === tab
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
          <Card title="Recent Exams" subtitle="Your recently created exams">
            <Table
              columns={examColumns}
              data={exams.slice(0, 5)}
              loading={loading}
              emptyMessage="No exams created yet"
              actions={(row) => (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewExam(row)}
                  >
                    View
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteExam(row.id)}
                  >
                    Delete
                  </Button>
                </>
              )}
            />
          </Card>

          <Card title="Recent Results" subtitle="Latest exam submissions">
            <Table
              columns={resultColumns}
              data={results.slice(0, 5)}
              loading={loading}
              emptyMessage="No results yet"
            />
          </Card>
        </div>
      )}

      {activeTab === "exams" && (
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
                <div className={`w-full rounded-full h-3 ${
                  subjectUsage.percentage >= 100 ? 'bg-red-100' : 
                  subjectUsage.percentage >= 80 ? 'bg-yellow-100' : 
                  'bg-green-100'
                }`}>
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      subjectUsage.percentage >= 100 ? 'bg-red-500' : 
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

          {/* Exams Table */}
          <Card title="Your Registered Subjects" subtitle="Exams you have created">
            <Table
              columns={examColumns}
              data={exams}
              loading={loading}
              emptyMessage="No subjects registered yet. Click 'Create New Exam' to get started."
              actions={(row) => (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewExam(row)}
                  >
                    View
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteExam(row.id)}
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
          subtitle="Exam submission results"
          action={
            results.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportResultsToPDF(results, students, exams, { name: school?.name })}
                >
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportResultsToExcel(results, students, exams, { name: school?.name })}
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

      {activeTab === "students" && (
        <Card title="Students" subtitle="Students in your school">
          <Table
            columns={[
              { header: "Name", accessor: "name" },
              { header: "Email", accessor: "email" },
              {
                header: "Status",
                render: (row) => (
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      row.status === "active"
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
            emptyMessage="No students found"
          />
        </Card>
      )}

      {/* Create Exam Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Register New Subject & Create Exam"
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
              onClick={handleCreateExam}
              loading={loading}
            >
              Create Exam
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
              <div className="ml-3">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Subject Registration
                </p>
                <p className="text-xs text-blue-800">
                  Creating an exam registers a new subject and counts toward your school's plan limit. 
                  {subjectUsage && (
                    <span className="font-semibold"> Current usage: {subjectUsage.current}/{subjectUsage.limit} subjects.</span>
                  )}
                </p>
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
                      {questions.length} Question{questions.length !== 1 ? 's' : ''} Added
                    </p>
                    <p className="text-xs text-green-700">
                      Ready to create exam
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {questions.length}
                  </p>
                  <p className="text-xs text-green-700">Questions</p>
                </div>
              </div>
            </div>
          )}

          {/* Exam Details */}
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
                Exam Details
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Exam Title"
                name="title"
                value={examForm.title}
                onChange={handleExamFormChange}
                placeholder="e.g., Math Final Exam"
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  name="subject"
                  value={examForm.subject}
                  onChange={handleExamFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a subject</option>
                  <optgroup label="Mathematics & Sciences">
                    <option value="Mathematics">Mathematics</option>
                    <option value="Algebra">Algebra</option>
                    <option value="Geometry">Geometry</option>
                    <option value="Calculus">Calculus</option>
                    <option value="Statistics">Statistics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                  </optgroup>
                  <optgroup label="Languages">
                    <option value="English">English</option>
                    <option value="Literature">Literature</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                  </optgroup>
                  <optgroup label="Social Studies">
                    <option value="History">History</option>
                    <option value="Geography">Geography</option>
                    <option value="Economics">Economics</option>
                    <option value="Political Science">Political Science</option>
                  </optgroup>
                  <optgroup label="Technology & Arts">
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Art">Art</option>
                    <option value="Music">Music</option>
                  </optgroup>
                  <optgroup label="Other">
                    <option value="General Knowledge">General Knowledge</option>
                    <option value="Other">Other</option>
                  </optgroup>
                </select>
              </div>
              <Input
                label="Time Limit (minutes)"
                type="number"
                name="timeLimit"
                value={examForm.timeLimit}
                onChange={handleExamFormChange}
                placeholder="e.g., 60"
                required
              />
              <Input
                label="Exam Date (Optional)"
                type="date"
                name="examDate"
                value={examForm.examDate}
                onChange={handleExamFormChange}
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={examForm.description}
                onChange={handleExamFormChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description about the exam..."
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
                  Exam Questions
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
              </div>

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
                      className={`p-3 rounded-lg border-2 transition-all ${
                        currentQuestion.correctOption === index
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

              <div className="mt-6 flex justify-end">
                <Button
                  variant="primary"
                  onClick={addQuestion}
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
                  Add Question to Exam
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
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                              {index + 1}
                            </div>
                            <p className="font-medium text-gray-900 flex-1">
                              {q.questionText}
                            </p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-11">
                            {q.options.map((opt, i) => (
                              <div
                                key={i}
                                className={`flex items-center p-2 rounded-lg text-sm ${
                                  i === q.correctOption
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

      {/* View Exam Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedExam(null);
        }}
        title={selectedExam?.title || "Exam Details"}
        size="lg"
      >
        {selectedExam && (
          <div className="space-y-4">
            {/* Exam Code Banner */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Share this code with students</p>
                  <div className="flex items-center gap-3">
                    <code className="text-3xl font-bold font-mono tracking-wider">
                      {selectedExam.examCode || selectedExam.id.substring(0, 6).toUpperCase()}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedExam.examCode || selectedExam.id);
                        showAlert("success", "Exam code copied to clipboard!");
                      }}
                      className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-all"
                      title="Copy exam code"
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
                  <p className="text-blue-100 text-sm mb-1">Exam ID</p>
                  <p className="text-xs font-mono opacity-75">
                    {selectedExam.id.substring(0, 12)}...
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-4 border-b">
              <div>
                <p className="text-sm text-gray-600">Subject</p>
                <p className="font-semibold">{selectedExam.subject}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Time Limit</p>
                <p className="font-semibold">
                  {selectedExam.timeLimit} minutes
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Questions</p>
                <p className="font-semibold">
                  {selectedExam.questions?.length || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-semibold">
                  {selectedExam.createdAt?.toDate().toLocaleDateString() ||
                    "N/A"}
                </p>
              </div>
            </div>

            {selectedExam.description && (
              <div className="pb-4 border-b">
                <p className="text-sm text-gray-600 mb-1">Description</p>
                <p className="text-gray-900">{selectedExam.description}</p>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Questions</h4>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {selectedExam.questions?.map((q, index) => (
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
                          className={`flex items-center p-2 rounded ${
                            i === q.correctOption
                              ? "bg-green-100 border border-green-300"
                              : "bg-white border border-gray-200"
                          }`}
                        >
                          <span
                            className={`font-semibold mr-2 ${
                              i === q.correctOption
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
                ? `You've reached your subject limit of ${subjectUsage.limit}. Upgrade your plan to add more subjects.`
                : `You've reached your student limit of ${studentUsage.limit}. Upgrade your plan to add more students.`
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
                  <p>Students: {studentUsage.current} / {studentUsage.limit}</p>
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
              window.location.href = '/teacher/subscription';
            }}
          >
            Upgrade Now
          </Button>
        </div>
      </Modal>
    </Layout>
  );
};

export default TeacherDashboard;
