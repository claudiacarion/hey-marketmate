import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CalendarDays, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { CampaignPlan } from "@/lib/campaign-types";
import { ACTIVITY_LABEL, activityType, purposeLabel } from "@/lib/schedule";
import { CadenceNote } from "@/components/campaign/CadenceNote";
import { filterTasks, progress, type TaskFilter } from "@/lib/task-progress";

type Item = NonNullable<CampaignPlan["calendar"]>[number];
const FILTERS: { id: TaskFilter; label: string }[] = [{ id: "all", label: "All" }, { id: "todo", label: "To do" }, { id: "done", label: "Completed" }];

export function TaskTracker({ campaignId, items, plan, dates }: { campaignId: string; items: Item[]; plan: CampaignPlan; dates?: Date[] | undefined }) {
  const qc = useQueryClient();
  const key = ["campaign-tasks", campaignId];
  const [filter, setFilter] = useState<TaskFilter>("all");
  const { data: done = new Set<number>() } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from("campaign_tasks").select("task_index").eq("campaign_id", campaignId).eq("completed", true);
      if (error) throw error;
      return new Set(data.map((r) => r.task_index));
    },
  });
  const toggle = useMutation({
    mutationFn: async ({ index, completed }: { index: number; completed: boolean }) => {
      const { error } = await supabase.from("campaign_tasks").upsert(
        { campaign_id: campaignId, task_index: index, completed, completed_at: completed ? new Date().toISOString() : null },
        { onConflict: "campaign_id,task_index" });
      if (error) throw error;
    },
    onMutate: async ({ index, completed }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Set<number>>(key);
      const next = new Set(prev); if (completed) next.add(index); else next.delete(index);
      qc.setQueryData(key, next);
      return { prev };
    },
    onError: (_e, _v, ctx) => { qc.setQueryData(key, ctx?.prev); toast.error("Couldn't save that change. Please try again."); },
    onSettled: () => { qc.invalidateQueries({ queryKey: ["campaign-tasks"] }); },
    onSuccess: (_d, { completed }) => { if (completed) toast.success("Task completed — nice work!"); },
  });
  const p = progress(items.length, done);
  const shown = useMemo(() => filterTasks(items.length, done, filter), [items.length, done, filter]);

  return (
    <>
      <h3 className="flex items-center gap-2 pt-4 text-2xl font-semibold"><CalendarDays className="size-5 text-primary" />Posting schedule</h3>
      <CadenceNote plan={plan} items={items} />
      <div className="panel space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold" aria-live="polite">{p.completed} of {p.total} tasks completed</p>
          <span className="text-sm font-semibold text-accent">{p.percent}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={p.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Campaign progress">
          <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${p.percent}%` }} />
        </div>
        <div className="flex gap-1 rounded-xl bg-secondary p-1 sm:w-fit" role="tablist">
          {FILTERS.map((f) => (
            <button key={f.id} role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)}
              className={`flex-1 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors sm:flex-none ${filter === f.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{f.label}</button>
          ))}
        </div>
      </div>
      <div className="panel divide-y">
        {shown.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted-foreground">
            <PartyPopper className="size-6 text-accent" />
            {filter === "done" ? "Nothing completed yet — tick off your first task to see it here." : "All tasks done. Your campaign is complete!"}
          </div>
        ) : shown.map((i) => {
          const d = items[i]!; const isDone = done.has(i);
          return (
            <div key={i} className={`grid gap-3 p-4 text-sm transition-colors sm:grid-cols-[auto_110px_1fr_auto] ${isDone ? "bg-muted/40" : ""}`}>
              <button type="button" role="checkbox" aria-checked={isDone} aria-label={isDone ? `Mark "${d.theme}" as not done` : `Mark "${d.theme}" as completed`}
                onClick={() => toggle.mutate({ index: i, completed: !isDone })}
                className={`grid size-6 place-items-center rounded-md border-2 transition-colors ${isDone ? "border-success bg-success text-primary-foreground" : "border-input hover:border-primary"}`}>
                {isDone && <Check className="size-4" />}
              </button>
              <div className={`font-semibold ${isDone ? "text-muted-foreground" : "text-primary"}`}>{d.day}{dates?.[i] && <div className="text-xs font-normal text-muted-foreground">{dates[i]!.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</div>}</div>
              <div className={isDone ? "text-muted-foreground line-through decoration-muted-foreground/50" : ""}><b>{d.theme}</b><p className="text-muted-foreground">{d.action}</p></div>
              <div className="text-xs text-muted-foreground sm:text-right"><span className="rounded-full bg-secondary px-2 py-1 font-medium text-foreground">{d.channel}</span><div className="mt-1">{d.timing}</div><div className="mt-1 flex flex-wrap justify-end gap-1"><span className="rounded-full bg-primary/10 px-2 py-1 font-medium text-primary">{ACTIVITY_LABEL[activityType(d.type)]}</span>{purposeLabel(d.purpose) && <span className="rounded-full bg-secondary px-2 py-1">{purposeLabel(d.purpose)}</span>}</div>{(d.impact || d.effort) && <div className="mt-1">Impact {d.impact ?? "–"} · Effort {d.effort ?? "–"}</div>}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
