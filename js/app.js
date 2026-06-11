/* ============================================================
   MILKY — app.js
   Core: SPA Router, LocalStorage Utilities, Dashboard, Theme
   Admin panel: accessible via hash #milkpanel
   ============================================================ */

'use strict';

/* ── Constants ───────────────────────────────────────────── */
const LS_RECORDS  = 'milky_records';
const LS_SETTINGS = 'milky_settings';
const LS_CUSTOMERS  = 'milky_customers';
const ADMIN_HASH  = 'settings';

/* Default settings */
const DEFAULT_SETTINGS = {
  companyName : 'MILKY',
  footerText  : 'Made by Shiv Dairy Badaun',
  logo        : '',
  themeColor  : '#0ea5e9',
  fatRate     : 8,
  snfRate     : 4,
  snfFormula  : 'CLR/4 + 0.2*Fat + 0.14',
  darkMode    : false,
  rateMaster  : []
};

/* ── LocalStorage Helpers ───────────────────────────────── */
const Store = {
  getRecords() {
    try { return JSON.parse(localStorage.getItem(LS_RECORDS)) || []; }
    catch { return []; }
  },
  saveRecords(records) {
    localStorage.setItem(LS_RECORDS, JSON.stringify(records));
  },
  addRecord(rec) {
    const records = Store.getRecords();
    rec.id = Date.now() + Math.random().toString(36).slice(2);
    rec.createdAt = new Date().toISOString();
    records.unshift(rec);
    Store.saveRecords(records);
    return rec;
  },
  updateRecord(id, updates) {
    let records = Store.getRecords();
    records = records.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r);
    Store.saveRecords(records);
  },
  deleteRecord(id) {
    let records = Store.getRecords().filter(r => r.id !== id);
    Store.saveRecords(records);
  },
  deleteAllRecords() {
    Store.saveRecords([]);
  },
  getCustomers() {
    try { return JSON.parse(localStorage.getItem(LS_CUSTOMERS)) || []; }
    catch { return []; }
  },
  saveCustomers(customers) {
    localStorage.setItem(LS_CUSTOMERS, JSON.stringify(customers));
  },
  addCustomer(customer) {
    const customers = Store.getCustomers();
    // Prevent exact duplicates by mobile
    const exists = customers.find(f => f.mobile === customer.mobile);
    if (!exists) {
      customer.id = Date.now() + Math.random().toString(36).slice(2);
      customers.push(customer);
      Store.saveCustomers(customers);
      return customer;
    }
    return exists;
  },
  getSettings() {
    try {
      const s = JSON.parse(localStorage.getItem(LS_SETTINGS)) || {};
      return { ...DEFAULT_SETTINGS, ...s };
    } catch { return { ...DEFAULT_SETTINGS }; }
  },
  saveSettings(s) {
    localStorage.setItem(LS_SETTINGS, JSON.stringify(s));
  }
};

/* ── Router ─────────────────────────────────────────────── */
const PAGES = ['dashboard', 'calculator', 'customer', 'history', 'reports', 'settings', ADMIN_HASH];
const PAGE_TITLES = {
  dashboard  : 'Dashboard',
  calculator : 'Milk Calculator',
  customer     : 'Customer Entry',
  history    : 'History',
  reports    : 'Reports',
  settings   : 'Settings',
  [ADMIN_HASH]: '⚙️ Admin Panel'
};

function navigate(page) {
  window.location.hash = String(page || '').toLowerCase();
}

function handleRoute() {
  const rawHash = window.location.hash.replace('#', '').toLowerCase().trim();
  // Treat #milkpanel as admin
  const page = rawHash === ADMIN_HASH ? ADMIN_HASH :
               (PAGES.includes(rawHash) ? rawHash : 'calculator');

  // Show correct section
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const targetSection = document.getElementById('page-' + page);
  if (targetSection) targetSection.classList.add('active');

  // Highlight nav
  document.querySelectorAll('.nav-item, .bnav-item').forEach(el => {
    el.classList.remove('active');
    if ((el.dataset.page || '').toLowerCase() === page) el.classList.add('active');
  });

  // Update topbar title
  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = PAGE_TITLES[page] || 'MILKY';

  // Close sidebar on mobile
  closeSidebar();

  // Page-specific init
  switch(page) {
    case 'calculator':  break; // always visible, no extra init needed
    case 'dashboard':  initDashboard(); break;
    case 'history':    if (window.HistoryModule) window.HistoryModule.render(); break;
    case 'reports':    break;
    case ADMIN_HASH:   if (window.AdminModule) window.AdminModule.load(); break;
    case 'customer':     if (window.CustomerModule) window.CustomerModule.loadRecent(); break;
  }
}

/* ── Sidebar ────────────────────────────────────────────── */
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('show');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('show');
}

/* ── Dashboard ──────────────────────────────────────────── */
function initDashboard() {
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.slice(0, 7); // YYYY-MM

  // Display today's date
  const todayDateEl = document.getElementById('todayDate');
  if (todayDateEl) {
    todayDateEl.textContent = new Date().toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  const records = Store.getRecords();

  // Today's stats
  const todayRecs = records.filter(r => dateKey(r.date) === today);
  const todayQty  = todayRecs.reduce((s, r) => s + parseFloat(r.qty || 0), 0);
  const todayAmt  = todayRecs.reduce((s, r) => s + parseFloat(r.totalAmt || 0), 0);

  // Unique customers
  const uniqueCustomers = new Set(records.map(r => r.mobile || r.name)).size;

  // Monthly
  const monthRecs = records.filter(r => dateKey(r.date).startsWith(thisMonth));
  const monthQty  = monthRecs.reduce((s, r) => s + parseFloat(r.qty || 0), 0);

  setText('statTodayQty', fmt(todayQty, 2) + ' Kg');
  setText('statTodayAmt', '₹' + fmt(todayAmt, 2));
  setText('statCustomers',  uniqueCustomers);
  setText('statMonthQty', fmt(monthQty, 2) + ' Kg');

  // Charts
  if (window.ChartsModule) window.ChartsModule.renderAll(records);
}

/* ── Toast ──────────────────────────────────────────────── */
let toastTimer;
function showToast(msg, type = 'info', duration = 2800) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = 'toast ' + type + ' show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, duration);
}

/* ── Confirm Dialog ─────────────────────────────────────── */
function showConfirm(title, msg, onConfirm) {
  const overlay = document.getElementById('confirmOverlay');
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMsg').textContent   = msg;
  overlay.style.display = 'flex';

  const yes = document.getElementById('confirmYes');
  const no  = document.getElementById('confirmNo');

  const cleanup = () => { overlay.style.display = 'none'; };

  const yesHandler = () => { cleanup(); onConfirm(); };
  const noHandler  = () => { cleanup(); };

  yes.onclick = yesHandler;
  no.onclick  = noHandler;
}

/* ── Theme ──────────────────────────────────────────────── */
/* ── Utils ──────────────────────────────────────────────── */
function fmt(val, dec = 2) {
  return parseFloat(val || 0).toFixed(dec);
}

function setText(id, txt) {
  const el = document.getElementById(id);
  if (el) el.textContent = txt;
}

function fmtDate(isoDate) {
  if (!isoDate) return '—';
  const dateOnly = dateKey(isoDate);
  const [y, m, d] = dateOnly.split('-');
  if (!y || !m || !d) return String(isoDate);
  return `${d}/${m}/${y}`;
}

function dateKey(isoDate) {
  return String(isoDate || '').split('T')[0];
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/* ── Apply Branding ─────────────────────────────────────── */
function applyBranding() {
  const s = Store.getSettings();
  setText('companyName', s.companyName || 'MILKY');
  setText('footerText', s.footerText === '© 2025 MILKY Dairy' ? 'Made by Shiv Dairy Badaun' : (s.footerText || 'Made by Shiv Dairy Badaun'));
  if (s.logo) {
    const img = document.getElementById('logoImg');
    const icon = document.getElementById('logoIcon');
    if (img) { img.src = s.logo; img.style.display = 'block'; }
    if (icon) icon.style.display = 'none';
  }
  
  const theme = s.theme || (s.darkMode ? 'dark' : 'default');
  document.documentElement.setAttribute('data-theme', theme);
  const font = s.font || 'inter';
  document.body.style.fontFamily = font === 'Outfit' ? "'Outfit', sans-serif" : (font.includes('Segoe UI') ? font : "'Inter', sans-serif");
  
  if (window.I18n) window.I18n.setLanguage(s.language || 'en');
  if (s.themeColor) applyTheme(s.themeColor);
  
  const btn = document.getElementById('themeBtn');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function applyTheme(color) {
  if (!color) return;
  document.documentElement.style.setProperty('--primary', color);
  document.documentElement.style.setProperty('--primary-dark', color); // Simplified for now
}

/* ── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  if (window.I18n) window.I18n.init();
  
  const s = Store.getSettings();
  const themeSel = document.getElementById('settingTheme');
  if (themeSel) {
    themeSel.value = s.theme || (s.darkMode ? 'dark' : 'default');
    themeSel.addEventListener('change', (e) => {
      const s = Store.getSettings();
      s.theme = e.target.value;
      if (s.theme === 'dark') s.darkMode = true; else s.darkMode = false;
      Store.saveSettings(s);
      applyBranding();
    });
  }
  
  const fontSel = document.getElementById('settingFont');
  if (fontSel) {
    fontSel.value = s.font || 'inter';
    fontSel.addEventListener('change', (e) => {
      const s = Store.getSettings();
      s.font = e.target.value;
      Store.saveSettings(s);
      applyBranding();
    });
  }

  // Apply branding immediately
  applyBranding();

  // Router
  window.addEventListener('hashchange', handleRoute);
  handleRoute();

  // Sidebar menu button
  document.getElementById('menuBtn').addEventListener('click', openSidebar);

  // Sidebar overlay click → close
  document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);

  // Nav link clicks (both sidebar & bottom nav)
  document.querySelectorAll('.nav-item, .bnav-item, .quick-btn, [data-page]').forEach(el => {
    el.addEventListener('click', e => {
      const page = el.dataset.page;
      if (page) {
        e.preventDefault();
        navigate(page);
      }
    });
  });

  // PWA Install button
  const pwaBtn = document.getElementById('pwaInstallBtn');
  if (pwaBtn) pwaBtn.addEventListener('click', () => {
    if (typeof triggerInstall === 'function') triggerInstall();
  });

  // Dark mode toggle
  const themeBtn = document.getElementById('themeBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const s = Store.getSettings();
      s.theme = s.theme === 'dark' ? 'default' : 'dark';
      s.darkMode = s.theme === 'dark';
      Store.saveSettings(s);
      applyBranding();
      showToast(s.theme === 'dark' ? '🌙 Dark mode on' : '☀️ Light mode on', 'info');
    });
  }

  // Confirm modal close
  document.getElementById('confirmNo').addEventListener('click', () => {
    document.getElementById('confirmOverlay').style.display = 'none';
  });
});

/* ── Expose Globals ─────────────────────────────────────── */
window.Store          = Store;
window.showToast      = showToast;
window.showConfirm    = showConfirm;
window.navigate       = navigate;
window.fmt            = fmt;
window.setText        = setText;
window.fmtDate        = fmtDate;
window.dateKey        = dateKey;
window.todayISO       = todayISO;
window.applyTheme     = applyTheme;
window.applyBranding  = applyBranding;
window.ADMIN_HASH     = ADMIN_HASH;
window.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
