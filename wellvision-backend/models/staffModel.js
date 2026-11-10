// models/staffModel.js
import mongoose from 'mongoose';

const STAFF_ROLES = ['Admin', 'Manager', 'Supervisor', 'Employee'];
const STAFF_STATUSES = ['Active', 'Inactive'];

const staffSchema = new mongoose.Schema(
  {
    staffId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      default: '',
      trim: true,
    },
    role: {
      type: String,
      enum: STAFF_ROLES,
      default: 'Employee',
    },
    status: {
      type: String,
      enum: STAFF_STATUSES,
      default: 'Active',
    },
    department: {
      type: String,
      default: '',
      trim: true,
    },
    hireDate: {
      type: Date,
      default: Date.now,
    },
    // Keys from config/accessModules.js that this staff member may access.
    access: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export { STAFF_ROLES, STAFF_STATUSES };
export default mongoose.model('Staff', staffSchema);
