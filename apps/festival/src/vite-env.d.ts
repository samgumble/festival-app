/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_FESTIVAL_NOW?: string;
  readonly VITE_DATA_SOURCE?: "bundled" | "firestore";
}
declare const __APP_VERSION__: string;
