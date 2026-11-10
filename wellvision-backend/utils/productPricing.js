import Order from '../models/orderModel.js';
import Invoice from '../models/invoiceModel.js';

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

/*
|--------------------------------------------------------------------------
| Re-price existing orders and bills when a product's selling price changes
|--------------------------------------------------------------------------
| Orders keep a unit price per line, so editing the product catalogue price
| would otherwise leave old orders (and their bills) at the old amount. This
| keeps them in sync so sales and Actual Revenue immediately reflect the new
| price. The money already collected is only increased when the bill was
| already fully paid (or the order was collected); part-paid bills keep their
| advance and simply get a recalculated balance.
*/
export const applyProductPriceToOrdersAndBills = async (productId, newPrice) => {
  const targetId = String(productId);
  const price = toNumber(newPrice);

  const orders = await Order.find({ 'items.productId': productId });

  for (const order of orders) {
    let priceChanged = false;

    order.items.forEach((item) => {
      if (
        String(item.productId) === targetId &&
        toNumber(item.unitPrice) !== price
      ) {
        item.unitPrice = price;
        priceChanged = true;
      }
    });

    if (!priceChanged) continue;

    order.total = order.items.reduce(
      (sum, item) => sum + toNumber(item.quantity) * toNumber(item.unitPrice),
      0
    );
    await order.save();

    const invoice = await Invoice.findOne({ orderNo: order.orderNumber });
    if (!invoice) continue;

    const oldAmount = toNumber(invoice.amount);
    const newAmount = toNumber(order.total);
    const wasFullyPaid =
      invoice.status === 'collected' || toNumber(invoice.advance) >= oldAmount;

    invoice.items = order.items.map((item) => ({
      item: item.description || item.sku || 'Item',
      description: item.sku ? `SKU: ${item.sku}` : '',
      rs: toNumber(item.quantity) * toNumber(item.unitPrice),
      cts: 0,
    }));
    invoice.amount = newAmount;

    if (wasFullyPaid) {
      // The bill was settled, so treat the re-priced total as paid.
      invoice.advance = newAmount;
      invoice.balance = 0;
      if (order.status === 'Customer Collected') invoice.status = 'collected';
    } else {
      invoice.balance = Math.max(newAmount - toNumber(invoice.advance), 0);
    }

    await invoice.save();
  }

  return orders.length;
};

export default applyProductPriceToOrdersAndBills;
