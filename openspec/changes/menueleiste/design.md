# Design

## Context

Siehe proposal.md. Ausgangslage ist die Desktop-App aus `desktop-app` (Electron, Protokoll `app://`, Brücke `window.bfnDesktop`). Aufnahme und Transkription laufen in der Oberfläche des Hauptfensters (`app.js`, Web Worker). Das soll so bleiben: Ein zweiter Aufnahmeweg im Hauptprozess wäre doppelter Code.

## Goals / Non-Goals

**Goals:**
- Aufnehmen, ohne das Hauptfenster zu sehen
- Das Aufnahme-Fenster zeigt nur an und schickt Befehle, es nimmt selbst nichts auf

**Non-Goals:**
- Keine Änderung an der Web-App

## Decisions

**1. Hauptfenster wird versteckt, nicht geschlossen**
Beim Schließen ruft die App `hide()` auf. So bleibt die Oberfläche mit Worker und geladenem Modell im Speicher, und die Aufnahme startet ohne Wartezeit. `backgroundThrottling: false` verhindert, dass Chromium Timer im versteckten Fenster drosselt. Erst „Beenden“ (Menü, `Cmd+Q`) beendet die App.

**2. Zustand fließt in eine Richtung**
`app.js` meldet über `bfnDesktop.sendState()` Aufnahme, Aufnahmezeit, offene Abschnitte, ungespeicherten Text und neue Wörter, über `sendLevel()` den Pegel (ca. 12-mal pro Sekunde). Der Hauptprozess merkt sich den letzten Zustand, passt Tray-Symbol und Menü an und reicht alles an das Aufnahme-Fenster weiter. Befehle aus dem Aufnahme-Fenster („Stopp“, „Speichern“, „Öffnen“) gehen über den Hauptprozess zurück an `app.js`.

**3. Aufnahme-Fenster ohne Fokus**
Rahmenloses, transparentes `BrowserWindow` (320 × 76) mit `focusable: false`, `alwaysOnTop` (Stufe `floating`), auf allen Schreibtischen sichtbar, geöffnet mit `showInactive()`. Es erscheint oben mittig auf dem Bildschirm, auf dem der Mauszeiger steht. Eigene, kleine Brücke `desktop/overlay-preload.js` (`onState`, `onLevel`, `action`).

**4. Wann erscheint das Aufnahme-Fenster?**
Wenn eine Aufnahme startet und das Hauptfenster nicht sichtbar oder nicht aktiv ist. Wird das Hauptfenster geöffnet, verschwindet das Aufnahme-Fenster. Nach der Transkription zeigt es „Fertig“ und blendet sich nach 8 Sekunden aus; jeder Klick startet die Frist neu.

**5. Symbole**
macOS: Template-Bilder (`trayTemplate.png`, `@2x`), die sich hellem und dunklem Modus anpassen; während der Aufnahme ein ausgefülltes Mikrofon. Windows: farbige PNGs, während der Aufnahme mit rotem Punkt. Erzeugt als kleine PNG-Dateien in `desktop/assets/`.

**6. Nachfragen beim Beenden**
`before-quit` prüft den letzten Zustand. Läuft eine Aufnahme, wird noch transkribiert oder ist der Text nicht gespeichert, fragt ein Dialog nach. „Ungespeichert“ heißt: Der Text unterscheidet sich vom zuletzt gespeicherten Stand und ist nicht leer.

**7. Speichern aus dem Aufnahme-Fenster**
Ruft dieselbe Speicherlogik wie „Notiz speichern“ auf. Ohne Notizordner kein Download im versteckten Fenster, sondern Hauptfenster öffnen und Hinweis zeigen. Nach erfolgreichem Speichern wird das Textfeld geleert.

## Risks / Trade-offs

- [Benachrichtigungen bei unsignierter App] → macOS zeigt sie ggf. erst nach Freigabe; der Hinweis ist eine Hilfe, keine Voraussetzung
- [Linux] → Tray funktioniert je nach Desktop-Umgebung unterschiedlich; Linux ist nicht im Umfang
- [Zwei Fenster, ein Zustand] → Das Aufnahme-Fenster hält keinen eigenen Zustand, es zeigt nur an, was der Hauptprozess schickt
