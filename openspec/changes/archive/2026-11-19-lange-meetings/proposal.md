# Proposal

## Why

Mit dem Meeting-Modus lassen sich Teams- oder Zoom-Calls aufnehmen. Bei einem Meeting von einer Stunde ist die App aber noch zu zerbrechlich: Das Transkript liegt nur im Textfeld und geht bei einem Absturz komplett verloren. Der Rechner kann während der Aufnahme in den Ruhezustand gehen. Kommt Whisper nicht hinterher, merkt das niemand. Im fertigen Protokoll fehlt außerdem jede zeitliche Orientierung.

## What Changes

- Neu: **Entwurf sichern**. Die Desktop-App sichert ungespeicherten Text spätestens 30 Sekunden nach jeder Änderung als Entwurf in den App-Daten (nicht im Notizordner) und bietet ihn nach einem Absturz beim nächsten Start zur Wiederherstellung an.
- Neu: **Wach bleiben**. Solange eine Aufnahme läuft oder noch transkribiert wird, geht der Rechner nicht in den Ruhezustand. Der Bildschirm darf weiter ausgehen.
- Neu: **Rückstau-Hinweis**. Warten viele Abschnitte auf die Transkription, weist die App darauf hin und empfiehlt für das nächste Meeting ein schnelleres Modell.
- Neu: **Zeitmarken** im Meeting-Modus. Jeder Sprecherwechsel trägt die Aufnahmezeit, z. B. `**[12:34] Gegenüber:** …`.

## Nicht im Umfang

- Entwurf in der Web-App (Browser)
- Automatischer Modellwechsel während einer laufenden Aufnahme
- Zeitmarken im normalen Diktat ohne Meeting-Modus
- Speichern des Audios selbst (nur der Text wird gesichert)
- Mehrere Entwürfe parallel oder ein Verlauf früherer Entwürfe
- Verhindern, dass der Mac bei zugeklapptem Deckel ohne externen Bildschirm einschläft (macOS lässt das nicht zu)

## Capabilities

### New Capabilities

_keine_

### Modified Capabilities

- `desktop`: neue Requirements „Entwurf sichern“, „Wach bleiben während der Aufnahme“, „Rückstau-Hinweis“; geändertes Requirement „Meeting-Modus“ (Zeitmarken beim Sprecherwechsel)

## Impact

- `desktop/main.js`: Entwurf in den App-Daten schreiben, lesen und löschen; `powerSaveBlocker` an den Aufnahmestatus koppeln
- `desktop/preload.js`: Brücke für den Entwurf (`saveDraft`, `loadDraft`, `clearDraft`)
- `app.js`: Entwurf regelmäßig sichern und beim Start anbieten, Rückstau-Hinweis, Zeitmarken in `appendTurn`, Startzeit je Abschnitt
- `index.html`, `style.css`: Hinweis zur Wiederherstellung, Rückstau-Hinweis
- README: Abschnitt zu langen Meetings
