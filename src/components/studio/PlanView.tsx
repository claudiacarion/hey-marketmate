import { Target, Users, Compass, MessageCircle, Megaphone, Gift, PieChart, TrendingUp, Copy, CalendarDays, ShieldCheck, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { CampaignPlan } from "@/lib/campaign-types";
import { PosterStudio, type SavedPoster } from "@/components/studio/PosterStudio";

function Block({ icon: Icon, title, children }: { icon: typeof Target; title: string; children: React.ReactNode }) {
  return (
    <div className="panel p-6">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary"><Icon className="size-4" />{title}</div>
      <div className="text-sm leading-relaxed text-foreground">{children}</div>
    </div>
  );
}

export function PlanView({ plan, businessName, businessType, brand, campaignId, poster }: { plan: CampaignPlan; businessName: string; businessType: string; brand: { primary: string; accent: string }; campaignId?: string | null; poster?: SavedPoster | null }) {
  return (
    <section id="plan" className="mt-8 space-y-4">
      <div className="rounded-2xl bg-hero p-7 text-primary-foreground shadow-lift">
        <p className="text-xs uppercase tracking-widest opacity-80">Your campaign plan</p>
        <h2 className="mt-1 text-3xl font-semibold">{plan.title}</h2>
        <p className="mt-3 text-lg opacity-95">“{plan.coreMessage}”</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Block icon={Target} title="Objective">{plan.objective}</Block>
        <Block icon={Users} title="Target audience">{plan.targetAudience}</Block>
        <Block icon={Compass} title="Marketing approach">{plan.marketingApproach}</Block>
        <Block icon={MessageCircle} title="Core message">{plan.coreMessage}</Block>
        <Block icon={Megaphone} title="Recommended channels">
          <ul className="space-y-2">{plan.recommendedChannels.map((c, i) => <li key={i}><b>{c.channel}</b> — <span className="text-muted-foreground">{c.why}</span></li>)}</ul>
        </Block>
        <Block icon={Gift} title="Promotional idea">{plan.promotionalIdea}</Block>
        <Block icon={PieChart} title="Budget allocation">
          <ul className="space-y-3">{plan.budgetAllocation.map((b, i) => (
            <li key={i}>
              <div className="flex justify-between gap-2"><span>{b.item}</span><span className="font-semibold">{b.percent}%{b.amount ? ` · ${b.amount}` : ""}</span></div>
              <div className="mt-1 h-1.5 rounded-full bg-secondary"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, Math.max(0, b.percent))}%` }} /></div>
            </li>
          ))}</ul>
        </Block>
        <Block icon={TrendingUp} title="Success metrics">
          <ul className="space-y-2">{plan.successMetrics.map((m, i) => <li key={i} className="flex justify-between gap-3"><span>{m.metric}</span><span className="text-right font-semibold">{m.target}</span></li>)}</ul>
        </Block>
      </div>
      {plan.qualityReview && <Review r={plan.qualityReview} />}
      {!!plan.socialPosts?.length && <>
        <h3 className="pt-4 text-2xl font-semibold">Social media posts</h3>
        <div className="grid gap-4 md:grid-cols-3">{plan.socialPosts.map((p, i) => <PostCard key={i} p={p} />)}</div>
      </>}
      {!!plan.calendar?.length && <>
        <h3 className="flex items-center gap-2 pt-4 text-2xl font-semibold"><CalendarDays className="size-5 text-primary" />7-day schedule</h3>
        <div className="panel divide-y">{plan.calendar.map((d, i) => (
          <div key={i} className="grid gap-2 p-4 text-sm sm:grid-cols-[110px_1fr_auto]">
            <div className="font-semibold text-primary">{d.day}</div>
            <div><b>{d.theme}</b><p className="text-muted-foreground">{d.action}</p></div>
            <div className="text-right text-xs text-muted-foreground"><span className="rounded-full bg-secondary px-2 py-1 font-medium text-foreground">{d.channel}</span><div className="mt-1">{d.timing}</div></div>
          </div>
        ))}</div>
      </>}
      {plan.promotionalMaterial && <>
        <h3 className="pt-4 text-2xl font-semibold">Promotional poster</h3>
        <PosterStudio promo={plan.promotionalMaterial} businessName={businessName} businessType={businessType} brand={brand} campaignId={campaignId} initial={poster} />
        <Block icon={ImageIcon} title="Designer's notes">{plan.promotionalMaterial.designConcept}</Block>
      </>}
    </section>
  );
}

function Review({ r }: { r: NonNullable<CampaignPlan["qualityReview"]> }) {
  return (
    <div className="panel flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
      <div className="flex shrink-0 items-center gap-3"><ShieldCheck className="size-8 text-primary" /><div><div className="text-xs uppercase tracking-wide text-muted-foreground">Quality review</div><div className="text-2xl font-semibold">{Math.round(r.clarityScore)}/100</div></div></div>
      <div className="grid flex-1 gap-3 text-sm sm:grid-cols-3">
        <div><b>Brand voice</b><p className="text-muted-foreground">{r.brandVoiceCheck}</p></div>
        <div><b>Audience fit</b><p className="text-muted-foreground">{r.audienceFit}</p></div>
        <div><b>Reviewer notes</b><p className="text-muted-foreground">{r.reviewerNotes}</p></div>
      </div>
    </div>
  );
}

function PostCard({ p }: { p: NonNullable<CampaignPlan["socialPosts"]>[number] }) {
  const tags = (p.hashtags ?? []).map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ");
  const copy = async () => {
    try { await navigator.clipboard.writeText([p.headline, p.caption, p.callToAction, tags].filter(Boolean).join("\n\n")); toast.success("Post copied"); }
    catch { toast.error("Couldn't copy — please select the text manually."); }
  };
  return (
    <div className="panel flex flex-col p-5 text-sm">
      <div className="mb-3 flex items-center justify-between"><span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{p.platform}</span><Button size="sm" variant="ghost" onClick={copy}><Copy className="size-4" />Copy</Button></div>
      <h4 className="text-lg font-semibold leading-snug">{p.headline}</h4>
      <p className="mt-2 whitespace-pre-line leading-relaxed">{p.caption}</p>
      <p className="mt-3 font-semibold text-primary">→ {p.callToAction}</p>
      {tags && <p className="mt-2 text-xs text-accent">{tags}</p>}
      <div className="mt-auto pt-4"><div className="rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground"><b className="text-foreground">Visual idea:</b> {p.visualConcept}</div></div>
    </div>
  );
}
