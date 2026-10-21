## ADDED Requirements

### Requirement: Symbol in der Menüleiste
Das System SHALL in der Desktop-App ein Symbol in der Menüleiste (macOS) bzw. im Infobereich der Taskleiste (Windows) anzeigen, über das sich die Aufnahme steuern und das Hauptfenster öffnen lässt.

#### Scenario: Menü öffnen
- **WHEN** die Person auf das Symbol klickt (Windows: Rechtsklick)
- **THEN** erscheint ein Menü mit „Aufnahme starten“, „Blueforte Notes öffnen“ und „Beenden“

#### Scenario: Fenster öffnen unter Windows
- **WHEN** die Person unter Windows mit links auf das Symbol klickt
- **THEN** öffnet sich das Hauptfenster

#### Scenario: Aufnahme läuft
- **WHEN** eine Aufnahme läuft
- **THEN** ändert sich das Symbol
- **AND** der erste Menüeintrag heißt „Aufnahme beenden“

### Requirement: Weiterlaufen im Hintergrund
Das System SHALL beim Schließen des Hauptfensters weiterlaufen und erst über „Beenden“ vollständig beendet werden.

#### Scenario: Fenster schließen
- **WHEN** die Person das Hauptfenster schließt
- **THEN** läuft die App in der Menüleiste weiter und das Tastenkürzel funktioniert weiter

#### Scenario: Erster Hinweis
- **WHEN** die Person das Hauptfenster zum ersten Mal schließt
- **THEN** erklärt eine Systembenachrichtigung, dass die App in der Menüleiste weiterläuft
- **AND** beim nächsten Schließen erscheint der Hinweis nicht mehr

#### Scenario: Beenden
- **WHEN** die Person im Menü „Beenden“ wählt und weder eine Aufnahme läuft noch ungespeicherter Text vorhanden ist
- **THEN** wird die App sofort vollständig beendet

#### Scenario: Beenden mit ungespeichertem Text
- **WHEN** die Person „Beenden“ wählt, während eine Aufnahme läuft, noch transkribiert wird oder der Text noch nicht als Notiz gespeichert ist
- **THEN** fragt die App nach, ob sie trotzdem beendet werden soll
- **AND** bei „Abbrechen“ bleibt alles erhalten

### Requirement: Aufnahme-Fenster
Das System SHALL für Aufnahmen, die bei geschlossenem oder nicht aktivem Hauptfenster starten, ein kleines Aufnahme-Fenster am oberen Bildschirmrand anzeigen.

#### Scenario: Aufnahme im Hintergrund starten
- **GIVEN** das Hauptfenster ist geschlossen oder nicht aktiv
- **WHEN** die Aufnahme über das Tastenkürzel oder das Menü startet
- **THEN** erscheint das Aufnahme-Fenster mit Pegelanzeige, Aufnahmezeit und „Stopp“
- **AND** die gerade genutzte App behält den Fokus

#### Scenario: Pegel
- **WHEN** die Person während der Aufnahme spricht
- **THEN** bewegt sich die Pegelanzeige im Takt der Stimme

#### Scenario: Stoppen im Aufnahme-Fenster
- **WHEN** die Person im Aufnahme-Fenster auf „Stopp“ klickt
- **THEN** endet die Aufnahme
- **AND** das Fenster zeigt „Transkribiert …“ und danach „Fertig“ mit der Zahl der neuen Wörter

#### Scenario: Notiz direkt speichern
- **GIVEN** ein Notizordner ist gewählt
- **WHEN** die Person nach der Aufnahme im Aufnahme-Fenster auf „Speichern“ klickt
- **THEN** wird der Text als Notiz im Notizordner gespeichert, ohne dass sich das Hauptfenster öffnet
- **AND** das Textfeld ist danach leer, damit die nächste Aufnahme eine neue Notiz ergibt

#### Scenario: Speichern ohne Notizordner
- **WHEN** kein Notizordner gewählt ist und die Person im Aufnahme-Fenster auf „Speichern“ klickt
- **THEN** öffnet sich das Hauptfenster mit dem Hinweis, zuerst einen Notizordner zu wählen
- **AND** der Text bleibt erhalten

#### Scenario: Ausblenden
- **WHEN** die Transkription fertig ist und die Person 8 Sekunden lang nichts im Aufnahme-Fenster tut
- **THEN** verschwindet das Aufnahme-Fenster
- **AND** der Text bleibt in der App erhalten

#### Scenario: Hauptfenster ist aktiv
- **WHEN** die Aufnahme bei aktivem Hauptfenster startet
- **THEN** erscheint kein Aufnahme-Fenster

## MODIFIED Requirements

### Requirement: Globales Tastenkürzel
Das System SHALL die Aufnahme über `Cmd+Shift+D` (macOS) bzw. `Strg+Umschalt+D` (Windows) starten und stoppen, auch wenn die App im Hintergrund oder nur in der Menüleiste läuft.

#### Scenario: Aufnahme aus dem Hintergrund
- **WHEN** die App im Hintergrund läuft und die Person das Tastenkürzel drückt
- **THEN** startet die Aufnahme, ohne dass das Hauptfenster nach vorn kommt
- **AND** das Aufnahme-Fenster erscheint

#### Scenario: Aufnahme beenden
- **WHEN** die Aufnahme läuft und die Person das Tastenkürzel drückt
- **THEN** endet die Aufnahme

#### Scenario: Kürzel bereits belegt
- **WHEN** ein anderes Programm das Tastenkürzel bereits belegt
- **THEN** startet die App trotzdem und weist darauf hin, dass das Kürzel nicht verfügbar ist
