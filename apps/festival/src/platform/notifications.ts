import { runtime } from "./runtime";

export interface ReminderItem { id: number; setId: string; title: string; body: string; at: number }
export type Permission = "granted" | "denied" | "prompt";

/**
 * Pure mapping from a pending-notification record to its scheduled epoch ms.
 * Prefers `extra.at` (round-tripped verbatim through `schedule()`) since Android can normalize
 * `schedule.at` in ways that don't parse back cleanly; falls back to parsing `schedule.at`, and
 * to `undefined` (never `NaN`) when neither yields a finite number.
 */
export function pendingAt(n: { extra?: unknown; schedule?: { at?: unknown } }): number | undefined {
  const extraAt = (n.extra as { at?: unknown } | undefined)?.at;
  if (typeof extraAt === "number" && Number.isFinite(extraAt)) return extraAt;
  const scheduleAt = n.schedule?.at;
  if (typeof scheduleAt === "string" || typeof scheduleAt === "number") {
    const parsed = new Date(scheduleAt).getTime();
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

/** Local (on-device) notifications for set reminders. Web: unsupported and inert. */
export const notifications = {
  isSupported(): boolean {
    return runtime.isNative();
  },
  async permission(): Promise<Permission> {
    if (!runtime.isNative()) return "denied";
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const { display } = await LocalNotifications.checkPermissions();
    return display === "granted" ? "granted" : display === "denied" ? "denied" : "prompt";
  },
  /**
   * Deep link to this app's notification settings, for when the OS prompt was declined once and
   * will not be shown again. iOS opens the app's Settings page; Android opens its notification page.
   */
  settingsUrl(appId = "com.sbgproductions.bluesandbrews"): string | null {
    const p = runtime.platform();
    if (p === "ios") return "app-settings:";
    if (p === "android") return `intent:#Intent;action=android.settings.APP_NOTIFICATION_SETTINGS;S.android.provider.extra.APP_PACKAGE=${appId};end`;
    return null;
  },
  openSettings(): void {
    const url = notifications.settingsUrl();
    if (url) window.location.href = url;
  },
  async request(): Promise<"granted" | "denied"> {
    if (!runtime.isNative()) return "denied";
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const { display } = await LocalNotifications.requestPermissions();
    return display === "granted" ? "granted" : "denied";
  },
  /** Android 12+: whether exact alarms are currently allowed by the system setting. iOS/web: true. */
  async exactAllowed(): Promise<boolean> {
    if (runtime.platform() !== "android") return true;
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const { exact_alarm } = await LocalNotifications.checkExactNotificationSetting();
    return exact_alarm === "granted";
  },
  /** Android 12+: opens the system setting to request exact alarms. iOS/web: true (no-op). */
  async requestExact(): Promise<boolean> {
    if (runtime.platform() !== "android") return true;
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const { exact_alarm } = await LocalNotifications.changeExactNotificationSetting();
    return exact_alarm === "granted";
  },
  async pending(): Promise<Array<{ id: number; at?: number }>> {
    if (!runtime.isNative()) return [];
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const { notifications } = await LocalNotifications.getPending();
    return notifications.map((n) => ({ id: n.id, at: pendingAt(n) }));
  },
  async schedule(items: ReminderItem[]): Promise<void> {
    if (!runtime.isNative() || items.length === 0) return;
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.schedule({
      notifications: items.map((i) => ({
        id: i.id,
        title: i.title,
        body: i.body,
        schedule: { at: new Date(i.at), allowWhileIdle: true },
        extra: { setId: i.setId, at: i.at },
      })),
    });
  },
  async cancel(ids: number[]): Promise<void> {
    if (!runtime.isNative() || ids.length === 0) return;
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) });
  },
  /** Fires when the user taps one of our notifications, with the `extra` it was scheduled with. Returns an unsubscribe. */
  onTap(handler: (extra?: { setId?: string }) => void): () => void {
    if (!runtime.isNative()) return () => {};
    let remove: (() => void) | undefined;
    let cancelled = false;
    void import("@capacitor/local-notifications").then(async ({ LocalNotifications }) => {
      const h = await LocalNotifications.addListener("localNotificationActionPerformed", (e) => handler(e.notification.extra as { setId?: string } | undefined));
      if (cancelled) await h.remove();
      else remove = () => void h.remove();
    });
    return () => { cancelled = true; remove?.(); };
  },
};
