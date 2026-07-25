const express = require('express');
const router = express.Router();
const stacks = require('../services/stacksService');
const WalletLookup = require('../models/WalletLookup');

const STX_ADDRESS_RE = /^S[PT][0-9A-Z]{38,39}$/i;

function looksLikeBns(input) {
  return /\.(btc|stx|id|app)$/i.test(input.trim());
}

async function resolveInput(raw) {
  const input = raw.trim();
  if (looksLikeBns(input)) {
    const address = await stacks.resolveBnsToAddress(input);
    return { address, bnsName: input };
  }
  if (STX_ADDRESS_RE.test(input)) {
    const names = await stacks.getNamesForAddress(input);
    return { address: input, bnsName: names?.[0] || null };
  }
  return { address: null, bnsName: null };
}

// --- Home / search entry ---
router.get('/', (req, res) => {
  res.render('index', { title: 'Repverse — the Stacks ecosystem explorer' });
});

router.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.redirect('/');
  res.redirect(`/wallet/${encodeURIComponent(q)}`);
});

// --- Wallet / BNS profile page ---
router.get('/wallet/:query', async (req, res) => {
  const q = req.params.query;
  try {
    const { address, bnsName } = await resolveInput(q);

    if (!address) {
      return res.render('wallet', {
        title: `${q} — not found`,
        query: q,
        notFound: true,
        address: null,
        bnsName: null
      });
    }

    const [balances, nfts, txs, names] = await Promise.allSettled([
      stacks.getAccountBalances(address),
      stacks.getNftHoldings(address, 12),
      stacks.getTransactions(address, 10),
      stacks.getNamesForAddress(address)
    ]);

    // fire-and-forget cache write
    WalletLookup.create({
      query: q,
      resolvedAddress: address,
      bnsName,
      lookedUpBy: req.user?._id
    }).catch(() => {});

    res.render('wallet', {
      title: `${bnsName || address} — Repverse`,
      query: q,
      notFound: false,
      address,
      bnsName,
      allNames: names.status === 'fulfilled' ? names.value : [],
      balances: balances.status === 'fulfilled' ? balances.value : null,
      nfts: nfts.status === 'fulfilled' ? nfts.value : null,
      txs: txs.status === 'fulfilled' ? txs.value : null
    });
  } catch (err) {
    console.error(err);
    res.render('wallet', { title: 'Error', query: q, notFound: true, address: null, bnsName: null });
  }
});

// --- Transaction history (full, paginated) ---
router.get('/wallet/:query/transactions', async (req, res) => {
  const q = req.params.query;
  const offset = parseInt(req.query.offset || '0', 10);
  try {
    const { address, bnsName } = await resolveInput(q);
    if (!address) return res.redirect(`/wallet/${encodeURIComponent(q)}`);

    const txs = await stacks.getTransactions(address, 20, offset);
    res.render('transactions', {
      title: `Transactions — ${bnsName || address}`,
      query: q,
      address,
      bnsName,
      txs,
      offset
    });
  } catch (err) {
    console.error(err);
    res.render('transactions', { title: 'Error', query: q, address: null, bnsName: null, txs: null, offset: 0 });
  }
});

// --- Compare two wallets/bns ---
router.get('/compare', (req, res) => {
  res.render('compare', { title: 'Compare wallets — Repverse', a: null, b: null });
});

router.get('/compare/result', async (req, res) => {
  const { a: rawA, b: rawB } = req.query;
  if (!rawA || !rawB) return res.redirect('/compare');

  try {
    const [resolvedA, resolvedB] = await Promise.all([resolveInput(rawA), resolveInput(rawB)]);

    async function buildProfile(resolved, raw) {
      if (!resolved.address) return { raw, address: null, bnsName: null };
      const [balances, nfts] = await Promise.allSettled([
        stacks.getAccountBalances(resolved.address),
        stacks.getNftHoldings(resolved.address, 100)
      ]);
      return {
        raw,
        address: resolved.address,
        bnsName: resolved.bnsName,
        balances: balances.status === 'fulfilled' ? balances.value : null,
        nftCount: nfts.status === 'fulfilled' ? nfts.value?.total ?? 0 : 0
      };
    }

    const [a, b] = await Promise.all([buildProfile(resolvedA, rawA), buildProfile(resolvedB, rawB)]);

    res.render('compare', { title: 'Compare wallets — Repverse', a, b });
  } catch (err) {
    console.error(err);
    res.render('compare', { title: 'Compare wallets — Repverse', a: null, b: null });
  }
});

// --- Stake calculator ---
router.get('/stake-calculator', async (req, res) => {
  let poxInfo = null;
  try {
    poxInfo = await stacks.getPoxInfo();
  } catch (err) {
    poxInfo = null;
  }
  res.render('stake-calculator', { title: 'Stake calculator — Repverse', poxInfo });
});

module.exports = router;
