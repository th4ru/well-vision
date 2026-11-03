import express from 'express';
import Customer from '../models/customer.js';

const router = express.Router();

// GET: Get all customers (with optional search and pagination)
router.get('/', async (req, res) => {
  const search = req.query.search || '';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const searchCondition = {
    $or: [
      { givenName: { $regex: search, $options: 'i' } },
      { familyName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ],
  };

  try {
    const customers = await Customer.find(searchCondition)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Customer.countDocuments(searchCondition);

    res.json({ data: customers, total, page, limit });
  } catch (err) {
    console.error('Failed to fetch customers:', err);
    res.status(500).json({ message: 'Failed to fetch customers', error: err.message });
  }
});

// GET: Last 10 customers
router.get('/recent', async (req, res) => {
  try {
    const recentCustomers = await Customer.find()
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ data: recentCustomers });
  } catch (err) {
    console.error('Failed to fetch recent customers:', err);
    res.status(500).json({ message: 'Failed to fetch recent customers', error: err.message });
  }
});

// POST: Add new customer
router.post('/', async (req, res) => {
  console.log('📥 Incoming Customer POST Request Body:', req.body);

  try {
    const {
      givenName,
      familyName,
      ageYears,
      birthDate,
      nicPassport,
      gender,
      ethnicity,
      phoneNo,
      address,
      email
    } = req.body;

    if (
      !givenName || !familyName || !ageYears || !birthDate ||
      !nicPassport || !gender || !ethnicity || !phoneNo || !address || !email
    ) {
      return res.status(400).json({
        message: 'Missing required fields. Please fill all mandatory fields.'
      });
    }

    const customer = new Customer(req.body);
    const saved = await customer.save();

    res.status(201).json({
      message: 'Customer added successfully',
      customer: saved,
    });
  } catch (err) {
    console.error('❌ Error creating customer:', err);
    res.status(400).json({ message: 'Failed to add customer', error: err.message });
  }
});

// PUT: Update customer
router.put('/:id', async (req, res) => {
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ message: 'Request body cannot be empty' });
  }

  try {
    const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: 'Customer not found' });
    res.json({ message: 'Customer updated successfully', customer: updated });
  } catch (err) {
    console.error('❌ Error updating customer:', err);
    res.status(400).json({ message: 'Failed to update customer', error: err.message });
  }
});

// DELETE: Remove customer
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Customer.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Customer not found' });
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting customer:', err);
    res.status(500).json({ message: 'Failed to delete customer', error: err.message });
  }
});

// NEW: GET: Get a customer by ID
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json({ customer });
  } catch (err) {
    console.error('Error fetching customer:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


export default router;
