## ADDED Requirements

### Requirement: Sprache wählen
Das System SHALL die gesprochene Sprache zur Auswahl anbieten: Deutsch (Standard), Englisch, Französisch, Spanisch, Italienisch und „Automatisch erkennen“. Die Wahl gilt für Aufnahme, Meeting-Modus und hochgeladene Audiodateien und bleibt für spätere Starts gespeichert. Die Oberfläche bleibt deutsch.

#### Scenario: Standard
- **WHEN** die App zum ersten Mal gestartet wird
- **THEN** ist „Deutsch“ gewählt und deutsche Sprache wird wie bisher erkannt

#### Scenario: Englisch wählen
- **WHEN** die Person „Englisch“ wählt und „Good morning everyone“ sagt
- **THEN** erscheint „Good morning everyone“ im Textfeld, nicht übersetzt

#### Scenario: Automatisch erkennen
- **WHEN** die Person „Automatisch erkennen“ wählt und einen Abschnitt auf Englisch und danach einen auf Deutsch spricht
- **THEN** erscheint jeder Abschnitt in der Sprache, in der er gesprochen wurde
- **AND** ein Hinweis erklärt, dass die Erkennung je Abschnitt erfolgt und bei kurzen Abschnitten danebenliegen kann

#### Scenario: Wahl bleibt erhalten
- **WHEN** die App nach einem Wechsel auf „Englisch“ neu gestartet wird
- **THEN** ist „Englisch“ gewählt

#### Scenario: Wechsel während der Aufnahme
- **WHEN** die Person während einer laufenden Aufnahme die Sprache wechselt
- **THEN** werden alle danach aufgenommenen Abschnitte in der neuen Sprache erkannt
- **AND** bereits erkannter Text bleibt unverändert

#### Scenario: Audiodatei
- **WHEN** „Englisch“ gewählt ist und die Person eine englische Audiodatei hochlädt
- **THEN** wird die Datei als englischer Text transkribiert

### Requirement: Neue Notiz
Das System SHALL über einen gut sichtbaren Knopf „Neue Notiz“ Text, Aufnahmezeit, Zeitmarken, letzten Sprecher, Meeting-Einverständnis und gesicherten Entwurf zurücksetzen, damit die nächste Aufnahme bei 0:00 beginnt.

#### Scenario: Zurücksetzen nach dem Speichern
- **GIVEN** der Text ist als Notiz gespeichert
- **WHEN** die Person auf „Neue Notiz“ klickt
- **THEN** ist das Textfeld leer, die Zeit steht auf 0:00 und das Einverständnis ist nicht mehr bestätigt
- **AND** die nächste Meeting-Aufnahme beginnt mit der Zeitmarke `[0:00]`

#### Scenario: Ungespeicherter Text
- **GIVEN** der Text ist noch nicht als Notiz gespeichert
- **WHEN** die Person auf „Neue Notiz“ klickt
- **THEN** fragt die App, ob der ungespeicherte Text verworfen werden soll
- **AND** bei „Abbrechen“ bleiben Text, Zeit und Entwurf unverändert

#### Scenario: Gesperrt während der Arbeit
- **WHEN** eine Aufnahme läuft oder noch transkribiert wird
- **THEN** ist „Neue Notiz“ gesperrt

#### Scenario: Nichts zurückzusetzen
- **WHEN** das Textfeld leer ist und die Zeit auf 0:00 steht
- **THEN** ist „Neue Notiz“ gesperrt

#### Scenario: Hinweis nach dem Speichern
- **WHEN** die Person im Hauptfenster auf „Notiz speichern“ klickt und die Notiz gespeichert wurde
- **THEN** bleiben Text und Zeit stehen
- **AND** ein kurzer Hinweis erklärt, dass „Neue Notiz“ Text und Zeit für die nächste Aufnahme zurücksetzt

## MODIFIED Requirements

### Requirement: Aufnahme mit Live-Text
Das System SHALL nach einem Klick auf „Aufnahme“ gesprochene Sprache in der gewählten Sprache (Standard: Deutsch) abschnittsweise als Text im Textfeld anzeigen, während die Aufnahme weiterläuft.

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

### Requirement: Übersetzung nach Englisch
Das System SHALL auf Wunsch gesprochene Sprache in jeder wählbaren Sprache direkt als englischen Text ausgeben.

#### Scenario: Übersetzen einschalten
- **WHEN** die Person „Ins Englische übersetzen“ einschaltet und „Guten Morgen zusammen“ sagt
- **THEN** erscheint ein englischer Text wie „Good morning everyone“

#### Scenario: Übersetzen aus anderer Sprache
- **WHEN** „Französisch“ gewählt ist, „Ins Englische übersetzen“ eingeschaltet ist und die Person „Bonjour à tous“ sagt
- **THEN** erscheint ein englischer Text wie „Hello everyone“

#### Scenario: Übersetzen ausgeschaltet
- **WHEN** der Schalter aus ist
- **THEN** erscheint der Text in der gesprochenen Sprache
