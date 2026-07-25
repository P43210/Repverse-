const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');

router.get('/about', (req, res) => {
  res.render('about', { title: 'About — Repverse' });
});

router.get('/privacy', (req, res) => {
  res.render('privacy', { title: 'Privacy policy — Repverse' });
});

router.get('/terms', (req, res) => {
  res.render('terms', { title: 'Terms of service — Repverse' });
});

router.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.render('dashboard', { title: 'Dashboard — Repverse' });
});

module.exports = router;
