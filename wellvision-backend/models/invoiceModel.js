import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  item: { type: String, required: true },
  description: { type: String },
  // Rs/Cts are now optional; default to 0 so lines without explicit amounts
  // still validate and can be saved/printed.
  rs: { type: Number, required: false, default: 0 },
  cts: { type: Number, required: false, default: 0 },
});

const invoiceSchema = new mongoose.Schema({
  // Order number now optional so backend can auto-generate or leave blank
  // without causing a validation failure when saving invoices.
  orderNo: { type: String, required: false, default: '' },
  date: { type: Date, default: Date.now },
  billNo: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  tel: {
    type: String,
    required: true,
    match: [/^(?:0|94|\+94)?(7[0-9]{8})$/, 'Invalid Sri Lankan phone number'],
  },
  address: { type: String, required: true },
  // Optional link back to the customer this invoice belongs to
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: false },
  items: [itemSchema],
  amount: { type: Number, required: true },
  advance: { type: Number, required: true },
  balance: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'collected'],
    default: 'pending'
  },
}, { timestamps: true });

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;
