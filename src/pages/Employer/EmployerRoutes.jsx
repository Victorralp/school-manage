import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import EmployerDashboard from "./EmployerDashboard";
import SchoolSubscriptionSettings from "./SchoolSubscriptionSettings";

const EmployerRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<EmployerDashboard />} />
      <Route path="/subscription" element={<SchoolSubscriptionSettings />} />
      <Route path="*" element={<Navigate to="/employer" replace />} />
    </Routes>
  );
};

export default EmployerRoutes;
