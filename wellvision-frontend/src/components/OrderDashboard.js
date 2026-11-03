import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Oders.css';
import SidebarMenu from './SidebarMenu';
import {
  Plus,
  Download,
  Search,
  Edit2,
  Trash2,
  X,
  Eye,
  Package,
  Minus,
  ShoppingCart
} from 'lucide-react';

function Orders() {
  const navigate = useNavigate();
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // 'view', 'edit', or 'add'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Add order form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [orderForm, setOrderForm] = useState(() => {
    // Restore form data from localStorage if available
    const savedForm = localStorage.getItem('orderFormData');
    return savedForm ? JSON.parse(savedForm) : {
      orderNumber: '',
      customerName: '',
      customerEmail: '',
      items: [],
      notes: ''
    };
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Order statuses
  const orderStatuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'Order Received', label: 'Order Received' },
    { value: 'Order Placed in Lab', label: 'Order Placed in Lab' },
    { value: 'In Lab Processing', label: 'In Lab Processing' },
    { value: 'Transit to Shop', label: 'Transit to Shop' },
    { value: 'Ready for Customer', label: 'Ready for Customer' },
    { value: 'Customer Collected', label: 'Customer Collected' }
  ];

  // Notification functions
  const showNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Fetch orders and products from backend
  useEffect(() => {
    const fetchOrders = async () => {
      try {
      const response = await fetch('http://localhost:4000/api/orders', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      const data = await response.json();

        if (data.success) {
          // Transform backend data to match frontend structure
          const transformedOrders = data.data.map(order => ({
            _id: order._id,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customer: order._id, // Use order ID as customer reference
            placedAt: order.placedAt,
            status: order.status,
            total: order.total,
            items: order.items.map(item => ({
              product: item.description || item.sku,
              quantity: item.quantity,
              price: item.unitPrice
            })),
            notes: order.customerEmail || ''
          }));
          setOrders(transformedOrders);
          setFilteredOrders(transformedOrders);

          // Calculate status counts
          const counts = {};
          transformedOrders.forEach(order => {
            counts[order.status] = (counts[order.status] || 0) + 1;
          });
          setStatusCounts(counts);
        } else {
          console.error('Failed to fetch orders:', data.message);
          // Fallback to sample data if API fails
          setOrders([]);
          setFilteredOrders([]);
          setStatusCounts({});
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        // Fallback to sample data if API fails
        setOrders([]);
        setFilteredOrders([]);
        setStatusCounts({});
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // Check if products were selected from the products page
    if (location.state?.selectedProducts) {
      const selectedItems = location.state.selectedProducts.map(item => ({
        productId: item.productId,
        sku: item.sku,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }));

      // Merge newly selected items into existing ones without creating duplicates.
      // If the same product is selected again, we just bump its quantity.
      setOrderForm(prev => {
        const updatedItems = [...prev.items];

        selectedItems.forEach(newItem => {
          const existingIndex = updatedItems.findIndex(existingItem => {
            if (existingItem.productId && newItem.productId) {
              return existingItem.productId === newItem.productId;
            }
            return (
              existingItem.description === newItem.description &&
              existingItem.unitPrice === newItem.unitPrice
            );
          });

          if (existingIndex !== -1) {
            const existing = updatedItems[existingIndex];
            updatedItems[existingIndex] = {
              ...existing,
              // Use the latest quantity from the Products selection instead of incrementing
              // so re-selecting the same product does not double-count the quantity.
              quantity:
                typeof newItem.quantity === 'number'
                  ? newItem.quantity
                  : existing.quantity || 0
            };
          } else {
            updatedItems.push(newItem);
          }
        });

        return {
          ...prev,
          items: updatedItems
        };
      });

      // Re-open the Add Order modal so the user sees their in-progress form with products.
      setShowAddModal(true);

      // Clear the state to prevent re-populating on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Save form data to localStorage when modal opens
  useEffect(() => {
    if (showAddModal) {
      localStorage.setItem('orderFormData', JSON.stringify(orderForm));
    }
  }, [showAddModal, orderForm]);

  // Fetch preview order number when modal opens
  useEffect(() => {
    if (showAddModal && !orderForm.orderNumber) {
      const fetchPreviewOrderNumber = async () => {
        try {
          const response = await fetch('http://localhost:4000/api/orders/preview-order-no', {
            credentials: 'include'
          });
          const data = await response.json();
          if (data.success) {
            setOrderForm(prev => ({ ...prev, orderNumber: data.nextOrderNumber }));
          } else {
            showNotification('Failed to load order number', 'error');
          }
        } catch (error) {
          console.error('Error fetching order number:', error);
          showNotification('Error loading order number', 'error');
        }
      };
      fetchPreviewOrderNumber();
    }
  }, [showAddModal, orderForm.orderNumber, showNotification]);

  // Filter orders
  useEffect(() => {
    let filtered = orders;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.status.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [searchQuery, statusFilter, orders]);

  const getStatusBadge = (status) => {
    const badges = {
      'Order Received': { bg: '#DBEAFE', color: '#1E3A8A' },
      'Order Placed in Lab': { bg: '#FEF3C7', color: '#92400E' },
      'In Lab Processing': { bg: '#FFF7ED', color: '#92400E' },
      'Transit to Shop': { bg: '#F3E8FF', color: '#6D28D9' },
      'Ready for Customer': { bg: '#DCFCE7', color: '#166534' },
      'Customer Collected': { bg: '#E0F2FE', color: '#0C4A6E' }
    };
    return badges[status] || { bg: '#F1F5F9', color: '#0F172A' };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setModalMode('view');
    setShowModal(true);
  };

  const handleEditStatus = (order) => {
    setSelectedOrder(order);
    setModalMode('edit');
    setShowModal(true);
  };





  const handleStatusUpdate = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`http://localhost:4000/api/orders/${selectedOrder._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: selectedOrder.status })
      });
      const data = await response.json();

      if (data.success) {
        setOrders(orders.map(o =>
          o._id === selectedOrder._id
            ? { ...o, status: selectedOrder.status }
            : o
        ));
        setShowModal(false);
        showNotification('Order status updated successfully!');
      } else {
        showNotification('Failed to update order status: ' + data.message, 'error');
      }
    } catch (err) {
      console.error('Status update error:', err);
      showNotification('Error updating order status', 'error');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  const exportOrders = () => {
    // In real app, implement CSV export
    alert('Exporting orders to CSV...');
  };

  // Add order functions
  const handleRemoveItem = (index) => {
    setOrderForm({
      ...orderForm,
      items: orderForm.items.filter((_, i) => i !== index)
    });
  };

  const calculateTotal = () => {
    return orderForm.items.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();

    if (!orderForm.orderNumber || !orderForm.customerName) {
      showNotification('Order number and customer name are required', 'error');
      return;
    }

    if (orderForm.items.length === 0) {
      showNotification('Please add at least one item to the order', 'error');
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...orderForm,
          total: calculateTotal()
        })
      });

      const data = await response.json();

      if (data.success) {
        setOrders([...orders, {
          _id: data.data._id,
          orderNumber: data.data.orderNumber,
          customerName: data.data.customerName,
          customer: data.data._id,
          placedAt: data.data.placedAt,
          status: data.data.status,
          total: data.data.total,
          items: data.data.items.map(item => ({
            product: item.description || item.sku,
            quantity: item.quantity,
            price: item.unitPrice
          })),
          notes: data.data.customerEmail || ''
        }]);
        setShowAddModal(false);
        setOrderForm({
          orderNumber: '',
          customerName: '',
          customerEmail: '',
          items: [],
          notes: ''
        });
        showNotification('Order created successfully!');
      } else {
        showNotification('Failed to create order: ' + data.message, 'error');
      }
    } catch (err) {
      console.error('Create order error:', err);
      showNotification('Error creating order', 'error');
    }
  };

  const totalOrders = orders.length;

  return (
    <div className="orders-page">
      <SidebarMenu active="orders" />
      
      <div className="orders-main-content">
        {/* Header */}
        <div className="orders-header">
          <div className="orders-header-content">
            <div className="orders-header-title">
              <h2>Orders Management</h2>
              <div className="orders-stats">
                <span className="stat-badge">Total: {totalOrders}</span>
                <span className="stat-badge" style={{ backgroundColor: '#DBEAFE', color: '#1E3A8A' }}>
                  Order Received: {statusCounts['Order Received'] || 0}
                </span>
                <span className="stat-badge" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                  Order Placed in Lab: {statusCounts['Order Placed in Lab'] || 0}
                </span>
                <span className="stat-badge" style={{ backgroundColor: '#FFF7ED', color: '#92400E' }}>
                  In Lab Processing: {statusCounts['In Lab Processing'] || 0}
                </span>
                <span className="stat-badge" style={{ backgroundColor: '#F3E8FF', color: '#6D28D9' }}>
                  Transit to Shop: {statusCounts['Transit to Shop'] || 0}
                </span>
                <span className="stat-badge" style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>
                  Ready for Customer: {statusCounts['Ready for Customer'] || 0}
                </span>
                <span className="stat-badge" style={{ backgroundColor: '#E0F2FE', color: '#0C4A6E' }}>
                  Customer Collected: {statusCounts['Customer Collected'] || 0}
                </span>
              </div>
            </div>
            <div className="orders-header-actions">
              <button className="add-order-btn" onClick={() => setShowAddModal(true)}>
                <Plus size={16} />
                Add Order
              </button>
              <button className="export-btn" onClick={exportOrders}>
                <Download size={16} />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="orders-filters">
          <div className="search-filter">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by order number, customer, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Status:</label>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {orderStatuses.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>

          <button className="clear-filters-btn" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>

        {/* Content */}
        <div className="orders-content">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <h3 className="empty-state-title">No orders found</h3>
              <p className="empty-state-description">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No orders have been placed yet'}
              </p>
            </div>
          ) : (
            <div className="orders-table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => {
                    const statusStyle = getStatusBadge(order.status);
                    return (
                      <tr key={order._id}>
                        <td>
                          <div className="order-number">
                            <Package size={16} />
                            <span>{order.orderNumber}</span>
                          </div>
                        </td>
                        <td>
                          <div className="customer-cell">
                            <span className="customer-name">{order.customerName}</span>
                          </div>
                        </td>
                        <td>{formatDate(order.placedAt)}</td>
                        <td>{order.items.length} item(s)</td>
                        <td style={{ fontWeight: 600, color: '#0d9488' }}>
                          Rs. {order.total.toLocaleString()}
                        </td>
                        <td>
                          <span
                            className="status-badge"
                            style={{
                              backgroundColor: statusStyle.bg,
                              color: statusStyle.color
                            }}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="table-action-btn view-action-btn"
                              onClick={() => handleViewOrder(order)}
                              title="View Details"
                            >
                              <Eye size={14} />
                            </button>
                            {order.status !== 'Customer Collected' && (
                              <button
                                className="table-action-btn edit-action-btn"
                                onClick={() => handleEditStatus(order)}
                                title="Update Status"
                              >
                                <Edit2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View/Edit Modal */}
      {showModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === 'view' ? 'Order Details' : 'Update Order Status'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              {modalMode === 'view' ? (
                <>
                  <div className="order-detail-section">
                    <h4>Order Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Order Number:</span>
                        <span className="detail-value">{selectedOrder.orderNumber}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Customer:</span>
                        <span className="detail-value">{selectedOrder.customerName}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Order Date:</span>
                        <span className="detail-value">{formatDate(selectedOrder.placedAt)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Status:</span>
                        <span 
                          className="status-badge"
                          style={getStatusBadge(selectedOrder.status)}
                        >
                          {selectedOrder.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="order-detail-section">
                    <h4>Order Items</h4>
                    <table className="items-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Quantity</th>
                          <th>Price</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.product}</td>
                            <td>{item.quantity}</td>
                            <td>Rs. {item.price.toLocaleString()}</td>
                            <td>Rs. {(item.quantity * item.price).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'right', fontWeight: 600 }}>Total:</td>
                          <td style={{ fontWeight: 700, color: '#0d9488' }}>
                            Rs. {selectedOrder.total.toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {selectedOrder.notes && (
                    <div className="order-detail-section">
                      <h4>Notes</h4>
                      <p className="order-notes">{selectedOrder.notes}</p>
                    </div>
                  )}
                </>
              ) : (
                <form onSubmit={handleStatusUpdate}>
                  <div className="form-group">
                    <label className="form-label">
                      Order Number
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={selectedOrder.orderNumber}
                      disabled
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Customer
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={selectedOrder.customerName}
                      disabled
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Update Status <span className="required">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={selectedOrder.status}
                      onChange={(e) => setSelectedOrder({
                        ...selectedOrder,
                        status: e.target.value
                      })}
                      required
                    >
                      {orderStatuses.filter(s => s.value !== 'all').map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="modal-btn modal-btn-cancel"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="modal-btn modal-btn-submit">
                      Update Status
                    </button>
                  </div>
                </form>
              )}
            </div>

            {modalMode === 'view' && (
              <div className="modal-footer">
                <button
                  type="button"
                  className="modal-btn modal-btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
                {selectedOrder.status !== 'Customer Collected' && (
                  <>
                    <button
                      type="button"
                      className="modal-btn modal-btn-secondary"
                      onClick={() => navigate(`/invoice?orderNo=${selectedOrder.orderNumber}&customerName=${selectedOrder.customerName}&customerEmail=${selectedOrder.notes || ''}`)}
                    >
                      Create Invoice
                    </button>
                    <button
                      type="button"
                      className="modal-btn modal-btn-submit"
                      onClick={() => setModalMode('edit')}
                    >
                      Update Status
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Order Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content add-order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Order</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder}>
              <div className="modal-body">
                {/* Order Information */}
                <div className="order-detail-section">
                  <h4>Order Information</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">
                        Order Number <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={orderForm.orderNumber}
                        onChange={(e) => setOrderForm({...orderForm, orderNumber: e.target.value})}
                        placeholder="Enter order number"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Customer Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={orderForm.customerName}
                        onChange={(e) => setOrderForm({...orderForm, customerName: e.target.value})}
                        placeholder="Enter customer name"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Customer Email
                      </label>
                      <input
                        type="email"
                        className="form-input"
                        value={orderForm.customerEmail}
                        onChange={(e) => setOrderForm({...orderForm, customerEmail: e.target.value})}
                        placeholder="Enter customer email"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Notes
                      </label>
                      <textarea
                        className="form-textarea"
                        value={orderForm.notes}
                        onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
                        placeholder="Additional notes"
                        rows="3"
                      />
                    </div>
                  </div>
                </div>

                {/* Add Products */}
                <div className="order-detail-section">
                  <h4>Add Products</h4>
                  <div className="add-product-section">
                    <div className="form-group">
                      <button
                        type="button"
                        className="browse-products-btn"
                        onClick={() => {
                          // Form data is already saved to localStorage via useEffect
                          navigate('/products?mode=select');
                        }}
                        title="Browse Products"
                      >
                        <ShoppingCart size={16} />
                        Browse Products
                      </button>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                {orderForm.items.length > 0 && (
                  <div className="order-detail-section">
                    <h4>Order Items</h4>
                    <table className="items-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Quantity</th>
                          <th>Price</th>
                          <th>Subtotal</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderForm.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.description}</td>
                            <td>{item.quantity}</td>
                            <td>Rs. {item.unitPrice.toLocaleString()}</td>
                            <td>Rs. {(item.quantity * item.unitPrice).toLocaleString()}</td>
                            <td>
                              <button
                                type="button"
                                className="remove-item-btn"
                                onClick={() => handleRemoveItem(index)}
                                title="Remove item"
                              >
                                <Minus size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'right', fontWeight: 600 }}>Total:</td>
                          <td style={{ fontWeight: 700, color: '#0d9488' }}>
                            Rs. {calculateTotal().toLocaleString()}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="modal-btn modal-btn-cancel"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-btn modal-btn-submit">
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
