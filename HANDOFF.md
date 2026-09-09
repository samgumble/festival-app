# Blues & Brews Companion — living handoff

Updated: September 8, 2026

## Product intent

This is a simple, genuinely useful festival companion rather than a ticketing product or a thin web brochure. The home screen exposes the complete official 2026 artist lineup. People heart artists locally, generate a conflict-free personal plan, ask “what should I see next?”, save local set reminders, export calendar events, use a researched offline festival guide, and share a poster-styled image containing only their favorited artists.

No account, payment, ticket storage, precise location, analytics, or personal-data backend is present. Favorites, plan, cached content, and preferences remain on-device.

## Current implementation

- `index.html`, `styles.css`, `app.js`: dependency-free mobile web app.
- `data/content.json`: single public, versioned content source.
- `sw.js`: app-shell and content caching with network-first freshness and offline fallback.
- `admin.html`: local/public-safe content publisher. It validates and downloads JSON but cannot mutate GitHub or hold credentials.
- `privacy.html`: public privacy policy matching the current implementation.
- `ios/`, `android/`: generated Capacitor 8 native projects.
- `assets/poster-source-preview.png`: a 1080×1890 derivative of the licensed layered PSD, used intact and full-bleed as the on-device share-image template. The roughly 1.74 GB source PSD is untouched in `SBG Content/`.
- `assets/fonts/`: locally bundled OFL fonts and exact license files. See `FONT_LICENSES.md`.

### Flagship responsive UI system

`UI-SPEC.md` is the standalone, implementation-level design contract for the current interface. It was checked across all six UI review dimensions before implementation. The app now expands into a true desktop festival dashboard at 1024px and above while retaining a focused, one-handed mobile experience with a raised navigation dock, 44px-or-larger controls, keyboard focus treatments, live status regions, and route-specific empty/error/loading feedback.

Home, Lineup, My Plan, and Guide share the licensed poster palette and locally bundled type. Favorites update instantly across home cards, lineup rows, navigation counts, and the plan. My Plan has no manual build or reveal step: opening it immediately derives, persists, and displays the complete expanded conflict-aware schedule, and every favorite, mood, or pace change recomputes the result in place. The tuner includes a polite live status instead of the former build CTA, while the result retains next-set guidance, reminder/calendar actions, and poster sharing. Search and day filters expose their result state; the organizer publisher uses the same visual language while remaining local-only and credential-free.

The home hero's signature scroll moment uses several masked views of the existing `assets/poster-source-preview.png`: the sun, mountain, and foreground regions begin at a subtle maximum 24px offset and assemble as the page moves through its opening scroll. One requestAnimationFrame-updated CSS custom property drives transform-only movement. Reduced-motion, sub-360px, Save-Data, and poster-load-failure paths remain static. No new or reconstructed artwork is introduced, and the poster is already part of the offline app shell. WebKit mask/backdrop prefixes accompany the standards declarations.

The referenced “SVG content folder” was not present when this handoff was written (`find . -iname '*.svg'` returned no files). If the layered SVG arrives later, preserve it and treat it as a source asset only. The current personalized edition keeps the official illustration, border, annual badge, and brewers banner intact. It cleans only the poster’s existing printed-lineup zone with a feathered paper field reconstructed from the light pixels and grain colors sampled from that exact zone, then typesets “MY FESTIVAL PICKS” and the user’s current favorites in the same compact uppercase composition. It adds no card, new panel, or full-frame color wash.

The editable `SBG Content/16x28 commemorative poster.psd` is roughly 1.74 GB and is explicitly ignored by Git. `scripts/build.mjs` copies only `assets/` and never copies `SBG Content/`, so the PSD cannot enter `dist/` or either native public bundle. The accepted runtime derivative is approximately 5 MB at 1080×1890 to preserve its paper grain and small poster detail; the personalized export remains 1080×1920.

The poster’s Beastly, Eurostile Extended, and Futura PT lettering remains only as rasterized artwork. Adobe Fonts files are not bundled or fetched. Dynamic personalized-poster type uses locally bundled OFL substitutes; the current export uses Michroma for its extended label and Archivo Black for its compact artist hierarchy. Rye and Jost are bundled, licensed alternatives for future expressive/support refinements. `FONT_LICENSES.md` records sources, exact licenses, and the isolated swap path if explicit mobile embedding licenses are purchased later.

## Authoritative content and provenance

All artist names, public set times, stages, gates, venue, entry rules, accessibility, transport, weather guidance, food/facilities, wristband information, and FAQ copy are based on official festival sources:

- [Official 2026 lineup](https://www.tellurideblues.com/lineup)
- [Official 2026 schedule](https://www.tellurideblues.com/schedule)
- [Official 2026 festival guide](https://www.tellurideblues.com/news/the-official-telluride-blues-brews-festival-guide)
- [Official festival FAQ](https://www.tellurideblues.com/faqs)
- [2026 lineup announcement](https://www.tellurideblues.com/news/the-2026-telluride-blues-brews-artist-lineup-is-here)

Schedule data is explicitly subject to change. `meta.verifiedAt` and `meta.contentVersion` must be updated whenever official data changes. No artist genres, biographies, or recommendations should be invented; add them only from approved/official copy and record the source.

## Content publishing

1. Run `npm run dev` and open `/admin.html`.
2. Update the announcement or open/edit the full JSON.
3. Confirm the green validation status and download `content.json`.
4. Replace `data/content.json`, inspect the diff, and commit to `main`.
5. GitHub Actions builds `dist/` and publishes it to Pages.
6. For native releases, run `npm run build && npx cap sync`, then ship a new binary. Native apps contain the last bundled good copy and also refresh the public JSON when online.

The publisher intentionally does not write directly to GitHub. That keeps credentials and write authority out of a public page. The repository’s review/branch protections are the publication gate.

Production repository: [samgumble/music-app](https://github.com/samgumble/music-app). Production site: [samgumble.github.io/music-app](https://samgumble.github.io/music-app/). Pages is configured for GitHub Actions with `.github/workflows/pages.yml`, HTTPS enforcement, and `main` as the durable branch. Official reference: [GitHub Pages custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

The generic repository name does not anonymize the actual app—the deployed experience intentionally retains the complete Blues & Brews name, licensed artwork, and official festival content. The owning GitHub username remains visible in the default Pages URL; move the repository to an appropriate organization account or use a custom domain if ownership privacy requirements change.

Deployment verification on September 8, 2026 confirmed the public repository is `PUBLIC`, Pages uses the workflow build type, and the flagship UI deployment for implementation commit `603a055` completed successfully. Home, Lineup, My Plan, Guide, and the organizer publisher rendered from the public site at mobile and desktop breakpoints. The versioned CSS and JavaScript, manifest, service worker, official content JSON, privacy page, runtime poster, and local font assets all returned HTTPS 200. The cache refresh handoff activated cleanly without losing the active route. The remote tree contains the runtime poster derivative, workflow, font licenses, and native iOS/Android source; it contains no PSD master, dependencies, generated `dist/`, credentials, signing material, or caches.

The build has no root-absolute asset URLs. Manifest start URL, app assets, privacy/admin links, content fetch, and service-worker registration/scope are relative, so the app is compatible with the `/music-app/` project subpath.

## Offline behavior

The PWA caches the app shell, official content JSON, logo assets, privacy policy, and poster share template. The app also stores the last successfully downloaded content JSON in local storage. Native Capacitor builds bundle the same assets, so lineup, schedule, guide/FAQ, venue essentials, favorites, and the personal plan work without venue connectivity. Calendar files and share images are generated locally. Set reminders are scheduled locally.

An offline status appears when connectivity is lost. Online content uses network-first refresh and falls back to the saved copy. The current UI shell is cache generation `blues-brews-2026-v18`, with matching `?v=18` CSS and JavaScript URLs. Bump the `CACHE` name in `sw.js` and the asset query in `index.html` for every production asset change.

When a new service worker finishes installing, the app shows **A fresh festival guide is ready → Refresh now**. Applying it activates the new worker and reloads without deleting favorites or plans. This recovery path was added after an early prototype service worker retained a broken script revision; do not remove the asset-version bump or update prompt.

## Native stack and verified environment

Dependencies are official Capacitor packages only:

- Capacitor core/iOS/Android 8.5.1
- Capacitor CLI 8.4.3 (pinned because the 8.5.1 CLI dependency graph carried a moderate `uuid` advisory on September 8, 2026; full `npm audit` is clean at this pin)
- Filesystem 8.1.3, Local Notifications 8.3.1, Share 8.0.1

Verified on this Mac:

- Node 26.4.0 and npm 11.17.0 installed.
- Xcode 26.6 installed at `/Applications/Xcode.app`; its license is accepted and Swift Package Manager resolved the Capacitor dependencies.
- CocoaPods 1.17.0 installed, although the Capacitor 8 iOS project uses Swift Package Manager.
- iOS and Android native projects generated successfully.
- The downloaded Android Studio bundle was the Intel/x86_64 build and its JetBrains runtime cannot launch on this Apple Silicon Mac. Remove that incorrect app bundle and reinstall the **macOS Apple Silicon (ARM64)** Android Studio download. Android SDK/JDK 21 setup remains pending until that correct build launches.
- Xcode does not yet have the iOS 26.5 platform/Simulator runtime installed. `xcodebuild` resolves packages but reports “iOS 26.5 is not installed,” so native compile/launch remains pending that Xcode component.

### iOS setup and testing

Open **Xcode → Settings → Components** and install the iOS 26.5 platform and an iPhone Simulator runtime. This is a large Apple download and was intentionally not started automatically. The Xcode license is already accepted on this Mac. Then:

```bash
npm run build
npx cap sync ios
open ios/App/App.xcodeproj
```

In Xcode choose the App target, set the signing Team and final bundle identifier, select an installed iPhone Simulator, and Run. Use a physical device before TestFlight to verify local notifications, native sharing, offline launch, safe-area layout, and calendar-file handoff. No signing identity or App Store record is created by this repository.

### Android setup and testing

Download and install the **macOS Apple Silicon (ARM64)** Android Studio build—not the Intel/x86_64 build. Use its setup wizard to install Android SDK, emulator, platform tools, and JDK 21+. Then:

```bash
npm run build
npx cap sync android
npx cap open android
```

Allow Gradle to sync, create an emulator, and Run. Verify airplane-mode launch, notification denial/grant, local reminders, share sheet, calendar export, and back navigation. Configure a release keystore outside the repository; never commit it or its passwords.

Capacitor reference: [official environment and workflow docs](https://capacitorjs.com/docs/getting-started/environment-setup).

## Prototype and feedback loop

1. Browser: `npm run dev` for fastest layout/content iteration. Check narrow mobile (390×844), tablet, reduced motion, keyboard, and VoiceOver semantics.
2. iOS Simulator/device: `npx cap sync ios`, then run in Xcode. Native share/reminders require a device-quality pass.
3. Stakeholders: archive in Xcode, upload to App Store Connect, and distribute through an internal TestFlight group. Ask testers specifically about lineup scanning, favorite confidence, schedule conflict explanations, offline confidence, and guide findability.
4. Release: fix TestFlight issues, capture final screenshots, complete privacy answers, attach review notes, and submit.

Fable can consume screenshots, the CSS tokens at the top of `styles.css`, and the poster derivative for visual exploration. Treat Fable output as design input; preserve the DOM semantics, content schema, privacy model, offline guarantees, and official-data provenance when bringing concepts back. Claude/Codex should begin with this handoff, inspect `data/content.json`, run the browser prototype, and update this document when decisions change.

## App Store readiness and privacy

Apple can reject a thin website wrapper under review guidelines 4.2/2.1. The native product’s differentiators are bundled offline data, conflict-aware on-device planning, date-aware next-set guidance, native local notifications, native share-image export, and calendar integration. Explain and demonstrate those in review notes.

- Notification permission is requested only after tapping **Remind me**. Denial does not reduce core functionality. There are no promotional notifications; adding them later requires explicit opt-in and in-app opt-out.
- The app privacy manifest is `ios/App/App/PrivacyInfo.xcprivacy` and is included in the Xcode resource phase. Re-audit it and every plugin before each submission.
- If implementation remains unchanged, App Store Connect’s privacy answer should be **Data Not Collected**. Verify this against the final binary and policy; App Store disclosures describe actual behavior, not intent.
- The public privacy policy is `/privacy.html`.
- Do not add analytics/ads merely for usage counts. If aggregate analytics become essential, make a fresh privacy/product decision first.

Apple primary sources:

- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [App review submission](https://developer.apple.com/app-store/review/)
- [App privacy details](https://developer.apple.com/app-store/app-privacy-details/)
- [Third-party SDK requirements](https://developer.apple.com/support/third-party-SDK-requirements/)
- [Privacy manifest files](https://developer.apple.com/documentation/bundleresources/privacy-manifest-files)
- [Requesting notification permission](https://developer.apple.com/documentation/usernotifications/asking-permission-to-use-notifications)

Suggested App Review Notes are in `APP_REVIEW_NOTES.md`.

## Known decisions and next work

1. Confirm the final iOS/Android application ID. Current placeholder: `com.sbgproductions.bluesandbrews`.
2. Confirm the public support/privacy contact and GitHub Pages/custom domain before submission.
3. Replace generated default native icons and launch screens with production exports from the licensed artwork.
4. After the iOS 26.5 platform/Simulator component is installed in Xcode, complete simulator/device checks and archive validation.
5. When Android Studio works, complete Gradle/emulator/release configuration.
6. Consider an optional signed, one-way urgent-alert feed only if the organizer accepts push-notification operations. Do not delay v1 for it.
7. If official artist descriptions/listen links are approved, add them with source URLs; that would deepen taste-based discovery without fabricated metadata.
