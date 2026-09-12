# Privacy Policy — Telluride Blues & Brews app

**Source of truth:** the policy is published inside the app and on the web at `/privacy`
(`apps/festival/src/features/info/PrivacyScreen.tsx`; live at https://samgumble.github.io/festival-app/privacy until a
tellurideblues.com URL exists). This file mirrors that text for store submissions. When either changes, change both and
bump `PRIVACY_EFFECTIVE` (D-025).

*Effective September 12, 2026 · Telluride Blues & Brews Festival app · published by SBG Productions.*

## No accounts
The app does not offer or require sign-in. There are no user accounts, usernames, or passwords.

## What stays on your device
These are kept only on your own phone or browser, never on a server we control:
- your favorited sets and the plan built from them, including any conflict choices
- your settings: appearance, reminder lead time, whether set reminders are on, and which alerts you have read

Deleting the app, or clearing the website's data in your browser, erases all of it. We have no copy.

## What travels over the network
- **Lineup and alerts.** The app reads the current schedule and organizer alerts from a public, read-only database run by SBG Productions on Google Firebase (Firestore). Like any internet request, Google's servers see your device's IP address while serving it. Nothing about you is sent, stored, or linked to you.
- **The web version** is served from GitHub Pages, which receives ordinary web-server request information to deliver the page. There is no analytics or tracking on top of that.
- **Set reminders** (iPhone and Android app only) are scheduled on your device with the operating system's local notifications. They are not sent through us or any push service.
- **Links** to tellurideblues.com and to maps open in your browser or maps app, which have their own privacy practices.

## What we do not do
- No analytics, advertising, or tracking software of any kind.
- No collecting, selling, or sharing of personal information, because none is collected.
- No location tracking.
- No cookies used for tracking. The web version uses ordinary browser storage only for the on-device data described above.

## Festival staff console
A separate, password-protected console lets SBG Productions staff edit the lineup and send alerts. Staff sign in with an email address through Google Firebase Authentication; that email is used only to control access and is not shown to fans.

## Children
This is a general festival guide and is not directed at children under 13. It collects no personal information from anyone.

## Changes and contact
If this policy changes, the effective date above changes with it and the new text appears at the same place. Questions go to SBG Productions through the festival website, https://www.tellurideblues.com.
