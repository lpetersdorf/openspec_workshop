# Proposal

## Why

Blueforte Notes nimmt nur das eigene Mikrofon auf. In Teams-, Zoom- oder Webex-Calls fehlt damit die Hälfte: was die Gegenseite sagt. Der Meeting-Modus nimmt in der Desktop-App zusätzlich den Systemton auf und transkribiert beide Quellen getrennt. So entsteht ohne Cloud-Dienst ein Protokoll, in dem steht, was „Ich“ und was „Gegenüber“ gesagt hat. Das ist der erste, einfache Schritt zum Ausblick „Wer hat was gesagt?“.

## What Changes

- Neu: Schalter **Meeting-Modus** (nur Desktop-App): Mikrofon und Systemton werden gleichzeitig aufgenommen
- Die beiden Quellen werden **getrennt transkribiert**, Absätze sind mit **„Ich“** bzw. **„Gegenüber“** gekennzeichnet
- Neu: **Einverständnis**: Vor einer Meeting-Aufnahme muss bestätigt werden, dass alle Beteiligten Bescheid wissen und einverstanden sind
- Neu: **Systemton-Freigabe**: verständliche Hinweise, wenn der Systemton nicht aufgenommen werden kann (fehlende Freigabe, zu altes macOS)
- Hinweis auf **Headset**, damit die Gegenseite nicht doppelt im Text landet
- Das Aufnahme-Fenster zeigt im Meeting-Modus **zwei Pegel**
- **Meeting-Notiz**: Dateiname „… Meeting.md“, Tag `meeting`, Überschrift „Meeting …“

## Nicht im Umfang

- Mehr als zwei Sprecher unterscheiden (Gegenüber bleibt eine Person, auch wenn mehrere sprechen), siehe Ausblick `sprecher-erkennen`
- Namen statt „Ich“ und „Gegenüber“
- Meeting-Modus in der Web-App
- Linux
- Echo-Unterdrückung zwischen Lautsprecher und Mikrofon (Headset empfohlen)
- Automatische Zusammenfassung des Meetings

## Capabilities

### New Capabilities

_keine_

### Modified Capabilities

- `desktop`: Meeting-Modus, Einverständnis, Systemton-Freigabe, Meeting-Notiz

## Impact

- `desktop/main.js`: Systemton über `setDisplayMediaRequestHandler` mit `audio: 'loopback'`, Fähigkeit „Systemton“ je Betriebssystem, Fenster bei fehlendem Einverständnis öffnen
- `desktop/preload.js`: `showWindow`
- `app.js`: zweite Quelle, zwei Segmentierer, Sprecher-Absätze, Einverständnis, Meeting-Notiz
- `index.html`, `style.css`: Schalter, Einverständnis, Hinweise
- `overlay.html`, `overlay.js`: zwei Pegel
- `package.json`: `NSAudioCaptureUsageDescription` für macOS
