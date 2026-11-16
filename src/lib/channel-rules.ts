import type { CampaignPlan } from "@/lib/campaign-types";

/** The channels the Content Studio offers. Plans may only contain content for the ones the owner picked. */
export const CHANNEL_IDS = ["instagram", "facebook", "email", "sms", "google", "etsy", "pinterest"] as const;
export type ChannelId = (typeof CHANNEL_IDS)[number];
export const DURATIONS = [1, 7, 14, 28] as const;

const PATTERNS: [ChannelId, RegExp][] = [
  ["instagram", /insta|\big\b|reel/i],
  ["facebook", /facebook|\bfb\b|meta\b/i],
  ["pinterest", /pinterest|\bpins?\b/i],
  ["etsy", /etsy/i],
  ["sms", /\bsms\b|text message|texting|\btext\b/i],
  ["email", /e-?mail|newsletter|mailing/i],
  ["google", /google|\bgbp\b|business profile|maps/i],
];

/** "Instagram Stories" -> instagram, "Google Business Profile" -> google. Null when it names no known channel. */
export function canonChannel(name: unknown): ChannelId | null {
  const s = String(name ?? "");
  for (const [id, re] of PATTERNS) if (re.test(s)) return id;
  return null;
}

export function selectedIds(channels: unknown): ChannelId[] {
  const out = new Set<ChannelId>();
  (Array.isArray(channels) ? channels : []).forEach((c) => { const id = canonChannel(c); if (id) out.add(id); });
  return [...out];
}

/** Standard SMS segments: 160 characters fit in one, longer texts split into 153-character parts. */
export function smsSegments(text: string): number {
  const n = [...(text ?? "")].length;
  return n <= 160 ? 1 : Math.ceil(n / 153);
}

const dayNo = (day: unknown, i: number) => {
  const n = Number(/\d+/.exec(String(day ?? ""))?.[0]);
  return Number.isFinite(n) && n > 0 ? n : i + 1;
};

/**
 * Removes anything aimed at a channel the owner did not pick, and anything scheduled
 * outside the campaign's length. Returns what was dropped so it can be flagged.
 */
export function enforceBrief(plan: CampaignPlan, channels: unknown, durationDays: number): { plan: CampaignPlan; removed: string[] } {
  const sel = new Set(selectedIds(channels));
  const ok = (name: unknown) => { const id = canonChannel(name); return id !== null && sel.has(id); };
  const removed: string[] = [];
  const p: CampaignPlan = { ...plan };
  const keep = <T,>(list: T[] | undefined, get: (x: T) => unknown, what: string): T[] | undefined => {
    if (!list) return list;
    const kept = list.filter((x) => ok(get(x)));
    if (kept.length < list.length) removed.push(`${list.length - kept.length} ${what} for unselected channels`);
    return kept;
  };
  p.recommendedChannels = keep(p.recommendedChannels, (c) => c.channel, "channel recommendation(s)") ?? [];
  if (p.socialPosts) p.socialPosts = keep(p.socialPosts, (x) => x.platform, "social post(s)") ?? [];
  let cal = p.calendar ? keep(p.calendar, (x) => x.channel, "schedule item(s)") : undefined;
  if (cal) {
    const D = Math.max(1, durationDays || 7);
    const before = cal.length;
    cal = D === 1 ? cal.map((x) => ({ ...x, day: "Day 1" })) : cal.filter((x, i) => dayNo(x.day, i) <= D);
    if (cal.length < before) removed.push(`${before - cal.length} schedule item(s) outside the ${D}-day campaign`);
    p.calendar = cal;
  }
  const drop = (id: ChannelId, keys: (keyof CampaignPlan)[]) => {
    if (sel.has(id)) return;
    keys.forEach((k) => { if (p[k] !== undefined) { delete p[k]; removed.push(`${String(k)} (${id} not selected)`); } });
  };
  drop("email", ["emailMessages"]);
  drop("sms", ["smsMessages"]);
  drop("google", ["googlePosts"]);
  drop("pinterest", ["pinterestPins"]);
  drop("etsy", ["etsyListing", "productLaunch", "seasonalCampaigns", "productPhotography", "soloSellerTips"]);
  return { plan: p, removed };
}

/** Promo-code or discount words that should only appear when the owner gave such an offer. */
const OFFER_RE = /\b\d{1,2}\s?%|\bpercent off\b|\bpromo code\b|\bdiscount code\b|\buse code\b|\bcoupon\b|\bbogo\b|\bbuy one,? get one\b|\bfree shipping\b/i;
export function mentionsOffer(text: string): boolean { return OFFER_RE.test(text ?? ""); }
