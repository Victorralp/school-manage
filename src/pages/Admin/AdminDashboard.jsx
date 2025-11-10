import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import Layout from "../../components/Layout";
import Card from "../../components/Card";
import Table from "../../components/Table";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import Alert from "../../components/Alert";

const AdminDashboard = () => {
  const [schools, setSchools] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch pending schools
      const schoolsQuery = query(collection(db, "schools"));
      const schoolsSnapshot = await getDocs(schoolsQuery);
      const schoolsData = schoolsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSchools(schoolsData);

      // Fetch all users
      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setTeachers(usersData.filter((user) => user.role === "teacher"));
      setStudents(usersData.filter((user) => user.role === "student"));

      // Fetch exams
      const examsQuery = query(collection(db, "exams"));
      const examsSnapshot = await getDocs(examsQuery);
      const examsData = examsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExams(examsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      showAlert("error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleApproveSchool = async (schoolId) => {
    try {
      await updateDoc(doc(db, "schools", schoolId), { status: "active" });
      await updateDoc(doc(db, "users", schoolId), { status: "active" });
      showAlert("success", "School approved successfully");
      fetchAllData();
    } catch (error) {
      console.error("Error approving school:", error);
      showAlert("error", "Failed to approve school");
    }
  };

  const handleRejectSchool = async (schoolId) => {
    try {
      await updateDoc(doc(db, "schools", schoolId), { status: "rejected" });
      await updateDoc(doc(db, "users", schoolId), { status: "rejected" });
      showAlert("success", "School rejected");
      fetchAllData();
    } catch (error) {
      console.error("Error rejecting school:", error);
      showAlert("error", "Failed to reject school");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteDoc(doc(db, "users", userId));
        showAlert("success", "User deleted successfully");
        fetchAllData();
      } catch (error) {
        console.error("Error deleting user:", error);
        showAlert("error", "Failed to delete user");
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

  const schoolColumns = [
    { header: "School Name", accessor: "name" },
    {
      header: "Admin Name",
      render: (row) => row.adminName || "N/A",
    },
    { header: "Email", accessor: "email" },
    {
      header: "Status",
      render: (row) => getStatusBadge(row.status),
    },
    {
      header: "Created Date",
      render: (row) => row.createdAt?.toDate().toLocaleDateString() || "N/A",
    },
  ];

  const teacherColumns = [
    { header: "Name", accessor: "name" },
    { header: "Email", accessor: "email" },
    { header: "School ID", accessor: "schoolId" },
    {
      header: "Status",
      render: (row) => getStatusBadge(row.status),
    },
  ];

  const studentColumns = [
    { header: "Name", accessor: "name" },
    { header: "Email", accessor: "email" },
    { header: "School ID", accessor: "schoolId" },
    {
      header: "Status",
      render: (row) => getStatusBadge(row.status),
    },
  ];

  const examColumns = [
    { header: "Title", accessor: "title" },
    { header: "Subject", accessor: "subject" },
    {
      header: "Time Limit",
      render: (row) => `${row.timeLimit} mins`,
    },
    { header: "Teacher ID", accessor: "teacherId" },
  ];

  const pendingSchools = schools.filter((s) => s.status === "pending");
  const activeSchools = schools.filter((s) => s.status === "active");
  const totalExams = exams.length;

  return (
    <Layout title="Admin Dashboard">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
          className="mb-6"
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Schools</p>
              <p className="text-3xl font-bold mt-2">{schools.length}</p>
              <p className="text-blue-100 text-xs mt-1">
                {pendingSchools.length} pending approval
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">
                Total Teachers
              </p>
              <p className="text-3xl font-bold mt-2">{teachers.length}</p>
              <p className="text-green-100 text-xs mt-1">Across all schools</p>
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
              <p className="text-purple-100 text-sm font-medium">
                Total Students
              </p>
              <p className="text-3xl font-bold mt-2">{students.length}</p>
              <p className="text-purple-100 text-xs mt-1">
                Registered students
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
              <p className="text-3xl font-bold mt-2">{totalExams}</p>
              <p className="text-orange-100 text-xs mt-1">Created exams</p>
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
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {["overview", "schools", "teachers", "students", "exams"].map(
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
          {pendingSchools.length > 0 && (
            <Card
              title="Pending School Approvals"
              className="border-l-4 border-yellow-500"
            >
              <Table
                columns={schoolColumns}
                data={pendingSchools}
                loading={loading}
                emptyMessage="No pending school approvals"
                actions={(row) => (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleApproveSchool(row.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRejectSchool(row.id)}
                    >
                      Reject
                    </Button>
                  </>
                )}
              />
            </Card>
          )}

          <Card title="Recent Activity" subtitle="Latest system activities">
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg
                      className="h-5 w-5 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    System Activity
                  </p>
                  <p className="text-sm text-gray-500">
                    Monitor all activities from the respective tabs
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "schools" && (
        <Card title="All Schools" subtitle="Manage school registrations">
          <Table
            columns={schoolColumns}
            data={schools}
            loading={loading}
            emptyMessage="No schools registered"
            actions={(row) => (
              <>
                {row.status === "pending" && (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleApproveSchool(row.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRejectSchool(row.id)}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {row.status === "active" && (
                  <Button
                    variant="warning"
                    size="sm"
                    onClick={() => handleRejectSchool(row.id)}
                  >
                    Deactivate
                  </Button>
                )}
              </>
            )}
          />
        </Card>
      )}

      {activeTab === "teachers" && (
        <Card title="All Teachers" subtitle="View all registered teachers">
          <Table
            columns={teacherColumns}
            data={teachers}
            loading={loading}
            emptyMessage="No teachers registered"
            actions={(row) => (
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeleteUser(row.id)}
              >
                Delete
              </Button>
            )}
          />
        </Card>
      )}

      {activeTab === "students" && (
        <Card title="All Students" subtitle="View all registered students">
          <Table
            columns={studentColumns}
            data={students}
            loading={loading}
            emptyMessage="No students registered"
            actions={(row) => (
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeleteUser(row.id)}
              >
                Delete
              </Button>
            )}
          />
        </Card>
      )}

      {activeTab === "exams" && (
        <Card title="All Exams" subtitle="View all created exams">
          <Table
            columns={examColumns}
            data={exams}
            loading={loading}
            emptyMessage="No exams created"
          />
        </Card>
      )}
    </Layout>
  );
};

export default AdminDashboard;
