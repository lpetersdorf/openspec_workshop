## 1. Worker

- [ ] 1.1 `whisper-worker.js` meldet `caps` (WebGPU, fp16) und lädt erst auf `load`; prüfen: ohne `load` wird kein Modell geladen
- [ ] 1.2 Neues Modell erst nach erfolgreichem Laden einsetzen, altes freigeben; bei Fehler altes behalten; prüfen: Fehler beim Wechsel, Transkription geht weiter
- [ ] 1.3 Aufträge warten auf das gerade ladende Modell; prüfen: Aufnahme während des Ladens wird danach transkribiert

## 2. Modell-Liste und Auswahl

- [ ] 2.1 Modell-Liste mit Stufen, IDs, Größen und Datentypen in `app.js`; reine Funktionen `modelDtype`, `modelFiles`, `modelSize`; prüfen: Größen je Gerät stimmen
- [ ] 2.2 Auswahlfeld mit Größe und „geladen“, „Sehr genau“ ohne WebGPU gesperrt; prüfen: Beschriftungen und Sperre
- [ ] 2.3 Wechseln, Fortschritt, Speichern der Wahl nach `ready`; Zurückstellen bei `load-error`; prüfen: Neustart behält Wahl, Fehler stellt zurück
- [ ] 2.4 Sperre während Aufnahme, Transkription und Laden; prüfen: Auswahl gesperrt

## 3. Hinweise

- [ ] 3.1 „Genau“ ohne Grafikkarte: Hinweis auf längere Dauer; prüfen: Hinweis sichtbar
- [ ] 3.2 „Sehr genau“: Übersetzen aus und gesperrt, Hinweis; prüfen: Schalter gesperrt
- [ ] 3.3 Kennzeichnung oben rechts zeigt das aktive Modell; prüfen: „Whisper small“ nach Wechsel

## 4. Doku

- [ ] 4.1 README: Modellauswahl und Größen; prüfen: Abschnitt vorhanden
