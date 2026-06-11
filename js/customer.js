/* ============================================================
   MILKY — customer.js
   Customer Entry: save records, load recent, WhatsApp receipt
   ============================================================ */

'use strict';

const CustomerModule = {
  // Safe element getter to handle cache mismatch on user devices
  el(id) {
    let e = document.getElementById(id);
    if (!e && id === 'customerName') e = document.getElementById('CustomerName');
    if (!e && id === 'customerMobile') e = document.getElementById('CustomerMobile');
    if (!e && id === 'customerNameList') e = document.getElementById('CustomerNameList');
    return e;
  },

  /* Save or Update the current customer record */
  saveRecord() {
    const nameEl = CustomerModule.el('customerName');
    const mobEl = CustomerModule.el('customerMobile');
    if (!nameEl || !mobEl) return;
    
    const name    = nameEl.value.trim();
    const mobile  = mobEl.value.trim();

    if (!name)   { showToast('⚠️ Customer name is required', 'warning'); return; }
    if (!mobile || mobile.length < 10) { showToast('⚠️ Enter a valid 10-digit mobile number', 'warning'); return; }

    const calc = window.getCalcResult ? window.getCalcResult() : null;
    if (!calc) {
      Store.addCustomer({ name, mobile });
      showToast('✅ Customer added to address book', 'success');
      return;
    }
    
    // Update existing record if we already saved this calculation
    if (window.hasSavedCurrentCalc && window.currentAutoSaveId) {
      Store.updateRecord(window.currentAutoSaveId, { name, mobile });
      Store.addCustomer({ name, mobile });
      CustomerModule.loadRecent();
      return; // Silent update to avoid toast spam
    }

    const record = {
      name,
      mobile,
      date     : calc.date,
      qty      : calc.qty,
      fat      : calc.fat,
      clr      : calc.clr,
      snf      : calc.snf,
      fatKg    : calc.fatKg,
      snfKg    : calc.snfKg,
      avgRate  : calc.avgRate,
      totalAmt : calc.totalAmt
    };

    const saved = Store.addRecord(record);
    window.currentAutoSaveId = saved.id;
    Store.addCustomer({ name, mobile });
    
    window.hasSavedCurrentCalc = true;
    showToast('✅ Record auto-saved successfully!', 'success');
    CustomerModule.loadRecent();
  },

  /* Clear customer form */
  clearForm() {
    const nameEl = CustomerModule.el('customerName');
    const mobEl = CustomerModule.el('customerMobile');
    if (nameEl) nameEl.value = '';
    if (mobEl) mobEl.value = '';
    
    // Clear the active calculation as well so they start completely fresh
    if (typeof window.clearResult === 'function') {
      window.clearResult();
    }
  },

  /* Populate datalist */
  populateCustomers() {
    const list = CustomerModule.el('customerNameList');
    if (!list) return;
    const customers = Store.getCustomers();
    list.innerHTML = customers.map(f => `<option value="${escHtml(f.name)}" data-mobile="${escHtml(f.mobile)}">`).join('');
  },

  /* Auto-fill mobile when name selected */
  onNameSelect() {
    const nameEl = CustomerModule.el('customerName');
    if (!nameEl) return;
    const val = nameEl.value;
    const customers = Store.getCustomers();
    const match = customers.find(f => f.name === val);
    if (match) {
      const mobEl = CustomerModule.el('customerMobile');
      if (mobEl) mobEl.value = match.mobile;
    }
    CustomerModule.checkAutoSave();
  },

  /* Trigger Auto Save if valid */
  checkAutoSave() {
    const nameEl = CustomerModule.el('customerName');
    const mobEl = CustomerModule.el('customerMobile');
    if (!nameEl || !mobEl) return;
    const name    = nameEl.value.trim();
    const mobile  = mobEl.value.trim();
    if (name && mobile && mobile.length === 10) {
      // Debounce slightly to allow user to finish typing
      clearTimeout(CustomerModule.autoSaveTimer);
      CustomerModule.autoSaveTimer = setTimeout(() => {
        CustomerModule.saveRecord();
      }, 800);
    }
  },

  /* Load recent 5 records into the sidebar panel */
  loadRecent() {
    const container = document.getElementById('recentRecords');
    const records   = Store.getRecords().slice(0, 5);

    if (!records.length) {
      container.innerHTML = '<div class="empty-state">No records yet. Start by calculating!</div>';
      return;
    }

    container.innerHTML = records.map(r => `
      <div class="recent-item">
        <div>
          <div class="recent-customer">${escHtml(r.name)}</div>
          <div class="recent-details">${fmtDate(r.date)} &bull; ${r.qty} Kg &bull; Fat: ${r.fat}%</div>
        </div>
        <div class="recent-amt">₹${r.totalAmt}</div>
      </div>
    `).join('');
  },

  /* Send WhatsApp receipt from customer entry page */
  sendWhatsApp() {
    const nameEl = CustomerModule.el('customerName');
    const mobEl = CustomerModule.el('customerMobile');
    if (!nameEl || !mobEl) return;
    
    const name   = nameEl.value.trim();
    const mobile = mobEl.value.trim();
    const calc   = window.getCalcResult ? window.getCalcResult() : null;

    if (!calc) { showToast('⚠️ Calculate milk data first', 'error'); return; }
    if (!mobile) { showToast('⚠️ Enter mobile number', 'error'); return; }

    const s = Store.getSettings();
    const msg = generateReceiptText(name || '—', mobile, calc);
    window.open('https://wa.me/91' + mobile + '?text=' + encodeURIComponent(msg), '_blank');
  }
};

/* ── HTML Escape ─────────────────────────────────────────── */
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const saveBtn = document.getElementById('saveCustomerBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', CustomerModule.saveRecord.bind(CustomerModule));
  }
  document.getElementById('clearCustomerBtn').addEventListener('click', () => {
    CustomerModule.clearForm();
    showToast('↺ Form cleared', 'info');
  });
  document.getElementById('waCustomerBtn').addEventListener('click', CustomerModule.sendWhatsApp.bind(CustomerModule));

  // Mobile number: only digits
  const mobEl = CustomerModule.el('customerMobile');
  if (mobEl) {
    mobEl.addEventListener('input', function() {
      this.value = this.value.replace(/\D/g, '').slice(0, 10);
      CustomerModule.checkAutoSave();
    });
  }

  // Customer auto-fill
  const nameEl = CustomerModule.el('customerName');
  if (nameEl) {
    nameEl.addEventListener('input', () => {
      CustomerModule.onNameSelect();
      CustomerModule.checkAutoSave();
    });
  }

  // Populate list on load
  CustomerModule.populateCustomers();
});

/* ── Expose ──────────────────────────────────────────────── */
window.CustomerModule = CustomerModule;
window.escHtml = escHtml;
