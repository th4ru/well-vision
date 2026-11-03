import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import SendVerifyOtp from './components/SendVerifyOtp';
import VerifyOtp from './components/VerifyEmail';

import Order from './components/OrderDashboard'; // New import
import DashboardRoutes from './DashboardRoutes'; // ✅ use the correct one

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/send-verify-otp" element={<SendVerifyOtp />} />
        <Route path="/verify-email" element={<VerifyOtp />} />

        {/*staff only route */}
        <Route path="/orders" element={<Order />} />
        {/* Protected Dashboard Routes */}
        <Route path="/*" element={<DashboardRoutes />} />
      </Routes>
    </Router>
  );
}