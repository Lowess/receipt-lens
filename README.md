# 🧾 ReceiptLens

A visual grocery receipt analyser that runs entirely in your browser. Drop a scanned PDF from **E.Leclerc** and instantly see where your money goes — no server, no upload, no account.

---

## Features

**In-browser OCR** — Tesseract.js reads scanned receipt PDFs and images directly in the browser. Nothing leaves your machine.

**Smart categorisation** — Items are automatically sorted into 12 categories: Bébé, Fruits & Légumes, Viande, Volailles, Charcuterie, Poissonnerie, Crémerie, Épicerie, Boissons, Alcool, Friandises, Hygiène & Maison.

**Dashboard** — KPI cards show total spent, average per receipt, latest receipt, and alcohol spend — with month-over-month comparison badges and budget alerts.

**Visual breakdown** — Donut chart shows category split at a glance. Stacked bar shows composition per receipt.

**Accordion receipt list** — Receipts grouped by month with collapsible sections. Real-time search and sort (by date or amount).

**Manual entry** — Add receipts by hand via a modal form when you don't have a PDF.

**Top items explorer** — See your most expensive items overall or filter by category. Expand to reveal the full list with a click-to-expand price history chart.

**Price tracker** — Track recurring items across receipts. See min / avg / max prices, inflation trend, sparkline history, and "nouveau bas prix" badge when the latest price is the lowest ever.

**Budget envelopes** — Set a monthly cap per category. Progress bars appear on the dashboard with over-budget warnings.

**Trend charts** — Category evolution over time, last-vs-previous receipt comparison, and total evolution bar chart.

**Food-only mode** — Toggle to exclude Hygiène & Maison and focus on food spend only.

**Fuzzy search** — Find any item instantly with typo-tolerant search across names and categories.

**Persistent storage** — Receipts saved in IndexedDB (auto-migrates from localStorage).

**Export** — Export all data as JSON or CSV, or print the current view as PDF.

---

## Quick start

```bash
# Clone and serve locally (OCR needs HTTP, not file://)
git clone https://github.com/Lowess/receipt-lens.git
cd receipt-lens
python3 -m http.server 8000
# Open http://localhost:8000
```

Then click **Ajouter un reçu**, pick a scanned E.Leclerc PDF or image, and wait for OCR to finish. Or use **Saisie manuelle** in the Reçus tab to enter a receipt by hand.

---

## Project structure

```
receipt-lens/
├── index.html          # HTML shell — layout, nav, modals
├── css/
│   └── styles.css      # Full design system (muji/paper aesthetic)
└── js/
    ├── config.js       # Categories, constants, month names
    ├── state.js        # App state variables
    ├── db.js           # IndexedDB persistence, CSV/JSON export
    ├── utils.js        # Fuzzy search helpers
    ├── parser.js       # Receipt text parser + categorisation
    ├── ocr.js          # Tesseract + PDF.js OCR pipeline
    ├── charts.js       # Chart.js rendering, sparklines
    ├── render.js       # DOM rendering — dashboard, accordion, prices, budget
    ├── ui.js           # Tab switching, modals, manual entry
    └── main.js         # Initialisation
```

No build step — all files are plain JS loaded via `<script src>` tags.

---

## Tech stack

| Layer | Library |
|-------|---------|
| OCR | [Tesseract.js v5](https://github.com/naptha/tesseract.js) — French (`fra`) language model |
| PDF rendering | [PDF.js 3.11](https://mozilla.github.io/pdf.js/) |
| Charts | [Chart.js 4.4](https://www.chartjs.org/) |
| Fonts | Newsreader · IBM Plex Sans · JetBrains Mono (Google Fonts) |
| Storage | IndexedDB |
| Hosting | GitHub Pages (static) |

---

## Deploy to GitHub Pages

```bash
# First time — creates the repo and enables Pages
./deploy.sh --init

# Subsequent deploys
./deploy.sh "Add new feature"
```

Your app will be live at `https://Lowess.github.io/receipt-lens`.

---

## License

MIT
