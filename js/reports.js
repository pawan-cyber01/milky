/* ============================================================
   MILKY — reports.js
   Reports: Daily, Weekly, Monthly, Customer-wise
   ============================================================ */

'use strict';

const ReportsModule = {
  currentType     : 'daily',
  currentRecords  : [],

  /* Generate report based on current filter */
  generate() {
    const type       = ReportsModule.currentType;
    const dateInput  = document.getElementById('reportDate').value;
    const customerName = document.getElementById('reportCustomerName').value.trim().toLowerCase();
    let records      = Store.getRecords();
    let title        = '';

    const today    = todayISO();
    const thisWeek = getWeekRange();
    const thisMonth = today.slice(0, 7);

    switch(type) {
      case 'daily':
        const filterDate = dateInput || today;
        records = records.filter(r => dateKey(r.date) === filterDate);
        title = 'Daily Report — ' + fmtDate(filterDate);
        break;

      case 'weekly':
        const wStart = dateInput ? getWeekStart(dateInput) : thisWeek.start;
        const wEnd   = dateInput ? getWeekEnd(dateInput)   : thisWeek.end;
        records = records.filter(r => {
          const d = dateKey(r.date);
          return d >= wStart && d <= wEnd;
        });
        title = `Weekly Report — ${fmtDate(wStart)} to ${fmtDate(wEnd)}`;
        break;

      case 'monthly':
        const month = dateInput ? dateInput.slice(0, 7) : thisMonth;
        records = records.filter(r => dateKey(r.date).startsWith(month));
        const [my, mm] = month.split('-');
        title = `Monthly Report — ${getMonthName(parseInt(mm))} ${my}`;
        break;

      case 'customer':
        if (customerName) {
          records = records.filter(r =>
            (r.name || '').toLowerCase().includes(customerName)
          );
        }
        title = customerName ? `Customer Report — ${document.getElementById('reportCustomerName').value.trim()}` : 'All Customers Report';
        break;
    }

    ReportsModule.currentRecords = records;
    ReportsModule.renderStats(records);
    ReportsModule.renderTable(records, title);

    document.getElementById('reportOutput').style.display = 'block';
    showToast('📊 Report generated!', 'success');
  },

  /* Render summary stat cards */
  renderStats(records) {
    const totQty    = records.reduce((s, r) => s + parseFloat(r.qty    || 0), 0);
    const totAmt    = records.reduce((s, r) => s + parseFloat(r.totalAmt || 0), 0);
    const avgFat    = records.length ? records.reduce((s, r) => s + parseFloat(r.fat || 0), 0) / records.length : 0;
    const avgCLR    = records.length ? records.reduce((s, r) => s + parseFloat(r.clr || 0), 0) / records.length : 0;

    const statsEl = document.getElementById('reportStats');
    statsEl.innerHTML = `
      <div class="rstat-card">
        <div class="rstat-label">📦 Total Records</div>
        <div class="rstat-value">${records.length}</div>
      </div>
      <div class="rstat-card">
        <div class="rstat-label">🥛 Total Collection</div>
        <div class="rstat-value">${totQty.toFixed(2)} Kg</div>
      </div>
      <div class="rstat-card">
        <div class="rstat-label">💰 Total Amount</div>
        <div class="rstat-value">₹${totAmt.toFixed(2)}</div>
      </div>
      <div class="rstat-card">
        <div class="rstat-label">🧈 Avg Fat %</div>
        <div class="rstat-value">${avgFat.toFixed(2)}%</div>
      </div>
      <div class="rstat-card">
        <div class="rstat-label">🧪 Avg CLR</div>
        <div class="rstat-value">${avgCLR.toFixed(1)}</div>
      </div>
      <div class="rstat-card">
        <div class="rstat-label">👨‍🌾 Customers</div>
        <div class="rstat-value">${new Set(records.map(r => r.mobile || r.name)).size}</div>
      </div>
    `;
    // Make report stats 3-col
    statsEl.style.gridTemplateColumns = 'repeat(3, 1fr)';
  },

  /* Render report table */
  renderTable(records, title) {
    setText('reportTableTitle', title);

    const tbody = document.getElementById('reportBody');
    const tfoot = document.getElementById('reportFoot');

    if (!records.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="empty-row">📭 No records for this period</td></tr>';
      tfoot.innerHTML = '';
      return;
    }

    tbody.innerHTML = records.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><span class="date-badge">${fmtDate(r.date)}</span></td>
        <td><strong>${escHtml(r.name)}</strong></td>
        <td>${escHtml(r.mobile || '—')}</td>
        <td>${r.qty} Kg</td>
        <td>${r.fat}%</td>
        <td>${r.clr}</td>
        <td>${r.snf}%</td>
        <td><strong style="color:var(--success)">₹${r.totalAmt}</strong></td>
      </tr>
    `).join('');

    // Footer totals
    const totQty = records.reduce((s, r) => s + parseFloat(r.qty    || 0), 0);
    const totAmt = records.reduce((s, r) => s + parseFloat(r.totalAmt || 0), 0);
    const avgFat = records.reduce((s, r) => s + parseFloat(r.fat || 0), 0) / records.length;
    const avgCLR = records.reduce((s, r) => s + parseFloat(r.clr || 0), 0) / records.length;
    const avgSNF = records.reduce((s, r) => s + parseFloat(r.snf || 0), 0) / records.length;

    tfoot.innerHTML = `
      <tr>
        <td colspan="4"><strong>TOTALS / AVERAGES</strong></td>
        <td><strong>${totQty.toFixed(2)} Kg</strong></td>
        <td><strong>${avgFat.toFixed(2)}%</strong></td>
        <td><strong>${avgCLR.toFixed(1)}</strong></td>
        <td><strong>${avgSNF.toFixed(2)}%</strong></td>
        <td><strong style="color:var(--primary-dark)">₹${totAmt.toFixed(2)}</strong></td>
      </tr>
    `;
  }
};

/* ── Date Helpers ────────────────────────────────────────── */
function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: start.toISOString().split('T')[0],
    end  : end.toISOString().split('T')[0]
  };
}

function getWeekStart(dateStr) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
}

function getWeekEnd(dateStr) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - d.getDay() + 6);
  return d.toISOString().split('T')[0];
}

function getMonthName(m) {
  return ['', 'January','February','March','April','May','June',
               'July','August','September','October','November','December'][m] || '';
}

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      ReportsModule.currentType = btn.dataset.report;

      // Show/hide customer name input
      const customerInput = document.getElementById('reportCustomerInput');
      const dateInputs  = document.getElementById('reportDateInputs');
      if (btn.dataset.report === 'customer') {
        customerInput.style.display = 'block';
        dateInputs.style.display  = 'none';
      } else {
        customerInput.style.display = 'none';
        dateInputs.style.display  = 'block';
      }

      // Adjust date input type
      const dateEl = document.getElementById('reportDate');
      if (btn.dataset.report === 'monthly') {
        dateEl.type = 'month';
      } else if (btn.dataset.report === 'weekly') {
        dateEl.type = 'week';
      } else {
        dateEl.type = 'date';
      }
    });
  });

  // Set default date to today
  document.getElementById('reportDate').value = todayISO();

  // Generate button
  document.getElementById('generateReportBtn').addEventListener('click', () => ReportsModule.generate());
});

window.ReportsModule = ReportsModule;
window.getMonthName  = getMonthName;
