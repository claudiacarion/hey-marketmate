import { describe, it, expect } from "vitest";
import { calendarDay } from "@/lib/task-progress";
describe("calendar placement", () => {
  const sched = new Date(2026, 11, 5);
  it("completed task shows on its completion day", () => {
    const c = new Date(2026, 11, 7, 15, 30).toISOString();
    expect(calendarDay(sched, c)).toEqual(new Date(2026, 11, 7));
  });
  it("pending task shows on its scheduled day", () => {
    expect(calendarDay(sched, null)).toEqual(sched);
  });
});
import { cleanTitle } from "@/components/campaign/TitleEditor";
describe("campaign title", () => {
  it("trims spaces", () => expect(cleanTitle("  Spring  Sale ")).toBe("Spring Sale"));
  it("blank becomes empty (blocked)", () => expect(cleanTitle("   ")).toBe(""));
  it("caps at 80 chars", () => expect(cleanTitle("a".repeat(100)).length).toBe(80));
});
