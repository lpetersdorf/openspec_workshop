## ADDED Requirements

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
