import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import { useSchoolSubscription } from "../../context/SchoolSubscriptionContext";
import Layout from "../../components/Layout";
import Card from "../../components/Card";
import Table from "../../components/Table";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import Alert from "../../components/Alert";
import LimitWarning from "../../components/Subscription/LimitWarning";
import SchoolSubscriptionWidget from "../../components/Subscription/SchoolSubscriptionWidget";

const SchoolDashboard = () => {
  const { user } = useAuth();
  const { 
    checkLimit, 
    incrementUsage, 
    decrementUsage, 
    subjectUsage, 
    studentUsage,
    school: subscriptionSchool,
    isAdmin,
    teacherUsage
  } = useSchoolSubscription();
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [alert, setAlert] = useState(null);
  const [schoolData, setSchoolData] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitModalType, setLimitModalType] = useState(null);

  useEffect(() => {
    if (user) {
      fetchSchoolData();
    }
  }, [user]);

  const fetchSchoolData = async () => {
    setLoading(true);
    try {
      // Fetch school info
      const schoolDoc = await getDoc(doc(db, "schools", user.uid));
      if (schoolDoc.exists()) {
        setSchoolData(schoolDoc.data());
      }

      // Fetch teachers belonging to this school
      const teachersQuery = query(
        collection(db, "users"),
        where("role", "==", "teacher"),
        where("schoolId", "==", user.uid),
      );
      const teachersSnapshot = await getDocs(teachersQuery);
      const teachersData = teachersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTeachers(teachersData);

      // Fetch students belonging to this school
      const studentsQuery = query(
        collection(db, "users"),
        where("role", "==", "student"),
        where("schoolId", "==", user.uid),
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentsData = studentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStudents(studentsData);

      // Fetch exams created by teachers in this school
      const teacherIds = teachersData.map((t) => t.id);
      if (teacherIds.length > 0) {
        const examsQuery = query(collection(db, "exams"));
        const examsSnapshot = await getDocs(examsQuery);
        const examsData = examsSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((exam) => teacherIds.includes(exam.teacherId));
        setExams(examsData);
      }

      // Fetch results for students in this school
      const studentIds = studentsData.map((s) => s.id);
      if (studentIds.length > 0) {
        const resultsQuery = query(collection(db, "results"));
        const resultsSnapshot = await getDocs(resultsQuery);
        const resultsData = resultsSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((result) => studentIds.includes(result.studentId));
        setResults(resultsData);
      }
    } catch (error) {
      console.error("Error fetching school data:", error);
      showAlert("error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleApproveTeacher = async (teacherId) => {
    try {
      await updateDoc(doc(db, "users", teacherId), { status: "active" });
      showAlert("success", "Teacher approved successfully");
      fetchSchoolData();
    } catch (error) {
      console.error("Error approving teacher:", error);
      showAlert("error", "Failed to approve teacher");
    }
  };

  const handleRejectTeacher = async (teacherId) => {
    try {
      await updateDoc(doc(db, "users", teacherId), { status: "rejected" });
      showAlert("success", "Teacher rejected");
      fetchSchoolData();
    } catch (error) {
      console.error("Error rejecting teacher:", error);
      showAlert("error", "Failed to reject teacher");
    }
  };

  const handleApproveStudent = async (studentId) => {
    // Check subscription limit before approving student
    if (!checkLimit('student')) {
      setLimitModalType('student');
      setShowLimitModal(true);
      return;
    }

    try {
      await updateDoc(doc(db, "users", studentId), { status: "active" });
      
      // Increment usage count after successful approval
      await incrementUsage('student');
      
      showAlert("success", "Student approved successfully");
      fetchSchoolData();
    } catch (error) {
      console.error("Error approving student:", error);
      showAlert("error", "Failed to approve student");
    }
  };

  const handleRejectStudent = async (studentId) => {
    try {
      await updateDoc(doc(db, "users", studentId), { status: "rejected" });
      showAlert("success", "Student rejected");
      fetchSchoolData();
    } catch (error) {
      console.error("Error rejecting student:", error);
      showAlert("error", "Failed to reject student");
    }
  };

  const handleDeleteUser = async (userId, role) => {
    if (window.confirm(`Are you sure you want to delete this ${role}?`)) {
      try {
        await deleteDoc(doc(db, "users", userId));
        
        // Decrement usage count after successful deletion
        if (role === 'student') {
          await decrementUsage('student');
        }
        
        showAlert("success", `${role} deleted successfully`);
        fetchSchoolData();
      } catch (error) {
        console.error(`Error deleting ${role}:`, error);
        showAlert("error", `Failed to delete ${role}`);
      }
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      active: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      inactive: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status] || styles.inactive}`}
      >
        {status || "N/A"}
      </span>
    );
  };

  const teacherColumns = [
    { header: "Name", accessor: "name" },
    { header: "Email", accessor: "email" },
    {
      header: "Status",
      render: (row) => getStatusBadge(row.status),
    },
    {
      header: "Joined Date",
      render: (row) => row.createdAt?.toDate().toLocaleDateString() || "N/A",
    },
  ];

  const studentColumns = [
    { header: "Name", accessor: "name" },
    { header: "Email", accessor: "email" },
    {
      header: "Status",
      render: (row) => getStatusBadge(row.status),
    },
    {
      header: "Joined Date",
      render: (row) => row.createdAt?.toDate().toLocaleDateString() || "N/A",
    },
  ];

  const examColumns = [
    { header: "Title", accessor: "title" },
    { header: "Subject", accessor: "subject" },
    {
      header: "Time Limit",
      render: (row) => `${row.timeLimit} mins`,
    },
    {
      header: "Created By",
      render: (row) => {
        const teacher = teachers.find((t) => t.id === row.teacherId);
        return teacher?.name || "Unknown";
      },
    },
  ];

  // Calculate statistics
  const pendingTeachers = teachers.filter((t) => t.status === "pending");
  const activeTeachers = teachers.filter((t) => t.status === "active");
  const pendingStudents = students.filter((s) => s.status === "pending");
  const activeStudents = students.filter((s) => s.status === "active");

  // Calculate average score
  const averageScore =
    results.length > 0
      ? (
          results.reduce(
            (sum, result) => sum + (result.score / result.totalQuestions) * 100,
            0,
          ) / results.length
        ).toFixed(2)
      : 0;

  return (
    <Layout title="School Dashboard">
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

      {/* School Info Banner */}
      {schoolData && (
        <Card className="mb-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{schoolData.name}</h2>
              <p className="text-blue-100 mt-1">{schoolData.email}</p>
              <div className="mt-2">{getStatusBadge(schoolData.status)}</div>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">School ID</p>
              <p className="text-lg font-mono bg-blue-600 bg-opacity-50 px-3 py-1 rounded mt-1">
                {user.uid.substring(0, 8)}...
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* School ID Sharing Section */}
      {schoolData && schoolData.status === "active" && (
        <Card className="mb-6 border-l-4 border-green-500">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Share Your School ID
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Teachers and students need this ID to register and join your
                school. Share this ID with them:
              </p>
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">School ID</p>
                    <p className="text-xl font-mono font-bold text-gray-900">
                      {user.uid}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(user.uid);
                      showAlert("success", "School ID copied to clipboard!");
                    }}
                  >
                    <svg
                      className="h-4 w-4 mr-1"
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
                    Copy ID
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Teachers and students should use this exact ID during
                registration
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Teachers</p>
              <p className="text-3xl font-bold mt-2">{activeTeachers.length}</p>
              <p className="text-green-100 text-xs mt-1">
                {pendingTeachers.length} pending
              </p>
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Students</p>
              <p className="text-3xl font-bold mt-2">{activeStudents.length}</p>
              <p className="text-purple-100 text-xs mt-1">
                {pendingStudents.length} pending
              </p>
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Total Exams</p>
              <p className="text-3xl font-bold mt-2">{exams.length}</p>
              <p className="text-orange-100 text-xs mt-1">
                Created by teachers
              </p>
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Avg Score</p>
              <p className="text-3xl font-bold mt-2">{averageScore}%</p>
              <p className="text-blue-100 text-xs mt-1">
                From {results.length} results
              </p>
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {["overview", "teachers", "students", "exams", "performance"].map(
              (tab) => (
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
              ),
            )}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {pendingTeachers.length > 0 && (
            <Card
              title="Pending Teacher Approvals"
              subtitle="Review and approve teacher registrations"
              className="border-l-4 border-yellow-500"
            >
              <Table
                columns={teacherColumns}
                data={pendingTeachers}
                loading={loading}
                emptyMessage="No pending teacher approvals"
                actions={(row) => (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleApproveTeacher(row.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRejectTeacher(row.id)}
                    >
                      Reject
                    </Button>
                  </>
                )}
              />
            </Card>
          )}

          {pendingStudents.length > 0 && (
            <Card
              title="Pending Student Approvals"
              subtitle="Review and approve student registrations"
              className="border-l-4 border-purple-500"
            >
              <Table
                columns={studentColumns}
                data={pendingStudents}
                loading={loading}
                emptyMessage="No pending student approvals"
                actions={(row) => (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleApproveStudent(row.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRejectStudent(row.id)}
                    >
                      Reject
                    </Button>
                  </>
                )}
              />
            </Card>
          )}

          <Card title="Quick Stats" subtitle="School performance overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {results.length}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Active Exams</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {exams.length}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Pass Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {results.length > 0
                    ? (
                        (results.filter(
                          (r) => (r.score / r.totalQuestions) * 100 >= 50,
                        ).length /
                          results.length) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "teachers" && (
        <Card title="All Teachers" subtitle="Manage teacher accounts">
          <Table
            columns={teacherColumns}
            data={teachers}
            loading={loading}
            emptyMessage="No teachers registered"
            actions={(row) => (
              <>
                {row.status === "pending" && (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleApproveTeacher(row.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRejectTeacher(row.id)}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {row.status === "active" && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteUser(row.id, "teacher")}
                  >
                    Delete
                  </Button>
                )}
              </>
            )}
          />
        </Card>
      )}

      {activeTab === "students" && (
        <Card title="All Students" subtitle="Manage student accounts">
          <Table
            columns={studentColumns}
            data={students}
            loading={loading}
            emptyMessage="No students registered"
            actions={(row) => (
              <>
                {row.status === "pending" && (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleApproveStudent(row.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRejectStudent(row.id)}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {row.status === "active" && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteUser(row.id, "student")}
                  >
                    Delete
                  </Button>
                )}
              </>
            )}
          />
        </Card>
      )}

      {activeTab === "exams" && (
        <Card title="All Exams" subtitle="Exams created by your teachers">
          <Table
            columns={examColumns}
            data={exams}
            loading={loading}
            emptyMessage="No exams created yet"
          />
        </Card>
      )}

      {activeTab === "performance" && (
        <Card
          title="Performance Analytics"
          subtitle="Student performance overview"
        >
          {results.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h4 className="text-lg font-semibold text-green-900 mb-2">
                    Pass Rate
                  </h4>
                  <p className="text-4xl font-bold text-green-600">
                    {(
                      (results.filter(
                        (r) => (r.score / r.totalQuestions) * 100 >= 50,
                      ).length /
                        results.length) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                  <p className="text-sm text-green-700 mt-2">
                    {
                      results.filter(
                        (r) => (r.score / r.totalQuestions) * 100 >= 50,
                      ).length
                    }{" "}
                    out of {results.length} passed
                  </p>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h4 className="text-lg font-semibold text-blue-900 mb-2">
                    Average Score
                  </h4>
                  <p className="text-4xl font-bold text-blue-600">
                    {averageScore}%
                  </p>
                  <p className="text-sm text-blue-700 mt-2">Across all exams</p>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Results
                </h4>
                <div className="space-y-3">
                  {results.slice(0, 5).map((result, index) => {
                    const student = students.find(
                      (s) => s.id === result.studentId,
                    );
                    const exam = exams.find((e) => e.id === result.examId);
                    const percentage =
                      (result.score / result.totalQuestions) * 100;

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {student?.name || "Unknown Student"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {exam?.title || "Unknown Exam"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-lg font-bold ${percentage >= 50 ? "text-green-600" : "text-red-600"}`}
                          >
                            {percentage.toFixed(1)}%
                          </p>
                          <p className="text-sm text-gray-500">
                            {result.score}/{result.totalQuestions}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No exam results available yet</p>
            </div>
          )}
        </Card>
      )}

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
            
            {subscriptionSchool && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">Current Plan:</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {subscriptionSchool.planTier} Plan
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

export default SchoolDashboard;
