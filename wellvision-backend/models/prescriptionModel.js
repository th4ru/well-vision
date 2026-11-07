// models/prescriptionModel.js
import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true,
  },
  // Stored file name on disk (unique) and the name the staff member uploaded.
  fileName: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String },
  size: { type: Number, default: 0 },
  // Public relative URL used by the frontend to open/download the file.
  url: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model('Prescription', prescriptionSchema);
