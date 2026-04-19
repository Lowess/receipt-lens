// ==============================================================
// CHART HELPERS
// ==============================================================
const CHART_TOOLTIP = { backgroundColor:'#faf8f5', borderColor:'#d8d0c8', borderWidth:1, titleColor:'#2d2820', bodyColor:'#8a7e72', padding:12, cornerRadius:6 };

function destroyChart(id) { if (charts[id]) { charts[id].destroy(); delete charts[id]; } }

function renderDonut(canvasId, totals, centerId) {
  destroyChart(canvasId);
  const cats = activeCats(totals);
  const total = cats.reduce((s, c) => s + totals[c], 0);
  if (centerId) document.getElementById(centerId).textContent = total.toFixed(2) + '€';
  charts[canvasId] = new Chart(document.getElementById(canvasId), {
    type:'doughnut',
    data: { labels: cats.map(c => CATEGORIES[c].icon+' '+c), datasets: [{ data: cats.map(c => +totals[c].toFixed(2)), backgroundColor: cats.map(c => CATEGORIES[c].color), borderWidth:0, hoverOffset:8 }] },
    options: { cutout:'68%', responsive:true, maintainAspectRatio:true, plugins: { legend:{display:false}, tooltip: { ...CHART_TOOLTIP, callbacks: { label: ctx => { const pct = ((ctx.parsed/total)*100).toFixed(1); return ` ${ctx.parsed.toFixed(2)}€ (${pct}%)`; } } } } }
  });
}

function renderLegend(id, totals) {
  const cats = activeCats(totals); const total = cats.reduce((s,c) => s+totals[c], 0);
  document.getElementById(id).innerHTML = cats.map(c => {
    const pct = ((totals[c]/total)*100).toFixed(1);
    return `<div class="legend-item"><div class="legend-color" style="background:${CATEGORIES[c].color}"></div><span class="legend-label">${CATEGORIES[c].icon} ${c}</span><span class="legend-value">${totals[c].toFixed(2)}€ <span style="color:var(--dim);font-weight:400;font-size:.75rem">${pct}%</span></span></div>`;
  }).join('');
}

function renderBarStacked() {
  destroyChart('bar-stacked'); if (!receipts.length) return;
  const catsToShow = isFoodOnly() ? FOOD_CATEGORIES : CATEGORY_ORDER;
  const ds = catsToShow.filter(c => receipts.some(r => getCategoryTotals(getFilteredItems(r.items))[c]>0.01)).map(c => ({
    label:c, data: receipts.map(r => +(getCategoryTotals(getFilteredItems(r.items))[c]||0).toFixed(2)), backgroundColor:CATEGORIES[c].color, borderRadius:4
  }));
  charts['bar-stacked'] = new Chart(document.getElementById('bar-stacked'), {
    type:'bar', data:{ labels:receipts.map(r=>r.label), datasets:ds },
    options:{ responsive:true,maintainAspectRatio:false, scales:{ x:{stacked:true,grid:{color:'rgba(0,0,0,0.06)'},ticks:{color:'#8a7e72'}}, y:{stacked:true,grid:{color:'rgba(0,0,0,0.06)'},ticks:{color:'#8a7e72',callback:v=>v+'€'}} }, plugins:{ legend:{position:'bottom',labels:{color:'#8a7e72',boxWidth:12,padding:12,font:{size:11}}}, tooltip:{...CHART_TOOLTIP, callbacks:{label:ctx=>` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}€`}} } }
  });
}

function renderDetailCategoryChips(r) {
  if (!r) return;
  const cats = getCategoryTotals(r.items); const active = activeCats(cats);
  document.getElementById('detail-cat-chips').innerHTML =
    `<div class="filter-chip ${detailCategoryFilter===null?'active':''}" onclick="detailCategoryFilter=null;renderDetailPanel()">All</div>` +
    active.map(c => `<div class="filter-chip ${detailCategoryFilter===c?'active':''}" onclick="detailCategoryFilter='${c}';topItemsExpanded=false;renderDetailPanel()">${CATEGORIES[c].icon} ${c} <span style="opacity:.6">${cats[c].toFixed(0)}€</span></div>`).join('');
}

function renderBarTopItems(r) {
  destroyChart('bar-top-items'); if(!r)return;
  let items = [...r.items];
  if (detailCategoryFilter) items = items.filter(i => i.category === detailCategoryFilter);
  items.sort((a,b) => b.price - a.price);
  const limit = topItemsExpanded ? items.length : 10;
  const sorted = items.slice(0, limit);

  document.getElementById('top-items-title').textContent = detailCategoryFilter
    ? `${CATEGORIES[detailCategoryFilter]?.icon||''} ${detailCategoryFilter} — ${items.length} items (${items.reduce((s,i)=>s+i.price,0).toFixed(2)}€)`
    : `Top Items by Price`;

  const expandBtn = document.getElementById('expand-top-items');
  expandBtn.style.display = items.length > 10 ? '' : 'none';
  expandBtn.textContent = topItemsExpanded ? `Show top 10 only ▲` : `Show all ${items.length} items ▼`;

  const chartWrap = document.querySelector('#bar-top-items').parentElement;
  chartWrap.style.height = topItemsExpanded ? Math.max(350, sorted.length * 28) + 'px' : '350px';

  charts['bar-top-items'] = new Chart(document.getElementById('bar-top-items'), {
    type:'bar', data:{ labels:sorted.map(i=>i.name.substring(0,30)), datasets:[{data:sorted.map(i=>i.price),backgroundColor:sorted.map(i=>CATEGORIES[i.category]?.color||'#6c63ff'),borderRadius:4}] },
    options:{ indexAxis:'y',responsive:true,maintainAspectRatio:false, scales:{ x:{grid:{color:'rgba(0,0,0,0.06)'},ticks:{color:'#8a7e72',callback:v=>v+'€'}}, y:{grid:{display:false},ticks:{color:'#8a7e72',font:{size:10}}} }, plugins:{ legend:{display:false}, tooltip:{...CHART_TOOLTIP, callbacks:{label:ctx=>` ${ctx.parsed.x.toFixed(2)}€ — ${sorted[ctx.dataIndex].category}`}} } }
  });
}

function toggleExpandTopItems() {
  topItemsExpanded = !topItemsExpanded;
  if (receipts.length) renderBarTopItems(receipts[selectedReceiptIdx]);
}

function renderDetailPanel() {
  if (!receipts.length) return;
  const r = receipts[selectedReceiptIdx];
  renderDetailCategoryChips(r);
  renderBarTopItems(r);
}

function renderLineTrends() {
  destroyChart('line-trends'); if(!receipts.length)return;
  const ac = CATEGORY_ORDER.filter(c=>receipts.some(r=>getCategoryTotals(r.items)[c]>0.01));
  const ds = ac.map(c=>({
    label:CATEGORIES[c].icon+' '+c, data:receipts.map(r=>+(getCategoryTotals(r.items)[c]||0).toFixed(2)),
    borderColor:CATEGORIES[c].color, backgroundColor:CATEGORIES[c].color+'20', fill:true, tension:.3, pointRadius:5, pointHoverRadius:7, borderWidth:2
  }));
  charts['line-trends'] = new Chart(document.getElementById('line-trends'), {
    type:'line', data:{labels:receipts.map(r=>r.label),datasets:ds},
    options:{ responsive:true,maintainAspectRatio:false, scales:{ x:{grid:{color:'rgba(0,0,0,0.06)'},ticks:{color:'#8a7e72'}}, y:{grid:{color:'rgba(0,0,0,0.06)'},ticks:{color:'#8a7e72',callback:v=>v+'€'}} }, plugins:{ legend:{position:'bottom',labels:{color:'#8a7e72',boxWidth:12,padding:12,font:{size:11}}}, tooltip:{...CHART_TOOLTIP,callbacks:{label:ctx=>` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}€`}} } }
  });
}

function renderBarChange() {
  destroyChart('bar-change'); if(receipts.length<2)return;
  const prev=getCategoryTotals(receipts[receipts.length-2].items), curr=getCategoryTotals(receipts[receipts.length-1].items);
  const cats=CATEGORY_ORDER.filter(c=>prev[c]>0.01||curr[c]>0.01);
  const changes=cats.map(c=>+((curr[c]||0)-(prev[c]||0)).toFixed(2));
  charts['bar-change'] = new Chart(document.getElementById('bar-change'), {
    type:'bar', data:{ labels:cats.map(c=>CATEGORIES[c].icon+' '+c), datasets:[{data:changes,backgroundColor:changes.map(v=>v>=0?'rgba(248,113,113,.7)':'rgba(52,211,153,.7)'),borderRadius:4}] },
    options:{ responsive:true,maintainAspectRatio:false, scales:{ x:{grid:{display:false},ticks:{color:'#8a7e72',font:{size:10}}}, y:{grid:{color:'rgba(0,0,0,0.06)'},ticks:{color:'#8a7e72',callback:v=>(v>=0?'+':'')+v+'€'}} }, plugins:{ legend:{display:false}, tooltip:{...CHART_TOOLTIP,callbacks:{label:ctx=>` ${ctx.parsed.y>=0?'+':''}${ctx.parsed.y.toFixed(2)}€`}} } }
  });
}

function renderBarEvolution() {
  destroyChart('bar-evolution'); if(!receipts.length)return;
  charts['bar-evolution'] = new Chart(document.getElementById('bar-evolution'), {
    type:'bar', data:{ labels:receipts.map(r=>r.label), datasets:[{label:'Total',data:receipts.map(r=>r.total),backgroundColor:'rgba(185,105,60,.65)',borderRadius:6}] },
    options:{ responsive:true,maintainAspectRatio:false, scales:{ x:{grid:{display:false},ticks:{color:'#8a7e72'}}, y:{grid:{color:'rgba(0,0,0,0.06)'},ticks:{color:'#8a7e72',callback:v=>v+'€'},beginAtZero:true} }, plugins:{ legend:{display:false}, tooltip:{...CHART_TOOLTIP,callbacks:{label:ctx=>` Total: ${ctx.parsed.y.toFixed(2)}€`}} } }
  });
}

function sparklineSVG(prices, trend) {
  if (prices.length < 2) return '';
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 0.01;
  const W = 90, H = 32, pad = 4;
  const color = trend > 2 ? 'var(--red)' : trend < -2 ? 'var(--green)' : 'var(--muted)';
  const pts = prices.map((v, i) => {
    const x = pad + (i / (prices.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const dots = prices.map((v, i) => {
    const x = pad + (i / (prices.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    const isLast = i === prices.length - 1;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${isLast ? 3.2 : 2.2}" fill="${color}" opacity="${isLast ? 1 : .65}"/>`;
  }).join('');
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="display:block;overflow:visible">
    <polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity=".75"/>
    ${dots}
  </svg>`;
}

function togglePriceHistory(tr, prices, labels) {
  const key = tr.nextElementSibling?.id;
  if (!key) return;
  const histRow = tr.nextElementSibling;
  const isHidden = histRow.classList.toggle('hidden');
  if (!isHidden) {
    const canvasId = 'phc-' + key.replace('ph-', '');
    const canvas = document.getElementById(canvasId);
    if (canvas && !charts[canvasId]) {
      charts[canvasId] = new Chart(canvas, {
        type: 'line',
        data: { labels, datasets: [{ data: prices, borderColor: 'var(--accent)', backgroundColor: 'oklch(92% 0.025 40)', fill: true, tension: 0.3, pointRadius: 5, pointHoverRadius: 7, borderWidth: 2 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { ...CHART_TOOLTIP, callbacks: { label: ctx => ` ${ctx.parsed.y.toFixed(2)} €` } } }, scales: { x: { grid: { display: false }, ticks: { color: '#8a7e72', font: { size: 10 } } }, y: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { color: '#8a7e72', callback: v => v + '€' } } } }
      });
    }
  }
}
