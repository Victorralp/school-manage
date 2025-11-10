import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import TeacherDashboard from "./TeacherDashboard";
import SchoolSubscriptionSettings from "./SchoolSubscriptionSettings";

const TeacherRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<TeacherDashboard />} />
      <Route path="/subscription" element={<SchoolSubscriptionSettings />} />
      <Route path="*" element={<Navigate to="/teacher" replace />} />
    </Routes>
  );
};

export default TeacherRoutes;
