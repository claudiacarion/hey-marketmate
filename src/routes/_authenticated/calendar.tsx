import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import type { CampaignPlan } from "@/lib/campaign-types";

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

type Ev = { key: string; campaignId: string; campaign: string; text: string; channel: string; timing: string };
const TONES = ["bg-accent/15 text-accent", "bg-primary/10 text-primary", "bg-highlight/40 text-highlight-foreground"];
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function CalendarPage() {
  const today = new Date();
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const { data, isLoading, error } = useQuery({
    queryKey: ["campaigns", "calendar"],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaigns").select("id,title,plan,brief,created_at");
      if (error) throw error;
      return data;
    },
  });

  const { byDay, toneOf } = useMemo(() => {
    const byDay: Record<string, Ev[]> = {};
    const toneOf: Record<string, string> = {};
    (data ?? []).forEach((c, ci) => {
      toneOf[c.id] = TONES[ci % TONES.length] ?? "";
      const plan = (c.plan ?? {}) as CampaignPlan;
      const sd = (c.brief as { startDate?: string } | null)?.startDate;
      const m = sd && /^(\d{4})-(\d{2})-(\d{2})$/.exec(sd);
      const start = m ? new Date(+m[1]!, +m[2]! - 1, +m[3]!) : new Date(c.created_at);
      (plan.calendar ?? []).forEach((item, i) => {
        const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + ((Number(/\d+/.exec(item.day ?? "")?.[0]) || i + 1) - 1));
        (byDay[dayKey(d)] ??= []).push({
          key: `${c.id}-${i}`, campaignId: c.id, campaign: c.title,
          text: item.theme || item.action, channel: item.channel, timing: item.timing,
        });
      });
    });
    return { byDay, toneOf };
  }, [data]);

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
                        title={`${e.campaign} · ${e.channel}${e.timing ? ` · ${e.timing}` : ""}\n${e.text}`}
                        className={`mb-1 block truncate rounded-md px-2 py-1 text-xs font-medium hover:opacity-80 ${toneOf[e.campaignId]}`}>
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
