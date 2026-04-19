// ==============================================================
// AGGREGATION & RENDERING
// ==============================================================
function getCategoryTotals(items) {
  const t = {}; for (const c of CATEGORY_ORDER) t[c] = 0;
  for (const it of items) t[it.category] = (t[it.category] || 0) + it.price;
  return t;
}

function activeCats(t) { return CATEGORY_ORDER.filter(c => t[c] > 0.01); }

function isFoodOnly() { return document.getElementById('food-only-toggle')?.checked || false; }

function getFilteredItems(receiptItems) {
  return isFoodOnly() ? receiptItems.filter(it => it.category !== 'Hygiène & Maison') : receiptItems;
}

function updateItemCategory(receiptIdx, itemOrigIdx, newCat) {
  receipts[receiptIdx].items[itemOrigIdx].category = newCat;
  saveState();
  renderItemsTable();
  const allItems = receipts.flatMap(r => getFilteredItems(r.items));
  const totals = getCategoryTotals(allItems);
  renderDonut('donut-total', totals, 'total-amount');
  renderLegend('legend-total', totals);
  if (receiptIdx === selectedReceiptIdx) {
    const ct = getCategoryTotals(receipts[receiptIdx].items);
    renderDonut('donut-detail', ct, 'detail-amount');
    renderLegend('legend-detail', ct);
  }
  renderBudgetOverview();
}

function renderStatCards() {
  const el = document.getElementById('stat-cards');
  if (!receipts.length) { el.innerHTML=''; return; }

  const allItems = receipts.flatMap(r => getFilteredItems(r.items));
  const totalSpent = allItems.reduce((s,it) => s+it.price, 0);
  const avg = totalSpent / receipts.length;
  const totalItemCount = allItems.length;

  let changeHtml = '';
  if (receipts.length >= 2) {
    const prevTotal = getFilteredItems(receipts[receipts.length-2].items).reduce((s,it)=>s+it.price,0);
    const currTotal = getFilteredItems(receipts[receipts.length-1].items).reduce((s,it)=>s+it.price,0);
    const diff = currTotal - prevTotal;
    const pct = prevTotal > 0 ? ((diff/prevTotal)*100).toFixed(1) : '0';
    changeHtml = `<span class="stat-badge ${diff>0?'badge-up':'badge-down'}">${diff>0?'+':''}${pct}%</span>`;
  }

  const allAlcohol = receipts.flatMap(r => r.items.filter(isAlcohol));
  const totalAlcohol = allAlcohol.reduce((s,it) => s+it.price, 0);
  const allTotal = receipts.reduce((s,r) => s+r.total, 0);
  const pctOfTotal = allTotal > 0 ? ((totalAlcohol/allTotal)*100).toFixed(1) : '0';
  let alcTrendHtml = '';
  if (receipts.length >= 2) {
    const prevAlc = receipts[receipts.length-2].items.filter(isAlcohol).reduce((s,it)=>s+it.price,0);
    const currAlc = receipts[receipts.length-1].items.filter(isAlcohol).reduce((s,it)=>s+it.price,0);
    const diff = currAlc - prevAlc;
    if (prevAlc > 0) {
      const p = ((diff/prevAlc)*100).toFixed(0);
      alcTrendHtml = `<span class="stat-badge ${diff>0?'badge-up':'badge-down'}">${diff>0?'+':''}${p}%</span>`;
    }
  }
  const topAlcohol = [...allAlcohol].sort((a,b)=>b.price-a.price).slice(0,3);

  // Month comparison
  const latestDate = receipts[receipts.length - 1].date;
  let monthCompareHtml = '';
  if (latestDate) {
    const curMK = `${latestDate.getFullYear()}-${latestDate.getMonth()}`;
    const prevM = latestDate.getMonth() === 0 ? 11 : latestDate.getMonth() - 1;
    const prevY = latestDate.getMonth() === 0 ? latestDate.getFullYear() - 1 : latestDate.getFullYear();
    const prevMK = `${prevY}-${prevM}`;
    const curItems  = receipts.filter(r => r.date && `${r.date.getFullYear()}-${r.date.getMonth()}` === curMK).flatMap(r => getFilteredItems(r.items));
    const prevItems = receipts.filter(r => r.date && `${r.date.getFullYear()}-${r.date.getMonth()}` === prevMK).flatMap(r => getFilteredItems(r.items));
    const curT  = curItems.reduce((s, it) => s + it.price, 0);
    const prevT = prevItems.reduce((s, it) => s + it.price, 0);
    if (prevT > 0) {
      const d = curT - prevT;
      const p = ((d / prevT) * 100).toFixed(1);
      monthCompareHtml = `<span class="stat-badge ${d > 0 ? 'badge-up' : 'badge-down'}">${d > 0 ? '+' : ''}${p}% vs mois préc.</span>`;
    }
  }

  // Budget alert
  let budgetAlertHtml = '';
  if (Object.keys(budgets).length && receipts.length) {
    const last = receipts[receipts.length - 1];
    const totals = getCategoryTotals(last.items);
    const overCats = CATEGORY_ORDER.filter(c => budgets[c] > 0 && totals[c] > budgets[c]);
    if (overCats.length) budgetAlertHtml = `<span class="stat-badge badge-up">⚠ ${overCats.length} budget${overCats.length > 1 ? 's' : ''} dépassé${overCats.length > 1 ? 's' : ''}</span>`;
  }

  const modeLabel = isFoodOnly() ? ' · alim.' : '';
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:0;border:1px solid var(--hairline);border-radius:var(--radius-lg);overflow:hidden">
      <div class="stat-card"><div class="stat-label">Total dépensé${modeLabel}</div><div class="stat-value">${totalSpent.toFixed(2)}€</div><div class="stat-sub">${receipts.length} reçu${receipts.length>1?'s':''} ${monthCompareHtml}</div></div>
      <div class="stat-card"><div class="stat-label">Moyenne par reçu</div><div class="stat-value">${avg.toFixed(2)}€</div><div class="stat-sub">${totalItemCount} articles ${changeHtml}</div></div>
      <div class="stat-card"><div class="stat-label">Dernier reçu</div><div class="stat-value">${receipts[receipts.length-1].total.toFixed(2)}€</div><div class="stat-sub">${receipts[receipts.length-1].label}${receipts[receipts.length-1].discount > 0 ? ` <span class="stat-badge badge-down">-${receipts[receipts.length-1].discount.toFixed(2)}€</span>` : ''} ${budgetAlertHtml}</div></div>
      <div class="alcohol-card">
        <div class="stat-label">🍷 Alcool</div>
        <div class="stat-value alcohol-highlight">${totalAlcohol.toFixed(2)}€</div>
        <div class="stat-sub">${pctOfTotal}% du total · ${allAlcohol.length} articles ${alcTrendHtml}</div>
        ${topAlcohol.length ? `<div style="margin-top:8px;font-size:.73rem;color:var(--ink-4)">${topAlcohol.map(it=>`<div style="display:flex;justify-content:space-between;padding:1px 0"><span>${it.name.substring(0,22)}</span><span style="color:var(--warn)">${it.price.toFixed(2)}€</span></div>`).join('')}</div>` : ''}
      </div>
    </div>`;
}

function renderPills(id) {
  document.getElementById(id).innerHTML = receipts.map((r,i) =>
    `<div class="receipt-pill ${i===selectedReceiptIdx?'active':''}" onclick="selectedReceiptIdx=${i};renderAll()">
      ${r.label} · ${r.total.toFixed(2)}€${r.discount > 0 ? ` (-${r.discount.toFixed(2)}€)` : ''}
      <button class="receipt-delete" onclick="event.stopPropagation();receipts.splice(${i},1);if(selectedReceiptIdx>=${receipts.length})selectedReceiptIdx=Math.max(0,receipts.length-1);saveState();renderAll()" title="Remove">×</button>
    </div>`
  ).join('');
}

function renderItemsCategoryChips() {
  if (!receipts.length) return;
  const cats = getCategoryTotals(receipts[selectedReceiptIdx].items);
  const active = activeCats(cats);
  document.getElementById('items-cat-chips').innerHTML =
    `<div class="filter-chip ${itemsCategoryFilter===null?'active':''}" onclick="itemsCategoryFilter=null;renderItemsTable()">All</div>` +
    active.map(c => `<div class="filter-chip ${itemsCategoryFilter===c?'active':''}" onclick="itemsCategoryFilter='${c}';renderItemsTable()">${CATEGORIES[c].icon} ${c}</div>`).join('');
}

function renderItemsTable() {
  const tbody = document.getElementById('items-tbody');
  const summary = document.getElementById('items-summary');
  if (!receipts.length) {
    tbody.innerHTML='<tr><td colspan="3" style="text-align:center;color:var(--dim);padding:20px">No receipts loaded</td></tr>';
    summary.textContent=''; return;
  }
  renderItemsCategoryChips();

  const q = (document.getElementById('item-search')?.value||'').trim();
  let items = receipts[selectedReceiptIdx].items.map((it, origIdx) => ({ ...it, _origIdx: origIdx }));
  if (itemsCategoryFilter) items = items.filter(it => it.category === itemsCategoryFilter);

  if (q) {
    items = items.map(it => {
      const score = Math.max(fuzzyScore(it.name, q), fuzzyScore(it.category, q));
      return { ...it, _score: score };
    }).filter(it => it._score > 0).sort((a, b) => b._score - a._score || b.price - a.price);
  } else {
    items.sort((a, b) => b.price - a.price);
  }

  const totalFiltered = items.reduce((s,it) => s + it.price, 0);
  summary.innerHTML = `${items.length} items · <strong>${totalFiltered.toFixed(2)}€</strong>${q ? ` matching "<em>${q}</em>"` : ''}${itemsCategoryFilter ? ` in ${itemsCategoryFilter}` : ''}`;

  function highlight(text, query) {
    if (!query) return text;
    const lower = text.toLowerCase(), qlower = query.toLowerCase();
    const idx = lower.indexOf(qlower);
    if (idx >= 0) {
      return text.substring(0, idx) + '<mark style="background:oklch(88% 0.04 40);color:var(--ink);border-radius:2px;padding:0 1px">' + text.substring(idx, idx + query.length) + '</mark>' + text.substring(idx + query.length);
    }
    let result = '', qi = 0;
    for (let i = 0; i < text.length; i++) {
      if (qi < qlower.length && text[i].toLowerCase() === qlower[qi]) {
        result += '<mark style="background:oklch(88% 0.04 40);color:var(--ink);border-radius:2px;padding:0 1px">' + text[i] + '</mark>'; qi++;
      } else result += text[i];
    }
    return result;
  }

  tbody.innerHTML = items.map(it =>
    `<tr>
      <td>${highlight(it.name, q)}</td>
      <td>
        <div class="cat-cell">
          <span class="cat-dot" style="background:${CATEGORIES[it.category]?.color||'#666'}"></span>
          <select class="cat-select" onchange="updateItemCategory(${selectedReceiptIdx},${it._origIdx},this.value)">
            ${CATEGORY_ORDER.map(c => `<option value="${c}"${c===it.category?' selected':''}>${CATEGORIES[c].icon} ${c}</option>`).join('')}
          </select>
        </div>
      </td>
      <td style="text-align:right;font-weight:600">${it.price.toFixed(2)}€</td>
    </tr>`
  ).join('');
}

function renderBudgetInputs() {
  const el = document.getElementById('budget-inputs');
  if (!el) return;
  el.innerHTML = CATEGORY_ORDER.map(cat => {
    const conf = CATEGORIES[cat];
    const val = budgets[cat] || '';
    return `<div class="budget-row">
      <div class="budget-cat"><span style="font-size:1.1rem">${conf.icon}</span>${cat}</div>
      <input class="budget-input" type="number" id="budget-${cat}" placeholder="—" min="0" step="0.5" value="${val}">
      <span style="font-size:.75rem;color:var(--dim);width:60px;flex-shrink:0">€ / course</span>
    </div>`;
  }).join('');
}

function renderBudgetOverview() {
  const el = document.getElementById('budget-overview');
  if (!el) return;
  if (!Object.keys(budgets).length || !receipts.length) { el.innerHTML = ''; return; }

  const last = receipts[receipts.length - 1];
  const totals = getCategoryTotals(last.items);
  const budgetedCats = CATEGORY_ORDER.filter(c => budgets[c] > 0 && totals[c] > 0.01);
  if (!budgetedCats.length) { el.innerHTML = ''; return; }

  const rows = budgetedCats.map(c => {
    const spent = totals[c];
    const limit = budgets[c];
    const pct = Math.min((spent / limit) * 100, 100);
    const over = spent > limit;
    const barColor = over ? 'var(--red)' : pct > 80 ? 'var(--orange)' : CATEGORIES[c].color;
    return `<div class="budget-row">
      <div class="budget-cat"><span style="font-size:1rem">${CATEGORIES[c].icon}</span>${c}</div>
      <div class="budget-bar-wrap"><div class="budget-bar-fill" style="width:${pct.toFixed(1)}%;background:${barColor}"></div></div>
      <div class="budget-spent ${over ? 'budget-over' : ''}">${spent.toFixed(2)}€ / ${limit}€${over ? ' ⚠️' : ''}</div>
    </div>`;
  }).join('');

  el.innerHTML = `<div class="panel" style="margin-top:12px"><div class="panel-title">Budget — ${last.label}</div>${rows}</div>`;
}

function normalizeName(n) {
  return n.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getRecurringItems() {
  const map = new Map();
  for (const r of receipts) {
    for (const it of r.items) {
      const key = normalizeName(it.name);
      if (!map.has(key)) map.set(key, { name: it.name, category: it.category, entries: [] });
      map.get(key).entries.push({ label: r.label, date: r.date, price: it.unitPrice ?? it.price });
    }
  }
  return [...map.values()]
    .filter(item => item.entries.length >= 2)
    .map(item => {
      const sorted = [...item.entries].sort((a, b) => (a.date || 0) - (b.date || 0));
      const prices = sorted.map(e => e.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
      const trend = prices[0] > 0 ? ((prices[prices.length - 1] - prices[0]) / prices[0] * 100) : 0;
      const totalSpend = prices.reduce((s, p) => s + p, 0);
      return { ...item, sorted, prices, min, max, avg, trend, totalSpend };
    });
}

function renderPricesTab() {
  const tbody = document.getElementById('prices-tbody');
  const summary = document.getElementById('prices-summary');
  if (!tbody) return;

  if (!receipts.length || receipts.length < 2) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:32px">Charge au moins 2 tickets pour voir le suivi des prix.</td></tr>`;
    if (summary) summary.textContent = '';
    return;
  }

  const q = normalizeName(document.getElementById('prices-search')?.value || '');
  let items = getRecurringItems();
  if (pricesCatFilter) items = items.filter(it => it.category === pricesCatFilter);
  if (q) items = items.filter(it => normalizeName(it.name).includes(q));

  if (pricesSortMode === 'inflation') items.sort((a, b) => b.trend - a.trend);
  else if (pricesSortMode === 'spend')  items.sort((a, b) => b.totalSpend - a.totalSpend);
  else                                   items.sort((a, b) => b.entries.length - a.entries.length);

  const all = getRecurringItems();
  const catCounts = {};
  for (const it of all) catCounts[it.category] = (catCounts[it.category] || 0) + 1;
  const cats = Object.keys(catCounts).sort((a, b) => catCounts[b] - catCounts[a]);
  document.getElementById('prices-cat-chips').innerHTML =
    `<div class="filter-chip ${!pricesCatFilter ? 'active' : ''}" onclick="pricesCatFilter=null;renderPricesTab()">Tout</div>` +
    cats.map(c => `<div class="filter-chip ${pricesCatFilter===c ? 'active' : ''}" onclick="pricesCatFilter='${c}';renderPricesTab()">${CATEGORIES[c]?.icon||''} ${c} <span style="opacity:.5">${catCounts[c]}</span></div>`).join('');

  document.getElementById('prices-sort-chips').innerHTML =
    [['freq','Fréquence'],['inflation','Hausse ↑'],['spend','Dépense totale']].map(([k, l]) =>
      `<div class="filter-chip ${pricesSortMode===k?'active':''}" onclick="pricesSortMode='${k}';renderPricesTab()">${l}</div>`
    ).join('');

  if (summary) summary.textContent = `${items.length} article${items.length !== 1 ? 's' : ''} récurrent${items.length !== 1 ? 's' : ''} sur ${receipts.length} ticket${receipts.length !== 1 ? 's' : ''}`;

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:32px">Aucun article trouvé dans plusieurs tickets.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(it => {
    const trendAbs = Math.abs(it.trend);
    const trendHtml = trendAbs < 0.5
      ? `<span style="color:var(--dim);font-family:var(--mono);font-size:.78rem">—</span>`
      : `<span style="font-family:var(--mono);font-size:.78rem;font-weight:700;color:${it.trend > 0 ? 'var(--red)' : 'var(--green)'}">${it.trend > 0 ? '+' : ''}${it.trend.toFixed(1)}%</span>`;
    const lastPrice = it.sorted[it.sorted.length - 1].price;
    const isNewLow = lastPrice === it.min && it.entries.length > 1 && it.max > it.min;
    const lowBadge = isNewLow ? `<span class="badge-lowprice">↓ bas historique</span>` : '';
    const history = it.sorted.map(e => `${e.label}: ${e.price.toFixed(2)}€`).join(' → ');
    return `<tr title="${history}" style="cursor:pointer" onclick="togglePriceHistory(this, ${JSON.stringify(it.prices)}, ${JSON.stringify(it.sorted.map(e=>e.label))})">
      <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${it.name} ${lowBadge}</td>
      <td><div class="cat-cell"><span class="cat-dot" style="background:${CATEGORIES[it.category]?.color||'#666'}"></span>${it.category}</div></td>
      <td style="text-align:right;font-family:var(--mono);font-size:.82rem;color:var(--green)">${it.min.toFixed(2)}€</td>
      <td style="text-align:right;font-family:var(--mono);font-size:.82rem">${it.avg.toFixed(2)}€</td>
      <td style="text-align:right;font-family:var(--mono);font-size:.82rem;color:${it.max > it.min ? 'var(--red)' : 'var(--text)'}">${it.max.toFixed(2)}€</td>
      <td style="text-align:right">${trendHtml}</td>
      <td style="padding-top:6px;padding-bottom:6px">${sparklineSVG(it.prices, it.trend)}</td>
      <td style="text-align:right;font-family:var(--mono);font-size:.82rem;color:var(--muted)">${it.entries.length}×</td>
    </tr>
    <tr class="price-history-row hidden" id="ph-${it.name.replace(/[^a-z0-9]/gi,'_')}">
      <td colspan="8" style="padding:0 14px 12px">
        <div style="height:140px;position:relative"><canvas id="phc-${it.name.replace(/[^a-z0-9]/gi,'_')}"></canvas></div>
      </td>
    </tr>`;
  }).join('');
}

// ==============================================================
// DETAIL — ACCORDÉON MENSUEL
// ==============================================================
function renderDetailRecusList() {
  const el = document.getElementById('detail-months-list');
  if (!el) return;
  if (!receipts.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--ink-4);padding:40px;font-size:.9rem">Aucun reçu chargé — déposez un ticket ou utilisez la saisie manuelle.</div>';
    return;
  }
  const q = (document.getElementById('detail-search')?.value || '').toLowerCase().trim();
  const sortMode = document.getElementById('detail-sort')?.value || 'date-desc';

  let rs = receipts.map((r, i) => ({ ...r, _idx: i }));
  if (q) rs = rs.filter(r =>
    (r.label || '').toLowerCase().includes(q) ||
    (r.filename || '').toLowerCase().includes(q) ||
    r.items.some(it => it.name.toLowerCase().includes(q))
  );
  if (sortMode === 'date-asc')        rs.sort((a, b) => (a.date||0) - (b.date||0));
  else if (sortMode === 'total-desc') rs.sort((a, b) => b.total - a.total);
  else if (sortMode === 'total-asc')  rs.sort((a, b) => a.total - b.total);
  else                                rs.sort((a, b) => (b.date||0) - (a.date||0));

  const byMonth = new Map();
  for (const r of rs) {
    const key = r.date ? `${r.date.getFullYear()}-${String(r.date.getMonth()+1).padStart(2,'0')}` : '????';
    const lbl = r.date ? MONTH_NAMES[r.date.getMonth()] + ' ' + r.date.getFullYear() : 'Date inconnue';
    if (!byMonth.has(key)) byMonth.set(key, { label: lbl, key, rs: [] });
    byMonth.get(key).rs.push(r);
  }

  if (detailMonthsOpen.size === 0 && byMonth.size > 0) detailMonthsOpen.add([...byMonth.keys()][0]);

  el.innerHTML = [...byMonth.values()].map(({ label, key, rs: mrs }) => {
    const monthTotal = mrs.reduce((s, r) => s + r.total, 0);
    const isOpen = q || detailMonthsOpen.has(key);
    return `<div class="month-group">
      <div class="month-header${isOpen ? ' open' : ''}" data-month-key="${key}" onclick="toggleMonth(this)">
        <span class="month-title">${label}</span>
        <span class="month-meta">${mrs.length} reçu${mrs.length>1?'s':''} · ${monthTotal.toFixed(2)} €</span>
        <span class="month-chevron">▾</span>
      </div>
      <div class="month-body${isOpen ? ' open' : ''}">
        ${mrs.map(r => {
          const d = r.date;
          const dateStr = d ? `${String(d.getDate()).padStart(2,'0')} ${MONTH_SHORT[d.getMonth()]}` : '?';
          const name = (r.filename ? r.filename.replace(/\.[^.]+$/,'') : r.label).substring(0, 36);
          return `<div class="receipt-row${r._idx===selectedReceiptIdx?' active':''}" onclick="selectReceipt(${r._idx})">
            <span class="receipt-row-date">${dateStr}</span>
            <span class="receipt-row-name">${name}</span>
            <span class="receipt-row-items">${r.items.length} art.</span>
            <span class="receipt-row-total">${r.total.toFixed(2)} €</span>
            <button class="receipt-delete" onclick="event.stopPropagation();deleteReceipt(${r._idx})" title="Supprimer">×</button>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');
}

function toggleMonth(header) {
  const key = header.dataset.monthKey;
  const body = header.nextElementSibling;
  const willOpen = !header.classList.contains('open');
  header.classList.toggle('open', willOpen);
  if (body) body.classList.toggle('open', willOpen);
  if (willOpen) detailMonthsOpen.add(key);
  else detailMonthsOpen.delete(key);
}

function selectReceipt(idx) {
  selectedReceiptIdx = idx;
  renderDetailRecusList();
  renderPills('receipt-pills-items');
  if (!receipts.length) return;
  const r = receipts[idx];
  const ct = getCategoryTotals(r.items);
  renderDonut('donut-detail', ct, 'detail-amount');
  document.getElementById('detail-sublabel').textContent = r.label;
  renderLegend('legend-detail', ct);
  detailCategoryFilter = null;
  renderDetailCategoryChips(r);
  renderBarTopItems(r);
}

function deleteReceipt(idx) {
  receipts.splice(idx, 1);
  if (selectedReceiptIdx >= receipts.length) selectedReceiptIdx = Math.max(0, receipts.length - 1);
  saveState();
  renderAll();
}

function renderAll() {
  renderStatCards();
  const allItems = receipts.flatMap(r => getFilteredItems(r.items));
  const totals = getCategoryTotals(allItems);
  renderDonut('donut-total', totals, 'total-amount');
  renderLegend('legend-total', totals);
  renderBarStacked();
  renderDetailRecusList();
  renderPills('receipt-pills-items');
  if (receipts.length) {
    const r = receipts[selectedReceiptIdx];
    const ct = getCategoryTotals(r.items);
    renderDonut('donut-detail', ct, 'detail-amount');
    document.getElementById('detail-sublabel').textContent = r.label;
    renderLegend('legend-detail', ct);
    renderDetailCategoryChips(r);
    renderBarTopItems(r);
  }
  renderLineTrends();
  renderBarChange();
  renderBarEvolution();
  renderItemsTable();
  renderBudgetOverview();
  renderPricesTab();
}
