// ==============================================================
// INDEXEDDB  (replaces localStorage — auto-migrates legacy data)
// ==============================================================
const DB = {
  db: null,
  async open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('receiptlens', 1);
      req.onupgradeneeded = e => e.target.result.createObjectStore('kv', { keyPath: 'key' });
      req.onsuccess = e => { this.db = e.target.result; resolve(); };
      req.onerror = () => reject(req.error);
    });
  },
  async get(key) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('kv', 'readonly');
      const req = tx.objectStore('kv').get(key);
      req.onsuccess = () => resolve(req.result?.value ?? null);
      req.onerror = () => reject(req.error);
    });
  },
  async set(key, value) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('kv', 'readwrite');
      tx.objectStore('kv').put({ key, value });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }
};

async function saveState() {
  await DB.set('receipts', receipts.map(r => ({ ...r, date: r.date?.toISOString() || null })));
}

async function loadState() {
  const legacy = localStorage.getItem('receiptlens_v2');
  if (legacy) {
    try {
      receipts = JSON.parse(legacy).map(r => ({ ...r, date: r.date ? new Date(r.date) : null }));
      await saveState();
      localStorage.removeItem('receiptlens_v2');
    } catch(e) { receipts = []; }
  } else {
    const data = await DB.get('receipts');
    if (data) receipts = data.map(r => ({ ...r, date: r.date ? new Date(r.date) : null }));
  }
}

async function saveBudgets() {
  for (const cat of CATEGORY_ORDER) {
    const input = document.getElementById(`budget-${cat}`);
    if (!input) continue;
    const val = parseFloat(input.value);
    if (!isNaN(val) && val > 0) budgets[cat] = val;
    else delete budgets[cat];
  }
  await DB.set('budgets', budgets);
  renderBudgetOverview();
  const btn = document.querySelector('#tab-budget .btn-primary');
  if (btn) { const orig = btn.textContent; btn.textContent = 'Budgets sauvegardés ✓'; setTimeout(() => btn.textContent = orig, 2000); }
}

async function loadBudgets() {
  const data = await DB.get('budgets');
  if (data) budgets = data;
}

function exportData() {
  const blob = new Blob([JSON.stringify(receipts, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'receipt-data.json'; a.click();
}

function exportCSV() {
  const rows = [['Receipt', 'Date', 'Item', 'Category', 'Section', 'Price (€)']];
  for (const r of receipts) {
    for (const it of r.items) {
      rows.push([
        r.label,
        r.date?.toISOString().slice(0, 10) || '',
        it.name,
        it.category,
        it.section || '',
        it.price.toFixed(2)
      ]);
    }
  }
  const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'receipt-data.csv'; a.click();
}
