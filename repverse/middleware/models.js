// MongoDB models — only used if MONGODB_URI is set
// The app works completely without this

let Search, CachedProfile;

try {
  const mongoose = require('mongoose');

  const searchSchema = new mongoose.Schema({
    query:     { type: String, required: true },
    type:      { type: String, enum: ['wallet','username'], default: 'username' },
    createdAt: { type: Date, default: Date.now }
  });

  const profileSchema = new mongoose.Schema({
    identifier: { type: String, required: true, unique: true },
    data:       { type: mongoose.Schema.Types.Mixed },
    aiSummary:  { type: String },
    trustScore: { type: Number },
    cachedAt:   { type: Date, default: Date.now }
  });

  profileSchema.index({ cachedAt: 1 }, { expireAfterSeconds: 600 });

  Search        = mongoose.models.Search        || mongoose.model('Search', searchSchema);
  CachedProfile = mongoose.models.CachedProfile || mongoose.model('CachedProfile', profileSchema);
} catch (e) {
  // Mongoose not available or no connection — use no-op stubs
  Search        = null;
  CachedProfile = null;
}

module.exports = { Search, CachedProfile };
