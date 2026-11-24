// Stammdaten: Kategorien, Felder, Preise, Checklisten, Erkennungs-Mappings.
// Alles lokal – keine Server, keine Kosten.

export const CONDITIONS = [
  { id: 'nwt', label: 'Neu mit Etikett', wear: 'neu und ungetragen, Originaletikett ist noch dran', use: 'neu und unbenutzt, originalverpackt' },
  { id: 'nwot', label: 'Neu ohne Etikett', wear: 'neu und nie getragen, ohne Etikett', use: 'neu und unbenutzt, ohne Originalverpackung' },
  { id: 'vgood', label: 'Sehr gut', wear: 'kaum getragen, keine sichtbaren Mängel', use: 'kaum benutzt, keine sichtbaren Mängel' },
  { id: 'good', label: 'Gut', wear: 'getragen mit leichten Gebrauchsspuren (siehe Fotos)', use: 'benutzt mit leichten Gebrauchsspuren (siehe Fotos)' },
  { id: 'ok', label: 'Zufriedenstellend', wear: 'deutlich getragen – Mängel siehe Fotos & Beschreibung', use: 'deutliche Gebrauchsspuren – Details siehe Fotos & Beschreibung' },
];

// Feld-Bausteine
const F = {
  brand: { key: 'brand', label: 'Marke', ph: 'z. B. Zara, Nike, Apple, IKEA' },
  type: { key: 'type', label: 'Artikel', ph: 'z. B. Strickpullover, Tischlampe' },
  color: { key: 'color', label: 'Farbe', ph: 'wird automatisch erkannt' },
  size: { key: 'size', label: 'Größe', ph: 'z. B. M, 38, 152', title: v => `Gr. ${v}` },
  shoeSize: { key: 'size', label: 'Größe (EU)', ph: 'z. B. 39', title: v => `Gr. ${v}` },
  fit: { key: 'fit', label: 'Passform / Schnitt', ph: 'z. B. oversized, slim, fällt normal aus' },
  material: { key: 'material', label: 'Material', ph: 'z. B. 100 % Baumwolle, Leder' },
  style: { key: 'style', label: 'Stil / Besonderheit', ph: 'z. B. Vintage, Y2K, Zopfmuster' },
  measures: { key: 'measures', label: 'Maße', ph: 'z. B. 30 × 20 × 10 cm' },
  garmentMeasures: { key: 'measures', label: 'Maße (flach gelegt)', ph: 'Achsel–Achsel __ cm, Länge __ cm' },
  insole: { key: 'measures', label: 'Innensohle', ph: 'z. B. 25 cm' },
  model: { key: 'model', label: 'Modell', ph: 'z. B. iPhone 12, Air Max 90' },
  specs: { key: 'specs', label: 'Speicher / Specs', ph: 'z. B. 128 GB, 4K, 1200 W' },
  contents: { key: 'contents', label: 'Lieferumfang', ph: 'z. B. Ladekabel, OVP, Anleitung' },
  tested: { key: 'tested', label: 'Funktion getestet ✔', type: 'check' },
  age: { key: 'age', label: 'Alter (Jahre)', ph: 'z. B. 2', type: 'number' },
  author: { key: 'author', label: 'Autor:in', ph: 'z. B. Sebastian Fitzek' },
  bookTitle: { key: 'bookTitle', label: 'Buchtitel', ph: 'z. B. Die Therapie' },
  format: { key: 'format', label: 'Format / Sprache', ph: 'z. B. Taschenbuch, Deutsch' },
  ageRange: { key: 'ageRange', label: 'Alter (Kinder)', ph: 'z. B. ab 3 Jahren' },
  complete: { key: 'complete', label: 'Vollständig ✔', type: 'check' },
  amount: { key: 'amount', label: 'Inhalt / Füllstand', ph: 'z. B. 50 ml, ca. 90 % voll' },
};

// base: Preisspanne [min,max] in € für Marke "Standard" + Zustand "Sehr gut"
export const CATEGORIES = {
  fashion: {
    label: 'Kleidung', icon: '👕', wearable: true, base: [8, 16],
    fields: [F.brand, F.type, F.size, F.color, F.material, F.fit, F.style, F.garmentMeasures],
    title: ['brand', 'type', 'style', 'color', 'size'],
    tags: ['mode', 'fashion'],
    checklist: ['Cover: ganzer Artikel, glatt, heller Hintergrund', 'Rückseite', 'Marken-Etikett', 'Größen- & Pflegeetikett (Material)', 'Nahaufnahme Stoff/Muster', 'Details (Knöpfe, Reißverschluss, Taschen)', 'Mängel ehrlich zeigen (Flecken, Pilling, Löcher)', 'Optional: Tragebild (am besten echt)'],
    hint: 'Maße flach gelegt messen: Achsel–Achsel und Länge – das reduziert Rückfragen & Retouren-Ärger.',
  },
  shoes: {
    label: 'Schuhe', icon: '👟', wearable: true, base: [12, 28],
    fields: [F.brand, F.model, F.type, F.shoeSize, F.color, F.material, F.insole],
    title: ['brand', 'model', 'type', 'color', 'size'],
    tags: ['schuhe', 'shoes'],
    checklist: ['Cover: beide Schuhe seitlich, schräg von vorne', 'Sohle / Profil', 'Innenseite & Innensohle', 'Größenetikett (Zunge/innen)', 'Ferse & Spitze', 'Mängel (Knicke, Abrieb, Verfärbung)', 'Box/OVP falls vorhanden'],
    hint: 'Innensohlen-Länge in cm angeben – Größen fallen je Marke unterschiedlich aus.',
  },
  bags: {
    label: 'Taschen & Accessoires', icon: '👜', wearable: false, base: [10, 25],
    fields: [F.brand, F.model, F.type, F.color, F.material, F.measures, F.contents],
    title: ['brand', 'model', 'type', 'color', 'material'],
    tags: ['tasche', 'accessoires'],
    checklist: ['Cover: Vorderseite frontal', 'Rückseite & Boden', 'Innenraum / Futter', 'Logo, Prägung, Seriennummer/Datecode', 'Henkel/Riemen & Ecken (Abrieb)', 'Hardware (Reißverschluss, Schnallen)', 'Staubbeutel/Rechnung falls vorhanden'],
    hint: 'Bei Designer-Artikeln: Echtheitsmerkmale fotografieren – Vinted bietet für teure Artikel eine (kostenpflichtige) Echtheitsprüfung für Käufer an.',
  },
  electronics: {
    label: 'Elektronik', icon: '🎮', wearable: false, base: [25, 70],
    fields: [F.brand, F.model, F.type, F.specs, F.color, F.contents, F.tested, F.age],
    title: ['brand', 'model', 'specs', 'color', 'type'],
    tags: ['elektronik', 'technik'],
    checklist: ['Cover: Gerät frontal, Display an (zeigt Funktion!)', 'Rückseite / Unterseite', 'Typenschild / Modellnummer', 'Anschlüsse & Ecken', 'Funktionstest (z. B. Einstellungen → Info, Akkuzustand)', 'Lieferumfang komplett nebeneinander', 'Kratzer/Mängel nah'],
    hint: 'Bei Handys/Tablets: vorher abmelden (iCloud/Google), auf Werkseinstellungen zurücksetzen und Akkuzustand angeben.',
  },
  home: {
    label: 'Haushalt & Küche', icon: '🍳', wearable: false, base: [5, 15],
    fields: [F.brand, F.type, F.color, F.material, F.measures, F.contents, F.tested],
    title: ['brand', 'type', 'material', 'color', 'measures'],
    tags: ['haushalt', 'küche'],
    checklist: ['Cover: Artikel komplett, ruhiger Hintergrund', 'Von allen Seiten', 'Unterseite / Marke / Stempel', 'Maßband im Bild (Größenvergleich)', 'Bei Elektro: eingeschaltet / in Funktion', 'Mängel (Kratzer, Chips, Kalk)'],
    hint: 'Ein Maßband im Bild schafft sofort Vertrauen bei Größe & Proportion.',
  },
  deco: {
    label: 'Wohnen & Deko', icon: '🪴', wearable: false, base: [6, 18],
    fields: [F.brand, F.type, F.style, F.color, F.material, F.measures],
    title: ['brand', 'type', 'style', 'color', 'material'],
    tags: ['deko', 'wohnen', 'interior'],
    checklist: ['Cover: freigestellt oder schön inszeniert', 'Detail / Struktur', 'Unterseite / Stempel / Marke', 'Größenvergleich (Hand, Maßband)', 'Lampe: einmal an, einmal aus', 'Mängel (Risse, Chips)'],
    hint: 'Ein zweites "Ambiente"-Foto (im Raum) steigert die Klickrate – Cover aber freigestellt/hell.',
  },
  books: {
    label: 'Bücher & Medien', icon: '📚', wearable: false, base: [3, 8],
    fields: [F.bookTitle, F.author, F.format, F.brand, F.style],
    title: ['bookTitle', 'author', 'format'],
    tags: ['buch', 'bücher', 'lesen'],
    checklist: ['Cover: Vorderseite gerade', 'Rückseite (Klappentext)', 'Buchrücken', 'Impressum / ISBN-Seite', 'Seitenschnitt / Zustand Seiten', 'Mängel (Knicke, Markierungen)'],
    hint: 'Mehrere Bücher eines Genres als Paket einstellen – Bücher verkaufen sich gern im Bundle.',
    brandLabel: 'Verlag',
  },
  toys: {
    label: 'Spielzeug & Kinder', icon: '🧸', wearable: false, base: [5, 15],
    fields: [F.brand, F.type, F.ageRange, F.color, F.complete, F.contents, F.measures],
    title: ['brand', 'type', 'ageRange', 'color'],
    tags: ['spielzeug', 'kinder'],
    checklist: ['Cover: komplettes Set aufgebaut', 'Alle Teile nebeneinander', 'Verpackung / Anleitung', 'Markenlogo', 'Batteriefach / Funktion', 'Mängel'],
    hint: 'Vollständigkeit ist bei Spielzeug das Kaufargument Nr. 1 – Teile zählen & erwähnen.',
  },
  sports: {
    label: 'Sport & Freizeit', icon: '⚽', wearable: true, base: [8, 22],
    fields: [F.brand, F.type, F.size, F.color, F.material, F.measures],
    title: ['brand', 'type', 'color', 'size'],
    tags: ['sport', 'fitness'],
    checklist: ['Cover: ganzer Artikel', 'Rückseite', 'Größen-/Etikett', 'Detailaufnahme', 'Mängel'],
    hint: 'Sportartikel saisonal einstellen (Ski ab Oktober, Fahrrad/Outdoor ab März).',
  },
  beauty: {
    label: 'Beauty', icon: '💄', wearable: false, base: [4, 12],
    fields: [F.brand, F.type, F.amount, F.color],
    title: ['brand', 'type', 'amount', 'color'],
    tags: ['beauty', 'kosmetik'],
    checklist: ['Cover: Produkt frontal', 'Füllstand sichtbar', 'Rückseite / Inhaltsstoffe / Charge', 'Verpackung'],
    hint: 'Vinted erlaubt nur bestimmte Kosmetik (meist neu/ungeöffnet) – prüfe die Vinted-Regeln für Beauty-Artikel.',
  },
  other: {
    label: 'Sonstiges', icon: '📦', wearable: false, base: [5, 15],
    fields: [F.brand, F.type, F.color, F.material, F.measures, F.contents],
    title: ['brand', 'type', 'color', 'material'],
    tags: ['secondhand'],
    checklist: ['Cover: Artikel komplett, heller Hintergrund', 'Von allen Seiten', 'Marke / Typenschild', 'Größenvergleich', 'Mängel'],
    hint: 'Je mehr Details & Maße, desto weniger Rückfragen.',
  },
};

// Markenstufen → Preisfaktor
export const BRAND_TIERS = {
  luxury: { f: 7, list: ['gucci', 'prada', 'louis vuitton', 'chanel', 'dior', 'hermès', 'hermes', 'balenciaga', 'saint laurent', 'ysl', 'bottega veneta', 'fendi', 'celine', 'loewe', 'burberry', 'moncler', 'versace', 'valentino', 'givenchy', 'miu miu', 'off-white', 'stone island', 'canada goose'] },
  premium: { f: 2, list: ['ralph lauren', 'polo ralph lauren', 'tommy hilfiger', 'calvin klein', 'hugo boss', 'boss', 'lacoste', 'levi\'s', 'levis', 'nike', 'adidas', 'new balance', 'converse', 'vans', 'puma', 'asics', 'dr. martens', 'birkenstock', 'ugg', 'the north face', 'patagonia', 'arc\'teryx', 'carhartt', 'diesel', 'g-star', 'michael kors', 'coach', 'guess', 'liebeskind', 'marc o\'polo', 'cos', 'arket', '& other stories', 'massimo dutti', 'apple', 'sony', 'samsung', 'nintendo', 'playstation', 'bose', 'dyson', 'kitchenaid', 'smeg', 'le creuset', 'wmf', 'lego', 'playmobil', 'barbie', 'hay', 'muuto', 'ferm living', 'villeroy & boch', 'rosenthal', 'jellycat', 'stanley'] },
  budget: { f: 0.6, list: ['primark', 'shein', 'kik', 'takko', 'c&a', 'h&m', 'h & m', 'new yorker', 'tally weijl', 'pimkie', 'clockhouse', 'temu', 'tedi', 'action', 'ernsting\'s family', 'ernstings family', 'no name', 'ohne marke'] },
};

export const CONDITION_FACTOR = { nwt: 1.6, nwot: 1.35, vgood: 1, good: 0.75, ok: 0.5 };
// Anteil vom Neupreis je Zustand (für "Originalpreis"-Rechnung)
export const RETAIL_SHARE = {
  default: { nwt: 0.6, nwot: 0.5, vgood: 0.38, good: 0.28, ok: 0.16 },
  electronics: { nwt: 0.8, nwot: 0.72, vgood: 0.6, good: 0.5, ok: 0.35 },
  books: { nwt: 0.55, nwot: 0.45, vgood: 0.38, good: 0.28, ok: 0.18 },
};

// ImageNet-Label (MobileNet) → Kategorie + deutscher Artikelname
// Reihenfolge innerhalb einer Kategorie ist egal; Teilstring-Matching auf className.
export const IMAGENET_MAP = [
  ['fashion', { 'jersey': 'T-Shirt', 'sweatshirt': 'Sweatshirt', 'cardigan': 'Strickjacke', 'suit': 'Anzug', 'jean': 'Jeans', 'miniskirt': 'Minirock', 'overskirt': 'Rock', 'hoopskirt': 'Rock', 'kimono': 'Kimono', 'abaya': 'Kleid', 'gown': 'Kleid', 'trench coat': 'Trenchcoat', 'fur coat': 'Mantel', 'lab coat': 'Mantel', 'poncho': 'Poncho', 'pajama': 'Pyjama', 'brassiere': 'BH', 'bikini': 'Bikini', 'maillot': 'Badeanzug', 'swimming trunks': 'Badeshorts', 'cloak': 'Umhang', 'apron': 'Schürze', 'stole': 'Schal', 'feather boa': 'Schal', 'sarong': 'Rock', 'military uniform': 'Uniform', 'sock': 'Socken', 'cowboy hat': 'Hut', 'sombrero': 'Hut', 'bonnet': 'Mütze', 'mitten': 'Handschuhe', 'bow tie': 'Fliege', 'windsor tie': 'Krawatte', 'vestment': 'Oberteil', 'bulletproof vest': 'Weste', 'wool': 'Strickpullover' }],
  ['shoes', { 'running shoe': 'Sneaker', 'sandal': 'Sandalen', 'loafer': 'Loafer', 'clog': 'Clogs', 'cowboy boot': 'Stiefel', 'shoe shop': 'Schuhe', 'sneaker': 'Sneaker' }],
  ['bags', { 'backpack': 'Rucksack', 'purse': 'Handtasche', 'mailbag': 'Umhängetasche', 'wallet': 'Geldbörse', 'sunglass': 'Sonnenbrille', 'necklace': 'Kette', 'umbrella': 'Regenschirm', 'plastic bag': 'Tasche', 'shopping basket': 'Korb' }],
  ['electronics', { 'laptop': 'Laptop', 'notebook': 'Laptop', 'desktop computer': 'PC', 'monitor': 'Monitor', 'screen': 'Bildschirm', 'television': 'Fernseher', 'cellular telephone': 'Smartphone', 'ipod': 'MP3-Player', 'remote control': 'Fernbedienung', 'joystick': 'Controller', 'mouse': 'Maus', 'computer keyboard': 'Tastatur', 'typewriter keyboard': 'Tastatur', 'hand-held computer': 'Tablet', 'modem': 'Router', 'loudspeaker': 'Lautsprecher', 'radio': 'Radio', 'tape player': 'Kassettenrekorder', 'cassette player': 'Kassettenrekorder', 'cd player': 'CD-Player', 'reflex camera': 'Spiegelreflexkamera', 'polaroid camera': 'Sofortbildkamera', 'digital watch': 'Smartwatch', 'digital clock': 'Digitaluhr', 'projector': 'Beamer', 'printer': 'Drucker', 'microphone': 'Mikrofon', 'game controller': 'Controller', 'hard disc': 'Festplatte' }],
  ['home', { 'coffee mug': 'Tasse', 'cup': 'Tasse', 'teapot': 'Teekanne', 'coffeepot': 'Kaffeekanne', 'frying pan': 'Pfanne', 'wok': 'Wok', 'dutch oven': 'Bräter', 'caldron': 'Topf', 'mixing bowl': 'Schüssel', 'soup bowl': 'Schüssel', 'plate': 'Teller', 'water bottle': 'Trinkflasche', 'water jug': 'Karaffe', 'pitcher': 'Krug', 'beer glass': 'Glas', 'goblet': 'Weinglas', 'measuring cup': 'Messbecher', 'ladle': 'Kelle', 'spatula': 'Pfannenwender', 'wooden spoon': 'Kochlöffel', 'strainer': 'Sieb', 'toaster': 'Toaster', 'microwave': 'Mikrowelle', 'espresso maker': 'Espressokocher', 'waffle iron': 'Waffeleisen', 'crock pot': 'Schongarer', 'vacuum': 'Staubsauger', 'iron': 'Bügeleisen', 'hand blower': 'Föhn', 'electric fan': 'Ventilator', 'space heater': 'Heizlüfter', 'bath towel': 'Handtuch', 'soap dispenser': 'Seifenspender', 'tray': 'Tablett', 'pot': 'Topf' }],
  ['deco', { 'table lamp': 'Tischlampe', 'lampshade': 'Lampe', 'candle': 'Kerze', 'vase': 'Vase', 'flowerpot': 'Blumentopf', 'quilt': 'Decke', 'pillow': 'Kissen', 'studio couch': 'Sofa', 'rocking chair': 'Schaukelstuhl', 'folding chair': 'Stuhl', 'desk': 'Schreibtisch', 'dining table': 'Tisch', 'wardrobe': 'Kleiderschrank', 'chiffonier': 'Kommode', 'bookcase': 'Regal', 'china cabinet': 'Vitrine', 'window shade': 'Rollo', 'shower curtain': 'Duschvorhang', 'wall clock': 'Wanduhr', 'analog clock': 'Uhr', 'hourglass': 'Sanduhr', 'doormat': 'Fußmatte', 'prayer rug': 'Teppich', 'theater curtain': 'Vorhang', 'basket': 'Korb' }],
  ['books', { 'book jacket': 'Buch', 'comic book': 'Comic', 'binder': 'Ordner', 'crossword puzzle': 'Rätselheft', 'menu': 'Heft', 'envelope': 'Briefumschläge' }],
  ['toys', { 'teddy': 'Kuscheltier', 'jigsaw puzzle': 'Puzzle', 'toyshop': 'Spielzeug', 'balloon': 'Spielzeug', 'yo-yo': 'Jo-Jo', 'pinwheel': 'Windrad', 'piggy bank': 'Spardose', 'crib': 'Kinderbett', 'cradle': 'Wiege', 'bassinet': 'Stubenwagen', 'rattle': 'Rassel' }],
  ['sports', { 'basketball': 'Basketball', 'soccer ball': 'Fußball', 'tennis ball': 'Tennisball', 'volleyball': 'Volleyball', 'rugby ball': 'Rugbyball', 'golf ball': 'Golfbälle', 'racket': 'Schläger', 'ski': 'Ski', 'dumbbell': 'Hantel', 'barbell': 'Hantel', 'mountain bike': 'Fahrrad', 'tricycle': 'Dreirad', 'crash helmet': 'Helm', 'football helmet': 'Helm', 'sleeping bag': 'Schlafsack', 'mountain tent': 'Zelt', 'paddle': 'Paddel', 'snorkel': 'Schnorchel' }],
  ['beauty', { 'lipstick': 'Lippenstift', 'lotion': 'Lotion', 'perfume': 'Parfum', 'face powder': 'Puder', 'hair spray': 'Haarspray', 'sunscreen': 'Sonnencreme', 'hair slide': 'Haarspange' }],
];

// Freitext-Erkennung (falls KI aus/offline): Wortstämme → Kategorie
export const TEXT_HINTS = {
  fashion: /(pullover|pulli|sweater|shirt|hemd|bluse|top|hoodie|jacke|mantel|parka|blazer|weste|kleid|rock|hose|jeans|leggings|shorts|jogger|cardigan|strick|anzug|overall|jumpsuit|body|bikini|badeanzug|schal|mütze|cap|hut|handschuh|socken|bh|dessous|pyjama|kimono|trikot|poncho|tunika|chino)/i,
  shoes: /(schuh|sneaker|stiefel|boots|sandale|pumps|loafer|ballerina|slipper|clog|espadrille|chucks|high heels|heels|mokassin|stiefelette|crocs)/i,
  bags: /(tasche|rucksack|clutch|shopper|geldbörse|portemonnaie|wallet|gürtel|sonnenbrille|uhr\b|armband|kette|ohrring|schmuck|ring\b|koffer|beutel)/i,
  electronics: /(iphone|handy|smartphone|tablet|ipad|laptop|macbook|notebook|konsole|playstation|ps[345]|xbox|switch|controller|kopfhörer|airpods|lautsprecher|kamera|monitor|tv\b|fernseher|tastatur|maus|smartwatch|watch|router|drucker|beamer|e-reader|kindle|ladegerät)/i,
  home: /(tasse|becher|teller|schüssel|topf|pfanne|besteck|glas|gläser|kanne|mixer|toaster|kaffeemaschine|wasserkocher|staubsauger|bügeleisen|föhn|handtuch|bettwäsche|küche|backform|dose|thermoskanne)/i,
  deco: /(lampe|leuchte|vase|kerze|kissen|decke|teppich|bild|poster|rahmen|spiegel|pflanze|topf|regal|stuhl|tisch|kommode|sofa|deko|figur|uhr|vorhang|korb)/i,
  books: /(buch|bücher|roman|comic|manga|krimi|thriller|kochbuch|ratgeber|dvd|blu-?ray|cd\b|vinyl|schallplatte|lp\b|zeitschrift)/i,
  toys: /(lego|playmobil|puppe|barbie|kuscheltier|plüsch|spielzeug|puzzle|brettspiel|spiel\b|baby|kinderwagen|duplo|holzspielzeug|tonie|hot wheels|bausteine)/i,
  sports: /(fahrrad|ski|snowboard|hantel|yoga|fitness|ball\b|schläger|helm|zelt|schlafsack|inliner|skateboard|surf|golf|tennis|laufschuh|wander)/i,
  beauty: /(parfum|parfüm|lippenstift|make-?up|creme|lotion|nagellack|mascara|foundation|palette|serum|shampoo|kosmetik)/i,
};

// Synonyme → mehr Suchtreffer (sparsam einsetzen!)
export const SYNONYMS = {
  'pullover': ['Pulli', 'Sweater', 'Strickpullover'], 'strickpullover': ['Pullover', 'Pulli', 'Strick'],
  'hoodie': ['Kapuzenpullover', 'Sweatshirt'], 'sweatshirt': ['Pullover', 'Sweater', 'Crewneck'],
  't-shirt': ['Shirt', 'Tee', 'Oberteil'], 'top': ['Oberteil', 'Shirt'], 'bluse': ['Oberteil', 'Hemdbluse'],
  'jeans': ['Denim', 'Hose'], 'hose': ['Pants', 'Trousers'], 'kleid': ['Dress', 'Sommerkleid'],
  'jacke': ['Übergangsjacke', 'Jacket'], 'mantel': ['Wintermantel', 'Coat'], 'strickjacke': ['Cardigan', 'Strick'],
  'sneaker': ['Turnschuhe', 'Sportschuhe', 'Schuhe'], 'stiefel': ['Boots', 'Stiefeletten'],
  'handtasche': ['Tasche', 'Bag', 'Schultertasche'], 'rucksack': ['Backpack', 'Tasche'],
  'smartphone': ['Handy', 'Phone'], 'laptop': ['Notebook'], 'controller': ['Gamepad'],
  'tischlampe': ['Lampe', 'Leuchte', 'Nachttischlampe'], 'vase': ['Blumenvase', 'Deko'],
  'kuscheltier': ['Plüschtier', 'Stofftier'], 'buch': ['Roman', 'Lesen'],
};

// Saison-Keywords nach Monat (0 = Januar)
export function seasonFor(month, catId, type = '') {
  const t = type.toLowerCase();
  const winterish = /(mantel|jacke|pullover|pulli|strick|hoodie|stiefel|boots|schal|mütze|handschuh|parka|ski|cardigan|sweat)/.test(t);
  const summerish = /(kleid|shorts|top|bikini|badeanzug|sandale|t-shirt|rock|leinen|sonnenbrille)/.test(t);
  if (!['fashion', 'shoes', 'sports', 'bags'].includes(catId)) return null;
  if (winterish && (month >= 8 || month <= 1)) return month >= 10 || month <= 1 ? 'Winter' : 'Herbst';
  if (summerish && month >= 2 && month <= 7) return month <= 4 ? 'Frühling' : 'Sommer';
  return null;
}
