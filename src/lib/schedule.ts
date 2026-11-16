import type { CampaignPlan } from "@/lib/campaign-types";

export type CalItem = NonNullable<CampaignPlan["calendar"]>[number];
export type ActivityType = "feed_post" | "reel" | "story" | "engagement" | "reminder" | "other";

export const ACTIVITY_LABEL: Record<ActivityType, string> = {
  feed_post: "Feed post",
  reel: "Reel / short video",
  story: "Story / quick update",
  engagement: "Engagement",
  reminder: "Promo reminder",
  other: "Activity",
};

const SYN: Record<string, ActivityType> = {
  feed_post: "feed_post", feed: "feed_post", post: "feed_post", feed_post_1: "feed_post",
  photo_post: "feed_post", carousel: "feed_post", pin: "feed_post", listing_update: "feed_post",
  article: "feed_post", blog_post: "feed_post", email: "feed_post", newsletter: "feed_post",
  reel: "reel", reels: "reel", video: "reel", short_video: "reel", short_form_video: "reel",
  tiktok_video: "reel", youtube_short: "reel",
  story: "story", stories: "story", quick_update: "story", story_update: "story",
  engagement: "engagement", engagement_activity: "engagement", community: "engagement",
  reply: "engagement", replies: "engagement", comment: "engagement", dm: "engagement",
  reminder: "reminder", promo: "reminder", promotion: "reminder", cta: "reminder",
  offer_reminder: "reminder", last_chance: "reminder",
};

const PURPOSE: Record<string, string> = {
  awareness: "Awareness", reach: "Awareness",
  engagement: "Engagement", community: "Engagement", interaction: "Engagement",
  trust: "Trust-building", trust_building: "Trust-building", credibility: "Trust-building",
  conversion: "Conversion", sale: "Conversion", sales: "Conversion", sell: "Conversion",
};

const key = (v: string) => v.toLowerCase().trim().replace(/[\s-]+/g, "_");

/** Maps whatever the AI called an activity onto one of the six kinds the UI knows. */
export function activityType(type?: string): ActivityType {
  return SYN[key(type ?? "")] ?? "other";
}

/** Human label for an activity's purpose; unknown purposes are shown as-is. */
export function purposeLabel(purpose?: string): string {
  const k = key(purpose ?? "");
  if (!k) return "";
  return PURPOSE[k] ?? k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

/** "Day 3" -> 3. Falls back to the entry's position when the label carries no number. */
export function dayNumberOf(day: string | undefined, index: number): number {
  const n = Number(/\d+/.exec(day ?? "")?.[0]);
  return Number.isFinite(n) && n > 0 ? n : index + 1;
}

/** Stories and engagement activities need no new artwork or copy — they are the light ones. */
export function isQuickActivity(type?: string): boolean {
  const t = activityType(type);
  return t === "story" || t === "engagement";
}

/** How many days the schedule actually spans, from its own "Day N" labels. */
export function spanDays(items: CalItem[]): number {
  return items.reduce((max, it, i) => Math.max(max, dayNumberOf(it.day, i)), 0);
}

/** Days where a main feed post lands right after another feed post. */
export function backToBackFeedDays(items: CalItem[]): number[] {
  const days = new Set<number>();
  items.forEach((it, i) => { if (activityType(it.type) === "feed_post") days.add(dayNumberOf(it.day, i)); });
  return [...days].sort((a, b) => a - b).filter((d) => days.has(d - 1));
}

export type Cadence = {
  total: number;
  daysUsed: number;
  span: number;
  feedPosts: number;
  byType: { type: ActivityType; label: string; n: number }[];
  backToBackFeed: number[];
};

/** Counts the kinds of activity in a schedule and how widely they are spread. */
export function cadenceSummary(items: CalItem[]): Cadence {
  const counts = new Map<ActivityType, number>();
  const days = new Set<number>();
  items.forEach((it, i) => {
    const t = activityType(it.type);
    counts.set(t, (counts.get(t) ?? 0) + 1);
    days.add(dayNumberOf(it.day, i));
  });
  const order: ActivityType[] = ["feed_post", "reel", "story", "engagement", "reminder", "other"];
  return {
    total: items.length,
    daysUsed: days.size,
    span: spanDays(items),
    feedPosts: counts.get("feed_post") ?? 0,
    byType: order.filter((t) => (counts.get(t) ?? 0) > 0).map((t) => ({ type: t, label: ACTIVITY_LABEL[t], n: counts.get(t) ?? 0 })),
    backToBackFeed: backToBackFeedDays(items),
  };
}

// Main feed posts a single platform should carry, and the workload ceiling across all platforms.
const FEED_CAP: Record<number, number> = { 7: 4, 14: 8, 28: 14 };
const TOTAL_FEED_CAP: Record<number, number> = { 7: 6, 14: 12, 28: 20 };

/**
 * Scheduling rules a small-business owner can actually keep up with.
 * Returns a message per rule the plan breaks; empty means the pacing is fine.
 */
export function scheduleIssues(items: CalItem[], durationDays: number): string[] {
  if (durationDays === 1) {
    const feed = items.filter((it) => activityType(it.type) === "feed_post").length;
    return feed > 3 ? [`${feed} main feed posts in one day — keep a one-day campaign to 1-2 posts per channel.`] : [];
  }
  const D = [7, 14, 28].includes(durationDays) ? durationDays : 7;
  const cap = FEED_CAP[D] ?? 4;
  const totalCap = TOTAL_FEED_CAP[D] ?? 6;
  const feed = items.filter((it) => activityType(it.type) === "feed_post");
  const issues: string[] = [];

  const perChannel = new Map<string, number>();
  feed.forEach((it) => {
    const ch = (it.channel || "the main platform").toLowerCase().trim();
    perChannel.set(ch, (perChannel.get(ch) ?? 0) + 1);
  });
  for (const [ch, n] of perChannel) {
    if (n > cap + 1) issues.push(`${n} main feed posts on ${ch} — aim for about ${cap} across ${D} days, spaced out.`);
  }
  if (feed.length > totalCap + 1) {
    issues.push(`${feed.length} main feed posts in total — more than one person can realistically produce for a ${D}-day campaign.`);
  }
  const back = backToBackFeedDays(items);
  if (back.length >= 2) {
    issues.push(`Main feed posts on back-to-back days (${back.map((d) => `Day ${d}`).join(", ")}) — keep them at least 2 days apart unless there is a clear reason.`);
  }
  if (items.length >= D && feed.length >= D - 1) {
    issues.push(`Almost every one of the ${D} days carries a feed post — leave days with no work at all.`);
  }
  return issues;
}
