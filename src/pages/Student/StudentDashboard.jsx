import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import Card from "../../components/Card";
import Table from "../../components/Table";
import Button from "../../components/Button";
import Alert from "../../components/Alert";

const StudentDashboard = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("available");
  const [alert, setAlert] = useState(null);
  const [examCode, setExamCode] = useState("");
  const [searchingExam, setSearchingExam] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStudentData();
    }
  }, [user]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      // Fetch all exams (in a real app, you'd filter by school or assigned students)
      const examsQuery = query(collection(db, "exams"));
      const examsSnapshot = await getDocs(examsQuery);
      const examsData = examsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExams(examsData);

      // Fetch student's results
      const resultsQuery = query(
        collection(db, "results"),
        where("studentId", "==", user.uid),
      );
      const resultsSnapshot = await getDocs(resultsQuery);
      const resultsData = resultsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setResults(resultsData);
    } catch (error) {
      console.error("Error fetching student data:", error);
      showAlert("error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleExamCodeSearch = async () => {
    if (!examCode.trim()) {
      showAlert("error", "Please enter an exam code");
      return;
    }

    setSearchingExam(true);
    try {
      // Search for exam by code
      const examsQuery = query(
        collection(db, "exams"),
        where("examCode", "==", examCode.toUpperCase())
      );
      const examsSnapshot = await getDocs(examsQuery);

      if (examsSnapshot.empty) {
        showAlert("error", "Exam not found. Please check the code and try again.");
        return;
      }

      const examData = examsSnapshot.docs[0];
      const examId = examData.id;

      // Check if already attempted
      if (hasAttempted(examId)) {
        showAlert("warning", "You have already taken this exam");
        return;
      }

      // Navigate to exam
      navigate(`/student/exam/${examId}`);
    } catch (error) {
      console.error("Error searching exam:", error);
      showAlert("error", "Failed to find exam. Please try again.");
    } finally {
      setSearchingExam(false);
      setExamCode("");
    }
  };

  const hasAttempted = (examId) => {
    return results.some((result) => result.examId === examId);
  };

  const getExamResult = (examId) => {
    return results.find((result) => result.examId === examId);
  };

  const calculateStats = () => {
    if (results.length === 0) {
      return {
        totalExams: 0,
        averageScore: 0,
        passRate: 0,
        totalPassed: 0,
      };
    }

    const totalExams = results.length;
    const averageScore =
      results.reduce(
        (sum, result) => sum + (result.score / result.totalQuestions) * 100,
        0,
      ) / totalExams;
    const totalPassed = results.filter(
      (r) => (r.score / r.totalQuestions) * 100 >= 50,
    ).length;
    const passRate = (totalPassed / totalExams) * 100;

    return {
      totalExams,
      averageScore: averageScore.toFixed(2),
      passRate: passRate.toFixed(1),
      totalPassed,
    };
  };

  const stats = calculateStats();

  const availableExams = exams.filter((exam) => !hasAttempted(exam.id));
  const completedExams = exams.filter((exam) => hasAttempted(exam.id));

  const examColumns = [
    { header: "Title", accessor: "title" },
    { header: "Subject", accessor: "subject" },
    {
      header: "Exam Code",
      render: (row) => (
        <code className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-mono text-sm font-bold">
          {row.examCode || row.id.substring(0, 6).toUpperCase()}
        </code>
      ),
    },
    {
      header: "Questions",
      render: (row) => row.totalQuestions || "N/A",
    },
    {
      header: "Time Limit",
      render: (row) => `${row.timeLimit} mins`,
    },
    {
      header: "Teacher",
      accessor: "teacherName",
    },
  ];

  const resultColumns = [
    {
      header: "Exam",
      render: (row) => {
        const exam = exams.find((e) => e.id === row.examId);
        return exam?.title || "Unknown";
      },
    },
    {
      header: "Subject",
      render: (row) => {
        const exam = exams.find((e) => e.id === row.examId);
        return exam?.subject || "N/A";
      },
    },
    {
      header: "Score",
      render: (row) => (
        <span className="font-semibold">
          {row.score}/{row.totalQuestions}
        </span>
      ),
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
      header: "Status",
      render: (row) => {
        const percentage = (row.score / row.totalQuestions) * 100;
        return (
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${
              percentage >= 50
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {percentage >= 50 ? "Passed" : "Failed"}
          </span>
        );
      },
    },
    {
      header: "Date",
      render: (row) => row.timestamp?.toDate().toLocaleDateString() || "N/A",
    },
  ];

  // Check if student is approved
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
            Your student account is awaiting approval from your school
            administrator. You will be able to access exams once your account is
            approved.
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
            Your student account has been rejected by your school administrator.
            Please contact your school for more information.
          </p>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout title="Student Dashboard">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
          className="mb-6"
        />
      )}

      {/* Enter Exam Code */}
      <Card className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-shrink-0">
            <div className="bg-purple-600 p-3 rounded-xl">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Have an Exam Code?
            </h3>
            <p className="text-sm text-gray-600">
              Enter the code provided by your teacher to access the exam
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              value={examCode}
              onChange={(e) => setExamCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === "Enter" && handleExamCodeSearch()}
              placeholder="Enter code (e.g., ABC123)"
              className="px-4 py-2 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-center uppercase w-full md:w-40"
              maxLength={6}
            />
            <Button
              variant="primary"
              onClick={handleExamCodeSearch}
              loading={searchingExam}
              className="bg-purple-600 hover:bg-purple-700"
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Find Exam
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">
                Available Exams
              </p>
              <p className="text-3xl font-bold mt-2">{availableExams.length}</p>
              <p className="text-blue-100 text-xs mt-1">Ready to take</p>
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
              <p className="text-green-100 text-sm font-medium">
                Exams Completed
              </p>
              <p className="text-3xl font-bold mt-2">{stats.totalExams}</p>
              <p className="text-green-100 text-xs mt-1">
                {stats.totalPassed} passed
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">
                Average Score
              </p>
              <p className="text-3xl font-bold mt-2">{stats.averageScore}%</p>
              <p className="text-purple-100 text-xs mt-1">
                Overall performance
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Pass Rate</p>
              <p className="text-3xl font-bold mt-2">{stats.passRate}%</p>
              <p className="text-orange-100 text-xs mt-1">Success rate</p>
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

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {["available", "completed", "results"].map((tab) => (
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
      {activeTab === "available" && (
        <Card
          title="Available Exams"
          subtitle="Take these exams to test your knowledge"
        >
          <Table
            columns={examColumns}
            data={availableExams}
            loading={loading}
            emptyMessage="No available exams at the moment"
            actions={(row) => (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/student/exam/${row.id}`)}
              >
                Take Exam
              </Button>
            )}
          />
        </Card>
      )}

      {activeTab === "completed" && (
        <Card title="Completed Exams" subtitle="Exams you have already taken">
          <Table
            columns={[
              ...examColumns,
              {
                header: "Your Score",
                render: (row) => {
                  const result = getExamResult(row.id);
                  if (result) {
                    const percentage =
                      (result.score / result.totalQuestions) * 100;
                    return (
                      <span
                        className={`font-semibold ${percentage >= 50 ? "text-green-600" : "text-red-600"}`}
                      >
                        {result.score}/{result.totalQuestions} (
                        {percentage.toFixed(1)}%)
                      </span>
                    );
                  }
                  return "N/A";
                },
              },
            ]}
            data={completedExams}
            loading={loading}
            emptyMessage="You haven't completed any exams yet"
          />
        </Card>
      )}

      {activeTab === "results" && (
        <div className="space-y-6">
          <Card title="Exam Results" subtitle="Your performance history">
            <Table
              columns={resultColumns}
              data={results}
              loading={loading}
              emptyMessage="No exam results yet"
            />
          </Card>

          {results.length > 0 && (
            <Card title="Performance Analysis">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                  <h4 className="text-lg font-semibold text-green-900 mb-2">
                    Passed Exams
                  </h4>
                  <p className="text-4xl font-bold text-green-600">
                    {stats.totalPassed}
                  </p>
                  <p className="text-sm text-green-700 mt-2">
                    out of {stats.totalExams} exams
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                  <h4 className="text-lg font-semibold text-blue-900 mb-2">
                    Best Score
                  </h4>
                  <p className="text-4xl font-bold text-blue-600">
                    {Math.max(
                      ...results.map((r) => (r.score / r.totalQuestions) * 100),
                    ).toFixed(1)}
                    %
                  </p>
                  <p className="text-sm text-blue-700 mt-2">
                    Your highest score
                  </p>
                </div>
              </div>

              <div className="mt-6 bg-gray-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Performance Trend
                </h4>
                <div className="space-y-3">
                  {results
                    .slice()
                    .reverse()
                    .slice(0, 5)
                    .map((result, index) => {
                      const exam = exams.find((e) => e.id === result.examId);
                      const percentage =
                        (result.score / result.totalQuestions) * 100;

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {exam?.title || "Unknown Exam"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {result.timestamp
                                ?.toDate()
                                .toLocaleDateString() || "N/A"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-2xl font-bold ${percentage >= 50 ? "text-green-600" : "text-red-600"}`}
                            >
                              {percentage.toFixed(0)}%
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
            </Card>
          )}
        </div>
      )}
    </Layout>
  );
};

export default StudentDashboard;
