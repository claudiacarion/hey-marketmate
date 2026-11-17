import { describe, it, expect } from "vitest";
import { buildNotifications } from "@/lib/notifications";
const row = (status: string, startDate: string) => ({ id: "c1", title: "Spring Sale", status, created_at: "2026-11-01T10:00:00Z", poster: {}, plan: null, brief: { startDate } });
const now = new Date(2026, 10, 17, 12);
describe("ready to launch", () => {
  it("draft on start date", () => { const n = buildNotifications([row("Draft", "2026-11-17")], now).find(x => x.kind === "launch"); expect(n?.title).toBe("Start date reached"); expect(n?.body).toBe("Review and launch “Spring Sale”."); });
  it("draft starting tomorrow", () => expect(buildNotifications([row("Draft", "2026-11-18")], now).find(x => x.kind === "launch")?.title).toBe("Starts tomorrow"));
  it("not two days ahead", () => expect(buildNotifications([row("Draft", "2026-11-19")], now).some(x => x.kind === "launch")).toBe(false));
  it("not when live", () => expect(buildNotifications([row("Live", "2026-11-17")], now).some(x => x.kind === "launch")).toBe(false));
});
