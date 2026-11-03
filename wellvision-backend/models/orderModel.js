import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sku: { type: String, required: false },
  description: { type: String },
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true, default: 0 },
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: ['Order Received', 'Order Placed in Lab', 'In Lab Processing', 'Transit to Shop', 'Ready for Customer', 'Customer Collected'],
    default: 'Order Received',
  },
  collected: { type: Boolean, default: false },
  total: { type: Number, required: true, default: 0 },
  placedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;
