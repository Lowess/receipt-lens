// ==============================================================
// APPLICATION STATE
// ==============================================================
let receipts = [];
let budgets = {};
let lastOCRText = '';
let selectedReceiptIdx = 0;
let charts = {};
let ocrWorker = null;
let detailCategoryFilter = null;
let topItemsExpanded = false;
let itemsCategoryFilter = null;
let pricesSortMode = 'freq';
let pricesCatFilter = null;
let detailMonthsOpen = new Set();
let manualItemCount = 0;
