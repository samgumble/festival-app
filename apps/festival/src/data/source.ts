/** True when the app should read live content/alerts from Firestore instead of the bundled/fixture data. */
export const useFirestore =
  import.meta.env.VITE_DATA_SOURCE === "firestore" ||
  (import.meta.env.PROD && import.meta.env.VITE_DATA_SOURCE !== "bundled");
