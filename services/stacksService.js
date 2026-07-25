const axios = require('axios');

const API = process.env.STACKS_API_BASE || 'https://api.hiro.so';

const client = axios.create({ baseURL: API, timeout: 10000 });

// --- BNS resolution -------------------------------------------------------

async function resolveBnsToAddress(bnsName) {
  try {
    const { data } = await client.get(`/v1/names/${encodeURIComponent(bnsName)}`);
    return data?.address || null;
  } catch (err) {
    return null;
  }
}

async function getNamesForAddress(address) {
  try {
    const { data } = await client.get(`/v1/addresses/stacks/${address}`);
    return data?.names || [];
  } catch (err) {
    return [];
  }
}

// --- Account / balances ----------------------------------------------------

async function getAccountBalances(address) {
  const { data } = await client.get(`/extended/v1/address/${address}/balances`);
  return data;
}

async function getAccountInfo(address) {
  const { data } = await client.get(`/extended/v1/address/${address}/stx`);
  return data;
}

// --- NFTs -------------------------------------------------------------------

async function getNftHoldings(address, limit = 50) {
  const { data } = await client.get(`/extended/v1/tokens/nft/holdings`, {
    params: { principal: address, limit, unanchored: true }
  });
  return data;
}

// --- Transactions -------------------------------------------------------------

async function getTransactions(address, limit = 20, offset = 0) {
  const { data } = await client.get(`/extended/v1/address/${address}/transactions`, {
    params: { limit, offset }
  });
  return data;
}

// --- Stacking / PoX info for stake calculator --------------------------------

async function getPoxInfo() {
  const { data } = await client.get('/v2/pox');
  return data;
}

async function getStackingInfoForAddress(address) {
  try {
    const { data } = await client.get(`/extended/v1/address/${address}/stx`);
    return data;
  } catch (err) {
    return null;
  }
}

module.exports = {
  resolveBnsToAddress,
  getNamesForAddress,
  getAccountBalances,
  getAccountInfo,
  getNftHoldings,
  getTransactions,
  getPoxInfo,
  getStackingInfoForAddress
};
