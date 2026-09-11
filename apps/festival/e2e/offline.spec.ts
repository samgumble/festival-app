import { expect, test } from "@playwright/test";

test("airplane-mode reload still renders the lineup and says offline-ready", async ({ page, context }) => {
  await page.goto("/");
  // Wait for the worker to control the page and finish precaching.
  await page.waitForFunction(() => navigator.serviceWorker?.controller != null || false, null, { timeout: 15_000 }).catch(async () => {
    await page.reload();
    await page.waitForFunction(() => navigator.serviceWorker?.controller != null, null, { timeout: 60_000 });
  });
  await page.waitForFunction(async () => (await caches.keys()).some((k) => k.startsWith("workbox-precache")), null, { timeout: 60_000 });

  await context.setOffline(true);
  await page.goto("/lineup");
  await page.getByRole("radio", { name: "Fri" }).click();
  await expect(page.getByText("Myron Elkins")).toBeVisible();   // Friday noon set; Friday is the default day before the festival
  await page.goto("/info");
  await expect(page.getByText(/offline-ready ✓/)).toBeVisible();
  await context.setOffline(false);
});
