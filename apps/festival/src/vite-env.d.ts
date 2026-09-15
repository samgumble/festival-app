/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_FESTIVAL_NOW?: string;
  readonly VITE_DATA_SOURCE?: "bundled" | "firestore";
  readonly VITE_ALERTS_FIXTURE?: "store";
}
declare const __APP_VERSION__: string;
