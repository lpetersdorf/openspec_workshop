# Design

## Context

Siehe proposal.md. Ausgangslage im Code:

- Der Ton wird laufend vom `Segmenter` in Abschnitte von höchstens 20 Sekunden zerlegt und an den Worker geschickt. Die App hält also nie die ganze Stunde Audio im Speicher, der Speicherbedarf bleibt auch bei langen Meetings klein.
- Der Worker arbeitet die Abschnitte nacheinander ab (`queue` in `whisper-worker.js`). `app.js` zählt die offenen Abschnitte in `pending` und schickt `recording`, `pending` und `dirty` per `sendState` an den Hauptprozess. Das Aufnahme-Fenster zeigt bereits „N in Arbeit“.
- Das Transkript existiert nur in `ui.text.value`. `appendTurn` setzt Absätze mit `**Ich:**` und `**Gegenüber:**`.
- Der Hauptprozess fragt beim Beenden nach, wenn Text ungespeichert ist (`needsConfirm`), und schreibt Einstellungen als JSON in `app.getPath('userData')`.
- Die Modellwahl ist gesperrt, solange eine Aufnahme läuft oder transkribiert wird.
- Pure Funktionen sind über `window.BFN` in der Browser-Konsole testbar.

## Goals / Non-Goals

**Goals:**
- Nach einem Absturz gehen höchstens die letzten 30 Sekunden Text verloren
- Kein neuer Prozess, keine neue Abhängigkeit

**Non-Goals:**
- Kein Sichern des Audios, keine Neu-Transkription nach einem Absturz
- Keine Wiederherstellung in der Web-App

## Decisions

**1. Entwurf als Datei in den App-Daten, geschrieben vom Hauptprozess**
`desktop/main.js` bekommt `draft:save`, `draft:load` und `draft:clear`. Der Entwurf liegt als `draft.json` in `userData` mit `{ text, meeting, lastSpeaker, recordedMs, savedAt }`. Geschrieben wird erst in `draft.json.tmp`, dann per `rename` ersetzt. So bleibt bei einem Absturz mitten im Schreiben die alte, vollständige Version erhalten.
- Alternative Notizordner: verworfen. Der Entwurf würde im Obsidian-Vault auftauchen, mit synchronisiert werden und Konflikte erzeugen. Außerdem kann der Ordner fehlen.
- Alternative `localStorage`: verworfen. Der Hauptprozess muss beim Beenden wissen, ob ein Entwurf existiert, und `localStorage` wird bei einem Absturz des Renderers nicht zuverlässig weggeschrieben.

**2. Sichern gedrosselt im Renderer**
`app.js` ruft nach jeder Textänderung (neue Transkription, Eingabe, Ersetzen über das Glossar) `scheduleDraft()` auf. Läuft noch kein Timer, wird in 30 Sekunden gesichert. Beim Stoppen der Aufnahme wird sofort gesichert. Nach dem Speichern der Notiz und beim Leeren wird `clearDraft()` aufgerufen. So entstehen höchstens zwei Schreibvorgänge pro Minute.

**3. Wiederherstellen beim Start**
Beim Start fragt `app.js` `loadDraft()`. Gibt es einen Entwurf mit Text, erscheint ein Hinweisbalken über dem Textfeld mit Datum, Uhrzeit, Wortzahl und den Knöpfen „Wiederherstellen“ und „Verwerfen“. Wiederherstellen setzt Text, `meetingContent`, `lastSpeaker` und `recordedMs`, damit Notizart, Dauer und Zeitmarken stimmen. Der wiederhergestellte Text gilt als ungespeichert.
Ein Entwurf existiert nur, solange Text ungespeichert ist. Deshalb braucht es keine Absturz-Erkennung: Gibt es beim Start einen Entwurf, wurde er nicht gespeichert. Das deckt auch „Beenden trotz Nachfrage“ ab. Der Text im Dialog „Beim Beenden geht der Text verloren“ wird zu „Der Text bleibt als Entwurf erhalten und wird beim nächsten Start angeboten“.

**4. Ruhezustand über `powerSaveBlocker`**
In `onStateFromUI` startet der Hauptprozess `powerSaveBlocker.start('prevent-app-suspension')`, sobald `recording || pending > 0`, und stoppt ihn, sobald beides nicht mehr zutrifft.
- Alternative `prevent-display-sleep`: verworfen. Der Bildschirm muss für die Aufnahme nicht an sein, und es kostet unnötig Akku.
- Grenze: Bei zugeklapptem MacBook ohne externen Bildschirm schläft macOS trotzdem ein. Das steht in der README.

**5. Rückstau-Hinweis aus `pending`**
Konstante `BACKLOG_HINT = 10`. Erreicht `pending` während der Aufnahme diesen Wert, erscheint ein Hinweis. Er verschwindet bei `pending === 0` (Hysterese, damit er nicht flackert). Die empfohlene Stufe ist die nächstschnellere in der Reihenfolge von `MODELS` (`turbo → small → base → tiny`). Ein neuer reiner Helfer `fasterModel(key)` liefert sie oder `null`. Gewechselt wird nicht automatisch, weil die Modellwahl während der Aufnahme gesperrt ist und ein Wechsel mitten im Meeting die Warteschlange zusätzlich verzögern würde.
Das Aufnahme-Fenster zeigt den Hinweis über das bestehende `pending` im Status. Bei 10 und mehr wird „Text verzögert · N in Arbeit“ angezeigt statt „N in Arbeit“.
10 Abschnitte entsprechen bei höchstens 20 Sekunden je Abschnitt maximal rund drei Minuten Verzögerung.

**6. Zeitmarken aus der Aufnahmezeit**
Gibt der `Segmenter` einen Abschnitt aus, berechnet `app.js` den Beginn als `totalMs() − Dauer des Abschnitts`. Dieser Wert wird zusammen mit dem Sprecher gemerkt (bisher `speakers`-Map, künftig `{ speaker, atMs }`). `appendTurn` bekommt einen optionalen fünften Parameter `atMs` und setzt bei einem neuen Absatz `**[mm:ss] Gegenüber:**`, ab einer Stunde `**[h:mm:ss] …:**`. Die Formatierung übernimmt eine neue reine Funktion `formatTimestamp(ms)`. `formatDuration` bleibt unverändert, weil das Frontmatter-Feld `dauer` sonst sein Format ändern würde.
Da `recordedMs` über mehrere Aufnahmen weiterzählt und erst beim Leeren zurückgesetzt wird, zählen auch die Zeitmarken weiter.
Ohne `atMs` (Audiodatei-Upload) bleibt die Kennzeichnung wie bisher.

## Risks / Trade-offs

- [Zeitmarke ungenau] → Der Abschnitt beginnt bis zu 0,3 Sekunden Vorlauf vor dem ersten Wort. Für ein Protokoll reicht die Genauigkeit auf Sekunden.
- [Reihenfolge bei gleichzeitigem Sprechen] → Abschnitte erscheinen in der Reihenfolge, in der sie fertig zerlegt wurden, nicht strikt nach Startzeit. Die Zeitmarken machen das sichtbar. Ein Umsortieren ist nicht im Umfang.
- [Entwurf enthält vertrauliche Inhalte] → Er liegt nur lokal in den App-Daten des Benutzers und wird nach dem Speichern gelöscht. Es wird nichts übertragen.
- [Rückstau trotz Hinweis] → Es geht nichts verloren, der Text kommt nur später. Nach dem Stoppen arbeitet die App die Warteschlange ab, und der Rechner bleibt dabei wach (Entscheidung 4).
- [Markdown der Zeitmarke] → `**[12:34] Ich:**` ist in Obsidian kein Link (kein doppeltes `[[`), bleibt also reiner Text.
