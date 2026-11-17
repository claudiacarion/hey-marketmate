import { taskDatesFor } from "@/lib/task-dates";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Sparkles, Megaphone, Lightbulb } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/app/AppShell";
import type { CampaignPlan } from "@/lib/campaign-types";
import { loadProfile } from "@/lib/business-profile";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Image as ImageIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard — MarketMate" },
      { name: "description", content: "See your campaigns, reach and AI suggestions at a glance." },
      { property: "og:title", content: "Dashboard — MarketMate" },
      { property: "og:description", content: "See your campaigns, reach and AI suggestions at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const DAY = 86_400_000;
const sod = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
type Row = { id: string; title: string; status: string; brief: unknown; plan: unknown; poster: unknown; created_at: string };
function taskDates(c: Row) {
  const cal = ((c.plan ?? {}) as CampaignPlan).calendar ?? [];
  const dates = taskDatesFor(c.brief, cal, c.created_at);
  return cal.map((it, i) => ({ ...it, date: dates[i]! }));
}

function Dashboard() {
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns", "dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaigns").select("id,title,status,brief,plan,poster,created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const [name, setName] = useState("");
  useEffect(() => setName(loadProfile().name), []);
  const m = useMemo(() => {
    const rows = (campaigns ?? []) as Row[];
    const today = sod(new Date());
    const days = Array.from({ length: 7 }, (_, i) => new Date(today.getTime() + i * DAY));
    const tasks = rows.filter((c) => c.status !== "Completed").flatMap((c) => taskDates(c).map((t) => ({ ...t, campaign: c })));
    const week = days.map((d) => ({ day: d.toLocaleDateString(undefined, { weekday: "short" }), tasks: tasks.filter((t) => sod(t.date).getTime() === d.getTime()).length }));
    const todays = tasks.filter((t) => sod(t.date).getTime() === today.getTime());
    const ideas: string[] = [];
    todays.slice(0, 2).forEach((t) => ideas.push(`Today for “${t.campaign.title}”: ${t.action}`));
    const drafts = rows.filter((c) => c.status === "Draft");
    if (drafts[0]) ideas.push(`“${drafts[0].title}” is still a draft — schedule it when you're ready.`);
    const noPoster = rows.find((c) => !c.poster);
    if (noPoster) ideas.push(`Create a poster for “${noPoster.title}” to use on social or in your shop.`);
    if (!rows.length) ideas.push("Plan your first campaign in Content Studio to get tasks and ideas here.");
    return {
      week, todays: todays.length, ideas: ideas.slice(0, 3),
      stats: [
        { label: "Campaigns", value: String(rows.length), delta: `${drafts.length} draft${drafts.length === 1 ? "" : "s"}`, icon: Megaphone },
        { label: "Active campaigns", value: String(rows.filter((c) => c.status === "Live" || c.status === "Scheduled").length), delta: "Live or scheduled", icon: Sparkles },
        { label: "Tasks next 7 days", value: String(week.reduce((n, d) => n + d.tasks, 0)), delta: `${todays.length} today`, icon: CalendarDays },
        { label: "Posters made", value: String(rows.filter((c) => c.poster).length), delta: `of ${rows.length} campaigns`, icon: ImageIcon },
      ],
    };
  }, [campaigns]);
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-hero p-8 text-hero-foreground shadow-lift rise md:p-10">
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-warm opacity-40 blur-3xl" />
        <p className="relative mb-3 text-sm font-medium text-hero-muted">Hello{name ? `, ${name}` : ""} 👋</p>
        <h1 className="relative max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">{isLoading ? "Loading your plan…" : m.todays ? `You have ${m.todays} marketing task${m.todays === 1 ? "" : "s"} today.` : "Nothing scheduled today. Plan your next campaign."}</h1>
        <div className="relative mt-7 flex flex-wrap gap-3">
          <Button asChild size="lg" className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/studio"><Sparkles className="size-4" /> Plan a campaign</Link></Button>
          <Button asChild size="lg" variant="ghost" className="rounded-xl text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground"><Link to="/calendar">Open calendar <ArrowUpRight className="size-4" /></Link></Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {m.stats.map(({ label, value, delta, icon: Icon }, i) => (
          <div key={label} className="panel p-5 rise" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center justify-between text-sm text-muted-foreground">{label}<Icon className="size-4" /></div>
            <div className="mt-3 font-display text-3xl font-semibold">{isLoading ? "…" : value}</div>
            <div className="mt-1 text-xs font-semibold text-muted-foreground">{isLoading ? "…" : delta}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="panel p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Tasks over the next 7 days</h2>
            <span className="text-xs text-muted-foreground">From your campaign schedules</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={m.week}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" interval={0} axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="tasks" name="Tasks" stroke="var(--chart-2)" strokeWidth={2.5} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel p-6">
          <h2 className="mb-1 flex items-center gap-2 text-xl font-semibold"><Lightbulb className="size-5 text-accent" /> Ideas for you</h2>
          <p className="mb-4 text-xs text-muted-foreground">Based on your campaigns</p>
          <ul className="space-y-3">
            {m.ideas.map((t) => (
              <li key={t} className="rounded-xl bg-secondary p-3.5 text-sm leading-relaxed">{t}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="panel p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent campaigns</h2>
          <Link to="/campaigns" className="text-sm font-medium text-primary hover:underline">See all</Link>
        </div>
        <div className="divide-y">
          {isLoading ? <p className="py-3.5 text-sm text-muted-foreground">Loading…</p>
          : !campaigns?.length ? <p className="py-3.5 text-sm text-muted-foreground">No campaigns yet. <Link to="/studio" className="font-medium text-primary underline">Plan your first one</Link>.</p>
          : campaigns.slice(0, 4).map((c) => {
            const b = (c.brief ?? {}) as { channels?: string[] };
            return (
              <Link key={c.id} to="/campaigns/$id" params={{ id: c.id }} className="flex flex-wrap items-center gap-4 py-3.5 hover:opacity-80">
                <div className="min-w-48 flex-1"><div className="font-medium">{c.title}</div><div className="text-xs text-muted-foreground">{(b.channels ?? []).join(" · ")}</div></div>
                <StatusPill status={c.status} />
                <div className="w-28 text-right text-sm text-muted-foreground">{new Date(c.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
