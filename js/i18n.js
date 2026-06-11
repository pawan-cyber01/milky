/* ============================================================
   MILKY — i18n.js
   Internationalization (Hindi/English) Support
   ============================================================ */

window.I18n = {
  lang: 'en',
  
  // Dictionary mapping English exact strings to Hindi
  dict: {
    "Dashboard": "डैशबोर्ड",
    "Calculator": "कैलकुलेटर",
    "Customer Entry": "ग्राहक प्रविष्टि",
    "History": "इतिहास",
    "Reports": "रिपोर्ट्स",
    "Settings": "सेटिंग्स",
    "Today's Overview —": "आज का अवलोकन —",
    "Today's Collection": "आज का संग्रह",
    "Today's Amount": "आज की राशि",
    "Total Customers": "कुल ग्राहक",
    "Monthly Collection": "मासिक संग्रह",
    "New Calculation": "नया कैलकुलेशन",
    "View History": "इतिहास देखें",
    "Collection Trend (Last 7 Days)": "संग्रह रुझान (पिछले 7 दिन)",
    "Amount Trend (Last 7 Days)": "राशि रुझान (पिछले 7 दिन)",
    "Average Fat % Trend": "औसत फैट % रुझान",
    "Milk Calculator": "दूध कैलकुलेटर",
    "SNF • Fat • Rates • Amount": "एसएनएफ • फैट • दरें • राशि",
    "Quantity (Kg)": "मात्रा (किलो)",
    "Fat %": "फैट %",
    "RATE": "दर",
    "Calculate": "कैलकुलेट करें",
    "Save": "सेव",
    "Results": "परिणाम",
    "FAT Kg": "फैट किलो",
    "SNF Kg": "एसएनएफ किलो",
    "Avg. Rate": "औसत दर",
    "Amount": "राशि",
    "Send Receipt": "रसीद भेजें",
    "Add Customer": "ग्राहक जोड़ें",
    "Customer Information": "ग्राहक जानकारी",
    "Customer Name *": "ग्राहक का नाम *",
    "Mobile Number *": "मोबाइल नंबर *",
    "Milk Data": "दूध डेटा",
    "Date": "दिनांक",
    "Total Amount": "कुल राशि",
    "Clear Form": "फॉर्म साफ़ करें",
    "Send WhatsApp Receipt": "WhatsApp रसीद भेजें",
    "Recent Records": "हाल के रिकॉर्ड",
    "View All": "सभी देखें",
    "Collection History": "संग्रह इतिहास",
    "All Customer records": "सभी ग्राहक रिकॉर्ड",
    "Date (Newest)": "दिनांक (नवीनतम)",
    "Date (Oldest)": "दिनांक (पुराना)",
    "Amount (High)": "राशि (अधिक)",
    "Amount (Low)": "राशि (कम)",
    "Name (A-Z)": "नाम (A-Z)",
    "Total Records": "कुल रिकॉर्ड",
    "Total Qty (Kg)": "कुल मात्रा (किलो)",
    "Total Fat Kg": "कुल फैट किलो",
    "Total SNF Kg": "कुल एसएनएफ किलो",
    "No records found": "कोई रिकॉर्ड नहीं मिला",
    "Report Filters": "रिपोर्ट फ़िल्टर",
    "Daily": "दैनिक",
    "Weekly": "साप्ताहिक",
    "Monthly": "मासिक",
    "Customer-wise": "ग्राहक-वार",
    "Generate Report": "रिपोर्ट जनरेट करें",
    "Export Options": "निर्यात विकल्प",
    "Export PDF": "PDF निर्यात करें",
    "Export Excel": "Excel निर्यात करें",
    "Export CSV": "CSV निर्यात करें",
    "Print": "प्रिंट करें",
    "Report Data": "रिपोर्ट डेटा",
    "UI & Theme Settings": "UI और थीम सेटिंग्स",
    "Language": "भाषा",
    "App Font": "ऐप फ़ॉन्ट",
    "Primary Color": "प्राथमिक रंग",
    "Preset Themes": "पूर्व-निर्धारित थीम्स",
    "Default Rates & Formula": "डिफ़ॉल्ट दरें और फ़ॉर्मूला",
    "Fat Rate (₹ per Fat%)": "फैट दर (₹ प्रति फैट%)",
    "SNF Rate (₹ per SNF%)": "एसएनएफ दर (₹ प्रति एसएनएफ%)",
    "SNF Formula": "एसएनएफ फ़ॉर्मूला",
    "Rate Master": "रेट मास्टर",
    "Base Rate": "बेस रेट",
    "Action": "कार्रवाई",
    "Add": "जोड़ें",
    "Backup & Restore": "बैकअप और रीस्टोर",
    "Backup to JSON": "JSON में बैकअप लें",
    "Restore from JSON": "JSON से रीस्टोर करें",
    "Save All Settings": "सभी सेटिंग्स सहेजें",
    "Clear All Data": "सभी डेटा साफ़ करें",
    "Home": "होम",
    "Calc": "कैलकुलेटर",
    "Entry": "एंट्री",
    "Edit Record": "रिकॉर्ड संपादित करें",
    "Save Changes": "परिवर्तन सहेजें",
    "Cancel": "रद्द करें",
    "Customer Name": "ग्राहक का नाम",
    "Mobile": "मोबाइल",
    "Village": "गाँव"
  },
  
  textNodes: [],
  placeholders: [],
  
  init() {
    this.textNodes = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let n;
    while (n = walk.nextNode()) {
      const text = n.nodeValue.trim();
      // Only cache nodes that actually match something in our dictionary
      if (text && this.dict[text]) {
        this.textNodes.push({ node: n, originalText: text });
      }
    }
    
    // Also handle placeholders
    this.placeholders = [];
    document.querySelectorAll('[placeholder]').forEach(el => {
      const p = el.getAttribute('placeholder').trim();
      if (p) {
        this.placeholders.push({ el, originalText: p });
      }
    });
  },
  
  setLanguage(lang) {
    this.lang = lang;
    const isHi = (lang === 'hi');
    
    this.textNodes.forEach(item => {
      const translated = isHi ? this.dict[item.originalText] : item.originalText;
      if (translated) {
        item.node.nodeValue = item.node.nodeValue.replace(item.node.nodeValue.trim(), translated);
      }
    });
    
    this.placeholders.forEach(item => {
      const translated = isHi ? this.dict[item.originalText] : item.originalText;
      if (translated) {
        item.el.setAttribute('placeholder', translated);
      }
    });
  }
};
