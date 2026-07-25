const mongoose = require('mongoose');

// Lightweight cache/history of lookups, also powers "recently searched"
const WalletLookupSchema = new mongoose.Schema(
  {
    query: { type: String, index: true }, // raw input: address or bns name
    resolvedAddress: String,
    bnsName: String,
    lastData: mongoose.Schema.Types.Mixed,
    lookedUpBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    hits: { type: Number, default: 1 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('WalletLookup', WalletLookupSchema);
