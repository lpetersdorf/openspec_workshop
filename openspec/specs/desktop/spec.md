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

### Requirement: Offline-Start
Das System SHALL nach dem ersten erfolgreichen Modell-Download ohne Internetverbindung starten und transkribieren.

#### Scenario: Neustart ohne Internet
- **GIVEN** das Modell wurde einmal geladen
- **WHEN** die App ohne Internetverbindung neu gestartet wird
- **THEN** meldet sie „Modell bereit“ und transkribiert Aufnahmen

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

### Requirement: Meeting-Modus
Das System SHALL in der Desktop-App auf Wunsch das Mikrofon und den Systemton (z. B. die Gegenseite in Teams oder Zoom) gleichzeitig aufnehmen und beide Quellen getrennt transkribieren.

#### Scenario: Meeting aufnehmen
- **GIVEN** der Meeting-Modus ist eingeschaltet und das Einverständnis bestätigt
- **WHEN** die Person die Aufnahme startet
- **THEN** werden Mikrofon und Systemton aufgenommen
- **AND** jeder Absatz ist mit „Ich“ (Mikrofon) oder „Gegenüber“ (Systemton) gekennzeichnet

#### Scenario: Sprecherwechsel
- **WHEN** zuerst die Person und danach die Gegenseite spricht
- **THEN** beginnt beim Wechsel ein neuer Absatz mit der neuen Kennzeichnung
- **AND** spricht dieselbe Seite weiter, wird der Text an ihren Absatz angehängt

#### Scenario: Nur in der Desktop-App
- **WHEN** die App im Browser läuft
- **THEN** gibt es keinen Schalter für den Meeting-Modus

#### Scenario: Zwei Pegel
- **WHEN** eine Meeting-Aufnahme im Hintergrund läuft
- **THEN** zeigt das Aufnahme-Fenster je einen Pegel für „Ich“ und „Gegenüber“

#### Scenario: Headset-Hinweis
- **WHEN** die Person den Meeting-Modus einschaltet
- **THEN** empfiehlt ein Hinweis ein Headset, weil das Mikrofon sonst die Gegenseite aus dem Lautsprecher mit aufnimmt

### Requirement: Einverständnis
Das System MUST vor einer Meeting-Aufnahme bestätigen lassen, dass alle Beteiligten von der Aufnahme wissen und einverstanden sind.

#### Scenario: Ohne Bestätigung
- **WHEN** der Meeting-Modus eingeschaltet und das Einverständnis nicht bestätigt ist
- **THEN** startet keine Aufnahme
- **AND** ein Hinweis bittet um die Bestätigung

#### Scenario: Tastenkürzel ohne Bestätigung
- **WHEN** die Person im Meeting-Modus ohne Bestätigung das Tastenkürzel drückt
- **THEN** startet keine Aufnahme
- **AND** das Hauptfenster öffnet sich mit dem Hinweis

#### Scenario: Bestätigung zurücksetzen
- **WHEN** der Meeting-Modus ausgeschaltet oder das Textfeld geleert wird
- **THEN** muss das Einverständnis für das nächste Meeting erneut bestätigt werden

### Requirement: Systemton-Freigabe
Das System MUST verständlich erklären, wenn der Systemton nicht aufgenommen werden kann, und eine Lösung nennen.

#### Scenario: Freigabe unter macOS
- **WHEN** die Person auf macOS zum ersten Mal ein Meeting aufnimmt
- **THEN** fragt das Betriebssystem einmalig nach der Freigabe für Bildschirm- und Systemaudioaufnahme

#### Scenario: Freigabe fehlt
- **WHEN** der Systemton nicht aufgenommen werden kann, weil die Freigabe fehlt
- **THEN** startet keine Aufnahme
- **AND** ein Hinweis nennt, wo die Freigabe in den Systemeinstellungen erteilt wird

#### Scenario: Betriebssystem ohne Systemton
- **WHEN** das Betriebssystem keine Systemton-Aufnahme unterstützt (macOS vor 14.2)
- **THEN** ist der Meeting-Modus nicht wählbar und ein Hinweis nennt den Grund

### Requirement: Meeting-Notiz
Das System SHALL Meeting-Aufnahmen als eigene Notizart speichern.

#### Scenario: Meeting speichern
- **WHEN** die Person ein Meeting-Transkript als Notiz speichert
- **THEN** endet der Dateiname auf „Meeting.md“
- **AND** das Frontmatter enthält `tags: [diktat, meeting]` und die Überschrift beginnt mit „Meeting“
