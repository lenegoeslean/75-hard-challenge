# Schnobbies 75 Hard Challenge

Installierbare Web-App (PWA) zum Tracken der 75 Hard Challenge – läuft komplett auf dem Handy, ohne Server.

## Auf GitHub Pages veröffentlichen

1. ZIP entpacken.
2. Auf GitHub ein neues Repository anlegen (z. B. `75-hard`).
3. **Add file → Upload files** und den *Inhalt* des Ordners hochladen (also `index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.webmanifest` und die Ordner `fonts` und `icons`) → **Commit changes**.
4. **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main` / `(root)` → **Save**.
5. Nach 1–2 Minuten ist die App unter `https://<dein-name>.github.io/75-hard/` erreichbar.
6. Auf dem iPhone in Safari öffnen → Teilen → **Zum Home-Bildschirm**.

## Reiter

- **Heute** – alle Tagesziele zum Abhaken, Tages-Prozent, Wasser in 250-ml-Gläsern, Workouts (drinnen/draußen), Kalorien, Lesen, Progress Picture
- **Kalender** – jeden Tag ansehen und nachtragen
- **Monat** – Monatsbilanz, Heatmap, Ziel-Quoten, Sportarten
- **Trends** – Diagramme & Auswertungen (7 / 30 Tage, Challenge, Gesamt)
- **Fotos** – alle Progress Pictures + Vorher/Nachher-Vergleich
- **Bücher** – Sachbücher anlegen, Fortschritt & Fertig-Prognose
- **Einstellungen** (Zahnrad oben rechts) – 3 Farbthemen, Challenge-Start, Ziele bearbeiten/hinzufügen, Backup

## Daten

Alle Einträge liegen nur auf dem Gerät (localStorage, Fotos in IndexedDB). Über Einstellungen → Backup lässt sich alles als JSON sichern und wieder importieren.

## Updates

Nach Änderungen an den Dateien in `sw.js` die Zeile `const CACHE = 'sh75-v1'` hochzählen (z. B. `sh75-v2`), damit das Handy sicher die neue Version lädt.
