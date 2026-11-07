// routes/prescriptionRoutes.js
// Customer prescription files uploaded by staff from the customer card.
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Prescription from '../models/prescriptionModel.js';
import Customer from '../models/customer.js';
import userAuth from '../middleware/userAuth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'uploads', 'prescriptions');

// Make sure the upload folder exists before multer writes to it.
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `prescription-${unique}${extension}`);
  },
});

const allowedMimeTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) return cb(null, true);
  return cb(new Error('Only PDF and image files (JPG, PNG, WEBP, GIF) are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const router = express.Router();

router.use(userAuth);

// GET: All prescriptions uploaded for a customer, newest first.
router.get('/customer/:customerId', async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ customerId: req.params.customerId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, prescriptions });
  } catch (err) {
    console.error('getCustomerPrescriptions error', err);
    res.status(500).json({ success: false, message: 'Failed to fetch prescriptions' });
  }
});

// POST: Upload a prescription file for a customer.
router.post('/customer/:customerId', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'File is too large. Maximum size is 10 MB.'
          : err.message;
      return res.status(400).json({ success: false, message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Please select a file to upload' });
      }

      const customer = await Customer.findById(req.params.customerId);
      if (!customer) {
        // Remove the orphaned file if the customer does not exist.
        fs.unlink(req.file.path, () => {});
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      const prescription = await Prescription.create({
        customerId: customer._id,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/prescriptions/${req.file.filename}`,
      });

      res.status(201).json({
        success: true,
        message: 'Prescription uploaded successfully',
        prescription,
      });
    } catch (error) {
      console.error('uploadPrescription error', error);
      res.status(500).json({ success: false, message: 'Failed to upload prescription' });
    }
  });
});

export default router;
