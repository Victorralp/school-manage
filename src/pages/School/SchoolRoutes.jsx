import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import SchoolDashboard from "./SchoolDashboard";
import SchoolSubscriptionManagement from "./SchoolSubscriptionManagement";

const SchoolRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<SchoolDashboard />} />
      <Route path="/subscription" element={<SchoolSubscriptionManagement />} />
      <Route path="*" element={<Navigate to="/school" replace />} />
    </Routes>
  );
};

export default SchoolRoutes;
