import { runtime } from "./runtime";

export interface ReminderItem { id: number; setId: string; title: string; body: string; at: number }
export type Permission = "granted" | "denied" | "prompt";

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
  async request(): Promise<"granted" | "denied"> {
    if (!runtime.isNative()) return "denied";
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const { display } = await LocalNotifications.requestPermissions();
    return display === "granted" ? "granted" : "denied";
  },
  /** Android 12+: exact alarms need a system setting; opens it if not granted. iOS/web: true. */
  async ensureExact(): Promise<boolean> {
    if (runtime.platform() !== "android") return true;
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const { exact_alarm } = await LocalNotifications.checkExactNotificationSetting();
    if (exact_alarm === "granted") return true;
    const after = await LocalNotifications.changeExactNotificationSetting();
    return after.exact_alarm === "granted";
  },
  async pending(): Promise<Array<{ id: number; at?: number }>> {
    if (!runtime.isNative()) return [];
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const { notifications } = await LocalNotifications.getPending();
    return notifications.map((n) => ({ id: n.id, at: n.schedule?.at ? new Date(n.schedule.at).getTime() : undefined }));
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
        extra: { setId: i.setId },
      })),
    });
  },
  async cancel(ids: number[]): Promise<void> {
    if (!runtime.isNative() || ids.length === 0) return;
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) });
  },
  /** Fires when the user taps a reminder. Returns an unsubscribe. */
  onTap(handler: () => void): () => void {
    if (!runtime.isNative()) return () => {};
    let remove: (() => void) | undefined;
    let cancelled = false;
    void import("@capacitor/local-notifications").then(async ({ LocalNotifications }) => {
      const h = await LocalNotifications.addListener("localNotificationActionPerformed", () => handler());
      if (cancelled) await h.remove();
      else remove = () => void h.remove();
    });
    return () => { cancelled = true; remove?.(); };
  },
};
