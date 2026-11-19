## ADDED Requirements

### Requirement: Entwurf sichern
Das System SHALL in der Desktop-App ungespeicherten Text automatisch als Entwurf auf dem Gerät sichern und nach einem unerwarteten Ende beim nächsten Start zur Wiederherstellung anbieten. Der Entwurf liegt nicht im Notizordner.

#### Scenario: Regelmäßig sichern
- **WHEN** sich der Text ändert, z. B. durch eine neue Transkription oder eine Bearbeitung
- **THEN** ist die Änderung spätestens 30 Sekunden später als Entwurf gesichert

#### Scenario: Wiederherstellen nach Absturz
- **GIVEN** die App wurde mit ungespeichertem Text unerwartet beendet, z. B. durch einen Absturz oder Stromausfall
- **WHEN** die Person die App wieder startet
- **THEN** zeigt die App einen Hinweis mit Datum, Uhrzeit und Länge des Entwurfs sowie „Wiederherstellen“ und „Verwerfen“

#### Scenario: Wiederherstellen
- **WHEN** die Person im Hinweis „Wiederherstellen“ wählt
- **THEN** steht der Text des Entwurfs im Textfeld
- **AND** ein Meeting-Entwurf wird beim Speichern wieder als Meeting-Notiz abgelegt

#### Scenario: Verwerfen
- **WHEN** die Person im Hinweis „Verwerfen“ wählt
- **THEN** wird der Entwurf gelöscht und das Textfeld bleibt leer

#### Scenario: Nach dem Speichern
- **WHEN** der Text als Notiz gespeichert oder das Textfeld geleert wird
- **THEN** wird der Entwurf gelöscht
- **AND** beim nächsten Start erscheint kein Hinweis

#### Scenario: Beenden trotz ungespeichertem Text
- **WHEN** die Person die App mit ungespeichertem Text über „Beenden“ verlässt und die Nachfrage bestätigt
- **THEN** bleibt der Entwurf erhalten und wird beim nächsten Start angeboten

#### Scenario: Speichern nicht möglich
- **WHEN** der Entwurf nicht geschrieben werden kann, z. B. weil die Festplatte voll ist
- **THEN** weist die App einmalig darauf hin
- **AND** die Aufnahme läuft weiter

### Requirement: Wach bleiben während der Aufnahme
Das System SHALL verhindern, dass der Rechner in den Ruhezustand geht, solange eine Aufnahme läuft oder noch transkribiert wird. Der Bildschirm darf sich dabei abschalten.

#### Scenario: Lange Aufnahme ohne Eingabe
- **GIVEN** eine Aufnahme läuft
- **WHEN** die Person länger als die eingestellte Ruhezustand-Zeit des Systems nichts eingibt
- **THEN** geht der Rechner nicht in den Ruhezustand und die Aufnahme läuft weiter

#### Scenario: Nach der Aufnahme
- **WHEN** die Aufnahme endet und alle Abschnitte transkribiert sind
- **THEN** gelten wieder die normalen Energieeinstellungen des Systems

### Requirement: Rückstau-Hinweis
Das System SHALL darauf hinweisen, wenn die Transkription deutlich hinter der Aufnahme zurückliegt, und ein schnelleres Modell empfehlen, sofern es eines gibt.

#### Scenario: Viele Abschnitte warten
- **WHEN** während einer Aufnahme 10 oder mehr Abschnitte auf die Transkription warten
- **THEN** zeigt die App einen Hinweis, dass der Text verzögert erscheint und nichts verloren geht
- **AND** der Hinweis empfiehlt, für die nächste Aufnahme eine schnellere Stufe zu wählen, und nennt sie

#### Scenario: Bereits schnellste Stufe
- **WHEN** viele Abschnitte warten und die Stufe „Schnell“ aktiv ist
- **THEN** zeigt der Hinweis die Verzögerung ohne Modellempfehlung

#### Scenario: Rückstau abgebaut
- **WHEN** keine Abschnitte mehr warten
- **THEN** verschwindet der Hinweis

#### Scenario: Aufnahme-Fenster
- **WHEN** viele Abschnitte warten und die Aufnahme im Hintergrund läuft
- **THEN** zeigt das Aufnahme-Fenster die Zahl der wartenden Abschnitte

## MODIFIED Requirements

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

#### Scenario: Zeitmarke beim Sprecherwechsel
- **WHEN** ein neuer Absatz beginnt
- **THEN** steht vor der Kennzeichnung die Aufnahmezeit, zu der der Abschnitt begann, z. B. „[12:34] Gegenüber:“
- **AND** ab einer Stunde Aufnahmezeit mit Stunden, z. B. „[1:02:15] Ich:“

#### Scenario: Zeit über mehrere Aufnahmen
- **WHEN** die Person eine Aufnahme stoppt und ohne Leeren des Textfelds eine weitere startet
- **THEN** zählen die Zeitmarken ab der bisherigen Aufnahmezeit weiter

#### Scenario: Nur in der Desktop-App
- **WHEN** die App im Browser läuft
- **THEN** gibt es keinen Schalter für den Meeting-Modus

#### Scenario: Zwei Pegel
- **WHEN** eine Meeting-Aufnahme im Hintergrund läuft
- **THEN** zeigt das Aufnahme-Fenster je einen Pegel für „Ich“ und „Gegenüber“

#### Scenario: Headset-Hinweis
- **WHEN** die Person den Meeting-Modus einschaltet
- **THEN** empfiehlt ein Hinweis ein Headset, weil das Mikrofon sonst die Gegenseite aus dem Lautsprecher mit aufnimmt
