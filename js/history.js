/* ============================================================
   MILKY — history.js
   History: render table, search, sort, edit, delete
   ============================================================ */

'use strict';

const HistoryModule = {

  currentRecords: [],
  pendingWhatsAppRecordId: null,

  /* Main render function */
  render() {
    let records = Store.getRecords();
    const query = (document.getElementById('historySearch').value || '').toLowerCase();
    const sort  = document.getElementById('historySortBy').value;

    // Search filter
    if (query) {
      records = records.filter(r =>
        (r.name    || '').toLowerCase().includes(query) ||
        (r.mobile  || '').includes(query) ||
        (r.village || '').toLowerCase().includes(query) ||
        (r.date    || '').includes(query)
      );
    }

    // Sort
    records = HistoryModule.sortRecords(records, sort);
    HistoryModule.currentRecords = records;

    // Render table
    HistoryModule.renderTable(records);

    // Render totals
    HistoryModule.renderTotals(records);
  },

  /* Sort helper */
  sortRecords(records, sortKey) {
    return [...records].sort((a, b) => {
      switch(sortKey) {
        case 'date-desc':   return (b.date || '') > (a.date || '') ? 1 : -1;
        case 'date-asc':    return (a.date || '') > (b.date || '') ? 1 : -1;
        case 'amount-desc': return parseFloat(b.totalAmt || 0) - parseFloat(a.totalAmt || 0);
        case 'amount-asc':  return parseFloat(a.totalAmt || 0) - parseFloat(b.totalAmt || 0);
        case 'name-asc':    return (a.name || '').localeCompare(b.name || '');
        default:            return 0;
      }
    });
  },

  /* Render table body */
  renderTable(records) {
    const tbody = document.getElementById('historyBody');

    if (!records.length) {
      tbody.innerHTML = '<tr><td colspan="14" class="empty-row">📭 No records found</td></tr>';
      return;
    }

    tbody.innerHTML = records.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><span class="date-badge">${fmtDate(r.date)}</span></td>
        <td><strong>${escHtml(r.name)}</strong></td>
        <td>${escHtml(r.mobile)}</td>
        <td>${r.qty} Kg</td>
        <td>${r.fat}%</td>
        <td>${r.clr}</td>
        <td>${r.snf}%</td>
        <td>${r.fatKg}</td>
        <td>${r.snfKg}</td>
        <td>₹${r.avgRate}</td>
        <td><strong style="color:var(--success)">₹${r.totalAmt}</strong></td>
        <td>
          <button class="action-btn action-edit" onclick="HistoryModule.openEdit('${r.id}')" title="Edit">✏️</button>
          <button class="action-btn action-wa"   onclick="HistoryModule.sendWA('${r.id}')"   title="WhatsApp">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </button>
          <button class="action-btn action-del" onclick="HistoryModule.deleteRecord('${r.id}')" title="Delete">🗑</button>
        </td>
      </tr>
    `).join('');
  },

  /* Render totals bar */
  renderTotals(records) {
    const totQty    = records.reduce((s, r) => s + parseFloat(r.qty    || 0), 0);
    const totFatKg  = records.reduce((s, r) => s + parseFloat(r.fatKg  || 0), 0);
    const totSNFKg  = records.reduce((s, r) => s + parseFloat(r.snfKg  || 0), 0);
    const totAmount = records.reduce((s, r) => s + parseFloat(r.totalAmt || 0), 0);

    setText('totRecords', records.length);
    setText('totQty',     totQty.toFixed(2));
    setText('totFatKg',   totFatKg.toFixed(3));
    setText('totSNFKg',   totSNFKg.toFixed(3));
    setText('totAmount',  '₹' + totAmount.toFixed(2));
  },

  /* Open edit modal */
  openEdit(id) {
    const r = Store.getRecords().find(r => r.id === id);
    if (!r) return;

    document.getElementById('editId').value      = r.id;
    document.getElementById('editName').value    = r.name    || '';
    document.getElementById('editMobile').value  = r.mobile  || '';
    document.getElementById('editVillage').value = r.village || '';
    document.getElementById('editQty').value     = r.qty     || '';
    document.getElementById('editFat').value     = r.fat     || '';
    document.getElementById('editCLR').value     = r.clr     || '';
    document.getElementById('editDate').value    = r.date    || '';

    document.getElementById('editModal').style.display = 'flex';
  },

  /* Save edited record */
  saveEdit() {
    const id = document.getElementById('editId').value;
    const qty = parseFloat(document.getElementById('editQty').value);
    const fat = parseFloat(document.getElementById('editFat').value);
    const clr = parseFloat(document.getElementById('editCLR').value);

    if (!id) return;
    if (isNaN(qty) || isNaN(fat) || isNaN(clr)) {
      showToast('⚠️ Please fill all required fields', 'error');
      return;
    }

    // Recalculate derived values
    const recalc = Calculator.calculate(qty, fat, clr);

    const updates = {
      name    : document.getElementById('editName').value.trim(),
      mobile  : document.getElementById('editMobile').value.trim(),
      village : document.getElementById('editVillage').value.trim(),
      date    : document.getElementById('editDate').value,
      qty     : recalc.qty,
      fat     : recalc.fat,
      clr     : recalc.clr,
      snf     : recalc.snf,
      fatKg   : recalc.fatKg,
      snfKg   : recalc.snfKg,
      avgRate : recalc.avgRate,
      totalAmt: recalc.totalAmt
    };

    Store.updateRecord(id, updates);
    HistoryModule.closeEdit();
    HistoryModule.render();
    showToast('✅ Record updated!', 'success');
  },

  /* Close edit modal */
  closeEdit() {
    document.getElementById('editModal').style.display = 'none';
  },

  /* Delete single record */
  deleteRecord(id) {
    showConfirm(
      'Delete Record?',
      'This record will be permanently deleted.',
      () => {
        Store.deleteRecord(id);
        HistoryModule.render();
        showToast('🗑 Record deleted', 'info');
      }
    );
  },

  /* Delete all records */
  deleteAll() {
    showConfirm(
      'Delete ALL Records?',
      'This will permanently delete all collection records. This cannot be undone!',
      () => {
        Store.deleteAllRecords();
        HistoryModule.render();
        showToast('🗑 All records deleted', 'info');
      }
    );
  },

  /* Send WhatsApp from history */
  sendWA(id) {
    const r = Store.getRecords().find(r => r.id === id);
    if (!r) return;

    HistoryModule.pendingWhatsAppRecordId = id;
    const overlay = document.getElementById('waModalOverlay');
    const nameEl = document.getElementById('waCustomerName');
    const mobEl = document.getElementById('waCustomerMobile');

    if (nameEl) nameEl.value = r.name === 'Customer Pending' ? '' : (r.name || '');
    if (mobEl) mobEl.value = (r.mobile || '').replace(/\D/g, '').slice(0, 10);
    if (overlay) {
      overlay.dataset.mode = 'history';
      overlay.style.display = 'flex';
    }
  },

  sendPendingWA() {
    const id = HistoryModule.pendingWhatsAppRecordId;
    const r = Store.getRecords().find(r => r.id === id);
    if (!r) return;

    const name = (document.getElementById('waCustomerName').value || '').trim() || r.name || '—';
    const mobile = (document.getElementById('waCustomerMobile').value || '').replace(/\D/g, '').slice(0, 10);
    if (mobile.length !== 10) {
      showToast('⚠️ Enter a valid 10-digit mobile number', 'warning');
      return;
    }

    const res = {
      qty: r.qty, fat: r.fat, clr: r.clr, snf: r.snf,
      fatKg: r.fatKg, snfKg: r.snfKg, avgRate: r.avgRate, totalAmt: r.totalAmt,
      date: r.date
    };
    const msg = generateReceiptText(name, mobile, res);
    window.open('https://wa.me/91' + mobile + '?text=' + encodeURIComponent(msg), '_blank');

    const overlay = document.getElementById('waModalOverlay');
    if (overlay) {
      overlay.style.display = 'none';
      delete overlay.dataset.mode;
    }
    HistoryModule.pendingWhatsAppRecordId = null;
  }
};

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Search
  document.getElementById('historySearch').addEventListener('input', () => HistoryModule.render());

  // Sort
  document.getElementById('historySortBy').addEventListener('change', () => HistoryModule.render());

  // Export buttons
  const exportPDF = document.getElementById('histExportPDF');
  const exportExcel = document.getElementById('histExportExcel');
  if (exportPDF) exportPDF.addEventListener('click', () => {
    if (window.ExportModule) window.ExportModule.exportPDF(HistoryModule.currentRecords);
  });
  if (exportExcel) exportExcel.addEventListener('click', () => {
    if (window.ExportModule) window.ExportModule.exportExcel(HistoryModule.currentRecords);
  });

  // Delete All
  document.getElementById('deleteAllBtn').addEventListener('click', () => HistoryModule.deleteAll());

  // Edit modal save/close
  document.getElementById('saveEditBtn').addEventListener('click',    () => HistoryModule.saveEdit());
  document.getElementById('editModalClose').addEventListener('click',  () => HistoryModule.closeEdit());
  document.getElementById('editModalClose2').addEventListener('click', () => HistoryModule.closeEdit());

  // Close modal on overlay click
  document.getElementById('editModal').addEventListener('click', e => {
    if (e.target === document.getElementById('editModal')) HistoryModule.closeEdit();
  });

  const waSendBtn = document.getElementById('waSendBtn');
  if (waSendBtn) {
    waSendBtn.addEventListener('click', () => {
      const overlay = document.getElementById('waModalOverlay');
      if (overlay && overlay.dataset.mode === 'history') HistoryModule.sendPendingWA();
    });
  }
});

/* ── CSS for date badge ─────────────────────────────────── */
(function() {
  const style = document.createElement('style');
  style.textContent = `
    .date-badge {
      display: inline-block;
      padding: 2px 8px;
      background: var(--bg2);
      border-radius: 99px;
      font-size: 0.75rem;
      color: var(--primary-dark);
      font-weight: 600;
      white-space: nowrap;
    }
  `;
  document.head.appendChild(style);
})();

window.HistoryModule = HistoryModule;
