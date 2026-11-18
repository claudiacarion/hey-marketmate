import type { CampaignPlan } from "@/lib/campaign-types";
import { dayNumberOf } from "@/lib/schedule";
import { campaignStart, daysBetween, taskDatesFor, toLocalISO } from "@/lib/task-dates";

export type CampaignRow = { id: string; title: string; status: string; created_at: string; poster: unknown; plan: CampaignPlan | null; brief?: unknown };
export type AppNotification = { id: string; kind: "post" | "draft" | "poster" | "ready" | "launch"; title: string; body: string; campaignId: string; at: string };

const DAY = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Builds reminders from the user's saved campaigns. Day N of a schedule falls N-1 days after the campaign start date (or creation date). */
export function buildNotifications(rows: CampaignRow[], now = new Date()): AppNotification[] {
  const today = startOfDay(now);
  const out: AppNotification[] = [];
  for (const c of rows) {
    const created = new Date(c.created_at);
    const offset = Math.round((today - startOfDay(created)) / DAY);
    if (c.status !== "Completed") {
      const dates = taskDatesFor(c.brief, c.plan?.calendar, c.created_at);
      (c.plan?.calendar ?? []).forEach((item, i) => {
        const n = dayNumberOf(item.day, i) - 1;
        if (dates[i]!.getTime() === today) out.push({ id: `post:${c.id}:${n}`, kind: "post", title: `Today: ${item.theme}`, body: `${item.channel} · ${item.timing} — ${item.action}`, campaignId: c.id, at: new Date(today).toISOString() });
      });
    }
    if (offset === 0) out.push({ id: `ready:${c.id}`, kind: "ready", title: "Campaign plan ready", body: c.title, campaignId: c.id, at: c.created_at });
    if (c.status === "Draft") {
      const start = campaignStart(c.brief, c.created_at);
      const untilStart = daysBetween(new Date(today), start);
      if (untilStart === 0 || untilStart === 1) {
        out.push({
          id: `launch:${c.id}:${toLocalISO(start)}`,
          kind: "launch",
          title: untilStart === 0 ? "Start date reached" : "Starting tomorrow",
          body: `Review and launch “${c.title}”`,
          campaignId: c.id,
          at: start.toISOString(),
        });
      }
      if (offset >= 2) out.push({ id: `draft:${c.id}`, kind: "draft", title: "Still a draft", body: `“${c.title}” hasn't been scheduled yet.`, campaignId: c.id, at: new Date(created.getTime() + 2 * DAY).toISOString() });
    }
    if (!c.poster && offset <= 7) out.push({ id: `poster:${c.id}`, kind: "poster", title: "Add a poster", body: `Create a photo poster for “${c.title}”.`, campaignId: c.id, at: c.created_at });
  }
  return out.sort((a, b) => b.at.localeCompare(a.at));
}
