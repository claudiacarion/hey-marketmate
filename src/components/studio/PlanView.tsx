import { Target, Users, Compass, MessageCircle, Megaphone, Gift, PieChart, TrendingUp, Copy, CalendarDays, ShieldCheck, Image as ImageIcon, Store, Camera, Pin, Sparkles, Rocket, Timer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TaskTracker } from "@/components/campaign/TaskTracker";
import { CampaignNotes } from "@/components/campaign/CampaignNotes";
import { CadenceNote } from "@/components/campaign/CadenceNote";
import { ACTIVITY_LABEL, activityType, purposeLabel } from "@/lib/schedule";
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

export function PlanView({ plan, businessName, businessType, brand, campaignId, poster }: { plan: CampaignPlan; businessName: string; businessType: string; brand: { primary: string; accent: string }; campaignId?: string | null | undefined; poster?: SavedPoster | null | undefined }) {
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
      {campaignId && <CampaignNotes campaignId={campaignId} />}
      {plan.qualityReview && <Review r={plan.qualityReview} />}
      {!!plan.socialPosts?.length && <>
        <h3 className="pt-4 text-2xl font-semibold">Social media posts</h3>
        <div className="grid gap-4 md:grid-cols-3">{plan.socialPosts.map((p, i) => <PostCard key={i} p={p} />)}</div>
      </>}
      {!!plan.calendar?.length && campaignId && <TaskTracker campaignId={campaignId} items={plan.calendar} plan={plan} />}
      {!!plan.calendar?.length && !campaignId && <>
        <h3 className="flex items-center gap-2 pt-4 text-2xl font-semibold"><CalendarDays className="size-5 text-primary" />Posting schedule</h3>
        <CadenceNote plan={plan} items={plan.calendar} />
        <div className="panel divide-y">{plan.calendar.map((d, i) => (
          <div key={i} className="grid gap-2 p-4 text-sm sm:grid-cols-[110px_1fr_auto]">
            <div className="font-semibold text-primary">{d.day}</div>
            <div><b>{d.theme}</b><p className="text-muted-foreground">{d.action}</p></div>
            <div className="text-right text-xs text-muted-foreground"><span className="rounded-full bg-secondary px-2 py-1 font-medium text-foreground">{d.channel}</span><div className="mt-1">{d.timing}</div><div className="mt-1 flex flex-wrap justify-end gap-1"><span className="rounded-full bg-primary/10 px-2 py-1 font-medium text-primary">{ACTIVITY_LABEL[activityType(d.type)]}</span>{purposeLabel(d.purpose) && <span className="rounded-full bg-secondary px-2 py-1">{purposeLabel(d.purpose)}</span>}</div>{(d.impact || d.effort) && <div className="mt-1">Impact {d.impact ?? "–"} · Effort {d.effort ?? "–"}</div>}</div>
          </div>
        ))}</div>
      </>}
      <EtsySections plan={plan} />
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

async function copyText(text: string, what: string) {
  try { await navigator.clipboard.writeText(text); toast.success(`${what} copied`); }
  catch { toast.error("Couldn't copy — please select the text manually."); }
}

function EtsySections({ plan }: { plan: CampaignPlan }) {
  const l = plan.etsyListing, solo = plan.soloSellerTips, launch = plan.productLaunch;
  if (!l && !solo && !plan.pinterestPins?.length && !plan.seasonalCampaigns?.length) return null;
  return <>
    {l && <>
      <h3 className="flex items-center gap-2 pt-4 text-2xl font-semibold"><Store className="size-5 text-primary" />Etsy listing optimiser</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <Block icon={Store} title="Listing titles">
          <ul className="space-y-2">{l.titles.map((t, i) => <li key={i} className="flex items-start justify-between gap-2"><span>{t} <span className="text-xs text-muted-foreground">({t.length}/140)</span></span><Button size="sm" variant="ghost" onClick={() => copyText(t, "Title")}><Copy className="size-4" /></Button></li>)}</ul>
        </Block>
        <Block icon={Sparkles} title={`Tags (${l.tags.length}/13)`}>
          <div className="flex flex-wrap gap-1.5">{l.tags.map((t, i) => <span key={i} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">{t}</span>)}</div>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => copyText(l.tags.join(", "), "Tags")}><Copy className="size-4" />Copy all tags</Button>
          {!!l.keywords?.length && <p className="mt-3 text-xs text-muted-foreground"><b className="text-foreground">Search phrases:</b> {l.keywords.join(" · ")}</p>}
        </Block>
        <Block icon={MessageCircle} title="Product description">
          <p className="whitespace-pre-line">{l.description}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => copyText(l.description, "Description")}><Copy className="size-4" />Copy</Button>
        </Block>
        <Block icon={Target} title="Selling points & clarity tips">
          <ul className="list-disc space-y-1 pl-4">{l.sellingPoints.map((x, i) => <li key={i}>{x}</li>)}</ul>
          <ul className="mt-3 list-disc space-y-1 pl-4 text-muted-foreground">{l.clarityTips.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </Block>
      </div>
    </>}
    {(!!plan.pinterestPins?.length || !!plan.productPhotography?.length) && <div className="grid gap-4 md:grid-cols-2">
      {!!plan.pinterestPins?.length && <Block icon={Pin} title="Pinterest pins">
        <ul className="space-y-3">{plan.pinterestPins.map((p, i) => <li key={i}><b>{p.title}</b><p className="text-muted-foreground">{p.description}</p><p className="text-xs text-muted-foreground">Visual: {p.visualConcept} · Board: {p.boardIdea}</p></li>)}</ul>
      </Block>}
      {!!plan.productPhotography?.length && <Block icon={Camera} title="Product photo ideas">
        <ul className="space-y-2">{plan.productPhotography.map((p, i) => <li key={i}><b>{p.shot}</b> — <span className="text-muted-foreground">{p.why}</span></li>)}</ul>
      </Block>}
    </div>}
    {(!!plan.seasonalCampaigns?.length || launch) && <div className="grid gap-4 md:grid-cols-2">
      {!!plan.seasonalCampaigns?.length && <Block icon={CalendarDays} title="Seasonal & gift occasions">
        <ul className="space-y-2">{plan.seasonalCampaigns.map((s, i) => <li key={i}><b>{s.occasion}</b> <span className="text-xs text-muted-foreground">({s.timing})</span><p className="text-muted-foreground">{s.idea}</p></li>)}</ul>
      </Block>}
      {launch && <Block icon={Rocket} title="Product launch">
        <dl className="space-y-2"><div><dt className="font-semibold">Teaser</dt><dd className="text-muted-foreground">{launch.teaser}</dd></div><div><dt className="font-semibold">Announcement</dt><dd className="text-muted-foreground">{launch.announcement}</dd></div><div><dt className="font-semibold">Launch plan</dt><dd className="text-muted-foreground">{launch.launchPlan}</dd></div><div><dt className="font-semibold">Follow-up</dt><dd className="text-muted-foreground">{launch.followUp}</dd></div></dl>
      </Block>}
    </div>}
    {solo && <>
      <h3 className="flex items-center gap-2 pt-4 text-2xl font-semibold"><Timer className="size-5 text-primary" />Solo seller plan</h3>
      <div className="panel p-6 text-sm">
        {solo.weeklyTimeEstimate && <p className="mb-4"><b>Time needed:</b> {solo.weeklyTimeEstimate}</p>}
        <ul className="divide-y">{solo.priorities.map((t, i) => <li key={i} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between"><div><b>{t.task}</b><p className="text-muted-foreground">{t.why}</p></div><div className="flex shrink-0 gap-1.5 text-xs"><span className="rounded-full bg-primary/10 px-2 py-1 font-medium text-primary">Impact {t.impact}</span><span className="rounded-full bg-secondary px-2 py-1 font-medium">Effort {t.effort}</span></div></li>)}</ul>
        {!!solo.reusableContent?.length && <p className="mt-4 text-muted-foreground"><b className="text-foreground">Reuse these:</b> {solo.reusableContent.join(" · ")}</p>}
      </div>
    </>}
  </>;
}
