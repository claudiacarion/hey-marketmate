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
