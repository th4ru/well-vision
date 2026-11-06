// controllers/dashboardController.js
// Real dashboard/sales data for the admin dashboard.
// Sales are based on the amount actually paid on each invoice (advance), not
// the full billed amount, so outstanding balances do not count as revenue
// until the customer pays. Units are the number of invoice line items.
// Customers come from the same collection used by the customer page.
import Customer from '../models/customer.js';
import InvoiceModel from '../models/invoiceModel.js';
import Product from '../models/productModel.js';
import userModel from '../models/userModel.js';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const pad = (value) => String(value).padStart(2, '0');

const dateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const percentChange = (current, previous) => {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const getInvoiceDate = (invoice) => {
  const date = new Date(invoice.date || invoice.createdAt);
  return Number.isNaN(date.getTime()) ? null : date;
};

/*
|--------------------------------------------------------------------------
| Aggregate invoices for the current and previous year.
|--------------------------------------------------------------------------
| Returns zero-filled monthly data for the current year, daily data for the
| current year, and comparison values used by the dashboard.
*/
const buildSalesData = async () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const previousYear = currentYear - 1;

  const invoices = await InvoiceModel.find({
    date: {
      $gte: new Date(previousYear, 0, 1),
      $lt: new Date(currentYear + 1, 0, 1),
    },
  })
    .select('name amount advance items date createdAt customerId')
    .sort({ date: -1 })
    .lean();

  const monthlyData = {};
  MONTHS.forEach((month) => {
    monthlyData[month] = { month, totalSales: 0, totalUnits: 0 };
  });

  const dailyData = {};
  const todayKey = dateKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayKey = dateKey(yesterday);

  const lastMonthDate = new Date(currentYear, now.getMonth() - 1, 1);
  const lastMonthIndex = lastMonthDate.getMonth();
  const lastMonthYear = lastMonthDate.getFullYear();

  let currentYearTotal = 0;
  let previousYearTotal = 0;
  let currentMonthTotal = 0;
  let lastMonthTotal = 0;
  let todayTotal = 0;
  let yesterdayTotal = 0;
  let currentMonthUnits = 0;

  const currentYearInvoices = [];

  invoices.forEach((invoice) => {
    const invoiceDate = getInvoiceDate(invoice);
    if (!invoiceDate) return;

    // Only the money the customer has actually paid counts towards sales.
    // The unpaid balance stays a receivable until the bill is settled.
    const paidAmount = toNumber(invoice.advance);
    const units = Array.isArray(invoice.items) ? invoice.items.length : 0;
    const year = invoiceDate.getFullYear();

    if (year === previousYear) {
      previousYearTotal += paidAmount;
    }

    if (year === lastMonthYear && invoiceDate.getMonth() === lastMonthIndex) {
      lastMonthTotal += paidAmount;
    }

    if (year !== currentYear) return;

    currentYearInvoices.push(invoice);
    currentYearTotal += paidAmount;

    const month = monthlyData[MONTHS[invoiceDate.getMonth()]];
    month.totalSales += paidAmount;
    month.totalUnits += units;

    const key = dateKey(invoiceDate);
    if (!dailyData[key]) {
      dailyData[key] = { date: key, totalSales: 0, totalUnits: 0 };
    }
    dailyData[key].totalSales += paidAmount;
    dailyData[key].totalUnits += units;

    if (key === todayKey) {
      todayTotal += paidAmount;
    }
    if (key === yesterdayKey) {
      yesterdayTotal += paidAmount;
    }
    if (invoiceDate.getMonth() === now.getMonth()) {
      currentMonthTotal += paidAmount;
      currentMonthUnits += units;
    }
  });

  const todayStats = dailyData[todayKey] || {
    date: todayKey,
    totalSales: 0,
    totalUnits: 0,
  };

  return {
    dailyData,
    monthlyData,
    currentYearInvoices,
    currentYearTotal,
    previousYearTotal,
    currentMonthTotal,
    lastMonthTotal,
    currentMonthUnits,
    todayTotal,
    yesterdayTotal,
    todayUnits: todayStats.totalUnits,
    monthlyChange: percentChange(currentMonthTotal, lastMonthTotal),
    todayChange: percentChange(todayTotal, yesterdayTotal),
    yearlyChange: percentChange(currentYearTotal, previousYearTotal),
  };
};

// GET /api/admin/sales/sales
export const getSales = async (req, res) => {
  try {
    const sales = await buildSalesData();

    return res.json({
      dailyData: sales.dailyData,
      monthlyData: sales.monthlyData,
      yearlySalesTotal: sales.currentYearTotal,
    });
  } catch (error) {
    console.error('GET /sales/sales error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/general/dashboard
export const getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [sales, totalCustomers, newCustomersThisMonth, newCustomersLastMonth] =
      await Promise.all([
        buildSalesData(),
        Customer.countDocuments(),
        Customer.countDocuments({
          createdAt: { $gte: startOfThisMonth, $lt: startOfNextMonth },
        }),
        Customer.countDocuments({
          createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
        }),
      ]);

    const transactions = sales.currentYearInvoices.slice(0, 10).map((invoice) => ({
      _id: invoice._id,
      userId: invoice.name || invoice.customerId,
      createdAt: invoice.date || invoice.createdAt,
      products: Array.isArray(invoice.items) ? invoice.items.map((item) => item.item) : [],
      cost: toNumber(invoice.amount),
    }));

    return res.json({
      totalCustomers,
      customerChange: percentChange(newCustomersThisMonth, newCustomersLastMonth),
      todayStats: {
        totalSales: sales.todayTotal,
        totalUnits: sales.todayUnits,
        change: sales.todayChange,
      },
      thisMonthStats: {
        totalSales: sales.currentMonthTotal,
        totalUnits: sales.currentMonthUnits,
        change: sales.monthlyChange,
      },
      yearlySalesTotal: sales.currentYearTotal,
      yearlyChange: sales.yearlyChange,
      monthlyData: sales.monthlyData,
      salesByCategory: {},
      transactions,
    });
  } catch (error) {
    console.error('GET /general/dashboard error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/client/customers
export const getAdminCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 }).lean();
    return res.json(customers);
  } catch (error) {
    console.error('GET /client/customers error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/*
|--------------------------------------------------------------------------
| Products
|--------------------------------------------------------------------------
| The admin products page uses the same Product collection as the rest of the
| application. Only admins can reach these routes (see adminRoutes.js).
*/

const PRODUCT_CATEGORIES = [
  'eyeglasses',
  'sunglasses',
  'contact-lenses',
  'lens',
  'accessories',
];

// Shape consumed by the admin product cards.
const toProductResponse = (product) => ({
  _id: product._id,
  sku: product.sku || '',
  name: product.name,
  category: product.category,
  brand: product.brand,
  model: product.model || '',
  price: toNumber(product.price),
  cost: toNumber(product.cost),
  stock: toNumber(product.stock),
  reorderLevel: toNumber(product.reorderLevel),
  description: product.description || '',
  frameMaterial: product.frameMaterial || '',
  frameColor: product.frameColor || '',
  lensType: product.lensType || '',
  // Fields used by the existing product card layout
  rating: toNumber(product.averageRating),
  averageRating: toNumber(product.averageRating),
  supply: toNumber(product.stock),
  totalSold: toNumber(product.totalSold),
  createdAt: product.createdAt,
});

// GET /api/admin/client/products
export const getAdminProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(products.map(toProductResponse));
  } catch (error) {
    console.error('GET /client/products error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/client/products
export const createAdminProduct = async (req, res) => {
  const name = (req.body.name || '').trim();
  const brand = (req.body.brand || '').trim();
  const category = (req.body.category || '').trim();
  const model = (req.body.model || '').trim();
  const description = (req.body.description || '').trim();
  const price = Number(req.body.price);
  const cost = Number(req.body.cost);
  const stock = Number(req.body.stock);
  const reorderLevel = req.body.reorderLevel === '' || req.body.reorderLevel === undefined
    ? 10
    : Number(req.body.reorderLevel);

  if (!name || !brand || !category) {
    return res.status(400).json({
      success: false,
      message: 'Name, category and brand are required',
    });
  }
  if (!PRODUCT_CATEGORIES.includes(category)) {
    return res.status(400).json({
      success: false,
      message: `Category must be one of: ${PRODUCT_CATEGORIES.join(', ')}`,
    });
  }
  if (!Number.isFinite(price) || price < 0) {
    return res.status(400).json({ success: false, message: 'Price must be a number of 0 or more' });
  }
  if (!Number.isFinite(cost) || cost < 0) {
    return res.status(400).json({ success: false, message: 'Cost must be a number of 0 or more' });
  }
  if (!Number.isFinite(stock) || stock < 0) {
    return res.status(400).json({ success: false, message: 'Stock must be a number of 0 or more' });
  }
  if (!Number.isFinite(reorderLevel) || reorderLevel < 0) {
    return res.status(400).json({ success: false, message: 'Reorder level must be a number of 0 or more' });
  }

  try {
    const product = await Product.create({
      name,
      category,
      brand,
      model: model || undefined,
      description: description || undefined,
      price,
      cost,
      stock,
      reorderLevel,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      product: toProductResponse(product.toObject()),
      message: 'Product created successfully',
    });
  } catch (error) {
    console.error('POST /client/products error:', error.message);

    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'A product with this SKU already exists' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/general/me
export const getCurrentUser = async (req, res) => {
  try {
    const user = await userModel
      .findById(req.user.id)
      .select('name email phone role avatar isAccountVerified createdAt lastLogin');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Keep the same role promotion used by the login controller.
    const isAdmin = user.email === 'admin@example.com' || /^admin$/i.test(user.role || '');

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      avatar: user.avatar || '',
      role: isAdmin ? 'Admin' : user.role,
      isAccountVerified: user.isAccountVerified,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    });
  } catch (error) {
    console.error('GET /general/me error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/admin/general/me
// Lets the logged-in account edit its own profile details (name/email/phone).
export const updateCurrentUser = async (req, res) => {
  const updates = {};

  if (req.body.name !== undefined) {
    const name = (req.body.name || '').trim();
    if (!name) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }
    updates.name = name;
  }

  if (req.body.email !== undefined) {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }
    updates.email = email;
  }

  if (req.body.phone !== undefined) {
    const phone = (req.body.phone || '').trim();
    if (phone && !/^\+?[0-9\s-]{7,15}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Invalid phone format' });
    }
    updates.phone = phone;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, message: 'No profile fields to update' });
  }

  try {
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (updates.email && updates.email !== user.email.toLowerCase()) {
      const taken = await userModel.findOne({
        email: updates.email,
        _id: { $ne: user._id },
      });
      if (taken) {
        return res.status(409).json({ success: false, message: 'Email already in use' });
      }
    }

    // Editing an admin account must not accidentally revoke admin access
    // (the built-in admin is recognised by email as well as role).
    const wasAdmin =
      user.email === 'admin@example.com' || /^admin$/i.test(user.role || '');

    if (updates.name !== undefined) user.name = updates.name;
    if (updates.email !== undefined) user.email = updates.email;
    if (updates.phone !== undefined) user.phone = updates.phone;
    if (wasAdmin) user.role = 'Admin';

    await user.save();

    // Keep the same role promotion used by the login/get-me controllers.
    const isAdmin = user.email === 'admin@example.com' || /^admin$/i.test(user.role || '');

    return res.json({
      success: true,
      message: 'Account details updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        avatar: user.avatar || '',
        role: isAdmin ? 'Admin' : user.role,
        isAccountVerified: user.isAccountVerified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }
    console.error('PUT /general/me error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
