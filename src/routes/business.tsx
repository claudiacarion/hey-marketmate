import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/app/AppShell";

export const Route = createFileRoute("/business")({
  head: () => ({
    meta: [
      { title: "My Business — MarketMate" },
      { name: "description", content: "Tell MarketMate about your business so every campaign fits your brand." },
      { property: "og:title", content: "My Business — MarketMate" },
      { property: "og:description", content: "Tell MarketMate about your business so every campaign fits your brand." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Business,
});

const types = ["Restaurant / Café", "Salon / Beauty", "Online shop", "Fitness studio", "Consultant", "Other"];

function Business() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="My Business" title="Your brand profile" description="Your assistant uses this to write in your voice and target the right customers." />
      <form className="panel space-y-6 p-7" onSubmit={(e) => { e.preventDefault(); toast.success("Profile saved for this session"); }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="name">Business name</Label><Input id="name" defaultValue="Lina's Bakery & Brunch" /></div>
          <div className="space-y-2"><Label htmlFor="city">Location</Label><Input id="city" defaultValue="Stockholm" /></div>
        </div>
        <div className="space-y-2">
          <Label>Business type</Label>
          <div className="flex flex-wrap gap-2">{types.map((t, i) => <span key={t} className={`rounded-xl border px-3.5 py-2 text-sm ${i === 0 ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>{t}</span>)}</div>
        </div>
        <div className="space-y-2"><Label htmlFor="audience">Who are your customers?</Label><Textarea id="audience" rows={3} defaultValue="Young families and remote workers in the neighbourhood who love slow weekend mornings." /></div>
        <div className="space-y-2"><Label htmlFor="voice">Brand voice</Label><Input id="voice" defaultValue="Warm, playful, a little cosy" /></div>
        <Button type="submit" className="rounded-xl">Save profile</Button>
      </form>
    </div>
  );
}
