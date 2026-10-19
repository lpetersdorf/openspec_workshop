## 1. Modell im Worker

- [x] 1.1 `whisper-worker.js` als Modul-Worker: transformers.js laden, WebGPU erkennen, Modell `Xenova/whisper-base` mit passender Genauigkeit laden, Fortschritt melden; prüfen: Konsole zeigt Fortschritt und „bereit“
- [x] 1.2 Aufträge der Reihe nach abarbeiten (Sprache Deutsch, Aufgabe `transcribe` oder `translate`), Aufträge vor Ende des Ladens warten lassen; prüfen: Aufnahme direkt nach dem Öffnen wird nach dem Laden transkribiert
- [x] 1.3 Fehler beim Laden melden; prüfen: ohne Internet beim ersten Start erscheint der Hinweis

## 2. Aufnahme in Abschnitten

- [x] 2.1 Mikrofon über `getUserMedia` statt Browser-Spracherkennung; Mikrofon verweigert zeigt den bestehenden Hinweis; prüfen: Zugriff ablehnen zeigt den Hinweis
- [x] 2.2 Segmentierer (Lautstärke, 0,8 s Stille, max. 20 s) und Heruntertakten auf 16 kHz als reine Funktionen; prüfen: Test mit künstlichem Signal liefert einen Abschnitt für Sprache plus Pause, keinen für Stille
- [x] 2.3 Abschnitte an den Worker schicken, Ergebnis mit Glossar anhängen, Verarbeitungsanzeige mit Anzahl offener Abschnitte; prüfen: Satz sagen, pausieren, Text erscheint während die Aufnahme läuft
- [x] 2.4 Filter für Whisper-Halluzinationen; prüfen: „Untertitel im Auftrag des ZDF“ als einziger Text wird verworfen

## 3. Neue Funktionen und Oberfläche

- [x] 3.1 Modellstatus mit Fortschritt in Prozent und Rechenweg (Grafikkarte oder Prozessor) anzeigen; prüfen: beim ersten Start läuft der Fortschritt bis „bereit“
- [x] 3.2 Audiodatei hochladen, dekodieren, transkribieren und anhängen; ungeeignete Datei mit Hinweis; prüfen: Sprachmemo hochladen ergibt Text
- [x] 3.3 Schalter „Ins Englische übersetzen“; prüfen: deutscher Satz ergibt englischen Text
- [x] 3.4 Datenschutz-Hinweis und Kennzeichnung „Lokal · Whisper“ anpassen, Firefox-Sperre entfernen; prüfen: App läuft auch in Firefox
- [x] 3.5 `openspec/config.yaml` und README auf lokale Spracherkennung anpassen; prüfen: Kontext nennt Whisper und transformers.js

## Workflow follow-up

- Offline-Test: Seite öffnen, Modell laden, WLAN aus, diktieren
- `/opsx:archive lokale-transkription`
