import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { PageHeader } from "@/components/app/AppShell";
import { weekly } from "@/lib/sample-data";

export const Route = createFileRoute("/_authenticated/insights")({
  head: () => ({
    meta: [
      { title: "Insights — MarketMate" },
      { name: "description", content: "Understand what's working in your marketing with simple reports." },
      { property: "og:title", content: "Insights — MarketMate" },
      { property: "og:description", content: "Understand what's working in your marketing with simple reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Insights,
});

const channels = [
  { name: "Instagram", share: 46 }, { name: "Email", share: 28 }, { name: "Google", share: 16 }, { name: "Facebook", share: 10 },
];

function Insights() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader eyebrow="Insights" title="What's working" description="Plain-language reports on your reach, clicks and best channels." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="panel p-6 lg:col-span-2">
          <h2 className="mb-4 text-xl font-semibold">Clicks by day</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <Tooltip cursor={{ fill: "var(--secondary)" }} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Bar dataKey="clicks" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel p-6">
          <h2 className="mb-5 text-xl font-semibold">Top channels</h2>
          <div className="space-y-4">
            {channels.map((c) => (
              <div key={c.name}>
                <div className="mb-1.5 flex justify-between text-sm"><span>{c.name}</span><span className="font-semibold">{c.share}%</span></div>
                <div className="h-2 rounded-full bg-secondary"><div className="h-2 rounded-full bg-warm" style={{ width: `${c.share}%` }} /></div>
              </div>
            ))}
          </div>
          <p className="mt-6 rounded-xl bg-secondary p-4 text-sm leading-relaxed">Saturdays bring 2× more clicks than Mondays. Schedule your best offers for the weekend.</p>
        </div>
      </div>
    </div>
  );
}
