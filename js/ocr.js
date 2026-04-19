// ==============================================================
// OCR  — Tesseract.js with French language model
// ==============================================================
const IMAGE_TYPES = new Set(['image/jpeg','image/jpg','image/png','image/webp']);

function isImageFile(f) {
  return IMAGE_TYPES.has(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name);
}

async function getOCRWorker() {
  if (ocrWorker) return ocrWorker;
  const w = await Tesseract.createWorker('fra', 1, {
    workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
    corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@v5.0.0',
    logger: m => {
      if (m.status === 'recognizing text') {
        document.getElementById('progress-fill').style.width = Math.round(m.progress * 100) + '%';
      }
    }
  });
  await w.setParameters({ tessedit_pageseg_mode: '6' });
  ocrWorker = w;
  return w;
}

function preprocessCanvas(src) {
  const dst = document.createElement('canvas');
  dst.width = src.width; dst.height = src.height;
  const ctx = dst.getContext('2d');
  ctx.filter = 'grayscale(100%) contrast(180%) brightness(108%)';
  ctx.drawImage(src, 0, 0);
  return dst;
}

async function pdfPageToCanvas(page) {
  const viewport = page.getViewport({ scale: 3 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width; canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  return preprocessCanvas(canvas);
}

async function imageFileToCanvas(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

function showProgress(pct, text) {
  document.getElementById('ocr-progress').classList.add('active');
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-text').textContent = text;
}

function hideProgress() { document.getElementById('ocr-progress').classList.remove('active'); }

async function ocrPDF(arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  const worker = await getOCRWorker();
  let fullText = '';
  for (let i = 1; i <= numPages; i++) {
    showProgress(Math.round((i - 1) / numPages * 100), `OCR page ${i}/${numPages}...`);
    const page = await pdf.getPage(i);
    const canvas = await pdfPageToCanvas(page);
    const { data: { text } } = await worker.recognize(canvas);
    fullText += text + '\n';
  }
  showProgress(100, 'Parsing receipt...');
  lastOCRText = fullText;
  return fullText;
}

async function ocrImage(file) {
  showProgress(10, `Chargement de ${file.name}...`);
  const raw = await imageFileToCanvas(file);
  const canvas = preprocessCanvas(raw);
  showProgress(30, 'Reconnaissance du texte...');
  const worker = await getOCRWorker();
  const { data: { text } } = await worker.recognize(canvas);
  showProgress(100, 'Parsing receipt...');
  lastOCRText = text;
  return text;
}

function showDebugModal() {
  if (!lastOCRText) { alert('Aucun texte OCR disponible — charge d\'abord un ticket.'); return; }
  const existing = document.getElementById('ocr-modal');
  if (existing) { existing.remove(); return; }
  const modal = document.createElement('div');
  modal.id = 'ocr-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:24px';
  modal.innerHTML = `
    <div style="background:#faf8f5;border:1px solid #d8d0c8;border-radius:10px;width:100%;max-width:760px;max-height:90vh;display:flex;flex-direction:column">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #e0d8d0">
        <span style="font-weight:500;font-size:.9rem;color:#2d2820">Texte brut OCR — ${lastOCRText.split('\n').length} lignes</span>
        <div style="display:flex;gap:8px">
          <button onclick="navigator.clipboard.writeText(lastOCRText).then(()=>this.textContent='Copié ✓').catch(()=>{})" style="padding:5px 12px;border-radius:5px;border:1px solid #c27a46;background:#fdf0e8;color:#c27a46;cursor:pointer;font-size:.8rem">Copier</button>
          <button onclick="document.getElementById('ocr-modal').remove()" style="padding:5px 12px;border-radius:5px;border:1px solid #d8d0c8;background:transparent;color:#8a7e72;cursor:pointer;font-size:.8rem">Fermer</button>
        </div>
      </div>
      <textarea readonly style="flex:1;background:#f5f2ef;color:#3a3530;font-family:monospace;font-size:.78rem;padding:16px;border:none;outline:none;resize:none;line-height:1.6;overflow-y:auto">${lastOCRText.replace(/</g,'&lt;')}</textarea>
    </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

async function handleFiles(fileList) {
  const files = Array.from(fileList).filter(f =>
    f.type === 'application/pdf' || f.name.endsWith('.pdf') || isImageFile(f)
  );
  if (!files.length) return;

  document.getElementById('add-btn').disabled = true;
  document.getElementById('add-btn').textContent = '⏳ Traitement...';

  for (let fi = 0; fi < files.length; fi++) {
    const file = files[fi];
    showProgress(0, `Processing ${file.name} (${fi + 1}/${files.length})...`);
    try {
      const text = (file.type === 'application/pdf' || file.name.endsWith('.pdf'))
        ? await ocrPDF(await file.arrayBuffer())
        : await ocrImage(file);

      const receipt = parseReceiptText(text);
      receipt.filename = file.name;

      const dup = receipts.find(r => r.label === receipt.label && Math.abs(r.total - receipt.total) < 2);
      if (!dup && receipt.items.length > 0) {
        receipts.push(receipt);
        receipts.sort((a, b) => (a.date || 0) - (b.date || 0));
        await saveState();
      }
    } catch (e) {
      console.error('Failed to process', file.name, e);
    }
  }

  hideProgress();
  document.getElementById('add-btn').disabled = false;
  document.getElementById('add-btn').textContent = 'Ajouter un reçu';
  document.getElementById('file-input').value = '';
  renderAll();
}
