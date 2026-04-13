#!/bin/bash
# ReceiptLens — Deploy to GitHub Pages
# Run this once to create the repo and enable GitHub Pages.
# Prerequisites: gh CLI installed and authenticated (brew install gh && gh auth login)

REPO_NAME="receipt-lens"
GITHUB_USER="Lowess"

echo ""
echo "  🧾 Deploying ReceiptLens to GitHub Pages..."
echo ""

# Create the repo (public, so GitHub Pages works on free plan)
gh repo create "$GITHUB_USER/$REPO_NAME" --public --description "Visual grocery receipt analyser with in-browser OCR" --homepage "https://$GITHUB_USER.github.io/$REPO_NAME" 2>/dev/null || echo "Repo may already exist, continuing..."

# Set up git
git add index.html serve.sh .gitignore deploy.sh
git commit -m "Initial commit: ReceiptLens receipt analyser

Single-file web app with in-browser OCR (Tesseract.js), donut/bar/trend
charts (Chart.js), category tracking, alcohol monitoring, and fuzzy search."

git branch -M main
git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git" 2>/dev/null || git remote set-url origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"
git push -u origin main

# Enable GitHub Pages on the main branch
gh api repos/$GITHUB_USER/$REPO_NAME/pages -X POST -f "build_type=legacy" -f "source[branch]=main" -f "source[path]=/" 2>/dev/null || echo "Pages may already be enabled."

echo ""
echo "  ✅ Done! Your app will be live at:"
echo "     https://$GITHUB_USER.github.io/$REPO_NAME"
echo ""
echo "  (It may take 1-2 minutes for GitHub Pages to build)"
