const axios = require('axios');

const CMC_BASE = process.env.CMC_API_BASE || 'https://pro-api.coinmarketcap.com';
const CMC_KEY = process.env.CMC_API_KEY;

// Static fallback list so the converter UI works even without a CMC key configured.
const FALLBACK_SYMBOLS = [
  { symbol: 'STX', name: 'Stacks' },
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'USDT', name: 'Tether' },
  { symbol: 'USDC', name: 'USD Coin' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'BNB', name: 'BNB' },
  { symbol: 'XRP', name: 'XRP' },
  { symbol: 'ADA', name: 'Cardano' },
  { symbol: 'DOGE', name: 'Dogecoin' }
];

async function convert(amount, fromSymbol, toSymbol) {
  if (!CMC_KEY) {
    throw new Error('NO_API_KEY');
  }
  const { data } = await axios.get(`${CMC_BASE}/v2/tools/price-conversion`, {
    params: { amount, symbol: fromSymbol, convert: toSymbol },
    headers: { 'X-CMC_PRO_API_KEY': CMC_KEY }
  });
  const item = Array.isArray(data?.data) ? data.data[0] : data?.data;
  const quote = item?.quote?.[toSymbol];
  return {
    amount,
    from: fromSymbol,
    to: toSymbol,
    result: quote?.price,
    lastUpdated: quote?.last_updated
  };
}

function getSupportedSymbols() {
  return FALLBACK_SYMBOLS;
}

module.exports = { convert, getSupportedSymbols };
