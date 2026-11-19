# Design

## Context

- `whisper-worker.js` ruft den Transcriber fest mit `language: 'german'` auf. `app.js` schickt pro Abschnitt `{ type: 'transcribe', id, audio, translate }`. Das gilt für Aufnahme, Meeting-Modus (zwei Spuren) und Datei-Upload.
- transformers.js 3.8.1 (`vendor/transformers.min.js`) erkennt die Sprache **nicht** selbst. Fehlt `language`, setzt `_retrieve_init_tokens` mit einer Warnung Englisch ein. Für „Automatisch erkennen“ ist deshalb ein eigener Schritt nötig.
- Die Modellwahl liegt in `localStorage` (`bfn-modell`) und ist während Aufnahme, Transkription und Laden gesperrt (`lockModelSelect`).
- `clearText()` setzt heute schon Text, `recordedMs`, Sprecher, Meeting-Status, Einverständnis und Entwurf zurück. Der Knopf `#clearBtn` hat die Klasse `ghost` und ist nie gesperrt.
- `saveNote()` im Hauptfenster ruft `markSaved()` auf (Text bleibt). Aus dem Aufnahme-Fenster ruft es `clearText()` auf.
- Der Systemton-Fehlertext steht in `app.js` (macOS-Variante und allgemeine Variante).

## Goals / Non-Goals

**Goals:**
- Sprache pro Abschnitt wählbar, ohne Neuladen des Modells
- „Automatisch erkennen“, das nur zwischen den angebotenen Sprachen wählt
- Sicheres Zurücksetzen mit Rückfrage und Sperre

**Non-Goals:**
- Siehe „Nicht im Umfang“ im Proposal

## Decisions

### Sprache als Teil jeder Transkriptions-Nachricht

`app.js` schickt `language` mit jeder `transcribe`-Nachricht: `'german'`, `'english'`, `'french'`, `'spanish'`, `'italian'` oder `'auto'`. Der Worker reicht feste Sprachen direkt an den Transcriber weiter. Weil der Wert bei jeder Nachricht mitkommt, gilt ein Wechsel während der Aufnahme ab dem nächsten Abschnitt. Der Worker braucht keinen Zustand und das Modell wird nicht neu geladen. Deshalb ist die Sprachauswahl, anders als die Modellwahl, während der Aufnahme nicht gesperrt.

Speicherung in `localStorage` unter `bfn-sprache`, Standard `german`. Ein unbekannter gespeicherter Wert fällt auf `german` zurück.

### Automatisch erkennen: ein Decoder-Schritt vor der Transkription

Bei `'auto'` berechnet der Worker zuerst die Merkmale des Abschnitts (`transcriber.processor`) und ruft das Modell einmal mit nur dem Start-Token als `decoder_input_ids` auf. Aus den Logits des ersten Schritts nimmt er unter den Sprach-Tokens der angebotenen Sprachen (`<|de|>`, `<|en|>`, `<|fr|>`, `<|es|>`, `<|it|>`, über `generation_config.lang_to_id`) das wahrscheinlichste. Danach transkribiert er wie bei fester Sprache.

- Die Beschränkung auf die angebotenen Sprachen verhindert, dass ein Abschnitt mit Akzent z. B. als Niederländisch erkannt wird.
- Alternative „Sprache einmal pro Aufnahme erkennen“ verworfen: Gemischtsprachige Meetings würden dann falsch erkannt, und die Spec verlangt die Erkennung je Abschnitt.
- Alternative „transformers.js aktualisieren“ verworfen: Auch neuere 3.x-Versionen fallen ohne Sprache auf Englisch zurück.
- Gelingt die Erkennung nicht (Fehler beim Aufruf), wird mit `german` transkribiert und der Fehler nur in der Konsole gemeldet.

### Übersetzen

`task: 'translate'` bleibt unabhängig von der Sprache. Whisper übersetzt aus der angegebenen bzw. erkannten Sprache. Die Sperre für „Sehr genau“ (`noTranslate`) bleibt unverändert.

### Auswahl in der Oberfläche

Neben „Modell“ in `.model-row` ein zweites `<label class="model-pick">Sprache <select id="langSelect">`. Bei „Automatisch erkennen“ erscheint ein Hinweis (`.model-hint`): Die Erkennung erfolgt je Abschnitt, kann bei kurzen Abschnitten danebenliegen und braucht etwas mehr Rechenzeit. Bei bekannter Sprache ist die feste Wahl zuverlässiger.

### „Neue Notiz“ statt „Leeren“

- `#clearBtn` heißt „Neue Notiz“, die Klasse `ghost` entfällt.
- Handler `newNote()`: Ist `ui.text.value.trim()` nicht leer und ungleich `savedText`, fragt `window.confirm('Der Text ist noch nicht als Notiz gespeichert. Trotzdem verwerfen und neu beginnen?')`. Bei „Abbrechen“ passiert nichts. Danach `clearText()`. `confirm` funktioniert im Browser und in Electron und braucht keine neue Oberfläche.
- `updateButtons()` sperrt den Knopf bei `recording || pending > 0` und wenn nichts zurückzusetzen ist (Text leer und `recordedMs === 0`).
- `clearText()` bleibt die interne Funktion für das Aufnahme-Fenster. Dort hat die Person gerade gespeichert, eine Rückfrage ist also nicht nötig.

### Hinweis nach dem Speichern

Im Hauptfenster zeigt der vorhandene Toast nach erfolgreichem Speichern `Gespeichert: <Name> · „Neue Notiz“ setzt Text und Zeit zurück`. Gilt für Notizordner und Download. Der Toast verschwindet wie bisher von selbst.

### Systemton-Hinweis

Die macOS-Variante wird ergänzt: „… Blueforte Notes erlauben. Danach die App über das Symbol in der Menüleiste › Beenden schließen und aus dem Programme-Ordner neu starten. Das Schließen des Fensters reicht nicht.“

## Risks / Trade-offs

- **Mehr Rechenzeit bei „Automatisch“** → Ein zusätzlicher Encoder-Durchlauf je Abschnitt, also grob 30–50 % mehr Zeit. Bei langen Meetings kann der Rückstau-Hinweis eher erscheinen. Der Hinweis in der Oberfläche empfiehlt eine feste Sprache.
- **Fehlerkennung kurzer Abschnitte** → Abschnitte von 1–2 Sekunden können falsch erkannt werden. Das ist akzeptiert und im Hinweis erklärt.
- **Filter für erfundene Sätze nur auf Deutsch** → In anderen Sprachen können typische Whisper-Halluzinationen bei Stille durchrutschen. Laut Proposal nicht im Umfang. Die Stille-Erkennung vor der Transkription greift weiterhin.
- **Interne API von transformers.js** → Der Decoder-Aufruf nutzt `transcriber.model` und `processor` direkt. Bei einem Update der Bibliothek muss die Erkennung neu geprüft werden.
- **Reihenfolge der Changes** → `lange-meetings` (noch offen) nennt „Leeren“. Es wird vor diesem Change archiviert. Die README wird hier angepasst.
