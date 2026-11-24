// Optionale KI – läuft lokal im Browser (WebAssembly). Wird erst bei Bedarf geladen.
// Kosten: 0 €. Einmaliger Download (danach im Cache):
//  - Freistellen: ~55 MB (Modell 44 MB + Laufzeit ~10 MB)  → am besten im WLAN
//  - Kategorie-Erkennung: ~14 MB
import { IMAGENET_MAP } from './data.js';

// Lokal gebündelt (esbuild) aus @imgly/background-removal@1.4.5 – AGPL-3.0, siehe README
const BG_LIB = './vendor/bg-removal.js';
const BG_DATA = 'https://staticimgly.com/@imgly/background-removal-data/1.4.5/dist/';
const TF_URL = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
const MN_URL = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js';
const MN_MODEL = 'https://storage.googleapis.com/tfjs-models/savedmodel/mobilenet_v2_1.0_224/model.json';

let bgModule = null;
export async function removeBackground(blob, onProgress) {
  if (!bgModule) bgModule = await import(/* @vite-ignore */ BG_LIB);
  const out = await bgModule.removeBackground(blob, {
    publicPath: BG_DATA,
    model: 'small', // 44 MB – iPhone-freundlich
    device: 'cpu',
    output: { format: 'image/png' },
    progress: (key, cur, total) => {
      if (onProgress && key.startsWith('fetch')) onProgress(total ? cur / total : 0, 'Modell wird geladen (einmalig)…');
      else if (onProgress && key.startsWith('compute')) onProgress(-1, 'Freistellen…');
    },
  });
  return out;
}

function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement('script');
    s.src = src; s.async = true; s.crossOrigin = 'anonymous';
    s.onload = res; s.onerror = () => rej(new Error('Script konnte nicht geladen werden: ' + src));
    document.head.appendChild(s);
  });
}

let classifier = null;
async function getClassifier() {
  if (classifier) return classifier;
  await loadScript(TF_URL);
  await loadScript(MN_URL);
  // eslint-disable-next-line no-undef
  classifier = await mobilenet.load({ version: 2, alpha: 1.0, modelUrl: MN_MODEL });
  return classifier;
}

// Liefert { cat, type, confidence, labels }
export async function classify(canvas) {
  const model = await getClassifier();
  const preds = await model.classify(canvas, 5);
  const score = {};
  let bestType = null, bestTypeP = 0;
  for (const p of preds) {
    const name = p.className.toLowerCase();
    for (const [cat, dict] of IMAGENET_MAP) {
      for (const [kw, de] of Object.entries(dict)) {
        if (name.split(',').some(part => part.trim() === kw || part.trim().includes(kw))) {
          score[cat] = (score[cat] || 0) + p.probability;
          if (p.probability > bestTypeP) { bestTypeP = p.probability; bestType = { cat, de }; }
          break;
        }
      }
    }
  }
  const top = Object.entries(score).sort((a, b) => b[1] - a[1])[0];
  return {
    cat: top && top[1] > 0.12 ? top[0] : null,
    type: bestType && top && bestType.cat === top[0] ? bestType.de : null,
    confidence: top ? top[1] : 0,
    labels: preds.map(p => `${p.className.split(',')[0]} ${(p.probability * 100).toFixed(0)}%`),
  };
}
