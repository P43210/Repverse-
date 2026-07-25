const express = require('express');
const router = express.Router();
const converter = require('../services/converterService');

router.get('/converter', (req, res) => {
  res.render('converter', {
    title: 'Currency converter — Repverse',
    symbols: converter.getSupportedSymbols()
  });
});

router.get('/api/convert', async (req, res) => {
  const { amount, from, to } = req.query;
  if (!amount || !from || !to) {
    return res.status(400).json({ error: 'amount, from, and to are required' });
  }
  try {
    const result = await converter.convert(Number(amount), from.toUpperCase(), to.toUpperCase());
    res.json(result);
  } catch (err) {
    if (err.message === 'NO_API_KEY') {
      return res.status(503).json({
        error: 'Converter API key not configured. Set CMC_API_KEY in .env to enable live rates.'
      });
    }
    console.error(err.message);
    res.status(502).json({ error: 'Could not fetch conversion rate right now.' });
  }
});

module.exports = router;
