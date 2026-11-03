import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import mongoose from 'mongoose';
import transporter from '../config/nodemailer.js';
import Counter from '../models/counterModel.js';
import Settings from '../models/settingsModel.js';

// Allowed statuses
const ALLOWED_STATUSES = [
  'Order Received',
  'Order Placed in Lab',
  'In Lab Processing',
  'Transit to Shop',
  'Ready for Customer',
  'Customer Collected'
];

// Shared sequence helper for auto-incrementing order numbers
async function getNextSequence(name) {
  const counter = await Counter.findOneAndUpdate(
    { name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

// ---------------------------------------------------------------------------
// GET ALL ORDERS
// ---------------------------------------------------------------------------
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ placedAt: -1 }).lean();
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error('getOrders error', err);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

// ---------------------------------------------------------------------------
// GET PENDING ORDERS (for sidebar notifications)
// ---------------------------------------------------------------------------
export const getPendingOrders = async (req, res) => {
  try {
    const pendingStatuses = ['Order Received', 'Order Placed in Lab', 'In Lab Processing', 'Transit to Shop', 'Ready for Customer'];
    const orders = await Order.find({ status: { $in: pendingStatuses } }).sort({ placedAt: -1 }).lean();
    res.json({ success: true, orders });
  } catch (err) {
    console.error('getPendingOrders error', err);
    res.status(500).json({ success: false, message: 'Failed to fetch pending orders' });
  }
};

// ---------------------------------------------------------------------------
// GET ORDER BY ID
// ---------------------------------------------------------------------------
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    console.error('getOrderById error', err);
    res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
};

// ---------------------------------------------------------------------------
// UPDATE ORDER STATUS + SEND SEPARATE POLITE EMAIL MESSAGE
// ---------------------------------------------------------------------------
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(id, { status }, { new: true }).lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // EMAIL MESSAGE BASED ON STATUS
    let emailMessage = '';

    switch (status) {
      case 'Order Received':
        emailMessage = `
Dear ${order.customerName || 'Customer'},

We are happy to let you know that we have received your order (Order No: ${order.orderNumber}).
Our team has begun preparing everything for you.

Thank you for choosing WellVision.
Warm regards,
WellVision Optical Team
        `;
        break;

      case 'Order Placed in Lab':
        emailMessage = `
Dear ${order.customerName || 'Customer'},

Your order (Order No: ${order.orderNumber}) has now been sent to our lens laboratory.
Our technicians have started the careful crafting of your lenses.

We appreciate your trust in WellVision.
Warm regards,
WellVision Optical Team
        `;
        break;

      case 'In Lab Processing':
        emailMessage = `
Dear ${order.customerName || 'Customer'},

A quick update for you—your spectacles (Order No: ${order.orderNumber}) are currently being processed in our lab.
Our experts are ensuring your lenses are made with precision and care.

We will notify you as soon as the next stage is completed.
Warm regards,
WellVision Optical Team
        `;
        break;

      case 'Transit to Shop':
        emailMessage = `
Dear ${order.customerName || 'Customer'},

Good news! Your spectacles (Order No: ${order.orderNumber}) are now on their way from our lab to the WellVision store.
They will soon be ready for final inspection.

Warm regards,
WellVision Optical Team
        `;
        break;

      case 'Ready for Customer':
        emailMessage = `
Dear ${order.customerName || 'Customer'},

Your spectacles (Order No: ${order.orderNumber}) are now ready for collection.
You may visit the WellVision store at your convenience to pick them up.

Thank you for choosing WellVision.
Warm regards,
WellVision Optical Team
        `;
        break;
    }

    // SEND EMAIL
    if (order.customerEmail) {
      try {
        await transporter.sendMail({
          from: process.env.SENDER_EMAIL,
          to: order.customerEmail,
          subject: `WellVision – Update on Your Order ${order.orderNumber}`,
          text: emailMessage.trim()
        });
      } catch (emailErr) {
        console.error('Order status email error:', emailErr);
      }
    }

    res.json({ success: true, data: order });

  } catch (err) {
    console.error('updateOrderStatus error', err);
    res.status(500).json({ success: false, message: 'Failed to update order' });
  }
};

// ---------------------------------------------------------------------------
// CREATE ORDER + SEND POLITE CONFIRMATION EMAIL
// ---------------------------------------------------------------------------
export const createOrder = async (req, res) => {
  try {
    const { orderNumber, customerName, customerEmail, items = [], status = 'Order Received', total = 0 } = req.body;

    if (!customerName) {
      return res.status(400).json({ success: false, message: 'customerName is required' });
    }

    // Auto-generate orderNumber if not provided
    let effectiveOrderNumber = (orderNumber || '').trim();
    if (!effectiveOrderNumber) {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      // Get user settings for order prefix
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

      const seq = await getNextSequence('orderNo');
      effectiveOrderNumber = `${settings.order.orderPrefix}-${String(seq).padStart(4, '0')}`;
    }

    if (items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
    }

    // Check duplicate number
    const exists = await Order.findOne({ orderNumber: effectiveOrderNumber });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Order number already exists' });
    }

    // Validate each item
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid item data: productId and positive quantity required' });
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product with ID ${item.productId} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
        });
      }
    }

    // Transaction (atomic)
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await Order.create([{
        orderNumber: effectiveOrderNumber,
        customerName,
        customerEmail,
        items,
        status,
        total
      }], { session });

      // Update product stock
      for (const item of items) {
        await Product.findByIdAndUpdate(
          item.productId,
          {
            $inc: { stock: -item.quantity, totalSold: item.quantity },
            lastStockUpdate: new Date()
          },
          { session }
        );
      }

      await session.commitTransaction();
      const createdOrder = order[0];

      // ORDER CONFIRMATION EMAIL
      if (createdOrder.customerEmail) {
        try {
          await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to: createdOrder.customerEmail,
            subject: `WellVision – Your Order ${createdOrder.orderNumber} Has Been Received`,
            text: `
Dear ${createdOrder.customerName || 'Customer'},

Thank you for choosing WellVision.
We are happy to confirm that your order (Order No: ${createdOrder.orderNumber}) has been successfully placed.

Total Amount: Rs. ${createdOrder.total}

We will keep you updated as your spectacles progress through the preparation stages.

If you have any questions, please feel free to contact us.

Warm regards,
WellVision Optical Team
            `.trim()
          });
        } catch (emailErr) {
          console.error('Order creation email error:', emailErr);
        }
      }

      res.status(201).json({ success: true, data: createdOrder });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (err) {
    console.error('createOrder error', err);
    res.status(500).json({ success: false, message: 'Failed to create order: ' + err.message });
  }
};

// ---------------------------------------------------------------------------
// PREVIEW NEXT ORDER NUMBER (does not increment counter)
// ---------------------------------------------------------------------------
export const previewOrderNumber = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Get user settings for order prefix
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

    const counter = await Counter.findOne({ name: 'orderNo' });
    const nextSeq = (counter?.seq || 0) + 1;
    const formatted = `${settings.order.orderPrefix}-${String(nextSeq).padStart(4, '0')}`;
    res.json({ success: true, nextOrderNumber: formatted });
  } catch (err) {
    console.error('previewOrderNumber error', err);
    res.status(500).json({ success: false, message: 'Error previewing order number' });
  }
};

// ---------------------------------------------------------------------------
// COLLECT ORDER (mark as collected and update status to 'Customer Collected')
// ---------------------------------------------------------------------------
export const collectOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndUpdate(id, { collected: true, status: 'Customer Collected' }, { new: true });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Update corresponding invoice status to 'collected'
    const InvoiceModel = (await import('../models/invoiceModel.js')).default;
    await InvoiceModel.findOneAndUpdate(
      { orderNo: order.orderNumber },
      { status: 'collected' },
      { new: true }
    );

    res.json({ success: true, data: order });
  } catch (err) {
    console.error('collectOrder error', err);
    res.status(500).json({ success: false, message: 'Failed to collect order' });
  }
};

// ---------------------------------------------------------------------------
// DELETE ORDER
// ---------------------------------------------------------------------------
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndDelete(id);

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (err) {
    console.error('deleteOrder error', err);
    res.status(500).json({ success: false, message: 'Failed to delete order' });
  }
};
