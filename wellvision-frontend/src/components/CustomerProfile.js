import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, ChevronRight, Upload, FileText, ExternalLink } from 'lucide-react';
import './CustomerProfile.css';
import { toast } from 'react-toastify';

const CustomerProfile = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [customer, setCustomer] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [prescriptionsError, setPrescriptionsError] = useState('');
  const [uploadingPrescription, setUploadingPrescription] = useState(false);
  const prescriptionInputRef = useRef(null);
  const tabs = ['Personal Details', 'Orders', 'Prescriptions', 'Job Card', 'Bills'];
  const [activeTab, setActiveTab] = useState(() => {
    const requestedTab = searchParams.get('tab');
    return requestedTab && tabs.includes(requestedTab) ? requestedTab : 'Personal Details';
  });
  const [expandedSections, setExpandedSections] = useState({
    customerDetails: true,
    prescription: true,
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  const getOrderStatusLabel = (status) =>
    status === 'In Lab Processing' ? 'Lab Processing' : status;

  const getOrderStatusStyle = (status) => {
    const badges = {
      'Order Received': { bg: '#DBEAFE', color: '#1E3A8A' },
      'Order Placed in Lab': { bg: '#FEF3C7', color: '#92400E' },
      'In Lab Processing': { bg: '#FFF7ED', color: '#92400E' },
      'Transit to Shop': { bg: '#F3E8FF', color: '#6D28D9' },
      'Ready for Customer': { bg: '#DCFCE7', color: '#166534' },
      'Customer Collected': { bg: '#E0F2FE', color: '#0C4A6E' },
    };
    return badges[status] || { bg: '#F1F5F9', color: '#0F172A' };
  };

  const formatOrderDate = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
  };

  // Unpaid part of an order. Orders collected before payments were tracked
  // have no amountGiven, so treat them as settled.
  const getOrderDueBalance = (order, total) => {
    const amountGiven = Number(order.amountGiven) || 0;
    if (order.status === 'Customer Collected' && amountGiven <= 0) return 0;
    return Math.max(total - amountGiven, 0);
  };

  const startNewOrderForCustomer = () => {
    const customerName = `${customer.givenName || ''} ${customer.familyName || ''}`
      .trim()
      .replace(/\s+/g, ' ');
    navigate('/orders', {
      state: {
        newOrderForCustomer: {
          customerId: customer._id,
          customerName,
          customerEmail: customer.email || '',
        },
      },
    });
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  useEffect(() => {
    if (!customerId) return;

    const fetchCustomer = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:4000/api/customers/${customerId}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Failed to fetch customer');

        setCustomer(data.customer);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [customerId]);

  // Fetch invoices for this customer to show under the Bills tab
  useEffect(() => {
    if (!customerId) return;

    const fetchInvoices = async () => {
      setInvoicesLoading(true);
      try {
        const res = await fetch(`http://localhost:4000/api/invoices?customerId=${customerId}&limit=200`, {
          credentials: 'include',
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch invoices');
        }

        setInvoices(data.invoices || []);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setInvoicesLoading(false);
      }
    };

    fetchInvoices();
  }, [customerId]);

  // Fetch this customer's orders for the Job Card tab
  useEffect(() => {
    if (!customerId) return;

    const fetchOrders = async () => {
      setOrdersLoading(true);
      setOrdersError('');
      try {
        const res = await fetch(`http://localhost:4000/api/orders/customer/${customerId}`, {
          credentials: 'include',
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch customer orders');
        }

        setOrders(data.data || []);
      } catch (error) {
        setOrdersError(error.message);
        toast.error(error.message);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [customerId]);

  // Fetch this customer's uploaded prescriptions
  useEffect(() => {
    if (!customerId) return;

    const fetchPrescriptions = async () => {
      setPrescriptionsLoading(true);
      setPrescriptionsError('');
      try {
        const res = await fetch(`http://localhost:4000/api/prescriptions/customer/${customerId}`, {
          credentials: 'include',
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch prescriptions');
        }

        setPrescriptions(data.prescriptions || []);
      } catch (error) {
        setPrescriptionsError(error.message);
        toast.error(error.message);
      } finally {
        setPrescriptionsLoading(false);
      }
    };

    fetchPrescriptions();
  }, [customerId]);

  const handlePrescriptionFileChange = async (event) => {
    const file = event.target.files?.[0];
    // Reset so selecting the same file again still triggers a change.
    event.target.value = '';
    if (!file) return;

    setUploadingPrescription(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`http://localhost:4000/api/prescriptions/customer/${customerId}`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to upload prescription');
      }

      setPrescriptions((prev) => [data.prescription, ...prev]);
      toast.success('Prescription uploaded successfully');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploadingPrescription(false);
    }
  };

  const getPrescriptionUrl = (prescription) => {
    if (!prescription?.url) return '#';
    return prescription.url.startsWith('http')
      ? prescription.url
      : `http://localhost:4000${prescription.url}`;
  };

  const formatFileSize = (bytes) => {
    const size = Number(bytes) || 0;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) return <div className="loading-message">Loading customer profile...</div>;
  if (!customer) return <div className="error-message">Customer not found.</div>;

  const renderSection = (title, isOpen, toggleKey, children) => (
    <section className="profile-card">
      <div
        className="profile-card-header"
        role="button"
        tabIndex={0}
        onClick={() => toggleSection(toggleKey)}
        onKeyDown={(e) => e.key === 'Enter' && toggleSection(toggleKey)}
      >
        <ChevronRight
          size={18}
          className={`profile-chevron-icon ${isOpen ? 'expanded' : ''}`}
        />
        <h3>{title}</h3>
      </div>
      {isOpen && <div className="profile-card-body">{children}</div>}
    </section>
  );

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="profile-header-left">
          <h2>
            Customers
          </h2>
        </div>
        <div className="profile-header-right">
          <button
            className="profile-add-new-btn"
            onClick={() => navigate('/customers')}
            title="Add new customer"
          >
            <Plus size={16} /> Add new
          </button>
        </div>
      </header>

      <section className="profile-customer-info">
        <div className="profile-avatar">
          {(customer.givenName?.[0] + customer.familyName?.[0])?.toUpperCase() || 'CU'}
        </div>
        <div className="profile-customer-text">
          <h1>{customer.givenName} {customer.familyName}</h1>
          <p>{customer.phoneNo}</p>
        </div>
      </section>

      {renderSection('Customer Details', expandedSections.customerDetails, 'customerDetails', (
        <>
          <div className="profile-tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`profile-tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(tab);
                  navigate(`/customer/${customerId}?tab=${encodeURIComponent(tab)}`, { replace: true });
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Personal Details' && (
            <>
              <div style={{ marginBottom: '10px' }}>
                {!isEditing ? (
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setEditForm(customer);
                    }}
                  >
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch(`http://localhost:4000/api/customers/${customer._id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(editForm),
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.message || 'Update failed');
                          toast.success('Customer updated successfully');
                          setCustomer(data.customer);
                          setIsEditing(false);
                        } catch (err) {
                          toast.error(err.message);
                        }
                      }}
                    >
                      Save
                    </button>
                    <button onClick={() => setIsEditing(false)}>Cancel</button>
                  </>
                )}
              </div>
              <table className="profile-details-table">
                <tbody>
                  <tr>
                    <td><strong>Email</strong></td>
                    <td>{isEditing ? (
                      <input
                        type="email"
                        value={editForm.email || ''}
                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    ) : (
                      customer.email
                    )}</td>
                    <td><strong>NIC/Passport</strong></td>
                    <td>{isEditing ? (
                      <input
                        value={editForm.nicPassport || ''}
                        onChange={e => setEditForm({ ...editForm, nicPassport: e.target.value })}
                      />
                    ) : (
                      customer.nicPassport
                    )}</td>
                  </tr>
                  <tr>
                    <td><strong>Gender</strong></td>
                    <td>{isEditing ? (
                      <select
                        value={editForm.gender || ''}
                        onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                      >
                        <option value="">Select Gender</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    ) : (
                      customer.gender
                    )}</td>
                    <td><strong>Ethnicity</strong></td>
                    <td>{isEditing ? (
                      <input
                        value={editForm.ethnicity || ''}
                        onChange={e => setEditForm({ ...editForm, ethnicity: e.target.value })}
                      />
                    ) : (
                      customer.ethnicity
                    )}</td>
                  </tr>
                  <tr>
                    <td><strong>Address</strong></td>
                    <td>{isEditing ? (
                      <input
                        value={editForm.address || ''}
                        onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                      />
                    ) : (
                      customer.address
                    )}</td>
                    <td><strong>Birth Date</strong></td>
                    <td>{isEditing ? (
                      <input
                        type="date"
                        value={editForm.birthDate?.slice(0, 10) || ''}
                        onChange={e => setEditForm({ ...editForm, birthDate: e.target.value })}
                      />
                    ) : (
                      customer.birthDate?.slice(0, 10)
                    )}</td>
                  </tr>
                </tbody>
              </table>
            </>
          )}

          {activeTab === 'Prescriptions' && (
            <div className="profile-prescriptions-tab">
              <div className="profile-prescriptions-header">
                <div>
                  <h4>Customer Prescriptions</h4>
                  <p className="profile-orders-subtitle">
                    Uploaded prescription files for {customer.givenName} {customer.familyName}
                  </p>
                </div>
                <button
                  type="button"
                  className="profile-add-prescription-btn"
                  onClick={() => prescriptionInputRef.current?.click()}
                  disabled={uploadingPrescription}
                >
                  <Upload size={16} />
                  {uploadingPrescription ? 'Uploading...' : 'Add New Prescription'}
                </button>
                <input
                  ref={prescriptionInputRef}
                  type="file"
                  className="profile-prescription-file-input"
                  accept=".pdf,image/jpeg,image/png,image/webp,image/gif"
                  onChange={handlePrescriptionFileChange}
                />
              </div>

              {prescriptionsLoading ? (
                <p className="profile-job-card-empty">Loading prescriptions...</p>
              ) : prescriptionsError ? (
                <p className="profile-job-card-empty">{prescriptionsError}</p>
              ) : prescriptions.length === 0 ? (
                <p className="profile-job-card-empty">
                  No prescriptions uploaded for this customer yet. Use Add New Prescription to upload one.
                </p>
              ) : (
                <div className="profile-prescriptions-table-wrapper">
                  <table className="profile-prescriptions-table">
                    <thead>
                      <tr>
                        <th>Prescription</th>
                        <th>Uploaded</th>
                        <th>Size</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescriptions.map((prescription) => (
                        <tr key={prescription._id || prescription.fileName}>
                          <td>
                            <span className="profile-prescription-file">
                              <FileText size={16} />
                              {prescription.originalName}
                            </span>
                          </td>
                          <td>{formatOrderDate(prescription.createdAt)}</td>
                          <td>{formatFileSize(prescription.size)}</td>
                          <td>
                            <a
                              className="profile-view-btn"
                              href={getPrescriptionUrl(prescription)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink size={14} />
                              View
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Orders' && (
            <div className="profile-orders-tab">
              <div className="profile-orders-header">
                <div>
                  <h4>Customer Orders</h4>
                  <p className="profile-orders-subtitle">
                    Order history for {customer.givenName} {customer.familyName}
                  </p>
                </div>
                <button
                  type="button"
                  className="profile-create-order-btn"
                  onClick={startNewOrderForCustomer}
                >
                  <Plus size={16} />
                  Create New Order
                </button>
              </div>

              {ordersLoading ? (
                <p className="profile-job-card-empty">Loading orders...</p>
              ) : ordersError ? (
                <p className="profile-job-card-empty">{ordersError}</p>
              ) : orders.length === 0 ? (
                <p className="profile-job-card-empty">
                  No orders found for this customer yet. Use Create New Order to add one.
                </p>
              ) : (
                <div className="profile-orders-table-wrapper">
                  <table className="profile-orders-table">
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Date</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Due Balance</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => {
                        const statusStyle = getOrderStatusStyle(order.status);
                        const itemTotal = (order.items || []).reduce(
                          (sum, item) =>
                            sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
                          0
                        );
                        const total = Number(order.total ?? itemTotal);
                        const dueBalance = getOrderDueBalance(order, total);
                        const itemLabel =
                          (order.items || [])
                            .map((item) => {
                              const name = item.description || item.sku || 'Product';
                              return `${name} × ${Number(item.quantity) || 0}`;
                            })
                            .join(', ') || '—';

                        return (
                          <tr key={order._id}>
                            <td>
                              <span className="profile-order-number">
                                {order.orderNumber}
                              </span>
                            </td>
                            <td>{formatOrderDate(order.placedAt)}</td>
                            <td className="profile-order-items">{itemLabel}</td>
                            <td className="profile-order-total">
                              Rs. {total.toLocaleString()}
                            </td>
                            <td>
                              <span
                                className={
                                  dueBalance > 0
                                    ? 'profile-order-due'
                                    : 'profile-order-settled'
                                }
                              >
                                Rs. {dueBalance.toLocaleString()}
                              </span>
                            </td>
                            <td>
                              <span
                                className="job-card-status"
                                style={{
                                  backgroundColor: statusStyle.bg,
                                  color: statusStyle.color,
                                }}
                              >
                                {getOrderStatusLabel(order.status)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Job Card' && (
            <div className="profile-job-card-tab">
              {ordersLoading ? (
                <p className="profile-job-card-empty">Loading job cards...</p>
              ) : ordersError ? (
                <p className="profile-job-card-empty">{ordersError}</p>
              ) : orders.length === 0 ? (
                <p className="profile-job-card-empty">
                  No orders found for this customer yet.
                </p>
              ) : (
                <div className="job-card-list">
                  {orders.map((order) => {
                    const statusStyle = getOrderStatusStyle(order.status);
                    const itemTotal = (order.items || []).reduce(
                      (sum, item) =>
                        sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
                      0
                    );
                    const total = Number(order.total ?? itemTotal);

                    return (
                      <article className="job-card" key={order._id}>
                        <div className="job-card-header">
                          <div>
                            <h4>Job Card</h4>
                            <span className="job-card-order-no">{order.orderNumber}</span>
                          </div>
                          <span
                            className="job-card-status"
                            style={{
                              backgroundColor: statusStyle.bg,
                              color: statusStyle.color,
                            }}
                          >
                            {getOrderStatusLabel(order.status)}
                          </span>
                        </div>

                        <div className="job-card-meta">
                          <div>
                            <span>Order Date</span>
                            <strong>{formatOrderDate(order.placedAt)}</strong>
                          </div>
                          <div>
                            <span>Customer</span>
                            <strong>{order.customerName}</strong>
                          </div>
                          <div>
                            <span>Total Amount</span>
                            <strong>Rs. {total.toLocaleString()}</strong>
                          </div>
                        </div>

                        <table className="job-card-items-table">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>Qty</th>
                              <th>Unit Price</th>
                              <th>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(order.items || []).map((item, index) => (
                              <tr key={item._id || index}>
                                <td>{item.description || item.sku || 'Product'}</td>
                                <td>{item.quantity}</td>
                                <td>
                                  Rs. {Number(item.unitPrice || 0).toLocaleString()}
                                </td>
                                <td>
                                  Rs.{' '}
                                  {(
                                    Number(item.quantity || 0) *
                                    Number(item.unitPrice || 0)
                                  ).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {order.customerEmail && (
                          <p className="job-card-email">Email: {order.customerEmail}</p>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Bills' && (
            <div className="profile-bills-tab">
              <div className="profile-bills-header">
                <div>
                  <h4>Customer Bills</h4>
                  <p className="profile-orders-subtitle">
                    Bills created from this customer's orders and payments
                  </p>
                </div>
                <button
                  type="button"
                  className="profile-view-all-btn"
                  onClick={() => navigate('/bills')}
                >
                  View All Bills
                </button>
              </div>

              {invoicesLoading ? (
                <p className="profile-job-card-empty">Loading bills...</p>
              ) : invoices.length === 0 ? (
                <p className="profile-job-card-empty">
                  No bills found for this customer yet.
                </p>
              ) : (
                <div className="profile-bills-table-wrapper">
                  <table className="profile-bills-table">
                    <thead>
                      <tr>
                        <th>Bill No</th>
                        <th>Order No</th>
                        <th>Date</th>
                        <th>Items</th>
                        <th>Amount</th>
                        <th>Advance</th>
                        <th>Balance</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => {
                        const balance = Number(inv.balance) || 0;
                        return (
                          <tr key={inv._id}>
                            <td>
                              <span className="profile-order-number">
                                {inv.billNo}
                              </span>
                            </td>
                            <td>{inv.orderNo}</td>
                            <td>{inv.date ? new Date(inv.date).toLocaleString() : ''}</td>
                            <td className="profile-order-items">
                              {inv.items && inv.items.length > 0
                                ? inv.items.map((item) => item.item).join(', ')
                                : 'N/A'}
                            </td>
                            <td className="profile-order-total">
                              Rs. {Number(inv.amount || 0).toLocaleString()}
                            </td>
                            <td>Rs. {Number(inv.advance || 0).toLocaleString()}</td>
                            <td>
                              <span
                                className={
                                  balance > 0
                                    ? 'profile-order-due'
                                    : 'profile-order-settled'
                                }
                              >
                                Rs. {balance.toLocaleString()}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="action-btn view-btn"
                                  onClick={() => navigate(`/invoice?view=${inv._id}&customerId=${customerId}`)}
                                  title="View Invoice"
                                >
                                  View
                                </button>
                                <button
                                  className="action-btn edit-btn"
                                  onClick={() => navigate(`/invoice?edit=${inv._id}&customerId=${customerId}`)}
                                  title="Edit Invoice"
                                >
                                  Edit
                                </button>
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
          )}
        </>
      ))}


    </div>
  );
};

export default CustomerProfile;
