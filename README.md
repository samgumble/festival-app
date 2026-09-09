# Blues & Brews Festival Companion

An offline-first festival companion for the 2026 Telluride Blues & Brews Festival. It is a static PWA for fast browser iteration and a Capacitor 8 app for iOS and Android. There are no accounts, payments, ad SDKs, analytics, or private backends.

## Preview locally (start here)

Do not double-click `index.html` or open it with a `file://` URL. Content loading, routing, and offline service workers require a local HTTP origin.

```bash
npm install
npm run dev
```

Open `http://localhost:4173`. The organizer tool is at `http://localhost:4173/admin.html`.

For the production build instead:

```bash
npm run build
npm run preview
```

Then open the same URL: `http://localhost:4173`.

```bash
npx cap sync        # copy the build and sync native plugins
```

See [HANDOFF.md](HANDOFF.md) for architecture, content operations, native testing, GitHub Pages, App Store guidance, and the continuation plan.

For GitHub Pages, the recommended generic repository name is `music-app`. The app itself remains fully branded. The included workflow and relative URLs support deployment at `https://ACCOUNT.github.io/music-app/`.
