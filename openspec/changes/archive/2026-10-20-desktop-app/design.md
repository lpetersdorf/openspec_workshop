# Design

## Context

Siehe proposal.md für die Motivation. Ausgangslage ist die Web-App mit lokalem Whisper (`whisper-worker.js`, transformers.js per CDN, Modell `Xenova/whisper-base`). Die Spracherkennung des Browsers (Version 1) funktioniert in Electron nicht, weil Electron keinen Zugang zu Googles Erkennungsdienst hat. Deshalb baut die Desktop-App auf der lokalen Transkription auf.

## Goals / Non-Goals

**Goals:**
- Eine Codebasis für Web und Desktop: Die Desktop-App lädt dieselben `index.html`, `app.js`, `style.css`, `whisper-worker.js`
- Desktop-Funktionen nur über eine kleine, klar begrenzte Schnittstelle (`window.bfnDesktop`)

**Non-Goals:**
- Kein Zugriff der Oberfläche auf Node.js oder das Dateisystem außerhalb dieser Schnittstelle

## Decisions

**1. Electron statt Tauri oder PWA**
Electron liefert eine echte `.app`/`.exe`, globale Tastenkürzel und Dateizugriff mit reinem JavaScript. Tauri wäre kleiner, braucht aber eine Rust-Toolchain. Eine PWA hätte keinen freien Ordnerzugriff und kein globales Tastenkürzel.

**2. Eigenes Protokoll `app://` statt `file://`**
Die Dateien werden über ein registriertes, als sicher markiertes Protokoll ausgeliefert. So funktionieren Modul-Worker, Mikrofon (`getUserMedia` braucht einen sicheren Kontext) und der Cache für das Modell wie im Browser.

**3. Sichere Brücke über `preload.js`**
`contextIsolation` an, `nodeIntegration` aus. `preload.js` stellt nur `getFolder`, `chooseFolder`, `saveNote` und `onToggleRecording` bereit. Das Schreiben übernimmt der Hauptprozess, der nur in den gewählten Ordner schreibt und vorhandene Dateien nie überschreibt (Nummer anhängen).

**4. Einstellungen als JSON im Benutzerordner der App**
`settings.json` in `app.getPath('userData')` speichert den Notizordner. Fehlt der Ordner beim Speichern, meldet die App das und bittet um eine neue Auswahl.

**5. transformers.js lokal mitliefern**
`npm install` kopiert per `postinstall` (`desktop/vendor.js`) `transformers.min.js` und die ONNX-Runtime-Dateien nach `vendor/`. Der Worker lädt zuerst `vendor/`, sonst das CDN (Web-App ohne `npm install`). Damit startet die Desktop-App offline; das Modell liegt nach dem ersten Download im Cache der App.

**6. Mikrofon-Rechte**
Electron erlaubt `media` für das eigene Protokoll. Auf macOS fragt die App beim ersten Aufnehmen über `systemPreferences.askForMediaAccess` nach; `NSMicrophoneUsageDescription` steht in der `Info.plist`.

**7. Pakete per GitHub Actions**
`electron-builder` baut `.dmg` (macOS, Apple Silicon und Intel) und `.exe`-Installer (Windows). Ein Workflow baut beide auf den jeweiligen Systemen und stellt sie als Artefakte bereit; lokal geht `npm run dist`.

## Risks / Trade-offs

- [Unsignierte App] → macOS: Rechtsklick, „Öffnen“; Windows SmartScreen: „Weitere Informationen“, „Trotzdem ausführen“. Im README beschrieben
- [App-Größe ca. 100–150 MB plus Modell] → für einen Bonus akzeptiert
- [Tastenkürzel belegt] → App startet trotzdem, Hinweis in der Oberfläche
- [Mikrofon in der App verweigert] → bestehender Hinweis; Freigabe in den Systemeinstellungen
