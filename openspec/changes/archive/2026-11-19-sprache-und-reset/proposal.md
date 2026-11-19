# Proposal

## Why

Die Spracherkennung ist fest auf Deutsch eingestellt. Englische Meetings werden deshalb falsch oder halb übersetzt erkannt. Zwischen zwei Meetings lassen sich Text und Aufnahmezeit nur über den kaum sichtbaren Knopf „Leeren“ zurücksetzen. Er fragt nicht nach und funktioniert sogar während einer laufenden Aufnahme. Ein falscher Klick kann so ein ungespeichertes Meeting von einer Stunde löschen. Außerdem führt der Hinweis bei fehlender Systemton-Freigabe nicht zum Ziel, wenn die App nur ihr Fenster schließt und im Hintergrund weiterläuft.

## What Changes

- Neu: **Sprache wählen**. Neben der Modellwahl gibt es eine Auswahl der gesprochenen Sprache: Deutsch (Standard, wie bisher), Englisch, Französisch, Spanisch, Italienisch und „Automatisch erkennen“. Die Wahl bleibt nach einem Neustart erhalten. Sie gilt für Diktat, Meeting-Modus und hochgeladene Audiodateien.
- Geändert: **Übersetzung nach Englisch**. Die Übersetzung funktioniert aus jeder gewählten Sprache, nicht nur aus Deutsch. Mit „Sehr genau“ bleibt sie gesperrt.
- Geändert: **„Leeren“ wird zu „Neue Notiz“**. Der Knopf ist gut sichtbar und setzt Text, Aufnahmezeit, Zeitmarken, Sprecher, Meeting-Einverständnis und Entwurf zurück. Bei ungespeichertem Text fragt die App vorher nach. Während einer Aufnahme oder Transkription ist der Knopf gesperrt.
- Neu: Nach „Notiz speichern“ im Hauptfenster erklärt ein kurzer Hinweis, dass „Neue Notiz“ alles für das nächste Meeting zurücksetzt.
- Geändert: **Systemton-Hinweis** unter macOS. Er sagt jetzt auch, dass die App nach dem Erteilen der Freigabe über das Menüleisten-Symbol beendet und aus dem Programme-Ordner neu gestartet werden muss.

## Nicht im Umfang

- Oberfläche in anderen Sprachen (sie bleibt Deutsch)
- Übersetzung in andere Zielsprachen als Englisch
- Wechsel der Sprache innerhalb eines Abschnitts oder Erkennung mehrerer Sprachen pro Abschnitt
- Eigene Sprachwahl für „Ich“ und „Gegenüber“ im Meeting-Modus
- Sprachangabe im Frontmatter der Notiz
- Filter für erfundene Sätze (z. B. „Untertitel im Auftrag des ZDF“) in anderen Sprachen als Deutsch
- „Neue Notiz“ im Aufnahme-Fenster (dort leert „Notiz speichern“ schon heute)
- Rückgängig machen von „Neue Notiz“

## Capabilities

### New Capabilities

_keine_

### Modified Capabilities

- `diktat`: neue Requirements „Sprache wählen“ und „Neue Notiz“; geänderte Requirements „Aufnahme mit Live-Text“ (gewählte Sprache statt fest Deutsch) und „Übersetzung nach Englisch“ (aus jeder Sprache)
- `desktop`: geändertes Requirement „Systemton-Freigabe“ (Hinweis auf vollständiges Beenden und Neustart)

## Impact

- `whisper-worker.js`: Sprache pro Abschnitt aus der Nachricht statt fest `german`, bei „Automatisch“ ohne Sprachvorgabe
- `app.js`: Sprachauswahl mit Speicherung in `localStorage`, Sprache bei jedem `transcribe`; `clearText` wird zu `newNote` mit Rückfrage und Sperre; Hinweis nach dem Speichern; neuer Systemton-Fehlertext
- `index.html`, `style.css`: Auswahl „Sprache“, Knopf „Neue Notiz“ im normalen Stil
- README: Sprachwahl und „Neue Notiz“, „Leeren“ im Abschnitt „Lange Meetings“ ersetzen
- Der offene Change `lange-meetings` nennt noch „Leeren“. Er sollte vor diesem Change archiviert werden.
