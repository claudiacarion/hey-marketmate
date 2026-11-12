import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Instagram, Mail, Facebook, MessageSquare, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/app/AppShell";

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
  const [goal, setGoal] = useState(goals[0]);
  const [picked, setPicked] = useState<string[]>(["instagram", "email"]);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const chip = (on: boolean) => `rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-secondary"}`;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Content Studio" title="Plan a new campaign" description="Tell your assistant what you want to achieve. It will draft the plan, posts and schedule for you." />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="panel space-y-7 p-7">
          <div className="space-y-3">
            <Label>1. What's the goal?</Label>
            <div className="flex flex-wrap gap-2">{goals.map((g) => <button key={g} onClick={() => setGoal(g)} className={chip(goal === g)}>{g}</button>)}</div>
          </div>
          <div className="space-y-3">
            <Label>2. Where should it run?</Label>
            <div className="flex flex-wrap gap-2">{channels.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => toggle(id)} className={`${chip(picked.includes(id))} flex items-center gap-2`}><Icon className="size-4" />{label}</button>)}</div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="budget">3. Budget (optional)</Label><Input id="budget" placeholder="e.g. 200 €" /></div>
            <div className="space-y-2"><Label htmlFor="dates">Timing</Label><Input id="dates" placeholder="e.g. Next 2 weeks" /></div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="brief">4. Anything else?</Label>
            <Textarea id="brief" rows={5} placeholder="We're launching a new pumpkin spice brunch menu on weekends and want families to try it…" />
          </div>
          <Button size="lg" className="w-full rounded-xl bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => toast("Your AI assistant is coming soon", { description: "We'll generate the full campaign plan here in the next stage." })}>
            <Sparkles className="size-4" /> Generate campaign plan
          </Button>
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
    </div>
  );
}
