# Proposal

## Why

Gedanken nach einem Kundentermin, Ideen unterwegs oder Notizen im Meeting gehen verloren, weil Abtippen zu lange dauert. Eine Diktier-App im Browser, die Text direkt als Obsidian-Notiz ablegt und an Claude übergeben kann, senkt diese Hürde auf einen Klick.

## What Changes

- Neue Single-Page-App **Blueforte Notes** (index.html, style.css, app.js), die ohne Installation im Browser läuft
- Aufnahme per Klick mit Live-Text über die Spracherkennung des Browsers (Deutsch)
- Die Aufnahme läuft durchgehend, auch bei Sprechpausen, bis „Stopp“ geklickt wird
- Der erkannte Text ist editierbar und kopierbar
- Ein Glossar korrigiert Fachbegriffe automatisch (z. B. „blue forte“ → „Blueforte“) und lässt sich erweitern
- Export des Diktats als Obsidian-Notiz (Markdown mit YAML-Frontmatter)
- Button „An Claude übergeben“: kopiert einen Prompt plus Transkript in die Zwischenablage
- Verständliche Hinweise, wenn der Browser keine Spracherkennung kann oder das Mikrofon verweigert wird

## Nicht im Umfang

- Sprecher-Erkennung („wer hat was gesagt“)
- Lokale Transkription ohne Cloud (folgt als eigener Change)
- Hochladen von Audiodateien, Übersetzung
- Login, Cloud-Speicher, Synchronisation zwischen Geräten
- Direkter Aufruf von Claude oder einer anderen KI-API

## Capabilities

### New Capabilities

- `diktat`: Diktieren im Browser mit Live-Text, Glossar-Korrektur, Export als Obsidian-Notiz und Übergabe an Claude

### Modified Capabilities

_Keine_

## Impact

- Neue Dateien: `index.html`, `style.css`, `app.js`
- Keine Abhängigkeiten, kein Backend, kein API-Key
- **Datenschutz:** Die Spracherkennung des Browsers verarbeitet Audio beim Hersteller (bei Chrome: Google). Die App weist darauf hin, dass keine vertraulichen Inhalte diktiert werden sollen.
