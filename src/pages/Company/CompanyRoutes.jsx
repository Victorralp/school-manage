import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import CompanyDashboard from "./CompanyDashboard";
import CompanySubscriptionManagement from "./CompanySubscriptionManagement";

const CompanyRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<CompanyDashboard />} />
      <Route path="/subscription" element={<CompanySubscriptionManagement />} />
      <Route path="*" element={<Navigate to="/company" replace />} />
    </Routes>
  );
};

export default CompanyRoutes;
