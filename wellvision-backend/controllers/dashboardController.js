// controllers/dashboardController.js
// Real dashboard/sales data for the admin dashboard.
// Sales are based on the amount actually paid on each invoice (advance), not
// the full billed amount, so outstanding balances do not count as revenue
// until the customer pays. Units are the number of invoice line items.
// Customers come from the same collection used by the customer page.
import Customer from '../models/customer.js';
import InvoiceModel from '../models/invoiceModel.js';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import userModel from '../models/userModel.js';
import { buildStaffPerformance } from '../utils/performance.js';

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

  const [invoices, orders, products] = await Promise.all([
    InvoiceModel.find({
      date: {
        $gte: new Date(previousYear, 0, 1),
        $lt: new Date(currentYear + 1, 0, 1),
      },
    })
      .select('name amount advance items date createdAt customerId orderNo')
      .sort({ date: -1 })
      .lean(),
    Order.find({}).select('orderNumber items').lean(),
    Product.find({}).select('sku name category').lean(),
  ]);

  // Category breakdown is driven by the real product catalogue and the orders
  // that were billed. Paid money is split across each order's item lines in
  // proportion to their value, so the chart total always matches the revenue
  // shown on the dashboard.
  const productById = new Map(
    products.map((product) => [String(product._id), product])
  );
  const productByName = new Map();
  products.forEach((product) => {
    const name = String(product.name || '').trim().toLowerCase();
    if (name) productByName.set(name, product);
    const sku = String(product.sku || '').trim().toLowerCase();
    if (sku) productByName.set(sku, product);
  });

  const orderByNumber = new Map();
  orders.forEach((order) => {
    if (order.orderNumber) orderByNumber.set(order.orderNumber, order);
  });

  const salesByCategory = {};
  const unitsByCategory = {};
  const productsByCategory = {};

  const addCategorySale = (category, amount) => {
    if (!(amount > 0)) return;
    salesByCategory[category] = (salesByCategory[category] || 0) + amount;
  };

  const addCategoryUnits = (category, productName, units) => {
    if (!(units > 0)) return;
    unitsByCategory[category] = (unitsByCategory[category] || 0) + units;
    if (!productsByCategory[category]) productsByCategory[category] = {};
    const name = productName || 'Unnamed product';
    productsByCategory[category][name] =
      (productsByCategory[category][name] || 0) + units;
  };

  const allocateInvoiceToCategories = (invoice, paidAmount) => {
    const order = invoice.orderNo ? orderByNumber.get(invoice.orderNo) : null;
    let lines = [];

    if (order && Array.isArray(order.items) && order.items.length > 0) {
      lines = order.items.map((item) => {
        const product = item.productId
          ? productById.get(String(item.productId))
          : null;
        return {
          category: product?.category || 'uncategorized',
          name:
            product?.name ||
            item.description ||
            item.sku ||
            'Unnamed product',
          units: toNumber(item.quantity),
          amount: toNumber(item.quantity) * toNumber(item.unitPrice),
        };
      });
    } else if (Array.isArray(invoice.items) && invoice.items.length > 0) {
      // Manually created bills have no order link, so match the typed line
      // items against the product catalogue by name or SKU.
      lines = invoice.items.map((item) => {
        const label = item.item || item.description || 'Item';
        const key = String(label).trim().toLowerCase();
        const product = productByName.get(key);
        return {
          category: product?.category || 'uncategorized',
          name: product?.name || label,
          units: 1,
          amount: toNumber(item.rs) + toNumber(item.cts) / 100,
        };
      });
    }

    // Units are counted for every item line, even free or unpaid lines, so the
    // number of products sold reflects every product that has left the shop.
    lines.forEach((line) => {
      addCategoryUnits(line.category, line.name, line.units);
    });

    // Revenue only counts money actually received.
    if (!(paidAmount > 0)) return;

    const usableLines = lines.filter((line) => line.amount > 0);
    const totalLineAmount = usableLines.reduce(
      (sum, line) => sum + line.amount,
      0
    );

    if (totalLineAmount <= 0) {
      const fallbackCategory =
        lines.find((line) => line.category !== 'uncategorized')?.category ||
        'uncategorized';
      addCategorySale(fallbackCategory, paidAmount);
      return;
    }

    usableLines.forEach((line) => {
      addCategorySale(
        line.category,
        (line.amount / totalLineAmount) * paidAmount
      );
    });
  };

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
    allocateInvoiceToCategories(invoice, paidAmount);

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

  // Normalise floating point noise from the proportional split and drop
  // categories that have no paid sales yet.
  const roundedSalesByCategory = {};
  Object.entries(salesByCategory).forEach(([category, amount]) => {
    const rounded = Math.round(amount * 100) / 100;
    if (rounded > 0) roundedSalesByCategory[category] = rounded;
  });

  // Whole-number units and the per-product quantities behind each category.
  const roundedUnitsByCategory = {};
  const categoryProducts = {};
  Object.entries(unitsByCategory).forEach(([category, units]) => {
    const rounded = Math.round(units);
    if (rounded > 0) roundedUnitsByCategory[category] = rounded;
  });
  Object.entries(productsByCategory).forEach(([category, names]) => {
    categoryProducts[category] = Object.entries(names)
      .map(([name, quantity]) => ({
        name,
        quantity: Math.round(quantity),
      }))
      .filter((entry) => entry.quantity > 0)
      .sort((a, b) => b.quantity - a.quantity);
  });

  return {
    dailyData,
    monthlyData,
    salesByCategory: roundedSalesByCategory,
    unitsByCategory: roundedUnitsByCategory,
    productsByCategory: categoryProducts,
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
      salesByCategory: sales.salesByCategory,
      unitsByCategory: sales.unitsByCategory,
      productsByCategory: sales.productsByCategory,
      yearlySalesTotal: sales.currentYearTotal,
    });
  } catch (error) {
    console.error('GET /sales/sales error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/management/performance
// Real per-staff sales performance, attributed through invoice.createdBy.
export const getStaffPerformance = async (req, res) => {
  try {
    const performance = await buildStaffPerformance();
    return res.json(performance);
  } catch (error) {
    console.error('GET /management/performance error:', error.message);
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
      salesByCategory: sales.salesByCategory,
      unitsByCategory: sales.unitsByCategory,
      productsByCategory: sales.productsByCategory,
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

// GET /api/admin/client/transactions
// Real transaction history built from orders, enriched with the matching bill
// balance and the staff member who created the sale.
export const getAdminTransactions = async (req, res) => {
  try {
    const page = Math.max(0, Number.parseInt(req.query.page, 10) || 0);
    const pageSize = Math.min(
      200,
      Math.max(1, Number.parseInt(req.query.pageSize, 10) || 20)
    );
    const search = (req.query.search || '').trim().toLowerCase();

    let sortField = '';
    let sortDirection = 'desc';
    if (req.query.sort) {
      try {
        const parsed = JSON.parse(req.query.sort);
        const entry = Array.isArray(parsed) ? parsed[0] : parsed;
        if (entry && entry.field) {
          sortField = entry.field;
          sortDirection = entry.sort === 'asc' ? 'asc' : 'desc';
        }
      } catch {
        // Ignore malformed sort parameters and keep the default order.
      }
    }

    const [orders, invoices] = await Promise.all([
      Order.find({}).sort({ placedAt: -1 }).lean(),
      InvoiceModel.find({})
        .select('orderNo billNo amount advance balance createdBy status date')
        .lean(),
    ]);

    const invoiceByOrder = new Map();
    invoices.forEach((invoice) => {
      if (invoice.orderNo) invoiceByOrder.set(invoice.orderNo, invoice);
    });

    const creatorIds = new Set();
    orders.forEach((order) => {
      if (order.createdBy) creatorIds.add(String(order.createdBy));
      const invoice = invoiceByOrder.get(order.orderNumber);
      if (invoice?.createdBy) creatorIds.add(String(invoice.createdBy));
    });

    const creators = creatorIds.size
      ? await userModel
          .find({ _id: { $in: [...creatorIds] } })
          .select('name email staffId role')
          .lean()
      : [];
    const creatorById = new Map(
      creators.map((user) => [String(user._id), user])
    );

    let transactions = orders.map((order) => {
      const invoice = invoiceByOrder.get(order.orderNumber);
      const creator =
        (order.createdBy && creatorById.get(String(order.createdBy))) ||
        (invoice?.createdBy && creatorById.get(String(invoice.createdBy))) ||
        null;

      const total = toNumber(order.total);
      const amountGiven = toNumber(order.amountGiven);
      // Orders without a bill fall back to the same due-balance rule used by
      // the staff Orders page.
      const fallbackBalance =
        order.status === 'Customer Collected' && amountGiven <= 0
          ? 0
          : Math.max(total - amountGiven, 0);
      const balance = invoice ? toNumber(invoice.balance) : fallbackBalance;

      const items = (order.items || []).map((item) => {
        const quantity = toNumber(item.quantity);
        const unitPrice = toNumber(item.unitPrice);
        return {
          description: item.description || item.sku || 'Item',
          sku: item.sku || '',
          quantity,
          unitPrice,
          lineTotal: quantity * unitPrice,
        };
      });

      return {
        _id: String(order._id),
        orderNumber: order.orderNumber,
        billNo: invoice?.billNo || '',
        staffId: creator?.staffId || '—',
        staffName: creator?.name || '—',
        customerName: order.customerName || invoice?.name || '—',
        orderDate: order.placedAt || order.createdAt || invoice?.date || null,
        total,
        paid: Math.max(total - balance, 0),
        balance,
        status: order.status,
        items,
        products: items.map((item) => item.description),
      };
    });

    if (search) {
      transactions = transactions.filter((transaction) =>
        [
          transaction.orderNumber,
          transaction.billNo,
          transaction.staffId,
          transaction.staffName,
          transaction.customerName,
          transaction.status,
          ...transaction.products,
        ].some((value) =>
          String(value || '').toLowerCase().includes(search)
        )
      );
    }

    if (sortField) {
      const direction = sortDirection === 'asc' ? 1 : -1;
      transactions.sort((a, b) => {
        if (sortField === 'orderDate') {
          const aTime = new Date(a.orderDate).getTime() || 0;
          const bTime = new Date(b.orderDate).getTime() || 0;
          return (aTime - bTime) * direction;
        }
        const aValue = a[sortField];
        const bValue = b[sortField];
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return (aValue - bValue) * direction;
        }
        return (
          String(aValue ?? '').localeCompare(String(bValue ?? '')) * direction
        );
      });
    }

    const total = transactions.length;
    const start = page * pageSize;
    const paged = transactions.slice(start, start + pageSize);

    return res.json({ transactions: paged, total });
  } catch (error) {
    console.error('GET /client/transactions error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
