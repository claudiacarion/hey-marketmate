import { describe, it, expect } from "vitest";
import { rescheduleBrief, taskDatesFor, toLocalISO } from "@/lib/task-dates";

const cal = [1, 3, 5, 8, 10].map((n) => ({ day: `Day ${n}`, theme: "t", action: "a", channel: "c", timing: "" })) as never;
const brief = { startDate: "2026-12-01", goal: "x" };

describe("rescheduling", () => {
  it("moves all pending tasks by the start-date difference", () => {
    const b = rescheduleBrief(brief, cal, "2026-11-01T00:00:00Z", "2026-12-08", new Set());
    expect(b.taskDates).toEqual(["2026-12-08", "2026-12-10", "2026-12-12", "2026-12-15", "2026-12-17"]);
    expect(b.startDate).toBe("2026-12-08");
    expect(b.goal).toBe("x");
  });
  it("keeps completed tasks on their original dates", () => {
    const b = rescheduleBrief(brief, cal, "2026-11-01T00:00:00Z", "2026-12-08", new Set([0, 1]));
    expect(b.taskDates).toEqual(["2026-12-01", "2026-12-03", "2026-12-12", "2026-12-15", "2026-12-17"]);
  });
  it("shifts from saved dates on a second change", () => {
    const b1 = rescheduleBrief(brief, cal, "x", "2026-12-08", new Set([0]));
    const b2 = rescheduleBrief(b1, cal, "x", "2026-12-06", new Set([0]));
    expect(taskDatesFor(b2, cal, "x").map(toLocalISO)).toEqual(["2026-12-01", "2026-12-08", "2026-12-10", "2026-12-13", "2026-12-15"]);
  });
  it("crosses month/DST boundaries without drifting", () => {
    const b = rescheduleBrief({ startDate: "2026-03-25" }, cal, "x", "2026-03-30", new Set());
    expect(b.taskDates![0]).toBe("2026-03-30");
    expect(b.taskDates![4]).toBe("2026-04-08");
  });
});
