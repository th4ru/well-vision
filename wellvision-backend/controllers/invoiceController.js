import InvoiceModel from '../models/invoiceModel.js'; // Your invoice schema/model
import Counter from '../models/counterModel.js'; // The counter model we discussed
import Settings from '../models/settingsModel.js'; // Settings model

// Function to get next sequence number
async function getNextSequence(name) {
  const counter = await Counter.findOneAndUpdate(
    { name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

// Controller function to create invoice
export const createInvoice = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Get user settings for invoice prefix and starting number
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

    const seq = await getNextSequence('billNo');
    const billNo = `${settings.invoice.invoicePrefix}-${String(seq).padStart(4, '0')}`;

    // Coerce numeric fields and cast date
    const rawItems = req.body.items || [];
    const normalizedItems = rawItems
      .map((item) => ({
        ...item,
        item: (item.item || '').trim(),
        description: item.description,
        rs: Number(item.rs),
        cts: Number(item.cts),
      }))
      // Keep only items where there is a name; allow zero amounts so typical
      // usage (filling description and optional amounts) still saves.
      .filter((item) => item.item);

    // Set invoice date: if date provided, combine with current time; otherwise use current datetime
    let invoiceDate;
    if (req.body.date) {
      const providedDate = new Date(req.body.date);
      const now = new Date();
      invoiceDate = new Date(providedDate.getFullYear(), providedDate.getMonth(), providedDate.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());
    } else {
      invoiceDate = new Date();
    }

    const invoiceData = {
      ...req.body,
      billNo,
      date: invoiceDate,
      amount: Number(req.body.amount),
      advance: Number(req.body.advance),
      balance: Number(req.body.balance),
      items: normalizedItems,
    };

    const invoice = new InvoiceModel(invoiceData);

    await invoice.save();

    // Optional: send notifications if enabled in user settings
    try {
      const userId = req.user?.id;
      if (userId) {
        const user = await (await import('../models/userModel.js')).default.findById(userId).select('email phone name settings');
        // Email
        if (user && user.settings?.notifications?.emailNotifications) {
          const transporter = (await import('../config/nodemailer.js')).default;
          await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: `Invoice ${invoice.billNo} saved`,
            text: `Hello ${user.name || ''}, your invoice ${invoice.billNo} has been saved.`.trim()
          });
        }
        // SMS
        if (user && user.settings?.notifications?.smsNotifications && user.phone) {
          const { sendSms } = await import('../utils/smsClient.js');
          await sendSms({ to: user.phone, body: `Invoice ${invoice.billNo} saved. Thank you - WellVision` });
        }
      }
    } catch (e) {
      // Do not fail invoice creation if notification fails
      console.warn('Invoice notify failed:', e.message);
    }

    res.status(201).json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single invoice by ID
export const getInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await InvoiceModel.findById(id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update an invoice by ID
export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    // Coerce numeric fields and cast date
    const rawItems = req.body.items || [];
    const normalizedItems = rawItems
      .map((item) => ({
        ...item,
        item: (item.item || '').trim(),
        description: item.description,
        rs: Number(item.rs),
        cts: Number(item.cts),
      }))
      .filter((item) => item.item);

    const updateData = {
      ...req.body,
      date: req.body.date ? new Date(req.body.date) : undefined,
      amount: Number(req.body.amount),
      advance: Number(req.body.advance),
      balance: Number(req.body.balance),
      items: normalizedItems,
    };

    const invoice = await InvoiceModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// List invoices with pagination, sorting, and search to power the Bills page
export const getInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const search = (req.query.search || '').trim();
    const customerId = (req.query.customerId || '').trim();

    const query = {};

    if (customerId) {
      query.customerId = customerId;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { billNo: regex },
        { orderNo: regex },
        { name: regex },
        { tel: regex },
        { address: regex }
      ];
    }

    const skip = (page - 1) * limit;

    const [invoices, totalInvoices] = await Promise.all([
      InvoiceModel.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      InvoiceModel.countDocuments(query)
    ]);

    const totalPages = Math.max(1, Math.ceil(totalInvoices / limit));

    res.json({
      success: true,
      invoices,
      pagination: {
        totalInvoices,
        totalPages,
        currentPage: page,
        pageSize: limit
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a single invoice by id (used by Bills bulk/single delete)
export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await InvoiceModel.findByIdAndDelete(id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
