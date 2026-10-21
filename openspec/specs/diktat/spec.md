# diktat Specification

## Purpose
Diktieren im Browser: gesprochene Sprache wird zu Text, Fachbegriffe werden korrigiert, und das Ergebnis lässt sich als Obsidian-Notiz speichern oder an Claude übergeben.

## Requirements

### Requirement: Transkription
Das System SHALL gesprochene Sprache ausschließlich lokal auf dem Gerät in Text umwandeln. Audio darf das Gerät zu keinem Zeitpunkt verlassen.

#### Scenario: Kein eigener Server
- **WHEN** die Person diktiert
- **THEN** sendet die App keine Audiodaten an einen Server, einen Browser-Dienst oder eine KI-API

#### Scenario: Offline diktieren
- **GIVEN** das Modell ist geladen
- **WHEN** keine Internetverbindung besteht
- **THEN** wird die Aufnahme trotzdem transkribiert

#### Scenario: Stille
- **WHEN** eine Aufnahme oder ein Abschnitt nur Stille enthält
- **THEN** wird kein Text eingefügt, auch kein vom Modell erfundener Text wie „Untertitel im Auftrag des ZDF“

#### Scenario: Datenschutz-Hinweis
- **WHEN** die App geöffnet wird
- **THEN** weist sie darauf hin, dass das Audio auf dem Gerät bleibt und das Modell beim ersten Start einmalig geladen wird

### Requirement: Aufnahme mit Live-Text
Das System SHALL nach einem Klick auf „Aufnahme“ gesprochene Sprache (Deutsch) abschnittsweise als Text im Textfeld anzeigen, während die Aufnahme weiterläuft.

#### Scenario: Aufnahme starten
- **WHEN** die Person auf „Aufnahme“ klickt, „Guten Morgen zusammen“ sagt und kurz pausiert
- **THEN** erscheint „Guten Morgen zusammen“ im Textfeld, während die Aufnahme weiterläuft
- **AND** die App zeigt sichtbar an, dass sie zuhört

#### Scenario: Vorläufiger Text
- **WHEN** ein Abschnitt noch transkribiert wird
- **THEN** zeigt die App an, dass sie Text verarbeitet

#### Scenario: Aufnahme beenden
- **WHEN** die Person auf „Stopp“ klickt
- **THEN** endet die Aufnahme, der letzte Abschnitt wird noch transkribiert und der bisher erkannte Text bleibt erhalten

### Requirement: Durchgehende Aufnahme
Das System SHALL die Aufnahme fortsetzen, bis die Person auf „Stopp“ klickt, auch wenn die Person zwischendurch nicht spricht.

#### Scenario: Sprechpause
- **WHEN** die Person 5 Sekunden lang nicht spricht
- **THEN** läuft die Aufnahme weiter und neuer Text wird an den bestehenden Text angehängt

#### Scenario: Erneute Aufnahme
- **WHEN** die Person nach „Stopp“ erneut auf „Aufnahme“ klickt
- **THEN** wird neuer Text an den bestehenden Text angehängt, nicht ersetzt

### Requirement: Text bearbeiten und kopieren
Das System SHALL den erkannten Text editierbar anzeigen und auf Knopfdruck in die Zwischenablage kopieren.

#### Scenario: Text korrigieren
- **WHEN** die Person ein Wort im Textfeld ändert
- **THEN** wird der geänderte Text für Export und Übergabe verwendet

#### Scenario: Kopieren
- **WHEN** die Person auf „Kopieren“ klickt
- **THEN** liegt der Text in der Zwischenablage und die App bestätigt das mit „Kopiert“

### Requirement: Fachbegriffe korrigieren
Das System SHALL Begriffe aus einem Glossar im erkannten Text automatisch durch die korrekte Schreibweise ersetzen.

#### Scenario: Firmenname
- **WHEN** die Erkennung „blue forte“ liefert
- **THEN** steht im Text „Blueforte“

#### Scenario: Groß- und Kleinschreibung
- **WHEN** die Erkennung „Open Spec“ oder „open spec“ liefert
- **THEN** steht im Text „OpenSpec“

#### Scenario: Nur ganze Wörter
- **WHEN** ein Glossar-Begriff nur als Teil eines anderen Wortes vorkommt
- **THEN** wird dieses Wort nicht verändert

#### Scenario: Glossar erweitern
- **WHEN** die Person den Eintrag „cloud code → Claude Code“ zum Glossar hinzufügt
- **THEN** wird der Begriff in neu erkanntem Text korrigiert
- **AND** der Eintrag ist nach dem Neuladen der Seite noch vorhanden

### Requirement: Obsidian-Notiz
Das System SHALL das Diktat als Markdown-Datei im Obsidian-Format mit YAML-Frontmatter speichern. In der Desktop-App mit gewähltem Notizordner wird die Datei direkt dort abgelegt, sonst heruntergeladen.

#### Scenario: Notiz speichern
- **WHEN** die Person auf „Notiz speichern“ klickt
- **THEN** wird eine Datei `YYYY-MM-DD HHmm Diktat.md` erzeugt
- **AND** das Frontmatter enthält `datum`, `dauer` und `tags: [diktat]`
- **AND** unter dem Frontmatter stehen eine Überschrift mit Datum und Uhrzeit sowie der Text

#### Scenario: Speichern im Notizordner
- **GIVEN** die Desktop-App mit gewähltem Notizordner
- **WHEN** die Person auf „Notiz speichern“ klickt
- **THEN** liegt die Datei ohne weitere Nachfrage im Notizordner
- **AND** die App zeigt den Dateinamen an

#### Scenario: Gleicher Dateiname
- **WHEN** im Notizordner bereits eine Datei mit demselben Namen liegt
- **THEN** wird eine Nummer angehängt (z. B. `… Diktat 2.md`) und keine Datei überschrieben

#### Scenario: Speichern ohne Notizordner
- **WHEN** die App im Browser läuft oder kein Notizordner gewählt ist
- **THEN** wird die Datei heruntergeladen

#### Scenario: Leeres Diktat
- **WHEN** das Textfeld leer ist
- **THEN** sind „Notiz speichern“ und „An Claude übergeben“ deaktiviert

### Requirement: An Claude übergeben
Das System SHALL auf Knopfdruck einen Prompt mit dem Transkript in die Zwischenablage kopieren, damit er in Claude oder einem anderen Assistenten eingefügt werden kann.

#### Scenario: Übergabe
- **WHEN** die Person auf „An Claude übergeben“ klickt
- **THEN** enthält die Zwischenablage den Prompt „Mach aus diesem Diktat eine kurze Notiz mit Zusammenfassung und Action Items:“ gefolgt vom Text
- **AND** die App bestätigt das mit „Kopiert“

### Requirement: Hinweise bei Problemen
Das System MUST verständlich erklären, wenn das Diktieren nicht oder nur eingeschränkt möglich ist, und eine Lösung nennen.

#### Scenario: Browser ohne Spracherkennung
- **WHEN** der Browser keinen Mikrofon-Zugriff oder kein WebAssembly bietet
- **THEN** ist „Aufnahme“ deaktiviert
- **AND** ein Hinweis empfiehlt eine aktuelle Version von Chrome, Edge, Safari oder Firefox

#### Scenario: Ohne Grafikbeschleunigung
- **WHEN** der Browser keine Grafikbeschleunigung (WebGPU) für das Modell bietet
- **THEN** transkribiert die App trotzdem, langsamer auf dem Prozessor
- **AND** ein Hinweis erklärt, dass die Verarbeitung länger dauert

#### Scenario: Mikrofon verweigert
- **WHEN** die Person den Zugriff auf das Mikrofon ablehnt
- **THEN** endet die Aufnahme
- **AND** ein Hinweis erklärt, wie man den Zugriff in den Browser-Einstellungen erlaubt

#### Scenario: Modell kann nicht geladen werden
- **WHEN** das Modell beim ersten Start nicht heruntergeladen werden kann (z. B. ohne Internet)
- **THEN** erklärt ein Hinweis, dass für den ersten Start einmalig eine Internetverbindung nötig ist

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

### Requirement: Audiodatei hochladen
Das System SHALL hochgeladene Audiodateien lokal transkribieren und den Text an das Textfeld anhängen.

#### Scenario: Sprachmemo hochladen
- **WHEN** die Person eine Audiodatei (z. B. m4a, mp3, wav, webm) auswählt
- **THEN** wird ihr Inhalt transkribiert und an den bestehenden Text angehängt
- **AND** das Glossar wird auf den Text angewendet

#### Scenario: Ungeeignete Datei
- **WHEN** die Datei kein lesbares Audio enthält
- **THEN** erklärt ein Hinweis, dass die Datei nicht gelesen werden konnte

### Requirement: Übersetzung nach Englisch
Das System SHALL auf Wunsch gesprochenes Deutsch direkt als englischen Text ausgeben.

#### Scenario: Übersetzen einschalten
- **WHEN** die Person „Ins Englische übersetzen“ einschaltet und „Guten Morgen zusammen“ sagt
- **THEN** erscheint ein englischer Text wie „Good morning everyone“

#### Scenario: Übersetzen ausgeschaltet
- **WHEN** der Schalter aus ist
- **THEN** erscheint der Text auf Deutsch

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
