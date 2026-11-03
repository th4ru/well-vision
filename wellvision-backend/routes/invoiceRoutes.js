// routes/invoiceRoutes.js
import express from 'express';
import { createInvoice, getInvoices, getInvoice, updateInvoice, deleteInvoice } from '../controllers/invoiceController.js';
import Counter from '../models/counterModel.js';
import Settings from '../models/settingsModel.js';
import userAuth from '../middleware/userAuth.js';

const router = express.Router();

// Route: Preview next Bill No (does NOT increment counter)
router.get('/preview-bill-no', userAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Get user settings for invoice prefix
    let settings = await Settings.findOne({ userId });
    if (!settings) {
      // Create default settings if none exist
      settings = new Settings({
        userId,
        general: { shopName: 'My Spectacle Shop', shopEmail: 'contact@shop.com', shopPhone: '+94 77 123 4567', shopAddress: '123 Main Street, Colombo', currency: 'LKR', timezone: 'Asia/Colombo', language: 'en' },
        notifications: { emailNotifications: true, smsNotifications: false, orderNotifications: true, lowStockAlerts: true, customerUpdates: false, dailyReports: true },
        security: { twoFactorAuth: false, sessionTimeout: 30, passwordExpiry: 90, loginAttempts: 5, requireStrongPassword: true },
        display: { theme: 'light', compactMode: false, showAnimations: true, sidebarCollapsed: false },
        dataBackup: { autoBackup: true, backupFrequency: 'daily', dataRetention: 365 },
        payments: { acceptCash: true, acceptCard: true, acceptMobile: true, taxRate: 0 },
        invoice: { invoicePrefix: 'INV', invoiceNumberStart: 1001, showLogo: true, includeTerms: true },
        order: { orderPrefix: 'ORD', orderNumberStart: 1001 }
      });
      await settings.save();
    }

    const counter = await Counter.findOne({ name: 'billNo' });
    const nextSeq = (counter?.seq || 0) + 1;
    const formattedBillNo = `${settings.invoice.invoicePrefix}-${String(nextSeq).padStart(4, '0')}`;

    res.json({ success: true, nextBillNo: formattedBillNo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error previewing Bill No' });
  }
});

// Route: Get and increment the next Bill No (not usually needed if create handles it)
router.get('/next-bill-no', async (req, res) => {
  try {
    const counter = await Counter.findOneAndUpdate(
      { name: 'billNo' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const formattedBillNo = `INV-${String(counter.seq).padStart(4, '0')}`;

    res.json({ success: true, nextBillNo: formattedBillNo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error generating Bill No' });
  }
});

// Route: List invoices for Bills page with pagination & search
router.get('/', userAuth, getInvoices);

// Route: Get a single invoice by ID
router.get('/:id', userAuth, getInvoice);

// Route: Update an invoice by ID
router.put('/:id', userAuth, updateInvoice);

// Route: Delete a single invoice
router.delete('/:id', userAuth, deleteInvoice);

// Route: Create a new invoice (auto-generates billNo internally)
router.post('/create', userAuth, createInvoice);

export default router;
