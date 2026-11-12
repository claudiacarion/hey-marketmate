import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Sparkles, TrendingUp, Users, MousePointerClick, Megaphone, Lightbulb } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/app/AppShell";
import { campaigns, weekly } from "@/lib/sample-data";

export const Route = createFileRoute("/")({
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

const stats = [
  { label: "Weekly reach", value: "22.0k", delta: "+18%", icon: Users },
  { label: "Link clicks", value: "1,790", delta: "+9%", icon: MousePointerClick },
  { label: "Active campaigns", value: "3", delta: "2 scheduled", icon: Megaphone },
  { label: "Engagement rate", value: "6.4%", delta: "+1.2 pts", icon: TrendingUp },
];

const ideas = [
  "Post a behind-the-scenes reel of Saturday prep — weekends are your best-performing days.",
  "Send a 'we miss you' email to 140 customers who haven't visited in 60 days.",
  "Launch gift cards before Dec 1 — local searches for 'gift ideas' are rising.",
];

function Dashboard() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-hero p-8 text-primary-foreground shadow-lift rise md:p-10">
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-warm opacity-40 blur-3xl" />
        <p className="relative mb-3 text-sm font-medium opacity-80">Good morning, Lina 👋</p>
        <h1 className="relative max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">Your marketing is up 18% this week. Let's keep the momentum.</h1>
        <div className="relative mt-7 flex flex-wrap gap-3">
          <Button asChild size="lg" className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/studio"><Sparkles className="size-4" /> Plan a campaign</Link></Button>
          <Button asChild size="lg" variant="ghost" className="rounded-xl text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Link to="/insights">View insights <ArrowUpRight className="size-4" /></Link></Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, delta, icon: Icon }, i) => (
          <div key={label} className="panel p-5 rise" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center justify-between text-sm text-muted-foreground">{label}<Icon className="size-4" /></div>
            <div className="mt-3 font-display text-3xl font-semibold">{value}</div>
            <div className="mt-1 text-xs font-semibold text-success">{delta}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="panel p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Reach this week</h2>
            <span className="text-xs text-muted-foreground">Sample data</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="reach" stroke="var(--chart-2)" strokeWidth={2.5} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel p-6">
          <h2 className="mb-1 flex items-center gap-2 text-xl font-semibold"><Lightbulb className="size-5 text-accent" /> Ideas for you</h2>
          <p className="mb-4 text-xs text-muted-foreground">Suggested by your assistant</p>
          <ul className="space-y-3">
            {ideas.map((t) => (
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
          {campaigns.slice(0, 4).map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-4 py-3.5">
              <div className="min-w-48 flex-1"><div className="font-medium">{c.name}</div><div className="text-xs text-muted-foreground">{c.channel}</div></div>
              <StatusPill status={c.status} />
              <div className="w-28 text-right text-sm text-muted-foreground">Ends {c.ends}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
