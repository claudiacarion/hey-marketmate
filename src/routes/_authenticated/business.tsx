import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/app/AppShell";
import { businessCategories, defaultProfile, isEtsySeller, loadProfile, productNatures, salesChannelOptions, saveProfile, type EtsyDetails } from "@/lib/business-profile";

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

const chip = (on: boolean) => `rounded-xl border px-3.5 py-2 text-sm transition-colors ${on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-secondary"}`;
const toggleIn = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

function Business() {
  const [p, setP] = useState(defaultProfile);
  useEffect(() => setP(loadProfile()), []);
  const set = (k: "name" | "location" | "audience" | "voice" | "primaryColor" | "accentColor" | "otherDescription") => (e: { target: { value: string } }) => setP({ ...p, [k]: e.target.value });
  const setE = (k: Exclude<keyof EtsyDetails, "productNature">) => (e: { target: { value: string } }) => setP({ ...p, etsyDetails: { ...p.etsyDetails, [k]: e.target.value } });
  const subs = businessCategories[p.category] ?? [];
  const isOtherSub = p.category === "Other" || (!!p.subcategory && !subs.includes(p.subcategory)) || p.subcategory === "__other";
  const etsy = isEtsySeller(p);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="My Business" title="Your brand profile" description="Your assistant uses this to write in your voice and target the right customers." />
      <form className="panel space-y-6 p-7" onSubmit={(e) => { e.preventDefault(); saveProfile({ ...p, subcategory: p.subcategory === "__other" ? "" : p.subcategory }); toast.success("Profile saved"); }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="name">Business name</Label><Input id="name" value={p.name} onChange={set("name")} /></div>
          <div className="space-y-2"><Label htmlFor="city">Location</Label><Input id="city" value={p.location} onChange={set("location")} /></div>
        </div>
        <div className="space-y-2">
          <Label>Business category</Label>
          <div className="flex flex-wrap gap-2">{Object.keys(businessCategories).map((c) => (
            <button type="button" key={c} onClick={() => setP({ ...p, category: c, subcategory: "" })} className={chip(p.category === c)}>{c}</button>
          ))}</div>
        </div>
        {subs.length > 0 && (
          <div className="space-y-2">
            <Label>What exactly do you do?</Label>
            <div className="flex flex-wrap gap-2">
              {subs.map((s) => <button type="button" key={s} onClick={() => setP({ ...p, subcategory: s })} className={chip(p.subcategory === s)}>{s}</button>)}
              <button type="button" onClick={() => setP({ ...p, subcategory: "__other" })} className={chip(isOtherSub)}>Other</button>
            </div>
          </div>
        )}
        {isOtherSub && <div className="space-y-2"><Label htmlFor="other">Describe your business</Label><Input id="other" value={p.otherDescription} onChange={set("otherDescription")} placeholder="e.g. Mobile bike repair" /></div>}
        <div className="space-y-2">
          <Label>Where do you sell or operate?</Label>
          <p className="text-xs text-muted-foreground">Pick as many as apply.</p>
          <div className="flex flex-wrap gap-2">{salesChannelOptions.map((c) => (
            <button type="button" key={c} aria-pressed={p.salesChannels.includes(c)} onClick={() => setP({ ...p, salesChannels: toggleIn(p.salesChannels, c) })} className={chip(p.salesChannels.includes(c))}>{c}</button>
          ))}</div>
        </div>

        {etsy && (
          <fieldset className="space-y-4 rounded-2xl border border-accent/40 bg-accent/5 p-5">
            <legend className="px-1 text-sm font-semibold text-accent">Etsy & handmade shop details (all optional)</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="ptype">Product type</Label><Input id="ptype" value={p.etsyDetails.productType} onChange={setE("productType")} placeholder="e.g. Hand-thrown mugs" /></div>
              <div className="space-y-2"><Label htmlFor="price">Typical price range</Label><Input id="price" value={p.etsyDetails.priceRange} onChange={setE("priceRange")} placeholder="e.g. 25–60 €" /></div>
            </div>
            <div className="space-y-2">
              <Label>Your products are…</Label>
              <div className="flex flex-wrap gap-2">{productNatures.map((n) => (
                <button type="button" key={n} aria-pressed={p.etsyDetails.productNature.includes(n)} onClick={() => setP({ ...p, etsyDetails: { ...p.etsyDetails, productNature: toggleIn(p.etsyDetails.productNature, n) } })} className={chip(p.etsyDetails.productNature.includes(n))}>{n}</button>
              ))}</div>
            </div>
            <div className="space-y-2"><Label htmlFor="pdesc">Product description</Label><Textarea id="pdesc" rows={3} value={p.etsyDetails.productDescription} onChange={setE("productDescription")} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="tcust">Target customer</Label><Input id="tcust" value={p.etsyDetails.targetCustomer} onChange={setE("targetCustomer")} placeholder="e.g. Gift buyers aged 25–45" /></div>
              <div className="space-y-2"><Label htmlFor="markets">Main selling countries</Label><Input id="markets" value={p.etsyDetails.markets} onChange={setE("markets")} placeholder="e.g. Sweden, Germany, US" /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="usps">What makes your products special?</Label><Textarea id="usps" rows={2} value={p.etsyDetails.usps} onChange={setE("usps")} /></div>
            <div className="space-y-2"><Label htmlFor="chal">Current marketing challenges</Label><Textarea id="chal" rows={2} value={p.etsyDetails.challenges} onChange={setE("challenges")} placeholder="e.g. Few views on new listings, no time for social media" /></div>
          </fieldset>
        )}

        <div className="space-y-2"><Label htmlFor="audience">Who are your customers?</Label><Textarea id="audience" rows={3} value={p.audience} onChange={set("audience")} /></div>
        <div className="space-y-2"><Label htmlFor="voice">Brand voice</Label><Input id="voice" value={p.voice} onChange={set("voice")} /></div>
        <div className="space-y-2">
          <Label>Brand colours</Label>
          <p className="text-xs text-muted-foreground">Used on your posters. You can still change them per poster.</p>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm"><input type="color" value={p.primaryColor} onChange={set("primaryColor")} className="size-9 cursor-pointer rounded border" aria-label="Main brand colour" />Main</label>
            <label className="flex items-center gap-2 text-sm"><input type="color" value={p.accentColor} onChange={set("accentColor")} className="size-9 cursor-pointer rounded border" aria-label="Accent brand colour" />Accent</label>
          </div>
        </div>
        <Button type="submit" className="rounded-xl">Save profile</Button>
      </form>
    </div>
  );
}
