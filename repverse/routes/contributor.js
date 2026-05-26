const express = require('express');
const router  = express.Router();
const zaApi   = require('../middleware/zaApi');
const { generateReputationSummary, computeTrustScore } = require('../middleware/aiService');

router.get('/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const raw = await zaApi.getCreatorByUsername(username);
    if (!raw) return res.render('404', { title: 'Contributor Not Found' });

    const profile = normalize(raw, username);
    const trust   = computeTrustScore(profile);
    const aiSummary = await generateReputationSummary({ ...profile, reputationScore: trust.score, grade: trust.grade });

    res.render('contributor', {
      title: `${profile.username} — REPVERSE`,
      profile, trust, aiSummary, userBounties: null
    });
  } catch (err) {
    console.error('Contributor route:', err.message);
    res.render('404', { title: 'Contributor Not Found' });
  }
});

function normalize(raw, query) {
  const d = Array.isArray(raw) ? raw[0] : (raw.data || raw.user || raw.creator || raw.profile || raw);
  if (!d) return { username: query, wallet: null, avatar: null, bio: null, reputationScore: 0, bountiesCompleted: 0, questsCompleted: 0, gigsCompleted: 0, endorsements: 0, daos: [], skills: [], joinedAt: null, githubUrl: null, twitterUrl: null, isVerified: false, rank: null, governanceVotes: 0, proposalsSubmitted: 0, totalEarned: 0, network: 'Stacks Network', raw: {} };
  return {
    id: d.id || d._id || d.uuid || null,
    username: d.username || d.name || d.handle || d.displayName || query,
    wallet: d.wallet || d.walletAddress || d.stxAddress || null,
    avatar: d.avatar || d.profileImage || d.image || d.avatarUrl || null,
    bio: d.bio || d.description || d.about || null,
    category: d.category || d.role || null,
    reputationScore: d.reputationScore || d.reputation || d.score || 0,
    bountiesCompleted: d.bountiesCompleted || d.bounties_completed || d.bounties || 0,
    questsCompleted: d.questsCompleted || d.quests_completed || d.quests || 0,
    gigsCompleted: d.gigsCompleted || d.gigs_completed || d.gigs || 0,
    endorsements: d.endorsements || d.endorsementCount || 0,
    daos: d.daos || d.organizations || d.communities || [],
    skills: d.skills || d.tags || (d.category ? [d.category] : []),
    joinedAt: d.createdAt || d.joined_at || d.joinedAt || null,
    githubUrl: d.githubUrl || d.github || null,
    twitterUrl: d.twitterUrl || d.twitter || (d.twitterHandle ? `https://twitter.com/${d.twitterHandle.replace('@','')}` : null),
    isVerified: d.isVerified || d.verified || false,
    rank: d.rank || null,
    governanceVotes: d.governanceVotes || d.votes || 0,
    proposalsSubmitted: d.proposalsSubmitted || d.proposals || 0,
    totalEarned: d.totalEarned || d.earnings || 0,
    network: d.network || 'Stacks Network',
    raw: d
  };
}

module.exports = router;
