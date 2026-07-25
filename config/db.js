const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/repverse';
  try {
    await mongoose.connect(uri);
    console.log('[repverse] MongoDB connected');
  } catch (err) {
    console.error('[repverse] MongoDB connection error:', err.message);
    console.error('[repverse] Starting anyway — DB-backed features (auth, saved wallets) will be unavailable until MongoDB is reachable.');
  }
}

module.exports = connectDB;
