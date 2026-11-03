import React, { useState, useEffect, useRef, useContext } from 'react';
import './SidebarMenu.css';
import {
  Home,
  BarChart3,
  Users,
  Package,
  FileText,
  CreditCard,
  Settings,
  User,
  LogOut,
  Logs,
  ChevronDown,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function SidebarMenu({ active = 'home' }) {
  const { user, logoutUser } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [notifications, setNotifications] = useState({
    orders: 0,
    lowStock: 0
  });
  const sidebarRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch real-time notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Fetch pending orders count
        const ordersResponse = await fetch('http://localhost:4000/api/orders/pending', {
          credentials: 'include'
        });
        const ordersData = await ordersResponse.json();
        const pendingOrders = ordersData.success ? ordersData.orders.length : 0;

        // Fetch low stock products count
        const productsResponse = await fetch('http://localhost:4000/api/products/low-stock', {
          credentials: 'include'
        });
        const productsData = await productsResponse.json();
        const lowStockCount = productsData.success ? productsData.products.length : 0;

        setNotifications({
          orders: pendingOrders,
          lowStock: lowStockCount
        });
      } catch (error) {
        console.error('Error fetching notifications:', error);
        // Keep default values on error
      }
    };

    fetchNotifications();

    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  // Enhanced menu items with nested navigation and icons
  const menuItems = [
    { 
      label: 'Dashboard', 
      icon: <Home />, 
      key: 'home',
      path: '/dashboard',
      description: 'Overview & Analytics'
    },
    { 
      label: 'Daily Reports', 
      icon: <BarChart3 />, 
      key: 'daily-reports',
      path: '/daily-reports',
      description: 'Sales & Performance'
    },
    { 
      label: 'Customers', 
      icon: <Users />, 
      key: 'customers',
      path: '/customers',
      description: 'Customer Management'
    },
    {
      label: 'Products',
      icon: <Package />,
      key: 'products',
      path: '/products',
      description: 'Inventory & Stock'
    },
    { 
      label: 'Invoices', 
      icon: <FileText />, 
      key: 'invoice',
      path: '/invoice',
      description: 'Invoice Management'
    },
    { 
      label: 'Bills', 
      icon: <CreditCard />, 
      key: 'bills',
      path: '/bills',
      description: 'Payment Tracking'
    },
    {
      label: 'Orders',
      icon: <Logs />,
      key: 'orders',
      path: '/orders',
      description: 'Order Processing'
    },

  ];

  const generalItems = [
    { 
      label: 'Settings', 
      icon: <Settings />, 
      key: 'settings',
      path: '/settings',
      description: 'System Configuration'
    },
    { 
      label: 'Profile', 
      icon: <User />, 
      key: 'profile',
      path: '/profile',
      description: 'Your Account'
    }
  ];

  // Determine active menu based on current path
  useEffect(() => {
    const currentPath = location.pathname;
    const activeItem = [...menuItems, ...generalItems].find(
      item => item.path === currentPath
    );
    if (activeItem) {
      // Could update parent component's active state here if needed
    }
  }, [location.pathname]);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (window.innerWidth < 768 && isOpen && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Handle responsive behavior
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    }
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavigation = (path, key) => {
    navigate(path);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const onKeyDown = (e, path) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(path);
      if (window.innerWidth < 768) {
        setIsOpen(false);
      }
    }
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const renderBadge = (badge, badgeType) => {
    if (!badge) return null;
    
    const badgeStyles = {
      info: { backgroundColor: '#3b82f6', color: 'white' },
      warning: { backgroundColor: '#f59e0b', color: 'white' },
      success: { backgroundColor: '#10b981', color: 'white' },
      error: { backgroundColor: '#ef4444', color: 'white' }
    };

    return (
      <span 
        className="menu-badge"
        style={badgeStyles[badgeType] || badgeStyles.info}
      >
        {badge}
      </span>
    );
  };

  const renderNavItems = (items) =>
    items.map((item) => (
      <div
        key={item.key}
        className={`menu-item ${isActiveRoute(item.path) ? 'active' : ''}`}
        onClick={() => handleNavigation(item.path, item.key)}
        role="link"
        tabIndex={0}
        aria-current={isActiveRoute(item.path) ? 'page' : undefined}
        onKeyDown={(e) => onKeyDown(e, item.path)}
        title={item.description}
      >
        <span className="menu-icon">{item.icon}</span>
        <span className="menu-label-text">{item.label}</span>
        {item.badge && renderBadge(item.badge, item.badgeType)}
      </div>
    ));

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logoutUser();
      navigate('/login');
    }
  };

  const getStatusColor = () => {
    // Could integrate with actual online status
    return '#10b981'; // green for online
  };

  return (
    <>
      <button
        className="sidebar-toggle"
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        ☰
      </button>

      {/* Overlay for mobile */}
      {isOpen && window.innerWidth < 768 && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <nav
        className={`sidebar ${isOpen ? 'open' : 'closed'}`}
        ref={sidebarRef}
        role="navigation"
        aria-label="Main sidebar navigation"
      >
        <div className="sidebar-logo">
          <img src="/Logo White.png" alt="Well Vision Logo" className="logo-icon" />
          <div className="logo-text">
            <h1>Well Vision</h1>
            <p>Spectacle Shop System</p>
          </div>
        </div>

        <div className="sidebar-menu">
          <div className="menu-section">
            <p className="menu-label">
              <TrendingUp size={14} />
              MAIN MENU
            </p>
            <div className="menu-nav">{renderNavItems(menuItems)}</div>
          </div>

          <div className="menu-section">
            <p className="menu-label">
              <Settings size={14} />
              GENERAL
            </p>
            <div className="menu-nav">{renderNavItems(generalItems)}</div>
          </div>

          <div className="menu-section">
            <p className="menu-label">
              <LogOut size={14} />
              ACCOUNT
            </p>
            <div
              className="menu-item logout-item"
              onClick={handleLogout}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleLogout();
                }
              }}
            >
              <span className="menu-icon"><LogOut /></span>
              <span className="menu-label-text">Logout</span>
            </div>
          </div>
        </div>

        <div
          className="user-profile"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/profile')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/profile');
            }
          }}
          aria-label="Open profile"
        >
          <div className="user-profile-content">
            <div className="user-avatar-wrapper">
              <div className="user-avatar">{getInitials(user?.name)}</div>
              <span 
                className="status-indicator" 
                style={{ backgroundColor: getStatusColor() }}
                title="Online"
              />
            </div>
            <div className="user-info">
              <p className="user-name">{user?.name || 'User'}</p>
              <p className="user-email">{user?.email || 'user@example.com'}</p>
              <p className="user-role">{user?.role || 'Administrator'}</p>
            </div>
          </div>
        </div>

        {/* Quick Stats Footer */}
        <div className="sidebar-footer">
          <div className="quick-stat">
            <AlertCircle size={14} />
            <span>{notifications.lowStock} Low Stock Items</span>
          </div>
        </div>
      </nav>
    </>
  );
}