const axios = require('axios');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// Real ZA API base — confirmed from live site
const ZA_BASE = 'https://zeroauthoritydao.com/api';
const ZA_API_KEY = process.env.ZA_API_KEY || '';

const client = axios.create({
  baseURL: ZA_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(ZA_API_KEY ? { 'Authorization': `Bearer ${ZA_API_KEY}` } : {})
  }
});

async function cachedGet(path, params = {}) {
  const key = `${path}:${JSON.stringify(params)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const res = await client.get(path, { params });
  cache.set(key, res.data);
  return res.data;
}

// ── Bounties ──────────────────────────────────────────────────
async function getBounties(limit = 10, page = 1, status = '') {
  try {
    const params = { limit, page };
    if (status && status !== 'all') params.status = status;
    return await cachedGet('/bounties', params);
  } catch (e) {
    // Try alternate path
    try { return await cachedGet('/bounty', { limit, page }); }
    catch (e2) { console.error('getBounties:', e2.message); return null; }
  }
}

// ── Creators / Users ──────────────────────────────────────────
async function getCreators(limit = 20, page = 1) {
  try {
    return await cachedGet('/creators', { limit, page });
  } catch (e) {
    try { return await cachedGet('/users', { limit, page }); }
    catch (e2) { console.error('getCreators:', e2.message); return null; }
  }
}

// Get a single creator by username or UUID
async function getCreatorByUsername(username) {
  try {
    return await cachedGet(`/creators/${encodeURIComponent(username)}`);
  } catch (e) {
    try { return await cachedGet(`/users/${encodeURIComponent(username)}`); }
    catch (e2) {
      // Try search as fallback
      try {
        const s = await cachedGet('/creators/search', { q: username, limit: 1 });
        return s;
      } catch (e3) { console.error('getCreatorByUsername:', e3.message); return null; }
    }
  }
}

// ── Search ────────────────────────────────────────────────────
async function searchCreators(q, limit = 5) {
  try {
    return await cachedGet('/creators', { search: q, limit });
  } catch (e) {
    try { return await cachedGet('/creators', { q, limit }); }
    catch (e2) { console.error('searchCreators:', e2.message); return null; }
  }
}

// ── Quests ────────────────────────────────────────────────────
async function getQuests(limit = 10, page = 1) {
  try {
    return await cachedGet('/quests', { limit, page });
  } catch (e) { console.error('getQuests:', e.message); return null; }
}

// ── Events ────────────────────────────────────────────────────
async function getEvents(limit = 8, page = 1) {
  try {
    return await cachedGet('/events', { limit, page });
  } catch (e) { console.error('getEvents:', e.message); return null; }
}

// ── Leaderboard ───────────────────────────────────────────────
async function getLeaderboard(limit = 50) {
  try {
    return await cachedGet('/leaderboard', { limit });
  } catch (e) {
    // Fall back to creators sorted by reputation
    try { return await cachedGet('/creators', { limit, sort: 'reputation' }); }
    catch (e2) { console.error('getLeaderboard:', e2.message); return null; }
  }
}

// ── Reputation by wallet ──────────────────────────────────────
async function getReputation(identifier) {
  try {
    return await cachedGet(`/reputation/${encodeURIComponent(identifier)}`);
  } catch (e) {
    try { return await cachedGet(`/creators/${encodeURIComponent(identifier)}/reputation`); }
    catch (e2) { console.error('getReputation:', e2.message); return null; }
  }
}

// ── Gigs ──────────────────────────────────────────────────────
async function getGigs(limit = 10, page = 1) {
  try {
    return await cachedGet('/gigs', { limit, page });
  } catch (e) { console.error('getGigs:', e.message); return null; }
}

// ── Profile by UUID (from /profile/:uuid links on site) ───────
async function getProfileByUUID(uuid) {
  try {
    return await cachedGet(`/profile/${uuid}`);
  } catch (e) {
    try { return await cachedGet(`/creators/${uuid}`); }
    catch (e2) { console.error('getProfileByUUID:', e2.message); return null; }
  }
}

module.exports = {
  getBounties,
  getCreators,
  getCreatorByUsername,
  searchCreators,
  getQuests,
  getEvents,
  getLeaderboard,
  getReputation,
  getGigs,
  getProfileByUUID
};
