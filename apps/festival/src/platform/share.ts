import { runtime } from "./runtime";
import { downloadText } from "@/features/plan/download";

/** Native share sheet; web uses the Web Share API, then the clipboard, and a download for files. */
export const share = {
  async shareText(title: string, text: string): Promise<void> {
    if (runtime.isNative()) {
      const { Share } = await import("@capacitor/share");
      await Share.share({ title, text });
      return;
    }
    if (navigator.share) await navigator.share({ title, text });
    else await navigator.clipboard?.writeText(text);
  },
  /** v1: native shares the file body as text with the filename in the title (no Filesystem plugin). */
  async shareFile(filename: string, mime: string, text: string): Promise<void> {
    if (runtime.isNative()) {
      const { Share } = await import("@capacitor/share");
      await Share.share({ title: filename, text });
      return;
    }
    downloadText(filename, mime, text);
  },
};
