// SalesDashboard.js
import React, { useState, useMemo, useEffect } from 'react';
import { Check } from 'lucide-react';
import './SalesDashboard.css';

// Currency formatter for Sri Lankan Rupees
const currencyFormatter = new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
});

export default function SalesDashboard({ onNavigate }) {
  const [invoices, setInvoices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Fetch invoices from backend
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/invoices?page=1&limit=1000', {
          credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
          setInvoices(data.invoices || []);
        } else {
          setError(data.message || 'Failed to fetch invoices');
        }
      } catch (err) {
        setError('Error fetching invoices');
        console.error('Fetch invoices error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  // Fetch orders ready for customer collection
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/orders', {
          credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
          // Filter orders that are ready for customer and not yet collected
          const readyOrders = data.data.filter(order => order.status === 'Ready for Customer' && !order.collected);
          setOrders(readyOrders);
        }
      } catch (err) {
        console.error('Fetch orders error:', err);
      }
    };

    fetchOrders();
  }, []);

  // Handle marking order as collected
  const handleMarkAsCollected = async (orderId) => {
    if (!window.confirm('Are you sure you want to mark this order as collected?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:4000/api/orders/${orderId}/collect`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        // Remove the order from the list
        setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
        // Show success notification
        setNotifications(prev => [...prev, { type: 'success', message: 'Order marked as collected successfully!' }]);
        setTimeout(() => setNotifications(prev => prev.slice(1)), 3000);
      } else {
        setNotifications(prev => [...prev, { type: 'error', message: data.message || 'Failed to mark order as collected' }]);
        setTimeout(() => setNotifications(prev => prev.slice(1)), 3000);
      }
    } catch (err) {
      console.error('Mark as collected error:', err);
      setNotifications(prev => [...prev, { type: 'error', message: 'Error marking order as collected' }]);
      setTimeout(() => setNotifications(prev => prev.slice(1)), 3000);
    }
  };

  // Group invoices by date and calculate daily totals
  const dailySalesData = useMemo(() => {
    const grouped = invoices.reduce((acc, invoice) => {
      const dateKey = new Date(invoice.date).toISOString().split('T')[0]; // YYYY-MM-DD format
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          totalAmount: 0,
          invoiceCount: 0
        };
      }
      acc[dateKey].totalAmount += invoice.amount;
      acc[dateKey].invoiceCount += 1;
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [invoices]);

  // Calculate totals and percentages
  const calculations = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthData = dailySalesData.filter(item => {
      const date = new Date(item.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const lastMonthData = dailySalesData.filter(item => {
      const date = new Date(item.date);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    });

    const todayData = dailySalesData.find(item => item.date === today);
    const yesterdayData = dailySalesData.find(item => item.date === yesterdayStr);

    const totalSalesAmount = dailySalesData.reduce((sum, item) => sum + item.totalAmount, 0);
    const currentMonthTotal = currentMonthData.reduce((sum, item) => sum + item.totalAmount, 0);
    const lastMonthTotal = lastMonthData.reduce((sum, item) => sum + item.totalAmount, 0);
    const todayTotal = todayData ? todayData.totalAmount : 0;
    const yesterdayTotal = yesterdayData ? yesterdayData.totalAmount : 0;

    const salesAmountChange = lastMonthTotal > 0 ? ((totalSalesAmount - lastMonthTotal) / lastMonthTotal) * 100 : 0;
    const salesAccountChange = lastMonthTotal > 0 ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
    const todayChange = yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : 0;

    return {
      totalSalesAmount,
      currentMonthTotal,
      salesAmountChange,
      salesAccountChange,
      todayChange
    };
  }, [dailySalesData]);

  // Prepare chart data for daily sales
  const chartData = useMemo(() => {
    if (!dailySalesData || dailySalesData.length === 0) {
      return [];
    }

    return [
      {
        id: "Daily Sales",
        color: "#0d9488",
        data: dailySalesData.map((item) => ({
          x: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          y: item.totalAmount,
        })),
      },
    ];
  }, [dailySalesData]);

  const formatCurrency = amount => currencyFormatter.format(amount);

  const formatPercentage = (change) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="main-content" role="main">
        <div className="loading">Loading sales data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-content" role="main">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="main-content" role="main">
      <div className="header">
        <div className="header-content">
          <div className="header-title" aria-label="Sales Dashboard Title">
            <h2>My Sales</h2>
          </div>
        </div>
      </div>

      <div className="content-area">
        {/* Sales Metrics */}
        <div className="sales-metrics" aria-label="Sales summary metrics">
          <div className="metric-card sales-amount">
            <div className="metric-value">{formatCurrency(calculations.totalSalesAmount)}</div>
            <div className="metric-label">Total Sales Amount</div>
            <div className={`metric-change ${calculations.salesAmountChange >= 0 ? 'positive' : 'negative'}`} aria-live="polite">
              {formatPercentage(calculations.salesAmountChange)} from last month
            </div>
          </div>
          <div className="metric-card sales-account">
            <div className="metric-value">{formatCurrency(calculations.currentMonthTotal)}</div>
            <div className="metric-label">Sales Account (Current Month)</div>
            <div className={`metric-change ${calculations.salesAccountChange >= 0 ? 'positive' : 'negative'}`} aria-live="polite">
              {formatPercentage(calculations.salesAccountChange)} from last month
            </div>
          </div>
        </div>



        {/* Orders Ready for Collection */}
        <div className="sales-section">
          <h3 className="section-title">Orders Ready for Collection</h3>
          <div className="table-container" role="table" aria-label="Orders ready for collection table">
            <table className="sales-table">
              <thead>
                <tr>
                  <th scope="col">Order Number</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Order Date</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>{order.orderNumber || order.orderId || order._id}</td>
                    <td>{order.customerName || 'N/A'}</td>
                    <td>{new Date(order.createdAt || order.date).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="action-btn collected-btn"
                        onClick={() => handleMarkAsCollected(order._id)}
                        title="Mark as Collected"
                      >
                        <Check size={16} />
                        Mark as Collected
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {orders.length === 0 && (
              <div className="no-results" role="alert" aria-live="assertive">
                <p>No orders ready for collection.</p>
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="notifications">
            {notifications.map((notification, index) => (
              <div key={index} className={`notification ${notification.type}`}>
                {notification.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
