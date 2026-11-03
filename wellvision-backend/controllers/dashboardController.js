// controllers/dashboardController.js
// Real dashboard/sales data for the admin dashboard.
// Sales are based on invoices (amount billed); units are the number of
// invoice line items. Customers come from the same collection used by the
// customer page.
import Customer from '../models/customer.js';
import InvoiceModel from '../models/invoiceModel.js';

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
    .select('name amount items date createdAt customerId')
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

    const amount = toNumber(invoice.amount);
    const units = Array.isArray(invoice.items) ? invoice.items.length : 0;
    const year = invoiceDate.getFullYear();

    if (year === previousYear) {
      previousYearTotal += amount;
    }

    if (year === lastMonthYear && invoiceDate.getMonth() === lastMonthIndex) {
      lastMonthTotal += amount;
    }

    if (year !== currentYear) return;

    currentYearInvoices.push(invoice);
    currentYearTotal += amount;

    const month = monthlyData[MONTHS[invoiceDate.getMonth()]];
    month.totalSales += amount;
    month.totalUnits += units;

    const key = dateKey(invoiceDate);
    if (!dailyData[key]) {
      dailyData[key] = { date: key, totalSales: 0, totalUnits: 0 };
    }
    dailyData[key].totalSales += amount;
    dailyData[key].totalUnits += units;

    if (key === todayKey) {
      todayTotal += amount;
    }
    if (key === yesterdayKey) {
      yesterdayTotal += amount;
    }
    if (invoiceDate.getMonth() === now.getMonth()) {
      currentMonthTotal += amount;
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
