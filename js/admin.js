/* ============================================================
   MILKY — admin.js
   Admin Panel: settings, branding, rates, backup/restore
   Access via: http://localhost/.../index.html#milkpanel
   ============================================================ */

'use strict';

const AdminModule = {

  /* Load saved settings into admin form */
  load() {
    const s = Store.getSettings();

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val !== undefined && val !== null ? val : '';
    };

    setVal('adminTheme',       s.themeColor   || '#0ea5e9');
    setVal('adminLanguage',    s.language     || 'en');
    setVal('adminFont',        s.font         || 'inter');
    setVal('adminWADairyName', s.waDairyName  || '');

    const hexEl = document.getElementById('adminThemeHex');
    if (hexEl) hexEl.textContent = s.themeColor || '#0ea5e9';

  },



  /* Save all settings */
  save() {
    const s = Store.getSettings();
    s.themeColor  = document.getElementById('adminTheme').value              || '#0ea5e9';
    s.language    = document.getElementById('adminLanguage').value           || 'en';
    s.font        = document.getElementById('adminFont').value               || 'inter';
    s.waDairyName = document.getElementById('adminWADairyName').value.trim() || '';

    Store.saveSettings(s);
    applyBranding();
    showToast('✅ Settings saved!', 'success');
  }
};



/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Save button
  document.getElementById('saveAdminBtn').addEventListener('click', AdminModule.save);

  // Color picker live update
  document.getElementById('adminTheme').addEventListener('input', function() {
    const color = this.value;
    document.getElementById('adminThemeHex').textContent = color;
    applyTheme(color);
    // Update active preset dot
    document.querySelectorAll('.preset-dot').forEach(dot => {
      dot.classList.toggle('active-preset', dot.dataset.color === color);
    });
  });

  // Preset theme dots
  document.querySelectorAll('.preset-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const color = dot.dataset.color;
      document.getElementById('adminTheme').value = color;
      document.getElementById('adminThemeHex').textContent = color;
      applyTheme(color);
      document.querySelectorAll('.preset-dot').forEach(d => d.classList.remove('active-preset'));
      dot.classList.add('active-preset');
    });
  });


});

window.AdminModule = AdminModule;
