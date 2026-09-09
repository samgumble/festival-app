import { describe, expect, it } from "vitest";
import { buildIndex, contentRepository } from "./content";

describe("content repository", () => {
  it("serves validated bundled content and an index", () => {
    const c = contentRepository.getContent();
    expect(c.meta.contentVersion).toBe("2026.09.09.1");
    const idx = buildIndex(c);
    expect(idx.stagesById.get("main")?.color).toBe("sky");
    expect(idx.setsByDay.sat.length).toBe(14);
    expect(idx.setsByArtist.get("nigel-wearne")?.length).toBe(3);
  });
});
