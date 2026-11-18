import { describe, expect, it } from "vitest";
import { buildNotifications, type CampaignRow } from "@/lib/notifications";

const NOW = new Date(2026, 10, 18, 12, 0, 0); // Nov 18, 2026 (local)

function row(overrides: Partial<CampaignRow>): CampaignRow {
  return {
    id: "c1",
    title: "Winter Sale",
    status: "Draft",
    created_at: new Date(2026, 10, 10).toISOString(),
    poster: { savedAt: "x" },
    plan: null,
    brief: {},
    ...overrides,
  };
}

const launches = (rows: CampaignRow[]) => buildNotifications(rows, NOW).filter((n) => n.kind === "launch");

describe("ready-to-launch notifications", () => {
  it("alerts 'Start date reached' when a draft starts today", () => {
    const [n] = launches([row({ brief: { startDate: "2026-11-18" } })]);
    expect(n?.title).toBe("Start date reached");
    expect(n?.body).toBe("Review and launch “Winter Sale”");
    expect(n?.campaignId).toBe("c1");
  });

  it("alerts 'Starting tomorrow' when a draft starts tomorrow", () => {
    const [n] = launches([row({ brief: { startDate: "2026-11-19" } })]);
    expect(n?.title).toBe("Starting tomorrow");
    expect(n?.body).toBe("Review and launch “Winter Sale”");
  });

  it("stays quiet when the start date is further away", () => {
    expect(launches([row({ brief: { startDate: "2026-11-21" } })])).toHaveLength(0);
  });

  it("stays quiet for non-draft campaigns even on the start date", () => {
    expect(launches([row({ status: "Active", brief: { startDate: "2026-11-18" } })])).toHaveLength(0);
  });

  it("stays quiet once the start date has passed", () => {
    expect(launches([row({ brief: { startDate: "2026-11-17" } })])).toHaveLength(0);
  });
});
