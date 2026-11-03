// models/Customer.js
import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  givenName: { type: String, required: true },
  familyName: { type: String, required: true },
  ageYears: { type: Number, required: true },
  birthDate: { type: Date },
  nicPassport: {
    type: String,
    required: true,
    match: [/^[0-9]{9}[VvXx]|[0-9]{12}$/, 'Invalid NIC/Passport format'],
  },
  gender: { type: String, required: true },
  ethnicity: { type: String, required: true }, // updated from "nationality"
  phoneNo: {
    type: String,
    required: true,
    match: [/^(?:0|94|\+94)?(7[0-9]{8})$/, 'Invalid Sri Lankan phone number'],
  },
  address: { type: String, required: true },
  email: {
    type: String,
    required: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
}, { timestamps: true });

export default mongoose.model('Customer', customerSchema);
