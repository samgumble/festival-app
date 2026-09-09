# Draft App Review Notes

Blues & Brews is an offline-first, account-free festival companion for the September 18–20, 2026 Telluride Blues & Brews Festival.

No login is required. The app does not process tickets or payments and does not collect user data. Official lineup, schedule, venue guidance, safety/accessibility information, FAQ, and the latest bundled announcement are available at first launch and offline.

Native functionality to review:

1. Open **Lineup** and favorite several artists.
2. Open **My Plan**, choose a pace, and tap **Build my festival flow**. Planning occurs locally and resolves overlapping saved sets.
3. Tap **Remind me** beside a set. Notification permission is requested only here. If denied, the rest of the app remains fully usable; the calendar fallback remains available. No promotional notifications are sent.
4. Tap **Add to calendar** to export an event through the system share/calendar flow.
5. Tap **Share my artist picks** to generate a licensed-poster-styled image locally and open the native share sheet. The graphic contains only the user’s favorited artists.
6. Put the device in airplane mode and relaunch. The lineup, schedule, guide/FAQ, venue essentials, favorites, and personal plan remain available.

The app contains no advertising or analytics SDKs. Capacitor, Filesystem, Local Notifications, and Share are the only third-party native packages. Content and artwork rights are held by the publisher. Privacy policy: `[INSERT FINAL PUBLIC HTTPS URL]/privacy.html`. Support: `[INSERT FINAL SUPPORT URL OR EMAIL]`.

The official public festival content is stored in a versioned JSON file and bundled in the binary. When online, the app may refresh that public file; the last valid copy is retained for offline use.
