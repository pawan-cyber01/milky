/* ============================================================
   MILKY — export.js
   Export: PDF (jsPDF+html2canvas), Excel (SheetJS), CSV, Print
   ============================================================ */

'use strict';

const ExportModule = {

  /* ── PDF Export ───────────────────────────────────────── */
  async exportPDF(inputRecords = null) {
    const records = inputRecords || ReportsModule.currentRecords;
    if (!records || !records.length) { showToast('⚠️ No records to export', 'error'); return; }

    showToast('⏳ Generating PDF...', 'info', 5000);

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const s   = Store.getSettings();
      const company = s.companyName || 'MILKY';
      const pageW = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(14, 165, 233);
      doc.rect(0, 0, pageW, 22, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(company + ' DAIRY', pageW / 2, 10, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Collection Report  |  Generated: ' + new Date().toLocaleString('en-IN'), pageW / 2, 17, { align: 'center' });

      // Stats row
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9);
      let yPos = 30;
      const totQty = records.reduce((s, r) => s + parseFloat(r.qty    || 0), 0);
      const totAmt = records.reduce((s, r) => s + parseFloat(r.totalAmt || 0), 0);
      const avgFat = records.length ? records.reduce((s, r) => s + parseFloat(r.fat || 0), 0) / records.length : 0;

      const stats = [
        ['Total Records', records.length],
        ['Total Qty', totQty.toFixed(2) + ' Kg'],
        ['Total Amount', '₹' + totAmt.toFixed(2)],
        ['Avg Fat %', avgFat.toFixed(2) + '%']
      ];

      const sw = pageW / stats.length;
      stats.forEach(([label, val], i) => {
        doc.setFillColor(240, 249, 255);
        doc.roundedRect(5 + i * sw, yPos - 5, sw - 6, 16, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(2, 132, 199);
        doc.text(String(val), 10 + i * sw + (sw - 12) / 2, yPos + 4, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(label, 10 + i * sw + (sw - 12) / 2, yPos + 9, { align: 'center' });
      });

      // Table
      yPos += 22;

      const headers = ['#', 'Date', 'Customer', 'Mobile', 'Qty (Kg)', 'Fat%', 'CLR', 'SNF%', 'Fat Kg', 'SNF Kg', 'Rate', 'Amount'];
      const colW    = [8, 20, 30, 25, 20, 14, 14, 14, 15, 15, 15, 20];
      const startX  = 5;

      // Table header
      doc.setFillColor(14, 165, 233);
      doc.rect(startX, yPos, pageW - 10, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      let xPos = startX + 1;
      headers.forEach((h, i) => {
        doc.text(h, xPos, yPos + 5);
        xPos += colW[i];
      });
      yPos += 7;

      // Rows
      records.forEach((r, idx) => {
        if (yPos > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          yPos = 10;
        }

        const isEven = idx % 2 === 0;
        if (isEven) {
          doc.setFillColor(240, 249, 255);
          doc.rect(startX, yPos, pageW - 10, 6, 'F');
        }

        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'normal');
        xPos = startX + 1;

        const row = [
          idx + 1, fmtDate(r.date), r.name, r.mobile,
          r.qty, r.fat + '%', r.clr, r.snf + '%', r.fatKg, r.snfKg,
          '₹' + r.avgRate, '₹' + r.totalAmt
        ];

        row.forEach((val, i) => {
          const text = String(val);
          if (i === 11) {
            doc.setTextColor(16, 185, 129);
            doc.setFont('helvetica', 'bold');
          }
          doc.text(text.slice(0, colW[i] / 1.8), xPos, yPos + 4);
          doc.setTextColor(30, 41, 59);
          doc.setFont('helvetica', 'normal');
          xPos += colW[i];
        });

        yPos += 6;
      });

      // Footer
      doc.setFillColor(248, 250, 252);
      doc.rect(startX, yPos, pageW - 10, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(2, 132, 199);
      doc.text('TOTAL / AVG', startX + 1, yPos + 5);
      doc.text(totQty.toFixed(2), startX + colW.slice(0, 4).reduce((a, b) => a + b, 0) + 1, yPos + 5);
      doc.text('₹' + totAmt.toFixed(2), startX + colW.slice(0, 11).reduce((a, b) => a + b, 0) + 1, yPos + 5);

      yPos += 18;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(s.footerText || '© 2025 MILKY Dairy', pageW / 2, yPos, { align: 'center' });

      doc.save('MILKY_Report_' + todayISO() + '.pdf');
      showToast('✅ PDF exported!', 'success');
    } catch(e) {
      console.error('PDF export error:', e);
      showToast('❌ PDF export failed. Check console.', 'error');
    }
  },

  /* ── Excel Export ─────────────────────────────────────── */
  exportExcel(inputRecords = null) {
    const records = inputRecords || ReportsModule.currentRecords;
    if (!records || !records.length) { showToast('⚠️ No records to export', 'error'); return; }

    try {
      const s = Store.getSettings();
      const wb = XLSX.utils.book_new();

      // Map to flat objects
      const data = records.map((r, i) => ({
        '#'         : i + 1,
        'Date'      : fmtDate(r.date),
        'Customer'    : r.name,
        'Mobile'    : r.mobile,
        'Qty (Kg)'  : r.qty,
        'Fat %'     : r.fat,
        'CLR'       : r.clr,
        'SNF %'     : r.snf,
        'Fat Kg'    : r.fatKg,
        'SNF Kg'    : r.snfKg,
        'Avg Rate'  : r.avgRate,
        'Amount (₹)': r.totalAmt
      }));

      // Totals row
      data.push({
        '#'         : '',
        'Date'      : 'TOTAL',
        'Customer'    : '',
        'Mobile'    : '',
        'Qty (Kg)'  : records.reduce((s, r) => s + parseFloat(r.qty || 0), 0).toFixed(2),
        'Fat %'     : (records.reduce((s, r) => s + parseFloat(r.fat || 0), 0) / records.length).toFixed(2),
        'CLR'       : (records.reduce((s, r) => s + parseFloat(r.clr || 0), 0) / records.length).toFixed(1),
        'SNF %'     : (records.reduce((s, r) => s + parseFloat(r.snf || 0), 0) / records.length).toFixed(2),
        'Fat Kg'    : records.reduce((s, r) => s + parseFloat(r.fatKg || 0), 0).toFixed(3),
        'SNF Kg'    : records.reduce((s, r) => s + parseFloat(r.snfKg || 0), 0).toFixed(3),
        'Avg Rate'  : '',
        'Amount (₹)': records.reduce((s, r) => s + parseFloat(r.totalAmt || 0), 0).toFixed(2)
      });

      const ws = XLSX.utils.json_to_sheet(data);

      // Column widths
      ws['!cols'] = [5, 12, 20, 15, 10, 8, 8, 8, 10, 10, 10, 12].map(w => ({ wch: w }));

      XLSX.utils.book_append_sheet(wb, ws, 'Collection Report');

      // Summary sheet
      const summary = [
        ['MILKY Dairy — Report Summary'],
        ['Company', s.companyName || 'MILKY'],
        ['Generated On', new Date().toLocaleString('en-IN')],
        [],
        ['Total Records', records.length],
        ['Total Qty (Kg)', records.reduce((s, r) => s + parseFloat(r.qty || 0), 0).toFixed(2)],
        ['Total Amount', '₹' + records.reduce((s, r) => s + parseFloat(r.totalAmt || 0), 0).toFixed(2)],
        ['Avg Fat %', (records.reduce((s, r) => s + parseFloat(r.fat || 0), 0) / records.length).toFixed(2) + '%'],
        ['Avg CLR', (records.reduce((s, r) => s + parseFloat(r.clr || 0), 0) / records.length).toFixed(1)],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summary);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      XLSX.writeFile(wb, 'MILKY_Report_' + todayISO() + '.xlsx');
      showToast('✅ Excel exported!', 'success');
    } catch(e) {
      console.error('Excel export error:', e);
      showToast('❌ Excel export failed', 'error');
    }
  },

  /* ── CSV Export ───────────────────────────────────────── */
  exportCSV() {
    const records = ReportsModule.currentRecords;
    if (!records.length) { showToast('⚠️ Generate a report first', 'error'); return; }

    const headers = ['#', 'Date', 'Customer', 'Mobile', 'Village', 'Qty(Kg)', 'Fat%', 'CLR', 'SNF%', 'FatKg', 'SNFKg', 'AvgRate', 'Amount'];
    const rows = records.map((r, i) => [
      i + 1, fmtDate(r.date), `"${r.name}"`, r.mobile, `"${r.village || ''}"`,
      r.qty, r.fat, r.clr, r.snf, r.fatKg, r.snfKg, r.avgRate, r.totalAmt
    ]);

    // Totals row
    const totQty = records.reduce((s, r) => s + parseFloat(r.qty || 0), 0);
    const totAmt = records.reduce((s, r) => s + parseFloat(r.totalAmt || 0), 0);
    rows.push(['TOTAL', '', '', '', '', totQty.toFixed(2), '', '', '', '', '', '', totAmt.toFixed(2)]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'MILKY_Report_' + todayISO() + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('✅ CSV exported!', 'success');
  },

  /* ── Print ────────────────────────────────────────────── */
  printReport() {
    const records = ReportsModule.currentRecords;
    if (!records.length) { showToast('⚠️ Generate a report first', 'error'); return; }
    window.print();
  }
};

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('exportPDF').addEventListener('click',   () => ExportModule.exportPDF());
  document.getElementById('exportExcel').addEventListener('click', () => ExportModule.exportExcel());
  document.getElementById('exportCSV').addEventListener('click',   () => ExportModule.exportCSV());
  document.getElementById('exportPrint').addEventListener('click', () => ExportModule.printReport());
});

window.ExportModule = ExportModule;
