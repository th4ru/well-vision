// routes/adminRoutes.js
// Admin management endpoints consumed by the admin dashboard (base URL: /api/admin).
import express from 'express';
import bcrypt from 'bcryptjs';
import userModel from '../models/userModel.js';
import userAuth from '../middleware/userAuth.js';
import adminOnly from '../middleware/adminOnly.js';
import {
  createAdminProduct,
  getAdminCustomers,
  getAdminProducts,
  getCurrentUser,
  getDashboard,
  getSales,
  updateCurrentUser,
} from '../controllers/dashboardController.js';
import {
  createStaff,
  deleteStaff,
  getStaff,
  getStaffById,
  lookupStaffAccess,
  updateStaff,
  updateStaffAccess,
} from '../controllers/staffController.js';

const router = express.Router();

const ADMIN_ROLE = 'Admin';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s-]{7,15}$/;

// Shape returned to the dashboard table
const toAdminResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || '',
  role: ADMIN_ROLE,
  createdAt: user.createdAt,
});

const adminFilter = {
  $or: [{ role: { $regex: '^admin$', $options: 'i' } }, { email: 'admin@example.com' }],
};

/*
|--------------------------------------------------------------------------
| Dashboard / sales / products data
|--------------------------------------------------------------------------
| These endpoints feed the admin dashboard and the client-facing admin pages.
*/
router.get('/general/dashboard', userAuth, adminOnly, getDashboard);
router.get('/general/me', userAuth, getCurrentUser);
router.put('/general/me', userAuth, updateCurrentUser);
router.get('/sales/sales', userAuth, adminOnly, getSales);
router.get('/client/customers', userAuth, adminOnly, getAdminCustomers);
router.get('/client/products', userAuth, adminOnly, getAdminProducts);
router.post('/client/products', userAuth, adminOnly, createAdminProduct);

/*
|--------------------------------------------------------------------------
| Staff directory + access configuration
|--------------------------------------------------------------------------
| The Staff page and the Configuration page both use these endpoints. Every
| route is restricted to admins.
*/
router.get('/staff', userAuth, adminOnly, getStaff);
router.post('/staff/lookup', userAuth, adminOnly, lookupStaffAccess);
router.post('/staff', userAuth, adminOnly, createStaff);
router.get('/staff/:id', userAuth, adminOnly, getStaffById);
router.put('/staff/:id/access', userAuth, adminOnly, updateStaffAccess);
router.put('/staff/:id', userAuth, adminOnly, updateStaff);
router.delete('/staff/:id', userAuth, adminOnly, deleteStaff);

/*
|--------------------------------------------------------------------------
| GET /api/admin/management/admins
|--------------------------------------------------------------------------
| List every admin account.
*/
router.get('/management/admins', userAuth, adminOnly, async (req, res) => {
  try {
    const admins = await userModel
      .find(adminFilter)
      .select('name email phone role createdAt')
      .sort({ createdAt: 1 });

    return res.json(admins.map(toAdminResponse));
  } catch (error) {
    console.error('GET /management/admins error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

/*
|--------------------------------------------------------------------------
| POST /api/admin/management/admins
|--------------------------------------------------------------------------
| Create a new admin account. Only existing admins may call this.
*/
router.post('/management/admins', userAuth, adminOnly, async (req, res) => {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const phone = (req.body.phone || '').trim();
  const password = req.body.password || '';

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required' });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
  }
  if (phone && !PHONE_REGEX.test(phone)) {
    return res.status(400).json({ success: false, message: 'Invalid phone format' });
  }

  try {
    const existing = await userModel.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'A user with this email already exists' });
    }

    const user = await userModel.create({
      name,
      email,
      phone,
      password: await bcrypt.hash(password, 10),
      role: ADMIN_ROLE,
      // Admin created by another admin does not need email OTP verification
      isAccountVerified: true,
    });

    return res.status(201).json({ success: true, admin: toAdminResponse(user) });
  } catch (error) {
    console.error('POST /management/admins error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
