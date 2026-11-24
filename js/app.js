import { CATEGORIES, CONDITIONS, measureHint, womenSizeHint } from './data.js';
import { buildAll, buildAiPrompt, categoryFromText, kidAgeRange } from './listing.js';
import { loadImage, toCanvas, hasTransparency, autoEnhance, sharpen, composeCutout, cropTo, canvasToBlob, dominantColor, BACKGROUNDS } from './imaging.js';

const $ = s => document.querySelector(s);
const el = (tag, attrs = {}, html = '') => { const e = document.createElement(tag); Object.assign(e, attrs); if (html) e.innerHTML = html; return e; };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- Persistenz (try/catch: privater Modus / volle Speicher) ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
};
const settings = Object.assign({ aiClassify: true, aiBg: true }, store.get('settings', {}));

// ---------- Zustand ----------
const state = {
  photos: [], // {id, file, thumb}
  cat: store.get('fashionPref', 'women'), catAuto: null, catManual: false,
  fields: {},
  aspect: store.get('aspect', '3:4'),
  bg: store.get('bg', 'studio'),
  outputs: [], // {blob, url, origUrl, name}
};

// ---------- UI-Aufbau ----------
function renderCatChips() {
  const box = $('#catChips'); box.innerHTML = '';
  for (const [id, c] of Object.entries(CATEGORIES)) {
    const b = el('button', { className: 'chip' + (id === state.cat ? ' on' : ''), type: 'button' }, `${c.icon} ${c.label}`);
    b.onclick = () => { state.catManual = true; if (c.fashion) store.set('fashionPref', id); setCategory(id); };
    box.appendChild(b);
  }
  $('#catHint').textContent = CATEGORIES[state.cat].hint;
  $('#tryonBox').hidden = !['women', 'fashion'].includes(state.cat);
  $('#kidsBox').hidden = state.cat !== 'kids';
}

function fieldHint(key) {
  const v = state.fields[key];
  if (key === 'size' && state.cat === 'kids') { const a = kidAgeRange(v); return a ? `≈ ${a}` : ''; }
  if (key === 'size' && state.cat === 'women') return womenSizeHint(v);
  return '';
}

function renderFields() {
  const cat = CATEGORIES[state.cat];
  const box = $('#fields'); box.innerHTML = '';
  // Schnellauswahl Artikeltyp (einhändig, ohne Tippen)
  if (cat.quickTypes) {
    const wrap = el('div', { className: 'field wide' });
    wrap.appendChild(el('span', {}, 'Schnellauswahl'));
    const row = el('div', { className: 'chips scroll' });
    for (const qt of cat.quickTypes) {
      const b = el('button', { type: 'button', className: 'chip' + (state.fields.type === qt ? ' on' : '') }, esc(qt));
      b.onclick = () => {
        state.fields.type = qt;
        if (state.cat === 'kids' && qt === 'Kleiderpaket' && !state.fields.bundle) state.fields.bundle = '10';
        saveDraft(); renderFields();
      };
      row.appendChild(b);
    }
    wrap.appendChild(row); box.appendChild(wrap);
  }
  for (const f of cat.fields) {
    const label = f.key === 'brand' && cat.brandLabel ? cat.brandLabel : f.label;
    if (f.type === 'check') {
      const l = el('label', { className: 'toggle field wide' });
      const i = el('input', { type: 'checkbox', checked: !!state.fields[f.key] });
      i.onchange = () => { state.fields[f.key] = i.checked; saveDraft(); };
      l.append(i, el('span', {}, esc(label)));
      box.appendChild(l);
      continue;
    }
    if (f.type === 'chips') {
      const wrap = el('div', { className: 'field wide' });
      wrap.appendChild(el('span', {}, esc(label)));
      const row = el('div', { className: 'chips' });
      for (const o of f.options) {
        const b = el('button', { type: 'button', className: 'chip sm' + (state.fields[f.key] === o ? ' on' : '') }, esc(o));
        b.onclick = () => { state.fields[f.key] = state.fields[f.key] === o ? '' : o; saveDraft(); renderFields(); };
        row.appendChild(b);
      }
      wrap.appendChild(row); box.appendChild(wrap);
      continue;
    }
    const l = el('label', { className: 'field' + (['measures', 'contents', 'type'].includes(f.key) ? ' wide' : '') });
    const ph = f.key === 'measures' && cat.fashion ? measureHint(state.fields.type) : (f.ph || '');
    const i = el('input', { value: state.fields[f.key] || '', placeholder: ph, inputMode: f.type === 'number' ? 'numeric' : 'text', autocapitalize: f.key === 'size' ? 'characters' : 'words' });
    i.dataset.key = f.key;
    const hint = el('small', { className: 'fhint' }, esc(fieldHint(f.key)));
    i.oninput = () => {
      state.fields[f.key] = i.value; saveDraft();
      hint.textContent = fieldHint(f.key);
      if (f.key === 'type') {
        const m = $('#fields input[data-key="measures"]');
        if (m && cat.fashion) m.placeholder = measureHint(i.value);
        if (!state.catManual) {
          const guess = categoryFromText(i.value);
          if (guess && guess !== state.cat && !(guess === 'fashion' && cat.fashion)) { setCategory(guess, true); $('#fields input[data-key="type"]')?.focus(); }
        }
      }
    };
    l.append(el('span', {}, esc(label)), i, hint);
    box.appendChild(l);
  }
}

function setCategory(id, keepFocus) {
  state.cat = id;
  renderCatChips(); renderFields();
  if (!keepFocus) saveDraft();
}

function renderCondition() {
  const s = $('#condition');
  s.innerHTML = CONDITIONS.map(c => `<option value="${c.id}">${c.label}</option>`).join('');
  s.value = state.fields.condition || 'vgood';
  s.onchange = () => { state.fields.condition = s.value; saveDraft(); };
}

function renderLookChips() {
  const a = $('#aspectChips'); a.innerHTML = '';
  for (const [v, l] of [['3:4', 'Hochformat 3:4'], ['4:5', '4:5'], ['1:1', 'Quadrat'], ['original', 'Original']]) {
    const b = el('button', { className: 'chip' + (state.aspect === v ? ' on' : ''), type: 'button' }, l);
    b.onclick = () => { state.aspect = v; store.set('aspect', v); renderLookChips(); };
    a.appendChild(b);
  }
  const g = $('#bgChips'); g.innerHTML = '';
  const sw = { original: 'linear-gradient(135deg,#c9b8a5,#7d8f86)', white: '#fff', studio: '#e9ebee', beige: '#eee4d7', sage: '#e1e8dd', blush: '#f1e3e3' };
  for (const [v, l] of [['original', 'Original'], ...Object.entries(BACKGROUNDS).map(([k, o]) => [k, o.label])]) {
    const b = el('button', { className: 'chip' + (state.bg === v ? ' on' : ''), type: 'button' }, `<span class="sw" style="background:${sw[v]}"></span>${l}`);
    b.onclick = () => {
      if (v !== 'original' && !settings.aiBg) toast('KI-Freistellen ist in „Strategie → Einstellungen“ deaktiviert. PNG mit Transparenz funktioniert trotzdem.');
      state.bg = v; store.set('bg', v); renderLookChips();
    };
    g.appendChild(b);
  }
}

// ---------- Fotos ----------
$('#fileInput').addEventListener('change', async e => {
  const files = [...e.target.files];
  e.target.value = '';
  if (!files.length) return;
  for (const file of files) {
    if (state.photos.length >= 20) { toast('Vinted erlaubt max. 20 Fotos.'); break; }
    state.photos.push({ id: crypto.randomUUID?.() || String(Math.random()), file, thumb: URL.createObjectURL(file) });
  }
  renderThumbs();
  if (state.photos.length && settings.aiClassify && !state.catManual && !state.catAuto) detectCategory();
});

function renderThumbs() {
  const box = $('#thumbs'); box.innerHTML = '';
  state.photos.forEach((p, i) => {
    const t = el('div', { className: 'thumb' });
    t.appendChild(el('img', { src: p.thumb, alt: `Foto ${i + 1}` }));
    const x = el('button', { className: 'x', type: 'button', ariaLabel: 'Entfernen' }, '✕');
    x.onclick = () => { URL.revokeObjectURL(p.thumb); state.photos.splice(i, 1); renderThumbs(); };
    t.appendChild(x);
    if (i === 0) t.appendChild(el('span', { className: 'cover' }, 'COVER'));
    else {
      const m = el('button', { className: 'mk', type: 'button' }, 'als Cover');
      m.onclick = () => { state.photos.unshift(state.photos.splice(i, 1)[0]); renderThumbs(); };
      t.appendChild(m);
    }
    box.appendChild(t);
  });
  const n = state.photos.length;
  $('#generateBtn').disabled = !n;
  const h = $('#photoHint');
  h.hidden = !n;
  h.textContent = n < 3 ? `${n} Foto(s) – tipp: 5–8 Fotos (Etikett, Rückseite, Details, Mängel) verkaufen deutlich besser.` : n > 12 ? `${n} Fotos – für iPhone-Akku & RAM lieber ≤ 12 verarbeiten.` : `${n} Fotos ✔`;
}

async function detectCategory() {
  const badge = $('#aiBadge');
  badge.hidden = false; badge.textContent = '🤖 erkenne…';
  try {
    const { classify } = await import('./ai.js');
    const img = await loadImage(state.photos[0].file);
    const c = toCanvas(img, 448);
    const r = await classify(c);
    state.catAuto = r;
    if (r.cat === 'fashion') r.cat = store.get('fashionPref', 'women'); // Damen/Kinder/Herren merkt sich die App
    if (r.cat && !state.catManual) {
      setCategory(r.cat);
      if (r.type && !state.fields.type) { state.fields.type = r.type; renderFields(); }
      badge.textContent = `🤖 ${CATEGORIES[r.cat].label} (${Math.round(Math.min(1, r.confidence) * 100)} %)`;
    } else badge.textContent = '🤖 unsicher – bitte wählen';
    // Farbe gleich mit vorschlagen
    if (!state.fields.color) { state.fields.color = dominantColor(c, hasTransparency(c)); renderFields(); }
  } catch (err) {
    console.warn(err);
    badge.textContent = 'offline – manuell wählen';
  }
}

// ---------- Verarbeitung ----------
let busy = false;
$('#generateBtn').addEventListener('click', generate);

async function generate() {
  if (busy || !state.photos.length) return;
  busy = true;
  $('#generateBtn').disabled = true;
  const result = $('#result');
  result.hidden = false;
  result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const prog = $('#progress'); prog.hidden = false;
  const setP = (frac, text) => { $('#progressBar').style.width = `${Math.round(frac * 100)}%`; $('#progressText').textContent = text; };
  state.outputs.forEach(o => URL.revokeObjectURL(o.url));
  state.outputs = [];
  $('#outGrid').innerHTML = '';
  const bgAll = $('#bgAll').checked, enh = $('#enhanceOn').checked, shp = $('#sharpenOn').checked;
  let bgFailed = false;

  for (let i = 0; i < state.photos.length; i++) {
    const p = state.photos[i];
    const base = i / state.photos.length, span = 1 / state.photos.length;
    setP(base, `Foto ${i + 1}/${state.photos.length} wird optimiert…`);
    await new Promise(r => setTimeout(r, 30)); // UI atmen lassen
    try {
      const img = await loadImage(p.file);
      let c = toCanvas(img);
      const transparent = hasTransparency(c);
      const wantBg = state.bg !== 'original' && (i === 0 || bgAll);
      let out;
      if (wantBg && (transparent || (settings.aiBg && !bgFailed))) {
        let cut = c;
        if (!transparent) {
          try {
            const { removeBackground } = await import('./ai.js');
            const small = toCanvas(c, 1280);
            const blob = await canvasToBlob(small, 'image/jpeg', 0.92);
            const cutBlob = await removeBackground(blob, (f, t) => setP(base + (f >= 0 ? f * span * 0.8 : span * 0.85), `Foto ${i + 1}: ${t}`));
            cut = toCanvas(await loadImage(cutBlob));
          } catch (err) {
            console.warn(err); bgFailed = true; cut = null;
            toast('Freistellen nicht möglich (offline/zu wenig RAM). Tipp: in iOS-Fotos Motiv lange drücken → als PNG sichern → hier hochladen.');
          }
        }
        if (cut) {
          if (enh) autoEnhance(cut, 0.8);
          out = composeCutout(cut, state.bg, state.aspect);
          if (shp) sharpen(out, 0.25);
          if (i === 0 && !state.fields.color) state.fields.color = dominantColor(cut, true);
        }
      }
      if (!out) {
        if (enh) autoEnhance(c);
        if (shp) sharpen(c);
        // Nur das Cover wird beschnitten – Detail-/Mängelfotos behalten ihren vollen Bildausschnitt
        out = cropTo(c, i === 0 ? state.aspect : 'original');
        if (i === 0 && !state.fields.color) state.fields.color = dominantColor(c, false);
      }
      const blob = await canvasToBlob(out, 'image/jpeg', 0.86);
      const name = `inserat-${String(i + 1).padStart(2, '0')}.jpg`;
      const o = { blob, url: URL.createObjectURL(blob), origUrl: p.thumb, name, file: new File([blob], name, { type: 'image/jpeg' }) };
      state.outputs.push(o);
      addOutput(o, i);
      c.width = c.height = 0; // RAM sofort freigeben (wichtig auf iOS)
    } catch (err) {
      console.error(err);
      toast(`Foto ${i + 1} konnte nicht verarbeitet werden.`);
    }
  }
  setP(1, 'Fertig ✔');
  setTimeout(() => { prog.hidden = true; }, 1200);
  renderFields();
  renderTexts();
  busy = false;
  $('#generateBtn').disabled = false;
}

function addOutput(o, i) {
  const fig = el('figure');
  const img = el('img', { src: o.url, alt: o.name });
  let showOrig = false;
  img.onclick = () => { showOrig = !showOrig; img.src = showOrig ? o.origUrl : o.url; cap.textContent = showOrig ? 'VORHER' : (i === 0 ? 'COVER' : `#${i + 1}`); };
  const cap = el('figcaption', {}, i === 0 ? 'COVER' : `#${i + 1}`);
  fig.append(img, cap);
  $('#outGrid').appendChild(fig);
}

// ---------- Texte ----------
function collect() {
  return { ...state.fields, condition: $('#condition').value, retail: $('#retail').value, flaws: $('#flaws').value, smokeFree: $('#smokeFree').checked, petFree: $('#petFree').checked };
}
let lastGen = null;
function renderTexts() {
  const d = collect();
  const g = buildAll(state.cat, d, { keywords: $('#keywordsOn').checked, aiImage: $('#aiImageNote').checked });
  lastGen = g;
  $('#outTitle').value = g.title; updateCount();
  $('#outDesc').value = g.description;
  const p = g.price;
  $('#priceBox').innerHTML = `
    <div class="out-head"><b>Preis-Einschätzung</b></div>
    <div class="big">${p.min}–${p.max} €</div>
    <div class="row"><span>Empfohlener Startpreis</span><b>${p.start} €</b></div>
    <div class="row"><span>Angebote annehmen ab</span><b>${p.min} €</b></div>
    <p class="hint">${esc(p.basis)}. Grobe Heuristik – vergleiche vor dem Einstellen 5–10 ähnliche Artikel in der Vinted-Suche (gleiche Marke, Größe, Zustand).${p.tier === 'luxury' ? ' Luxusartikel: Echtheitsnachweise (Rechnung, Seriennummer) fotografieren!' : ''}</p>`;
  const cl = $('#checklist'); cl.innerHTML = '';
  for (const item of CATEGORIES[state.cat].checklist) {
    const li = el('li'); const cb = el('input', { type: 'checkbox' });
    li.append(cb, el('span', {}, esc(item))); cl.appendChild(li);
  }
  saveHistory(g);
}
const updateCount = () => { const n = $('#outTitle').value.length; $('#titleCount').textContent = `${n} Zeichen${n > 60 ? ' · kürzer = besser' : ''}`; };
$('#outTitle').addEventListener('input', updateCount);
['keywordsOn', 'aiImageNote'].forEach(id => $('#' + id).addEventListener('change', () => { if (!$('#result').hidden) renderTexts(); }));

// ---------- Kopieren / Sichern ----------
async function copy(text) {
  try { await navigator.clipboard.writeText(text); }
  catch {
    const t = el('textarea', { value: text }); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove();
  }
  toast('Kopiert ✔');
}
document.addEventListener('click', e => { const b = e.target.closest('[data-copy]'); if (b) copy($('#' + b.dataset.copy).value); });
$('#copyAllBtn').onclick = () => copy(`${$('#outTitle').value}\n\n${$('#outDesc').value}`);
$('#promptBtn').onclick = () => { if (lastGen) { copy(buildAiPrompt(state.cat, collect(), { title: $('#outTitle').value, description: $('#outDesc').value })); toast('Prompt kopiert – in ChatGPT/Gemini/Claude (Free) einfügen + Fotos anhängen'); } };

$('#shareBtn').onclick = async () => {
  const files = state.outputs.map(o => o.file);
  if (!files.length) return;
  if (navigator.canShare && navigator.canShare({ files })) {
    try { await navigator.share({ files }); return; } // iOS: "X Bilder sichern"
    catch (err) { if (err.name === 'AbortError') return; }
  }
  // Fallback: einzeln herunterladen
  for (const o of state.outputs) { const a = el('a', { href: o.url, download: o.name }); document.body.appendChild(a); a.click(); a.remove(); await new Promise(r => setTimeout(r, 300)); }
  toast('Bilder geladen – oder Bild lange drücken → „Zu Fotos hinzufügen“');
};

$('#newBtn').onclick = () => {
  state.photos.forEach(p => URL.revokeObjectURL(p.thumb));
  state.outputs.forEach(o => URL.revokeObjectURL(o.url));
  Object.assign(state, { photos: [], outputs: [], fields: {}, catAuto: null, catManual: false });
  ['retail', 'flaws'].forEach(id => ($('#' + id).value = ''));
  $('#result').hidden = true; $('#aiBadge').hidden = true;
  store.set('draft', null);
  renderThumbs(); renderFields(); renderCondition();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ---------- Entwurf & Verlauf ----------
function saveDraft() { store.set('draft', { cat: state.cat, fields: state.fields }); }
function loadDraft() { const d = store.get('draft', null); if (d && CATEGORIES[d.cat]) { state.cat = d.cat; state.fields = d.fields || {}; } }

async function saveHistory(g) {
  let thumb = '';
  if (state.outputs[0]) {
    try { const c = toCanvas(await loadImage(state.outputs[0].blob), 120); thumb = c.toDataURL('image/jpeg', 0.6); } catch { /* egal */ }
  }
  const list = store.get('history', []);
  const entry = { id: Date.now(), date: new Date().toLocaleDateString('de-DE'), cat: state.cat, title: g.title, description: g.description, price: `${g.price.min}–${g.price.max} €`, thumb };
  if (list[0] && list[0].title === entry.title) list[0] = entry; else list.unshift(entry);
  while (list.length > 30) list.pop();
  if (!store.set('history', list)) { list.forEach(x => (x.thumb = '')); store.set('history', list); }
}
function renderHistory() {
  const box = $('#historyList'); box.innerHTML = '';
  const list = store.get('history', []);
  if (!list.length) { box.innerHTML = '<p class="hint">Noch keine Anzeigen erstellt.</p>'; return; }
  for (const h of list) {
    const row = el('div', { className: 'hist' });
    row.innerHTML = `<img src="${h.thumb || ''}" alt=""><div><b>${esc(h.title)}</b><small>${esc(h.date)} · ${esc(CATEGORIES[h.cat]?.label || '')} · ${esc(h.price)}</small><div class="acts"></div></div>`;
    const acts = row.querySelector('.acts');
    const b1 = el('button', { className: 'btn mini', type: 'button' }, 'Text kopieren'); b1.onclick = () => copy(`${h.title}\n\n${h.description}`);
    const b2 = el('button', { className: 'btn mini ghost', type: 'button' }, 'Löschen'); b2.onclick = () => { store.set('history', store.get('history', []).filter(x => x.id !== h.id)); renderHistory(); };
    acts.append(b1, b2); box.appendChild(row);
  }
}

// ---------- Tabs ----------
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === t));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + t.dataset.view));
  if (t.dataset.view === 'history') renderHistory();
  if (t.dataset.view === 'guide') showStorage();
  window.scrollTo({ top: 0 });
}));

// ---------- Einstellungen ----------
$('#setAiClassify').checked = settings.aiClassify;
$('#setAiBg').checked = settings.aiBg;
$('#setAiClassify').onchange = e => { settings.aiClassify = e.target.checked; store.set('settings', settings); };
$('#setAiBg').onchange = e => { settings.aiBg = e.target.checked; store.set('settings', settings); };
$('#clearCacheBtn').onclick = async () => {
  try { for (const k of await caches.keys()) if (k.includes('models')) await caches.delete(k); toast('KI-Modelle gelöscht'); showStorage(); } catch { toast('Nicht möglich'); }
};
async function showStorage() {
  try { const e = await navigator.storage.estimate(); $('#storageInfo').textContent = `Belegt durch diese App: ${(e.usage / 1e6).toFixed(0)} MB`; } catch { /* Safari alt */ }
}

// ---------- Toast ----------
let tt;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), msg.length > 60 ? 5000 : 2200); }

// ---------- Start ----------
loadDraft();
renderCatChips(); renderFields(); renderCondition(); renderLookChips(); renderThumbs();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
const net = () => { $('#netState').textContent = navigator.onLine ? '0 € · lokal' : 'offline · lokal'; };
addEventListener('online', net); addEventListener('offline', net); net();
try { navigator.storage?.persist?.(); } catch { /* optional */ }
