# Film_Log

Browser-App (PWA) zum Protokollieren analoger Filmrollen. Statische Dateien, kein Build-Schritt, läuft über GitHub Pages vom Branch `main`.

## Bei jedem Update

1. `VERSION` in `app.js` erhöhen (Anzeige „Alpha x.y“).
2. `CACHE` in `sw.js` erhöhen, neue Dateien in `ASSETS` eintragen.
3. In `changelog.js` oben einen Eintrag ergänzen: kurze Zusammenfassung als `title`, darunter `added`, `changed`, `removed`, jeweils auf Deutsch und Englisch.
4. Neue Texte in `i18n.js` in allen fünf Sprachen eintragen (de, en, fr, es, pt).
