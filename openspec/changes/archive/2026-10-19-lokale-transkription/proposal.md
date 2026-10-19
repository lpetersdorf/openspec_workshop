# Proposal

## Why

Nach Kundenterminen wollen wir vertrauliche Inhalte diktieren. Die Spracherkennung des Browsers schickt das Audio aber an den Hersteller (bei Chrome: Google). Neue Anforderung: **Das Audio darf das Gerät nicht verlassen.** Mit einem lokal laufenden Spracherkennungsmodell (Whisper) ist das im Browser möglich, ohne Server und ohne API-Key.

## What Changes

- **BREAKING:** Die Transkription läuft lokal im Browser mit dem Open-Source-Modell Whisper statt mit der Spracherkennung des Browsers
- **BREAKING:** Kein Wort-für-Wort-Live-Text mehr. Der Text erscheint abschnittsweise nach kurzen Sprechpausen, dafür mit Satzzeichen und Großschreibung
- Beim ersten Start lädt die App das Modell einmalig herunter und zeigt den Fortschritt an. Danach funktioniert die Transkription auch ohne Internet
- Stille erzeugt keinen Text, auch keinen vom Modell erfundenen
- Neu: Audiodateien hochladen und transkribieren (z. B. Sprachmemos)
- Neu: Übersetzung des Diktats ins Englische
- Firefox wird jetzt ebenfalls unterstützt
- Glossar, Obsidian-Notiz und „An Claude übergeben“ bleiben unverändert

## Nicht im Umfang

- Sprecher-Erkennung („wer hat was gesagt“), folgt ggf. als eigener Change
- Andere Zielsprachen als Englisch
- Wahl zwischen verschiedenen Modellgrößen in der Oberfläche
- Rückfall auf die Cloud-Erkennung des Browsers

## Capabilities

### New Capabilities

_Keine_

### Modified Capabilities

- `diktat`: Transkription lokal statt über den Browser-Dienst, abschnittsweiser Text statt Live-Text, neue Hinweise; neu Modell laden, Audiodatei hochladen und Übersetzung nach Englisch

## Impact

- `app.js`: Aufnahme über Mikrofon-Stream statt Browser-Spracherkennung
- Neue Datei `whisper-worker.js`: Modell läuft in einem Web Worker
- `index.html`: Modellstatus, Upload, Übersetzungs-Schalter
- Neue Abhängigkeit: transformers.js (per CDN) und das Modell `Xenova/whisper-base` von Hugging Face (einmaliger Download, ca. 80–210 MB je nach Rechner)
- `openspec/config.yaml`: Projektkontext auf lokale Spracherkennung anpassen
