const axios = require('axios');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

async function generateReputationSummary(profileData) {
  if (!ANTHROPIC_API_KEY) {
    return generateFallbackSummary(profileData);
  }

  try {
    const prompt = buildPrompt(profileData);
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        timeout: 20000
      }
    );
    const content = response.data.content;
    return content && content[0] ? content[0].text : generateFallbackSummary(profileData);
  } catch (e) {
    console.error('AI summary error:', e.message);
    return generateFallbackSummary(profileData);
  }
}

function buildPrompt(profileData) {
  const { username, bountiesCompleted, questsCompleted, reputationScore, daos, skills } = profileData;
  return `You are REPVERSE, an AI reputation analyst for Web3 contributors on Zero Authority DAO.

Analyze this contributor and write a 3-4 sentence professional reputation summary. Be specific, insightful, and encouraging. Highlight their strengths and potential.

Contributor Data:
- Username: ${username || 'Anonymous'}
- Reputation Score: ${reputationScore || 'N/A'}
- Bounties Completed: ${bountiesCompleted || 0}
- Quests Completed: ${questsCompleted || 0}
- DAOs: ${daos ? (Array.isArray(daos) ? daos.join(', ') : daos) : 'None listed'}
- Skills: ${skills ? (Array.isArray(skills) ? skills.join(', ') : skills) : 'Not specified'}

Write a concise, professional AI-generated contributor summary (3-4 sentences max). Start with their name or "This contributor".`;
}

function generateFallbackSummary(profileData) {
  const { username, bountiesCompleted, questsCompleted, reputationScore } = profileData;
  const score = reputationScore || 0;
  const bounties = bountiesCompleted || 0;
  const quests = questsCompleted || 0;

  if (score > 80) {
    return `${username || 'This contributor'} is a top-tier Web3 contributor with an exceptional reputation score of ${score}. Their consistent delivery across ${bounties} bounties and ${quests} quests demonstrates elite-level commitment. They represent the gold standard of trustless collaboration on Zero Authority DAO.`;
  } else if (score > 50) {
    return `${username || 'This contributor'} is an established contributor within the Zero Authority ecosystem, earning a solid reputation of ${score}. With ${bounties} completed bounties and ${quests} quests, they demonstrate reliable participation in decentralized work. Their track record shows consistent growth and community investment.`;
  } else if (bounties > 0 || quests > 0) {
    return `${username || 'This contributor'} is an emerging participant in the Zero Authority ecosystem with ${bounties} completed bounties and ${quests} quests. They are actively building their on-chain reputation through meaningful contributions. With continued engagement, they are well-positioned for greater recognition.`;
  } else {
    return `${username || 'This contributor'} is building their presence in the Zero Authority ecosystem. Every contribution is a step toward a verifiable, on-chain reputation. Engaging with bounties, quests, and DAO governance is the fastest path to recognition in the decentralized economy.`;
  }
}

// Compute a trust score from raw API data
function computeTrustScore(data) {
  if (!data) return { score: 0, grade: 'F', breakdown: {} };

  const bounties = parseInt(data.bountiesCompleted || data.bounties_completed || 0);
  const quests = parseInt(data.questsCompleted || data.quests_completed || 0);
  const gigs = parseInt(data.gigsCompleted || data.gigs_completed || 0);
  const endorsements = parseInt(data.endorsements || data.endorsementCount || 0);
  const reputation = parseInt(data.reputationScore || data.reputation_score || data.reputation || 0);

  // If API already provides a score, use it
  if (reputation > 0) {
    return {
      score: Math.min(100, reputation),
      grade: gradeFromScore(reputation),
      breakdown: {
        'Reputation Score': reputation,
        'Bounties': bounties,
        'Quests': quests,
        'Gigs': gigs,
        'Endorsements': endorsements
      }
    };
  }

  // Compute from activity
  const computed = Math.min(100, (bounties * 12) + (quests * 8) + (gigs * 10) + (endorsements * 5));
  return {
    score: computed,
    grade: gradeFromScore(computed),
    breakdown: {
      'Bounties': bounties,
      'Quests': quests,
      'Gigs': gigs,
      'Endorsements': endorsements
    }
  };
}

function gradeFromScore(score) {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

module.exports = { generateReputationSummary, computeTrustScore };
