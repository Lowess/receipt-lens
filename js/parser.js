// ==============================================================
// RECEIPT PARSER
// ==============================================================
function categorize(name, section) {
  const lower = name.toLowerCase();
  for (const kw of CATEGORIES['Bébé'].keywords) { if (lower.includes(kw)) return 'Bébé'; }
  for (const kw of CATEGORIES['Friandises'].keywords) { if (lower.includes(kw)) return 'Friandises'; }
  for (const kw of ALCOHOL_KW) { if (lower.includes(kw)) return 'Alcool'; }
  for (const [cat, conf] of Object.entries(CATEGORIES)) {
    if (conf.section && conf.section === section) return cat;
  }
  return 'Épicerie';
}

function isAlcohol(item) { return item.category === 'Alcool'; }

function cleanPrice(raw) {
  let s = raw.replace(/@/g, '0').replace(/,/g, '.').replace(/[;:'"]+$/g, '').replace(/[;:'"]+/g, '.');
  s = s.replace(/^[Ll]/, '1').replace(/^[Zz]/, '2').replace(/^[Oo]/, '0');
  s = s.replace(/([0-9])[sS]([0-9])/g, '$1.$2');
  s = s.replace(/[Oo]/g, '0');
  s = s.replace(/[^0-9.]/g, '');
  s = s.replace(/\.+$/, '');
  const dots = s.split('.').length - 1;
  if (dots > 1) { const parts = s.split('.'); s = parts.slice(0,-1).join('') + '.' + parts[parts.length-1]; }
  if (!s.includes('.') && s.length >= 3 && /^\d+$/.test(s)) { s = s.slice(0, -2) + '.' + s.slice(-2); }
  const val = parseFloat(s);
  return isNaN(val) ? 0 : Math.round(val * 100) / 100;
}

function parseReceiptText(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  let date = null, dateLabel = '';
  for (const line of lines) {
    const m1 = line.match(/(\d{1,2})\s+(janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[ée]cembre)\s+(\d{4})/i);
    if (m1) {
      const months = {janvier:0,fevrier:1,'février':1,mars:2,avril:3,mai:4,juin:5,juillet:6,aout:7,'août':7,septembre:8,octobre:9,novembre:10,decembre:11,'décembre':11};
      date = new Date(parseInt(m1[3]), months[m1[2].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')] ?? 0, parseInt(m1[1]));
      dateLabel = `${m1[1]} ${MONTH_SHORT[date.getMonth()]} ${m1[3]}`;
      break;
    }
    const m2 = line.match(/^(\d{2})\/(\d{2})\/(\d{2})\b/);
    if (m2 && !date) {
      date = new Date(2000 + parseInt(m2[3]), parseInt(m2[2]) - 1, parseInt(m2[1]));
      dateLabel = `${m2[1]} ${MONTH_SHORT[date.getMonth()]} 20${m2[3]}`;
    }
  }

  let currentSection = 'EPICERIE';
  const items = [];
  const seen = new Set();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^Total\s+\d+\s+articles/i.test(line)) break;
    const secMatch = line.match(/^>>\s*(.+)/);
    if (secMatch) { currentSection = secMatch[1].trim(); continue; }
    if (/^(Caisse|Bon immediat|Reste|CB\s|Code\s|LECLERC|de\s+\d|fermeture|TTC\s|CARTE|CIC|DEBIT|MONTANT|9{2}\d{10}|BONS DE|VINAIGRE BALSA.*1\.\d{2}$|LOT VOLVIC|2E\s|CONCOMBRE.*Lot|PAGE 24.*Lot|Total Bon|Avec la|TROPICANA.*euros|Vous venez|CUMUL|Ce CUMUL|Modalit|En \d{4}|grace|Merci|Vos vignettes|Solde|Exclusiv|PHOTO E|30%|sur L|avec le code|\*Offre|inclus|le logiciel|E\.Leclerc|impression|postaux|autre promotion|Généré|Ticket \d|contact|salouel|BRAVO|VOUS AVEZ|Rendez|application|pour faire|Super Jeu|découvrir|Votre acc|minutes|Jeu du|\*{4}|^\d{2}\s+\d{2}\s+\d{2}|^[A-Z]\d{5}|XXXXX|9B9E|No AUTO|\.{3})/i.test(line)) continue;
    if (/^[\d\s%]+$/.test(line)) continue;
    if (/^(Réagir|Parlez|anonyme|www\.|03\d{8}|L'échange|tout produit|d'origine|votre E|a l'accueil|Hors produits|sous-v)/i.test(line)) continue;

    const multMatch = line.match(/^(\d+)\s*[-—]?\s*X\s*(['\d.,@]+)€?\s+([\d.,@]+)\s*\d?\s*$/i);
    if (multMatch) {
      const qty = parseInt(multMatch[1], 10) || 1;
      const unitPrice = cleanPrice(multMatch[2]);
      const totalPrice = cleanPrice(multMatch[3]);
      const resolvedUnit = unitPrice > 0 ? unitPrice : (totalPrice / qty);
      const price = totalPrice > 0 ? totalPrice : resolvedUnit * qty;
      if (price > 0 && i > 0) {
        for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
          const prev = lines[j].trim();
          if (/^>>\s/.test(prev)) break;
          if (/^\d+\s*X\s/i.test(prev)) continue;
          const nameOnly = prev.replace(/\s+[A-Za-z@]?[\d.,@]+[.;:']?\s*\d?\s*$/, '').replace(/^\*\s*/, '').trim();
          if (nameOnly.length > 2 && !/^(Caisse|Bon |Reste|Total)/i.test(nameOnly)) {
            const key = nameOnly.substring(0, 20) + '|' + price;
            if (!seen.has(key)) {
              seen.add(key);
              items.push({ name: nameOnly, price, unitPrice: resolvedUnit, qty, section: currentSection, category: categorize(nameOnly, currentSection) });
            }
            break;
          }
        }
      }
      continue;
    }

    if (/^\d+\s*X\s*[\d.,]+€?\s*$/i.test(line)) continue;

    const itemMatch =
      line.match(/^(\*?\s*)(.+?)\s+([A-Za-z@]?[\d.,@]+[.;:']?)\s+\d{1,2}\s*$/) ||
      line.match(/^(\*?\s*)(.+?)\s+([A-Za-z@]?[\d.,@]{3,}[.;:']?)\s*$/);
    if (itemMatch) {
      const name = itemMatch[2].replace(/^\*\s*/, '').trim();
      const price = cleanPrice(itemMatch[3]);
      const alphaRatio = (name.match(/[A-Za-zÀ-ÿ]/g) || []).length / Math.max(name.length, 1);
      if (price >= 0.10 && price <= 500 && name.length > 2 && alphaRatio > 0.4) {
        const key = name.substring(0, 20) + '|' + price;
        if (!seen.has(key)) {
          seen.add(key);
          items.push({ name, price, unitPrice: price, qty: 1, section: currentSection, category: categorize(name, currentSection) });
        }
      }
    }
  }

  let subtotal = 0, discount = 0, amountPaid = 0;
  const totalMatch = text.match(/Total\s+\d+\s+articles\s+([\d.,]+)/i);
  if (totalMatch) subtotal = parseFloat(totalMatch[1].replace(',', '.'));
  else subtotal = items.reduce((s, it) => s + it.price, 0);

  const bonMatch = text.match(/Bon\s+immediat\s+([\d.,]+)/i);
  if (bonMatch) discount = parseFloat(bonMatch[1].replace(',', '.'));

  const resteMatch = text.match(/Reste\s+[àa]\s+payer\s+([\d.,]+)/i);
  if (resteMatch) amountPaid = parseFloat(resteMatch[1].replace(',', '.'));

  const total = amountPaid > 0 ? amountPaid : subtotal;

  return { date, dateLabel: dateLabel || 'Unknown', label: dateLabel || 'Unknown', total, subtotal, discount, items };
}
