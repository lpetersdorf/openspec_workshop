## 1. Grundgerüst

- [ ] 1.1 `index.html` mit Kopfzeile, Aufnahme-/Stopp-Button, Textfeld, Zeile für vorläufigen Text und Aktionsleiste anlegen; prüfen: Seite lädt über `npx serve .` ohne Fehler in der Konsole
- [ ] 1.2 `style.css` mit ruhigem Layout, sichtbarem Zuhör-Zustand und grauem vorläufigem Text; prüfen: Zustand „hört zu“ ist klar erkennbar
- [ ] 1.3 Datenschutz-Hinweis beim Öffnen anzeigen; prüfen: Hinweis ist sichtbar

## 2. Aufnahme

- [ ] 2.1 Browser-Prüfung: ohne Spracherkennung „Aufnahme“ deaktivieren und Hinweis auf Chrome, Edge oder Safari zeigen; prüfen: in Firefox erscheint der Hinweis
- [ ] 2.2 Spracherkennung mit `de-DE`, `continuous` und `interimResults` starten und stoppen; finale Ergebnisse anhängen, vorläufige grau anzeigen; prüfen: „Guten Morgen zusammen“ erscheint beim Sprechen
- [ ] 2.3 Automatischer Neustart nach `end`, solange nicht „Stopp“ geklickt wurde; prüfen: nach 5 Sekunden Pause wird weiterer Text angehängt
- [ ] 2.4 Mikrofon verweigert (`not-allowed`): Aufnahme beenden und Hinweis mit Lösung zeigen; prüfen: Zugriff ablehnen zeigt den Hinweis
- [ ] 2.5 Aufnahmedauer mitzählen und anzeigen; prüfen: Dauer läuft während der Aufnahme

## 3. Nachbearbeitung

- [ ] 3.1 Glossar-Funktion (ganze Wörter, ohne Groß-/Kleinschreibung, Standardeinträge) auf neu erkannten Text anwenden; prüfen: „blue forte“ wird zu „Blueforte“, „open spec“ zu „OpenSpec“
- [ ] 3.2 Glossar-Bereich zum Anzeigen, Hinzufügen und Entfernen von Einträgen, gespeichert im Browser; prüfen: neuer Eintrag ist nach Neuladen noch da
- [ ] 3.3 „Kopieren“ mit Bestätigung „Kopiert“; prüfen: Text liegt in der Zwischenablage
- [ ] 3.4 „Notiz speichern“ erzeugt `YYYY-MM-DD HHmm Diktat.md` mit Frontmatter (`datum`, `dauer`, `tags: [diktat]`), Überschrift und Text; prüfen: Datei öffnen und Inhalt kontrollieren
- [ ] 3.5 „An Claude übergeben“ kopiert Prompt plus Text; prüfen: Einfügen in Claude zeigt Prompt und Text
- [ ] 3.6 „Notiz speichern“ und „An Claude übergeben“ bei leerem Text deaktivieren; prüfen: Buttons sind ausgegraut, solange das Textfeld leer ist

## Workflow follow-up

- Gegen alle Szenarien in `specs/diktat/spec.md` testen (Reviewer spricht)
- `/opsx:archive diktat-mvp`
