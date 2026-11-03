import Settings from '../models/settingsModel.js';

// Default settings structure
const defaultSettings = {
  general: {
    shopName: 'My Spectacle Shop',
    shopEmail: 'contact@shop.com',
    shopPhone: '+94 77 123 4567',
    shopAddress: '123 Main Street, Colombo',
    currency: 'LKR',
    timezone: 'Asia/Colombo',
    language: 'en'
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    orderNotifications: true,
    lowStockAlerts: true,
    customerUpdates: false,
    dailyReports: true
  },
  security: {
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginAttempts: 5,
    requireStrongPassword: true
  },
  display: {
    theme: 'light',
    compactMode: false,
    showAnimations: true,
    sidebarCollapsed: false
  },
  dataBackup: {
    autoBackup: true,
    backupFrequency: 'daily',
    dataRetention: 365
  },
  payments: {
    acceptCash: true,
    acceptCard: true,
    acceptMobile: true,
    taxRate: 0
  },
  invoice: {
    invoicePrefix: 'INV',
    invoiceNumberStart: 1001,
    showLogo: true,
    includeTerms: true
  },
  order: {
    orderPrefix: 'ORD',
    orderNumberStart: 1001
  }
};

// Get user settings
export const getSettings = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    let settings = await Settings.findOne({ userId });

    // If no settings exist, create default settings
    if (!settings) {
      settings = new Settings({
        userId,
        ...defaultSettings
      });
      await settings.save();
    }

    res.json({ success: true, settings: settings.toObject() });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update all user settings
export const updateSettings = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const updateData = req.body;

    // Validate required fields
    if (!updateData || typeof updateData !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid settings data' });
    }

    // Update or create settings
    const settings = await Settings.findOneAndUpdate(
      { userId },
      { ...updateData, userId },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, settings: settings.toObject() });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reset settings to defaults
export const resetSettings = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const settings = await Settings.findOneAndUpdate(
      { userId },
      { ...defaultSettings, userId },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, settings: settings.toObject() });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get specific setting by key
export const getSetting = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { key } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!key) {
      return res.status(400).json({ success: false, message: 'Setting key is required' });
    }

    const settings = await Settings.findOne({ userId });

    if (!settings) {
      return res.status(404).json({ success: false, message: 'Settings not found' });
    }

    // Navigate to the nested property
    const keys = key.split('.');
    let value = settings.toObject();

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return res.status(404).json({ success: false, message: 'Setting not found' });
      }
    }

    res.json({ success: true, key, value });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update specific setting by key
export const updateSetting = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { key } = req.params;
    const { value } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!key) {
      return res.status(400).json({ success: false, message: 'Setting key is required' });
    }

    // Build the update object dynamically
    const updateObj = {};
    const keys = key.split('.');
    let current = updateObj;

    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    const settings = await Settings.findOneAndUpdate(
      { userId },
      updateObj,
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, key, value, settings: settings.toObject() });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
