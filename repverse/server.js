require('dotenv').config();
const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── View engine ──────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Static & body ────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── MongoDB (fully optional — app works without it) ──────────
if (process.env.MONGODB_URI && process.env.MONGODB_URI.trim() !== '') {
  const mongoose = require('mongoose');
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✓ MongoDB connected'))
    .catch(err => console.warn('⚠ MongoDB skipped:', err.message));
} else {
  console.log('ℹ MongoDB not configured — running without database (OK)');
}

// ── Routes ───────────────────────────────────────────────────
app.use('/',            require('./routes/index'));
app.use('/api',         require('./routes/api'));
app.use('/contributor', require('./routes/contributor'));
app.use('/leaderboard', require('./routes/leaderboard'));

// ── 404 ──────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

// ── Error handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { title: 'Error', message: err.message });
});

app.listen(PORT, () => console.log(`REPVERSE running → http://localhost:${PORT}`));
module.exports = app;
