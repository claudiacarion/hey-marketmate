import { useRef, useState } from "react";
import { Download, FileText, Loader2, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { CampaignPlan } from "@/lib/campaign-types";

type Promo = NonNullable<CampaignPlan["promotionalMaterial"]>;

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "poster";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

// Decorative QR-style pattern (not scannable) derived from text.
function QrPattern({ seed }: { seed: string }) {
  let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const n = 11; const cells: boolean[] = [];
  for (let i = 0; i < n * n; i++) { h = (h * 1103515245 + 12345) >>> 0; cells.push((h >>> 16) % 2 === 0); }
  const finder = (x: number, y: number) => (x < 3 && y < 3) || (x >= n - 3 && y < 3) || (x < 3 && y >= n - 3);
  return (
    <div className="grid size-20 gap-px rounded-md bg-card p-1.5" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
      {cells.map((on, i) => { const x = i % n, y = Math.floor(i / n); return <div key={i} className={(finder(x, y) || on) ? "bg-primary" : ""} />; })}
    </div>
  );
}

export function PromoPoster({ promo, businessName, showQr = true }: { promo: Promo; businessName: string; showQr?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<null | "png" | "pdf">(null);
  const [qr, setQr] = useState(showQr);

  const render = async () => {
    const { default: html2canvas } = await import("html2canvas-pro");
    if (!ref.current) throw new Error("no poster");
    return html2canvas(ref.current, { scale: 3, backgroundColor: null, useCORS: true });
  };
  const name = `${slug(businessName)}-${slug(promo.headline)}`;

  const png = async () => {
    setBusy("png");
    try { const c = await render(); const b = await new Promise<Blob>((r, j) => c.toBlob((x) => (x ? r(x) : j(new Error("empty"))), "image/png")); downloadBlob(b, `${name}.png`); toast.success("Poster downloaded"); }
    catch (e) { console.error(e); toast.error("Couldn't create the image. Please try again."); }
    finally { setBusy(null); }
  };
  const pdf = async () => {
    setBusy("pdf");
    try {
      const c = await render();
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pw = 210, ph = 297, m = 12; const ratio = c.width / c.height;
      let w = pw - m * 2, h = w / ratio; if (h > ph - m * 2) { h = ph - m * 2; w = h * ratio; }
      doc.addImage(c.toDataURL("image/jpeg", 0.92), "JPEG", (pw - w) / 2, (ph - h) / 2, w, h);
      downloadBlob(doc.output("blob"), `${name}.pdf`); toast.success("Print-ready PDF downloaded");
    } catch (e) { console.error(e); toast.error("Couldn't create the PDF. Please try again."); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-3">
      <div ref={ref} data-poster className="relative mx-auto aspect-[1/1.414] w-full max-w-md overflow-hidden rounded-2xl bg-hero p-8 text-primary-foreground shadow-lift">
        <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-accent/40" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 size-48 rounded-full bg-primary-foreground/10" />
        <div className="relative flex h-full flex-col">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] opacity-80">{businessName}</p>
          <span className="mt-6 self-start rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-accent-foreground shadow-soft">{promo.offer}</span>
          <h4 className="mt-5 font-display text-4xl font-semibold leading-[1.05]">{promo.headline}</h4>
          <p className="mt-4 text-sm leading-relaxed opacity-90">{promo.supportingCopy}</p>
          <div className="mt-auto flex items-end justify-between gap-4 pt-6">
            <p className="rounded-xl bg-primary-foreground px-4 py-2.5 text-sm font-bold text-primary">{promo.callToAction}</p>
            {qr && <QrPattern seed={promo.headline + businessName} />}
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-md flex-wrap items-center gap-2">
        <Button onClick={png} disabled={!!busy} className="rounded-xl">{busy === "png" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}Download PNG</Button>
        <Button onClick={pdf} disabled={!!busy} variant="outline" className="rounded-xl">{busy === "pdf" ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}Download PDF (A4)</Button>
        <Button onClick={() => setQr((v) => !v)} variant="ghost" size="sm"><QrCode className="size-4" />{qr ? "Hide" : "Show"} QR</Button>
      </div>
      {qr && <p className="mx-auto max-w-md text-xs text-muted-foreground">The QR pattern is decorative — replace it with your own code before printing.</p>}
    </div>
  );
}
