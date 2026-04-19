// ==============================================================
// FUZZY SEARCH
// ==============================================================
function fuzzyMatch(text, query) {
  if (!query) return true;
  text = text.toLowerCase(); query = query.toLowerCase();
  if (text.includes(query)) return true;
  let qi = 0;
  for (let ti = 0; ti < text.length && qi < query.length; ti++) { if (text[ti] === query[qi]) qi++; }
  return qi === query.length;
}

function fuzzyScore(text, query) {
  if (!query) return 0;
  text = text.toLowerCase(); query = query.toLowerCase();
  if (text === query) return 100;
  if (text.startsWith(query)) return 90;
  const idx = text.indexOf(query);
  if (idx >= 0) return 80 - idx;
  let qi = 0, score = 0, consecutive = 0;
  for (let ti = 0; ti < text.length && qi < query.length; ti++) {
    if (text[ti] === query[qi]) { qi++; consecutive++; score += consecutive * 2 + (ti < 5 ? 5 : 0); }
    else { consecutive = 0; }
  }
  return qi === query.length ? score : -1;
}
