# Design

## Context

Siehe proposal.md. Heute lädt `whisper-worker.js` beim Start fest `Xenova/whisper-base`: mit WebGPU Encoder fp32 und Decoder q4 (ca. 210 MB), sonst beide q8 (ca. 80 MB). transformers.js speichert Modelldateien im Cache `transformers-cache` des Browsers bzw. der Desktop-App.

## Goals / Non-Goals

**Goals:**
- Ein Ort für die Modell-Liste (`app.js`), der Worker lädt nur, was er bekommt
- Ehrliche Größenangaben für genau die Dateien, die dieses Gerät lädt

**Non-Goals:**
- Kein Messen der Geschwindigkeit, keine automatische Wahl

## Decisions

**1. Die vier Modelle**

| Stufe | Modell | mit Grafikkarte | ohne Grafikkarte |
|---|---|---|---|
| Schnell | `Xenova/whisper-tiny` | ca. 120 MB | ca. 40 MB |
| Standard | `Xenova/whisper-base` | ca. 210 MB | ca. 80 MB |
| Genau | `Xenova/whisper-small` | ca. 590 MB | ca. 250 MB (langsam) |
| Sehr genau | `onnx-community/whisper-large-v3-turbo` | ca. 1,6 GB (fp16) bzw. 760 MB (q4) | nicht verfügbar |

Größen aus den ONNX-Dateien der Modelle auf Hugging Face (Encoder plus zusammengeführter Decoder). Mit Grafikkarte: Encoder fp32, Decoder q4. „Sehr genau“ nutzt einen Encoder in fp16, wenn die Grafikkarte `shader-f16` kann, sonst q4. Ohne Grafikkarte: beide q8.

**2. Ablauf zwischen Oberfläche und Worker**
Der Worker meldet beim Start `caps` (WebGPU ja/nein, fp16 ja/nein). `app.js` wählt das gespeicherte Modell (fällt auf „Standard“ zurück, wenn es auf dem Gerät nicht geht) und schickt `load` mit Modell-ID, Gerät und Datentypen. Der Worker meldet wie bisher `loading`, `progress`, `ready` und `load-error`, jetzt jeweils mit dem Modell.

**3. Altes Modell bleibt, bis das neue bereit ist**
Der Worker tauscht das Modell erst nach erfolgreichem Laden aus und gibt das alte dann frei (`dispose`). Scheitert der Download, arbeitet das alte Modell weiter, und `app.js` stellt die Auswahl zurück. Kurzzeitig liegen zwei Modelle im Speicher; das ist akzeptiert.

**4. Gespeichert wird erst nach Erfolg**
Die Wahl landet in `localStorage` (`bfn-modell`), sobald `ready` für das neue Modell kommt. So startet die App nie mit einem Modell, das nie geladen wurde.

**5. „Geladen“ erkennen**
`app.js` prüft im Cache `transformers-cache`, ob Encoder- und Decoder-Datei des Modells in den Datentypen dieses Geräts vorhanden sind (Endungen `''`, `_fp16`, `_q4`, `_quantized`). Ohne Cache-API gilt nichts als geladen.

**6. Übersetzen bei large-v3-turbo**
Das Turbo-Modell wurde nur auf Transkription trainiert und übersetzt nicht zuverlässig. Deshalb wird der Schalter gesperrt und ausgeschaltet, solange „Sehr genau“ aktiv ist.

## Risks / Trade-offs

- [Großer Download bei „Sehr genau“] → Größe steht in der Auswahl; Laden lässt sich nicht abbrechen (nicht im Umfang)
- [Speicher] → large-v3-turbo braucht mehrere GB Arbeitsspeicher; auf Geräten mit wenig Speicher kann das Laden scheitern, dann bleibt das alte Modell
- [Hugging Face nicht erreichbar, z. B. Firmen-Proxy] → Hinweis wie beim ersten Start
