/* REPVERSE — Main JS */

// ── Custom Cursor ──────────────────────────────────────────────
const cursor = document.getElementById('cursor');
const cursorRing = document.getElementById('cursor-ring');
let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (cursor) {
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
  }
});

function animateRing() {
  if (cursorRing) {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top = ringY + 'px';
  }
  requestAnimationFrame(animateRing);
}
animateRing();

// ── Loading Screen ──────────────────────────────────────────────
const loadingScreen = document.getElementById('loading-screen');
window.addEventListener('load', () => {
  setTimeout(() => {
    if (loadingScreen) loadingScreen.classList.add('hidden');
  }, 1200);
});

// ── Navbar Scroll Effect ────────────────────────────────────────
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  if (navbar) {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }
});

// ── Hamburger Menu ──────────────────────────────────────────────
const hamburger = document.querySelector('.hamburger');
const mobileNav = document.querySelector('.mobile-nav');

if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileNav.classList.toggle('open');
  });

  document.addEventListener('click', e => {
    if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
      hamburger.classList.remove('open');
      mobileNav.classList.remove('open');
    }
  });
}

// ── Scroll Reveal ───────────────────────────────────────────────
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

reveals.forEach(el => observer.observe(el));

// ── Animated Counter ────────────────────────────────────────────
function animateCounter(el, target, duration = 1500) {
  let start = 0;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target).toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// Trigger counters when visible
const counters = document.querySelectorAll('[data-counter]');
const counterObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const target = parseInt(entry.target.dataset.counter);
      animateCounter(entry.target, target);
      counterObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
counters.forEach(el => counterObs.observe(el));

// ── Search Form Handler ─────────────────────────────────────────
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const resultPanel = document.getElementById('result-panel');
const searchBtn = document.getElementById('search-btn');

if (searchForm) {
  searchForm.addEventListener('submit', async e => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;
    await performSearch(query);
  });
}

async function performSearch(query) {
  if (!resultPanel || !searchBtn) return;

  // Show loading state
  searchBtn.disabled = true;
  searchBtn.innerHTML = '<span class="spinner"></span> Searching...';
  resultPanel.innerHTML = '<div style="text-align:center;padding:40px"><span class="spinner"></span><p style="margin-top:12px;color:var(--text-secondary);font-size:0.9rem">Fetching contributor data...</p></div>';
  resultPanel.classList.add('visible');

  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (data.error) {
      resultPanel.innerHTML = `<div class="error-msg">${data.error}</div>`;
    } else {
      renderSearchResult(data);
    }
  } catch (err) {
    resultPanel.innerHTML = `<div class="error-msg">Failed to connect. Please check your connection and try again.</div>`;
  } finally {
    searchBtn.disabled = false;
    searchBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Analyze`;
  }
}

function renderSearchResult(data) {
  const { profile, trust, aiSummary } = data;
  if (!profile) {
    resultPanel.innerHTML = `<div class="error-msg">No contributor found for that query.</div>`;
    return;
  }

  const gradeClass = `trust-${trust?.grade?.toLowerCase() || 'f'}`;
  const initials = (profile.username || 'U').substring(0, 2).toUpperCase();
  const avatarHtml = profile.avatar
    ? `<img src="${profile.avatar}" alt="${profile.username}" onerror="this.parentElement.textContent='${initials}'">`
    : initials;

  const wallet = profile.wallet || '';
  const walletShort = wallet.length > 20 ? `${wallet.slice(0, 8)}...${wallet.slice(-6)}` : wallet;

  const daos = Array.isArray(profile.daos) ? profile.daos : [];
  const skills = Array.isArray(profile.skills) ? profile.skills : [];

  const heatmap = generateHeatmap();

  resultPanel.innerHTML = `
    <div class="card" style="padding:28px">
      <div class="result-profile-header">
        <div class="result-avatar">${avatarHtml}</div>
        <div style="flex:1">
          <div class="result-name">
            ${profile.username || 'Anonymous'}
            ${profile.isVerified ? `<span class="verified-badge"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></span>` : ''}
          </div>
          ${wallet ? `<div class="result-wallet">${walletShort}</div>` : ''}
          ${profile.bio ? `<div style="font-size:0.875rem;color:var(--text-secondary);margin-top:8px">${profile.bio}</div>` : ''}
        </div>
        <div class="trust-score-badge ${gradeClass}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Grade ${trust?.grade || 'N/A'}
        </div>
      </div>

      <div class="result-stats-grid">
        <div class="result-stat">
          <div class="result-stat-value">${trust?.score || 0}</div>
          <div class="result-stat-label">Rep Score</div>
        </div>
        <div class="result-stat">
          <div class="result-stat-value">${profile.bountiesCompleted || 0}</div>
          <div class="result-stat-label">Bounties</div>
        </div>
        <div class="result-stat">
          <div class="result-stat-value">${profile.questsCompleted || 0}</div>
          <div class="result-stat-label">Quests</div>
        </div>
        <div class="result-stat">
          <div class="result-stat-value">${profile.endorsements || 0}</div>
          <div class="result-stat-label">Endorsements</div>
        </div>
        <div class="result-stat">
          <div class="result-stat-value">${profile.gigsCompleted || 0}</div>
          <div class="result-stat-label">Gigs</div>
        </div>
        <div class="result-stat">
          <div class="result-stat-value">${profile.governanceVotes || 0}</div>
          <div class="result-stat-label">Gov Votes</div>
        </div>
      </div>

      <div class="ai-summary" style="margin-bottom:20px">
        <div class="ai-summary-header">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="color:var(--accent-blue)"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          <span class="ai-label">AI Reputation Analysis</span>
        </div>
        <div class="ai-summary-text">${aiSummary || 'Analysis unavailable.'}</div>
      </div>

      <div style="margin-bottom:20px">
        <div style="font-size:0.8rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px">Contribution Activity</div>
        <div class="heatmap-grid">${heatmap}</div>
      </div>

      ${skills.length > 0 ? `
        <div style="margin-bottom:16px">
          <div style="font-size:0.8rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px">Skills</div>
          <div class="tags-list">${skills.slice(0,8).map(s => `<span class="tag">${s}</span>`).join('')}</div>
        </div>
      ` : ''}

      ${daos.length > 0 ? `
        <div>
          <div style="font-size:0.8rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px">DAO Involvement</div>
          <div class="tags-list">${daos.slice(0,6).map(d => `<span class="tag">${typeof d === 'string' ? d : d.name || d}</span>`).join('')}</div>
        </div>
      ` : ''}

      <div style="margin-top:20px;padding-top:20px;border-top:1px solid var(--border);display:flex;gap:12px;flex-wrap:wrap">
        <a href="/contributor/${encodeURIComponent(profile.username)}" class="btn btn-primary btn-sm">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Full Profile
        </a>
        <a href="https://zeroauthoritydao.com/creators/${encodeURIComponent(profile.username)}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          View on ZA
        </a>
      </div>
    </div>
  `;

  // Animate progress bars
  resultPanel.querySelectorAll('.progress-fill').forEach(bar => {
    const width = bar.dataset.width;
    setTimeout(() => { bar.style.width = width + '%'; }, 100);
  });
}

function generateHeatmap() {
  const cells = 52 * 7; // One year
  let html = '';
  for (let i = 0; i < cells; i++) {
    const rand = Math.random();
    let level = 0;
    if (rand > 0.85) level = 4;
    else if (rand > 0.72) level = 3;
    else if (rand > 0.6) level = 2;
    else if (rand > 0.5) level = 1;
    html += `<div class="heatmap-cell level-${level}" title="Activity"></div>`;
  }
  return html;
}

// ── Scroll to search ────────────────────────────────────────────
function scrollToSearch() {
  const el = document.getElementById('search');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Quick search from hero
const heroSearchBtn = document.getElementById('hero-search-btn');
if (heroSearchBtn) {
  heroSearchBtn.addEventListener('click', scrollToSearch);
}

// ── Live stats counter trigger ──────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Animate numbers in hero stats after page loads
  setTimeout(() => {
    document.querySelectorAll('.hero-stat-value[data-count]').forEach(el => {
      const val = parseInt(el.dataset.count);
      if (!isNaN(val)) animateCounter(el, val, 2000);
    });
  }, 1500);
});

// ── Leaderboard search filter ───────────────────────────────────
const leaderFilter = document.getElementById('leaderboard-filter');
if (leaderFilter) {
  leaderFilter.addEventListener('input', e => {
    const val = e.target.value.toLowerCase();
    document.querySelectorAll('.leaderboard-row').forEach(row => {
      const name = row.dataset.name || '';
      row.style.display = name.toLowerCase().includes(val) ? '' : 'none';
    });
  });
}
