// controllers/staffController.js
// Staff directory endpoints used by the admin Staff page and the Configuration
// page. The directory is backed by the real user accounts collection, so the
// Staff page always shows actual database records. Every route is mounted
// behind userAuth + adminOnly.
import bcrypt from 'bcryptjs';
import userModel from '../models/userModel.js';
import { sanitizeAccess } from '../config/accessModules.js';
import {
  DEFAULT_STAFF_ROLE,
  STAFF_STATUSES,
  ensureStaffProfile,
  ensureStaffProfiles,
  nextStaffId,
  normalizeAccess,
} from '../utils/staffProfile.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s-]{7,15}$/;
const ROLE_REGEX = /^[A-Za-z][A-Za-z\s-]{1,39}$/;

const normalizeName = (value) =>
  (value || '').toString().trim().replace(/\s+/g, ' ').toLowerCase();

const toStaffResponse = (user) => ({
  _id: user._id,
  staffId: user.staffId || '',
  name: user.name,
  email: user.email,
  phoneNumber: user.phone || '',
  role: user.role || DEFAULT_STAFF_ROLE,
  status: user.staffStatus || 'Active',
  department: user.department || '',
  hireDate: user.createdAt,
  access: Array.isArray(user.access) ? user.access : [],
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const validateRole = (role) => ROLE_REGEX.test(role);

// GET /api/admin/staff
export const getStaff = async (req, res) => {
  try {
    // Make sure every real account has a staff profile before listing.
    await ensureStaffProfiles();

    const search = (req.query.search || '').toString().trim();
    const filter = search
      ? {
          $or: [
            { staffId: { $regex: search, $options: 'i' } },
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { role: { $regex: search, $options: 'i' } },
            { staffStatus: { $regex: search, $options: 'i' } },
            { department: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const staff = await userModel
      .find(filter)
      .select('name email phone role staffId staffStatus department access createdAt updatedAt')
      .sort({ createdAt: 1 })
      .lean();

    return res.json({
      staff: staff.map(toStaffResponse),
      total: staff.length,
      page: Number(req.query.page) || 0,
      pageSize: Number(req.query.pageSize) || staff.length,
    });
  } catch (error) {
    console.error('GET /staff error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/staff/:id
export const getStaffById = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    await ensureStaffProfile(user);
    return res.json({ success: true, staff: toStaffResponse(user) });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    console.error('GET /staff/:id error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/staff
export const createStaff = async (req, res) => {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const phone = (req.body.phoneNumber || req.body.phone || '').trim();
  const role = (req.body.role || DEFAULT_STAFF_ROLE).trim();
  const status = (req.body.status || req.body.staffStatus || 'Active').trim();
  const department = (req.body.department || '').trim();
  const password = req.body.password || '';

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: 'Full name and email are required',
    });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  }
  if (phone && !PHONE_REGEX.test(phone)) {
    return res.status(400).json({ success: false, message: 'Invalid phone format' });
  }
  if (!validateRole(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }
  if (!STAFF_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Status must be one of: ${STAFF_STATUSES.join(', ')}`,
    });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters',
    });
  }

  try {
    const existing = await userModel.findOne({ email }).select('_id');
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A staff member with this email already exists',
      });
    }

    const user = await userModel.create({
      name,
      email,
      phone,
      password: await bcrypt.hash(password, 10),
      role,
      staffId: await nextStaffId(),
      staffStatus: status,
      department,
      access: normalizeAccess(req.body.access, role),
      // Staff accounts created by an admin do not need email verification.
      isAccountVerified: true,
    });

    return res.status(201).json({
      success: true,
      staff: toStaffResponse(user),
      message: 'Staff member created successfully',
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A staff member with this email already exists',
      });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('POST /staff error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/admin/staff/:id
export const updateStaff = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    if (req.body.name !== undefined) {
      const name = (req.body.name || '').trim();
      if (!name) {
        return res.status(400).json({ success: false, message: 'Full name is required' });
      }
      user.name = name;
    }

    if (req.body.email !== undefined) {
      const email = (req.body.email || '').trim().toLowerCase();
      if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email format' });
      }
      user.email = email;
    }

    if (req.body.phoneNumber !== undefined || req.body.phone !== undefined) {
      const phone = (req.body.phoneNumber ?? req.body.phone ?? '').trim();
      if (phone && !PHONE_REGEX.test(phone)) {
        return res.status(400).json({ success: false, message: 'Invalid phone format' });
      }
      user.phone = phone;
    }

    if (req.body.role !== undefined) {
      const role = (req.body.role || '').trim();
      if (!validateRole(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
      }
      user.role = role;
    }

    if (req.body.status !== undefined || req.body.staffStatus !== undefined) {
      const status = (req.body.status ?? req.body.staffStatus ?? '').trim();
      if (!STAFF_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Status must be one of: ${STAFF_STATUSES.join(', ')}`,
        });
      }
      user.staffStatus = status;
    }

    if (req.body.department !== undefined) {
      user.department = (req.body.department || '').trim();
    }

    if (req.body.access !== undefined) {
      user.access = sanitizeAccess(req.body.access);
    }

    if (req.body.password !== undefined && req.body.password !== '') {
      if (req.body.password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters',
        });
      }
      user.password = await bcrypt.hash(req.body.password, 10);
      user.passwordChangedAt = new Date();
    }

    await ensureStaffProfile(user);
    await user.save();

    return res.json({
      success: true,
      staff: toStaffResponse(user),
      message: 'Staff member updated successfully',
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A staff member with this email already exists',
      });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('PUT /staff/:id error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/admin/staff/:id
export const deleteStaff = async (req, res) => {
  try {
    // Never let an admin delete the account they are currently signed in with.
    if (req.user && String(req.user.id) === String(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    const user = await userModel.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    return res.json({ success: true, message: 'Staff member deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    console.error('DELETE /staff/:id error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/staff/lookup
// Body: { staffId, name }. Both must match an existing record.
export const lookupStaffAccess = async (req, res) => {
  const staffId = (req.body.staffId || '').toString().trim();
  const name = (req.body.name || '').toString().trim();

  if (!staffId || !name) {
    return res.status(400).json({
      success: false,
      message: 'Staff ID and full name are required',
    });
  }

  try {
    await ensureStaffProfiles();

    const user = await userModel.findOne({
      staffId: staffId.toUpperCase(),
    });

    if (!user || normalizeName(user.name) !== normalizeName(name)) {
      return res.status(404).json({
        success: false,
        message: 'No staff member found with that Staff ID and full name',
      });
    }

    return res.json({ success: true, staff: toStaffResponse(user) });
  } catch (error) {
    console.error('POST /staff/lookup error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/admin/staff/:id/access
// Body: { access: string[] }
export const updateStaffAccess = async (req, res) => {
  if (!Array.isArray(req.body.access)) {
    return res.status(400).json({
      success: false,
      message: 'Access must be an array of module keys',
    });
  }

  try {
    const user = await userModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    user.access = sanitizeAccess(req.body.access);
    await user.save();

    return res.json({
      success: true,
      staff: toStaffResponse(user),
      message: 'Access updated successfully',
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    console.error('PUT /staff/:id/access error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
