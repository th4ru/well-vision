import express from 'express';
import {
  getSettings,
  updateSettings,
  resetSettings,
  getSetting,
  updateSetting
} from '../controllers/settingsController.js';
import userAuth from '../middleware/userAuth.js';

const router = express.Router();

// All settings routes require authentication
router.use(userAuth);

// Get all user settings
router.get('/', getSettings);

// Update all user settings
router.put('/', updateSettings);

// Reset settings to defaults
router.post('/reset', resetSettings);

// Get specific setting by key
router.get('/:key', getSetting);

// Update specific setting by key
router.put('/:key', updateSetting);

export default router;
