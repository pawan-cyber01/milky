/* ============================================================
   MILKY — pwa.js
   Progressive Web App: Service Worker Registration
   ============================================================ */

'use strict';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then(reg => {
        console.log('[MILKY PWA] Service Worker registered:', reg.scope);
      })
      .catch(err => {
        console.warn('[MILKY PWA] Service Worker registration failed:', err);
      });
  });
}

/* ── Install Prompt ─────────────────────────────────────── */
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;

  // Show the topbar PWA install button
  const btn = document.getElementById('pwaInstallBtn');
  if (btn) btn.style.display = 'flex';
});

async function triggerInstall() {
  if (!deferredPrompt) {
    showToast('📱 App already installed or not supported', 'info');
    return;
  }
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;

  const btn = document.getElementById('pwaInstallBtn');
  if (btn) btn.style.display = 'none';

  if (outcome === 'accepted') {
    showToast('🎉 MILKY installed successfully!', 'success');
  }
}

function showInstallBanner() {
  // Don't show if already installed
  if (window.matchMedia('(display-mode: standalone)').matches) return;

  const banner = document.createElement('div');
  banner.id = 'installBanner';
  banner.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #0ea5e9, #06b6d4);
    color: #fff;
    padding: 12px 20px;
    border-radius: 50px;
    font-size: 0.85rem;
    font-weight: 600;
    z-index: 500;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 8px 30px rgba(14,165,233,0.4);
    animation: slideUp 0.3s ease;
    white-space: nowrap;
    font-family: var(--font);
    cursor: pointer;
    max-width: 90vw;
  `;
  banner.innerHTML = `
    <span>📱 Install MILKY App</span>
    <button id="installBtn" style="
      background: rgba(255,255,255,0.25);
      border: none;
      color: #fff;
      padding: 5px 14px;
      border-radius: 20px;
      font-weight: 700;
      cursor: pointer;
      font-size: 0.82rem;
    ">Install</button>
    <button id="dismissInstall" style="
      background: none;
      border: none;
      color: rgba(255,255,255,0.8);
      cursor: pointer;
      font-size: 1rem;
      padding: 0 4px;
    ">✕</button>
  `;

  document.body.appendChild(banner);

  document.getElementById('installBtn').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    banner.remove();
    if (outcome === 'accepted') showToast('✅ MILKY installed!', 'success');
  });

  document.getElementById('dismissInstall').addEventListener('click', () => {
    banner.remove();
    deferredPrompt = null;
  });
}

window.addEventListener('appinstalled', () => {
  showToast('🎉 MILKY installed successfully!', 'success');
  deferredPrompt = null;
  const banner = document.getElementById('installBanner');
  if (banner) banner.remove();
});
