const express = require('express');
const router = express.Router();
const zaApi = require('../middleware/zaApi');
const { generateReputationSummary, computeTrustScore } = require('../middleware/aiService');

// ── SEARCH ────────────────────────────────────────────────────
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) return res.json({ error: 'Query required' });

  const query = q.trim();

  try {
    let rawData = null;
    const isWallet = /^(SP|ST|0x)/i.test(query);

    if (isWallet) {
      rawData = await zaApi.getReputation(query);
    } else {
      rawData = await zaApi.getCreatorByUsername(query);
      if (!rawData) {
        rawData = await zaApi.searchCreators(query, 1);
      }
    }

    if (!rawData) {
      return res.json({ error: `No contributor found for "${query}". Try a different username.` });
    }

    const profile = normalizeProfile(rawData, query, isWallet ? 'wallet' : 'username');
    const trust = computeTrustScore(profile);
    const aiSummary = await generateReputationSummary({ ...profile, reputationScore: trust.score, grade: trust.grade });

    return res.json({ success: true, profile, trust, aiSummary });
  } catch (err) {
    console.error('Search error:', err.message);
    return res.json({ error: 'Search failed. Check your API key is set correctly in .env', details: err.message });
  }
});

// ── BOUNTIES ──────────────────────────────────────────────────
router.get('/bounties', async (req, res) => {
  try {
    const data = await zaApi.getBounties(12, 1);
    res.json({ success: true, data });
  } catch (e) { res.json({ error: e.message }); }
});

// ── LEADERBOARD ───────────────────────────────────────────────
router.get('/leaderboard', async (req, res) => {
  try {
    const data = await zaApi.getLeaderboard(50);
    res.json({ success: true, data });
  } catch (e) { res.json({ error: e.message }); }
});

// ── QUESTS ────────────────────────────────────────────────────
router.get('/quests', async (req, res) => {
  try {
    const data = await zaApi.getQuests(12, 1);
    res.json({ success: true, data });
  } catch (e) { res.json({ error: e.message }); }
});

// ── CREATORS ──────────────────────────────────────────────────
router.get('/creators', async (req, res) => {
  try {
    const data = await zaApi.getCreators(20, 1);
    res.json({ success: true, data });
  } catch (e) { res.json({ error: e.message }); }
});

// ── NORMALIZE ─────────────────────────────────────────────────
function normalizeProfile(raw, query, source) {
  // Handle array (search results return array)
  const d = Array.isArray(raw) ? raw[0] : (raw.data || raw.user || raw.creator || raw.profile || raw);
  if (!d) return null;

  return {
    id: d.id || d._id || d.uuid || null,
    username: d.username || d.name || d.handle || d.displayName || query,
    wallet: d.wallet || d.walletAddress || d.stxAddress || d.address || (source === 'wallet' ? query : null),
    avatar: d.avatar || d.profileImage || d.image || d.avatarUrl || null,
    bio: d.bio || d.description || d.about || null,
    category: d.category || d.role || null,
    reputationScore: d.reputationScore || d.reputation_score || d.reputation || d.score || 0,
    bountiesCompleted: d.bountiesCompleted || d.bounties_completed || d.completedBounties || d.bounties || 0,
    questsCompleted: d.questsCompleted || d.quests_completed || d.completedQuests || d.quests || 0,
    gigsCompleted: d.gigsCompleted || d.gigs_completed || d.completedGigs || d.gigs || 0,
    endorsements: d.endorsements || d.endorsementCount || d.endorsement_count || 0,
    daos: d.daos || d.organizations || d.communities || [],
    skills: d.skills || d.tags || d.categories || (d.category ? [d.category] : []),
    joinedAt: d.createdAt || d.joined_at || d.joinedAt || d.created_at || null,
    twitterUrl: d.twitterUrl || d.twitter || (d.twitterHandle ? `https://twitter.com/${d.twitterHandle.replace('@','')}` : null),
    githubUrl: d.githubUrl || d.github || null,
    websiteUrl: d.websiteUrl || d.website || d.url || null,
    isVerified: d.isVerified || d.verified || false,
    rank: d.rank || d.leaderboardRank || null,
    governanceVotes: d.governanceVotes || d.votes || 0,
    proposalsSubmitted: d.proposalsSubmitted || d.proposals || 0,
    totalEarned: d.totalEarned || d.earnings || d.earned || 0,
    network: d.network || 'Stacks Network'
  };
}

module.exports = router;
