const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    // Google OAuth
    googleId: { type: String, index: true, sparse: true },
    email: { type: String, index: true, sparse: true },
    name: { type: String },
    avatar: { type: String },

    // Wallet-connect auth (Hiro Wallet / Xverse / Leather via Stacks Connect)
    stxAddress: { type: String, index: true, unique: true, sparse: true },

    authType: { type: String, enum: ['google', 'wallet'], required: true },

    // saved/watched wallets & bns names for quick access
    watchlist: [
      {
        label: String,
        value: String, // address or bns name
        addedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
