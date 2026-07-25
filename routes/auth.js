const express = require('express');
const passport = require('passport');
const router = express.Router();
const User = require('../models/User');

router.get('/login', (req, res) => {
  res.render('login', { title: 'Sign in' });
});

// --- Google OAuth ---
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', failureFlash: true }),
  (req, res) => res.redirect('/dashboard')
);

// --- Wallet connect (Stacks Connect happens client-side; this just persists the session) ---
router.post('/auth/wallet', express.json(), async (req, res) => {
  const { address } = req.body;
  if (!address) return res.status(400).json({ error: 'Missing address' });

  try {
    await User.findOneAndUpdate(
      { stxAddress: address },
      { stxAddress: address, authType: 'wallet' },
      { upsert: true, new: true }
    );
  } catch (err) {
    // Non-fatal — still let them use the session even if DB write fails
    console.error('[repverse] wallet user upsert failed:', err.message);
  }

  req.session.stxAddress = address;
  res.json({ ok: true, redirect: '/dashboard' });
});

router.get('/logout', (req, res) => {
  req.session.stxAddress = null;
  if (req.logout) {
    req.logout(() => {
      req.session.destroy(() => res.redirect('/'));
    });
  } else {
    req.session.destroy(() => res.redirect('/'));
  }
});

module.exports = router;
