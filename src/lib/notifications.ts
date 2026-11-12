import type { CampaignPlan } from "@/lib/campaign-types";
import { dayNumberOf } from "@/lib/schedule";

export type CampaignRow = { id: string; title: string; status: string; created_at: string; poster: unknown; plan: CampaignPlan | null; brief?: unknown };
export type AppNotification = { id: string; kind: "post" | "draft" | "poster" | "ready"; title: string; body: string; campaignId: string; at: string };

const DAY = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Builds reminders from the user's saved campaigns. Day N of a schedule falls N-1 days after the campaign start date (or creation date). */
export function buildNotifications(rows: CampaignRow[], now = new Date()): AppNotification[] {
  const today = startOfDay(now);
  const out: AppNotification[] = [];
  for (const c of rows) {
    const created = new Date(c.created_at);
    const offset = Math.round((today - startOfDay(created)) / DAY);
    const sd = (c.brief as { startDate?: string } | null | undefined)?.startDate;
    const m = sd ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(sd) : null;
    const startOff = m ? Math.round((today - new Date(+m[1]!, +m[2]! - 1, +m[3]!).getTime()) / DAY) : offset;
    if (c.status !== "Completed" && startOff >= 0) {
      (c.plan?.calendar ?? []).forEach((item, i) => {
        const n = (Number(/\d+/.exec(item.day ?? "")?.[0]) || i + 1) - 1;
        if (n === startOff) out.push({ id: `post:${c.id}:${n}`, kind: "post", title: `Today: ${item.theme}`, body: `${item.channel} · ${item.timing} — ${item.action}`, campaignId: c.id, at: new Date(today).toISOString() });
      });
    }
    if (offset === 0) out.push({ id: `ready:${c.id}`, kind: "ready", title: "Campaign plan ready", body: c.title, campaignId: c.id, at: c.created_at });
    if (c.status === "Draft" && offset >= 2) out.push({ id: `draft:${c.id}`, kind: "draft", title: "Still a draft", body: `“${c.title}” hasn't been scheduled yet.`, campaignId: c.id, at: new Date(created.getTime() + 2 * DAY).toISOString() });
    if (!c.poster && offset <= 7) out.push({ id: `poster:${c.id}`, kind: "poster", title: "Add a poster", body: `Create a photo poster for “${c.title}”.`, campaignId: c.id, at: c.created_at });
  }
  return out.sort((a, b) => b.at.localeCompare(a.at));
}
