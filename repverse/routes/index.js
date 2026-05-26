const express = require('express');
const router = express.Router();
const zaApi = require('../middleware/zaApi');

router.get('/', async (req, res) => {
  const [bountiesR, leaderboardR, questsR, creatorsR] = await Promise.allSettled([
    zaApi.getBounties(6, 1),
    zaApi.getLeaderboard(10),
    zaApi.getQuests(6, 1),
    zaApi.getCreators(8, 1)
  ]);

  const bounties    = extract(bountiesR);
  const leaderboard = extract(leaderboardR);
  const quests      = extract(questsR);
  const creators    = extract(creatorsR);

  // Normalise bounties into a flat array regardless of API shape
  const bountyList = flattenList(bounties, ['bounties','data','results','items']);
  const leaderList = flattenList(leaderboard, ['creators','users','data','results','items']);
  const questList  = flattenList(quests, ['quests','data','results','items']);

  res.render('index', {
    title: 'REPVERSE — AI Reputation Explorer',
    bountyList,
    leaderList,
    questList,
    apiConnected: !!(bountyList.length || leaderList.length || questList.length)
  });
});

function extract(settled) {
  return settled.status === 'fulfilled' ? settled.value : null;
}

// Dig out the real array from whatever shape the API returns
function flattenList(data, keys) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  for (const k of keys) {
    if (Array.isArray(data[k])) return data[k];
  }
  // Last resort: if it's an object with numeric keys (rare)
  return [];
}

module.exports = router;
