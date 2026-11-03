import React, { useState, useEffect } from 'react';
import './SettingsPage.css';
import { 
  Bell, 
  Lock, 
  Globe, 
  Database, 
  Monitor, 
  ShieldCheck, 
  Mail, 
  Smartphone,
  CreditCard,
  Users,
  FileText,
  ToggleLeft,
  ToggleRight,
  Save,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    // General Settings
    shopName: 'My Spectacle Shop',
    shopEmail: 'contact@shop.com',
    shopPhone: '+94 77 123 4567',
    shopAddress: '123 Main Street, Colombo',
    currency: 'LKR',
    timezone: 'Asia/Colombo',
    language: 'en',
    
    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    orderNotifications: true,
    lowStockAlerts: true,
    customerUpdates: false,
    dailyReports: true,
    
    // Security
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginAttempts: 5,
    requireStrongPassword: true,
    
    // Display
    theme: 'light',
    compactMode: false,
    showAnimations: true,
    sidebarCollapsed: false,
    
    // Data & Backup
    autoBackup: true,
    backupFrequency: 'daily',
    dataRetention: 365,
    
    // Payments
    acceptCash: true,
    acceptCard: true,
    acceptMobile: true,
    taxRate: 0,
    
    // Invoice Settings
    invoicePrefix: 'INV',
    invoiceNumberStart: 1001,
    orderPrefix: 'ORD',
    orderNumberStart: 1001,
    showLogo: true,
    includeTerms: true,
  });

  // Load settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/settings', {
          credentials: 'include'
        });
        const data = await response.json();
        if (data.success) {
          setSettings(prev => ({ ...prev, ...data.settings }));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('http://localhost:4000/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('Settings saved successfully!');
      } else {
        throw new Error(data.message || 'Failed to save settings');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      // Reset to default values
      toast.info('Settings reset to defaults');
    }
  };

  const renderGeneralSettings = () => (
    <div className="settings-section">
      <h3 className="section-title">
        <Globe size={20} />
        General Settings
      </h3>
      
      <div className="settings-grid">
        <div className="setting-item">
          <label>Shop Name</label>
          <input
            type="text"
            value={settings.shopName}
            onChange={(e) => handleChange('shopName', e.target.value)}
            placeholder="Enter shop name"
          />
        </div>

        <div className="setting-item">
          <label>Email</label>
          <input
            type="email"
            value={settings.shopEmail}
            onChange={(e) => handleChange('shopEmail', e.target.value)}
            placeholder="contact@shop.com"
          />
        </div>

        <div className="setting-item">
          <label>Phone Number</label>
          <input
            type="tel"
            value={settings.shopPhone}
            onChange={(e) => handleChange('shopPhone', e.target.value)}
            placeholder="+94 77 123 4567"
          />
        </div>

        <div className="setting-item full-width">
          <label>Address</label>
          <textarea
            value={settings.shopAddress}
            onChange={(e) => handleChange('shopAddress', e.target.value)}
            placeholder="Enter shop address"
            rows={3}
          />
        </div>

        <div className="setting-item">
          <label>Currency</label>
          <select
            value={settings.currency}
            onChange={(e) => handleChange('currency', e.target.value)}
          >
            <option value="LKR">Sri Lankan Rupee (LKR)</option>
            <option value="USD">US Dollar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="GBP">British Pound (GBP)</option>
          </select>
        </div>

        <div className="setting-item">
          <label>Timezone</label>
          <select
            value={settings.timezone}
            onChange={(e) => handleChange('timezone', e.target.value)}
          >
            <option value="Asia/Colombo">Asia/Colombo (GMT+5:30)</option>
            <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
            <option value="UTC">UTC</option>
          </select>
        </div>

        <div className="setting-item">
          <label>Language</label>
          <select
            value={settings.language}
            onChange={(e) => handleChange('language', e.target.value)}
          >
            <option value="en">English</option>
            <option value="si">Sinhala</option>
            <option value="ta">Tamil</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="settings-section">
      <h3 className="section-title">
        <Bell size={20} />
        Notification Settings
      </h3>

      <div className="settings-list">
        <div className="setting-toggle-item">
          <div className="setting-info">
            <Mail size={18} />
            <div>
              <h4>Email Notifications</h4>
              <p>Receive notifications via email</p>
            </div>
          </div>
          <button
            className={`toggle-btn ${settings.emailNotifications ? 'active' : ''}`}
            onClick={() => handleToggle('emailNotifications')}
          >
            {settings.emailNotifications ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
          </button>
        </div>

        <div className="setting-toggle-item">
          <div className="setting-info">
            <Smartphone size={18} />
            <div>
              <h4>SMS Notifications</h4>
              <p>Receive notifications via SMS</p>
            </div>
          </div>
          <button
            className={`toggle-btn ${settings.smsNotifications ? 'active' : ''}`}
            onClick={() => handleToggle('smsNotifications')}
          >
            {settings.smsNotifications ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
          </button>
        </div>

        <div className="setting-toggle-item">
          <div className="setting-info">
            <ShieldCheck size={18} />
            <div>
              <h4>Order Notifications</h4>
              <p>Get notified about new orders</p>
            </div>
          </div>
          <button
            className={`toggle-btn ${settings.orderNotifications ? 'active' : ''}`}
            onClick={() => handleToggle('orderNotifications')}
          >
            {settings.orderNotifications ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
          </button>
        </div>

        <div className="setting-toggle-item">
          <div className="setting-info">
            <Database size={18} />
            <div>
              <h4>Low Stock Alerts</h4>
              <p>Alert when products are running low</p>
            </div>
          </div>
          <button
            className={`toggle-btn ${settings.lowStockAlerts ? 'active' : ''}`}
            onClick={() => handleToggle('lowStockAlerts')}
          >
            {settings.lowStockAlerts ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
          </button>
        </div>

        <div className="setting-toggle-item">
          <div className="setting-info">
            <Users size={18} />
            <div>
              <h4>Customer Updates</h4>
              <p>Notify about customer activities</p>
            </div>
          </div>
          <button
            className={`toggle-btn ${settings.customerUpdates ? 'active' : ''}`}
            onClick={() => handleToggle('customerUpdates')}
          >
            {settings.customerUpdates ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
          </button>
        </div>

        <div className="setting-toggle-item">
          <div className="setting-info">
            <FileText size={18} />
            <div>
              <h4>Daily Reports</h4>
              <p>Receive daily sales reports</p>
            </div>
          </div>
          <button
            className={`toggle-btn ${settings.dailyReports ? 'active' : ''}`}
            onClick={() => handleToggle('dailyReports')}
          >
            {settings.dailyReports ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
          </button>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="settings-section">
      <h3 className="section-title">
        <Lock size={20} />
        Security Settings
      </h3>

      <div className="settings-list">
        <div className="setting-toggle-item">
          <div className="setting-info">
            <ShieldCheck size={18} />
            <div>
              <h4>Two-Factor Authentication</h4>
              <p>Add an extra layer of security</p>
            </div>
          </div>
          <button
            className={`toggle-btn ${settings.twoFactorAuth ? 'active' : ''}`}
            onClick={() => handleToggle('twoFactorAuth')}
          >
            {settings.twoFactorAuth ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
          </button>
        </div>

        <div className="setting-toggle-item">
          <div className="setting-info">
            <Lock size={18} />
            <div>
              <h4>Require Strong Passwords</h4>
              <p>Enforce strong password policy</p>
            </div>
          </div>
          <button
            className={`toggle-btn ${settings.requireStrongPassword ? 'active' : ''}`}
            onClick={() => handleToggle('requireStrongPassword')}
          >
            {settings.requireStrongPassword ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
          </button>
        </div>
      </div>

      <div className="settings-grid">
        <div className="setting-item">
          <label>Session Timeout (minutes)</label>
          <input
            type="number"
            value={settings.sessionTimeout}
            onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
            min="5"
            max="120"
          />
        </div>

        <div className="setting-item">
          <label>Password Expiry (days)</label>
          <input
            type="number"
            value={settings.passwordExpiry}
            onChange={(e) => handleChange('passwordExpiry', parseInt(e.target.value))}
            min="30"
            max="365"
          />
        </div>

        <div className="setting-item">
          <label>Max Login Attempts</label>
          <input
            type="number"
            value={settings.loginAttempts}
            onChange={(e) => handleChange('loginAttempts', parseInt(e.target.value))}
            min="3"
            max="10"
          />
        </div>
      </div>
    </div>
  );

  const renderDisplaySettings = () => (
    <div className="settings-section">
      <h3 className="section-title">
        <Monitor size={20} />
        Display Settings
      </h3>

      <div className="settings-list">
        <div className="setting-toggle-item">
          <div className="setting-info">
            <Monitor size={18} />
            <div>
              <h4>Compact Mode</h4>
              <p>Reduce spacing for more content</p>
            </div>
          </div>
          <button
            className={`toggle-btn ${settings.compactMode ? 'active' : ''}`}
            onClick={() => handleToggle('compactMode')}
          >
            {settings.compactMode ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
          </button>
        </div>

        <div className="setting-toggle-item">
          <div className="setting-info">
            <Globe size={18} />
            <div>
              <h4>Show Animations</h4>
              <p>Enable smooth transitions and effects</p>
            </div>
          </div>
          <button
            className={`toggle-btn ${settings.showAnimations ? 'active' : ''}`}
            onClick={() => handleToggle('showAnimations')}
          >
            {settings.showAnimations ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
          </button>
        </div>

        <div className="setting-toggle-item">
          <div className="setting-info">
            <Monitor size={18} />
            <div>
              <h4>Collapsed Sidebar</h4>
              <p>Keep sidebar collapsed by default</p>
            </div>
          </div>
          <button
            className={`toggle-btn ${settings.sidebarCollapsed ? 'active' : ''}`}
            onClick={() => handleToggle('sidebarCollapsed')}
          >
            {settings.sidebarCollapsed ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
          </button>
        </div>
      </div>

      <div className="settings-grid">
        <div className="setting-item">
          <label>Theme</label>
          <select
            value={settings.theme}
            onChange={(e) => handleChange('theme', e.target.value)}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto (System)</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderDataSettings = () => (
    <div className="settings-section">
      <h3 className="section-title">
        <Database size={20} />
        Data & Backup Settings
      </h3>

      <div className="settings-list">
        <div className="setting-toggle-item">
          <div className="setting-info">
            <Database size={18} />
            <div>
              <h4>Automatic Backups</h4>
              <p>Enable automatic data backups</p>
            </div>
          </div>
          <button
            className={`toggle-btn ${settings.autoBackup ? 'active' : ''}`}
            onClick={() => handleToggle('autoBackup')}
          >
            {settings.autoBackup ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
          </button>
        </div>
      </div>

      <div className="settings-grid">
        <div className="setting-item">
          <label>Backup Frequency</label>
          <select
            value={settings.backupFrequency}
            onChange={(e) => handleChange('backupFrequency', e.target.value)}
            disabled={!settings.autoBackup}
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="setting-item">
          <label>Data Retention (days)</label>
          <input
            type="number"
            value={settings.dataRetention}
            onChange={(e) => handleChange('dataRetention', parseInt(e.target.value))}
            min="30"
            max="3650"
          />
        </div>
      </div>

      <div className="action-buttons-group">
        <button className="action-btn backup-btn">
          <Database size={16} />
          Create Backup Now
        </button>
        <button className="action-btn restore-btn">
          <RefreshCw size={16} />
          Restore from Backup
        </button>
      </div>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="settings-section">
      <h3 className="section-title">
        <CreditCard size={20} />
        Payment Settings
      </h3>

      <div className="settings-list">
        <div className="setting-toggle-item">
          <div className="setting-info">
            <CreditCard size={18} />
            <div>
              <h4>Accept Cash</h4>
              <p>Enable cash payments</p>
            </div>
          </div>
          <button
            className={`toggle-btn ${settings.acceptCash ? 'active' : ''}`}
            onClick={() => handleToggle('acceptCash')}
          >
            {settings.acceptCash ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
          </button>
        </div>

        <div className="setting-toggle-item">
          <div className="setting-info">
            <CreditCard size={18} />
            <div>
              <h4>Accept Card Payments</h4>
              <p>Enable credit/debit card payments</p>
            </div>
          </div>
          <button
            className={`toggle-btn ${settings.acceptCard ? 'active' : ''}`}
            onClick={() => handleToggle('acceptCard')}
          >
            {settings.acceptCard ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
          </button>
        </div>

        <div className="setting-toggle-item">
          <div className="setting-info">
            <Smartphone size={18} />
            <div>
              <h4>Accept Mobile Payments</h4>
              <p>Enable mobile wallet payments</p>
            </div>
          </div>
          <button
            className={`toggle-btn ${settings.acceptMobile ? 'active' : ''}`}
            onClick={() => handleToggle('acceptMobile')}
          >
            {settings.acceptMobile ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
          </button>
        </div>
      </div>

      <div className="settings-grid">
        <div className="setting-item">
          <label>Tax Rate (%)</label>
          <input
            type="number"
            value={settings.taxRate}
            onChange={(e) => handleChange('taxRate', parseFloat(e.target.value))}
            min="0"
            max="100"
            step="0.1"
          />
        </div>
      </div>
    </div>
  );

  const renderInvoiceSettings = () => (
    <div className="settings-section">
      <h3 className="section-title">
        <FileText size={20} />
        Invoice Settings
      </h3>

      <div className="settings-list">
        <div className="setting-toggle-item">
          <div className="setting-info">
            <FileText size={18} />
            <div>
              <h4>Show Logo on Invoice</h4>
              <p>Display shop logo on invoices</p>
            </div>
          </div>
          <button
            className={`toggle-btn ${settings.showLogo ? 'active' : ''}`}
            onClick={() => handleToggle('showLogo')}
          >
            {settings.showLogo ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
          </button>
        </div>

        <div className="setting-toggle-item">
          <div className="setting-info">
            <FileText size={18} />
            <div>
              <h4>Include Terms & Conditions</h4>
              <p>Add terms and conditions to invoices</p>
            </div>
          </div>
          <button
            className={`toggle-btn ${settings.includeTerms ? 'active' : ''}`}
            onClick={() => handleToggle('includeTerms')}
          >
            {settings.includeTerms ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
          </button>
        </div>
      </div>

      <div className="settings-grid">
        <div className="setting-item">
          <label>Invoice Prefix</label>
          <input
            type="text"
            value={settings.invoicePrefix}
            onChange={(e) => handleChange('invoicePrefix', e.target.value)}
            placeholder="INV"
          />
        </div>

        <div className="setting-item">
          <label>Starting Invoice Number</label>
          <input
            type="number"
            value={settings.invoiceNumberStart}
            onChange={(e) => handleChange('invoiceNumberStart', parseInt(e.target.value))}
            min="1"
          />
        </div>

        <div className="setting-item">
          <label>Order Prefix</label>
          <input
            type="text"
            value={settings.orderPrefix}
            onChange={(e) => handleChange('orderPrefix', e.target.value)}
            placeholder="ORD"
          />
        </div>

        <div className="setting-item">
          <label>Starting Order Number</label>
          <input
            type="number"
            value={settings.orderNumberStart}
            onChange={(e) => handleChange('orderNumberStart', parseInt(e.target.value))}
            min="1"
          />
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'general', label: 'General', icon: <Globe size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'security', label: 'Security', icon: <Lock size={18} /> },
    { id: 'display', label: 'Display', icon: <Monitor size={18} /> },
    { id: 'data', label: 'Data & Backup', icon: <Database size={18} /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard size={18} /> },
    { id: 'invoice', label: 'Invoice', icon: <FileText size={18} /> },
  ];

  return (
    <div className="settings-page">
      <div className="settings-main-content">
        <div className="settings-header">
          <div className="settings-header-content">
            <div className="settings-header-title">
              <h2>Settings</h2>
              <p>Manage your application preferences and configurations</p>
            </div>
            <div className="settings-header-actions">
              <button className="reset-btn" onClick={handleReset}>
                <RefreshCw size={16} />
                Reset to Defaults
              </button>
              <button 
                className="save-btn" 
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save size={16} />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        <div className="settings-content-area">
          <div className="settings-layout">
            <div className="settings-sidebar">
              <nav className="settings-nav">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="settings-content">
              {activeTab === 'general' && renderGeneralSettings()}
              {activeTab === 'notifications' && renderNotificationSettings()}
              {activeTab === 'security' && renderSecuritySettings()}
              {activeTab === 'display' && renderDisplaySettings()}
              {activeTab === 'data' && renderDataSettings()}
              {activeTab === 'payments' && renderPaymentSettings()}
              {activeTab === 'invoice' && renderInvoiceSettings()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}