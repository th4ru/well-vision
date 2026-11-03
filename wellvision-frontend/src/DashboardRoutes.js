import React, { useContext } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext'; // Make sure path is correct

// Normal user components
import DashboardLayout from './components/DashboardLayout';
import PrivateRoute from './components/PrivateRoute';
import SalesDashboard from './components/SalesDashboard';
import CustomerDashboard from './components/CustomerDashboard';
import CustomerProfile from './components/CustomerProfile';
import WellVisionInvoice from './components/WellVisionInvoice';
import ProfilePage from './components/ProfilePage';
import DailyReports from './components/DailyReports';
import Products from './components/Products';
import Bills from './components/Bills';

import SettingsPage from './components/SettingsPage';
//import Orders from './components/OrderDashboard';

// Admin components
import AdminLayout from './admin/scenes/layout';
import AdminDashboard from './admin/scenes/dashboard';
import AdminProducts from './admin/scenes/products';
import Customers from './admin/scenes/customers';
import Transactions from './admin/scenes/transactions';
import Geography from './admin/scenes/geography';
import Overview from './admin/scenes/overview';
import Daily from './admin/scenes/daily';
import Monthly from './admin/scenes/monthly';
import Breakdown from './admin/scenes/breakdown';
import Admin from './admin/scenes/admin';
import Staff from './admin/scenes/staff';
import Performance from './admin/scenes/performance';

export default function DashboardRoutes() {
  const { user } = useContext(AuthContext); // Get logged-in user
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If admin, render admin routes (case-insensitive check)
  if (user.role && user.role.toLowerCase() === 'admin') {
    return (
      <Routes>
        <Route path="/admin/*" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="customers" element={<Customers />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="geography" element={<Geography />} />
          <Route path="overview" element={<Overview />} />
          <Route path="daily" element={<Daily />} />
          <Route path="daily-reports" element={<DailyReports />} />
          <Route path="monthly" element={<Monthly />} />
          <Route path="breakdown" element={<Breakdown />} />
          <Route path="admin" element={<Admin />} />
          <Route path="staff" element={<Staff />} />
          <Route path="performance" element={<Performance />} />

          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
      </Routes>
    );
  }

  // Otherwise, normal user routes
  const getActivePage = () => {
    if (location.pathname.startsWith('/products')) return 'products';
    if (location.pathname.startsWith('/daily-reports')) return 'daily-reports';
    if (location.pathname.startsWith('/customers')) return 'customers';
    if (location.pathname.startsWith('/customer/')) return 'customers';
    if (location.pathname.startsWith('/invoice')) return 'invoice';
    if (location.pathname.startsWith('/bills')) return 'bills';
    if (location.pathname.startsWith('/settings')) return 'settings';
    if (location.pathname.startsWith('/profile')) return 'profile';
    return 'home';
  };

  const handleNavigate = (page) => {
    switch (page) {
      case 'products':
        navigate('/products');
        break;
      case 'daily-reports':
        navigate('/daily-reports');
        break;
      case 'customers':
        navigate('/customers');
        break;
      case 'invoice':
        navigate('/invoice');
        break;
      case 'bills':
        navigate('/bills');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'home':
      default:
        navigate('/dashboard');
    }
  };

  return (
    <DashboardLayout activePage={getActivePage()} onNavigate={handleNavigate}>
      <Routes>
        <Route path="/dashboard" element={<PrivateRoute><SalesDashboard /></PrivateRoute>} />
        <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
        <Route path="/daily-reports" element={<PrivateRoute><DailyReports /></PrivateRoute>} />
        <Route path="/customers" element={<PrivateRoute><CustomerDashboard /></PrivateRoute>} />
        <Route path="/customer/:customerId" element={<PrivateRoute><CustomerProfile /></PrivateRoute>} />
        <Route path="/invoice" element={<PrivateRoute><WellVisionInvoice /></PrivateRoute>} />
        <Route path="/bills" element={<PrivateRoute><Bills /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
