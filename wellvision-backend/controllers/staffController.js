// controllers/staffController.js
// Staff directory endpoints used by the admin Staff page and the Configuration
// page. Every route is mounted behind userAuth + adminOnly.
import Staff, { STAFF_ROLES, STAFF_STATUSES } from '../models/staffModel.js';
import {
  DEFAULT_ACCESS_BY_ROLE,
  sanitizeAccess,
} from '../config/accessModules.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s-]{7,15}$/;

const normalizeName = (value) =>
  (value || '').toString().trim().replace(/\s+/g, ' ').toLowerCase();

const toStaffResponse = (staff) => ({
  _id: staff._id,
  staffId: staff.staffId,
  name: staff.name,
  email: staff.email,
  phoneNumber: staff.phoneNumber || '',
  role: staff.role,
  status: staff.status,
  department: staff.department || '',
  hireDate: staff.hireDate,
  access: Array.isArray(staff.access) ? staff.access : [],
  createdAt: staff.createdAt,
  updatedAt: staff.updatedAt,
});

const nextStaffId = async () => {
  const existing = await Staff.find({ staffId: /^STF\d+$/ })
    .select('staffId')
    .lean();

  const highest = existing.reduce((max, item) => {
    const number = parseInt(item.staffId.replace(/\D/g, ''), 10);
    return Number.isFinite(number) && number > max ? number : max;
  }, 0);

  return `STF${String(highest + 1).padStart(4, '0')}`;
};

// GET /api/admin/staff
export const getStaff = async (req, res) => {
  try {
    const search = (req.query.search || '').toString().trim();
    const filter = search
      ? {
          $or: [
            { staffId: { $regex: search, $options: 'i' } },
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { role: { $regex: search, $options: 'i' } },
            { status: { $regex: search, $options: 'i' } },
            { department: { $regex: search, $options: 'i' } },
            { phoneNumber: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const staff = await Staff.find(filter).sort({ createdAt: 1, staffId: 1 }).lean();

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
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    return res.json({ success: true, staff: toStaffResponse(staff) });
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
  const phoneNumber = (req.body.phoneNumber || '').trim();
  const role = (req.body.role || 'Employee').trim();
  const status = (req.body.status || 'Active').trim();
  const department = (req.body.department || '').trim();

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: 'Full name and email are required',
    });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  }
  if (phoneNumber && !PHONE_REGEX.test(phoneNumber)) {
    return res.status(400).json({ success: false, message: 'Invalid phone format' });
  }
  if (!STAFF_ROLES.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Role must be one of: ${STAFF_ROLES.join(', ')}`,
    });
  }
  if (!STAFF_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Status must be one of: ${STAFF_STATUSES.join(', ')}`,
    });
  }

  try {
    const staff = await Staff.create({
      staffId: await nextStaffId(),
      name,
      email,
      phoneNumber,
      role,
      status,
      department,
      access: sanitizeAccess(
        req.body.access || DEFAULT_ACCESS_BY_ROLE[role] || []
      ),
    });

    return res.status(201).json({
      success: true,
      staff: toStaffResponse(staff),
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
  const updates = {};

  if (req.body.name !== undefined) {
    const name = (req.body.name || '').trim();
    if (!name) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }
    updates.name = name;
  }

  if (req.body.email !== undefined) {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }
    updates.email = email;
  }

  if (req.body.phoneNumber !== undefined) {
    const phoneNumber = (req.body.phoneNumber || '').trim();
    if (phoneNumber && !PHONE_REGEX.test(phoneNumber)) {
      return res.status(400).json({ success: false, message: 'Invalid phone format' });
    }
    updates.phoneNumber = phoneNumber;
  }

  if (req.body.role !== undefined) {
    if (!STAFF_ROLES.includes(req.body.role)) {
      return res.status(400).json({
        success: false,
        message: `Role must be one of: ${STAFF_ROLES.join(', ')}`,
      });
    }
    updates.role = req.body.role;
  }

  if (req.body.status !== undefined) {
    if (!STAFF_STATUSES.includes(req.body.status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${STAFF_STATUSES.join(', ')}`,
      });
    }
    updates.status = req.body.status;
  }

  if (req.body.department !== undefined) {
    updates.department = (req.body.department || '').trim();
  }

  if (req.body.access !== undefined) {
    updates.access = sanitizeAccess(req.body.access);
  }

  try {
    const staff = await Staff.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    return res.json({
      success: true,
      staff: toStaffResponse(staff),
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
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (!staff) {
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
    const staff = await Staff.findOne({
      staffId: staffId.toUpperCase(),
    });

    if (!staff || normalizeName(staff.name) !== normalizeName(name)) {
      return res.status(404).json({
        success: false,
        message: 'No staff member found with that Staff ID and full name',
      });
    }

    return res.json({ success: true, staff: toStaffResponse(staff) });
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
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    staff.access = sanitizeAccess(req.body.access);
    await staff.save();

    return res.json({
      success: true,
      staff: toStaffResponse(staff),
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
