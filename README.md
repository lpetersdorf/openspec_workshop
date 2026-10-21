# Blueforte Notes – OpenSpec Workshop

Workshop-Repository für **„Von der Idee zur App mit Spec-Driven Development“**. Wir bauen mit Claude Code oder Codex und [OpenSpec](https://github.com/Fission-AI/OpenSpec) eine Diktier-App, die komplett im Browser läuft:

- **Version 1** (`diktat-mvp`): Diktieren mit der Web Speech API, Glossar für Fachbegriffe, Export als Obsidian-Notiz, „An Claude übergeben“
- **Version 2** (`lokale-transkription`): Whisper lokal im Browser, das Audio verlässt den Rechner nicht. Dazu Audiodateien hochladen und Übersetzung nach Englisch

## Voraussetzungen

```bash
node --version          # 20.19 oder neuer
npm install -g @fission-ai/openspec@latest
openspec --version
claude --version        # oder: codex --version
```

- Browser: **Chrome, Edge oder Safari** (Firefox unterstützt die Web Speech API nicht)
- Ein Mikrofon, idealerweise ein Headset

## Los geht's

```bash
git clone https://github.com/lpetersdorf/openspec_workshop.git blueforte-notes
cd blueforte-notes
openspec init --tools claude,codex
```

Die App startest du immer über einen lokalen Server, sonst funktioniert das Mikrofon nicht:

```bash
npx serve .             # dann http://localhost:3000 öffnen
```

## Zwischenstände (Fallback)

Wer im Workshop hängen bleibt, springt auf den nächsten Stand:

| Branch | Stand |
|---|---|
| `main` | Ausgangspunkt: leeres Projekt |
| `stage-0-start` | `openspec init` erledigt, `openspec/config.yaml` mit Projektkontext |
| `stage-1-proposal` | Change `diktat-mvp` vorgeschlagen und reviewt |
| `stage-2-applied` | Version 1 implementiert, alle Tasks abgehakt |
| `stage-3-archived` | Change archiviert, `openspec/specs/` beschreibt die App |
| `stage-4-whisper` | Change `lokale-transkription` umgesetzt und archiviert |
| `stage-5-desktop` | Bonus: Desktop-App für macOS und Windows (Electron) |
| `stage-6-menueleiste` | Bonus: Symbol in der Menüleiste und kleines Aufnahme-Fenster |
| `stage-7-modellwahl` | Bonus: vier Whisper-Modelle von „Schnell“ bis „Sehr genau“ |
| `stage-8-meeting` | Bonus: Meeting-Modus, Mikrofon und Systemton getrennt („Ich“ / „Gegenüber“) |

```bash
git fetch origin
git switch stage-2-applied
```

## Der Kreislauf

| Schritt | Claude Code | Codex (Skills) |
|---|---|---|
| Erkunden *(optional)* | `/opsx:explore` | `$openspec-explore` |
| Vorschlagen | `/opsx:propose <name>` | `$openspec-propose` |
| **Reviewen** | Spec lesen und schärfen | |
| Umsetzen | `/opsx:apply` | `$openspec-apply-change` |
| Archivieren | `/opsx:archive` | `$openspec-archive-change` |

## Hinweise

- **Datenschutz:** In Version 1 schickt der Browser das Audio an den Erkennungsdienst des Herstellers (bei Chrome: Google). Bitte keine Kundeninhalte diktieren. Version 2 verarbeitet alles lokal.
- **Whisper-Modell:** Version 2 lädt beim ersten Start das Modell `Xenova/whisper-base` (ca. 80–150 MB) von Hugging Face. Danach liegt es im Browser-Cache.
