// utils/performance.js
// Builds the real staff sales-performance report used by the admin
// Performance page. Sales are attributed to the user account that created the
// invoice, and only money actually paid (the invoice advance) counts as sales.
import Invoice from '../models/invoiceModel.js';
import userModel from '../models/userModel.js';

// Older invoices predate the createdBy field. Attribute them to the earliest
// admin account so the report has a real owner instead of a fake row.
export const backfillInvoiceCreators = async () => {
  const missingFilter = {
    $or: [{ createdBy: { $exists: false } }, { createdBy: null }],
  };

  const missing = await Invoice.countDocuments(missingFilter);
  if (!missing) return 0;

  const admin = await userModel
    .findOne({
      $or: [
        { role: { $regex: '^admin$', $options: 'i' } },
        { email: 'admin@example.com' },
      ],
    })
    .sort({ createdAt: 1 })
    .select('_id')
    .lean();

  if (!admin) return 0;

  const result = await Invoice.updateMany(missingFilter, {
    $set: { createdBy: admin._id },
  });

  return result.modifiedCount || 0;
};

const emptyRow = (user) => ({
  _id: String(user._id),
  staffId: user.staffId || '',
  name: user.name || 'Unknown',
  email: user.email || '',
  role: user.role || '',
  salesCount: 0,
  unitsSold: 0,
  totalSales: 0,
  lastSale: null,
});

export const buildStaffPerformance = async () => {
  const [users, invoices] = await Promise.all([
    userModel
      .find({})
      .select('staffId name email role createdAt')
      .sort({ createdAt: 1 })
      .lean(),
    Invoice.find({})
      .select('createdBy advance amount items date createdAt')
      .lean(),
  ]);

  const rows = new Map();
  users.forEach((user) => rows.set(String(user._id), emptyRow(user)));

  let unassigned = null;

  invoices.forEach((invoice) => {
    const key = invoice.createdBy ? String(invoice.createdBy) : '';

    let row = rows.get(key);
    if (!row) {
      if (!unassigned) {
        unassigned = {
          _id: 'unassigned',
          staffId: '—',
          name: 'Unassigned',
          email: '',
          role: '',
          salesCount: 0,
          unitsSold: 0,
          totalSales: 0,
          lastSale: null,
        };
      }
      row = unassigned;
    }

    row.salesCount += 1;
    row.unitsSold += Array.isArray(invoice.items) ? invoice.items.length : 0;
    row.totalSales += Number(invoice.advance) || 0;

    const saleDate = invoice.date || invoice.createdAt;
    if (saleDate && (!row.lastSale || new Date(saleDate) > new Date(row.lastSale))) {
      row.lastSale = saleDate;
    }
  });

  const staff = [...rows.values()];
  if (unassigned) staff.push(unassigned);

  staff.sort(
    (a, b) => b.totalSales - a.totalSales || a.name.localeCompare(b.name)
  );

  const totals = staff.reduce(
    (acc, row) => ({
      salesCount: acc.salesCount + row.salesCount,
      unitsSold: acc.unitsSold + row.unitsSold,
      totalSales: acc.totalSales + row.totalSales,
    }),
    { salesCount: 0, unitsSold: 0, totalSales: 0 }
  );

  return { staff, totals };
};
