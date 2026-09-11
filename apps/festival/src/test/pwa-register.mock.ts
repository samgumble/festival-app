import { vi } from "vitest";

export const updateSW = vi.fn(async (_reload?: boolean) => {});
export const registerSW = vi.fn((_options?: unknown) => updateSW);
