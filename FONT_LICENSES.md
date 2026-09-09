# Font licenses and app-embedding policy

No Adobe Fonts files are bundled in this project.

The licensed official poster artwork contains letterforms from Beastly, Eurostile Extended, and Futura PT as rasterized pixels in the original PSD and the derived PNG. The app does not distribute or reconstruct those font files.

Dynamic app and personalized-poster text uses these SIL Open Font License substitutes downloaded from the official [Google Fonts repository](https://github.com/google/fonts):

| Role | Bundled family | File | Exact license |
|---|---|---|---|
| Expressive poster/artist display | Rye | `assets/fonts/rye/Rye-Regular.ttf` | `assets/fonts/rye/OFL.txt` |
| Wide geometric poster label | Michroma | `assets/fonts/michroma/Michroma-Regular.ttf` | `assets/fonts/michroma/OFL.txt` |
| Clean geometric support text | Jost | `assets/fonts/jost/Jost-Variable.ttf` | `assets/fonts/jost/OFL.txt` |
| Existing app display UI | Archivo Black | `assets/fonts/archivo-black/ArchivoBlack-Regular.ttf` | `assets/fonts/archivo-black/OFL.txt` |
| Existing app body UI | DM Sans | `assets/fonts/dm-sans/DMSans-Variable.ttf` | `assets/fonts/dm-sans/OFL.txt` |

All fonts are served locally and bundled into the Capacitor apps for reliable offline rendering.

## Future licensed-font swap

If the festival purchases explicit mobile-app embedding licenses from the relevant foundries:

1. Put the licensed files in a new `assets/fonts/licensed/` folder together with the license record. Do not replace or delete this audit document.
2. Add local `@font-face` declarations in `styles.css`.
3. Change only the canvas font declarations in `createShareImage` / `drawLineupNames` inside `app.js`: currently `Michroma` for “MY FESTIVAL PICKS” and `Archivo Black` for artist names. Rye and Jost remain available as licensed expressive/support alternatives.
4. Add the new files to `APP_SHELL` in `sw.js`, increment the cache and asset versions, rebuild, and sync both native projects.
5. Re-audit the final iOS/Android binary to confirm the license permits app embedding and the exact approved files are the ones shipped.
