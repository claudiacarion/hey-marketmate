import { CalendarClock, Clock } from "lucide-react";
import type { CampaignPlan } from "@/lib/campaign-types";
import { cadenceSummary, type CalItem } from "@/lib/schedule";

/** Explains the rhythm of a schedule: what kind of activity, how much, and why that pace. */
export function CadenceNote({ plan, items }: { plan: CampaignPlan; items: CalItem[] }) {
  const c = cadenceSummary(items);
  if (!c.total) return null;
  return (
    <div className="panel space-y-3 p-5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <CalendarClock className="size-4 shrink-0 text-primary" />
        <span className="font-semibold">{c.byType.map((b) => `${b.n} ${b.label.toLowerCase()}${b.n > 1 ? "s" : ""}`).join(" · ")}</span>
      </div>
      <p className="text-sm text-muted-foreground">
        {c.span <= 1 ? "Everything happens on the campaign day." : `Spread over ${c.daysUsed} of ${c.span} days — the other days carry no work.`}
      </p>
      {plan.timeCommitment && (
        <p className="flex items-start gap-2 text-sm"><Clock className="mt-0.5 size-4 shrink-0 text-accent" />{plan.timeCommitment}</p>
      )}
      {plan.cadenceRationale && <p className="text-sm text-muted-foreground">{plan.cadenceRationale}</p>}
      {c.backToBackFeed.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Feed posts also sit on back-to-back days ({c.backToBackFeed.map((d) => `Day ${d}`).join(", ")}) — easy to shift if the week gets busy.
        </p>
      )}
    </div>
  );
}
