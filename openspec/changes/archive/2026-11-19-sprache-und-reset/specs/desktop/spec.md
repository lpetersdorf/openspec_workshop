## MODIFIED Requirements

### Requirement: Systemton-Freigabe
Das System MUST verständlich erklären, wenn der Systemton nicht aufgenommen werden kann, und eine Lösung nennen.

#### Scenario: Freigabe unter macOS
- **WHEN** die Person auf macOS zum ersten Mal ein Meeting aufnimmt
- **THEN** fragt das Betriebssystem einmalig nach der Freigabe für Bildschirm- und Systemaudioaufnahme

#### Scenario: Freigabe fehlt
- **WHEN** der Systemton nicht aufgenommen werden kann, weil die Freigabe fehlt
- **THEN** startet keine Aufnahme
- **AND** ein Hinweis nennt, wo die Freigabe in den Systemeinstellungen erteilt wird

#### Scenario: Neustart nach der Freigabe
- **WHEN** unter macOS der Hinweis zur fehlenden Freigabe erscheint
- **THEN** erklärt er auch, dass die App danach über das Symbol in der Menüleiste beendet und aus dem Programme-Ordner neu gestartet werden muss, weil das Schließen des Fensters sie nicht beendet

#### Scenario: Betriebssystem ohne Systemton
- **WHEN** das Betriebssystem keine Systemton-Aufnahme unterstützt (macOS vor 14.2)
- **THEN** ist der Meeting-Modus nicht wählbar und ein Hinweis nennt den Grund
