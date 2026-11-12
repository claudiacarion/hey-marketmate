import type { CampaignPlan } from "@/lib/campaign-types";

export type CampaignRow = { id: string; title: string; status: string; created_at: string; poster: unknown; plan: CampaignPlan | null };
export type AppNotification = { id: string; kind: "post" | "draft" | "poster" | "ready"; title: string; body: string; campaignId: string; at: string };

const DAY = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Builds reminders from the user's saved campaigns. Day N of a 7-day schedule falls N-1 days after the campaign was created. */
export function buildNotifications(rows: CampaignRow[], now = new Date()): AppNotification[] {
  const today = startOfDay(now);
  const out: AppNotification[] = [];
  for (const c of rows) {
    const created = new Date(c.created_at);
    const offset = Math.round((today - startOfDay(created)) / DAY);
    if (c.status !== "Completed" && offset >= 0 && offset < 7) {
      const item = c.plan?.calendar?.[offset];
      if (item) out.push({ id: `post:${c.id}:${offset}`, kind: "post", title: `Today: ${item.theme}`, body: `${item.channel} · ${item.timing} — ${item.action}`, campaignId: c.id, at: new Date(today).toISOString() });
    }
    if (offset === 0) out.push({ id: `ready:${c.id}`, kind: "ready", title: "Campaign plan ready", body: c.title, campaignId: c.id, at: c.created_at });
    if (c.status === "Draft" && offset >= 2) out.push({ id: `draft:${c.id}`, kind: "draft", title: "Still a draft", body: `“${c.title}” hasn't been scheduled yet.`, campaignId: c.id, at: new Date(created.getTime() + 2 * DAY).toISOString() });
    if (!c.poster && offset <= 7) out.push({ id: `poster:${c.id}`, kind: "poster", title: "Add a poster", body: `Create a photo poster for “${c.title}”.`, campaignId: c.id, at: c.created_at });
  }
  return out.sort((a, b) => b.at.localeCompare(a.at));
}
