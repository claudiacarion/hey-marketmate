import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/AppShell";

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

const events: Record<number, { t: string; tone: string }[]> = {
  3: [{ t: "IG: Brunch reel", tone: "bg-accent/15 text-accent" }],
  7: [{ t: "Email: Weekend menu", tone: "bg-primary/10 text-primary" }],
  12: [{ t: "FB: Family offer", tone: "bg-highlight/40 text-highlight-foreground" }],
  14: [{ t: "IG: Customer story", tone: "bg-accent/15 text-accent" }],
  20: [{ t: "SMS: Loyalty reminder", tone: "bg-primary/10 text-primary" }],
  27: [{ t: "Black Friday launch", tone: "bg-highlight/40 text-highlight-foreground" }],
  29: [{ t: "Email: Last chance", tone: "bg-primary/10 text-primary" }],
};

function CalendarPage() {
  const offset = 6; // Nov 2026 starts on a Sunday (Mon-first grid)
  const cells = Array.from({ length: 42 }, (_, i) => i - offset + 1);
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader eyebrow="Calendar" title="November 2026" description="Your posting schedule across every channel." />
      <div className="panel overflow-hidden">
        <div className="grid grid-cols-7 border-b bg-secondary text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="px-3 py-2.5">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => (
            <div key={i} className={`min-h-28 border-b border-r p-2 ${d < 1 || d > 30 ? "bg-muted/40" : ""}`}>
              {d >= 1 && d <= 30 && <>
                <div className={`mb-1 inline-grid size-6 place-items-center rounded-full text-xs ${d === 12 ? "bg-accent font-bold text-accent-foreground" : "text-muted-foreground"}`}>{d}</div>
                {events[d]?.map((e) => <div key={e.t} className={`mb-1 truncate rounded-md px-2 py-1 text-xs font-medium ${e.tone}`}>{e.t}</div>)}
              </>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
