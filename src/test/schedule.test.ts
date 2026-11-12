import { describe, it, expect } from "vitest";
import {
  activityType, backToBackFeedDays, cadenceSummary, dayNumberOf, isQuickActivity,
  purposeLabel, scheduleIssues, spanDays,
} from "@/lib/schedule";

type Item = { day: string; theme: string; channel: string; timing: string; action: string; type?: string; purpose?: string };
const item = (day: number, type: string, channel = "Instagram", extra: Partial<Item> = {}): Item =>
  ({ day: `Day ${day}`, theme: "t", channel, timing: "18:00", action: "a", type, purpose: "awareness", ...extra });

describe("activity kinds", () => {
  it("recognises the formats the AI is asked to mix", () => {
    expect(activityType("feed_post")).toBe("feed_post");
    expect(activityType("Reel")).toBe("reel");
    expect(activityType("short-form video")).toBe("reel");
    expect(activityType("story")).toBe("story");
    expect(activityType("Engagement Activity")).toBe("engagement");
    expect(activityType("reminder")).toBe("reminder");
    expect(activityType("quantum dance")).toBe("other");
    expect(activityType(undefined)).toBe("other");
  });
  it("labels purposes without inventing one", () => {
    expect(purposeLabel("conversion")).toBe("Conversion");
    expect(purposeLabel("trust")).toBe("Trust-building");
    expect(purposeLabel("")).toBe("");
    expect(purposeLabel("window dressing")).toBe("Window dressing");
  });
  it("treats stories and engagement as the light activities", () => {
    expect(isQuickActivity("story")).toBe(true);
    expect(isQuickActivity("engagement")).toBe(true);
    expect(isQuickActivity("feed_post")).toBe(false);
  });
});

describe("day numbering", () => {
  it("reads the day out of the label", () => {
    expect(dayNumberOf("Day 12", 0)).toBe(12);
    expect(dayNumberOf("day 3", 9)).toBe(3);
    expect(dayNumberOf("Launch day", 4)).toBe(5);
    expect(dayNumberOf(undefined, 2)).toBe(3);
  });
  it("spans the days the schedule actually uses", () => {
    expect(spanDays([item(1, "feed_post"), item(6, "story")])).toBe(6);
    expect(spanDays([])).toBe(0);
  });
});

describe("pacing rules for a 7-day campaign", () => {
  const dailyDump = Array.from({ length: 7 }, (_, i) => item(i + 1, "feed_post"));

  it("flags one feed post on every single day", () => {
    const issues = scheduleIssues(dailyDump, 7);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.join(" ")).toMatch(/7 main feed posts on instagram/);
    expect(issues.join(" ")).toMatch(/back-to-back days/);
    expect(issues.join(" ")).toMatch(/leave days with no work/);
  });

  it("accepts 3 feed posts spread across the week", () => {
    const plan = [
      item(1, "feed_post", "Instagram", { purpose: "awareness" }),
      item(1, "story", "Instagram", { purpose: "engagement" }),
      item(3, "reel", "Instagram", { purpose: "trust" }),
      item(4, "feed_post", "Instagram", { purpose: "conversion" }),
      item(5, "engagement", "Instagram", { purpose: "engagement" }),
      item(6, "story", "Instagram", { purpose: "awareness" }),
      item(7, "feed_post", "Instagram", { purpose: "conversion" }),
    ];
    expect(scheduleIssues(plan, 7)).toEqual([]);
    const c = cadenceSummary(plan);
    expect(c.feedPosts).toBe(3);
    expect(c.daysUsed).toBe(6);
    expect(c.span).toBe(7);
    expect(c.byType.map((b) => `${b.label} ${b.n}`).join(", "))
      .toBe("Feed post 3, Reel / short video 1, Story / quick update 2, Engagement 1");
    expect(c.backToBackFeed).toEqual([]);
  });

  it("flags feed posts on consecutive days", () => {
    const plan = [item(1, "feed_post"), item(2, "feed_post"), item(4, "feed_post"), item(5, "feed_post"), item(7, "story")];
    expect(backToBackFeedDays(plan)).toEqual([2, 5]);
    expect(scheduleIssues(plan, 7).join(" ")).toMatch(/Day 2, Day 5/);
  });

  it("allows one back-to-back pair when the rest is spaced", () => {
    const plan = [item(1, "feed_post"), item(2, "feed_post"), item(4, "story"), item(6, "feed_post")];
    expect(scheduleIssues(plan, 7)).toEqual([]);
  });

  it("gives each platform its own cadence instead of an identical schedule", () => {
    const identical = [
      ...[1, 2, 3, 4, 5, 6].map((d) => item(d, "feed_post", "Instagram")),
      ...[1, 2, 3, 4, 5, 6].map((d) => item(d, "feed_post", "TikTok")),
    ];
    const issues = scheduleIssues(identical, 7);
    expect(issues).toContain("6 main feed posts on instagram — aim for about 4 across 7 days, spaced out.");
    expect(issues).toContain("6 main feed posts on tiktok — aim for about 4 across 7 days, spaced out.");
    expect(issues.join(" ")).toMatch(/12 main feed posts in total/);
  });

  it("scales longer campaigns without repeating a week", () => {
    const fortnight = Array.from({ length: 14 }, (_, i) => item(i + 1, "feed_post"));
    expect(scheduleIssues(fortnight, 14).join(" ")).toMatch(/14 main feed posts on instagram/);
    const month = Array.from({ length: 28 }, (_, i) => item(i + 1, "feed_post"));
    expect(scheduleIssues(month, 28).join(" ")).toMatch(/28 main feed posts on instagram/);
    const pacedFortnight = [
      ...[1, 4, 8, 11].map((d) => item(d, "feed_post", "Instagram")),
      ...[2, 9].map((d) => item(d, "reel", "Instagram")),
      ...[3, 6, 12].map((d) => item(d, "story", "Instagram")),
      ...[5, 13].map((d) => item(d, "engagement", "Instagram")),
    ];
    expect(scheduleIssues(pacedFortnight, 14)).toEqual([]);
  });

  it("ignores the duration when it is unknown and still checks the pacing", () => {
    expect(scheduleIssues(dailyDump, 0).length).toBeGreaterThan(0);
  });
});
