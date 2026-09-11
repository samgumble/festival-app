import { vi } from "vitest";

export const updateSW = vi.fn(async (_reload?: boolean) => {});
export const registerSW = vi.fn((_options?: unknown) => updateSW);

// vite-plugin-pwa/client only types the `registerSW` export of the real `virtual:pwa-register`
// module; `registerSW`'s return value is the reload callback (typed inline below as `updateSW`
// so tests can import and assert on it directly). This merges into that ambient module so
// `tsc` (which never sees Vitest's `resolve.alias` swap to this file) type-checks sw.test.ts
// cleanly instead of erroring on a "missing" export that only exists in this mock.
declare module "virtual:pwa-register" {
  export function updateSW(reload?: boolean): Promise<void>;
}
