export type TaskFilter = "all" | "todo" | "done";
export function progress(total: number, done: Set<number>) {
  const completed = [...done].filter((i) => i >= 0 && i < total).length;
  return { completed, total, percent: total ? Math.round((completed / total) * 100) : 0 };
}
export function filterTasks(total: number, done: Set<number>, f: TaskFilter) {
  return Array.from({ length: total }, (_, i) => i).filter((i) => f === "all" || (f === "done" ? done.has(i) : !done.has(i)));
}
export function taskKey(campaignId: string, index: number) {
  return `${campaignId}:${index}`;
}
export function doneKeys(rows: { campaign_id: string; task_index: number }[]) {
  return new Set(rows.map((r) => taskKey(r.campaign_id, r.task_index)));
}
/** Map of "campaignId:index" -> completed_at for completed tasks. */
export function doneDates(rows: { campaign_id: string; task_index: number; completed_at: string | null }[]) {
  return new Map(rows.map((r) => [taskKey(r.campaign_id, r.task_index), r.completed_at]));
}
/** Calendar day a task appears on: completed tasks on their local completion day, pending ones on their scheduled day. */
export function calendarDay(scheduled: Date, completedAt?: string | null): Date {
  if (!completedAt) return scheduled;
  const c = new Date(completedAt);
  return isNaN(+c) ? scheduled : new Date(c.getFullYear(), c.getMonth(), c.getDate());
}
