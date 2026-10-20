## 1. Projekt und Bibliothek

- [x] 1.1 `package.json` mit Electron, electron-builder und transformers.js, Skripte `desktop`, `dist`, `dist:mac`, `dist:win`; prüfen: `npm install` läuft durch
- [x] 1.2 `desktop/vendor.js` kopiert transformers.js und die ONNX-Runtime-Dateien nach `vendor/` (per `postinstall`); prüfen: `vendor/transformers.min.js` existiert nach `npm install`
- [x] 1.3 `whisper-worker.js` lädt zuerst `vendor/`, sonst das CDN; prüfen: Web-App ohne `npm install` lädt weiterhin vom CDN

## 2. Desktop-Hülle

- [x] 2.1 `desktop/main.js`: Fenster, Protokoll `app://`, Mikrofon-Rechte, Einstellungen; prüfen: `npm run desktop` öffnet die App mit Modellstatus
- [x] 2.2 `desktop/preload.js` mit `getFolder`, `chooseFolder`, `saveNote`, `onToggleRecording`; prüfen: `window.bfnDesktop` ist in der App vorhanden, im Browser nicht
- [x] 2.3 Speichern im Notizordner ohne Überschreiben (Nummer anhängen), Hinweis bei fehlendem Ordner; prüfen: zweimal in derselben Minute speichern ergibt zwei Dateien
- [x] 2.4 Globales Tastenkürzel mit Hinweis, falls belegt; prüfen: Kürzel startet und stoppt die Aufnahme aus dem Hintergrund

## 3. Oberfläche

- [x] 3.1 Notizordner-Zeile mit „Ordner wählen“, nur in der Desktop-App sichtbar; prüfen: im Browser unsichtbar
- [x] 3.2 „Notiz speichern“ nutzt den Notizordner, sonst Download; Bestätigung mit Dateinamen; prüfen: Datei liegt im Vault
- [x] 3.3 Kennzeichnung „Desktop · Whisper base“ und Hinweis auf das Tastenkürzel; prüfen: sichtbar in der App

## 4. Pakete

- [x] 4.1 electron-builder-Konfiguration (`.dmg` für arm64 und x64, NSIS-Installer für Windows, Mikrofon-Beschreibung); prüfen: `npm run dist:mac` erzeugt eine `.dmg`
- [x] 4.2 GitHub-Workflow `desktop.yml` baut macOS und Windows und lädt die Pakete als Artefakte hoch; prüfen: Workflow-Lauf ist grün
- [x] 4.3 README: Installation, Warnung bei unsignierter App, Tastenkürzel; prüfen: Abschnitt vorhanden

## Workflow follow-up

- App auf macOS und Windows installieren und alle Szenarien durchspielen
- `/opsx:archive desktop-app`
