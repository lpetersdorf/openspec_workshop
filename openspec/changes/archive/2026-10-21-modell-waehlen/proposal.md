# Proposal

## Why

Blueforte Notes nutzt fest das Modell Whisper base. Das ist ein Kompromiss: Auf einem schwachen Windows-Laptop ohne Grafikkarte ist es spürbar langsam, auf einem MacBook mit Apple Silicon verschenkt es Genauigkeit, gerade bei Fachbegriffen und Namen. Wer die App täglich nutzt, soll das passende Modell selbst wählen können, mit ehrlicher Angabe, wie groß der Download ist und was das Gerät schafft.

## What Changes

- Neu: **Modellauswahl** mit vier Stufen: „Schnell“ (Whisper tiny), „Standard“ (base), „Genau“ (small), „Sehr genau“ (large-v3-turbo)
- Zu jedem Modell die **Download-Größe für dieses Gerät** und ob es **bereits geladen** ist
- Die Wahl wird **gespeichert** und gilt nach dem Neustart
- „Sehr genau“ nur mit **Grafikkarte** (WebGPU), ohne Grafikkarte nicht wählbar
- „Sehr genau“ **übersetzt nicht**: Der Schalter „Ins Englische übersetzen“ ist dann gesperrt
- Scheitert der Download, **bleibt das bisherige Modell aktiv**
- Geändert: **Modell laden** bezieht sich auf das gewählte Modell, Standard beim ersten Start ist „Standard“
- Gilt für die Desktop-App und die Web-App (gleicher Code)

## Nicht im Umfang

- Geladene Modelle löschen oder Speicherplatz verwalten
- Automatische Empfehlung anhand von Messungen auf dem Gerät
- Weitere Sprachen außer Deutsch
- Modelle mit dem Installationspaket ausliefern

## Capabilities

### New Capabilities

_keine_

### Modified Capabilities

- `diktat`: neue Requirement „Modell wählen“, geänderte Requirement „Modell laden“

## Impact

- `app.js`: Modell-Liste, Auswahl, Prüfung auf geladene Modelle, Sperren während der Aufnahme, Übersetzen sperren
- `whisper-worker.js`: lädt das gewählte Modell auf Anforderung, meldet Grafikkarten-Fähigkeiten, behält das alte Modell, bis das neue bereit ist
- `index.html`, `style.css`: Auswahlfeld und Hinweise
