## MODIFIED Requirements

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
