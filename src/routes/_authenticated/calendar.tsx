import { taskDatesFor } from "@/lib/task-dates";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import type { CampaignPlan } from "@/lib/campaign-types";
import { doneKeys, progress, taskKey, type TaskFilter } from "@/lib/task-progress";
import { assignCampaignColours, campaignDot, campaignStyle } from "@/lib/campaign-colours";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACTIVITY_LABEL, activityType, dayNumberOf, isQuickActivity, purposeLabel } from "@/lib/schedule";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — MarketMate" },
      { name: "description", content: "See every scheduled post and email on your marketing calendar." },
      { property: "og:title", content: "Calendar — MarketMate" },
      { property: "og:description", content: "See every scheduled post and email on your marketing calendar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CalendarPage,
});

type Ev = { key: string; campaignId: string; campaign: string; text: string; channel: string; timing: string; done: boolean; quick: boolean; kind: string; purpose: string };
const FILTERS: { id: TaskFilter; label: string }[] = [{ id: "all", label: "All" }, { id: "todo", label: "To do" }, { id: "done", label: "Completed" }];
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function CalendarPage() {
  const today = new Date();
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [status, setStatus] = useState<TaskFilter>("all");
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const { data, isLoading, error } = useQuery({
    queryKey: ["campaigns", "calendar"],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaigns").select("id,title,plan,brief,created_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: finished = new Set<string>() } = useQuery({
    queryKey: ["campaign-tasks", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaign_tasks").select("campaign_id,task_index").eq("completed", true);
      if (error) throw error;
      return doneKeys(data);
    },
  });

  const slots = useMemo(() => assignCampaignColours(data ?? []), [data]);
  const sorted = useMemo(() => [...(data ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at)), [data]);
  const { byDay, stats } = useMemo(() => {
    const byDay: Record<string, Ev[]> = {};
    let total = 0; const doneSet = new Set<number>();
    (data ?? []).forEach((c) => {
      if (campaignFilter !== "all" && c.id !== campaignFilter) return;
      const plan = (c.plan ?? {}) as CampaignPlan;
      const dates = taskDatesFor(c.brief, plan.calendar, c.created_at);
      (plan.calendar ?? []).forEach((item, i) => {
        const isDone = finished.has(taskKey(c.id, i));
        if (isDone) doneSet.add(total);
        total++;
        if ((status === "done" && !isDone) || (status === "todo" && isDone)) return;
        const d = dates[i]!;
        (byDay[dayKey(d)] ??= []).push({
          key: `${c.id}-${i}`, campaignId: c.id, campaign: c.title,
          text: item.theme || item.action, channel: item.channel, timing: item.timing,
          done: isDone,
          quick: isQuickActivity(item.type), kind: ACTIVITY_LABEL[activityType(item.type)], purpose: purposeLabel(item.purpose),
        });
      });
    });
    return { byDay, stats: progress(total, doneSet) };
  }, [data, finished, campaignFilter, status]);
  const selected = sorted.find((c) => c.id === campaignFilter);

  const offset = (month.getDay() + 6) % 7;
  const cells = Array.from({ length: 42 }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i - offset + 1));
  const label = month.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader eyebrow="Calendar" title={label} description="Every campaign's tasks, placed from its start date."
        action={<div className="flex gap-2">
          <Button variant="outline" size="icon" aria-label="Previous month" onClick={() => shift(-1)}><ChevronLeft className="size-4" /></Button>
          <Button variant="outline" onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))}>Today</Button>
          <Button variant="outline" size="icon" aria-label="Next month" onClick={() => shift(1)}><ChevronRight className="size-4" /></Button>
        </div>} />
      {isLoading ? <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      : error ? <p className="panel p-6 text-sm text-destructive">Couldn't load your calendar. Please refresh.</p>
      : <>
        {!data?.length && <p className="panel mb-4 p-4 text-sm text-muted-foreground">No campaigns yet. <Link to="/studio" className="font-medium text-primary underline">Create one in Content Studio</Link> and its tasks will appear here.</p>}
        {!!data?.length && <div className="panel mb-4 space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Select value={campaignFilter} onValueChange={setCampaignFilter}>
              <SelectTrigger className="sm:w-72" aria-label="Campaign"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All campaigns</SelectItem>
                {sorted.map((c) => <SelectItem key={c.id} value={c.id}><span className="flex items-center gap-2"><span className="size-2.5 shrink-0 rounded-full" style={campaignDot(slots[c.id] ?? 0)} />{c.title}</span></SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex gap-1 rounded-xl bg-secondary p-1 sm:w-fit" role="tablist" aria-label="Task status">
              {FILTERS.map((f) => (
                <button key={f.id} role="tab" aria-selected={status === f.id} onClick={() => setStatus(f.id)}
                  className={`flex-1 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors sm:flex-none ${status === f.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{f.label}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <p className="font-semibold" aria-live="polite">{selected ? selected.title : "All campaigns"}: {stats.completed} of {stats.total} tasks completed</p>
              <span className="font-semibold text-accent">{stats.percent}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={stats.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Progress">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${stats.percent}%`, backgroundColor: selected ? campaignDot(slots[selected.id] ?? 0).backgroundColor : "var(--accent)" }} />
            </div>
          </div>
          {!selected && <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs" aria-label="Campaign colours">
            {sorted.map((c) => <li key={c.id}><button onClick={() => setCampaignFilter(c.id)} className="flex items-center gap-1.5 hover:underline"><span className="size-3 rounded-full" style={campaignDot(slots[c.id] ?? 0)} />{c.title}</button></li>)}
          </ul>}
        </div>}
        <div className="panel overflow-x-auto">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-7 border-b bg-secondary text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="px-3 py-2.5">{d}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((d) => {
                const inMonth = d.getMonth() === month.getMonth();
                const isToday = dayKey(d) === dayKey(today);
                return (
                  <div key={dayKey(d)} className={`min-h-28 border-b border-r p-2 ${inMonth ? "" : "bg-muted/40"}`}>
                    <div className={`mb-1 inline-grid size-6 place-items-center rounded-full text-xs ${isToday ? "bg-accent font-bold text-accent-foreground" : "text-muted-foreground"}`}>{d.getDate()}</div>
                    {byDay[dayKey(d)]?.map((e) => (
                      <Link key={e.key} to="/campaigns/$id" params={{ id: e.campaignId }}
                        title={`${e.campaign} · ${e.kind}${e.purpose ? ` · ${e.purpose}` : ""} · ${e.channel}${e.timing ? ` · ${e.timing}` : ""}${e.done ? " · completed" : ""}\n${e.text}`}
                        style={e.done ? undefined : campaignStyle(slots[e.campaignId] ?? 0)}
                        className={`mb-1 block truncate rounded-md px-2 py-1 text-xs font-medium hover:opacity-80 ${e.done ? "bg-muted text-muted-foreground line-through decoration-muted-foreground/70" : e.quick ? "border border-dashed border-current/40" : ""}`}>
                        <span className="mr-1 inline-block size-2 rounded-full align-middle" style={campaignDot(slots[e.campaignId] ?? 0)} />
                        {e.channel ? `${e.channel}: ` : ""}{e.text}
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </>}
    </div>
  );
}
