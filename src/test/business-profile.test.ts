import { describe, expect, it } from "vitest";
import { isEtsySeller, normalizeProfile } from "@/lib/business-profile";

describe("business profile", () => {
  it("Etsy panel shows for Handmade & Creative", () => expect(isEtsySeller({ category: "Handmade & Creative Businesses", salesChannels: [] })).toBe(true));
  it("Etsy panel shows when Etsy is a sales channel", () => expect(isEtsySeller({ category: "Retail & Online Shops", salesChannels: ["Etsy"] })).toBe(true));
  it("no Etsy panel otherwise", () => expect(isEtsySeller({ category: "Food & Hospitality", salesChannels: ["Physical shop"] })).toBe(false));
  it("old saved type maps to new category", () => expect(normalizeProfile({ type: "Salon / Beauty" }).category).toBe("Beauty & Personal Care"));
});
