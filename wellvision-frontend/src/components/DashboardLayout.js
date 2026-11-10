import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SidebarMenu from './SidebarMenu';
import './DashboardLayout.css'; // Adjust path if needed

const DashboardLayout = ({ children, activePage, onNavigate }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Every page except the home dashboard gets a Back button so users can
  // return to the page they came from (for example a customer card -> Customers).
  const showBackButton = location.pathname !== '/dashboard';

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="dashboard-layout">
      <SidebarMenu active={activePage} onNavigate={onNavigate} />
      <main className="main-content">
        {showBackButton && (
          <div className="page-back-bar">
            <button
              type="button"
              className="page-back-btn"
              onClick={handleBack}
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
              Back
            </button>
          </div>
        )}
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
