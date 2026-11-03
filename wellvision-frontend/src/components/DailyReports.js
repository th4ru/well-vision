import React, { useState, useMemo, useEffect } from "react";
import './DailyReports.css';
import SidebarMenu from '../components/SidebarMenu';
import {
  Download,
  FileText,
  TrendingUp,
  Receipt,
  DollarSign,
  Calendar,
  BarChart3,
  Package
} from "lucide-react";
import { ResponsiveLine } from "@nivo/line";
import { DataGrid } from "@mui/x-data-grid";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

function DailyReports() {
  // Set default date range to current month
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [startDate, setStartDate] = useState(currentMonthStart);
  const [endDate, setEndDate] = useState(currentMonthEnd);
  const [view, setView] = useState("units");

  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch orders and invoices from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch orders
        const ordersResponse = await fetch('http://localhost:4000/api/orders', {
          credentials: 'include'
        });
        const ordersData = await ordersResponse.json();

        // Fetch invoices
        const invoicesResponse = await fetch('http://localhost:4000/api/invoices', {
          credentials: 'include'
        });
        const invoicesData = await invoicesResponse.json();

        if (ordersData.success && invoicesData.success) {
          setOrders(ordersData.data);
          setInvoices(invoicesData.invoices);
        } else {
          setError('Failed to fetch data');
        }
      } catch (err) {
        setError('Error fetching data');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group orders and invoices by date and calculate daily metrics
  const dailyData = useMemo(() => {
    const grouped = {};

    // Process orders for totalSales (sum of quantities), totalOrders (count), totalUnits (sum of quantities per day)
    orders.forEach(order => {
      const dateKey = new Date(order.placedAt).toISOString().split('T')[0]; // YYYY-MM-DD format
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          totalSales: 0,
          totalUnits: 0,
          totalOrders: 0,
          revenue: 0
        };
      }
      const orderQuantities = order.items.reduce((sum, item) => sum + item.quantity, 0);
      grouped[dateKey].totalSales += orderQuantities; // Sum of quantities in order
      grouped[dateKey].totalUnits += orderQuantities; // Same as totalSales for daily
      grouped[dateKey].totalOrders += 1;
    });

    // Process invoices for revenue
    invoices.forEach(invoice => {
      const dateKey = new Date(invoice.date).toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          totalSales: 0,
          totalUnits: 0,
          totalOrders: 0,
          revenue: 0
        };
      }
      grouped[dateKey].revenue += invoice.amount;
    });

    return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [orders, invoices]);

  // Filter data based on date range
  const filteredData = useMemo(() => {
    return dailyData.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }, [dailyData, startDate, endDate]);

  // Data for graph - always show current month
  const currentMonthData = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return dailyData.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= monthStart && itemDate <= monthEnd;
    });
  }, [dailyData]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalSales = filteredData.reduce((sum, item) => sum + item.totalSales, 0);
    const totalOrders = filteredData.reduce((sum, item) => sum + item.totalOrders, 0);
    const totalRevenue = filteredData.reduce((sum, item) => sum + item.revenue, 0);
    const avgDailySales = filteredData.length > 0 ? totalSales / filteredData.length : 0;
    const avgDailyRevenue = filteredData.length > 0 ? totalRevenue / filteredData.length : 0;

    // Total units all time (sum of all quantities from all orders)
    const totalUnitsAllTime = orders.reduce((sum, order) =>
      sum + order.items.reduce((s, item) => s + item.quantity, 0), 0);

    return {
      totalSales,
      totalOrders,
      totalRevenue,
      totalUnitsAllTime,
      avgDailySales: Math.round(avgDailySales),
      avgDailyRevenue: Math.round(avgDailyRevenue),
    };
  }, [filteredData, orders]);

  // Prepare chart data - show data based on selected date range
  const formattedData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return [];
    }

    let cumulativeUnits = 0;
    const unitsLine = {
      id: "Cumulative Units",
      color: "#0d9488",
      data: filteredData.map((item) => {
        cumulativeUnits += item.totalUnits;
        return {
          x: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          y: cumulativeUnits,
        };
      }),
    };

    let cumulativeRevenue = 0;
    const revenueLine = {
      id: "Cumulative Revenue",
      color: "#14b8a6",
      data: filteredData.map((item) => {
        cumulativeRevenue += item.revenue;
        return {
          x: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          y: cumulativeRevenue,
        };
      }),
    };

    return view === "units" ? [unitsLine] : [revenueLine];
  }, [filteredData, view]);

  // Data grid columns
  const columns = [
    {
      field: "date",
      headerName: "Date",
      width: 150,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: "totalUnits",
      headerName: "Total Units",
      width: 150,
      type: "number",
    },
    {
      field: "totalOrders",
      headerName: "Total Orders",
      width: 150,
      type: "number",
    },
    {
      field: "revenue",
      headerName: "Revenue (Rs.)",
      width: 180,
      type: "number",
      valueFormatter: (params) => `Rs. ${params.value.toLocaleString()}`,
    },
  ];

  // Export functions
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Reports");
    XLSX.writeFile(workbook, "daily-reports.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Daily Reports", 20, 10);

    const tableData = filteredData.map((item) => [
      new Date(item.date).toLocaleDateString(),
      item.totalUnits,
      item.totalOrders,
      `Rs. ${item.revenue.toLocaleString()}`,
    ]);

    doc.autoTable({
      head: [["Date", "Total Units", "Total Orders", "Revenue"]],
      body: tableData,
      startY: 20,
    });

    doc.save("daily-reports.pdf");
  };

  return (
    <div className="reports-page">
      <SidebarMenu active="daily-reports" />
      
      <div className="reports-main-content">
        {/* Header */}
        <div className="reports-header">
          <div className="reports-header-content">
            <div className="reports-header-title">
              <h2>Daily Reports</h2>
              <p className="reports-subtitle">Comprehensive daily sales and performance analytics</p>
            </div>
            <div className="reports-header-actions">
              <button className="export-btn" onClick={exportToExcel} title="Export to Excel">
                <Download size={16} />
                Excel
              </button>
              <button className="export-btn" onClick={exportToPDF} title="Export to PDF">
                <FileText size={16} />
                PDF
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="reports-content">
          {/* Summary Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#DBEAFE' }}>
                <TrendingUp size={24} style={{ color: '#1E40AF' }} />
              </div>
              <div className="stat-details">
                <p className="stat-label">Total Units (Month)</p>
                <h3 className="stat-value">{summaryStats.totalSales.toLocaleString()}</h3>
                <p className="stat-change positive">+12% from last period</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#DCFCE7' }}>
                <DollarSign size={24} style={{ color: '#166534' }} />
              </div>
              <div className="stat-details">
                <p className="stat-label">Total Revenue</p>
                <h3 className="stat-value">LKR {summaryStats.totalRevenue.toLocaleString()}</h3>
                <p className="stat-change positive">+8% from last period</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#FEF3C7' }}>
                <Receipt size={24} style={{ color: '#92400E' }} />
              </div>
              <div className="stat-details">
                <p className="stat-label">Total Orders</p>
                <h3 className="stat-value">{summaryStats.totalOrders.toLocaleString()}</h3>
                <p className="stat-change positive">+15% from last period</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#F3E8FF' }}>
                <Calendar size={24} style={{ color: '#6D28D9' }} />
              </div>
              <div className="stat-details">
                <p className="stat-label">Daily Average</p>
                <h3 className="stat-value">Rs. {summaryStats.avgDailyRevenue.toLocaleString()}</h3>
                <p className="stat-change">Avg. per day</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#E0F2F1' }}>
                <Package size={24} style={{ color: '#0d9488' }} />
              </div>
              <div className="stat-details">
                <p className="stat-label">Total Units (All Time)</p>
                <h3 className="stat-value">{summaryStats.totalUnitsAllTime.toLocaleString()}</h3>
                <p className="stat-change">Units sold</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#FFF7ED' }}>
                <BarChart3 size={24} style={{ color: '#EA580C' }} />
              </div>
              <div className="stat-details">
                <p className="stat-label">Avg. Sales/Day</p>
                <h3 className="stat-value">{summaryStats.avgDailySales.toLocaleString()}</h3>
                <p className="stat-change">Daily average</p>
              </div>
            </div>
          </div>

          {/* Controls & Filters */}
          <div className="reports-controls">
            <div className="date-filters">
              <div className="date-picker-group">
                <label className="date-label">Start Date</label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  dateFormat="yyyy-MM-dd"
                  className="date-picker-input"
                />
              </div>
              <div className="date-picker-group">
                <label className="date-label">End Date</label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  dateFormat="yyyy-MM-dd"
                  className="date-picker-input"
                />
              </div>
            </div>

            <div className="view-toggle">
              <button
                className={`toggle-btn ${view === 'units' ? 'active' : ''}`}
                onClick={() => setView('units')}
              >
                Units
              </button>
              <button
                className={`toggle-btn ${view === 'revenue' ? 'active' : ''}`}
                onClick={() => setView('revenue')}
              >
                Revenue
              </button>
            </div>
          </div>

          {/* Chart */}
          <div className="chart-container">
            <h3 className="section-title">
              {view === 'units' ? 'Units Sold Trend' : 'Revenue Trend'}
            </h3>
            {formattedData.length > 0 ? (
              <div className="chart-wrapper">
                <ResponsiveLine
                  data={formattedData}
                  theme={{
                    axis: {
                      domain: {
                        line: {
                          stroke: "#9ca3af",
                          strokeWidth: 1,
                        },
                      },
                      legend: {
                        text: {
                          fill: "#6b7280",
                          fontSize: 14,
                          fontWeight: 600,
                        },
                      },
                      ticks: {
                        line: {
                          stroke: "#9ca3af",
                          strokeWidth: 1,
                        },
                        text: {
                          fill: "#6b7280",
                          fontSize: 12,
                        },
                      },
                    },
                    legends: {
                      text: {
                        fill: "#6b7280",
                        fontSize: 13,
                      },
                    },
                    tooltip: {
                      container: {
                        background: "white",
                        color: "#1f2937",
                        fontSize: 13,
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                        padding: "12px",
                      },
                    },
                    grid: {
                      line: {
                        stroke: "#e5e7eb",
                        strokeWidth: 1,
                      },
                    },
                  }}
                  colors={{ datum: "color" }}
                  margin={{ top: 50, right: 110, bottom: 80, left: 80 }}
                  xScale={{ type: "point" }}
                  yScale={{
                    type: "linear",
                    min: 0,
                    max: "auto",
                    stacked: false,
                    reverse: false,
                  }}
                  yFormat=" >-.0f"
                  curve="catmullRom"
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    orient: "bottom",
                    tickSize: 5,
                    tickPadding: 10,
                    tickRotation: -45,
                    legend: "Date",
                    legendOffset: 70,
                    legendPosition: "middle",
                  }}
                  axisLeft={{
                    orient: "left",
                    tickValues: 5,
                    tickSize: 5,
                    tickPadding: 10,
                    tickRotation: 0,
                    legend: `Total ${view === "units" ? "Units" : "Revenue"}`,
                    legendOffset: -70,
                    legendPosition: "middle",
                  }}
                  enableGridX={false}
                  enableGridY={true}
                  pointSize={8}
                  pointColor={{ theme: "background" }}
                  pointBorderWidth={2}
                  pointBorderColor={{ from: "serieColor" }}
                  pointLabelYOffset={-12}
                  useMesh={true}
                  legends={[
                    {
                      anchor: "bottom-right",
                      direction: "column",
                      justify: false,
                      translateX: 100,
                      translateY: 0,
                      itemsSpacing: 0,
                      itemDirection: "left-to-right",
                      itemWidth: 80,
                      itemHeight: 20,
                      itemOpacity: 0.75,
                      symbolSize: 12,
                      symbolShape: "circle",
                      symbolBorderColor: "rgba(0, 0, 0, .5)",
                      effects: [
                        {
                          on: "hover",
                          style: {
                            itemBackground: "rgba(0, 0, 0, .03)",
                            itemOpacity: 1,
                          },
                        },
                      ],
                    },
                  ]}
                />
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <h3 className="empty-state-title">No data available</h3>
                <p className="empty-state-description">
                  No data available for the selected date range
                </p>
              </div>
            )}
          </div>

          {/* Data Table */}
          <div className="data-table-container">
            <h3 className="section-title">Detailed Report</h3>
            <div className="data-table-wrapper">
              <DataGrid
                rows={filteredData.map((item, index) => ({ ...item, id: index }))}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                disableSelectionOnClick
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-root': {
                    border: 'none',
                  },
                  '& .MuiDataGrid-cell': {
                    borderBottom: '1px solid #e5e7eb',
                    color: '#1f2937',
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: '#f9fafb',
                    color: '#1f2937',
                    borderBottom: '2px solid #e5e7eb',
                    fontWeight: 600,
                  },
                  '& .MuiDataGrid-footerContainer': {
                    backgroundColor: '#f9fafb',
                    borderTop: '1px solid #e5e7eb',
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DailyReports;