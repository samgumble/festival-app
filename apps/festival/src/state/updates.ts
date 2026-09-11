import { create } from "zustand";

/** Bridges service-worker lifecycle events (src/app/sw.ts) to the UI. Session-only; never persisted. */
interface UpdateState {
  needRefresh: boolean;
  offlineReady: boolean;
  dismissed: boolean;
  apply: () => Promise<void>;
  setNeedRefresh: () => void;
  setOfflineReady: () => void;
  dismiss: () => void;
  setApply: (fn: () => Promise<void>) => void;
  reset: () => void;
}

const initial = { needRefresh: false, offlineReady: false, dismissed: false, apply: async () => {} };

export const useUpdateStore = create<UpdateState>()((set) => ({
  ...initial,
  setNeedRefresh: () => set({ needRefresh: true, dismissed: false }),
  setOfflineReady: () => set({ offlineReady: true }),
  dismiss: () => set({ dismissed: true }),
  setApply: (apply) => set({ apply }),
  reset: () => set({ ...initial }),
}));
