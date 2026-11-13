import { describe, it, expect } from "vitest";
import { assignCampaignColours } from "@/lib/campaign-colours";
const cs = Array.from({ length: 6 }, (_, i) => ({ id: `id-${i}`, created_at: `2026-01-0${i + 1}` }));
describe("campaign colours", () => {
  it("every campaign gets a distinct colour", () => expect(new Set(Object.values(assignCampaignColours(cs))).size).toBe(6));
  it("same colours regardless of order", () => expect(assignCampaignColours([...cs].reverse())).toEqual(assignCampaignColours(cs)));
  it("adding a newer campaign keeps existing colours", () => {
    const a = assignCampaignColours(cs); const b = assignCampaignColours([...cs, { id: "new", created_at: "2026-02-01" }]);
    cs.forEach((c) => expect(b[c.id]).toBe(a[c.id]));
  });
});
