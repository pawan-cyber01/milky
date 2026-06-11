/* ============================================================
   MILKY — whatsapp.js
   Generate formatted receipt text + open wa.me link
   ============================================================ */

'use strict';

/**
 * Get or prompt for WhatsApp Dairy Name.
 * @returns {string} The dairy name
 */
function getWADairyName() {
  const s = Store.getSettings();
  if (!s.waDairyName) {
    const name = prompt("Enter Dairy Name for WhatsApp Receipt:", "");
    if (name) {
      s.waDairyName = name.trim();
      Store.saveSettings(s);
    } else {
      return "MILKY"; // Fallback if user cancels
    }
  }
  return s.waDairyName;
}

/**
 * Generate a formatted receipt message.
 * @param {string} customerName
 * @param {string} mobile
 * @param {object} res  - { qty, fat, clr, snf, fatKg, snfKg, avgRate, totalAmt, date }
 * @returns {string} Formatted receipt text
 */
function generateReceiptText(customerName, mobile, res) {
  const company = getWADairyName();
  const date = fmtDate(res.date || todayISO());
  
  return (
`*${company.toUpperCase()} DAIRY*

Name: ${customerName || '—'}
Mobile: ${mobile || '—'}

Qty: ${res.qty} Kg
Fat: ${res.fat}
CLR: ${res.clr}

Amount: ₹${res.totalAmt}

Date: ${date}`
  );
}

/* ── Expose ──────────────────────────────────────────────── */
window.generateReceiptText = generateReceiptText;
window.getWADairyName = getWADairyName;
