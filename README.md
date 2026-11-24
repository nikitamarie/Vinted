# Inserat Studio – kostenlose iPhone-Web-App für Vinted-Anzeigen

Fotos hochladen → automatisch optimiert (Licht, Farbe, Schärfe, Zuschnitt, optional freigestellt auf Studio-Hintergrund) → fertiger Titel, Beschreibung, Suchbegriffe, Preisspanne & Foto-Checkliste → 1-Klick kopieren & Bilder in „Fotos“ sichern → in Vinted einfügen.

Funktioniert für **alle Artikel**: Kleidung, Schuhe, Taschen/Accessoires, Elektronik, Haushalt, Wohnen/Deko, Bücher, Spielzeug, Sport, Beauty, Sonstiges.

---

## 1. Architektur (100 % kostenlos)

```
iPhone Safari / Home-Bildschirm-App (PWA)
│
├─ Alles läuft LOKAL im Browser – kein Server, kein Konto, keine API-Keys
│   ├─ Bildoptimierung: Canvas (Auto-Tonwert, Weißabgleich, Gamma, Schärfen, 3:4-Zuschnitt, JPEG)
│   ├─ Freistellen: @imgly/background-removal (WebAssembly, ~55 MB einmalig, danach gecacht)
│   ├─ Kategorie-Erkennung: TensorFlow.js MobileNet (~14 MB einmalig) + Stichwort-Erkennung
│   ├─ Farberkennung, Texte, Preis-Heuristik: eigener Code (offline)
│   └─ Verlauf: localStorage (nur Texte + Mini-Vorschau)
│
├─ Hosting: GitHub Pages (0 €) – statische Dateien, kein Build-Schritt
└─ Optional, Free-Tier in Safari: Hugging Face Try-On (Tragebild), ChatGPT/Gemini/Claude Free (Text-Feinschliff)
```

| Baustein | Kosten | Limit / Hinweis |
|---|---|---|
| App, Bildoptimierung, Texte, Preise | 0 € | offline nutzbar |
| Freistellen & Erkennung im Browser | 0 € | einmalig ~70 MB Datenvolumen (WLAN!) |
| GitHub Pages | 0 € | öffentliches Repo nötig (oder GitHub Pro für privat) |
| Hugging Face Try-On-Spaces | 0 € | tägliches GPU-Kontingent, Warteschlange, kann offline sein |
| ChatGPT/Gemini/Claude Free | 0 € | Nachrichten-/Bild-Limits pro Tag |
| Vinted „Hochschieben“/„Schaufenster“ | **kostenpflichtig** | optional – nicht nötig |

Kostenlose Hosting-Alternativen: Cloudflare Pages, Netlify (Drag & Drop des Ordners).

## 2. In 5 Minuten aufs iPhone

**A) GitHub Pages (empfohlen)**
1. GitHub → Repo `vinted` → **Settings → Pages**.
2. *Source:* „Deploy from a branch“ → Branch `claude/vinted-listing-pwa-ios-bw187q` (oder nach dem Mergen `main`) → Ordner `/ (root)` → **Save**.
3. Nach ~1 Min. erscheint die URL, z. B. `https://nikitamarie.github.io/vinted/`.
   *(Privates Repo? GitHub Pages braucht dann GitHub Pro – kostenlose Alternative: Repo öffentlich machen oder Netlify Drop/Cloudflare Pages.)*
4. Auf dem iPhone in **Safari** öffnen → **Teilen-Symbol** (Quadrat mit Pfeil) → **„Zum Home-Bildschirm“** → Hinzufügen.
5. Einmal im WLAN ein Cover freistellen lassen → Modelle sind ab dann gecacht.

**B) Lokal testen am Rechner**
```bash
python3 -m http.server 8080   # im Repo-Ordner
# dann http://localhost:8080 öffnen
```

## 3. Workflow pro Artikel (~1–2 Min.)

1. **Fotos** aufnehmen/auswählen (1. Bild = Cover, „als Cover“ tippen zum Umsortieren).
2. **Kategorie** wird erkannt (oder antippen), **Details** ergänzen (Marke, Größe, Zustand, Mängel).
3. **Bild-Look**: Format 3:4, Hintergrund z. B. „Studio-Grau“ (nur Cover wird freigestellt; Detail- & Mängelfotos bleiben echt).
4. **✨ Anzeige erstellen** → **„Alle Bilder in Fotos sichern“** (iOS-Teilen-Menü → „Bilder sichern“).
5. **„Titel + Text kopieren“** → **Vinted öffnen** → Fotos wählen, einfügen, Vinted-Felder (Kategorie, Marke, Größe, Zustand, Farbe) setzen, Preis = „Startpreis“.

### iPhone-Realität
- Läuft direkt in Safari (iOS 16.4+ empfohlen). Fotos werden auf 1600 px verkleinert und nacheinander verarbeitet → schont RAM & Akku.
- Freistellen dauert auf aktuellen iPhones ca. 5–20 s pro Bild. Bei „zu wenig Speicher“: weniger Fotos, andere Apps schließen – oder **iOS-eigenes Freistellen** nutzen: Fotos-App → Motiv lange drücken → Teilen → Bild sichern (PNG) → hier hochladen. Die App erkennt die Transparenz und setzt nur den Studio-Hintergrund (kein Modell-Download).
- Daten bleiben auf dem Gerät. Home-Bildschirm-Apps haben eigenen Speicher; iOS kann Cache bei Speichermangel löschen → Modelle werden dann einfach neu geladen.

### „Angezogen“-Modus (Kleidung)
1. **Echtes Tragebild** (beste Conversion, 100 % ehrlich): iPhone anlehnen, Selbstauslöser, Tageslicht.
2. **Flatlay/Ghost-Look lokal**: Artikel glatt hinlegen oder auf Bügel → Studio-Hintergrund in der App.
3. **KI-Model (Free-Tier)**: freigestelltes Cover sichern → in Safari [IDM-VTON](https://huggingface.co/spaces/yisol/IDM-VTON), [Kolors Try-On](https://huggingface.co/spaces/Kwai-Kolors/Kolors-Virtual-Try-On) oder [Nymbo Try-On](https://huggingface.co/spaces/Nymbo/Virtual-Try-On) öffnen. Kostenlos, aber mit täglichem GPU-Limit; Bilder werden dort hochgeladen.
   - Schnitt, Farbe, Länge, Muster & Zustand müssen stimmen. KI-Bild nur **zusätzlich**, nie statt echter Fotos. Option „Hinweis KI-Tragebild“ in der App setzen.

## 4. Warum kein automatischer Vinted-Upload?

Vinted bietet **keine offizielle API für private Verkäufer**. Bots, die sich einloggen und automatisch einstellen, verstoßen gegen die Nutzungsbedingungen (automatisierter Zugriff) und riskieren **Einschränkungen oder Kontosperren** – zusätzlich gibst du dein Passwort an Dritt-Tools. Der Copy-&-Save-Workflow oben ist fast genauso schnell und 100 % regelkonform.

## 5. Vinted-Algorithmus-Strategie

Vinted veröffentlicht sein Ranking nicht – das sind bewährte Praxisregeln, keine Garantie.

1. **Frische zählt (erste 24–48 h):** Neue Artikel werden bevorzugt ausgespielt. Einstellen zu Stoßzeiten (abends 18–22 Uhr, Sonntag). Täglich 2–5 Artikel statt 40 auf einmal.
2. **Filter = Sichtbarkeit:** Jedes Vinted-Feld ausfüllen (tiefste Unterkategorie, Marke aus der Liste, Größe, Zustand, bis zu 2 Farben, Material). Fehlende Felder = unsichtbar in gefilterten Suchen.
3. **Titel:** Marke + Artikel + Hauptmerkmal + Größe, in Käufer-Sprache („Levi's 501 Jeans Blau W32“). Kein Keyword-Stuffing, keine fremden Marken („wie Zara“) → Löschungsrisiko.
4. **Cover = Klickrate:** hell, ruhiger Hintergrund, Artikel füllt das Bild, Hochformat. Danach Etikett, Details, Mängel.
5. **Engagement-Signale:** Favoriten, Aufrufe, Nachrichten. Schnell antworten, innerhalb 1–2 Tagen versenden, gute Bewertungen, vollständiges Profil.
6. **Preis-Taktik:** 10–15 % Verhandlungspuffer, Bundle-Rabatte aktivieren. Nach 7–14 Tagen ohne Verkauf ~10 % senken – Favorisierende werden über Preissenkungen informiert.
7. **Auffrischen statt Spammen:** Nach 2–4 Wochen neues Cover/Titel/Preis. Nie dasselbe Teil mehrfach parallel einstellen.
8. **Saison:** Winterjacken ab September, Bademode ab April, Ski ab Oktober, Spielzeug vor Weihnachten. Die App ergänzt passende Saison-Keywords automatisch.
9. **Kostenpflichtige Boosts** („Hochschieben“, „Schaufenster“) sind optional – organisch kommst du mit den Punkten 1–8 weit.

## Projektstruktur

```
index.html            UI (3 Tabs: Erstellen, Verlauf, Strategie)
styles.css            iOS-optimiertes, einhändig bedienbares Layout, Dark Mode
manifest.webmanifest  PWA-Manifest
sw.js                 Service Worker (offline + Modell-Cache)
js/app.js             UI-Logik & Workflow
js/imaging.js         Bildoptimierung, Komposition, Farberkennung
js/listing.js         Titel, Beschreibung, Hashtags, Preis, KI-Prompt
js/data.js            Kategorien, Felder, Checklisten, Markenstufen, Mappings
js/ai.js              Lazy-Loader für Freistellen & Erkennung
js/vendor/bg-removal.js  gebündeltes @imgly/background-removal 1.4.5
```

## Lizenzen
- `@imgly/background-removal` ist **AGPL-3.0** – für private Nutzung unproblematisch; wer die App öffentlich anbietet, muss den Quellcode ebenfalls offenlegen (ist bei einem öffentlichen GitHub-Repo erfüllt).
- TensorFlow.js / MobileNet: Apache-2.0.
- „Vinted“ ist eine Marke der Vinted UAB. Dieses Projekt ist ein unabhängiges Hilfswerkzeug ohne Verbindung zu Vinted.
