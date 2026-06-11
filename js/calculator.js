/* ============================================================
   MILKY — calculator.js
   Corrected Calculation Engine & Refactored UI Bindings
   ============================================================ */

'use strict';

/* ── Exact MRG APK Rounding Engine ──────────────────────── */
// The original Android app uses a highly specific rounding algorithm:
// Math.round((value - 0.004) * 100)
function mrgRound(value) {
    return Math.round((value - 0.004) * 100.0);
}

/**
 * Calculate all milk parameters strictly based on exact math.
 * @param {number} qty    - Quantity in Kg
 * @param {number} fat    - Fat percentage
 * @param {number} clr    - CLR value
 * @param {number} rateOverride - Manual base rate
 * @returns {object} Calculation results
 */
const Calculator = {
  calculate(qty, fat, clr, rateOverride) {
    
    // Default fallback if no rate provided
    if (!rateOverride || rateOverride <= 0) {
        const snf = (clr / 4) + (0.21 * fat) + 0.10;
        const avgRate = (fat * 8) + (snf * 4);
        return {
            qty, fat, clr, 
            snf: Number(snf.toFixed(2)),
            fatKg: Number(((qty * fat)/100).toFixed(3)),
            snfKg: Number(((qty * snf)/100).toFixed(3)),
            fatRate: 8.0, snfRate: 4.0,
            avgRate: Number(avgRate.toFixed(2)),
            totalAmt: Number((qty * avgRate).toFixed(2)),
            date: typeof todayISO === 'function' ? todayISO() : new Date().toISOString().split('T')[0]
        };
    }

    // ========================================================
    // Exact MRG MILKY Java Decompiled Logic
    // ========================================================
    const d = qty;
    const d2 = fat;
    const d3 = clr;
    const d4 = rateOverride;

    // 1. SNF Calculation
    // Java: Math.round((((((d3 * 25.0) + 14.0) + ((2.0 * d2) * 10.0)) / 100.0) - 0.004) * 100.0)
    const snfVal = (((d3 * 25.0) + 14.0) + ((2.0 * d2) * 10.0)) / 100.0;
    const dRound = mrgRound(snfVal);
    const finalSnf = dRound / 100.0;

    // 2. SNF Kg Calculation
    // Java: Math.round((((dRound * d) / 10000.0) - 0.004) * 100.0)
    const dRound2 = mrgRound((dRound * d) / 10000.0);
    const finalSnfKg = dRound2 / 100.0;

    // 3. Fat Kg Calculation
    // Java: Math.round((((d2 * d) / 100.0) - 0.004) * 100.0)
    const dRound3 = mrgRound((d2 * d) / 100.0);
    const finalFatKg = dRound3 / 100.0;

    // 4. Rate Factors
    // Fat Factor = Java: Math.round((((6.0 * d4) / 65.0) - 0.004) * 100.0)
    const dRound4 = mrgRound((6.0 * d4) / 65.0);
    
    // SNF Factor = Java: Math.round((((d4 * 4.0) / 85.0) - 0.004) * 100.0)
    const dRound5 = mrgRound((d4 * 4.0) / 85.0);

    // 5. Exact Amount Calculation
    // Java: ((dRound4 * dRound3) / 10000.0) + ((dRound5 * dRound2) / 10000.0)
    const amount = ((dRound4 * dRound3) / 10000.0) + ((dRound5 * dRound2) / 10000.0);

    // 6. Average Rate (Derived from amount)
    const avgRate = amount / d;

    // For the UI, we still calculate the human-readable 'Fat Rate' and 'SNF Rate'
    const displayFatRate = rateOverride / MILKY_CONFIG.FAT_RATE_DIVISOR;
    const displaySnfRate = (avgRate - (fat * displayFatRate)) / finalSnf;

    console.table({
      qty, fat, clr, 
      snf: finalSnf,
      fatRate: displayFatRate,
      snfRate: displaySnfRate,
      avgRate,
      amount
    });

    return {
      qty: Number(qty.toFixed(3)),
      fat: Number(fat.toFixed(2)),
      clr: Number(clr.toFixed(2)),
      snf: finalSnf,
      fatKg: finalFatKg,
      snfKg: finalSnfKg,
      fatRate: Number(displayFatRate.toFixed(2)),
      snfRate: Number(displaySnfRate.toFixed(2)),
      avgRate: Number(avgRate.toFixed(2)), 
      totalAmt: Number(amount.toFixed(2)),
      date: typeof todayISO === 'function' ? todayISO() : new Date().toISOString().split('T')[0]
    };
  }
};

/* ── UI Bindings ─────────────────────────────────────────── */
let lastCalcResult = null;

function renderResult(res) {
  document.getElementById('resultEmpty').style.display = 'none';
  document.getElementById('resultBody').style.display  = 'block';

  const divider = document.getElementById('calcDivider');
  if (divider) divider.style.display = 'block';

  // Format date correctly using global fmtDate
  document.getElementById('resultDate').textContent = typeof fmtDate === 'function' ? fmtDate(res.date) : res.date;

  // 8. Verify UI values exactly match calculation values
  if (typeof setText === 'function') {
      setText('resSNF', res.snf.toFixed(2) + ' %');
      setText('resFatKg', res.fatKg.toFixed(2) + ' Kg');
      setText('resSNFKg', res.snfKg.toFixed(2) + ' Kg');
      setText('resAvgRate', '₹ ' + res.avgRate.toFixed(2) + ' /Kg');
      setText('resTotalAmt', '₹ ' + res.totalAmt.toFixed(2));
  } else {
      document.getElementById('resSNF').textContent = res.snf.toFixed(2) + ' %';
      document.getElementById('resFatKg').textContent = res.fatKg.toFixed(2) + ' Kg';
      document.getElementById('resSNFKg').textContent = res.snfKg.toFixed(2) + ' Kg';
      document.getElementById('resAvgRate').textContent = '₹ ' + res.avgRate.toFixed(2) + ' /Kg';
      document.getElementById('resTotalAmt').textContent = '₹ ' + res.totalAmt.toFixed(2);
  }

  const rateFatDisplay = document.getElementById('rateFatDisplay');
  const rateFatSpan    = document.getElementById('rateFatSpan');
  if (rateFatDisplay && rateFatSpan) {
    if (res.fatRate > 0) {
      rateFatDisplay.style.display = 'block';
      rateFatSpan.textContent = res.fatRate.toFixed(2);
    } else {
      rateFatDisplay.style.display = 'none';
    }
  }

  const calcSaveBtn = document.getElementById('calcSaveBtn');
  if (calcSaveBtn) calcSaveBtn.disabled = false;
}

function prefillCustomerPage(res) {
  if (typeof setText !== 'function') return;
  setText('fDate',    typeof fmtDate === 'function' ? fmtDate(res.date) : res.date);
  setText('fQty',     Number(res.qty).toFixed(3) + ' Kg');
  setText('fFat',     Number(res.fat).toFixed(2) + ' %');
  setText('fCLR',     Number(res.clr).toFixed(2));
  setText('fSNF',     Number(res.snf).toFixed(2) + ' %');
  setText('fFatKg',   Number(res.fatKg).toFixed(2) + ' Kg');
  setText('fSNFKg',   Number(res.snfKg).toFixed(2) + ' Kg');
  setText('fAvgRate', '₹ ' + Number(res.avgRate).toFixed(2));
  setText('fTotalAmt','₹ ' + Number(res.totalAmt).toFixed(2));
}

function clearResult() {
  document.getElementById('resultEmpty').style.display = 'flex';
  document.getElementById('resultBody').style.display  = 'none';

  const divider = document.getElementById('calcDivider');
  if (divider) divider.style.display = 'none';

  const calcSaveBtn = document.getElementById('calcSaveBtn');
  if (calcSaveBtn) calcSaveBtn.disabled = true;
  lastCalcResult = null;
  
  // Clear Customer Entry pre-filled fields
  if (typeof setText === 'function') {
    ['fDate','fQty','fFat','fCLR','fSNF','fFatKg','fSNFKg','fAvgRate','fTotalAmt'].forEach(id => setText(id, '—'));
  }
}

function showToast(msg, type = 'info', ms = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) { console.log(msg); return; }
  toast.textContent = msg;
  toast.className = 'toast show ' + type;
  setTimeout(() => { toast.className = 'toast'; }, ms);
}

function saveCalculationToHistory(calc) {
  if (!calc || typeof Store === 'undefined') return null;

  const nameEl = document.getElementById('customerName');
  const mobEl = document.getElementById('customerMobile');
  const name = nameEl ? nameEl.value.trim() : '';
  const mobile = mobEl ? mobEl.value.trim() : '';

  const saved = Store.addRecord({
    name     : name || 'Customer Pending',
    mobile   : mobile,
    date     : calc.date,
    qty      : calc.qty,
    fat      : calc.fat,
    clr      : calc.clr,
    snf      : calc.snf,
    fatKg    : calc.fatKg,
    snfKg    : calc.snfKg,
    avgRate  : calc.avgRate,
    totalAmt : calc.totalAmt
  });

  window.currentAutoSaveId = saved.id;
  window.hasSavedCurrentCalc = true;
  return saved;
}

function doCalculate() {
  const qty = parseFloat(document.getElementById('calcQty').value);
  const fat = parseFloat(document.getElementById('calcFat').value);
  const clr = parseFloat(document.getElementById('calcCLR').value);
  const rateInput = document.getElementById('calcRate').value;
  const rateOverride = rateInput !== '' ? parseFloat(rateInput) : null;

  if (isNaN(qty) || qty <= 0) { showToast('⚠️ Enter a valid Quantity', 'error'); return; }
  if (isNaN(fat) || fat <= 0) { showToast('⚠️ Enter a valid Fat %', 'error'); return; }
  if (isNaN(clr) || clr <= 0) { showToast('⚠️ Enter a valid CLR value', 'error'); return; }

  try {
    lastCalcResult = Calculator.calculate(qty, fat, clr, rateOverride);
    window.hasSavedCurrentCalc = false;
    window.currentAutoSaveId = null;
    renderResult(lastCalcResult);
    saveCalculationToHistory(lastCalcResult);
    
    // Pre-fill logic safe check
    if (typeof window.prefillCustomerPage === 'function') {
        window.prefillCustomerPage(lastCalcResult);
    }
    showToast('✅ Calculation saved to history!', 'success');
    
    // Auto-save immediately if customer details are already filled!
    if (typeof window.CustomerModule !== 'undefined') {
      window.CustomerModule.checkAutoSave();
    }
  } catch (err) {
    console.error(err);
    showToast('❌ ' + err.message, 'error', 5000);
    clearResult();
  }
}

function doReset() {
  ['calcQty','calcFat','calcCLR','calcRate'].forEach(id => {
    document.getElementById(id).value = '';
  });
  clearResult();
  showToast('↺ Reset done', 'info');
}

function doSaveFromCalc() {
  if (!lastCalcResult) { showToast('⚠️ Calculate first', 'error'); return; }
  if (typeof window.navigate === 'function') {
      window.navigate('Customer');
    } else {
      showToast('👨‍🌾 Add customer details to save', 'info');
    }
}

function calculateAvgRate(qty, fat, clr, rateOverride) {
  return Calculator.calculate(qty, fat, clr, rateOverride).avgRate;
}

function sendWaMsg() {
  if (!lastCalcResult) {
    showToast('⚠️ Please calculate first', 'warning');
    return;
  }
  
  // Open WA Modal
  const overlay = document.getElementById('waModalOverlay');
  if (overlay) {
    overlay.dataset.mode = 'calculator';
    overlay.style.display = 'flex';
  }
  
  const nameEl = document.getElementById('waCustomerName');
  const mobEl = document.getElementById('waCustomerMobile');
  if (nameEl) nameEl.value = '';
  if (mobEl) mobEl.value = '';
}

// Bind WhatsApp modal events once
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('waModalOverlay');
  const closeBtn = document.getElementById('waModalClose');
  const cancelBtn = document.getElementById('waModalCancel');
  const sendBtn = document.getElementById('waSendBtn');
  const mobileInput = document.getElementById('waCustomerMobile');

  const closeModal = () => {
    if (overlay) {
      overlay.style.display = 'none';
      delete overlay.dataset.mode;
    }
  };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  
  if (mobileInput) {
    mobileInput.addEventListener('input', function() {
      this.value = this.value.replace(/\D/g, '').slice(0, 10);
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      if (overlay && overlay.dataset.mode === 'history') return;
      if (!lastCalcResult) return;
      const cName = document.getElementById('waCustomerName').value.trim() || '—';
      const cMobile = document.getElementById('waCustomerMobile').value.trim();
      
      if (typeof window.generateReceiptText === 'function') {
        const msg = window.generateReceiptText(cName, cMobile || '—', lastCalcResult);
        
        // If mobile is provided, use it. Otherwise just wa.me text to let user pick contact.
        let url = 'https://wa.me/';
        if (cMobile.length === 10) {
          url += '91' + cMobile;
        }
        url += '?text=' + encodeURIComponent(msg);
        
        window.open(url, '_blank');
        closeModal();
      }
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('calcBtn').addEventListener('click', doCalculate);
  document.getElementById('calcResetBtn').addEventListener('click', doReset);
  const saveBtn = document.getElementById('calcSaveBtn');
  if (saveBtn) saveBtn.addEventListener('click', doSaveFromCalc);
  
  const waBtn = document.getElementById('waMiniBtn');
  if (waBtn) waBtn.addEventListener('click', sendWaMsg);

  ['calcQty','calcFat','calcCLR','calcRate'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') doCalculate();
    });
  });

  const autoFillRate = () => {
    const fatVal = document.getElementById('calcFat').value;
    const clrVal = document.getElementById('calcCLR').value;
    if (fatVal && clrVal && typeof Store !== 'undefined') {
      const s = Store.getSettings();
      if (s.rateMaster && s.rateMaster.length > 0) {
        const match = s.rateMaster.find(r => r.fat == fatVal && r.clr == clrVal);
        if (match) {
          document.getElementById('calcRate').value = match.rate;
        }
      }
    }
  };

  document.getElementById('calcFat').addEventListener('input', autoFillRate);
  document.getElementById('calcCLR').addEventListener('input', autoFillRate);
});

window.Calculator    = Calculator;
window.getCalcResult = () => lastCalcResult;
window.calculateAvgRate = calculateAvgRate;
window.prefillCustomerPage = prefillCustomerPage;
window.clearResult = clearResult;
