# Design

## Context

Siehe proposal.md. Ausgangslage: Die Desktop-App nimmt über `getUserMedia` das Mikrofon auf, zerlegt den Ton mit dem `Segmenter` nach Sprechpausen und schickt Abschnitte an Whisper im Worker. Das Aufnahme-Fenster aus `menueleiste` zeigt einen Pegel.

## Goals / Non-Goals

**Goals:**
- Systemton ohne Zusatzsoftware (kein BlackHole, kein virtuelles Audiogerät)
- „Ich“ und „Gegenüber“ ohne zweites KI-Modell, allein über die Quelle

**Non-Goals:**
- Keine Sprechererkennung innerhalb des Systemtons

## Decisions

**1. Systemton über Bildschirmfreigabe mit Loopback**
`app.js` ruft `getDisplayMedia({ video: true, audio: true })` auf. Der Hauptprozess beantwortet die Anfrage über `session.setDisplayMediaRequestHandler` mit dem ersten Bildschirm aus `desktopCapturer` und `audio: 'loopback'`. Die Videospur wird sofort gestoppt, nur der Ton bleibt.
- Windows: Loopback wird von Electron unterstützt.
- macOS: ab 14.2 über Apples Core Audio Tap (Electron ab 39). Dafür braucht die App den Info.plist-Eintrag `NSAudioCaptureUsageDescription`; ohne ihn liefert macOS stumm eine leere Tonspur. macOS fragt zusätzlich nach der Bildschirmaufnahme, weil `desktopCapturer` einen Bildschirm braucht.
- Linux: nicht im Umfang.

**2. Fähigkeit „Systemton“ vorab prüfen**
`bfnDesktop.info()` meldet `systemAudio` (Windows: ja; macOS: ab 14.2; sonst nein) und einen Grund. Ohne Fähigkeit ist der Schalter gesperrt.

**3. Zwei Quellen, zwei Segmentierer**
Mikrofon und Systemton gehen über einen `ChannelMergerNode` als Kanal 0 und 1 in denselben `ScriptProcessorNode`. Jeder Kanal hat einen eigenen `Segmenter`. Jeder Abschnitt geht mit seiner Quelle an Whisper. So reden beide Seiten auch gleichzeitig, ohne sich gegenseitig zu verdecken.

**4. Absätze nach Sprecher**
Neue reine Funktion `appendTurn(text, sprecher, neu, letzterSprecher)`: gleicher Sprecher → anhängen, sonst neuer Absatz `**Gegenüber:** …`. Der letzte Sprecher wird beim Leeren zurückgesetzt.

**5. Einverständnis als Häkchen**
Eigenes Häkchen unter dem Schalter. Ohne Häkchen bricht `startRecording` ab, egal ob Knopf, Menü oder Tastenkürzel; bei Tastenkürzel und Menü öffnet sich das Hauptfenster (`bfnDesktop.showWindow()`). Das Häkchen wird beim Ausschalten des Modus und beim Leeren zurückgesetzt.

**6. Echo**
Ohne Headset nimmt das Mikrofon den Lautsprecher mit auf, die Gegenseite erscheint dann doppelt. Eine eigene Echo-Unterdrückung ist nicht im Umfang; der Hinweis empfiehlt ein Headset.

**7. Meeting-Notiz**
`buildNote` und `noteFilename` bekommen die Option `meeting`. Sie gilt, sobald ein Meeting-Abschnitt im Text gelandet ist, und wird beim Leeren zurückgesetzt.

## Risks / Trade-offs

- [Unsignierte App auf macOS] → Freigaben hängen an der App-Signatur; nach jedem neuen Build kann macOS erneut fragen
- [Start aus dem Terminal (`npm run desktop`) auf macOS] → Der Systemton hängt dann an den Rechten des Terminals; zuverlässig nur in der gebauten App
- [Rechtliches] → Aufnahmen von Gesprächen nur mit Einverständnis; die App erzwingt die Bestätigung, prüft sie aber nicht
