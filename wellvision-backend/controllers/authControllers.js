// Importing bcrypt for password hashing and comparison
import bcrypt from 'bcryptjs';

// Importing JWT for token-based authentication
import jwt from 'jsonwebtoken';

// Importing the user model schema
import userModel from '../models/userModel.js';

// Importing the nodemailer transporter for sending emails
import transporter from '../config/nodemailer.js';

import config from '../config/config.js';

import sendToken from "../utils/sendToken.js";


/*
|--------------------------------------------------------------------------
| REGISTER CONTROLLER
|--------------------------------------------------------------------------
| Handles user registration:
| - Validates input
| - Checks for existing user
| - Hashes password
| - Creates JWT and sets cookie
| - Sends welcome email
*/
export const register = async (req, res) => {
    const { name, email, password } = req.body;

    // ✅ Check for required fields
    if (!name || !email || !password) {
        return res.json({ success: false, message: 'Missing Details' });
    }

    try {
        // 🔍 Check if user already exists by email
        const existingUser = await userModel.findOne({ email });

        if (existingUser) {
            return res.json({ success: false, message: " User already exists" });
        }

        // 🔐 Hash the password using bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);

        // 📝 Create and save new user in DB
        const user = new userModel({ name, email, password: hashedPassword });
        await user.save();

        // 🔑 Generate JWT token for authentication
        sendToken(user, res);
        // 🍪 Set token in HTTP-only cookie

        // 📧 Send welcome email to registered user
        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Welcome to WellVision',
            text: `Welcome to WellVision Staff. Your account has been created with email id: ${email}`
        };

        await transporter.sendMail(mailOption);

        return res.json({ success: true });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

/*
|--------------------------------------------------------------------------
| LOGIN CONTROLLER
|--------------------------------------------------------------------------
| Authenticates a user:
| - Validates input
| - Compares hashed password
| - Issues JWT token
| - Sets cookie
*/
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ success: false, message: "Email and password are required" });
  }

  try {
    // 🔍 Find user by email
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "Invalid email" });
    }

    // 🔐 Compare provided password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    // Account lock check
    if (user.lockUntil && user.lockUntil > Date.now()) {
      user.loginHistory.push({ status: 'locked', message: 'Account locked', ip: req.ip, userAgent: req.headers['user-agent'] || '' });
      await user.save();
      return res.status(423).json({ success: false, message: 'Account locked due to too many failed attempts. Try again later.' });
    }

    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      user.loginHistory.push({ status: 'fail', message: 'Invalid password', ip: req.ip, userAgent: req.headers['user-agent'] || '' });
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // lock 15 min
      }
      await user.save();
      return res.json({ success: false, message: "Invalid password" });
    }

    // Reset failed attempts on success
    user.failedLoginAttempts = 0;
    user.lockUntil = null;

     // Update lastLogin timestamp
    user.lastLogin = new Date();
    await user.save();

    // 🔑 Generate token and create tracked session
    sendToken(user, res);

    // Send success with user data (omit sensitive info like password)
    // Force role to 'Admin' for admin@example.com
    const userRole = user.email === 'admin@example.com' ? 'Admin' : user.role;
    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: userRole,
        lastLogin: user.lastLogin
        // Add other info if needed, e.g. avatar, roles, etc.
      }
    });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};


/*
|--------------------------------------------------------------------------
| LOGOUT CONTROLLER
|--------------------------------------------------------------------------
| Clears the token cookie to log the user out
*/
export const logout = async (req, res) => {
    try {
        // ❌ Clear the JWT cookie
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        });

        return res.json({ success: true, message: "Logged Out" });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

/*
|--------------------------------------------------------------------------
| SEND VERIFY OTP
|--------------------------------------------------------------------------
| Sends a 6-digit OTP to user’s email for account verification
*/
export const sendVerifyOtp = async (req, res) => {
    try {
        const { userId } = req.body;

        // 🔍 Find user by ID
        const user = await userModel.findById(userId);

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        if (user.isAccountVerified) {
            return res.json({ success: false, message: "Account already verified" });
        }

        // 🔢 Generate 6-digit OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000));

        // 💾 Save OTP and expiry
        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        await user.save();

        // 📧 Email the OTP
        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Account Verification OTP',
            text: `Your OTP is ${otp}. Verify your account using this OTP.`
        };

        await transporter.sendMail(mailOption);

        res.json({ success: true, message: "Verification OTP sent on Email" });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

/*
|--------------------------------------------------------------------------
| VERIFY EMAIL
|--------------------------------------------------------------------------
| Validates the OTP and updates the user’s verification status
*/
export const verifyEmail = async (req, res) => {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
        return res.json({ success: false, message: "Missing Details" });
    }

    try {
        const user = await userModel.findById(userId);

        if (!user) {
            return res.json({ success: false, message: " User not found" });
        }

        if (user.verifyOtp === '' || user.verifyOtp !== otp) {
            return res.json({ success: false, message: "Invalid OTP" });
        }

        if (user.verifyOtpExpireAt < Date.now()) {
            return res.json({ success: false, message: "OTP Expired" });
        }

        // ✅ Update user verification status
        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;

        await user.save();

        return res.json({ success: true, message: "Email verified successfully." });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

/*
|--------------------------------------------------------------------------
| IS AUTHENTICATED
|--------------------------------------------------------------------------
| Used by frontend to verify if token is valid
*/
export const isAuthenticated = async (req, res) => {
    try {
        return res.json({ success: true });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

/*
|--------------------------------------------------------------------------
| SEND RESET OTP
|--------------------------------------------------------------------------
| Sends a reset OTP for password recovery
*/
export const sendResetOtp = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.json({ success: false, message: "Email is required." });
    }

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User not found." });
        }

        // 🔢 Generate 6-digit reset OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000));

        // 💾 Save OTP and expiration (15 mins)
        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;
        await user.save();

        // 📧 Email the reset OTP
        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Account Verification OTP',
            text: `Your OTP for resetting your password is ${otp}.
            Use this OTP to proceed with resetting your password.`
        };

        await transporter.sendMail(mailOption);

        return res.json({ success: true, message: 'OTP is sent to your email' });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

/*
|--------------------------------------------------------------------------
| RESET PASSWORD
|--------------------------------------------------------------------------
| Validates reset OTP and updates user's password
*/
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ success: false, message: 'Email, OTP and new password are required' });
  }

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log("Provided OTP:", otp);
    console.log("Stored OTP:", user.resetOtp);
    console.log("OTP Expires At:", user.resetOtpExpireAt);
    console.log("Now:", Date.now());


    // Check if OTP is expired
    if (!user.resetOtpExpireAt || user.resetOtpExpireAt < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP Expired' });
    }

    // Check if OTP is invalid
    if (!user.resetOtp || user.resetOtp.trim() !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Clear OTP
    user.resetOtp = '';
    user.resetOtpExpireAt = 0;

    await user.save();

    return res.status(200).json({ success: true, message: 'Password has been reset successfully' });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
