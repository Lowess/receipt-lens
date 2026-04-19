// ==============================================================
// CATEGORIES & CONSTANTS
// ==============================================================
const CATEGORIES = {
  'Bébé':             { color:'#f472b6', icon:'🍼', keywords:['babybio','boudoir','blediscuit','bonne nuit','assiette carotte','assiette patate douce','bol leg','ass legume','legumes vt riz babybio','legumes vt dinde','haricots vt dinde babybio','pt legumes agneau','pt legumes saumon','pt plat plet','pt plat legumes saumon','navet pt ps canard','gourde brasse','grde pom','grde panache'] },
  'Fruits & Légumes': { color:'#34d399', icon:'🥦', section:'FRUIT ET LEGUMES' },
  'Viande':           { color:'#f87171', icon:'🥩', section:'BOUCHERIE' },
  'Volailles':        { color:'#fb923c', icon:'🍗', section:'VOLAILLES' },
  'Charcuterie':      { color:'#c084fc', icon:'🥓', section:'CHARCUTERIE' },
  'Poissonnerie':     { color:'#38bdf8', icon:'🐟', section:'POISSONNERIE' },
  'Crémerie':         { color:'#fbbf24', icon:'🧀', section:'CREMERIE' },
  'Épicerie':         { color:'#a78bfa', icon:'🥫', section:'EPICERIE' },
  'Boissons':         { color:'#2dd4bf', icon:'🥤', section:'LIQUIDE' },
  'Alcool':           { color:'#e11d48', icon:'🍷', keywords:['biere','beer','ipa','blonde','triple','prestige','bush','anosteke','brewdog','feuillien','page 24','hildegarde','tandem','mouillee','mionetto','prosecco','champagne','vin ','wine','cidre','whisky','vodka','rhum','pastis','aperol','ricard'] },
  'Friandises':       { color:'#f9a8d4', icon:'🍬', keywords:['bonbon','haribo','dragibus','tagada','chamallow','guimauve','marshmallow','caramel','réglisse','reglisse','chupa','tic tac','mentos','kinder','ferrero','nutella','praline','pralinoise','chocolat','tablette choco','barre choco','snickers','twix','kit kat','kitkat','bounty','mars bar','lion bar','m&m','smarties','skittles','carambars','carambar','croqu\'tel','boudoir','speculoos','pim\'s','pims','pepito','prince','granola','lu ','mikado','oreo','chips choco','galette choco','madeleine','cake','financier','biscuit choco','cookie','waffle','gaufre','sucette','lollipop','sherbet','fizz ','sour'] },
  'Hygiène & Maison': { color:'#94a3b8', icon:'🧹', section:'DPH' },
};

const CATEGORY_ORDER = Object.keys(CATEGORIES);
const FOOD_CATEGORIES = CATEGORY_ORDER.filter(c => c !== 'Hygiène & Maison');
const ALCOHOL_KW = CATEGORIES['Alcool'].keywords;

const MONTH_NAMES = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MONTH_SHORT  = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
