/* ============================================================
   MILKY — charts.js
   Dashboard Charts using Chart.js
   ============================================================ */

'use strict';

const ChartsModule = {
  instances: {},

  /* Render all 3 dashboard charts */
  renderAll(records) {
    const days = ChartsModule.getLast7Days();
    ChartsModule.renderCollection(records, days);
    ChartsModule.renderAmount(records, days);
    ChartsModule.renderFat(records, days);
  },

  /* Get last 7 days as ISO date strings */
  getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  },

  /* Short label for a date (e.g. "Mon 10") */
  shortLabel(iso) {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
  },

  /* Aggregate records for a given day */
  dayAgg(records, date) {
    const dayRecs = records.filter(r => dateKey(r.date) === date);
    return {
      qty : dayRecs.reduce((s, r) => s + parseFloat(r.qty    || 0), 0),
      amt : dayRecs.reduce((s, r) => s + parseFloat(r.totalAmt || 0), 0),
      fat : dayRecs.length
              ? dayRecs.reduce((s, r) => s + parseFloat(r.fat || 0), 0) / dayRecs.length
              : 0
    };
  },

  /* Destroy old chart instance before creating new one */
  destroy(key) {
    if (ChartsModule.instances[key]) {
      ChartsModule.instances[key].destroy();
      delete ChartsModule.instances[key];
    }
  },

  /* Collection trend */
  renderCollection(records, days) {
    ChartsModule.destroy('collection');
    const ctx = document.getElementById('chartCollection');
    if (!ctx) return;

    const labels = days.map(d => ChartsModule.shortLabel(d));
    const data   = days.map(d => parseFloat(ChartsModule.dayAgg(records, d).qty.toFixed(2)));

    ChartsModule.instances['collection'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label     : 'Qty (Kg)',
          data,
          borderColor    : '#0ea5e9',
          backgroundColor: 'rgba(14,165,233,0.12)',
          borderWidth    : 2.5,
          pointBackgroundColor: '#0ea5e9',
          pointRadius    : 5,
          pointHoverRadius: 7,
          fill           : true,
          tension        : 0.4
        }]
      },
      options: ChartsModule.lineOptions('Qty (Kg)')
    });
  },

  /* Amount trend */
  renderAmount(records, days) {
    ChartsModule.destroy('amount');
    const ctx = document.getElementById('chartAmount');
    if (!ctx) return;

    const labels = days.map(d => ChartsModule.shortLabel(d));
    const data   = days.map(d => parseFloat(ChartsModule.dayAgg(records, d).amt.toFixed(2)));

    ChartsModule.instances['amount'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label          : 'Amount (₹)',
          data,
          backgroundColor: days.map((_, i) => i === 6
            ? 'rgba(14,165,233,0.85)'
            : 'rgba(14,165,233,0.45)'),
          borderRadius   : 6,
          borderSkipped  : false
        }]
      },
      options: ChartsModule.barOptions('Amount (₹)', '₹')
    });
  },

  /* Fat trend */
  renderFat(records, days) {
    ChartsModule.destroy('fat');
    const ctx = document.getElementById('chartFat');
    if (!ctx) return;

    const labels = days.map(d => ChartsModule.shortLabel(d));
    const data   = days.map(d => parseFloat(ChartsModule.dayAgg(records, d).fat.toFixed(2)));

    ChartsModule.instances['fat'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label          : 'Avg Fat %',
          data,
          borderColor    : '#06b6d4',
          backgroundColor: 'rgba(6,182,212,0.12)',
          borderWidth    : 2.5,
          pointBackgroundColor: '#06b6d4',
          pointRadius    : 5,
          pointHoverRadius: 7,
          fill           : true,
          tension        : 0.4
        }]
      },
      options: ChartsModule.lineOptions('Fat %')
    });
  },

  /* Shared line chart options */
  lineOptions(label) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
    const textColor = isDark ? '#94b8d4' : '#64748b';

    return {
      responsive  : true,
      maintainAspectRatio: false,
      interaction : { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#162d45' : '#0f172a',
          padding: 10,
          cornerRadius: 8
        }
      },
      scales: {
        x: {
          grid  : { color: gridColor },
          ticks : { color: textColor, font: { size: 11 } }
        },
        y: {
          grid  : { color: gridColor },
          ticks : { color: textColor, font: { size: 11 }, beginAtZero: true }
        }
      }
    };
  },

  /* Shared bar chart options */
  barOptions(label, prefix = '') {
    const base = ChartsModule.lineOptions(label);
    base.plugins.tooltip = {
      ...base.plugins.tooltip,
      callbacks: {
        label: ctx => ` ${prefix}${ctx.parsed.y}`
      }
    };
    return base;
  }
};

window.ChartsModule = ChartsModule;
