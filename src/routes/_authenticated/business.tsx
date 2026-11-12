import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/app/AppShell";
import { businessTypes, defaultProfile, loadProfile, saveProfile } from "@/lib/business-profile";

export const Route = createFileRoute("/_authenticated/business")({
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

function Business() {
  const [p, setP] = useState(defaultProfile);
  useEffect(() => setP(loadProfile()), []);
  const set = (k: keyof typeof p) => (e: { target: { value: string } }) => setP({ ...p, [k]: e.target.value });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="My Business" title="Your brand profile" description="Your assistant uses this to write in your voice and target the right customers." />
      <form className="panel space-y-6 p-7" onSubmit={(e) => { e.preventDefault(); saveProfile(p); toast.success("Profile saved"); }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="name">Business name</Label><Input id="name" value={p.name} onChange={set("name")} /></div>
          <div className="space-y-2"><Label htmlFor="city">Location</Label><Input id="city" value={p.location} onChange={set("location")} /></div>
        </div>
        <div className="space-y-2">
          <Label>Business type</Label>
          <div className="flex flex-wrap gap-2">{businessTypes.map((t) => (
            <button type="button" key={t} onClick={() => setP({ ...p, type: t })} className={`rounded-xl border px-3.5 py-2 text-sm transition-colors ${p.type === t ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-secondary"}`}>{t}</button>
          ))}</div>
        </div>
        <div className="space-y-2"><Label htmlFor="audience">Who are your customers?</Label><Textarea id="audience" rows={3} value={p.audience} onChange={set("audience")} /></div>
        <div className="space-y-2"><Label htmlFor="voice">Brand voice</Label><Input id="voice" value={p.voice} onChange={set("voice")} /></div>
        <Button type="submit" className="rounded-xl">Save profile</Button>
      </form>
    </div>
  );
}
