import { useEffect, useMemo, useRef, useState } from "react";
import { Download, ImagePlus, Trash2, Loader2, Save, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { CampaignPlan } from "@/lib/campaign-types";
import { ensurePosterFonts, FORMATS, LAYOUTS, type PosterFormat, type PosterLayout } from "@/lib/poster/render";
import { drawDesign, ensureDesignFonts, FONT_STYLES, isTemplate, PALETTES, TEMPLATES, type DesignContent, type FontStyle, type TemplateId } from "@/lib/poster/templates";
import { creditLine, licenseLabel, requiresCredit, stockPhotos, suggestPhotos, type StockPhoto } from "@/lib/poster/photos";

type Promo = NonNullable<CampaignPlan["promotionalMaterial"]>;
export type SavedPoster = {
  format: PosterFormat; layout: PosterLayout | TemplateId; primary: string; accent: string; showCredit: boolean;
  font?: FontStyle | undefined; usePhoto?: boolean | undefined;
  text?: { headline: string; supportingCopy: string; offer: string; callToAction: string; productName: string } | undefined;
  photo: { kind: "stock"; id: string } | { kind: "upload"; path: string } | null;
  imagePath?: string | undefined; savedAt?: string | undefined;
};
const BUCKET = "posters";

function slug(s: string | null | undefined) { return String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "poster"; }
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob); const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
async function loadImage(src: string) {
  const make = (u: string, cors: boolean) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); if (cors) i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = () => rej(new Error("image failed")); i.src = u; });
  if (src.startsWith("blob:") || src.startsWith("data:")) return make(src, false);
  try {
    const r = await fetch(src, { mode: "cors", cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await make(URL.createObjectURL(await r.blob()), false);
  } catch { return make(src + (src.includes("?") ? "&" : "?") + "cors=1", true); }
}
function TemplateThumb({ id, img, content, format, primary, accent, font, active, onPick }: { id: TemplateId; img: HTMLImageElement | null; content: DesignContent; format: PosterFormat; primary: string; accent: string; font: FontStyle; active: boolean; onPick: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const t = setTimeout(() => { ensureDesignFonts().then(() => { if (ref.current) drawDesign(ref.current, img, { ...content, credit: undefined }, { format: format === "print" ? "social" : format, layout: id, primary, accent, font }); }); }, 300);
    return () => clearTimeout(t);
  }, [id, img, content, format, primary, accent, font]);
  return (
    <button type="button" onClick={onPick} aria-pressed={active} className={`group rounded-xl border bg-card p-1.5 text-left transition-colors hover:bg-secondary ${active ? "border-primary ring-2 ring-accent ring-offset-2 ring-offset-background" : ""}`}>
      <canvas ref={ref} aria-hidden className="block h-auto w-full rounded-lg" />
      <span className="mt-1.5 block truncate px-0.5 text-[11px] font-semibold">{TEMPLATES[id].label}</span>
    </button>
  );
}

async function signedBlobUrl(path: string) {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) throw error ?? new Error("missing");
  return URL.createObjectURL(data);
}

export function PosterStudio({ promo, businessName, businessType, brand, campaignId, initial }: {
  promo: Promo; businessName: string; businessType: string; brand: { primary: string; accent: string };
  campaignId?: string | null | undefined; initial?: SavedPoster | null | undefined;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const suggestions = useMemo(() => suggestPhotos(businessType, [promo.headline, promo.offer, promo.supportingCopy, promo.designConcept].join(" ")), [businessType, promo]);
  const [format, setFormat] = useState<PosterFormat>(initial?.format ?? "social");
  const [layout, setLayout] = useState<PosterLayout | TemplateId>(initial?.layout ?? "minimal");
  const [font, setFont] = useState<FontStyle>(initial?.font ?? "auto");
  const [usePhoto, setUsePhoto] = useState(initial?.usePhoto ?? true);
  const [txt, setTxt] = useState(initial?.text ?? { headline: promo.headline ?? "", supportingCopy: promo.supportingCopy ?? "", offer: promo.offer ?? "", callToAction: promo.callToAction ?? "", productName: "" });
  const setT = (k: keyof typeof txt, v: string) => setTxt((x) => ({ ...x, [k]: v }));
  const [primary, setPrimary] = useState(initial?.primary ?? brand.primary);
  const [accent, setAccent] = useState(initial?.accent ?? brand.accent);
  const [showCredit, setShowCredit] = useState(initial?.showCredit ?? true);
  const [photo, setPhoto] = useState<SavedPoster["photo"]>(initial?.photo ?? (suggestions[0] ? { kind: "stock", id: suggestions[0].id } : null));
  const [uploads, setUploads] = useState<{ path: string; url: string }[]>([]);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [busy, setBusy] = useState<null | "upload" | "save" | "png">(null);
  const [savedAt, setSavedAt] = useState(initial?.savedAt);
  const [showAll, setShowAll] = useState(false);

  const tpl = isTemplate(layout);
  const noPhoto = layout === "graphic" || (tpl && !usePhoto);
  const stock = !noPhoto && photo?.kind === "stock" ? stockPhotos.find((p) => p.id === photo.id) ?? null : null;
  const mustCredit = !!stock && requiresCredit(stock);
  const credit = stock && (showCredit || mustCredit) ? creditLine(stock) : undefined;

  // List the user's previously uploaded photos.
  useEffect(() => {
    let alive = true; const urls: string[] = [];
    (async () => {
      const { data: u } = await supabase.auth.getUser(); if (!u.user) return;
      const { data } = await supabase.storage.from(BUCKET).list(`${u.user.id}/uploads`, { limit: 24, sortBy: { column: "created_at", order: "desc" } });
      const items = await Promise.all((data ?? []).filter((f) => f.id).map(async (f) => {
        const path = `${u.user!.id}/uploads/${f.name}`;
        try { const url = await signedBlobUrl(path); urls.push(url); return { path, url }; } catch { return null; }
      }));
      if (alive) setUploads(items.filter(Boolean) as { path: string; url: string }[]);
    })();
    return () => { alive = false; urls.forEach((x) => URL.revokeObjectURL(x)); };
  }, []);

  // Load the selected photo.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        let src: string | null = null;
        if (photo?.kind === "stock") src = stockPhotos.find((p) => p.id === photo.id)?.url ?? null;
        else if (photo?.kind === "upload") src = uploads.find((x) => x.path === photo.path)?.url ?? (await signedBlobUrl(photo.path));
        const i = src ? await loadImage(src) : null;
        if (alive) setImg(i);
      } catch { if (alive) { setImg(null); toast.error("Couldn't load that photo."); } }
    })();
    return () => { alive = false; };
  }, [photo, uploads]);

  const content = useMemo<DesignContent>(() => ({ businessName, ...txt }), [businessName, txt]);
  const thumbImg = noPhoto ? null : img;
  // Redraw on any change.
  useEffect(() => {
    let alive = true;
    Promise.all([ensurePosterFonts(), ensureDesignFonts()]).then(() => {
      if (!alive || !canvasRef.current) return;
      drawDesign(canvasRef.current, noPhoto ? null : img, { ...content, credit }, { format, layout, primary, accent, font });
    });
    return () => { alive = false; };
  }, [img, noPhoto, format, layout, primary, accent, font, credit, content]);

  const toBlob = async () => {
    const c = canvasRef.current; if (!c) throw new Error("no canvas");
    const b = await new Promise<Blob | null>((r) => { try { c.toBlob(r, "image/png"); } catch (e) { console.error(e); r(null); } });
    if (b) return b;
    return await (await fetch(c.toDataURL("image/png"))).blob();
  };
  const fileName = `${slug(businessName)}-${slug(txt.headline)}-${format}.png`;

  const onUpload = async (f: File | undefined) => {
    if (!f) return;
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { toast.error("Please choose a JPG, PNG or WebP photo."); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error("That photo is over 10 MB — please pick a smaller one."); return; }
    setBusy("upload");
    try {
      const { data: u } = await supabase.auth.getUser(); if (!u.user) throw new Error("signed out");
      const ext = f.type.split("/")[1] === "jpeg" ? "jpg" : f.type.split("/")[1];
      const path = `${u.user.id}/uploads/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, f, { contentType: f.type });
      if (error) throw error;
      const url = URL.createObjectURL(f);
      setUploads((x) => [{ path, url }, ...x]); setPhoto({ kind: "upload", path });
      toast.success("Photo uploaded");
    } catch (e) { console.error(e); toast.error("Upload failed. Please try again."); }
    finally { setBusy(null); if (fileRef.current) fileRef.current.value = ""; }
  };

  const png = async () => {
    setBusy("png");
    try { downloadBlob(await toBlob(), fileName); toast.success("Poster downloaded"); }
    catch (e) { console.error(e); toast.error("Couldn't create the image. Please try again."); }
    finally { setBusy(null); }
  };

  const save = async () => {
    if (!campaignId) { toast.error("This campaign hasn't been saved yet."); return; }
    setBusy("save");
    try {
      const { data: u } = await supabase.auth.getUser(); if (!u.user) throw new Error("signed out");
      const imagePath = `${u.user.id}/campaigns/${campaignId}/poster-${format}.png`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(imagePath, await toBlob(), { contentType: "image/png", upsert: true });
      if (upErr) throw upErr;
      const at = new Date().toISOString();
      const poster: SavedPoster = { format, layout, primary, accent, showCredit, photo, font, usePhoto, text: txt, imagePath, savedAt: at };
      const { error } = await supabase.from("campaigns").update({ poster: poster as never }).eq("id", campaignId);
      if (error) throw error;
      setSavedAt(at); toast.success("Poster saved with this campaign");
    } catch (e) { console.error(e); toast.error("Couldn't save the poster. Please try again."); }
    finally { setBusy(null); }
  };

  const removeUpload = async (path: string) => {
    if (!window.confirm("Delete this photo from your uploads?")) return;
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) { console.error(error); toast.error("Couldn't delete the photo. Please try again."); return; }
    setUploads((x) => x.filter((u) => u.path !== path));
    if (photo?.kind === "upload" && photo.path === path) setPhoto(suggestions[0] ? { kind: "stock", id: suggestions[0].id } : null);
    toast.success("Photo deleted");
  };

  const thumbs: StockPhoto[] = showAll ? suggestions : suggestions.slice(0, 8);
  const sel = "ring-2 ring-accent ring-offset-2 ring-offset-background";
  const chip = (on: boolean) => `rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-secondary"}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-3">
        <div className="panel flex items-center justify-center bg-secondary/40 p-4">
          <canvas ref={canvasRef} aria-label="Poster preview" className="h-auto max-h-[720px] w-auto max-w-full rounded-lg shadow-lift" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={png} disabled={!!busy} className="rounded-xl">{busy === "png" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}Download PNG</Button>
          <Button onClick={save} disabled={!!busy || !campaignId} variant="outline" className="rounded-xl">{busy === "save" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Save with campaign</Button>
          {savedAt && <span className="text-xs text-muted-foreground">Saved {new Date(savedAt).toLocaleString()}</span>}
        </div>
        {stock && (
          <p className="text-xs text-muted-foreground">
            Photo: <a className="underline" href={stock.source} target="_blank" rel="noreferrer">“{stock.title}”</a> by {stock.creatorUrl ? <a className="underline" href={stock.creatorUrl} target="_blank" rel="noreferrer">{stock.creator}</a> : stock.creator}
            {stock.provider ? ` via ${stock.provider}` : ""} · {stock.licenseUrl ? <a className="underline" href={stock.licenseUrl} target="_blank" rel="noreferrer">{licenseLabel(stock)}</a> : licenseLabel(stock)}
            {mustCredit && " · this licence requires the credit shown on the poster."}
          </p>
        )}
      </div>

      <div className="panel space-y-5 p-5 text-sm">
        <div className="space-y-2">
          <p className="font-semibold">Size</p>
          <div className="flex flex-wrap gap-2">{(Object.keys(FORMATS) as PosterFormat[]).map((f) => <button key={f} type="button" className={chip(format === f)} onClick={() => setFormat(f)} title={FORMATS[f].hint}>{FORMATS[f].label}</button>)}</div>
          <p className="text-xs text-muted-foreground">{FORMATS[format].hint}</p>
        </div>
        <div className="space-y-2">
          <p className="font-semibold">Design template</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3">{(Object.keys(TEMPLATES) as TemplateId[]).map((id) => (
            <TemplateThumb key={id} id={id} img={usePhoto ? thumbImg ?? img : null} content={content} format={format} primary={primary} accent={accent} font={font} active={layout === id} onPick={() => setLayout(id)} />
          ))}</div>
          {tpl && <p className="text-xs text-muted-foreground">{TEMPLATES[layout as TemplateId].blurb}</p>}
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">Classic layouts</summary>
            <div className="mt-2 flex flex-wrap gap-2">{(Object.keys(LAYOUTS) as PosterLayout[]).map((l) => <button key={l} type="button" className={chip(layout === l)} onClick={() => setLayout(l)}>{LAYOUTS[l]}</button>)}</div>
          </details>
        </div>
        {tpl && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={usePhoto} onChange={(e) => setUsePhoto(e.target.checked)} className="size-4 accent-primary" />Use a photo (untick for colours only)</label>}
        {tpl && <div className="space-y-2">
          <p className="font-semibold">Font style</p>
          <div className="flex flex-wrap gap-2">{(Object.keys(FONT_STYLES) as FontStyle[]).map((f) => <button key={f} type="button" className={chip(font === f)} onClick={() => setFont(f)}>{FONT_STYLES[f]}</button>)}</div>
        </div>}
        <div className="space-y-2">
          <p className="font-semibold">Colour palette</p>
          <div className="flex flex-wrap gap-2">{PALETTES.map((pl) => (
            <button key={pl.name} type="button" title={pl.name} aria-label={pl.name} onClick={() => { setPrimary(pl.primary); setAccent(pl.accent); }} className={`flex overflow-hidden rounded-full border ${primary === pl.primary && accent === pl.accent ? sel : ""}`}>
              <span className="size-6" style={{ background: pl.primary }} /><span className="size-6" style={{ background: pl.accent }} />
            </button>
          ))}
            <button type="button" className={chip(false)} onClick={() => { setPrimary(brand.primary); setAccent(brand.accent); }}>My brand</button>
          </div>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2"><input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="size-8 cursor-pointer rounded border" aria-label="Main colour" />Main</label>
          <label className="flex items-center gap-2"><input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="size-8 cursor-pointer rounded border" aria-label="Accent colour" />Accent</label>
        </div>
        <div className="space-y-2">
          <p className="font-semibold">Poster text</p>
          {([["headline", "Headline"], ["supportingCopy", "Supporting text"], ["offer", "Offer badge"], ["callToAction", "Call to action"], ["productName", "Product name (Product Spotlight)"]] as const).map(([k, label]) => (
            <label key={k} className="block space-y-1"><span className="text-xs text-muted-foreground">{label}</span>
              {k === "supportingCopy" ? <textarea value={txt[k]} onChange={(e) => setT(k, e.target.value)} rows={3} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                : <input value={txt[k]} onChange={(e) => setT(k, e.target.value)} maxLength={k === "headline" ? 120 : 60} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />}
            </label>
          ))}
        </div>
        {noPhoto ? <p className="text-xs text-muted-foreground">This design uses only your brand colours, with no photo. Tick "Use a photo" or pick a classic photo layout to add one.</p> : <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Photo</p>
            <Button size="sm" variant="outline" className="rounded-lg" disabled={!!busy} onClick={() => fileRef.current?.click()}>{busy === "upload" ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}Upload your own</Button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} />
          </div>
          {uploads.length > 0 && <>
            <p className="text-xs text-muted-foreground">Your photos</p>
            <div className="grid grid-cols-4 gap-2">{uploads.map((u) => (
              <div key={u.path} className="relative">
                <button type="button" onClick={() => setPhoto({ kind: "upload", path: u.path })} className={`block aspect-square w-full overflow-hidden rounded-lg ${photo?.kind === "upload" && photo.path === u.path ? sel : ""}`}><img src={u.url} alt="Your upload" className="size-full object-cover" /></button>
                <button type="button" aria-label="Delete photo" title="Delete photo" onClick={() => removeUpload(u.path)} className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full border bg-card text-destructive shadow-soft hover:bg-destructive hover:text-destructive-foreground"><Trash2 className="size-3.5" /></button>
              </div>
            ))}</div>
          </>}
          <p className="text-xs text-muted-foreground">Suggested free photos</p>
          <div className="grid grid-cols-4 gap-2">{thumbs.map((p) => (
            <button key={p.id} type="button" title={`${p.title} — ${p.creator}`} onClick={() => setPhoto({ kind: "stock", id: p.id })} className={`aspect-square overflow-hidden rounded-lg ${photo?.kind === "stock" && photo.id === p.id ? sel : ""}`}><img src={p.url} alt={p.title} crossOrigin="anonymous" loading="lazy" className="size-full object-cover" /></button>
          ))}</div>
          {suggestions.length > 8 && <button type="button" className="text-xs font-medium text-primary underline" onClick={() => setShowAll((v) => !v)}>{showAll ? "Show fewer" : `Show all ${suggestions.length} photos`}</button>}
        </div>}
        {stock && (
          <label className="flex items-start gap-2 text-xs">
            <input type="checkbox" checked={showCredit || mustCredit} disabled={mustCredit} onChange={(e) => setShowCredit(e.target.checked)} className="mt-0.5" />
            <span>Show photo credit on poster{mustCredit ? " (required by this photo's licence)" : ""}</span>
          </label>
        )}
        <p className="flex items-center gap-1 text-xs text-muted-foreground"><ExternalLink className="size-3" />Free photos come from Openverse and Wikimedia Commons under CC0, public domain or CC BY licences.</p>
      </div>
    </div>
  );
}
