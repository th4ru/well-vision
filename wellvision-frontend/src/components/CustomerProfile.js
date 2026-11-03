import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, ChevronRight } from 'lucide-react';
import WellVisionInvoice from './WellVisionInvoice';
import './CustomerProfile.css';
import { toast } from 'react-toastify';

const CustomerProfile = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [customer, setCustomer] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'Personal Details');
  const tabs = ['Personal Details', 'Prescriptions', 'Job Card', 'Billing', 'Bills'];
  const [expandedSections, setExpandedSections] = useState({
    customerDetails: true,
    prescription: true,
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

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
        setPrescriptions([
          { id: 1, name: 'Prescription 1', description: 'Description', date: '2023-07-01', time: '10:00 AM' },
          { id: 2, name: 'Prescription 2', description: 'Description', date: '2023-07-05', time: '2:00 PM' },
          { id: 3, name: 'Prescription 3', description: 'Description', date: '2023-07-10', time: '11:30 AM' },
        ]);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [customerId]);

  // Fetch invoices for this customer to show under the Billing tab
  useEffect(() => {
    if (!customerId) return;

    const fetchInvoices = async () => {
      setInvoicesLoading(true);
      try {
        const res = await fetch(`http://localhost:4000/api/invoices?customerId=${customerId}`, {
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
            <table className="profile-prescription-table">
              <thead>
                <tr>
                  <th>Prescription</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>View</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((prescription) => (
                  <tr key={prescription.id}>
                    <td>{prescription.name}</td>
                    <td>{prescription.description}</td>
                    <td>{prescription.date}</td>
                    <td>{prescription.time}</td>
                    <td>
                      <button className="profile-view-btn">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'Job Card' && (
            <div className="profile-job-card-tab">
              <p>Job Card content will be displayed here.</p>
            </div>
          )}

          {activeTab === 'Billing' && (
            <div className="profile-billing-tab">
              <WellVisionInvoice customer={customer} />
            </div>
          )}

          {activeTab === 'Bills' && (
            <div className="profile-bills-tab">
              <h4>Customer Invoices</h4>
              {invoicesLoading ? (
                <p>Loading invoices...</p>
              ) : invoices.length === 0 ? (
                <p>No invoices found for this customer yet.</p>
              ) : (
                <table className="profile-invoices-table">
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
                    {invoices.map((inv) => (
                      <tr key={inv._id}>
                        <td>{inv.billNo}</td>
                        <td>{inv.orderNo}</td>
                        <td>{inv.date ? new Date(inv.date).toLocaleString() : ''}</td>
                        <td>{inv.items && inv.items.length > 0 ? inv.items.map(item => item.item).join(', ') : 'N/A'}</td>
                        <td>{inv.amount}</td>
                        <td>{inv.advance}</td>
                        <td>{inv.balance}</td>
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
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      ))}


    </div>
  );
};

export default CustomerProfile;
