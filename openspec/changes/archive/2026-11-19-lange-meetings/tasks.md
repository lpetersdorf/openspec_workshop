# Tasks

## 1. Zeitmarken im Meeting-Modus

- [x] 1.1 Reine Funktion `formatTimestamp(ms)` (`m:ss`, ab einer Stunde `h:mm:ss`), in `window.BFN` ergänzen; prüfen: in der Konsole `BFN.formatTimestamp(754000)` → `12:34`, `BFN.formatTimestamp(3735000)` → `1:02:15`
- [x] 1.2 `appendTurn` um optionalen Parameter `atMs` erweitern: neuer Absatz als `**[12:34] Gegenüber:**`, ohne `atMs` wie bisher; prüfen: in der Konsole Wechsel mit und ohne `atMs`, Anhängen beim gleichen Sprecher ohne neue Zeitmarke
- [x] 1.3 Beginn je Abschnitt (`totalMs()` − Abschnittsdauer) beim Zerlegen merken und mit dem Sprecher an `appendTurn` geben; prüfen: Meeting von 2 Minuten mit Video im Hintergrund, Zeitmarken passen ungefähr zur Uhr im Aufnahme-Fenster
- [x] 1.4 Zeitmarken zählen über mehrere Aufnahmen weiter und beginnen nach „Leeren“ bei 0:00; prüfen: stoppen, neu starten, Marke liegt hinter der ersten Aufnahme; nach „Leeren“ wieder ab 0:00

## 2. Rückstau-Hinweis

- [x] 2.1 Reine Funktion `fasterModel(key)` (`turbo → small → base → tiny`, `tiny → null`), in `window.BFN`; prüfen: Konsole für alle vier Stufen
- [x] 2.2 Hinweis im Hauptfenster ab 10 wartenden Abschnitten, verschwindet bei 0, mit Empfehlung der schnelleren Stufe bzw. ohne bei „Schnell“; prüfen: `BACKLOG_HINT` testweise auf 2 setzen, mit „Sehr genau“ aufnehmen, Hinweis erscheint und verschwindet nach dem Abarbeiten
- [x] 2.3 Aufnahme-Fenster zeigt ab 10 „Text verzögert · N in Arbeit“; prüfen: wie 2.2, Aufnahme über das Tastenkürzel im Hintergrund

## 3. Wach bleiben

- [x] 3.1 `powerSaveBlocker` (`prevent-app-suspension`) in `onStateFromUI` starten bei `recording || pending > 0`, sonst stoppen; prüfen: während der Aufnahme listet `pmset -g assertions` „Blueforte Notes“ bzw. Electron mit `PreventUserIdleSystemSleep`, nach Ende nicht mehr

## 4. Entwurf sichern und wiederherstellen

- [x] 4.1 Hauptprozess: `draft:save` (atomar über `.tmp` + `rename`), `draft:load`, `draft:clear` in `userData/draft.json`, Brücke in `preload.js`; prüfen: Datei entsteht nach dem Sichern, `.tmp` bleibt nicht liegen
- [x] 4.2 Renderer: `scheduleDraft()` nach jeder Textänderung (höchstens alle 30 s), sofort beim Stoppen; `clearDraft()` nach dem Speichern der Notiz und beim Leeren; prüfen: `draft.json` aktualisiert sich während der Aufnahme, ist nach dem Speichern weg
- [x] 4.3 Einmaliger Hinweis, wenn der Entwurf nicht geschrieben werden kann, Aufnahme läuft weiter; prüfen: `draft.json.tmp` testweise schreibgeschützt anlegen (`chmod 444`), Hinweis erscheint genau einmal
- [x] 4.4 Beim Start: Hinweisbalken mit Datum, Uhrzeit, Wortzahl, „Wiederherstellen“ / „Verwerfen“; Wiederherstellen setzt Text, Meeting-Status, letzten Sprecher und Aufnahmezeit; prüfen: Meeting aufnehmen, App-Prozess per `kill -9` beenden, neu starten, wiederherstellen, als Notiz speichern → „… Meeting.md“ mit Zeitmarken und passender Dauer
- [x] 4.5 Verwerfen löscht den Entwurf; prüfen: nach „Verwerfen“ und Neustart kein Hinweis
- [x] 4.6 Beenden-Dialog: Text „bleibt als Entwurf erhalten“, Entwurf wird beim Beenden nicht gelöscht; prüfen: „Beenden“ mit ungespeichertem Text bestätigen, Neustart bietet den Entwurf an

## 5. Doku und Gesamtprobe

- [x] 5.1 README: Abschnitt „Lange Meetings“ (Entwurf, Wach bleiben, Deckel offen lassen oder externer Bildschirm, Rückstau und Modellwahl, Zeitmarken); prüfen: Abschnitt vorhanden
- [x] 5.2 Gesamtprobe in der gebauten App (`npm run dist:mac`): 60 Minuten Meeting mit Video als Gegenseite, Stufe „Genau“; prüfen: kein Ruhezustand, Zeitmarken bis über 1:00:00, Rückstau-Hinweis höchstens kurz, Notiz vollständig gespeichert

## Workflow follow-up

- Nach der Umsetzung: `/opsx:archive`, danach Commit auf `develop`
