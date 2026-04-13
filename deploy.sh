#!/bin/bash
# ReceiptLens — Deploy to GitHub Pages
#
# First time:  ./deploy.sh --init
# After that:  ./deploy.sh

set -e

REPO_NAME="receipt-lens"
GITHUB_USER="Lowess"
REMOTE_URL="https://github.com/$GITHUB_USER/$REPO_NAME.git"
FILES="index.html serve.sh deploy.sh .gitignore README.md screenshot-overview.png screenshot-detail.png screenshot-trends.png"

# ── First-time setup ──────────────────────────────────────────────
if [[ "$1" == "--init" ]]; then
  echo ""
  echo "  🧾 Setting up ReceiptLens repo..."
  echo ""

  gh repo create "$GITHUB_USER/$REPO_NAME" \
    --public \
    --description "Visual grocery receipt analyser with in-browser OCR" \
    --homepage "https://$GITHUB_USER.github.io/$REPO_NAME" \
    2>/dev/null || echo "  Repo already exists, continuing..."

  git init -b main 2>/dev/null || true
  git remote add origin "$REMOTE_URL" 2>/dev/null \
    || git remote set-url origin "$REMOTE_URL"

  git add $FILES
  git commit -m "Initial commit — ReceiptLens receipt analyser"
  git push -u origin main

  gh api "repos/$GITHUB_USER/$REPO_NAME/pages" \
    -X POST \
    -f "build_type=legacy" \
    -f "source[branch]=main" \
    -f "source[path]=/" \
    2>/dev/null || echo "  Pages already enabled."

  echo ""
  echo "  ✅ Live at: https://$GITHUB_USER.github.io/$REPO_NAME"
  echo ""
  exit 0
fi

# ── Regular deploy (git add + commit + push) ──────────────────────
MSG="${1:-Update ReceiptLens}"

echo ""
echo "  🧾 Deploying ReceiptLens..."
echo ""

git add $FILES
git diff --cached --quiet && { echo "  Nothing to deploy."; exit 0; }
git commit -m "$MSG"
git push

echo ""
echo "  ✅ Pushed! Changes will be live in ~1 minute."
echo "     https://$GITHUB_USER.github.io/$REPO_NAME"
echo ""
