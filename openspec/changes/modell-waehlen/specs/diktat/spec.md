## ADDED Requirements

### Requirement: Modell wählen
Das System SHALL vier Whisper-Modelle zur Auswahl anbieten, „Schnell“ (tiny), „Standard“ (base), „Genau“ (small) und „Sehr genau“ (large-v3-turbo), und die Wahl für spätere Starts speichern.

#### Scenario: Auswahl mit Größe
- **WHEN** die Person die Modellauswahl öffnet
- **THEN** sieht sie zu jedem Modell die Download-Größe für dieses Gerät
- **AND** bereits geladene Modelle sind als „geladen“ markiert

#### Scenario: Modell wechseln
- **WHEN** die Person ein anderes Modell wählt
- **THEN** lädt die App es mit Fortschrittsanzeige
- **AND** neue Aufnahmen werden danach mit diesem Modell transkribiert

#### Scenario: Wahl bleibt erhalten
- **WHEN** die App nach einem erfolgreichen Wechsel neu gestartet wird
- **THEN** ist das zuletzt gewählte Modell aktiv

#### Scenario: Kein Wechsel während der Arbeit
- **WHEN** eine Aufnahme läuft, noch transkribiert wird oder gerade ein Modell lädt
- **THEN** ist die Modellauswahl gesperrt

#### Scenario: Sehr genau nur mit Grafikkarte
- **WHEN** das Gerät keine Grafikbeschleunigung (WebGPU) bietet
- **THEN** ist „Sehr genau“ nicht wählbar und mit „nur mit Grafikkarte“ gekennzeichnet

#### Scenario: Genau ohne Grafikkarte
- **WHEN** „Genau“ ohne Grafikbeschleunigung gewählt wird
- **THEN** weist ein Hinweis darauf hin, dass die Transkription deutlich länger dauert

#### Scenario: Übersetzen mit Sehr genau
- **WHEN** „Sehr genau“ aktiv ist
- **THEN** ist „Ins Englische übersetzen“ ausgeschaltet und gesperrt
- **AND** ein Hinweis erklärt, dass dieses Modell nicht übersetzt

#### Scenario: Download scheitert
- **WHEN** das gewählte Modell nicht geladen werden kann (z. B. ohne Internet)
- **THEN** bleibt das bisherige Modell aktiv und in der Auswahl eingestellt
- **AND** ein Hinweis erklärt, dass für den ersten Download eines Modells eine Internetverbindung nötig ist

## MODIFIED Requirements

### Requirement: Modell laden
Das System SHALL das gewählte Spracherkennungsmodell beim ersten Gebrauch herunterladen, den Fortschritt anzeigen und es für spätere Starts auf dem Gerät speichern. Beim allerersten Start ist „Standard“ (Whisper base) gewählt.

#### Scenario: Erster Start
- **WHEN** die App zum ersten Mal geöffnet wird
- **THEN** lädt sie „Standard“ und zeigt den Download-Fortschritt in Prozent

#### Scenario: Erneuter Start
- **WHEN** die App erneut geöffnet wird und das gewählte Modell bereits gespeichert ist
- **THEN** ist sie ohne erneuten Download einsatzbereit

#### Scenario: Aufnahme während des Ladens
- **WHEN** die Person auf „Aufnahme“ klickt, bevor das Modell geladen ist
- **THEN** wird die Aufnahme angenommen und transkribiert, sobald das Modell bereit ist
