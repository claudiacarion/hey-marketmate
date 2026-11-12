// Poster Design Studio templates — 8 distinct designs drawn on <canvas>.
// Each works with a photo (stock or uploaded) or with no photo (colour only).
import { drawColourStyle, isColourStyle, type ColourStyleId } from "./colour-styles";
import { drawAiDesign, type AiDesignSpec } from "./ai-design";
import { drawCover, drawPoster, fit, shrinkFont, FORMATS, rgba, spaced, textOn, type PosterContent, type PosterFormat, type PosterLayout } from "./render";

export type TemplateId = "minimal" | "editorial" | "bold" | "luxury" | "playful" | "retro" | "organic" | "spotlight";
export type FontStyle = "auto" | "serif" | "sans" | "retro";
export const TEMPLATES: Record<TemplateId, { label: string; blurb: string; font: Exclude<FontStyle, "auto"> }> = {
  minimal: { label: "Minimalist", blurb: "Clean, lots of space", font: "sans" },
  editorial: { label: "Editorial", blurb: "Magazine-style", font: "serif" },
  bold: { label: "Bold & Modern", blurb: "Big type, strong shapes", font: "sans" },
  luxury: { label: "Elegant Luxury", blurb: "Refined and premium", font: "serif" },
  playful: { label: "Playful & Colourful", blurb: "Fun shapes, bright", font: "sans" },
  retro: { label: "Vintage & Retro", blurb: "Nostalgic, decorative", font: "retro" },
  organic: { label: "Organic & Natural", blurb: "Soft, earthy curves", font: "serif" },
  spotlight: { label: "Product Spotlight", blurb: "Your product up front", font: "sans" },
};
export const FONT_STYLES: Record<FontStyle, string> = { auto: "Template default", serif: "Serif", sans: "Sans", retro: "Retro" };
export const PALETTES: { name: string; primary: string; accent: string }[] = [
  { name: "Forest ink", primary: "#1f4f3f", accent: "#e8735a" },
  { name: "Warm clay", primary: "#8a4b2f", accent: "#f2c48d" },
  { name: "Midnight gold", primary: "#151a2d", accent: "#d6b25e" },
  { name: "Pastel bloom", primary: "#f6d6dc", accent: "#7b4f9e" },
  { name: "Electric pop", primary: "#2b2bd6", accent: "#ffdf3d" },
  { name: "Earthy sage", primary: "#6f7f5f", accent: "#efe4cf" },
  { name: "Charcoal & coral", primary: "#262626", accent: "#ff6b5b" },
  { name: "Ocean", primary: "#0f5c73", accent: "#9fe0d2" },
];

export type DesignContent = PosterContent & { productName?: string | undefined };
export type DesignStyle = { format: PosterFormat; layout: PosterLayout | TemplateId | ColourStyleId | "ai"; primary: string; accent: string; font?: FontStyle | undefined; aiSpec?: AiDesignSpec | null | undefined };
export const isTemplate = (l: string): l is TemplateId => l in TEMPLATES;

const SANS = '"Plus Jakarta Sans", system-ui, sans-serif';
const FAMILY = { serif: '"Fraunces", Georgia, serif', sans: SANS, retro: '"Abril Fatface", "Fraunces", Georgia, serif' };
const HEAD_WEIGHT = { serif: 700, sans: 800, retro: 400 };

export async function ensureDesignFonts() {
  if (typeof document === "undefined" || !document.fonts) return;
  await Promise.allSettled([`700 80px "Fraunces"`, `500 80px "Fraunces"`, `800 80px "Plus Jakarta Sans"`, `700 40px "Plus Jakarta Sans"`, `500 40px "Plus Jakarta Sans"`, `400 80px "Abril Fatface"`].map((f) => document.fonts.load(f)));
}

type Img = (CanvasImageSource & { width: number; height: number }) | null;

/** Draw any design: one of the 8 templates, or a classic layout. */
export function drawDesign(canvas: HTMLCanvasElement, img: Img, c: DesignContent, st: DesignStyle) {
  if (st.layout === "ai") { if (st.aiSpec) { drawAiDesign(canvas, c, st.format, st.aiSpec); return; } st = { ...st, layout: "c-minimal" }; }
  if (isColourStyle(st.layout)) { drawColourStyle(canvas, c, { format: st.format, layout: st.layout, primary: st.primary, accent: st.accent, font: st.font }); return; }
  if (!isTemplate(st.layout)) { drawPoster(canvas, img, c, { format: st.format, layout: st.layout as PosterLayout, primary: st.primary, accent: st.accent }); return; }
  const { w: W, h: H } = FORMATS[st.format];
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!; const u = W / 1080; const tall = H / W;
  const fs = !st.font || st.font === "auto" ? TEMPLATES[st.layout].font : st.font;
  const HF = (s: number, w = HEAD_WEIGHT[fs]) => `${w} ${s}px ${FAMILY[fs]}`;
  const P = st.primary, A = st.accent, pFg = textOn(P), aFg = textOn(A);
  const soft = (fg: string, a = 0.82) => (fg === "#ffffff" ? `rgba(255,255,255,${a})` : `rgba(20,20,20,${a})`);
  ctx.clearRect(0, 0, W, H); spaced(ctx, 0); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";

  const photo = (x: number, y: number, w: number, h: number, r = 0) => {
    ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.clip();
    if (img) drawCover(ctx, img, x, y, w, h);
    else { const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, P); g.addColorStop(1, A); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = rgba(aFg === "#ffffff" ? "#ffffff" : pFg, 0.14); for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x + w * (0.2 + i * 0.25), y + h * (i % 2 ? 0.3 : 0.7), Math.min(w, h) * 0.22, 0, Math.PI * 2); ctx.fill(); } }
    ctx.restore();
  };
  const blobPhoto = (cx: number, cy: number, r: number) => { ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 1.08, 0, 0, Math.PI * 2); ctx.clip(); photo(cx - r, cy - r * 1.08, r * 2, r * 2.16); ctx.restore(); };
  const text = (t: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = "left", ls = 0, maxW = align === "center" ? 2 * Math.min(x, W - x) - 40 * u : align === "right" ? x - 30 * u : W - x - 30 * u) => { ctx.fillStyle = color; ctx.textAlign = align; spaced(ctx, ls); ctx.font = shrinkFont(ctx, t, font, Math.max(40 * u, maxW)); ctx.fillText(t, x, y); spaced(ctx, 0); ctx.textAlign = "left"; };
  /** Wrapped text that fits inside a circle/badge of width w: up to `lines` lines, shrinking the font. */
  const badgeText = (t: string, cx: number, cy: number, w: number, color: string, lines = 4, max = 24 * u, weight = 800) => {
    const f = fit(ctx, t, (s) => `${weight} ${s}px ${SANS}`, w, lines, max, 13 * u); const lh = f.size * 1.18;
    f.lines.forEach((l, i) => text(l, cx, cy + (i - (f.lines.length - 1) / 2) * lh + f.size * 0.35, `${weight} ${f.size}px ${SANS}`, color, "center", 0, w * 1.05));
  };
  /** Wrapped block drawn top-down, returns the y below it. */
  const block = (t: string, x: number, y: number, w: number, font: (s: number) => string, color: string, max: number, min: number, lines: number, lh: number, align: CanvasTextAlign = "left", limit = Infinity) => {
    if (!t.trim()) return y;
    let f = fit(ctx, t.trim(), font, w, lines, max, min);
    // Shrink further (down to 55% of min) if the block would run past `limit`.
    for (let s = f.size - 2; y + f.size + (f.lines.length - 1) * f.size * lh > limit && s >= min * 0.55; s -= 2) f = fit(ctx, t.trim(), font, w, lines + 1, s, s); ctx.font = font(f.size); ctx.fillStyle = color; ctx.textAlign = align;
    const ax = align === "center" ? x + w / 2 : align === "right" ? x + w : x;
    let yy = y + f.size; for (const l of f.lines) { ctx.fillText(l, ax, yy); yy += f.size * lh; }
    ctx.textAlign = "left"; return yy - f.size * lh + f.size * 0.35;
  };
  const button = (t: string, x: number, y: number, size: number, bg: string, fg: string, align: "left" | "center" = "left", radius?: number, outline = false) => {
    if (!t.trim()) return 0;
    ctx.font = `700 ${size}px ${SANS}`; const w = ctx.measureText(t).width + size * 2.4, h = size * 2.4; const bx = align === "center" ? x - w / 2 : x;
    ctx.beginPath(); ctx.roundRect(bx, y, w, h, radius ?? h / 2);
    if (outline) { ctx.strokeStyle = bg; ctx.lineWidth = 3 * u; ctx.stroke(); } else { ctx.fillStyle = bg; ctx.fill(); }
    ctx.fillStyle = outline ? bg : fg; ctx.textBaseline = "middle"; ctx.fillText(t, bx + size * 1.2, y + h / 2 + size * 0.04); ctx.textBaseline = "alphabetic"; return h;
  };
  const credit = (color: string) => { if (!c.credit) return; text(c.credit.slice(0, 120), W - 28 * u, H - 22 * u, `500 ${17 * u}px ${SANS}`, color, "right"); };
  const name = c.businessName.trim().slice(0, 60), offer = c.offer.trim().slice(0, 60), cta = c.callToAction.trim().slice(0, 48);
  const prod = (c.productName ?? "").trim().slice(0, 50);

  switch (st.layout) {
    case "minimal": {
      const bg = "#fbfaf7"; ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      const pad = 90 * u, ph = H * (tall > 1.2 ? 0.46 : 0.36);
      photo(pad, pad + 60 * u, W - pad * 2, ph, 8 * u);
      text(name.toUpperCase(), pad, pad + 20 * u, `600 ${22 * u}px ${SANS}`, "#6b6b6b", "left", 8 * u, (W - pad * 2) * (offer ? 0.52 : 1));
      if (offer) text(offer.toUpperCase(), W - pad, pad + 20 * u, `700 ${22 * u}px ${SANS}`, A === bg ? P : A, "right", 4 * u, (W - pad * 2) * 0.44);
      let y = pad + 60 * u + ph + 60 * u;
      const lim = H - pad - (cta ? 70 : 20) * u;
      y = block(c.headline, pad, y, W - pad * 2, (s) => HF(s, fs === "sans" ? 600 : HEAD_WEIGHT[fs]), "#161616", 84 * u, 44 * u, 3, 1.1, "left", lim - 140 * u);
      ctx.fillStyle = A; ctx.fillRect(pad, y + 24 * u, 60 * u, 4 * u);
      y = block(c.supportingCopy, pad, y + 52 * u, W - pad * 2, (s) => `400 ${s}px ${SANS}`, "#4a4a4a", 30 * u, 22 * u, 3, 1.45, "left", lim);
      if (cta) text(`${cta}  →`, pad, H - pad, `700 ${30 * u}px ${SANS}`, P === bg ? "#161616" : P);
      credit("rgba(20,20,20,0.5)"); break;
    }
    case "editorial": {
      ctx.fillStyle = "#f3efe8"; ctx.fillRect(0, 0, W, H);
      const pw = W * 0.58; photo(W - pw, 0, pw, H);
      ctx.fillStyle = P; ctx.fillRect(0, 0, W - pw, H);
      const pad = 60 * u, cw = W - pw - pad * 1.6;
      text(name.toUpperCase(), pad, pad + 26 * u, `700 ${20 * u}px ${SANS}`, pFg, "left", 6 * u, cw);
      ctx.fillStyle = rgba(pFg, 0.4); ctx.fillRect(pad, pad + 48 * u, cw, 2 * u);
      text("Nº 01", pad, pad + 100 * u, HF(40 * u, 500), A);
      let y = H * 0.3;
      const lim = H - pad - (cta ? 100 : 20) * u;
      y = block(c.headline, pad, y, cw, (s) => HF(s), pFg, 76 * u, 38 * u, 6, 1.05, "left", lim - 200 * u);
      ctx.fillStyle = A; ctx.fillRect(pad, y + 26 * u, cw * 0.3, 3 * u);
      y = block(c.supportingCopy, pad, y + 54 * u, cw, (s) => `italic 400 ${s}px ${FAMILY.serif}`, soft(pFg), 28 * u, 20 * u, 6, 1.4, "left", lim);
      if (cta) { ctx.fillStyle = rgba(pFg, 0.4); ctx.fillRect(pad, H - pad - 70 * u, cw, 2 * u); text(cta.toUpperCase(), pad, H - pad - 20 * u, `700 ${22 * u}px ${SANS}`, pFg, "left", 4 * u, cw); }
      if (offer) { const r = 120 * u, cx = W - pw + r + 36 * u, cy = H - r - 60 * u; ctx.fillStyle = A; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        badgeText(offer.toUpperCase(), cx, cy, r * 1.45, aFg, 4); }
      credit("rgba(255,255,255,0.8)"); break;
    }
    case "bold": {
      ctx.fillStyle = P; ctx.fillRect(0, 0, W, H);
      const ph = H * (tall > 1.2 ? 0.45 : 0.34); photo(0, 0, W, ph);
      ctx.fillStyle = P; ctx.beginPath(); ctx.moveTo(0, ph - 120 * u); ctx.lineTo(W, ph + 40 * u); ctx.lineTo(W, ph + 200 * u); ctx.lineTo(0, ph + 200 * u); ctx.fill();
      ctx.fillStyle = A; ctx.beginPath(); ctx.moveTo(0, ph - 120 * u); ctx.lineTo(W, ph + 40 * u); ctx.lineTo(W, ph + 64 * u); ctx.lineTo(0, ph - 96 * u); ctx.fill();
      const pad = 70 * u;
      ctx.fillStyle = A; ctx.fillRect(pad, pad, 0, 0);
      text(name.toUpperCase(), pad, pad + 24 * u, `800 ${26 * u}px ${SANS}`, img ? "#ffffff" : pFg, "left", 4 * u, offer ? W * 0.4 : W - pad * 2);
      let y = ph + 80 * u;
      const lim = H - pad - (cta ? 110 : 20) * u;
      y = block(c.headline.toUpperCase(), pad, y, W - pad * 2, (s) => HF(s), pFg, (tall > 1.3 ? 120 : 84) * u, 46 * u, tall > 1.2 ? 4 : 3, 0.98, "left", lim - 120 * u);
      y = block(c.supportingCopy, pad, y + 30 * u, W - pad * 2, (s) => `600 ${s}px ${SANS}`, soft(pFg), 30 * u, 22 * u, 3, 1.35, "left", lim);
      const by = H - pad - 80 * u; button(cta, pad, by, 32 * u, A, aFg, "left", 0);
      if (offer) { ctx.save(); ctx.translate(W - pad - 10 * u, pad + 70 * u); ctx.rotate(-0.12); ctx.font = shrinkFont(ctx, offer.toUpperCase(), `800 ${34 * u}px ${SANS}`, W * 0.46); const w = ctx.measureText(offer.toUpperCase()).width + 60 * u;
        ctx.fillStyle = A; ctx.fillRect(-w, -40 * u, w, 80 * u); ctx.fillStyle = aFg; ctx.textAlign = "right"; ctx.textBaseline = "middle"; ctx.fillText(offer.toUpperCase(), -30 * u, 2 * u); ctx.restore(); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; }
      credit(soft(pFg, 0.6)); break;
    }
    case "luxury": {
      const bg = "#14120f", gold = A; ctx.fillStyle = P === "#ffffff" ? bg : P; ctx.fillRect(0, 0, W, H);
      const fg = textOn(P === "#ffffff" ? bg : P);
      const m = 40 * u; ctx.strokeStyle = gold; ctx.lineWidth = 2 * u; ctx.strokeRect(m, m, W - m * 2, H - m * 2); ctx.strokeRect(m + 12 * u, m + 12 * u, W - m * 2 - 24 * u, H - m * 2 - 24 * u);
      text(name.toUpperCase(), W / 2, m + 90 * u, `500 ${22 * u}px ${SANS}`, gold, "center", 12 * u, W - 2 * m - 100 * u);
      const pw = W * (tall > 1.2 ? 0.56 : 0.3), ph = Math.min(H * 0.42, pw * 1.25), px = (W - pw) / 2, py = m + (tall > 1.2 ? 130 : 110) * u;
      ctx.save(); ctx.beginPath(); ctx.moveTo(px, py + ph); ctx.lineTo(px, py + pw / 2); ctx.arc(px + pw / 2, py + pw / 2, pw / 2, Math.PI, 0); ctx.lineTo(px + pw, py + ph); ctx.closePath(); ctx.clip(); photo(px, py, pw, ph); ctx.restore();
      ctx.strokeStyle = gold; ctx.beginPath(); ctx.moveTo(px - 14 * u, py + ph + 14 * u); ctx.lineTo(px - 14 * u, py + pw / 2); ctx.arc(px + pw / 2, py + pw / 2, pw / 2 + 14 * u, Math.PI, 0); ctx.lineTo(px + pw + 14 * u, py + ph + 14 * u); ctx.stroke();
      let y = py + ph + 60 * u; const cw = W - 220 * u;
      y = block(c.headline, 110 * u, y, cw, (s) => HF(s, fs === "sans" ? 500 : fs === "retro" ? 400 : 500), fg, (tall > 1.2 ? 70 : 56) * u, 34 * u, tall > 1.2 ? 3 : 2, 1.1, "center");
      ctx.fillStyle = gold; ctx.save(); ctx.translate(W / 2, y + 30 * u); ctx.rotate(Math.PI / 4); ctx.fillRect(-6 * u, -6 * u, 12 * u, 12 * u); ctx.restore();
      ctx.fillRect(W / 2 - 120 * u, y + 29 * u, 90 * u, 1.5 * u); ctx.fillRect(W / 2 + 30 * u, y + 29 * u, 90 * u, 1.5 * u);
      y = block(c.supportingCopy, 140 * u, y + 56 * u, W - 280 * u, (s) => `400 ${s}px ${SANS}`, soft(fg, 0.75), 26 * u, 19 * u, tall > 1.2 ? 3 : 2, 1.5, "center", H - m - (offer ? 170 : 130) * u);
      const ly = Math.min(H - m - 120 * u, y + (tall > 1.2 ? 110 : 56) * u);
      if (offer) text(offer.toUpperCase(), W / 2, ly, `600 ${22 * u}px ${SANS}`, gold, "center", 6 * u, W - 2 * m - 80 * u);
      button(cta.toUpperCase(), W / 2, ly + 30 * u, 22 * u, gold, aFg, "center", 0, true);
      credit(soft(fg, 0.5)); break;
    }
    case "playful": {
      ctx.fillStyle = A; ctx.fillRect(0, 0, W, H);
      const shapes: [string, number, number, number][] = [[P, 0.1, 0.08, 180], ["#ffffff", 0.95, 0.2, 120], [P, 0.88, 0.95, 220], ["#ffffff", 0.05, 0.75, 90]];
      for (const [col, x, y, r] of shapes) { ctx.fillStyle = rgba(col, col === P ? 0.85 : 0.5); ctx.beginPath(); ctx.arc(W * x, H * y, r * u, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = P; ctx.lineWidth = 10 * u; ctx.lineCap = "round"; ctx.beginPath(); for (let i = 0; i <= 6; i++) { const x = W * 0.55 + i * 40 * u, y = 110 * u + (i % 2 ? 26 : -26) * u; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke();
      const pad = 70 * u, r = Math.min(W, H) * (tall > 1.2 ? 0.29 : 0.2), cy = 140 * u + r;
      ctx.save(); ctx.translate(W / 2, cy); ctx.rotate(-0.05); ctx.fillStyle = P; ctx.beginPath(); ctx.roundRect(-r - 16 * u, -r - 16 * u, r * 2 + 32 * u, r * 2 + 32 * u, 90 * u); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(W / 2, cy); ctx.rotate(0.04); photo(-r, -r, r * 2, r * 2, 80 * u); ctx.restore();
      text(name, pad, 80 * u, `800 ${30 * u}px ${SANS}`, aFg, "left", 0, W * 0.48 - pad);
      let y = cy + r + 50 * u;
      const lim = H - pad - (cta ? 116 : 20) * u;
      y = block(c.headline, pad, y, W - pad * 2, (s) => HF(s), aFg, 92 * u, 46 * u, 3, 1.02, "center", lim - 90 * u);
      y = block(c.supportingCopy, pad + 30 * u, y + 24 * u, W - pad * 2 - 60 * u, (s) => `600 ${s}px ${SANS}`, soft(aFg, 0.85), 28 * u, 20 * u, 2, 1.35, "center", lim);
      button(cta, W / 2, Math.min(H - pad - 76 * u, y + 40 * u), 30 * u, P, pFg, "center");
      if (offer) { ctx.save(); ctx.translate(W / 2 + r * 0.8, cy - r * 0.85); ctx.rotate(0.18); const f = fit(ctx, offer, (z) => `800 ${z}px ${SANS}`, 150 * u, 4, 26 * u, 13 * u); const s = f.size, ls = f.lines; ctx.font = `800 ${s}px ${SANS}`; const R = 108 * u;
        ctx.fillStyle = "#ffffff"; ctx.beginPath(); for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, rr = i % 2 ? R : R * 0.86; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.fill();
        ctx.fillStyle = "#141414"; ctx.textAlign = "center"; ls.forEach((l, i) => ctx.fillText(l, 0, (i - (ls.length - 1) / 2) * s * 1.15 + s * 0.35)); ctx.restore(); ctx.textAlign = "left"; }
      credit(soft(aFg, 0.6)); break;
    }
    case "retro": {
      const cream = "#f2e6cf", ink = P; ctx.fillStyle = cream; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = rgba(ink, 0.05); for (let y = 0; y < H; y += 14 * u) ctx.fillRect(0, y, W, 6 * u);
      const cx = W / 2, top = H * 0.08; const ray = Math.max(W, H);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H * 0.55); ctx.clip(); ctx.translate(cx, H * 0.55);
      for (let i = 0; i < 18; i++) { ctx.fillStyle = i % 2 ? rgba(A, 0.35) : "rgba(0,0,0,0)"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, ray, Math.PI + (i * Math.PI) / 18, Math.PI + ((i + 1) * Math.PI) / 18); ctx.fill(); } ctx.restore();
      const r = W * (tall > 1.2 ? 0.25 : 0.13); ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(cx, top + r + 30 * u, r + 18 * u, 0, Math.PI * 2); ctx.fill();
      blobPhoto(cx, top + r + 30 * u, r);
      const m = 30 * u; ctx.strokeStyle = ink; ctx.lineWidth = 6 * u; ctx.strokeRect(m, m, W - m * 2, H - m * 2);
      for (const [x, y] of [[m, m], [W - m, m], [m, H - m], [W - m, H - m]] as const) { ctx.fillStyle = A; ctx.beginPath(); ctx.arc(x, y, 18 * u, 0, Math.PI * 2); ctx.fill(); }
      const bw = W * 0.7, by = top + r * 2 + 50 * u; ctx.fillStyle = A; ctx.beginPath(); ctx.moveTo(cx - bw / 2 - 40 * u, by); ctx.lineTo(cx + bw / 2 + 40 * u, by); ctx.lineTo(cx + bw / 2 + 10 * u, by + 35 * u); ctx.lineTo(cx + bw / 2 + 40 * u, by + 70 * u); ctx.lineTo(cx - bw / 2 - 40 * u, by + 70 * u); ctx.lineTo(cx - bw / 2 - 10 * u, by + 35 * u); ctx.fill();
      text(`★ ${name.toUpperCase()} ★`, cx, by + 46 * u, `800 ${26 * u}px ${SANS}`, aFg, "center", 4 * u, bw);
      let y = by + 100 * u;
      y = block(c.headline, 90 * u, y, W - 180 * u, (s) => HF(s), ink, 96 * u, 44 * u, 3, 1.0, "center");
      y = block(c.supportingCopy, 120 * u, y + 20 * u, W - 240 * u, (s) => `600 ${s}px ${SANS}`, rgba(ink, 0.85), 27 * u, 20 * u, 2, 1.35, "center", H - m - (offer ? 230 : 150) * u);
      if (offer) { const sy = Math.min(H - 220 * u, y + 30 * u); ctx.strokeStyle = ink; ctx.lineWidth = 3 * u; ctx.setLineDash([10 * u, 8 * u]); const of = shrinkFont(ctx, offer.toUpperCase(), `800 ${28 * u}px ${SANS}`, W - 2 * m - 140 * u); ctx.font = of; const w = ctx.measureText(offer.toUpperCase()).width + 70 * u; ctx.strokeRect(cx - w / 2, sy, w, 64 * u); ctx.setLineDash([]); text(offer.toUpperCase(), cx, sy + 43 * u, of, ink, "center"); }
      button(cta.toUpperCase(), cx, H - m - 120 * u, 26 * u, ink, textOn(ink), "center", 8 * u);
      credit(rgba(ink, 0.6)); break;
    }
    case "organic": {
      const bg = "#f1ebdf"; ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      const wave = (y0: number, amp: number, col: string) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, y0); ctx.bezierCurveTo(W * 0.3, y0 - amp, W * 0.6, y0 + amp, W, y0 - amp * 0.4); ctx.lineTo(W, H); ctx.fill(); };
      ctx.fillStyle = rgba(A, 0.45); ctx.beginPath(); ctx.ellipse(W * 0.85, H * 0.12, 260 * u, 200 * u, 0.4, 0, Math.PI * 2); ctx.fill();
      const r = W * (tall > 1.2 ? 0.26 : 0.14), cx = W * 0.5, cy = H * 0.07 + r * 1.1;
      ctx.save(); ctx.beginPath(); ctx.moveTo(cx, cy - r * 1.1); ctx.bezierCurveTo(cx + r * 1.2, cy - r * 1.2, cx + r * 1.2, cy + r, cx + r * 0.2, cy + r * 1.05); ctx.bezierCurveTo(cx - r * 0.8, cy + r * 1.2, cx - r * 1.25, cy + r * 0.2, cx - r * 0.9, cy - r * 0.5); ctx.bezierCurveTo(cx - r * 0.7, cy - r, cx - r * 0.3, cy - r * 1.1, cx, cy - r * 1.1); ctx.clip();
      photo(cx - r * 1.3, cy - r * 1.2, r * 2.6, r * 2.4); ctx.restore();
      const wy = cy + r * 1.05; wave(wy + 40 * u, 60 * u, rgba(P, 0.25)); wave(wy + 80 * u, 50 * u, P);
      // leaf
      ctx.fillStyle = A; ctx.save(); ctx.translate(110 * u, 120 * u); ctx.rotate(-0.6); ctx.beginPath(); ctx.ellipse(0, 0, 60 * u, 22 * u, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      const pad = 90 * u;
      // Business name sits on the wave, clear of the photo blob.
      text(name, W / 2, wy + 112 * u, HF(30 * u, fs === "sans" ? 700 : HEAD_WEIGHT[fs]), soft(pFg, 0.9), "center", 0, W - pad * 2);
      let y = wy + 150 * u;
      const btnTop = H - pad - 70 * u, offerY = btnTop - 34 * u; const lim = offer ? offerY - 56 * u : btnTop - 30 * u;
      y = block(c.headline, pad, y, W - pad * 2, (s) => HF(s, fs === "serif" ? 600 : HEAD_WEIGHT[fs]), pFg, 80 * u, 40 * u, 3, 1.08, "center", lim - 80 * u);
      y = block(c.supportingCopy, pad + 20 * u, y + 20 * u, W - pad * 2 - 40 * u, (s) => `500 ${s}px ${SANS}`, soft(pFg), 27 * u, 20 * u, 2, 1.4, "center", lim);
      if (offer) text(`~ ${offer} ~`, W / 2, Math.min(offerY, y + 78 * u), `italic 500 ${30 * u}px ${FAMILY.serif}`, A, "center", 0, W - pad * 2);
      button(cta, W / 2, H - pad - 70 * u, 28 * u, A, aFg, "center");
      credit(soft(pFg, 0.55)); break;
    }
    case "spotlight": {
      const fg = pFg; ctx.fillStyle = P; ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W / 2, H * 0.36, 40 * u, W / 2, H * 0.36, W * 0.75); g.addColorStop(0, rgba(A, 0.55)); g.addColorStop(1, rgba(P, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const pad = 70 * u, cardW = W * 0.68, cardH = Math.min(H * (tall > 1.2 ? 0.48 : 0.36), cardW * 1.05), cx = (W - cardW) / 2, cy = 140 * u;
      ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.beginPath(); ctx.roundRect(cx + 14 * u, cy + 24 * u, cardW, cardH, 36 * u); ctx.fill();
      ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.roundRect(cx - 14 * u, cy - 14 * u, cardW + 28 * u, cardH + 28 * u, 44 * u); ctx.fill();
      photo(cx, cy, cardW, cardH, 32 * u);
      text(name.toUpperCase(), W / 2, 84 * u, `700 ${22 * u}px ${SANS}`, soft(fg, 0.85), "center", 8 * u, offer ? W * 0.5 : W - pad * 2);
      if (offer) { const R = 96 * u, ox = cx + cardW + 4 * u, oy = cy + 20 * u; ctx.fillStyle = A; ctx.beginPath(); ctx.arc(ox, oy, R, 0, Math.PI * 2); ctx.fill(); badgeText(offer.toUpperCase(), ox, oy, R * 1.45, aFg, 4); }
      let y = cy + cardH + 50 * u;
      if (prod) { text(prod.toUpperCase(), W / 2, y + 26 * u, `700 ${24 * u}px ${SANS}`, A === P ? fg : A, "center", 5 * u, W - pad * 2); y += 50 * u; }
      const lim = H - pad - (cta ? 104 : 20) * u;
      y = block(c.headline, pad, y, W - pad * 2, (s) => HF(s), fg, 80 * u, 40 * u, 2, 1.04, "center", lim - 80 * u);
      y = block(c.supportingCopy, pad + 30 * u, y + 16 * u, W - pad * 2 - 60 * u, (s) => `500 ${s}px ${SANS}`, soft(fg), 26 * u, 19 * u, 2, 1.4, "center", lim);
      button(cta, W / 2, Math.min(H - pad - 64 * u, y + 34 * u), 28 * u, A, aFg, "center");
      credit(soft(fg, 0.55)); break;
    }
  }
}
