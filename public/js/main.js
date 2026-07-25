// ---------------------------------------------------------------------------
// Copy-to-clipboard for addresses
// ---------------------------------------------------------------------------
document.querySelectorAll('[data-copy]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const value = btn.getAttribute('data-copy');
    navigator.clipboard.writeText(value).then(() => {
      const original = btn.textContent;
      btn.textContent = 'Copied';
      setTimeout(() => (btn.textContent = original), 1400);
    });
  });
});

// ---------------------------------------------------------------------------
// Wallet connect (Stacks Connect / Hiro Wallet, Xverse, Leather)
// Loaded lazily only when the user clicks "Connect wallet" so pages without
// it don't pay the script cost.
// ---------------------------------------------------------------------------
function loadStacksConnect() {
  return new Promise((resolve, reject) => {
    if (window.StacksProvider || window.showConnect) return resolve();
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/stacks-connect/7.7.1/index.umd.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function connectWallet() {
  const btn = document.getElementById('wallet-connect-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Connecting…'; }

  try {
    await loadStacksConnect();

    const appConfig = { appDetails: { name: 'Repverse', icon: window.location.origin + '/img/favicon.svg' } };

    window.showConnect({
      ...appConfig,
      onFinish: async (data) => {
        const address =
          data?.userSession?.loadUserData?.()?.profile?.stxAddress?.mainnet ||
          data?.authResponsePayload?.profile?.stxAddress?.mainnet;

        if (!address) {
          if (btn) { btn.disabled = false; btn.textContent = 'Connect wallet'; }
          return;
        }

        const res = await fetch('/auth/wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address })
        });
        const json = await res.json();
        if (json.ok) window.location.href = json.redirect;
      },
      onCancel: () => {
        if (btn) { btn.disabled = false; btn.textContent = 'Connect wallet'; }
      }
    });
  } catch (err) {
    console.error('Wallet connect failed to load', err);
    if (btn) { btn.disabled = false; btn.textContent = 'Connect wallet'; }
    alert('Could not load the wallet connector. Check your connection and try again.');
  }
}

document.querySelectorAll('[data-connect-wallet]').forEach((el) => {
  el.addEventListener('click', connectWallet);
});

// ---------------------------------------------------------------------------
// Currency converter (talks to /api/convert)
// ---------------------------------------------------------------------------
const converterForm = document.getElementById('converter-form');
if (converterForm) {
  const amountInput = document.getElementById('converter-amount');
  const fromSelect = document.getElementById('converter-from');
  const toSelect = document.getElementById('converter-to');
  const resultInput = document.getElementById('converter-result');
  const metaEl = document.getElementById('converter-meta');
  const swapBtn = document.getElementById('converter-swap');

  let debounceTimer;

  async function runConversion() {
    const amount = parseFloat(amountInput.value);
    const from = fromSelect.value;
    const to = toSelect.value;

    if (!amount || amount <= 0) {
      resultInput.value = '';
      return;
    }

    metaEl.textContent = 'Converting…';

    try {
      const res = await fetch(`/api/convert?amount=${amount}&from=${from}&to=${to}`);
      const json = await res.json();

      if (!res.ok) {
        metaEl.textContent = json.error || 'Live rates unavailable right now.';
        resultInput.value = '';
        return;
      }

      resultInput.value = Number(json.result).toLocaleString(undefined, { maximumFractionDigits: 6 });
      metaEl.textContent = `1 ${from} = ${(json.result / amount).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${to} · updated ${new Date(json.lastUpdated).toLocaleTimeString()}`;
    } catch (err) {
      metaEl.textContent = 'Network error — try again.';
    }
  }

  [amountInput, fromSelect, toSelect].forEach((el) => {
    el.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(runConversion, 350);
    });
  });

  if (swapBtn) {
    swapBtn.addEventListener('click', () => {
      const tmp = fromSelect.value;
      fromSelect.value = toSelect.value;
      toSelect.value = tmp;
      runConversion();
    });
  }

  runConversion();
}

// ---------------------------------------------------------------------------
// Stake calculator (client-side estimate; PoX cycle length ~2 weeks)
// ---------------------------------------------------------------------------
const stakeForm = document.getElementById('stake-form');
if (stakeForm) {
  const stxInput = document.getElementById('stake-amount');
  const apyInput = document.getElementById('stake-apy');
  const cyclesInput = document.getElementById('stake-cycles');
  const priceInput = document.getElementById('stake-price');

  const outCycle = document.getElementById('stake-out-cycle');
  const outTotal = document.getElementById('stake-out-total');
  const outUsd = document.getElementById('stake-out-usd');

  function calc() {
    const stx = parseFloat(stxInput.value) || 0;
    const apy = parseFloat(apyInput.value) || 0;
    const cycles = parseInt(cyclesInput.value, 10) || 0;
    const price = parseFloat(priceInput.value) || 0;

    // ~2-week cycles → 26 cycles/year approx
    const perCycleRate = apy / 100 / 26;
    const perCycle = stx * perCycleRate;
    const total = perCycle * cycles;

    outCycle.textContent = perCycle.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' STX';
    outTotal.textContent = total.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' STX';
    outUsd.textContent = '$' + (total * price).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  [stxInput, apyInput, cyclesInput, priceInput].forEach((el) => el.addEventListener('input', calc));
  calc();
}

// ---------------------------------------------------------------------------
// Mobile nav close-on-navigate
// ---------------------------------------------------------------------------
document.querySelectorAll('.nav-links a').forEach((a) => {
  a.addEventListener('click', () => document.querySelector('.nav-links').classList.remove('open'));
});
