# Proposal

## Why

Blueforte Notes läuft bisher nur im Browser über einen lokalen Server (`npx serve .`). Für den Alltag ist das umständlich: Terminal öffnen, Server starten, Seite aufrufen, Notiz herunterladen und in den Obsidian-Ordner schieben. Als Desktop-App startet Blueforte Notes per Klick oder Tastenkürzel, legt Notizen direkt im Vault ab und funktioniert nach dem ersten Start komplett offline.

## What Changes

- Neue Desktop-App für **macOS und Windows** auf Basis von Electron, mit denselben Dateien wie die Web-App
- Neu: **Notizordner**, einmal gewählt (z. B. der Obsidian-Vault), Notizen landen dort direkt
- Neu: **globales Tastenkürzel** `Cmd+Shift+D` (macOS) bzw. `Strg+Umschalt+D` (Windows) startet und stoppt die Aufnahme, auch wenn die App im Hintergrund ist
- Neu: **Offline-Start**: Nach dem ersten Modell-Download startet und transkribiert die App ohne Internet
- Geändert: „Notiz speichern“ legt die Datei in der Desktop-App direkt im Notizordner ab und überschreibt keine vorhandene Datei
- Die Web-App bleibt unverändert nutzbar (`npx serve .`)
- Installationspakete werden per GitHub Actions gebaut (`.dmg` für macOS, `.exe` für Windows)

## Nicht im Umfang

- Code-Signatur und Notarisierung (die App ist unsigniert, macOS und Windows warnen beim ersten Öffnen)
- Automatische Updates
- Linux-Paket
- Mitliefern des Modells im Installationspaket (es wird beim ersten Start geladen)
- Menüleisten- bzw. Tray-Symbol

## Capabilities

### New Capabilities

- `desktop`: Installation als Desktop-App, Notizordner, globales Tastenkürzel, Offline-Start

### Modified Capabilities

- `diktat`: „Obsidian-Notiz“ speichert in der Desktop-App direkt in den Notizordner, ohne vorhandene Dateien zu überschreiben

## Impact

- Neue Dateien: `package.json`, `desktop/main.js`, `desktop/preload.js`, `desktop/vendor.js`, `.github/workflows/desktop.yml`
- `app.js`: Notizordner-Anzeige, Speichern über die Desktop-Schnittstelle, Tastenkürzel-Ereignis
- `whisper-worker.js`: lädt transformers.js bevorzugt lokal (`vendor/`), sonst weiterhin vom CDN
- Neue Abhängigkeiten (nur für die Desktop-App): `electron`, `electron-builder`, `@huggingface/transformers`
