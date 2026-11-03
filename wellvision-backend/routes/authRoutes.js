// Importing Express for routing
import express from 'express';

// Importing authentication controller functions
import {
  isAuthenticated,   // Check if a user is currently authenticated (token/session valid)
  login,              // Handle login logic and generate JWT token
  logout,             // Clear authentication token/cookie
  register,           // Register a new user
  resetPassword,      // Reset user's password after OTP verification
  sendResetOtp,       // Send OTP for password reset
  sendVerifyOtp,      // Send OTP for email verification
  verifyEmail         // Verify user email with OTP
} from "../controllers/authControllers.js";

// Middleware to verify JWT and protect routes
import userAuth from '../middleware/userAuth.js';
import validateRequest from '../middleware/validateRequest.js';

import {
  registerValidator,
  loginValidator,
  emailOnlyValidator,
  resetPasswordValidator
} from '../validators/authValidator.js';

// Create an Express router instance
const authRouter = express.Router();

/*
|--------------------------------------------------------------------------
| Auth Routes
|--------------------------------------------------------------------------
| These routes are responsible for handling all authentication-related 
| actions such as registering, logging in, logging out, verifying emails,
| and resetting passwords.
*/

// 🔐 Register a new user (Validation + Controller)
authRouter.post('/register', registerValidator, validateRequest, register);

// 🔐 Login a user and return a token (Validation + Controller)
authRouter.post('/login', loginValidator, validateRequest, login);

// 🔐 Logout the user (no validation needed)
authRouter.post('/logout', logout);

// 📩 Send OTP to user email for account verification (user must be authenticated)
authRouter.post('/send-verify-otp', userAuth, sendVerifyOtp);

// ✅ Verify user's email using OTP (must be authenticated)
authRouter.post('/verify-account', userAuth, verifyEmail);

// 🔄 Check if the user's session/token is still valid (auth protected)
authRouter.post('/is-auth', userAuth, isAuthenticated);

// 🔐 Send OTP to email for password reset (validate email)
authRouter.post('/send-reset-otp', emailOnlyValidator, validateRequest, sendResetOtp);

// 🔁 Reset password using email + OTP + new password (validate all inputs)
authRouter.post('/reset-password', resetPasswordValidator, validateRequest, resetPassword);

// Export the router so it can be used in server.js
export default authRouter;
