// routes/userRoutes.js
import express from 'express';
import userAuth from '../middleware/userAuth.js';
import userModel from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

/*
|------------------------------------------------------------------------
| GET /api/user/profile
|------------------------------------------------------------------------
| Protected route to get current user's profile.
| Requires JWT in cookie; user info set in req.user by middleware.
*/
router.get('/profile', userAuth, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select(
      '-password -resetOtp -verifyOtp'
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('GET /profile error:', error.message); // Optional for debugging
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/*
|------------------------------------------------------------------------
| PUT /api/user/profile
|------------------------------------------------------------------------
| Protected route to update current user's profile fields.
| Allowed fields: name, phone, email, role, avatar
| - Validates email format and uniqueness.
| - Validates phone format (basic E.164 or digits/spacing) and stores raw.
*/
router.put('/profile', userAuth, async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'email', 'role', 'avatar'];
    const updates = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        updates[key] = req.body[key];
      }
    }

    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Email validation + uniqueness if changing
    if (typeof updates.email === 'string' && updates.email.trim() && updates.email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const email = updates.email.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email format' });
      }
      const taken = await userModel.findOne({ email });
      if (taken) {
        return res.status(409).json({ success: false, message: 'Email already in use' });
      }
      user.email = email;
    }

    // Phone validation if provided
    if (typeof updates.phone === 'string') {
      const phone = updates.phone.trim();
      if (phone && !/^\+?[0-9\s-]{7,15}$/.test(phone)) {
        return res.status(400).json({ success: false, message: 'Invalid phone format' });
      }
      user.phone = phone;
    }

    // Other updates
    if (typeof updates.name === 'string') user.name = updates.name;
    if (typeof updates.role === 'string') user.role = updates.role;
    if (typeof updates.avatar === 'string') user.avatar = updates.avatar;

    await user.save();

    const safe = user.toObject();
    delete safe.password;
    delete safe.resetOtp;
    delete safe.verifyOtp;

    res.json({ success: true, user: safe });
  } catch (error) {
    console.error('PUT /profile error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/*
|------------------------------------------------------------------------
| GET /api/user/settings
|------------------------------------------------------------------------
| Get current user's settings object. Returns {} if not set.
*/
router.get('/settings', userAuth, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select('settings');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, settings: user.settings || {} });
  } catch (error) {
    console.error('GET /settings error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/*
|------------------------------------------------------------------------
| PUT /api/user/settings
|------------------------------------------------------------------------
| Upsert current user's settings object (replace-or-merge).
*/
router.put('/settings', userAuth, async (req, res) => {
  try {
    const incoming = req.body || {};
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Enforce limits from security settings if provided
    const sec = incoming.security || {};
    if (sec.sessionTimeout && (sec.sessionTimeout < 15 || sec.sessionTimeout > 480)) {
      return res.status(400).json({ success: false, message: 'sessionTimeout must be between 15 and 480 minutes' });
    }
    if (sec.passwordExpiry && (sec.passwordExpiry < 30 || sec.passwordExpiry > 365)) {
      return res.status(400).json({ success: false, message: 'passwordExpiry must be between 30 and 365 days' });
    }
    if (sec.loginAttempts && (sec.loginAttempts < 3 || sec.loginAttempts > 10)) {
      return res.status(400).json({ success: false, message: 'loginAttempts must be between 3 and 10' });
    }

    // Merge shallowly to avoid wiping unknown keys
    user.settings = { ...(user.settings || {}), ...incoming };
    await user.save();

    res.json({ success: true, settings: user.settings });
  } catch (error) {
    console.error('PUT /settings error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Security: change password (requires current password)
router.post('/change-password', userAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
    }
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordChangedAt = new Date();
    await user.save();

    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Security: list active sessions
router.get('/sessions', userAuth, async (req, res) => {
  const user = await userModel.findById(req.user.id).select('activeSessions');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, sessions: user.activeSessions || [] });
});

// Security: revoke a session by jti (logout device)
router.delete('/sessions/:jti', userAuth, async (req, res) => {
  const { jti } = req.params;
  const user = await userModel.findById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  user.activeSessions = (user.activeSessions || []).filter(s => s.jti !== jti);
  await user.save();
  res.json({ success: true });
});

// Security: revoke all other sessions (keep current)
router.delete('/sessions', userAuth, async (req, res) => {
  try {
    const token = req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentJti = decoded.jti;
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.activeSessions = (user.activeSessions || []).filter(s => s.jti === currentJti);
    await user.save();
    res.json({ success: true });
  } catch (e) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// Security: login history
router.get('/login-history', userAuth, async (req, res) => {
  const user = await userModel.findById(req.user.id).select('loginHistory');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, history: user.loginHistory || [] });
});

export default router;
