import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, Target, Users, Compass, MessageCircle, Megaphone, Gift, PieChart, TrendingUp, Sparkles, Copy, CalendarDays, ShieldCheck, Image as ImageIcon, Instagram, Mail, Facebook, MessageSquare, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/app/AppShell";
import type { CampaignPlan } from "@/lib/campaign-types";
import { defaultProfile, loadProfile } from "@/lib/business-profile";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Content Studio — MarketMate" },
      { name: "description", content: "Brief your AI assistant and plan a new marketing campaign." },
      { property: "og:title", content: "Content Studio — MarketMate" },
      { property: "og:description", content: "Brief your AI assistant and plan a new marketing campaign." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Studio,
});

const goals = ["Bring in new customers", "Win back regulars", "Promote an offer", "Launch something new", "Get more reviews"];
const channels = [
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "facebook", label: "Facebook", icon: Facebook },
  { id: "email", label: "Email", icon: Mail },
  { id: "sms", label: "SMS", icon: MessageSquare },
  { id: "google", label: "Google", icon: Search },
];

function Studio() {
  const [goal, setGoal] = useState<string>(goals[0] ?? "");
  const [picked, setPicked] = useState<string[]>(["instagram", "email"]);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const [budget, setBudget] = useState("");
  const [timing, setTiming] = useState("");
  const [notes, setNotes] = useState("");
  const [profile, setProfile] = useState(defaultProfile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<CampaignPlan | null>(null);
  useEffect(() => setProfile(loadProfile()), []);

  const run = async () => {
    setLoading(true); setError(null);
    try {
      const names = channels.filter((c) => picked.includes(c.id)).map((c) => c.label);
      const business = { name: profile.name, type: profile.type, location: profile.location, audience: profile.audience, voice: profile.voice };
      const { data, error: fnError } = await supabase.functions.invoke<{ plan?: CampaignPlan; error?: string }>("generate-campaign", { body: { business, brief: { goal, channels: names, budget, timing, notes } } });
      let msg: string | null = null;
      if (fnError) {
        msg = "The campaign service couldn't be reached. Please try again.";
        const ctx = (fnError as { context?: Response }).context;
        if (ctx && typeof ctx.json === "function") {
          try { const body = await ctx.json(); if (body?.error) msg = String(body.error); } catch { /* keep default */ }
        }
      } else if (data?.error) msg = data.error;
      else if (!data?.plan) msg = "The AI returned an unexpected answer. Please try again.";
      if (msg) { setError(msg); toast.error(msg); }
      else if (data?.plan) { setPlan(data.plan); setTimeout(() => document.getElementById("plan")?.scrollIntoView({ behavior: "smooth" }), 50); }
    } catch (e) {
      console.error(e);
      const msg = "Something went wrong while generating. Please check your connection and try again.";
      setError(msg); toast.error(msg);
    } finally { setLoading(false); }
  };
  const chip = (on: boolean) => `rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-secondary"}`;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Content Studio" title="Plan a new campaign" description="Tell your assistant what you want to achieve. It will draft the plan, posts and schedule for you." />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="panel space-y-7 p-7">
          <div className="space-y-3">
            <Label>1. What's the goal?</Label>
            <div className="flex flex-wrap gap-2">{goals.map((g) => <button type="button" key={g} onClick={() => setGoal(g)} className={chip(goal === g)}>{g}</button>)}</div>
          </div>
          <div className="space-y-3">
            <Label>2. Where should it run?</Label>
            <div className="flex flex-wrap gap-2">{channels.map(({ id, label, icon: Icon }) => <button type="button" key={id} onClick={() => toggle(id)} className={`${chip(picked.includes(id))} flex items-center gap-2`}><Icon className="size-4" />{label}</button>)}</div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="budget">3. Budget (optional)</Label><Input id="budget" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 200 €" /></div>
            <div className="space-y-2"><Label htmlFor="dates">Timing</Label><Input id="dates" value={timing} onChange={(e) => setTiming(e.target.value)} placeholder="e.g. Next 2 weeks" /></div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="brief">4. Anything else?</Label>
            <Textarea id="brief" rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="We're launching a new pumpkin spice brunch menu on weekends and want families to try it…" />
          </div>
          <Button size="lg" className="w-full rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading} onClick={run}>
            {loading ? <><Loader2 className="size-4 animate-spin" /> Crafting your campaign…</> : <><Sparkles className="size-4" /> Generate campaign plan</>}
          </Button>
          <p className="text-center text-xs text-muted-foreground">Planning for <b className="text-foreground">{profile.name}</b> · {profile.type}. Edit in My Business.</p>
          {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"><AlertCircle className="mt-0.5 size-4 shrink-0" />{error}</div>}
        </div>
        <aside className="space-y-4">
          <div className="rounded-2xl bg-hero p-6 text-primary-foreground shadow-lift">
            <Sparkles className="mb-3 size-6" />
            <h3 className="text-xl font-semibold">What you'll get</h3>
            <ul className="mt-3 space-y-2 text-sm opacity-90">
              <li>• A clear strategy & key message</li><li>• Ready-to-post captions and emails</li><li>• Image ideas for each post</li><li>• A posting schedule on your calendar</li>
            </ul>
          </div>
          <div className="panel p-5 text-sm text-muted-foreground"><b className="text-foreground">Tip:</b> the more you share about your customers, the better the plan.</div>
        </aside>
      </div>
      {loading && !plan && <div className="panel mt-6 flex items-center gap-3 p-6 text-muted-foreground"><Loader2 className="size-5 animate-spin text-primary" />Your strategist is thinking. Drafting strategy, posts, schedule and promo, then reviewing quality — about 15–30 seconds.</div>}
      {plan && <PlanView plan={plan} />}
    </div>
  );
}

function Block({ icon: Icon, title, children }: { icon: typeof Target; title: string; children: React.ReactNode }) {
  return (
    <div className="panel p-6">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary"><Icon className="size-4" />{title}</div>
      <div className="text-sm leading-relaxed text-foreground">{children}</div>
    </div>
  );
}

function PlanView({ plan }: { plan: CampaignPlan }) {
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
        <h3 className="pt-4 text-2xl font-semibold">Promotional material</h3>
        <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl bg-warm p-7 shadow-soft">
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">{plan.promotionalMaterial.offer}</span>
            <h4 className="mt-4 text-3xl font-semibold">{plan.promotionalMaterial.headline}</h4>
            <p className="mt-3 text-sm leading-relaxed">{plan.promotionalMaterial.supportingCopy}</p>
            <p className="mt-5 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">{plan.promotionalMaterial.callToAction}</p>
          </div>
          <Block icon={ImageIcon} title="Poster / graphic design">{plan.promotionalMaterial.designConcept}</Block>
        </div>
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
