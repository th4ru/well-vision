import React, { useState, useEffect } from 'react';
import './CustomerDashboard.css';
import { Trash2, Edit } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function CustomerDashboard() {
  const [allCustomers, setAllCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [mode, setMode] = useState('create'); // create | edit | view

  const [formData, setFormData] = useState({
    givenName: '',
    familyName: '',
    ageYears: '',
    birthDate: '',
    nicPassport: '',
    gender: '',
    ethnicity: '',
    phoneNo: '',
    address: '',
    email: ''
  });

  const navigate = useNavigate();

  const handleCustomerClick = async (id) => {
    try {
      const res = await fetch(`http://localhost:4000/api/customers/${id}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setSelectedCustomer(data.customer);
        setShowProfile(true);
      } else {
        toast.error(data.message || "Failed to load customer profile");
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
      toast.error("Server error");
    }
  };

  // Validation function (basic + regex hints for NIC, email, phone)
  const validateForm = () => {
    const newErrors = {};
    if (!formData.givenName.trim()) newErrors.givenName = 'Given name is required';
    if (!formData.familyName.trim()) newErrors.familyName = 'Family name is required';
    if (!formData.ageYears) newErrors.ageYears = 'Age is required';
    if (!formData.birthDate) newErrors.birthDate = 'Birth date is required';
    if (!formData.nicPassport.trim()) newErrors.nicPassport = 'NIC/Passport number is required';
    else if (!/^[0-9]{9}[VvXx]|[0-9]{12}$/.test(formData.nicPassport))
      newErrors.nicPassport = 'Invalid NIC/Passport format';
    if (!formData.gender) newErrors.gender = 'Please select a gender';
    if (!formData.ethnicity) newErrors.ethnicity = 'Ethnicity is required';
    if (!formData.phoneNo.trim()) newErrors.phoneNo = 'Phone number is required';
    else if (!/^(?:0|94|\+94)?(7[0-9]{8})$/.test(formData.phoneNo))
      newErrors.phoneNo = 'Invalid Sri Lankan phone number';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email))
      newErrors.email = 'Invalid email format';
    if (!formData.address.trim()) newErrors.address = 'Address is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fetch customers from backend
  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:4000/api/customers`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Failed to fetch customers');

      const customers = Array.isArray(data.data) ? data.data : data;
      const sorted = [...customers].sort((a, b) => {
        if (a.createdAt && b.createdAt) return new Date(b.createdAt) - new Date(a.createdAt);
        return b._id.localeCompare(a._id);
      });

      setAllCustomers(sorted);
      setFilteredCustomers(sorted.slice(0, 10));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch once on mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter customers on debounced searchTerm change
  useEffect(() => {
    if (!debouncedSearchTerm.trim()) {
      setFilteredCustomers(allCustomers.slice(0, 10));
      return;
    }

    const term = debouncedSearchTerm.toLowerCase();
    const filtered = allCustomers.filter(c =>
      c.givenName.toLowerCase().includes(term) ||
      c.familyName.toLowerCase().includes(term) ||
      c.phoneNo.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.nicPassport.toLowerCase().includes(term) ||
      c.ethnicity?.toLowerCase().includes(term)
    );

    setFilteredCustomers(filtered.slice(0, 10));
  }, [debouncedSearchTerm, allCustomers]);

  // Reset form to initial empty state
  const resetForm = () => {
    setFormData({
      givenName: '',
      familyName: '',
      ageYears: '',
      birthDate: '',
      nicPassport: '',
      gender: '',
      ethnicity: '',
      phoneNo: '',
      address: '',
      email: ''
    });
    setErrors({});
    setSelectedCustomer(null);
    setMode('create');
  };

  // Revert form to selected customer data (cancel editing)
  const revertForm = () => {
    if (selectedCustomer) {
      setFormData({
        givenName: selectedCustomer.givenName || '',
        familyName: selectedCustomer.familyName || '',
        ageYears: selectedCustomer.ageYears || '',
        birthDate: selectedCustomer.birthDate ? selectedCustomer.birthDate.slice(0, 10) : '',
        nicPassport: selectedCustomer.nicPassport || '',
        gender: selectedCustomer.gender || '',
        ethnicity: selectedCustomer.ethnicity || '',
        phoneNo: selectedCustomer.phoneNo || '',
        address: selectedCustomer.address || '',
        email: selectedCustomer.email || ''
      });
      setErrors({});
      setMode('view');
    } else {
      resetForm();
    }
  };

  // Input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Form submit handler (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.warning('Please fix the form errors');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = { ...formData, ageYears: Number(formData.ageYears) };
      const url = mode === 'create'
        ? 'http://localhost:4000/api/customers'
        : `http://localhost:4000/api/customers/${selectedCustomer._id}`;

      const response = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to save customer');

      toast.success(`Customer ${mode === 'create' ? 'added' : 'updated'} successfully!`);
      resetForm();
      fetchCustomers();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete customer handler
  const handleDelete = async () => {
    if (!selectedCustomer) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedCustomer.givenName} ${selectedCustomer.familyName}?`)) return;

    try {
      const response = await fetch(`http://localhost:4000/api/customers/${selectedCustomer._id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to delete customer');

      toast.success('Customer deleted successfully!');
      resetForm();
      fetchCustomers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Enable edit mode and populate form
  const handleEdit = () => {
    if (selectedCustomer) {
      setMode('edit');
      setFormData({
        givenName: selectedCustomer.givenName || '',
        familyName: selectedCustomer.familyName || '',
        ageYears: selectedCustomer.ageYears || '',
        birthDate: selectedCustomer.birthDate ? selectedCustomer.birthDate.slice(0, 10) : '',
        nicPassport: selectedCustomer.nicPassport || '',
        gender: selectedCustomer.gender || '',
        ethnicity: selectedCustomer.ethnicity || '',
        phoneNo: selectedCustomer.phoneNo || '',
        address: selectedCustomer.address || '',
        email: selectedCustomer.email || ''
      });
    }
  };

  // Navigate to customer profile page
  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setMode('view');
    navigate(`/customer/${customer._id}`, { state: { customer } });
  };

  // Helpers for UI
  const getInitials = (givenName, familyName) =>
    ((givenName?.charAt(0) || '') + (familyName?.charAt(0) || '')).toUpperCase();

  const getColorClass = (index) =>
    ['bg-blue', 'bg-green', 'bg-purple', 'bg-red', 'bg-yellow', 'bg-pink'][index % 6];

  return (
    <div className="main-content" style={{ flex: 1 }}>
      <div className="header">
        <div className="header-content">
          <div className="header-title">
            <h2>Customers</h2>
          </div>
        </div>
      </div>

      <div className="content-area">
        <div className="content-flex">
          <div className="customer-list-container">
            <form onSubmit={e => e.preventDefault()} className="search-container">
              <input
                type="text"
                placeholder="Search customers by name, phone, email, etc."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </form>

            {isLoading ? (
              <div className="loading-message">Loading customers...</div>
            ) : (
              <div className="customer-list">
                {filteredCustomers.length === 0 ? (
                  <p>No customers found.</p>
                ) : (
                  filteredCustomers.map((c, i) => (
                    <div
                      key={c._id}
                      className="customer-item"
                      onClick={() => handleSelectCustomer(c)}
                    >
                      <div className={`customer-avatar ${getColorClass(i)}`}>
                        {getInitials(c.givenName, c.familyName)}
                      </div>
                      <div className="customer-info">
                        <p className="customer-name">{c.givenName} {c.familyName}</p>
                        <p className="customer-email">{c.email}</p>
                        <p className="customer-phone">{c.phoneNo}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Customer Form */}
          <div className="form-container">
            <form onSubmit={handleSubmit} className="form-card" noValidate>
              <div className="form-header">
                <div className="form-icon"><span>+</span></div>
                <h3 className="form-title">
                  {mode === 'create' ? 'Add new customer' :
                    mode === 'edit' ? 'Edit customer' : 'Customer details'}
                </h3>
              </div>
              <div className="form-content">
                <div className="form-row">
                  <div className="form-group">
                    <input
                      type="text"
                      name="givenName"
                      placeholder="Given Name *"
                      value={formData.givenName}
                      onChange={handleInputChange}
                      className={`form-input ${errors.givenName ? 'error' : ''}`}
                      disabled={mode === 'view'}
                      autoComplete="off"
                    />
                    {errors.givenName && <span className="error-message">{errors.givenName}</span>}
                  </div>
                  <div className="form-group">
                    <input
                      type="text"
                      name="familyName"
                      placeholder="Family Name *"
                      value={formData.familyName}
                      onChange={handleInputChange}
                      className={`form-input ${errors.familyName ? 'error' : ''}`}
                      disabled={mode === 'view'}
                      autoComplete="off"
                    />
                    {errors.familyName && <span className="error-message">{errors.familyName}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <input
                      type="number"
                      name="ageYears"
                      placeholder="Age Years"
                      value={formData.ageYears}
                      onChange={handleInputChange}
                      className={`form-input ${errors.ageYears ? 'error' : ''}`}
                      min="0"
                      max="120"
                      disabled={mode === 'view'}
                    />
                    {errors.ageYears && <span className="error-message">{errors.ageYears}</span>}
                  </div>
                  <div className="form-group">
                    <input
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleInputChange}
                      className={`form-input ${errors.birthDate ? 'error' : ''}`}
                      disabled={mode === 'view'}
                    />
                    {errors.birthDate && <span className="error-message">{errors.birthDate}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <input
                    type="text"
                    name="nicPassport"
                    placeholder="NIC/Passport No"
                    value={formData.nicPassport}
                    onChange={handleInputChange}
                    className={`form-input ${errors.nicPassport ? 'error' : ''}`}
                    disabled={mode === 'view'}
                    autoComplete="off"
                  />
                  {errors.nicPassport && <span className="error-message">{errors.nicPassport}</span>}
                </div>

                <div className="form-row">
                  {/* Gender dropdown */}
                  <div className="form-group">
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className={`form-input ${errors.gender ? 'error' : ''}`}
                      disabled={mode === 'view'}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.gender && <span className="error-message">{errors.gender}</span>}
                  </div>

                  {/* Ethnicity dropdown */}
                  <div className="form-group">
                    <select
                      name="ethnicity"
                      value={formData.ethnicity}
                      onChange={handleInputChange}
                      className={`form-input ${errors.ethnicity ? 'error' : ''}`}
                      disabled={mode === 'view'}
                    >
                      <option value="">Select Ethnicity</option>
                      <option value="Sinhalese">Sinhalese</option>
                      <option value="Tamil">Tamil</option>
                      <option value="Moor">Moor</option>
                      <option value="Malay">Malay</option>
                      <option value="Burghers">Burghers</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.ethnicity && <span className="error-message">{errors.ethnicity}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    disabled={mode === 'view'}
                    autoComplete="off"
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <input
                    type="tel"
                    name="phoneNo"
                    placeholder="Phone No"
                    value={formData.phoneNo}
                    onChange={handleInputChange}
                    className={`form-input ${errors.phoneNo ? 'error' : ''}`}
                    disabled={mode === 'view'}
                    autoComplete="off"
                  />
                  {errors.phoneNo && <span className="error-message">{errors.phoneNo}</span>}
                </div>

                <div className="form-group">
                  <textarea
                    name="address"
                    placeholder="Address"
                    rows={3}
                    value={formData.address}
                    onChange={handleInputChange}
                    className="form-textarea"
                    disabled={mode === 'view'}
                  />
                  {errors.address && <span className="error-message">{errors.address}</span>}
                </div>

                <div className="form-submit">
                  {mode === 'view' ? (
                    <div className="action-buttons">
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={handleDelete}
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                      <button
                        type="button"
                        className="view-btn"
                        onClick={handleEdit}
                      >
                        <Edit size={16} /> Edit
                      </button>
                    </div>
                  ) : (
                    <div className="edit-mode-buttons">
                      <button
                        type="submit"
                        className="submit-btn"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Processing...' : mode === 'create' ? 'CREATE' : 'UPDATE'}
                      </button>
                      {mode === 'edit' && (
                        <button
                          type="button"
                          className="cancel-btn"
                          onClick={revertForm}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
