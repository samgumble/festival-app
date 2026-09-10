/** Public-dir asset URL that respects Vite's `base` (GitHub Pages serves the app under /festival-app/). */
export function asset(path: string): string {
  return `${import.meta.env.BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}
