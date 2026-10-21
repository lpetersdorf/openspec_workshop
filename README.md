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

- Browser: **Chrome, Edge oder Safari** für Version 1 (Firefox unterstützt die Web Speech API nicht). Version 2 läuft auch in Firefox
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
| `stage-5-desktop` | Bonus: Change `desktop-app`, Blueforte Notes als Desktop-App für macOS und Windows |
| `stage-6-menueleiste` | Bonus: Change `menueleiste`, Symbol in der Menüleiste und kleines Aufnahme-Fenster |

```bash
git fetch origin
git switch stage-2-applied
```

## Desktop-App (Stage 5, Bonus)

Blueforte Notes als echte App für macOS und Windows (Electron). Neu gegenüber der Web-App:

- **Notizordner:** einmal wählen (z. B. den Obsidian-Vault), Notizen landen dort direkt. Vorhandene Dateien werden nie überschrieben.
- **Tastenkürzel:** `Cmd+Shift+D` (macOS) bzw. `Strg+Umschalt+D` (Windows) startet und stoppt die Aufnahme, auch im Hintergrund.
- **Offline:** Nach dem ersten Modell-Download startet und transkribiert die App ohne Internet.
- **Menüleiste (Stage 6):** Die App läuft nach dem Schließen des Fensters in der Menüleiste (macOS) bzw. im Infobereich (Windows) weiter. Das Tastenkürzel startet die Aufnahme, ohne das Fenster nach vorn zu holen. Ein kleines Aufnahme-Fenster oben am Bildschirm zeigt Pegel und Zeit, danach lässt sich die Notiz dort direkt speichern. Beenden über das Symbol.

### Selbst bauen

```bash
git switch stage-5-desktop
npm install          # lädt Electron und kopiert transformers.js nach vendor/
npm run desktop      # App direkt starten, ohne Installation
npm run dist:mac     # .dmg bauen (auf einem Mac), liegt danach in dist/
npm run dist:win     # Installer bauen (auf Windows), liegt danach in dist/
```

### Fertige Pakete

Bei jedem Push auf `stage-5-desktop` und die folgenden Stages baut GitHub Actions beide Pakete: **Actions → „Desktop-App bauen“ → Lauf öffnen → Artifacts**.

### Unsignierte App öffnen

Die App ist nicht mit einem Apple- oder Microsoft-Zertifikat signiert.

- **macOS:** Beim ersten Öffnen einer heruntergeladenen App erscheint eine Warnung. Dann unter **Systemeinstellungen → Datenschutz & Sicherheit → „Dennoch öffnen“** freigeben, oder im Terminal:
  `xattr -dr com.apple.quarantine "/Applications/Blueforte Notes.app"`
  Selbst gebaute Apps (`npm run dist:mac`) öffnen ohne Warnung.
- **Windows:** SmartScreen meldet „Der Computer wurde durch Windows geschützt“: **Weitere Informationen → Trotzdem ausführen**.

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
- **Whisper-Modell:** Version 2 lädt beim ersten Start das Modell `Xenova/whisper-base` von Hugging Face (ca. 210 MB mit Grafikkarte, ca. 80 MB ohne). Danach liegt es im Browser-Cache.
- **Offline-Demo:** Seite öffnen, warten bis „Modell bereit“, dann WLAN aus und diktieren. Die Seite dabei nicht neu laden, denn die Bibliothek transformers.js kommt per CDN.
