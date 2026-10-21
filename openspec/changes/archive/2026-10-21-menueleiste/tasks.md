## 1. Symbol und Menü

- [x] 1.1 Symbole in `desktop/assets/` (macOS-Template, Windows farbig, je mit Aufnahme-Variante); prüfen: Dateien vorhanden, 16 und 32 Pixel
- [x] 1.2 Tray mit Menü „Aufnahme starten/beenden“, „Blueforte Notes öffnen“, „Beenden“; Windows-Linksklick öffnet das Fenster; prüfen: Menü erscheint, Eintrag wechselt bei Aufnahme
- [x] 1.3 Symbol wechselt während der Aufnahme; prüfen: Symbol ändert sich

## 2. Hintergrund und Beenden

- [x] 2.1 Schließen versteckt das Hauptfenster, `backgroundThrottling: false`; prüfen: nach Schließen läuft die App, Tastenkürzel nimmt auf
- [x] 2.2 Einmaliger Hinweis per Systembenachrichtigung, Merker in `settings.json`; prüfen: zweites Schließen ohne Hinweis
- [x] 2.3 Nachfragen beim Beenden bei Aufnahme, Transkription oder ungespeichertem Text; prüfen: „Abbrechen“ behält alles, ohne Text beendet die App sofort

## 3. Aufnahme-Fenster

- [x] 3.1 `overlay.html`, `overlay.js`, `desktop/overlay-preload.js`: Pegel, Zeit, Status, „Stopp“, „Speichern“, „Öffnen“; prüfen: Fenster zeigt Zustand an
- [x] 3.2 Erscheinen nur bei Aufnahme ohne aktives Hauptfenster, `showInactive()`, oben mittig; prüfen: bei aktivem Hauptfenster kein Aufnahme-Fenster
- [x] 3.3 „Fertig“ mit Zahl der neuen Wörter, Ausblenden nach 8 Sekunden; prüfen: Fenster verschwindet, Text bleibt

## 4. Oberfläche (`app.js`)

- [x] 4.1 Zustand und Pegel an die Desktop-App melden; ungespeicherten Text erkennen; prüfen: Zustand kommt im Hauptprozess an
- [x] 4.2 Speichern aus dem Aufnahme-Fenster: in den Notizordner, danach Textfeld leeren; ohne Ordner Hauptfenster mit Hinweis; prüfen: Datei liegt im Ordner, Textfeld leer
- [x] 4.3 Tastenkürzel holt das Hauptfenster nicht mehr nach vorn; prüfen: Aufnahme startet im Hintergrund

## 5. Paket und Doku

- [x] 5.1 Neue Dateien in `package.json` (`build.files`); prüfen: `npm run dist` packt `overlay.html` mit
- [x] 5.2 README: Menüleiste und Aufnahme-Fenster; prüfen: Abschnitt vorhanden
