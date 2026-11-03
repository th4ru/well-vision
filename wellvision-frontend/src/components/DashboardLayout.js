import React from 'react';
import SidebarMenu from './SidebarMenu';
import './DashboardLayout.css'; // Adjust path if needed

const DashboardLayout = ({ children, activePage, onNavigate }) => {
  return (
    <div className="dashboard-layout">
      <SidebarMenu active={activePage} onNavigate={onNavigate} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
