import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Vitest runs without `test.globals`, so @testing-library/react's automatic
// afterEach cleanup (which relies on detecting a global afterEach) never registers.
// Without this, a component from an earlier test can stay mounted and subscribed
// to shared stores (zustand), causing it to re-render alongside a later test's tree.
afterEach(() => cleanup());

// jsdom does not implement matchMedia; useApplyTheme() (src/app/theme.ts) needs it to sync
// <html data-theme> with the OS preference.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
