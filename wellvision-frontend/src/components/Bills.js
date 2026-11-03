import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Download,
  Eye,

  Filter,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import './Bills.css';
import { toast } from 'react-toastify';

function Bills() {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBills, setTotalBills] = useState(0);
  const [selectedBills, setSelectedBills] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  // Filter states
  const [dateFilter, setDateFilter] = useState('');
  const [amountFilter, setAmountFilter] = useState({ min: '', max: '' });

  useEffect(() => {
    fetchBills();
  }, [currentPage, sortBy, sortOrder, searchQuery]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        sortBy,
        sortOrder,
        search: searchQuery
      });

      const response = await fetch(`http://localhost:4000/api/invoices?${params}`, {
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        setBills(data.invoices);
        setTotalPages(data.pagination.totalPages);
        setTotalBills(data.pagination.totalInvoices);
      } else {
        toast.error('Failed to fetch bills');
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast.error('Error loading bills');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBills();
  };

  const handleSelectBill = (billId) => {
    setSelectedBills(prev =>
      prev.includes(billId)
        ? prev.filter(id => id !== billId)
        : [...prev, billId]
    );
  };

  const handleSelectAll = () => {
    setSelectedBills(
      selectedBills.length === bills.length
        ? []
        : bills.map(bill => bill._id)
    );
  };

  const handleDeleteBill = async (billId) => {
    if (!window.confirm('Are you sure you want to delete this bill?')) return;

    try {
      const response = await fetch(`http://localhost:4000/api/invoices/${billId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Bill deleted successfully');
        fetchBills();
      } else {
        toast.error('Failed to delete bill');
      }
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast.error('Error deleting bill');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedBills.length} bills?`)) return;

    try {
      await Promise.all(
        selectedBills.map(billId =>
          fetch(`http://localhost:4000/api/invoices/${billId}`, {
            method: 'DELETE',
            credentials: 'include'
          })
        )
      );
      toast.success('Bills deleted successfully');
      setSelectedBills([]);
      fetchBills();
    } catch (error) {
      console.error('Error deleting bills:', error);
      toast.error('Error deleting bills');
    }
  };

  const exportBills = () => {
    // Simple CSV export
    const headers = ['Bill No', 'Order No', 'Date', 'Name', 'Phone', 'Address', 'Amount', 'Advance', 'Balance'];
    const csvContent = [
      headers.join(','),
      ...bills.map(bill => [
        bill.billNo,
        bill.orderNo,
        new Date(bill.date).toLocaleDateString(),
        `"${bill.name}"`,
        bill.tel,
        `"${bill.address}"`,
        bill.amount,
        bill.advance,
        bill.balance
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bills-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount) => {
    return `Rs. ${parseFloat(amount).toLocaleString()}`;
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />;
  };

  return (
    <div className="bills-main-content">
      {/* Header */}
      <div className="bills-header">
        <div className="bills-header-content">
          <div className="bills-header-title">
            <h2>Bills Management</h2>
            <div className="bills-stats">
              <span className="stat-badge">Total: {totalBills}</span>
            </div>
          </div>
          <div className="bills-header-actions">
            <button className="export-btn" onClick={exportBills}>
              <Download size={16} />
              Export
            </button>
            <button
              className="add-bill-btn"
              onClick={() => navigate('/invoice')}
            >
              <Plus size={16} />
              New Bill
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bills-filters">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search bills by bill no, name, phone, order no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="search-btn">Search</button>
        </form>

        <button
          className="filter-toggle-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
          Filters
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="advanced-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label>Date:</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Min Amount:</label>
              <input
                type="number"
                value={amountFilter.min}
                onChange={(e) => setAmountFilter(prev => ({ ...prev, min: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div className="filter-group">
              <label>Max Amount:</label>
              <input
                type="number"
                value={amountFilter.max}
                onChange={(e) => setAmountFilter(prev => ({ ...prev, max: e.target.value }))}
                placeholder="10000"
              />
            </div>
          </div>
        </div>
      )}

      {/* Bills Content */}
      <div className="bills-content">
        {/* Bulk Actions */}
        {selectedBills.length > 0 && (
          <div className="bulk-actions">
            <span>{selectedBills.length} selected</span>
          </div>
        )}

        {/* Bills Table */}
        <div className="bills-table-container">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          ) : bills.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📄</div>
              <h3 className="empty-state-title">No bills found</h3>
              <p className="empty-state-description">
                {searchQuery ? 'Try adjusting your search criteria' : 'Create your first bill to get started'}
              </p>
              <button className="add-bill-btn" onClick={() => navigate('/invoice')}>
                <Plus size={16} />
                Create First Bill
              </button>
            </div>
          ) : (
            <table className="bills-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedBills.length === bills.length && bills.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th onClick={() => handleSort('billNo')} className="sortable">
                    Bill No {getSortIcon('billNo')}
                  </th>
                  <th onClick={() => handleSort('orderNo')} className="sortable">
                    Order No {getSortIcon('orderNo')}
                  </th>
                  <th onClick={() => handleSort('date')} className="sortable">
                    Date {getSortIcon('date')}
                  </th>
                  <th>Time</th>
                  <th onClick={() => handleSort('name')} className="sortable">
                    Customer {getSortIcon('name')}
                  </th>
                  <th>Phone</th>
                  <th onClick={() => handleSort('amount')} className="sortable">
                    Amount {getSortIcon('amount')}
                  </th>
                  <th>Advance</th>
                  <th>Balance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map(bill => (
                  <tr key={bill._id} className={selectedBills.includes(bill._id) ? 'selected' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedBills.includes(bill._id)}
                        onChange={() => handleSelectBill(bill._id)}
                      />
                    </td>
                    <td className="bill-no">{bill.billNo}</td>
                    <td>{bill.orderNo}</td>
                    <td>{new Date(bill.date).toLocaleDateString()}</td>
                    <td>{new Date(bill.date).toLocaleTimeString()}</td>
                    <td>{bill.name}</td>
                    <td>{bill.tel}</td>
                    <td className="amount">{formatCurrency(bill.amount)}</td>
                    <td className="amount">{formatCurrency(bill.advance)}</td>
                    <td className="amount">{formatCurrency(bill.balance)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn view-btn"
                          onClick={() => navigate(`/invoice?view=${bill._id}`)}
                          title="View Invoice"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <div className="page-numbers">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    className={`page-number ${pageNum === currentPage ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              className="page-btn"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Bills;
