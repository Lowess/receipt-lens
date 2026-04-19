// ==============================================================
// UI — tab switching, modals, exports, manual entry
// ==============================================================
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.tab-content').forEach(tc => tc.classList.add('hidden'));
  document.getElementById('tab-' + tab).classList.remove('hidden');
  if (tab === 'budget') renderBudgetInputs();
  if (tab === 'prices') renderPricesTab();
  renderAll();
}

function exportPDF() { window.print(); }

function showManualEntryModal() {
  manualItemCount = 0;
  const today = new Date().toISOString().slice(0, 10);
  document.getElementById('manual-date').value = today;
  document.getElementById('manual-label').value = '';
  document.getElementById('manual-items-body').innerHTML = '';
  document.getElementById('manual-total-preview').textContent = '';
  addManualItem();
  document.getElementById('manual-modal').classList.remove('hidden');
}

function closeManualModal() {
  document.getElementById('manual-modal').classList.add('hidden');
}

function catOptions(selected) {
  return CATEGORY_ORDER.map(c => `<option value="${c}"${c===selected?' selected':''}>${CATEGORIES[c].icon} ${c}</option>`).join('');
}

function addManualItem() {
  const id = manualItemCount++;
  const row = document.createElement('div');
  row.className = 'manual-item-row';
  row.id = `manual-row-${id}`;
  row.innerHTML = `
    <input type="text" placeholder="Nom de l'article" oninput="updateManualTotal()">
    <input type="number" value="1" min="1" step="1" oninput="updateManualTotal()">
    <input type="number" placeholder="0.00" min="0" step="0.01" oninput="updateManualTotal()">
    <select>${catOptions('Épicerie')}</select>
    <button class="del-row-btn" onclick="document.getElementById('manual-row-${id}').remove();updateManualTotal()" title="Supprimer">×</button>`;
  document.getElementById('manual-items-body').appendChild(row);
}

function updateManualTotal() {
  const rows = document.querySelectorAll('.manual-item-row');
  let total = 0;
  for (const row of rows) {
    const qty = parseFloat(row.querySelectorAll('input')[1].value) || 1;
    const price = parseFloat(row.querySelectorAll('input')[2].value) || 0;
    total += qty * price;
  }
  document.getElementById('manual-total-preview').textContent = total > 0 ? `Total : ${total.toFixed(2)} €` : '';
}

async function saveManualReceipt() {
  const dateVal = document.getElementById('manual-date').value;
  const labelVal = document.getElementById('manual-label').value.trim();
  const date = dateVal ? new Date(dateVal) : new Date();
  const dateLabel = `${String(date.getDate()).padStart(2,'0')} ${MONTH_SHORT[date.getMonth()]} ${date.getFullYear()}`;

  const rows = document.querySelectorAll('.manual-item-row');
  const items = [];
  for (const row of rows) {
    const inputs = row.querySelectorAll('input');
    const name = inputs[0].value.trim();
    const qty = parseInt(inputs[1].value) || 1;
    const unitPrice = parseFloat(inputs[2].value) || 0;
    const category = row.querySelector('select').value;
    if (!name || unitPrice <= 0) continue;
    items.push({ name, price: qty * unitPrice, unitPrice, qty, section: 'MANUEL', category });
  }
  if (!items.length) { alert('Ajoutez au moins un article valide.'); return; }

  const total = items.reduce((s, it) => s + it.price, 0);
  const receipt = { date, dateLabel, label: dateLabel, total, subtotal: total, discount: 0, items, filename: labelVal || 'Saisie manuelle' };
  receipts.push(receipt);
  receipts.sort((a, b) => (a.date || 0) - (b.date || 0));
  await saveState();
  closeManualModal();
  renderAll();
}
