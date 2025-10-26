
# Weather Overlay (HACS)

**Author:** @Knutnoh

Deutschsprachige Anleitung.

Dieses Repository enthält eine Home Assistant Custom Component, die ein dynamisches Wetter-Overlay
für dein Lovelace Dashboard bereitstellt (Regen, Schnee, Herbstblätter, Sterne, Gewitter, Weihnachtsmann usw.).

## Installation (HACS)
1. Repository zu GitHub pushen (z.B. `https://github.com/Knutnoh/weather_overlay`).
2. In HACS -> Einstellungen -> `Custom repositories` hinzufügen:  
   - Repository: `https://github.com/Knutnoh/weather_overlay`  
   - Category: `Integration`
3. Installiere die Integration über HACS.
4. Lade die Ressourcen in Lovelace (wenn HACS installiert, sollte das JS unter `/hacsfiles/weather_overlay/frontend/weather_overlay.js` verfügbar sein).
5. Füge in Lovelace Resources (Einstellungen -> Dashboards -> Ressourcen) eine neue Ressource hinzu:
   - URL: `/hacsfiles/weather_overlay/frontend/weather_overlay.js`
   - Typ: `JavaScript Module`
6. Erstelle (falls gewünscht nicht automatisch) in HA einen Helper `input_boolean.dashboardanimation` — die Integration versucht, diesen Helper beim ersten Start automatisch anzulegen, falls er nicht existiert.
7. Schalte `input_boolean.dashboardanimation` auf **on**, das Overlay startet dann automatisch.  

## Hinweise
- Keine externen PNG-Dateien nötig; alles wird per Canvas gerendert.
- Volle Animation (maximale Effekte) ist standardmäßig aktiviert.
- Bei Fragen: Erstelle ein Issue im Repository.
