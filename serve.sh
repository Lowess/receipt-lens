#!/bin/bash
# ReceiptLens — local server launcher
# OCR requires HTTP (not file://) to load web workers.
# Run this script, then open http://localhost:8000

PORT=8001
echo ""
echo "  🧾 ReceiptLens starting on http://localhost:$PORT"
echo "     Press Ctrl+C to stop."
echo ""

# Try python3 first, then python, then npx serve
if command -v python3 &>/dev/null; then
  python3 -m http.server $PORT
elif command -v python &>/dev/null; then
  python -m http.server $PORT
elif command -v npx &>/dev/null; then
  npx serve . -l $PORT
else
  echo "Error: No suitable server found. Install Python or Node.js."
  exit 1
fi
