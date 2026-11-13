import type { CampaignPlan } from "@/lib/campaign-types";
import { dayNumberOf } from "@/lib/schedule";

/** Brief fields that pin a campaign's schedule to real calendar dates (local "YYYY-MM-DD"). */
export type DatedBrief = { startDate?: string; taskDates?: (string | null)[] } & Record<string, unknown>;

export function parseLocalDate(s?: string | null): Date | null {
  const m = s ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(s) : null;
  return m ? new Date(+m[1]!, +m[2]! - 1, +m[3]!) : null;
}
export function toLocalISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}
/** Whole calendar days from a to b, immune to daylight-saving shifts. */
export function daysBetween(a: Date, b: Date): number {
  return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86_400_000);
}

export function campaignStart(brief: unknown, createdAt: string): Date {
  const s = parseLocalDate((brief as DatedBrief | null)?.startDate);
  if (s) return s;
  const c = new Date(createdAt);
  return new Date(c.getFullYear(), c.getMonth(), c.getDate());
}

/** Date of every task: a saved per-task date wins, otherwise start date + (Day N - 1). */
export function taskDatesFor(brief: unknown, calendar: CampaignPlan["calendar"], createdAt: string): Date[] {
  const start = campaignStart(brief, createdAt);
  const saved = (brief as DatedBrief | null)?.taskDates ?? [];
  return (calendar ?? []).map((it, i) => parseLocalDate(saved[i]) ?? addDays(start, dayNumberOf(it.day, i) - 1));
}

/** New brief after moving the start date: pending tasks shift by the same number of days, completed ones keep their dates. */
export function rescheduleBrief(brief: unknown, calendar: CampaignPlan["calendar"], createdAt: string, newStart: string, done: Set<number>): DatedBrief {
  const b = { ...((brief ?? {}) as DatedBrief) };
  const target = parseLocalDate(newStart);
  if (!target) throw new Error("Invalid date");
  const delta = daysBetween(campaignStart(b, createdAt), target);
  const current = taskDatesFor(b, calendar, createdAt);
  return { ...b, startDate: newStart, taskDates: current.map((d, i) => toLocalISO(done.has(i) ? d : addDays(d, delta))) };
}
