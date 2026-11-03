import { body } from 'express-validator';

/*
|--------------------------------------------------------------------------
| Validation rules for Authentication Routes
|--------------------------------------------------------------------------
*/

// Validation for user registration
export const registerValidator = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

// Validation for user login
export const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Validation for email input only (used in forgot/reset OTP routes)
export const emailOnlyValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
];

// Validation for reset password
export const resetPasswordValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').notEmpty().withMessage('OTP is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];
