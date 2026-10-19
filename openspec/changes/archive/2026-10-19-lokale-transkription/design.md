# Design

## Context

Siehe proposal.md für die Motivation. Version 1 nutzt `SpeechRecognition` des Browsers; Glossar, Notiz-Export und Claude-Übergabe sind reine Funktionen in `app.js` und bleiben unverändert. Weiterhin gilt: kein Build-Schritt, kein Backend, Start über `npx serve .`.

## Goals / Non-Goals

**Goals:**
- Audio verlässt das Gerät nie
- Oberfläche bleibt während der Transkription bedienbar
- Läuft in Chrome, Edge, Safari und Firefox

**Non-Goals:**
- Echtes Wort-für-Wort-Streaming
- Offline-Start nach Neuladen ohne Internet (Bibliothek kommt per CDN, nur das Modell wird gecacht)

## Decisions

**1. Modell: Whisper über transformers.js, `Xenova/whisper-base`**
transformers.js führt ONNX-Modelle im Browser aus und speichert sie im Browser-Cache. `base` ist ein Kompromiss aus Qualität und Download. Alternativen: `tiny` (zu ungenau für Deutsch), `small` (bessere Qualität, deutlich größerer Download), Web-Speech-API mit `processLocally` (nur in Vorabversionen von Edge).

**2. Rechenweg: WebGPU, sonst WebAssembly**
Mit WebGPU: Encoder `fp32`, Decoder `q4` (bewährte Kombination, ca. 210 MB). Ohne WebGPU: beide `q8` auf der CPU (ca. 80 MB, langsamer), mit Hinweis in der App.

**3. Web Worker**
Das Modell läuft in `whisper-worker.js` (Modul-Worker), damit die Oberfläche nicht einfriert. Der Worker lädt das Modell sofort beim Öffnen der Seite und arbeitet Aufträge der Reihe nach ab; Aufträge vor Ende des Ladens warten auf das Modell.

**4. Aufnahme in Abschnitten**
Mikrofon über `getUserMedia`, Rohdaten über einen `ScriptProcessorNode` (einfach, überall verfügbar). Ein Segmentierer misst die Lautstärke (RMS) je Puffer: Nach Sprache und mindestens 0,8 s Stille, oder spätestens nach 20 s, wird ein Abschnitt abgeschlossen, auf 16 kHz heruntergerechnet und an den Worker geschickt. Abschnitte ohne Sprache werden verworfen.

**5. Schutz vor erfundenem Text**
Zusätzlich zur Stille-Erkennung filtert die App bekannte Whisper-Halluzinationen (z. B. „Untertitel im Auftrag des ZDF“, „Vielen Dank fürs Zuschauen“), wenn sie den ganzen Abschnitt ausmachen.

**6. Upload**
Dateien werden mit `AudioContext.decodeAudioData` dekodiert, zu Mono gemischt und auf 16 kHz gebracht. Lange Dateien zerlegt Whisper selbst in 30-s-Fenster (`chunk_length_s`).

**7. Übersetzung**
Whisper-Aufgabe `translate` statt `transcribe`; der Schalter gilt für jeden neuen Abschnitt.

## Risks / Trade-offs

- [Großer Download beim ersten Start] → Fortschrittsanzeige; im Workshop vorab laden
- [Langsam ohne WebGPU] → Hinweis; `q8` hält den Rechenaufwand klein
- [Kein Live-Text mehr] → Abschnitte nach kurzen Pausen, Verarbeitungsanzeige
- [Whisper halluziniert bei Stille] → Stille-Erkennung plus Filterliste
- [`ScriptProcessorNode` ist veraltet] → für diese Größe ausreichend; Umstieg auf `AudioWorklet` später möglich
- [Offline-Demo] → Seite und Modell vorher laden, danach nicht neu laden
