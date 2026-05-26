const express = require('express');
const router = express.Router();
const zaApi = require('../middleware/zaApi');
const { computeTrustScore } = require('../middleware/aiService');

router.get('/', async (req, res) => {
  try {
    const [lbR, crR] = await Promise.allSettled([
      zaApi.getLeaderboard(50),
      zaApi.getCreators(50, 1)
    ]);

    const lbData = lbR.status === 'fulfilled' ? lbR.value : null;
    const crData = crR.status === 'fulfilled' ? crR.value : null;

    // Prefer leaderboard endpoint; fall back to creators
    let rawList = flattenList(lbData, ['creators','users','leaderboard','data','results','items']);
    if (!rawList.length) {
      rawList = flattenList(crData, ['creators','users','data','results','items']);
    }

    const leaders = rawList.map((item, i) => {
      const u = item.data || item.user || item.creator || item.profile || item;
      const trust = computeTrustScore(u);
      return {
        rank: i + 1,
        username: u.username || u.name || u.handle || u.displayName || `Creator #${i+1}`,
        wallet: u.wallet || u.walletAddress || u.stxAddress || null,
        avatar: u.avatar || u.profileImage || u.image || null,
        category: u.category || u.role || null,
        reputationScore: u.reputationScore || u.reputation || trust.score,
        bountiesCompleted: u.bountiesCompleted || u.bounties_completed || u.bounties || 0,
        questsCompleted: u.questsCompleted || u.quests_completed || u.quests || 0,
        isVerified: u.isVerified || u.verified || false,
        trust
      };
    });

    // Sort by rep score descending, re-rank
    leaders.sort((a, b) => b.reputationScore - a.reputationScore);
    leaders.forEach((l, i) => { l.rank = i + 1; });

    res.render('leaderboard', {
      title: 'Leaderboard — REPVERSE',
      leaders,
      total: leaders.length
    });
  } catch (err) {
    console.error('Leaderboard error:', err.message);
    res.render('leaderboard', { title: 'Leaderboard — REPVERSE', leaders: [], total: 0 });
  }
});

function flattenList(data, keys) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  for (const k of keys) {
    if (Array.isArray(data[k])) return data[k];
  }
  return [];
}

module.exports = router;
