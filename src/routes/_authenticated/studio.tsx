import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, Sparkles, Instagram, Mail, Facebook, MessageSquare, Search, Store, Pin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/app/AppShell";
import type { CampaignPlan } from "@/lib/campaign-types";
import { defaultProfile, isEtsySeller, loadProfile } from "@/lib/business-profile";
import { PlanView } from "@/components/studio/PlanView";

export const Route = createFileRoute("/_authenticated/studio")({
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
  { id: "etsy", label: "Etsy", icon: Store },
  { id: "pinterest", label: "Pinterest", icon: Pin },
];

function Studio() {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState<string>(goals[0] ?? "");
  const [picked, setPicked] = useState<string[]>(["instagram", "email"]);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
  const [duration, setDuration] = useState(7);
  const [notes, setNotes] = useState("");
  const [profile, setProfile] = useState(defaultProfile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<CampaignPlan | null>(null);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  useEffect(() => {
    const p = loadProfile(); setProfile(p);
    if (isEtsySeller(p)) setPicked(["etsy", "pinterest", "instagram"]);
    else if (p.salesChannels.includes("Instagram / social media")) setPicked((x) => (x.includes("instagram") ? x : [...x, "instagram"]));
  }, []);
  const label = [profile.category, profile.subcategory || profile.otherDescription].filter(Boolean).join(" · ");

  const run = async () => {
    const title = name.trim().replace(/\s+/g, " ");
    if (!title) { const m = "Please give your campaign a name first."; setError(m); toast.error(m); document.getElementById("cname")?.focus(); return; }
    setLoading(true); setError(null);
    try {
      const names = channels.filter((c) => picked.includes(c.id)).map((c) => c.label);
      const business = { name: profile.name, category: profile.category, subcategory: profile.subcategory, otherDescription: profile.otherDescription, salesChannels: profile.salesChannels, location: profile.location, audience: profile.audience, voice: profile.voice, ...(isEtsySeller(profile) ? { etsyDetails: profile.etsyDetails } : {}) };
      const { data, error: fnError } = await supabase.functions.invoke<{ plan?: CampaignPlan; error?: string }>("generate-campaign", { body: { business, brief: { campaignName: title, goal, channels: names, budget, timing: `${duration} days from ${startDate}`, startDate, durationDays: duration, notes: `Campaign name (chosen by the owner, keep it as the title): ${title}${notes ? `\n${notes}` : ""}` } } });
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
      else if (data?.plan) {
        const finalPlan = { ...data.plan, title };
        setPlan(finalPlan); setCampaignId(null);
        const { data: saved, error: saveErr } = await supabase.from("campaigns").insert({ title, business: business as never, brief: { campaignName: title, goal, channels: names, budget, timing: `${duration} days from ${startDate}`, startDate, durationDays: duration, notes } as never, plan: finalPlan as never }).select("id").single();
        if (saved) setCampaignId(saved.id);
        if (saveErr) toast.error("Plan created, but it couldn't be saved to your campaigns."); else toast.success("Saved to Campaigns");
        setTimeout(() => document.getElementById("plan")?.scrollIntoView({ behavior: "smooth" }), 50); }
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
          <div className="space-y-2">
            <Label htmlFor="cname">1. What would you like to call this campaign?</Label>
            <Input id="cname" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Christmas Collection Launch, Summer Sale 2027, New Customer Campaign..." />
            <p className="text-xs text-muted-foreground">Give your campaign a name that helps you recognise it later. ({name.trim().length}/80)</p>
          </div>
          <div className="space-y-3">
            <Label>2. What's the goal?</Label>
            <div className="flex flex-wrap gap-2">{goals.map((g) => <button type="button" key={g} onClick={() => setGoal(g)} className={chip(goal === g)}>{g}</button>)}</div>
          </div>
          <div className="space-y-3">
            <Label>3. Where should it run?</Label>
            <div className="flex flex-wrap gap-2">{channels.map(({ id, label, icon: Icon }) => <button type="button" key={id} onClick={() => toggle(id)} className={`${chip(picked.includes(id))} flex items-center gap-2`}><Icon className="size-4" />{label}</button>)}</div>
          </div>
          <div className="space-y-2"><Label htmlFor="budget">4. Budget (optional)</Label><Input id="budget" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 200 €" /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="start">Start date</Label><Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div className="space-y-2"><Label>Length</Label><div className="flex flex-wrap gap-2">{[[7, "7 days"], [14, "2 weeks"], [28, "4 weeks"]].map(([n, l]) => <button type="button" key={n} onClick={() => setDuration(Number(n))} className={chip(duration === n)}>{l}</button>)}</div></div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="brief">5. Anything else?</Label>
            <Textarea id="brief" rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="We're launching a new pumpkin spice brunch menu on weekends and want families to try it…" />
          </div>
          <Button size="lg" className="w-full rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading || !name.trim()} onClick={run}>
            {loading ? <><Loader2 className="size-4 animate-spin" /> Crafting your campaign…</> : <><Sparkles className="size-4" /> Generate campaign plan</>}
          </Button>
          <p className="text-center text-xs text-muted-foreground">Planning for <b className="text-foreground">{profile.name}</b> · {label}. Edit in My Business.</p>
          {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"><AlertCircle className="mt-0.5 size-4 shrink-0" />{error}</div>}
        </div>
        <aside className="space-y-4">
          <div className="rounded-2xl bg-hero p-6 text-primary-foreground shadow-lift">
            <Sparkles className="mb-3 size-6" />
            <h3 className="text-xl font-semibold">What you'll get</h3>
            <ul className="mt-3 space-y-2 text-sm opacity-90">
              <li>• A clear strategy & key message</li><li>• Ready-to-post captions and emails</li><li>• Image ideas for each post</li><li>• A realistic posting schedule that fits your week</li>
            </ul>
          </div>
          <div className="panel p-5 text-sm text-muted-foreground"><b className="text-foreground">Tip:</b> the more you share about your customers, the better the plan.</div>
        </aside>
      </div>
      {loading && !plan && <div className="panel mt-6 flex items-center gap-3 p-6 text-muted-foreground"><Loader2 className="size-5 animate-spin text-primary" />Your strategist is thinking. Drafting strategy, posts, schedule and promo, then reviewing quality — about 15–30 seconds.</div>}
      {plan && <PlanView plan={plan} businessName={profile.name} businessType={profile.category} brand={{ primary: profile.primaryColor, accent: profile.accentColor }} campaignId={campaignId} />}
    </div>
  );
}

