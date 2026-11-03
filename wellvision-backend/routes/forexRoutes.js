import express from 'express';
import ForexRate from '../models/forexRateModel.js';

const router = express.Router();

// GET: Get cached rates (default base LKR)
router.get('/rates', async (req, res) => {
  try {
    const base = (req.query.base || 'LKR').toUpperCase();
    const doc = await ForexRate.findOne({ base }).sort({ updatedAt: -1 });
    if (!doc) return res.json({ base, rates: {} });
    res.json({ base, rates: doc.rates });
  } catch (e) {
    res.status(500).json({ error: 'Failed to read rates' });
  }
});

// POST: Refresh rates from exchangerate.host and cache
router.post('/refresh', async (req, res) => {
  try {
    const base = (req.body?.base || 'LKR').toUpperCase();
    const symbols = (req.body?.symbols || ['LKR','USD','EUR']).map(s => s.toUpperCase());

    // Fetch from public API
    const url = `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}&symbols=${symbols.join(',')}`;
    const response = await fetch(url);
    if (!response.ok) return res.status(502).json({ error: 'Rate provider error' });
    const data = await response.json();

    const rates = data?.rates || {};

    const doc = await ForexRate.findOneAndUpdate(
      { base },
      { base, rates, fetchedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({ base, rates: doc.rates, fetchedAt: doc.fetchedAt });
  } catch (e) {
    res.status(500).json({ error: 'Failed to refresh rates' });
  }
});

export default router;