# Tasks

## 1. Sprache wählen

- [x] 1.1 Worker: `language` aus der `transcribe`-Nachricht an den Transcriber geben statt fest `german`, fehlender Wert = `german`; prüfen: Diktat auf Deutsch wie bisher, mit `language: 'english'` (Konsole) wird englischer Text nicht übersetzt
- [x] 1.2 Konstante `LANGUAGES` (Deutsch, Englisch, Französisch, Spanisch, Italienisch, Automatisch erkennen) und reine Funktion `savedLanguage()` mit Rückfall auf `german` bei unbekanntem Wert, in `window.BFN`; prüfen: Konsole mit leerem, gültigem und ungültigem `localStorage`-Wert
- [x] 1.3 Auswahl „Sprache“ neben „Modell“ (`index.html`, `style.css`), Wahl in `localStorage` (`bfn-sprache`), `language` bei jeder `transcribe`-Nachricht mitschicken; prüfen: „Englisch“ wählen, englisch diktieren → englischer Text; Neustart → „Englisch“ noch gewählt; Wechsel während der Aufnahme wirkt ab dem nächsten Abschnitt
- [x] 1.4 Datei-Upload und Meeting-Modus nutzen dieselbe Sprache; prüfen: englische Audiodatei mit „Englisch“ hochladen → englischer Text; Meeting mit englischem Video → „Gegenüber“ auf Englisch
- [x] 1.5 Worker: bei `'auto'` ein Decoder-Schritt mit Start-Token, Auswahl unter `<|de|> <|en|> <|fr|> <|es|> <|it|>`, danach Transkription mit der erkannten Sprache; bei Fehler `german` und Konsolenmeldung; prüfen: „Automatisch“, einen englischen und danach einen deutschen Satz mit Pause sprechen → jeder Abschnitt in seiner Sprache; mit „Sehr genau“ (turbo) ebenso
- [x] 1.6 Hinweis bei „Automatisch erkennen“ (Erkennung je Abschnitt, kann bei kurzen Abschnitten danebenliegen, mehr Rechenzeit); prüfen: Hinweis erscheint nur bei „Automatisch“
- [x] 1.7 Übersetzen aus jeder Sprache, Sperre bei „Sehr genau“ bleibt; prüfen: „Französisch“ + „Ins Englische übersetzen“, „Bonjour à tous“ → englischer Text; „Sehr genau“ sperrt den Schalter weiterhin
- [x] 1.8 README: Sprachwahl im Abschnitt „Modell wählen“ beschreiben (Standard Deutsch, „Automatisch“ langsamer und je Abschnitt); prüfen: Abschnitt vorhanden

## 2. Neue Notiz

- [x] 2.1 Knopf „Leeren“ → „Neue Notiz“ ohne Klasse `ghost`; prüfen: Knopf gut sichtbar neben „An Claude übergeben“
- [x] 2.2 `newNote()`: bei ungespeichertem Text (`text ≠ savedText`) `confirm`-Rückfrage, bei „Abbrechen“ keine Änderung, sonst `clearText()`; prüfen: ungespeicherten Text → Rückfrage, „Abbrechen“ lässt Text, Zeit und `draft.json` unverändert; nach dem Speichern keine Rückfrage, Zeit auf 0:00, Einverständnis aus
- [x] 2.3 `updateButtons()` sperrt „Neue Notiz“ während Aufnahme oder Transkription und wenn Text leer und Zeit 0:00; prüfen: während der Aufnahme gesperrt, nach Stopp und Abarbeiten wieder frei, bei leerem Start gesperrt
- [x] 2.4 Toast nach erfolgreichem Speichern im Hauptfenster um „„Neue Notiz“ setzt Text und Zeit zurück“ ergänzen (Notizordner und Download); prüfen: „Notiz speichern“ → Hinweis erscheint, Text und Zeit bleiben stehen; Speichern im Aufnahme-Fenster leert weiterhin
- [x] 2.5 Nach „Neue Notiz“ beginnt die nächste Meeting-Aufnahme mit `[0:00]`; prüfen: Meeting aufnehmen, speichern, „Neue Notiz“, neues kurzes Meeting → erste Zeitmarke `[0:00]`
- [x] 2.6 README: „Leeren“ im Abschnitt „Lange Meetings“ durch „Neue Notiz“ ersetzen und kurz erklären; prüfen: `grep Leeren README.md` findet nichts mehr

## 3. Systemton-Hinweis

- [x] 3.1 macOS-Fehlertext ergänzen: nach der Freigabe über das Menüleisten-Symbol › Beenden schließen und aus dem Programme-Ordner neu starten, Fenster schließen reicht nicht; prüfen: Text in `app.js`, Fehlerfall durch `tccutil reset ScreenCapture com.blueforte.notes` in der gebauten App auslösen, Hinweis zeigt den neuen Text

## 4. Gesamtprobe

- [x] 4.1 Gebaute App (`npm run dist:mac`), aus `/Applications` gestartet: englisches Meeting (Video) mit „Englisch“, speichern, „Neue Notiz“, deutsches Diktat mit „Automatisch“; prüfen: beide Notizen korrekt, Zeitmarken beginnen jeweils bei 0:00, `openspec validate sprache-und-reset --strict` ist grün

## Workflow follow-up

- Vorher `lange-meetings` archivieren (`/opsx:archive lange-meetings`), danach diesen Change mit `/opsx:archive`, dann Commit auf `develop`
