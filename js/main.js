// ==============================================================
// INIT
// ==============================================================
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

if (location.protocol === 'file:') {
  const banner = document.createElement('div');
  banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:999;background:#faf8f5;border-top:1px solid #d8d0c8;padding:14px 32px;display:flex;align-items:center;justify-content:space-between;gap:16px;font-size:.86rem;font-family:IBM Plex Sans,system-ui,sans-serif';
  banner.innerHTML = `
    <div>
      <strong style="color:#2d2820">Serveur local requis pour l'OCR.</strong>
      <span style="color:#8a7e72"> Ouvrez un terminal dans ce dossier et lancez :</span>
    </div>
    <div style="display:flex;gap:8px;flex-shrink:0">
      <button onclick="navigator.clipboard.writeText('python3 -m http.server 8000');this.textContent='Copié ✓'" style="padding:5px 12px;border-radius:5px;border:1px solid #c27a46;background:#fdf0e8;color:#c27a46;cursor:pointer;font-size:.8rem">python3 -m http.server 8000</button>
      <button onclick="navigator.clipboard.writeText('npx serve .');this.textContent='Copié ✓'" style="padding:5px 12px;border-radius:5px;border:1px solid #c27a46;background:#fdf0e8;color:#c27a46;cursor:pointer;font-size:.8rem">npx serve .</button>
      <span style="color:#8a7e72;align-self:center">puis ouvrez <b style="color:#2d2820">localhost:8000</b></span>
    </div>`;
  document.body.appendChild(banner);
}

(async () => {
  await DB.open();
  await loadState();
  await loadBudgets();
  renderAll();
})();
