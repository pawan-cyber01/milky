/* ============================================================
   MILKY — config.js
   Configuration Constants for Engine
   ============================================================ */

const MILKY_CONFIG = {
    // Exact SNF Formula provided by the user
    SNF_FORMULA: "(CLR / 4) + (0.21 * FAT) + 0.10",
    
    // Divisor used to calculate Fat Rate from the Base Rate
    FAT_RATE_DIVISOR: 650
};

// Export for node environments or expose globally for browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MILKY_CONFIG;
} else {
    window.MILKY_CONFIG = MILKY_CONFIG;
}
