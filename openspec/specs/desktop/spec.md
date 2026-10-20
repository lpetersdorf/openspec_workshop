# desktop Specification

## Purpose
Blueforte Notes als installierbare Desktop-App für macOS und Windows: Start per Klick oder Tastenkürzel, Notizen direkt im gewählten Ordner, nach dem ersten Start komplett offline.

## Requirements

### Requirement: Installation als Desktop-App
Das System SHALL als installierbare Desktop-App für macOS und Windows bereitstehen, die ohne Browser und ohne lokalen Server startet.

#### Scenario: Start per Klick
- **WHEN** die Person die installierte App „Blueforte Notes“ öffnet
- **THEN** erscheint das App-Fenster mit allen Funktionen der Web-App

#### Scenario: Mikrofon-Freigabe
- **WHEN** die Person auf macOS zum ersten Mal auf „Aufnahme“ klickt
- **THEN** fragt das Betriebssystem einmalig nach dem Zugriff auf das Mikrofon
- **AND** nach der Freigabe startet die Aufnahme

### Requirement: Notizordner
Das System SHALL in der Desktop-App einen Notizordner (z. B. den Obsidian-Vault) speichern, in dem Notizen abgelegt werden.

#### Scenario: Ordner wählen
- **WHEN** die Person auf „Ordner wählen“ klickt und einen Ordner auswählt
- **THEN** zeigt die App den Ordner an
- **AND** der Ordner ist nach einem Neustart der App noch gewählt

#### Scenario: Ordner nicht mehr vorhanden
- **WHEN** der gewählte Ordner gelöscht oder verschoben wurde
- **THEN** weist die App darauf hin und bittet um eine neue Auswahl

### Requirement: Globales Tastenkürzel
Das System SHALL die Aufnahme über `Cmd+Shift+D` (macOS) bzw. `Strg+Umschalt+D` (Windows) starten und stoppen, auch wenn die App im Hintergrund ist.

#### Scenario: Aufnahme aus dem Hintergrund
- **WHEN** die App im Hintergrund läuft und die Person das Tastenkürzel drückt
- **THEN** kommt das App-Fenster nach vorn und die Aufnahme startet

#### Scenario: Aufnahme beenden
- **WHEN** die Aufnahme läuft und die Person das Tastenkürzel drückt
- **THEN** endet die Aufnahme

#### Scenario: Kürzel bereits belegt
- **WHEN** ein anderes Programm das Tastenkürzel bereits belegt
- **THEN** startet die App trotzdem und weist darauf hin, dass das Kürzel nicht verfügbar ist

### Requirement: Offline-Start
Das System SHALL nach dem ersten erfolgreichen Modell-Download ohne Internetverbindung starten und transkribieren.

#### Scenario: Neustart ohne Internet
- **GIVEN** das Modell wurde einmal geladen
- **WHEN** die App ohne Internetverbindung neu gestartet wird
- **THEN** meldet sie „Modell bereit“ und transkribiert Aufnahmen
