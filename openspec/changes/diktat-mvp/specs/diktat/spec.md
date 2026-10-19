## Purpose

Diktieren im Browser: gesprochene Sprache wird zu Text, Fachbegriffe werden korrigiert, und das Ergebnis lässt sich als Obsidian-Notiz speichern oder an Claude übergeben.

## ADDED Requirements

### Requirement: Transkription
Das System SHALL gesprochene Sprache mit der Spracherkennung des Browsers in Text umwandeln und dafür keinen eigenen Server und keinen API-Key verwenden.

#### Scenario: Kein eigener Server
- **WHEN** die Person diktiert
- **THEN** sendet die App selbst keine Audiodaten an einen eigenen Server oder eine KI-API

#### Scenario: Datenschutz-Hinweis
- **WHEN** die App geöffnet wird
- **THEN** weist sie darauf hin, dass die Spracherkennung des Browsers Audio an den Hersteller sendet und keine vertraulichen Inhalte diktiert werden sollen

### Requirement: Aufnahme mit Live-Text
Das System SHALL nach einem Klick auf „Aufnahme“ gesprochene Sprache (Deutsch) fortlaufend als Text im Textfeld anzeigen.

#### Scenario: Aufnahme starten
- **WHEN** die Person auf „Aufnahme“ klickt und „Guten Morgen zusammen“ sagt
- **THEN** erscheint „Guten Morgen zusammen“ im Textfeld
- **AND** die App zeigt sichtbar an, dass sie zuhört

#### Scenario: Vorläufiger Text
- **WHEN** die Erkennung einen Satz noch nicht abgeschlossen hat
- **THEN** wird der vorläufige Text optisch vom fertigen Text unterschieden

#### Scenario: Aufnahme beenden
- **WHEN** die Person auf „Stopp“ klickt
- **THEN** endet die Aufnahme und der bisher erkannte Text bleibt erhalten

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
Das System SHALL das Diktat als Markdown-Datei im Obsidian-Format mit YAML-Frontmatter speichern.

#### Scenario: Notiz speichern
- **WHEN** die Person auf „Notiz speichern“ klickt
- **THEN** wird eine Datei `YYYY-MM-DD HHmm Diktat.md` heruntergeladen
- **AND** das Frontmatter enthält `datum`, `dauer` und `tags: [diktat]`
- **AND** unter dem Frontmatter stehen eine Überschrift mit Datum und Uhrzeit sowie der Text

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
Das System MUST verständlich erklären, wenn das Diktieren nicht möglich ist, und eine Lösung nennen.

#### Scenario: Browser ohne Spracherkennung
- **WHEN** die App in einem Browser ohne Spracherkennung geöffnet wird (z. B. Firefox)
- **THEN** ist „Aufnahme“ deaktiviert
- **AND** ein Hinweis empfiehlt Chrome, Edge oder Safari

#### Scenario: Mikrofon verweigert
- **WHEN** die Person den Zugriff auf das Mikrofon ablehnt
- **THEN** endet die Aufnahme
- **AND** ein Hinweis erklärt, wie man den Zugriff in den Browser-Einstellungen erlaubt
