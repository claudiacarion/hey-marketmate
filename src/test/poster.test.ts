import { describe, expect, it } from "vitest";
import { rankCategories, requiresCredit, creditLine, stockPhotos } from "@/lib/poster/photos";
import { textOn, wrapLines, FORMATS } from "@/lib/poster/render";

describe("poster photos", () => {
  it("CC BY photos require a credit, CC0 does not", () => {
    expect(requiresCredit({ license: "by" })).toBe(true);
    expect(requiresCredit({ license: "cc0" })).toBe(false);
  });
  it("every bundled photo has a creator, source and licence", () => {
    expect(stockPhotos.length).toBeGreaterThan(20);
    for (const p of stockPhotos) { expect(p.creator).toBeTruthy(); expect(p.source).toMatch(/^https?:/); expect(["cc0", "by", "pdm"]).toContain(p.license); }
  });
  it("credit line names the photographer and licence", () => {
    const p = stockPhotos.find((x) => x.license === "by")!;
    expect(creditLine(p)).toContain(p.creator);
    expect(creditLine(p)).toContain("CC BY");
  });
  it("salons get hair photos first, cafés with coffee copy get coffee first", () => {
    expect(rankCategories("Salon / Beauty", "Fresh cuts this week")[0]).toBe("salon");
    expect(rankCategories("Restaurant / Café", "Two lattes for one")[0]).toBe("cafe");
    expect(rankCategories("Fitness studio", "Join our new class")[0]).toBe("fitness");
  });
});

describe("poster rendering helpers", () => {
  it("sizes match social, story and A4 print", () => {
    expect([FORMATS.social.w, FORMATS.social.h]).toEqual([1080, 1350]);
    expect([FORMATS.story.w, FORMATS.story.h]).toEqual([1080, 1920]);
    expect([FORMATS.print.w, FORMATS.print.h]).toEqual([2480, 3508]);
  });
  it("picks readable text colour", () => {
    expect(textOn("#1f4f3f")).toBe("#ffffff");
    expect(textOn("#f7e07a")).toBe("#141414");
  });
  it("wraps text to the width", () => {
    const ctx = { measureText: (t: string) => ({ width: t.length * 10 }) } as unknown as CanvasRenderingContext2D;
    expect(wrapLines(ctx, "one two three four", 100)).toEqual(["one two", "three four"]);
  });
});
