import mongoose from 'mongoose';

const forexRateSchema = new mongoose.Schema({
  base: { type: String, default: 'LKR' },
  rates: { type: Map, of: Number, default: {} },
  fetchedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('ForexRate', forexRateSchema);