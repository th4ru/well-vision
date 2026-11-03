import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // General Settings
  general: {
    shopName: { type: String, default: 'My Spectacle Shop' },
    shopEmail: { type: String, default: 'contact@shop.com' },
    shopPhone: { type: String, default: '+94 77 123 4567' },
    shopAddress: { type: String, default: '123 Main Street, Colombo' },
    currency: { type: String, default: 'LKR', enum: ['LKR', 'USD', 'EUR', 'GBP'] },
    timezone: { type: String, default: 'Asia/Colombo' },
    language: { type: String, default: 'en', enum: ['en', 'si', 'ta'] }
  },

  // Notification Settings
  notifications: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    orderNotifications: { type: Boolean, default: true },
    lowStockAlerts: { type: Boolean, default: true },
    customerUpdates: { type: Boolean, default: false },
    dailyReports: { type: Boolean, default: true }
  },

  // Security Settings
  security: {
    twoFactorAuth: { type: Boolean, default: false },
    sessionTimeout: { type: Number, default: 30, min: 5, max: 120 },
    passwordExpiry: { type: Number, default: 90, min: 30, max: 365 },
    loginAttempts: { type: Number, default: 5, min: 3, max: 10 },
    requireStrongPassword: { type: Boolean, default: true }
  },

  // Display Settings
  display: {
    theme: { type: String, default: 'light', enum: ['light', 'dark', 'auto'] },
    compactMode: { type: Boolean, default: false },
    showAnimations: { type: Boolean, default: true },
    sidebarCollapsed: { type: Boolean, default: false }
  },

  // Data & Backup Settings
  dataBackup: {
    autoBackup: { type: Boolean, default: true },
    backupFrequency: { type: String, default: 'daily', enum: ['hourly', 'daily', 'weekly', 'monthly'] },
    dataRetention: { type: Number, default: 365, min: 30, max: 3650 }
  },

  // Payment Settings
  payments: {
    acceptCash: { type: Boolean, default: true },
    acceptCard: { type: Boolean, default: true },
    acceptMobile: { type: Boolean, default: true },
    taxRate: { type: Number, default: 0, min: 0, max: 100 }
  },

  // Invoice Settings
  invoice: {
    invoicePrefix: { type: String, default: 'INV' },
    invoiceNumberStart: { type: Number, default: 1001, min: 1 },
    showLogo: { type: Boolean, default: true },
    includeTerms: { type: Boolean, default: true }
  },

  // Order Settings
  order: {
    orderPrefix: { type: String, default: 'ORD' },
    orderNumberStart: { type: Number, default: 1001, min: 1 }
  }
}, {
  timestamps: true
});

// Create compound index for userId uniqueness
settingsSchema.index({ userId: 1 }, { unique: true });

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
