## 1. Systemton im Hauptprozess

- [x] 1.1 `setDisplayMediaRequestHandler` mit erstem Bildschirm und `audio: 'loopback'`; prüfen: `getDisplayMedia` liefert unter Windows eine Tonspur
- [x] 1.2 `info()` meldet `systemAudio` und Grund (Windows ja, macOS ab 14.2); prüfen: Schalter auf älteren Systemen gesperrt
- [x] 1.3 `NSAudioCaptureUsageDescription` in `package.json` (`extendInfo`); prüfen: Eintrag in der gebauten `Info.plist`
- [x] 1.4 `showWindow` in der Brücke; prüfen: Hauptfenster öffnet sich aus der Oberfläche

## 2. Aufnahme mit zwei Quellen

- [x] 2.1 Mikrofon und Systemton über `ChannelMergerNode`, Videospur stoppen; prüfen: zwei Kanäle kommen an
- [x] 2.2 Zwei Segmentierer, Abschnitte mit Quelle an Whisper; prüfen: Abschnitte je Quelle
- [x] 2.3 `appendTurn` für Absätze „Ich“/„Gegenüber“; prüfen: Wechsel und Anhängen
- [x] 2.4 Zwei Pegel an das Aufnahme-Fenster; prüfen: beide Balken bewegen sich

## 3. Oberfläche

- [x] 3.1 Schalter „Meeting-Modus“ nur in der Desktop-App, Headset-Hinweis; prüfen: im Browser unsichtbar
- [x] 3.2 Einverständnis-Häkchen, Abbruch ohne Bestätigung, Hauptfenster bei Tastenkürzel; Zurücksetzen beim Ausschalten und Leeren; prüfen: keine Aufnahme ohne Häkchen
- [x] 3.3 Hinweise bei fehlender Systemton-Freigabe; prüfen: Hinweis nennt Systemeinstellungen
- [x] 3.4 Meeting-Notiz (Dateiname, Tag, Überschrift); prüfen: Datei „… Meeting.md“ im Notizordner

## 4. Doku

- [x] 4.1 README: Meeting-Modus, Freigaben, Headset; prüfen: Abschnitt vorhanden
