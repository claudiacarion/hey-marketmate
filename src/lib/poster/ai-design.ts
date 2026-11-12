// "Design with AI": Gemini (via the design-poster Edge Function) returns a design spec;
// this file validates it and draws it on <canvas>. Colour + typography only — no images or illustrations.
import { FORMATS, rgba, textOn, type PosterFormat } from "./render";
import { FAMILY, grain, SANS, textKit } from "./colour-styles";
import type { DesignContent } from "./templates";

type Align = "left" | "center" | "right";
type Box = { x: number; y: number; w: number; align: Align; color: string };
export type AiDesignSpec = {
  name: string; rationale: string;
  background: { type: "solid" | "linear" | "radial"; colors: string[]; angle: number };
  texture: "none" | "grain" | "lines";
  panels: { x: number; y: number; w: number; h: number; color: string; opacity: number; radius: number }[];
  rules: { x: number; y: number; w: number; color: string; thickness: number }[];
  frame: { inset: number; color: string; double: boolean } | null;
  typography: { heading: "serif" | "sans" | "display"; headingWeight: number; uppercase: boolean; scale: number; tracking: number; body: "sans" | "serif" };
  brand: Box & { uppercase: boolean };
  headline: Box;
  supporting: Box;
  offer: Box & { style: "pill" | "box" | "text"; bg: string };
  cta: Omit<Box, "w"> & { style: "pill" | "box" | "outline" | "underline"; bg: string; fg: string };
  productName: Box;
};

const HEX = /^#[0-9a-f]{6}$/i;
const num = (v: unknown, lo: number, hi: number, d: number) => { const n = typeof v === "number" && isFinite(v) ? v : d; return Math.min(hi, Math.max(lo, n)); };
const col = (v: unknown, d: string) => (typeof v === "string" && HEX.test(v.trim()) ? v.trim().toLowerCase() : d);
const pick = <T extends string>(v: unknown, opts: readonly T[], d: T): T => (opts.includes(v as T) ? (v as T) : d);
const obj = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

/** Turn whatever the AI returned into a safe, complete spec. */
export function sanitizeSpec(raw: unknown, fallback: { primary: string; accent: string }): AiDesignSpec {
  const r = obj(raw); const P = col(fallback.primary, "#1f4f3f"), A = col(fallback.accent, "#e8735a");
  const bg = obj(r.background); const colors = (Array.isArray(bg.colors) ? bg.colors : []).map((c) => col(c, "")).filter(Boolean).slice(0, 3);
  const base = colors[0] ?? P; const fg = textOn(base);
  const box = (v: unknown, d: Partial<Box>): Box => { const b = obj(v); return { x: num(b.x, 0, 0.9, d.x ?? 0.08), y: num(b.y, 0, 0.95, d.y ?? 0.1), w: num(b.w, 0.1, 1, d.w ?? 0.84), align: pick(b.align, ["left", "center", "right"] as const, d.align ?? "left"), color: col(b.color, d.color ?? fg) }; };
  const t = obj(r.typography); const fr = r.frame ? obj(r.frame) : null; const o = obj(r.offer), c = obj(r.cta);
  return {
    name: String(r.name ?? "AI design").slice(0, 60), rationale: String(r.rationale ?? "").slice(0, 300),
    background: { type: pick(bg.type, ["solid", "linear", "radial"] as const, "linear"), colors: colors.length ? colors : [P, A], angle: num(bg.angle, 0, 360, 135) },
    texture: pick(r.texture, ["none", "grain", "lines"] as const, "none"),
    panels: (Array.isArray(r.panels) ? r.panels : []).slice(0, 4).map((p) => { const q = obj(p); return { x: num(q.x, -0.2, 1, 0), y: num(q.y, -0.2, 1, 0), w: num(q.w, 0, 1.2, 0.5), h: num(q.h, 0, 1.2, 0.3), color: col(q.color, A), opacity: num(q.opacity, 0.05, 1, 1), radius: num(q.radius, 0, 0.5, 0) }; }),
    rules: (Array.isArray(r.rules) ? r.rules : []).slice(0, 3).map((p) => { const q = obj(p); return { x: num(q.x, 0, 1, 0.08), y: num(q.y, 0, 1, 0.5), w: num(q.w, 0.02, 1, 0.2), color: col(q.color, fg), thickness: num(q.thickness, 1, 12, 3) }; }),
    frame: fr ? { inset: num(fr.inset, 0.01, 0.1, 0.05), color: col(fr.color, fg), double: !!fr.double } : null,
    typography: { heading: pick(t.heading, ["serif", "sans", "display"] as const, "serif"), headingWeight: Math.round(num(t.headingWeight, 300, 800, 700) / 100) * 100, uppercase: !!t.uppercase, scale: num(t.scale, 0.6, 1.4, 1), tracking: num(t.tracking, -0.05, 0.3, 0), body: pick(t.body, ["sans", "serif"] as const, "sans") },
    brand: { ...box(r.brand, { x: 0.08, y: 0.06, w: 0.84 }), uppercase: obj(r.brand).uppercase !== false },
    headline: box(r.headline, { y: 0.3 }),
    supporting: box(r.supporting, { y: 0.6, w: 0.7 }),
    offer: { ...box(o, { y: 0.22, color: textOn(A) }), style: pick(o.style, ["pill", "box", "text"] as const, "pill"), bg: col(o.bg, A) },
    cta: { x: num(c.x, 0, 0.95, 0.08), y: num(c.y, 0, 0.95, 0.85), align: pick(c.align, ["left", "center", "right"] as const, "left"), color: col(c.color, fg), style: pick(c.style, ["pill", "box", "outline", "underline"] as const, "pill"), bg: col(c.bg, A), fg: col(c.fg, textOn(col(c.bg, A))) },
    productName: box(r.productName, { y: 0.24 }),
  };
}

export function drawAiDesign(canvas: HTMLCanvasElement, c: DesignContent, format: PosterFormat, s: AiDesignSpec) {
  const { w: W, h: H } = FORMATS[format]; canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!; const u = W / 1080; const sq = H / W < 1.15; const K = textKit(ctx, u);
  ctx.clearRect(0, 0, W, H); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  const cs = s.background.colors;
  if (s.background.type === "solid" || cs.length < 2) { ctx.fillStyle = cs[0]!; }
  else if (s.background.type === "radial") { const g = ctx.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.4, Math.max(W, H) * 0.8); cs.forEach((x, i) => g.addColorStop(i / (cs.length - 1), x)); ctx.fillStyle = g; }
  else { const a = (s.background.angle * Math.PI) / 180, R = Math.hypot(W, H) / 2, dx = Math.cos(a) * R, dy = Math.sin(a) * R; const g = ctx.createLinearGradient(W / 2 - dx, H / 2 - dy, W / 2 + dx, H / 2 + dy); cs.forEach((x, i) => g.addColorStop(i / (cs.length - 1), x)); ctx.fillStyle = g; }
  ctx.fillRect(0, 0, W, H);
  for (const p of s.panels) { ctx.fillStyle = rgba(p.color, p.opacity); ctx.beginPath(); ctx.roundRect(p.x * W, p.y * H, p.w * W, p.h * H, p.radius * Math.min(p.w * W, p.h * H)); ctx.fill(); }
  if (s.texture === "grain") grain(ctx, W, H, 0.06);
  if (s.texture === "lines") { ctx.fillStyle = rgba(textOn(cs[0]!), 0.05); for (let y = 0; y < H; y += 14 * u) ctx.fillRect(0, y, W, Math.max(1, u)); }
  if (s.frame) { const m = s.frame.inset * W; ctx.strokeStyle = s.frame.color; ctx.lineWidth = 2 * u; ctx.strokeRect(m, m, W - m * 2, H - m * 2); if (s.frame.double) { ctx.lineWidth = u; ctx.strokeRect(m + 14 * u, m + 14 * u, W - m * 2 - 28 * u, H - m * 2 - 28 * u); } }
  for (const r of s.rules) { ctx.fillStyle = r.color; ctx.fillRect(r.x * W, r.y * H, r.w * W, r.thickness * u); }

  const T = s.typography; const fam = T.heading === "display" ? FAMILY.retro : T.heading === "sans" ? FAMILY.sans : FAMILY.serif;
  const wt = T.heading === "display" ? 400 : T.headingWeight; const body = T.body === "serif" ? FAMILY.serif : SANS;
  const bx = (b: Box) => { const w = Math.min(b.w, 1 - b.x) * W; return { x: b.x * W, w }; };
  const margin = 50 * u;
  // brand
  const name = c.businessName.trim().slice(0, 40); { const b = bx(s.brand); K.line(s.brand.uppercase ? name.toUpperCase() : name, s.brand.align === "center" ? b.x + b.w / 2 : s.brand.align === "right" ? b.x + b.w : b.x, s.brand.y * H + 24 * u, `700 ${24 * u}px ${SANS}`, s.brand.color, s.brand.align, (s.brand.uppercase ? 6 : 0) * u); }
  // offer / product name
  const offer = c.offer.trim().slice(0, 48);
  if (offer) { const b = bx(s.offer); const ax = s.offer.align === "center" ? b.x + b.w / 2 : s.offer.align === "right" ? b.x + b.w : b.x;
    if (s.offer.style === "text") K.line(offer.toUpperCase(), ax, s.offer.y * H + 24 * u, `700 ${24 * u}px ${SANS}`, s.offer.bg, s.offer.align, 4 * u);
    else K.button(offer, ax, s.offer.y * H, 26 * u, s.offer.bg, s.offer.color, s.offer.style, s.offer.align); }
  const prod = (c.productName ?? "").trim().slice(0, 50);
  if (prod) { const b = bx(s.productName); K.line(prod, s.productName.align === "center" ? b.x + b.w / 2 : s.productName.align === "right" ? b.x + b.w : b.x, s.productName.y * H + 28 * u, `italic 500 ${28 * u}px ${FAMILY.serif}`, s.productName.color, s.productName.align); }
  // headline → supporting → CTA flow downward so text never overlaps
  const hb = bx(s.headline); const head = T.uppercase ? c.headline.trim().toUpperCase() : c.headline.trim();
  const hm = K.measure(head, (z) => `${wt} ${z}px ${fam}`, hb.w, sq ? 3 : 4, (sq ? 100 : 118) * u * T.scale, 40 * u, 1.04);
  const sb = bx(s.supporting); const sm = K.measure(c.supportingCopy.trim(), (z) => `400 ${z}px ${body}`, sb.w, 3, 30 * u, 20 * u, 1.5);
  const ctaH = c.callToAction.trim() ? 28 * u * 2.5 : 0;
  let hy = s.headline.y * H; const need = hm.h + 40 * u + sm.h + (ctaH ? 50 * u + ctaH : 0);
  if (hy + need > H - margin) hy = Math.max(margin + 60 * u, H - margin - need);
  let y = K.draw(hm, hb.x, hy, hb.w, s.headline.color, s.headline.align, T.tracking * hm.size);
  y = K.draw(sm, sb.x, Math.max(y + 40 * u, Math.min(s.supporting.y * H, H - margin - sm.h - (ctaH ? 50 * u + ctaH : 0))), sb.w, s.supporting.color, s.supporting.align);
  const cta = c.callToAction.trim().slice(0, 40);
  if (cta) { const cy = Math.min(H - margin - ctaH, Math.max(y + 50 * u, s.cta.y * H)); const ax = s.cta.align === "center" ? W / 2 : s.cta.align === "right" ? W - s.cta.x * W : s.cta.x * W;
    K.button(cta, ax, cy, 28 * u, s.cta.style === "outline" || s.cta.style === "underline" ? s.cta.color : s.cta.bg, s.cta.fg, s.cta.style, s.cta.align); }
}
