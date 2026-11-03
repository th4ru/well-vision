// Importing mongoose to define MongoDB schema and model
import mongoose from "mongoose";

/*
|--------------------------------------------------------------------------
| User Schema Definition
|--------------------------------------------------------------------------
| This schema defines the structure of user documents in the MongoDB database.
| It includes fields for authentication, verification, and timestamps.
*/

const userSchema = new mongoose.Schema({
  name: { type: String, required: true }, 
  // 🧑 Full name of the user (required during registration)

  email: { type: String, required: true, unique: true }, 
  // 📧 User's email address (must be unique)

  password: { type: String, required: true }, 
  // 🔒 Hashed password of the user

  avatar: { type: String }, // profile picture (URL or base64)

  phone: { type: String, default: '' },

  role: { type: String, default: 'User' },

  // Persist per-user application settings (appearance, invoice, etc.)
  settings: { type: mongoose.Schema.Types.Mixed, default: {} },

  lastLogin: { type: Date }, 

  verifyOtp: { type: String, default: '' }, 
  // 📩 OTP sent for verifying the account during registration

  verifyOtpExpireAt: { type: Number, default: 0 }, 
  // ⏱ Timestamp (in ms) indicating when the account verification OTP expires

  isAccountVerified: { type: Boolean, default: false }, 
  // ✅ Whether the user's account is verified (true after email confirmation)

  resetOtp: { type: String, default: '' }, 
  // 📩 OTP sent to reset the password

  resetOtpExpireAt: { type: Number, default: 0 }, 
  // ⏱ Expiry timestamp for the reset password OTP
},
{ timestamps: true } 
// 🕒 Adds `createdAt` and `updatedAt` fields automatically
);

// Security and auditing fields
userSchema.add({
  passwordChangedAt: { type: Date },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  // Email-based 2FA OTP
  twoFaOtp: { type: String, default: '' },
  twoFaOtpExpireAt: { type: Number, default: 0 },
  // Track active sessions (JWT jti)
  activeSessions: [{
    jti: { type: String },
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now }
  }],
  // Login history audit trail
  loginHistory: [{
    time: { type: Date, default: Date.now },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    status: { type: String, enum: ['success', 'fail', 'locked'], default: 'success' },
    message: { type: String, default: '' }
  }]
});

// Create and export the model
// If a model named 'user' already exists, use it. Otherwise, create a new one.
const userModel = mongoose.models.User || mongoose.model('User', userSchema);

export default userModel;
