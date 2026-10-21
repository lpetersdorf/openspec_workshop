# Proposal

## Why

Die Desktop-App braucht heute ein offenes Fenster. Wer mitten in einer anderen Arbeit kurz etwas festhalten will, drückt das Tastenkürzel, und das große Fenster springt nach vorn. Das unterbricht. Blueforte Notes soll unauffällig in der Menüleiste (macOS) bzw. im Infobereich der Taskleiste (Windows) laufen. Beim Diktieren erscheint nur ein kleines Aufnahme-Fenster mit Pegel, Zeit und Stopp-Knopf, und die Notiz lässt sich direkt von dort speichern.

## What Changes

- Neu: **Symbol in der Menüleiste** bzw. im Infobereich mit Menü („Aufnahme starten/beenden“, „Blueforte Notes öffnen“, „Beenden“). Während der Aufnahme ändert sich das Symbol
- Neu: **Weiterlaufen im Hintergrund**: Schließen des Fensters beendet die App nicht mehr. Beim ersten Mal erklärt ein Hinweis, wo die App weiterläuft. Beenden mit laufender Aufnahme oder ungespeichertem Text fragt nach
- Neu: **Aufnahme-Fenster**: kleines Fenster am oberen Bildschirmrand mit Pegelanzeige, Zeit, „Stopp“, danach „Speichern“ und „Öffnen“. Es nimmt der gerade genutzten App nicht den Fokus
- Geändert: **Globales Tastenkürzel** startet die Aufnahme, ohne das Hauptfenster nach vorn zu holen

## Nicht im Umfang

- Dock-Symbol (macOS) bzw. Taskleisten-Eintrag ausblenden
- Text direkt in andere Apps einfügen
- Autostart beim Anmelden
- Position des Aufnahme-Fensters merken
- Web-App: bleibt unverändert

## Capabilities

### New Capabilities

_keine_

### Modified Capabilities

- `desktop`: Symbol in der Menüleiste, Weiterlaufen im Hintergrund, Aufnahme-Fenster, Tastenkürzel ohne Hauptfenster

## Impact

- `desktop/main.js`: Tray, Aufnahme-Fenster, Schließen/Beenden, Zustand von der Oberfläche
- `desktop/preload.js`: Zustand, Pegel und „Speichern“ zwischen Oberfläche und Hauptprozess
- Neu: `overlay.html`, `overlay.js`, `desktop/overlay-preload.js`, `desktop/assets/` (Symbole)
- `app.js`: meldet Aufnahmezustand, Pegel und ungespeicherten Text an die Desktop-App, Speichern aus dem Aufnahme-Fenster
- `package.json`: neue Dateien im Paket
