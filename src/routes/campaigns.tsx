import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader, StatusPill } from "@/components/app/AppShell";
import { campaigns } from "@/lib/sample-data";

export const Route = createFileRoute("/campaigns")({
  head: () => ({
    meta: [
      { title: "Campaigns — MarketMate" },
      { name: "description", content: "Manage every marketing campaign for your business in one place." },
      { property: "og:title", content: "Campaigns — MarketMate" },
      { property: "og:description", content: "Manage every marketing campaign for your business in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Campaigns,
});

function Campaigns() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader eyebrow="Campaigns" title="Everything you're running" description="Track progress across channels and pick up drafts where you left off."
        action={<Button asChild className="rounded-xl"><Link to="/studio"><Plus className="size-4" /> New campaign</Link></Button>} />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {campaigns.map((c, i) => (
          <article key={c.id} className="panel flex flex-col p-6 transition-transform hover:-translate-y-0.5 rise" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold">{c.name}</h3>
              <StatusPill status={c.status} />
            </div>
            <p className="text-sm text-muted-foreground">{c.channel}</p>
            <div className="mt-6">
              <div className="mb-2 flex justify-between text-xs text-muted-foreground"><span>Progress</span><span>{c.progress}%</span></div>
              <Progress value={c.progress} />
            </div>
            <div className="mt-5 flex justify-between border-t pt-4 text-sm">
              <span className="text-muted-foreground">Reach <b className="text-foreground">{c.reach ? c.reach.toLocaleString() : "—"}</b></span>
              <span className="text-muted-foreground">Ends {c.ends}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
