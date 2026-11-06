import Invoice from '../models/invoiceModel.js';
import Counter from '../models/counterModel.js';
import Settings from '../models/settingsModel.js';

// Allocate the next bill number using the same counter as the manual
// invoice flow so order-generated bills and manually created bills never
// collide.
async function getNextBillNumber(userId) {
  let prefix = 'INV';
  if (userId) {
    const settings = await Settings.findOne({ userId }).lean();
    if (settings?.invoice?.invoicePrefix) {
      prefix = settings.invoice.invoicePrefix;
    }
  }

  // Skip numbers that are already stored (for example, bills created before
  // the counter existed).
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const counter = await Counter.findOneAndUpdate(
      { name: 'billNo' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const billNo = `${prefix}-${String(counter.seq).padStart(4, '0')}`;
    const exists = await Invoice.exists({ billNo });
    if (!exists) return billNo;
  }

  throw new Error('Unable to allocate a unique bill number');
}

// Create the bill that belongs to an order. Every order placed for a known
// customer gets one bill; payments recorded on the order become the advance
// and the remaining amount becomes the balance.
export const createBillForOrder = async (order, customer, userId) => {
  if (!order || !customer) return null;

  const existingBill = await Invoice.findOne({ orderNo: order.orderNumber });
  if (existingBill) return existingBill;

  const total = Number(order.total) || 0;
  const isCollected = order.status === 'Customer Collected';
  const recordedPayment = Number(order.amountGiven) || 0;

  // A collected order is fully settled; otherwise only the recorded payment
  // counts as an advance.
  const advance = isCollected ? total : Math.min(recordedPayment, total);
  const balance = Math.max(total - advance, 0);

  const billNo = await getNextBillNumber(userId);

  return Invoice.create({
    orderNo: order.orderNumber,
    date: order.placedAt || new Date(),
    billNo,
    name:
      `${customer.givenName || ''} ${customer.familyName || ''}`.trim() ||
      order.customerName,
    tel: customer.phoneNo,
    address: customer.address,
    customerId: customer._id,
    items: (order.items || []).map((item) => ({
      item: item.description || item.sku || 'Item',
      description: item.sku ? `SKU: ${item.sku}` : '',
      rs: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
      cts: 0,
    })),
    amount: total,
    advance,
    balance,
    status: isCollected ? 'collected' : 'pending',
  });
};

export default createBillForOrder;
