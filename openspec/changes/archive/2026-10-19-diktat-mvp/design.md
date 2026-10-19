# Design

## Context

Siehe proposal.md für die Motivation. Rahmen aus dem Projektkontext: drei statische Dateien, keine Bibliotheken, kein Backend, Start über `npx serve .`. Die Spracherkennung liefert der Browser (`SpeechRecognition` bzw. `webkitSpeechRecognition`).

## Goals / Non-Goals

**Goals:**
- Eine Datei pro Zuständigkeit: Struktur (`index.html`), Aussehen (`style.css`), Verhalten (`app.js`)
- Textverarbeitung (Glossar, Notiz-Format, Prompt) als reine Funktionen, damit sie ohne Mikrofon testbar ist

**Non-Goals:**
- Kein Build-Schritt, keine Module, kein Framework
- Keine Persistenz des Diktats selbst (nur das Glossar wird gespeichert)

## Decisions

**1. Spracherkennung: `continuous` + `interimResults`, Sprache `de-DE`**
Vorläufige Ergebnisse werden grau angezeigt, finale Ergebnisse an den Text angehängt. Alternative wäre nur finale Ergebnisse anzuzeigen; das wirkt aber träge.

**2. Durchgehende Aufnahme über automatischen Neustart**
Die Browser-Erkennung beendet sich nach Stille selbst (`end`-Ereignis). Solange die Person nicht „Stopp“ geklickt hat, startet die App die Erkennung sofort neu. Ein Flag `wantsRecording` unterscheidet gewolltes von ungewolltem Ende.

**3. Textfeld als `<textarea>`**
Fertiger Text landet im editierbaren Textfeld, vorläufiger Text in einer Zeile darunter. So kollidieren Nutzereingaben nicht mit Live-Updates. Neuer finaler Text wird an das Ende des Textfelds angehängt.

**4. Glossar**
Einträge `falsch → richtig`, gespeichert in `localStorage` (Schlüssel `bfn-glossar`), mit Standardwerten (Blueforte, OpenSpec, Obsidian, Claude Code, Codex). Ersetzung nur in neu erkanntem Text, ohne Beachtung der Groß-/Kleinschreibung und nur an Wortgrenzen (Unicode-fähig, damit Umlaute funktionieren). Mehrwortbegriffe tolerieren beliebige Leerzeichen.

**5. Export als Download**
Die Notiz wird als `Blob` mit `text/markdown` heruntergeladen. Die `dauer` ergibt sich aus der Summe der Aufnahmezeiten (`m:ss`). Alternative File System Access API wäre direkter, funktioniert aber nicht in Safari.

**6. Zwischenablage**
`navigator.clipboard.writeText`, bei Fehler Fallback über markierten Text und `document.execCommand('copy')`.

## Risks / Trade-offs

- [Audio geht an den Browser-Hersteller] → Datenschutz-Hinweis in der App; lokale Transkription als eigener Change
- [Neustart nach Stille kann ein Wort am Übergang verschlucken] → akzeptiert für Version 1
- [Firefox ohne Spracherkennung] → Aufnahme deaktiviert, Hinweis auf andere Browser
- [Mikrofon nur über localhost oder https] → Hinweis im README, Start über `npx serve .`
