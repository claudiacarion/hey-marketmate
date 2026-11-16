import { describe, it, expect } from "vitest";
import { enforceBrief, canonChannel, smsSegments, mentionsOffer } from "@/lib/channel-rules";
import { scheduleIssues } from "@/lib/schedule";
import type { CampaignPlan } from "@/lib/campaign-types";

const base: CampaignPlan = {
  title: "t", objective: "o", targetAudience: "a", marketingApproach: "m", coreMessage: "c", promotionalIdea: "p",
  recommendedChannels: [{ channel: "SMS", why: "" }, { channel: "Instagram", why: "" }],
  budgetAllocation: [], successMetrics: [],
  socialPosts: [{ platform: "Instagram", headline: "", caption: "", callToAction: "", visualConcept: "" }],
  calendar: [
    { day: "Day 1", theme: "", channel: "SMS", timing: "", action: "Send SMS" },
    { day: "Day 3", theme: "", channel: "Instagram Stories", timing: "", action: "Story" },
    { day: "Day 9", theme: "", channel: "SMS", timing: "", action: "Late" },
  ],
  pinterestPins: [{ title: "", description: "", visualConcept: "", boardIdea: "" }],
  emailMessages: [{ subject: "", previewText: "", body: "", callToAction: "" }],
  smsMessages: [{ text: "Hi" }],
};

describe("channel-specific plans", () => {
  it("SMS only keeps SMS content and drops Instagram, Pinterest and email", () => {
    const { plan } = enforceBrief(base, ["SMS"], 7);
    expect(plan.socialPosts).toEqual([]);
    expect(plan.pinterestPins).toBeUndefined();
    expect(plan.emailMessages).toBeUndefined();
    expect(plan.smsMessages).toHaveLength(1);
    expect(plan.calendar?.map((c) => c.channel)).toEqual(["SMS"]);
    expect(plan.recommendedChannels.map((c) => c.channel)).toEqual(["SMS"]);
  });
  it("Instagram + SMS keeps both", () => {
    const { plan } = enforceBrief(base, ["Instagram", "SMS"], 7);
    expect(plan.calendar?.map((c) => c.channel)).toEqual(["SMS", "Instagram Stories"]);
    expect(plan.socialPosts).toHaveLength(1);
  });
  it("one-day campaign puts every task on Day 1", () => {
    const { plan } = enforceBrief(base, ["Instagram", "SMS"], 1);
    expect(plan.calendar?.every((c) => c.day === "Day 1")).toBe(true);
    expect(scheduleIssues(plan.calendar!, 1)).toEqual([]);
  });
  it("drops tasks after the campaign ends", () => {
    expect(enforceBrief(base, ["SMS"], 7).plan.calendar?.some((c) => c.day === "Day 9")).toBe(false);
  });
  it("recognises channel names", () => {
    expect(canonChannel("Google Business Profile")).toBe("google");
    expect(canonChannel("Text message")).toBe("sms");
    expect(canonChannel("Newsletter")).toBe("email");
  });
  it("SMS segments: 160 fits one, 161 needs two", () => {
    expect(smsSegments("a".repeat(160))).toBe(1);
    expect(smsSegments("a".repeat(161))).toBe(2);
  });
  it("spots invented offers", () => {
    expect(mentionsOffer("Get 20% off this week")).toBe(true);
    expect(mentionsOffer("Use code BEE10")).toBe(true);
    expect(mentionsOffer("New earrings are here")).toBe(false);
  });
});
