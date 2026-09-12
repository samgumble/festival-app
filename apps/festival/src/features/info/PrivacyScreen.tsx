import { Link } from "react-router";
import { Card, Eyebrow } from "@/design";
import { useContent } from "@/data/content";

/** Effective date of the policy text below. Bump it whenever the wording changes (D-025). */
export const PRIVACY_EFFECTIVE = "September 12, 2026";

/**
 * The app's privacy policy, served in-app at /privacy and on the web at the same path so the
 * stores have a live URL. Every sentence describes what the code actually does; if behavior
 * changes (accounts, push, analytics), this page and docs/store/privacy-policy.md change with it.
 */
export function PrivacyScreen() {
  const { festival } = useContent();
  return (
    <div className="pt-3">
      <Link to="/info" className="eyebrow text-fg-soft">← Info</Link>
      <h1 className="mt-2 font-display text-[32px] leading-9 text-structure-2">Privacy</h1>
      <p className="mt-1 text-[13px] text-fg-soft">Effective {PRIVACY_EFFECTIVE} · {festival.name} app · published by SBG Productions</p>

      <Section title="No accounts">
        The app does not offer or require sign-in. There are no user accounts, usernames, or passwords.
      </Section>

      <Section title="What stays on your device">
        <p>These are kept only on your own phone or browser, never on a server we control:</p>
        <ul className="mt-1.5 list-disc space-y-1 pl-5">
          <li>your favorited sets and the plan built from them, including any conflict choices</li>
          <li>your settings: appearance, reminder lead time, whether set reminders are on, and which alerts you have read</li>
        </ul>
        <p className="mt-1.5">Deleting the app, or clearing the website's data in your browser, erases all of it. We have no copy.</p>
      </Section>

      <Section title="What travels over the network">
        <ul className="list-disc space-y-1 pl-5">
          <li><b className="text-fg">Lineup and alerts.</b> The app reads the current schedule and organizer alerts from a public, read-only database run by SBG Productions on Google Firebase (Firestore). Like any internet request, Google's servers see your device's IP address while serving it. Nothing about you is sent, stored, or linked to you.</li>
          <li><b className="text-fg">The web version</b> is served from GitHub Pages, which receives ordinary web-server request information to deliver the page. There is no analytics or tracking on top of that.</li>
          <li><b className="text-fg">Set reminders</b> (iPhone and Android app only) are scheduled on your device with the operating system's local notifications. They are not sent through us or any push service.</li>
          <li><b className="text-fg">Links</b> to tellurideblues.com and to maps open in your browser or maps app, which have their own privacy practices.</li>
        </ul>
      </Section>

      <Section title="What we do not do">
        <ul className="list-disc space-y-1 pl-5">
          <li>No analytics, advertising, or tracking software of any kind.</li>
          <li>No collecting, selling, or sharing of personal information, because none is collected.</li>
          <li>No location tracking.</li>
          <li>No cookies used for tracking. The web version uses ordinary browser storage only for the on-device data described above.</li>
        </ul>
      </Section>

      <Section title="Festival staff console">
        A separate, password-protected console lets SBG Productions staff edit the lineup and send alerts. Staff sign in with an email address through Google Firebase Authentication; that email is used only to control access and is not shown to fans.
      </Section>

      <Section title="Children">
        This is a general festival guide and is not directed at children under 13. It collects no personal information from anyone.
      </Section>

      <Section title="Changes and contact">
        If this policy changes, the effective date above changes with it and the new text appears here. Questions go to SBG Productions through the festival website, <a href={festival.links.site} target="_blank" rel="noreferrer" className="underline">tellurideblues.com</a>.
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="mt-3 text-[14px] leading-5 text-fg-soft">
      <Eyebrow tone="structure">{title}</Eyebrow>
      <div className="mt-1.5">{children}</div>
    </Card>
  );
}
