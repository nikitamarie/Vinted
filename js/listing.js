// Text- & Preis-Generator (regelbasiert, offline, 0 €).
import { CATEGORIES, CONDITIONS, BRAND_TIERS, CONDITION_FACTOR, RETAIL_SHARE, SYNONYMS, TEXT_HINTS, seasonFor } from './data.js';

const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const clean = s => (s || '').toString().trim().replace(/\s+/g, ' ');

export function categoryFromText(text) {
  if (!text) return null;
  for (const [id, re] of Object.entries(TEXT_HINTS)) if (re.test(text)) return id;
  return null;
}

export function brandTier(brand) {
  const b = clean(brand).toLowerCase();
  if (!b) return 'standard';
  for (const [tier, { list }] of Object.entries(BRAND_TIERS)) if (list.some(x => b === x || b.startsWith(x + ' '))) return tier;
  return 'standard';
}

function nice(x) {
  if (x < 3) return Math.max(1, Math.round(x * 2) / 2);
  if (x < 20) return Math.round(x);
  if (x < 100) return Math.round(x / 5) * 5 - (Math.round(x / 5) * 5 >= 25 ? 1 : 0); // 24, 29, 34 …
  return Math.round(x / 10) * 10 - 1;
}

export function estimatePrice(catId, d) {
  const cat = CATEGORIES[catId] || CATEGORIES.other;
  const cond = d.condition || 'vgood';
  const tier = brandTier(d.brand);
  const retail = parseFloat(String(d.retail || '').replace(',', '.'));
  let lo, hi, basis;
  if (retail > 0) {
    const share = (RETAIL_SHARE[catId] || RETAIL_SHARE.default)[cond];
    let mid = retail * share;
    if (catId === 'electronics' && d.age) mid *= Math.pow(0.85, Math.min(8, parseFloat(d.age) || 0));
    if (tier === 'luxury') mid *= 1.25;
    lo = mid * 0.85; hi = mid * 1.15;
    basis = `Basis: Neupreis ${retail.toFixed(0)} € × Zustand „${CONDITIONS.find(c => c.id === cond).label}“`;
  } else {
    const tf = tier === 'standard' ? 1 : BRAND_TIERS[tier].f;
    const cf = CONDITION_FACTOR[cond];
    lo = cat.base[0] * tf * cf; hi = cat.base[1] * tf * cf;
    basis = `Basis: Durchschnitt ${cat.label}, Marke ${tier === 'standard' ? 'Standard' : tier === 'premium' ? 'Premium' : tier === 'luxury' ? 'Luxus' : 'Budget'}, Zustand`;
  }
  const min = nice(lo), max = Math.max(nice(hi), min + 1);
  const start = nice(max * 1.12);
  return { min, max, start, tier, basis };
}

function fieldValue(cat, key, d) {
  const f = cat.fields.find(x => x.key === key);
  const v = clean(d[key]);
  if (!v) return '';
  return f && f.title ? f.title(v) : v;
}

export function buildTitle(catId, d) {
  const cat = CATEGORIES[catId] || CATEGORIES.other;
  const seen = new Set();
  const parts = [];
  for (const key of cat.title) {
    let v = fieldValue(cat, key, d);
    if (key === 'type' || key === 'style' || key === 'color') v = cap(v);
    if (!v) continue;
    // Doppelte Wörter vermeiden (z. B. "Nike Nike Air")
    const words = v.split(' ').filter(w => !seen.has(w.toLowerCase()));
    words.forEach(w => seen.add(w.toLowerCase()));
    if (words.length) parts.push(words.join(' '));
  }
  if (!parts.length) parts.push(cap(clean(d.type)) || cat.label);
  let t = parts.join(' ');
  if (catId === 'books' && d.bookTitle) t = [clean(d.bookTitle), d.author ? `– ${clean(d.author)}` : '', d.format ? `(${clean(d.format)})` : ''].filter(Boolean).join(' ');
  if (d.condition === 'nwt') t += cat.wearable ? ' NEU mit Etikett' : ' NEU OVP';
  else if (d.condition === 'nwot') t += ' NEU';
  if (catId === 'electronics' && d.tested && !/neu/i.test(t)) t += ' – funktioniert';
  if (catId === 'toys' && d.complete) t += ' vollständig';
  return t.length > 70 ? t.slice(0, 70).replace(/\s+\S*$/, '') : t;
}

function slug(s) {
  return clean(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9äöüß]/g, '');
}

export function buildKeywords(catId, d) {
  const type = clean(d.type).toLowerCase();
  const syn = SYNONYMS[type] || [];
  const season = seasonFor(new Date().getMonth(), catId, type);
  return { syn: syn.slice(0, 3), season };
}

export function buildHashtags(catId, d) {
  const cat = CATEGORIES[catId] || CATEGORIES.other;
  const { syn, season } = buildKeywords(catId, d);
  const raw = [d.brand, d.type, ...(syn.slice(0, 1)), d.color, d.style, season, cat.tags[0]];
  const out = [];
  for (const r of raw) { const s = slug(r); if (s && s.length > 1 && !out.includes(s)) out.push(s); }
  return out.slice(0, 6).map(s => '#' + s);
}

export function buildDescription(catId, d, opts = {}) {
  const cat = CATEGORIES[catId] || CATEGORIES.other;
  const cond = CONDITIONS.find(c => c.id === (d.condition || 'vgood'));
  const wear = cat.wearable ? cond.wear : cond.use;
  const type = cap(clean(d.type)) || cat.label;
  const brand = clean(d.brand);
  const L = [];

  // 1. Hook-Satz: Was ist es + wichtigstes Merkmal + Zustand
  const color = clean(d.color);
  let hook = type + (color ? ` in ${cap(color)}` : '');
  if (brand) hook += ` von ${brand}`;
  if (catId === 'books' && d.bookTitle) hook = `„${clean(d.bookTitle)}“${d.author ? ' von ' + clean(d.author) : ''}`;
  if (d.size && cat.wearable) hook += ` in Größe ${clean(d.size)}`;
  L.push(`${hook} – ${wear}.`);
  L.push('');

  // 2. Fakten-Liste (scannbar)
  const facts = [];
  for (const f of cat.fields) {
    if (f.type === 'check') continue;
    const v = clean(d[f.key]);
    const label = f.key === 'brand' && cat.brandLabel ? cat.brandLabel : f.label;
    if (v) facts.push(`✔️ ${label}: ${v}`);
    else if (['measures', 'size', 'material', 'contents', 'model'].includes(f.key)) facts.push(`✔️ ${label}: [bitte ergänzen]`);
  }
  facts.push(`✔️ Zustand: ${cond.label}`);
  if (catId === 'electronics') facts.push(d.tested ? '✔️ Funktion: getestet, funktioniert einwandfrei' : '✔️ Funktion: [getestet? bitte ergänzen]');
  if (catId === 'toys') facts.push(d.complete ? '✔️ Vollständig: ja' : '✔️ Vollständig: [bitte prüfen]');
  L.push(...facts);
  L.push('');

  // 3. Ehrliche Mängel
  const flaws = clean(d.flaws);
  if (flaws) L.push(`ℹ️ Hinweis: ${flaws} (siehe Fotos).`);
  else if (['good', 'ok'].includes(d.condition)) L.push('ℹ️ Gebrauchsspuren: [bitte konkret beschreiben] – alles auf den Fotos zu sehen.');
  else L.push('ℹ️ Keine Mängel bekannt – alle Details auf den Fotos.');
  if (opts.aiImage) L.push('🖼️ Hinweis: Das Tragebild ist eine KI-Visualisierung. Farbe/Schnitt bitte anhand der echten Fotos beurteilen.');

  // 4. Vertrauen & Abschluss
  const home = [];
  if (d.smokeFree) home.push('Nichtraucherhaushalt');
  if (d.petFree) home.push('tierfreier Haushalt');
  if (home.length) L.push(`🏠 ${home.join(', ')}.`);
  L.push('📦 Versand schnell & sorgfältig verpackt.');
  L.push('💬 Fragen gern per Nachricht – bei mehreren Artikeln gibt es Bundle-Rabatt!');

  // 5. Suchbegriffe (moderat, nur passende)
  if (opts.keywords !== false) {
    const tags = buildHashtags(catId, d);
    if (tags.length) { L.push(''); L.push(tags.join(' ')); }
  }
  return L.join('\n');
}

export function buildAll(catId, d, opts) {
  return {
    title: buildTitle(catId, d),
    description: buildDescription(catId, d, opts),
    hashtags: buildHashtags(catId, d),
    price: estimatePrice(catId, d),
  };
}

// Prompt für kostenlose KI-Chats (ChatGPT/Gemini/Claude Free) – mit Fotos dort anhängen.
export function buildAiPrompt(catId, d, generated) {
  const cat = CATEGORIES[catId] || CATEGORIES.other;
  const facts = Object.entries(d).filter(([, v]) => v && typeof v !== 'object').map(([k, v]) => `- ${k}: ${v}`).join('\n');
  return `Du bist Vinted-Verkaufsprofi. Ich hänge Fotos meines Artikels an (Kategorie: ${cat.label}).
Bitte prüfe die Fotos und verbessere meine Anzeige:
1) Titel (max. 60 Zeichen, Marke + Artikel + wichtigstes Merkmal + Größe, kein Keyword-Stuffing, keine fremden Markennamen)
2) Beschreibung (kurz, scannbar, ehrlicher Zustand, sichtbare Mängel aus den Fotos benennen, Platzhalter für fehlende Maße)
3) 3–5 passende Suchbegriffe
4) Realistische Preisspanne in € für Vinted Deutschland + Startpreis
Erfinde keine Details, die nicht auf den Fotos/Angaben sichtbar sind.

Meine Angaben:
${facts}

Mein Entwurf:
Titel: ${generated.title}
${generated.description}`;
}
