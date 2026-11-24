// Bildverarbeitung komplett im Browser (Canvas) – kein Upload, 0 €.

export const MAX_EDGE = 1600; // genug für Vinted, schont iPhone-RAM

export async function loadImage(fileOrBlob) {
  const url = URL.createObjectURL(fileOrBlob);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img; // EXIF-Rotation wendet Safari automatisch an
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export function toCanvas(src, maxEdge = MAX_EDGE) {
  const w0 = src.naturalWidth || src.width, h0 = src.naturalHeight || src.height;
  const s = Math.min(1, maxEdge / Math.max(w0, h0));
  const c = document.createElement('canvas');
  c.width = Math.round(w0 * s); c.height = Math.round(h0 * s);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

export function hasTransparency(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let transparent = 0;
  for (let i = 3; i < data.length; i += 16) if (data[i] < 200) transparent++;
  return transparent / (data.length / 16) > 0.03;
}

// Auto-Tonwert, Weißabgleich, Gamma, leichte Sättigung – via LUT (schnell)
export function autoEnhance(canvas, strength = 1) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  const hist = new Uint32Array(256);
  let sr = 0, sg = 0, sb = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    const y = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) | 0;
    hist[y]++;
    if (y > 40 && y < 230) { sr += d[i]; sg += d[i + 1]; sb += d[i + 2]; n++; }
  }
  const total = hist.reduce((a, b) => a + b, 0) || 1;
  let acc = 0, lo = 0, hi = 255;
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc > total * 0.005) { lo = v; break; } }
  acc = 0;
  for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc > total * 0.005) { hi = v; break; } }
  lo = Math.min(lo, 45); hi = Math.max(hi, 210);
  // Weißabgleich (Gray-World, nur halb so stark → natürlich)
  const avg = n ? (sr + sg + sb) / (3 * n) : 128;
  const gain = c => Math.min(1.12, Math.max(0.88, 1 + ((n ? avg / (c / n) : 1) - 1) * 0.5 * strength));
  const gR = gain(sr), gG = gain(sg), gB = gain(sb);
  // Gamma: dunkle Fotos (typisch Innenraum) aufhellen
  let mean = 0;
  for (let v = 0; v < 256; v++) mean += v * hist[v];
  mean = (mean / total - lo) / Math.max(1, hi - lo);
  const gamma = mean < 0.45 ? Math.max(0.75, Math.log(0.5) / Math.log(Math.max(0.05, mean))) : 1;
  const g = 1 + (gamma - 1) * strength;
  const lut = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) {
    const t = Math.min(1, Math.max(0, (v - lo) / Math.max(1, hi - lo)));
    const stretched = Math.pow(t, g) * 255;
    lut[v] = v + (stretched - v) * strength;
  }
  const sat = 1 + 0.08 * strength;
  for (let i = 0; i < d.length; i += 4) {
    let r = lut[Math.min(255, d[i] * gR) | 0], gg = lut[Math.min(255, d[i + 1] * gG) | 0], b = lut[Math.min(255, d[i + 2] * gB) | 0];
    const y = r * 0.299 + gg * 0.587 + b * 0.114;
    d[i] = y + (r - y) * sat; d[i + 1] = y + (gg - y) * sat; d[i + 2] = y + (b - y) * sat;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

// Unscharf maskieren (3×3) – sanft, gegen weiche iPhone-Innenraumfotos
export function sharpen(canvas, amount = 0.35) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const w = canvas.width, h = canvas.height;
  const src = ctx.getImageData(0, 0, w, h);
  const out = ctx.createImageData(w, h);
  const s = src.data, o = out.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) { o[i] = s[i]; o[i + 1] = s[i + 1]; o[i + 2] = s[i + 2]; o[i + 3] = s[i + 3]; continue; }
      for (let c = 0; c < 3; c++) {
        const k = i + c;
        const blur = (s[k - 4] + s[k + 4] + s[k - w * 4] + s[k + w * 4]) / 4;
        o[k] = s[k] + (s[k] - blur) * amount * 2;
      }
      o[i + 3] = s[i + 3];
    }
  }
  ctx.putImageData(out, 0, 0);
  return canvas;
}

function alphaBBox(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const w = canvas.width, h = canvas.height;
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
    if (data[(y * w + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 <= x0 || y1 <= y0) return { x: 0, y: 0, w, h };
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

export const BACKGROUNDS = {
  white: { label: 'Weiß', paint: (ctx, w, h) => { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); } },
  studio: { label: 'Studio-Grau', paint: (ctx, w, h) => radial(ctx, w, h, '#fbfbfc', '#e4e6ea') },
  beige: { label: 'Warm-Beige', paint: (ctx, w, h) => radial(ctx, w, h, '#f8f3ec', '#e6dccd') },
  sage: { label: 'Salbei', paint: (ctx, w, h) => radial(ctx, w, h, '#f1f4ef', '#d9e1d5') },
  blush: { label: 'Rosé', paint: (ctx, w, h) => radial(ctx, w, h, '#fbf3f3', '#ecdcdc') },
};
function radial(ctx, w, h, inner, outer) {
  const g = ctx.createRadialGradient(w / 2, h * 0.42, w * 0.05, w / 2, h * 0.5, Math.max(w, h) * 0.75);
  g.addColorStop(0, inner); g.addColorStop(1, outer);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}

export function aspectSize(aspect, srcW, srcH) {
  const long = 1600;
  if (aspect === 'original') { const s = Math.min(1, long / Math.max(srcW, srcH)); return [Math.round(srcW * s), Math.round(srcH * s)]; }
  const [a, b] = aspect.split(':').map(Number);
  return a >= b ? [long, Math.round(long * b / a)] : [Math.round(long * a / b), long];
}

// Freigestellten Artikel auf ruhigen Hintergrund setzen (mit weichem Schatten)
export function composeCutout(cutout, bgKey, aspect) {
  const box = alphaBBox(cutout);
  const [W, H] = aspect === 'original' ? aspectSize('3:4', box.w, box.h) : aspectSize(aspect, box.w, box.h);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  (BACKGROUNDS[bgKey] || BACKGROUNDS.white).paint(ctx, W, H);
  const s = Math.min((W * 0.84) / box.w, (H * 0.84) / box.h);
  const dw = box.w * s, dh = box.h * s;
  const dx = (W - dw) / 2, dy = (H - dh) / 2 - H * 0.01;
  // Bodenschatten
  ctx.save();
  ctx.globalAlpha = 0.18;
  const sg = ctx.createRadialGradient(W / 2, dy + dh, 1, W / 2, dy + dh, dw * 0.5);
  sg.addColorStop(0, 'rgba(0,0,0,0.9)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sg;
  ctx.beginPath(); ctx.ellipse(W / 2, dy + dh, dw * 0.48, Math.max(8, dh * 0.035), 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // Weicher Schlagschatten
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.16)'; ctx.shadowBlur = Math.round(W * 0.03); ctx.shadowOffsetY = Math.round(W * 0.012);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(cutout, box.x, box.y, box.w, box.h, dx, dy, dw, dh);
  ctx.restore();
  return c;
}

// Normales Foto auf Seitenverhältnis zuschneiden (mittig, "cover")
export function cropTo(canvas, aspect) {
  if (aspect === 'original') return canvas;
  const [a, b] = aspect.split(':').map(Number);
  const target = a / b, cur = canvas.width / canvas.height;
  let sw = canvas.width, sh = canvas.height;
  if (cur > target) sw = Math.round(sh * target); else sh = Math.round(sw / target);
  const sx = Math.round((canvas.width - sw) / 2), sy = Math.round((canvas.height - sh) / 2);
  const c = document.createElement('canvas');
  c.width = sw; c.height = sh;
  c.getContext('2d').drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
  return c;
}

export function canvasToBlob(canvas, type = 'image/jpeg', q = 0.86) {
  return new Promise(res => canvas.toBlob(res, type, q));
}

// Dominante Farbe → deutscher Farbname (für Titel & Filter)
export function dominantColor(canvas, useAlpha) {
  const small = document.createElement('canvas');
  const s = 64 / Math.max(canvas.width, canvas.height);
  small.width = Math.max(1, Math.round(canvas.width * s)); small.height = Math.max(1, Math.round(canvas.height * s));
  const ctx = small.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(canvas, 0, 0, small.width, small.height);
  const { data } = ctx.getImageData(0, 0, small.width, small.height);
  const votes = {};
  const w = small.width, h = small.height;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (useAlpha) { if (data[i + 3] < 200) continue; }
    else if (x < w * 0.25 || x > w * 0.75 || y < h * 0.2 || y > h * 0.8) continue; // Mitte = Artikel
    const name = colorName(data[i], data[i + 1], data[i + 2]);
    votes[name] = (votes[name] || 0) + 1;
  }
  const sorted = Object.entries(votes).sort((a, b) => b[1] - a[1]);
  return sorted.length ? sorted[0][0] : '';
}

function colorName(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  const dlt = max - min;
  const s = dlt === 0 ? 0 : dlt / (1 - Math.abs(2 * l - 1));
  let hh = 0;
  if (dlt) { if (max === r) hh = ((g - b) / dlt) % 6; else if (max === g) hh = (b - r) / dlt + 2; else hh = (r - g) / dlt + 4; hh *= 60; if (hh < 0) hh += 360; }
  if (l < 0.13) return 'Schwarz';
  if (l > 0.9 && s < 0.35) return 'Weiß';
  if (s < 0.12) return l < 0.35 ? 'Anthrazit' : 'Grau';
  if (hh >= 20 && hh < 50 && s < 0.5 && l > 0.62) return 'Beige';
  if (hh >= 10 && hh < 45 && l < 0.45) return 'Braun';
  if (hh >= 50 && hh < 95 && l < 0.45) return 'Oliv';
  if (hh >= 200 && hh < 250 && l < 0.3) return 'Dunkelblau';
  if (hh < 12 || hh >= 345) return l > 0.7 ? 'Rosa' : l < 0.3 ? 'Bordeaux' : 'Rot';
  if (hh < 40) return 'Orange';
  if (hh < 65) return 'Gelb';
  if (hh < 160) return 'Grün';
  if (hh < 195) return 'Türkis';
  if (hh < 255) return 'Blau';
  if (hh < 290) return 'Lila';
  return 'Rosa';
}
