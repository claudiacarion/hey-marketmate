// Colour-only poster styles: no photos, illustrations or icons — colour, gradients,
// colour blocking, typography and fine geometry only. Drawn on <canvas> so the PNG matches the preview.
import { fit, FORMATS, hexToRgb, rgba, spaced, textOn, type PosterFormat } from "./render";
import type { DesignContent, FontStyle } from "./templates";

export type ColourStyleId = "c-minimal" | "c-block" | "c-gradient" | "c-editorial" | "c-type" | "c-soft" | "c-retro" | "c-luxury";
export const COLOUR_STYLES: Record<ColourStyleId, { label: string; blurb: string; font: Exclude<FontStyle, "auto"> }> = {
  "c-minimal": { label: "Modern Minimal", blurb: "Clean type, generous space", font: "sans" },
  "c-block": { label: "Colour Block", blurb: "Bold blocks, asymmetric", font: "sans" },
  "c-gradient": { label: "Gradient Flow", blurb: "Full gradient, elegant type", font: "serif" },
  "c-editorial": { label: "Editorial", blurb: "Magazine typography", font: "serif" },
  "c-type": { label: "Bold Typography", blurb: "Oversized, high contrast", font: "sans" },
  "c-soft": { label: "Soft & Elegant", blurb: "Muted, calm, refined", font: "serif" },
  "c-retro": { label: "Retro Modern", blurb: "Vintage stripes, bold type", font: "retro" },
  "c-luxury": { label: "Luxury Minimal", blurb: "Fine borders, premium", font: "serif" },
};
export const isColourStyle = (l: string): l is ColourStyleId => l in COLOUR_STYLES;

export const SANS = '"Plus Jakarta Sans", system-ui, sans-serif';
export const FAMILY = { serif: '"Fraunces", Georgia, serif', sans: SANS, retro: '"Abril Fatface", "Fraunces", Georgia, serif' } as const;
export const HEAD_WEIGHT = { serif: 700, sans: 800, retro: 400 } as const;

const hex = (r: number, g: number, b: number) => "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
/** Blend colour a toward b by t (0..1). */
export function mix(a: string, b: string, t: number) { const [r1, g1, b1] = hexToRgb(a), [r2, g2, b2] = hexToRgb(b); return hex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t); }
const lum = (h: string) => { const [r, g, b] = hexToRgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };

type Ctx = CanvasRenderingContext2D;
/** Subtle film-grain texture (deterministic, so preview and PNG match). */
export function grain(ctx: Ctx, W: number, H: number, alpha = 0.05) {
  if (typeof document === "undefined") return;
  const t = document.createElement("canvas"); t.width = t.height = 160; const tc = t.getContext("2d"); if (!tc) return;
  const d = tc.createImageData(160, 160); let s = 7;
  for (let i = 0; i < d.data.length; i += 4) { s = (s * 16807) % 2147483647; const v = s % 256; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255 * alpha; }
  tc.putImageData(d, 0, 0); const p = ctx.createPattern(t, "repeat"); if (!p) return;
  ctx.save(); ctx.globalCompositeOperation = "overlay"; ctx.fillStyle = p; ctx.fillRect(0, 0, W, H); ctx.restore();
}

/** Shared text helpers bound to a context. */
export function textKit(ctx: Ctx, u: number) {
  const measure = (t: string, font: (s: number) => string, w: number, lines: number, max: number, min: number, lh: number) => {
    const f = fit(ctx, t.trim(), font, w, lines, max, min); return { ...f, font: font(f.size), lh: f.size * lh, h: f.lines.length ? f.size + (f.lines.length - 1) * f.size * lh : 0 };
  };
  type M = ReturnType<typeof measure>;
  /** Draw measured text with its top at y; returns y of the bottom. */
  const draw = (m: M, x: number, y: number, w: number, color: string, align: CanvasTextAlign = "left", ls = 0) => {
    if (!m.lines.length) return y;
    ctx.font = m.font; ctx.fillStyle = color; ctx.textAlign = align; spaced(ctx, ls);
    const ax = align === "center" ? x + w / 2 : align === "right" ? x + w : x;
    m.lines.forEach((l, i) => ctx.fillText(l, ax, y + m.size * 0.86 + i * m.lh));
    spaced(ctx, 0); ctx.textAlign = "left"; return y + m.h;
  };
  const line = (t: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = "left", ls = 0) => { if (!t) return; ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; spaced(ctx, ls); ctx.fillText(t, x, y); spaced(ctx, 0); ctx.textAlign = "left"; };
  const width = (t: string, font: string, ls = 0) => { ctx.font = font; spaced(ctx, ls); const w = ctx.measureText(t).width + ls * t.length; spaced(ctx, 0); return w; };
  /** CTA button. style: pill | box | outline | underline. Returns its height. */
  const button = (t: string, x: number, y: number, size: number, bg: string, fg: string, style: "pill" | "box" | "outline" | "underline" = "pill", align: "left" | "center" | "right" = "left", ls = 0) => {
    if (!t.trim()) return 0;
    const font = `700 ${size}px ${SANS}`; const tw = width(t, font, ls);
    if (style === "underline") { const bx = align === "center" ? x - tw / 2 : align === "right" ? x - tw : x; line(t, bx, y + size, font, bg, "left", ls); ctx.fillStyle = bg; ctx.fillRect(bx, y + size * 1.35, tw, Math.max(2, 3 * u)); return size * 1.5; }
    const w = tw + size * 2.4, h = size * 2.5; const bx = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
    ctx.beginPath(); ctx.roundRect(bx, y, w, h, style === "pill" ? h / 2 : style === "box" ? 4 * u : 0);
    if (style === "outline") { ctx.strokeStyle = bg; ctx.lineWidth = 2.5 * u; ctx.stroke(); } else { ctx.fillStyle = bg; ctx.fill(); }
    ctx.textBaseline = "middle"; line(t, bx + size * 1.2, y + h / 2 + size * 0.04, font, style === "outline" ? bg : fg, "left", ls); ctx.textBaseline = "alphabetic"; return h;
  };
  return { measure, draw, line, width, button };
}

export type ColourStyle = { format: PosterFormat; layout: ColourStyleId; primary: string; accent: string; font?: FontStyle | undefined };

export function drawColourStyle(canvas: HTMLCanvasElement, c: DesignContent, st: ColourStyle) {
  const { w: W, h: H } = FORMATS[st.format]; canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!; const u = W / 1080; const tall = H / W; const sq = tall < 1.15;
  const fs = !st.font || st.font === "auto" ? COLOUR_STYLES[st.layout].font : st.font;
  const HF = (w?: number) => (s: number) => `${w ?? HEAD_WEIGHT[fs]} ${s}px ${FAMILY[fs]}`;
  const BODY = (w = 500) => (s: number) => `${w} ${s}px ${SANS}`;
  const P = st.primary, A = st.accent, pFg = textOn(P), aFg = textOn(A);
  const K = textKit(ctx, u);
  ctx.clearRect(0, 0, W, H); spaced(ctx, 0); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  const name = c.businessName.trim().slice(0, 40), offer = c.offer.trim().slice(0, 48), cta = c.callToAction.trim().slice(0, 40);
  const prod = (c.productName ?? "").trim().slice(0, 50);
  const head = c.headline.trim(), sup = c.supportingCopy.trim();
  const fill = (col: string | CanvasGradient, x: number, y: number, w: number, h: number) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); };
  const soft = (fg: string, a: number) => rgba(fg, a);

  switch (st.layout) {
    case "c-minimal": {
      const bg = mix(P, "#ffffff", lum(P) > 0.75 ? 0.4 : 0.93); const ink = lum(bg) > 0.5 ? mix(P, "#111111", lum(P) > 0.6 ? 0.85 : 0.35) : "#ffffff";
      const inkFg = lum(ink) > 0.5 ? "#141414" : "#ffffff";
      fill(bg, 0, 0, W, H); const pad = 96 * u, tw = W - pad * 2;
      K.line(name.toUpperCase(), pad, pad + 22 * u, `600 ${22 * u}px ${SANS}`, soft(ink, 0.75), "left", 7 * u);
      if (offer) K.line(offer.toUpperCase(), W - pad, pad + 22 * u, `700 ${22 * u}px ${SANS}`, lum(A) > 0.8 ? ink : A, "right", 3 * u);
      fill(soft(ink, 0.15), pad, pad + 52 * u, tw, Math.max(1, 1.5 * u));
      const hm = K.measure(head, HF(fs === "sans" ? 700 : undefined), tw * (sq ? 0.95 : 0.92), sq ? 3 : 4, (sq ? 104 : 124) * u, 50 * u, 1.04);
      const sm = K.measure(sup, BODY(400), tw * 0.78, 3, 31 * u, 22 * u, 1.5);
      if (prod) K.line(prod.toUpperCase(), pad, H * (sq ? 0.28 : 0.3) - 34 * u, `700 ${22 * u}px ${SANS}`, lum(A) > 0.8 ? ink : A, "left", 4 * u);
      let y = K.draw(hm, pad, H * (sq ? 0.28 : 0.3), tw, ink, "left", -hm.size * 0.02);
      fill(A, pad, y + 40 * u, 72 * u, 6 * u);
      K.draw(sm, pad, y + 80 * u, tw, soft(ink, 0.72));
      // a single fine geometric accent
      ctx.fillStyle = A; ctx.fillRect(W - pad - 28 * u, H - pad - 28 * u, 28 * u, 28 * u);
      if (cta) K.button(cta, pad, H - pad - 2.5 * 28 * u, 28 * u, ink, inkFg, "pill");
      break;
    }
    case "c-block": {
      fill(P, 0, 0, W, H);
      const colW = W * 0.34, topH = H * (sq ? 0.56 : 0.6);
      fill(A, W - colW, 0, colW, topH);
      const third = lum(P) > 0.5 ? mix(P, "#111111", 0.75) : mix(P, "#ffffff", 0.88); const tFg = textOn(third);
      fill(third, 0, topH, W - colW * 0.55, H - topH);
      fill(mix(A, P, 0.45), W - colW * 0.55, topH, colW * 0.55, H - topH);
      const pad = 72 * u;
      K.line(name.toUpperCase(), pad, pad + 24 * u, `800 ${24 * u}px ${SANS}`, pFg, "left", 6 * u);
      const hw = W - colW - pad * 1.6;
      const hm = K.measure(head.toUpperCase(), HF(), hw, sq ? 4 : 5, (sq ? 92 : 108) * u, 44 * u, 0.98);
      K.draw(hm, pad, topH - pad - hm.h, hw, pFg, "left", -hm.size * 0.01);
      if (offer || prod) { ctx.save(); ctx.translate(W - colW / 2 + 14 * u, topH / 2); ctx.rotate(-Math.PI / 2);
        const om = K.measure((offer || prod).toUpperCase(), (s) => `800 ${s}px ${SANS}`, topH - pad * 2, 2, 72 * u, 28 * u, 1);
        K.draw(om, -(topH - pad * 2) / 2, -om.h / 2, topH - pad * 2, aFg, "center", 2 * u); ctx.restore(); }
      const bw = W - colW * 0.55 - pad * 2; const sm = K.measure(sup, BODY(500), bw, sq ? 3 : 4, 32 * u, 22 * u, 1.45);
      const y = K.draw(sm, pad, topH + pad * 0.9, bw, soft(tFg, 0.85));
      if (cta) K.button(cta, pad, Math.min(H - pad - 70 * u, y + 44 * u), 28 * u, P, pFg, "box");
      break;
    }
    case "c-gradient": {
      const g = ctx.createLinearGradient(0, 0, W * 0.6, H); g.addColorStop(0, mix(P, "#000000", 0.15)); g.addColorStop(0.55, P); g.addColorStop(1, A); fill(g, 0, 0, W, H);
      for (const [x, y, r, col, a] of [[0.85, 0.15, 0.75, A, 0.55], [0.1, 0.85, 0.7, mix(A, "#ffffff", 0.4), 0.35], [0.3, 0.25, 0.5, mix(P, "#ffffff", 0.3), 0.25]] as const) {
        const rg = ctx.createRadialGradient(W * x, H * y, 0, W * x, H * y, W * r); rg.addColorStop(0, rgba(col, a)); rg.addColorStop(1, rgba(col, 0)); fill(rg, 0, 0, W, H); }
      grain(ctx, W, H, 0.06);
      const fg = lum(mix(P, A, 0.4)) > 0.6 ? "#141414" : "#ffffff"; const pad = 90 * u, tw = W - pad * 2;
      K.line(name.toUpperCase(), W / 2, pad + 20 * u, `600 ${22 * u}px ${SANS}`, soft(fg, 0.85), "center", 9 * u);
      const hm = K.measure(head, HF(fs === "sans" ? 700 : 500), tw, sq ? 3 : 4, (sq ? 100 : 120) * u, 52 * u, 1.06);
      const sm = K.measure(sup, BODY(400), tw * 0.8, 3, 31 * u, 22 * u, 1.5);
      const om = offer ? 52 * u : 0; const total = om + hm.h + 50 * u + sm.h + (cta ? 120 * u : 0);
      let y = (H - total) / 2 + 20 * u;
      if (offer) { K.line(offer.toUpperCase(), W / 2, y + 22 * u, `700 ${24 * u}px ${SANS}`, fg, "center", 5 * u); y += om; }
      y = K.draw(hm, pad, y, tw, fg, "center", -hm.size * 0.015);
      y = K.draw(sm, pad + tw * 0.1, y + 46 * u, tw * 0.8, soft(fg, 0.85), "center");
      if (cta) K.button(cta, W / 2, y + 56 * u, 28 * u, fg === "#ffffff" ? "#ffffff" : "#141414", fg === "#ffffff" ? mix(P, "#000000", 0.2) : "#ffffff", "pill", "center");
      if (prod) K.line(prod, W / 2, H - pad, `500 ${24 * u}px ${SANS}`, soft(fg, 0.75), "center", 2 * u);
      break;
    }
    case "c-editorial": {
      const paper = mix(P, "#f6f2ea", 0.9); const ink = mix(P, "#111111", lum(P) > 0.5 ? 0.8 : 0.3); fill(paper, 0, 0, W, H); grain(ctx, W, H, 0.04);
      const pad = 72 * u, tw = W - pad * 2;
      const nm = K.measure(name, (s) => `700 ${s}px ${FAMILY.serif}`, tw, 1, 96 * u, 40 * u, 1);
      fill(ink, pad, pad, tw, 4 * u); K.draw(nm, pad, pad + 26 * u, tw, ink, "center", -nm.size * 0.02);
      let y = pad + 26 * u + nm.h + 24 * u; fill(ink, pad, y, tw, 1.5 * u);
      K.line((offer || "The latest edition").toUpperCase(), pad, y + 36 * u, `700 ${19 * u}px ${SANS}`, ink, "left", 4 * u);
      K.line(new Date().getFullYear().toString(), W - pad, y + 36 * u, `700 ${19 * u}px ${SANS}`, ink, "right", 4 * u);
      fill(ink, pad, y + 54 * u, tw, 1.5 * u); y += 54 * u;
      const hm = K.measure(head, HF(fs === "sans" ? 800 : 600), tw, sq ? 3 : 4, (sq ? 110 : 132) * u, 52 * u, 1.0);
      y = K.draw(hm, pad, y + 50 * u, tw, ink, "left", -hm.size * 0.025);
      const colW = tw * 0.58, gx = pad + tw - colW; const by = Math.max(y + 50 * u, H * 0.55);
      if (prod) K.line(prod, pad, by + 30 * u, `italic 500 ${30 * u}px ${FAMILY.serif}`, A === paper ? ink : mix(A, ink, 0.2));
      fill(ink, gx - 30 * u, by, 1.5 * u, H - pad - 110 * u - by);
      const sm = K.measure(sup, BODY(400), colW, sq ? 4 : 6, 30 * u, 21 * u, 1.55);
      K.draw(sm, gx, by, colW, soft(ink, 0.82));
      fill(A, 0, H - pad - 40 * u, W, pad + 40 * u);
      if (cta) K.line(`${cta.toUpperCase()}  →`, pad, H - pad / 2 - 10 * u, `800 ${26 * u}px ${SANS}`, aFg, "left", 3 * u);
      break;
    }
    case "c-type": {
      const bg = lum(A) > 0.45 ? A : P === A ? "#111111" : A; const fg = textOn(bg); const hi = lum(bg) > 0.5 ? P : mix(P, "#ffffff", lum(P) < 0.25 ? 0.6 : 0);
      fill(bg, 0, 0, W, H); const pad = 64 * u, tw = W - pad * 2 - 40 * u;
      ctx.save(); ctx.translate(W - pad * 0.6, pad); ctx.rotate(Math.PI / 2); K.line(name.toUpperCase(), 0, 0, `800 ${24 * u}px ${SANS}`, fg, "left", 8 * u); ctx.restore();
      const words = head.toUpperCase();
      const tf = (s: number) => `${fs === "sans" ? 800 : HEAD_WEIGHT[fs]} ${s}px ${FAMILY[fs]}`;
      const longest = words.split(/\s+/).reduce((m, w) => Math.max(m, K.width(w, tf(100))), 1);
      const cap = Math.max(64 * u, Math.min((sq ? 170 : 200) * u, (tw / longest) * 100 * 0.98));
      const hm = K.measure(words, tf, tw, sq ? 4 : 6, cap, 56 * u, 0.92);
      if (offer) { const s = 30 * u; K.button(offer.toUpperCase(), pad, pad, s * 0.8, hi, textOn(hi), "box"); }
      const top = pad + 110 * u;
      ctx.font = hm.font; spaced(ctx, -hm.size * 0.03); ctx.textAlign = "left";
      hm.lines.forEach((l, i) => { ctx.fillStyle = i === hm.lines.length - 1 ? hi : fg; ctx.fillText(l, pad - 4 * u, top + hm.size * 0.86 + i * hm.lh); }); spaced(ctx, 0);
      const y = top + hm.h + 50 * u; fill(fg, pad, y, tw, 4 * u);
      const sm = K.measure(sup, BODY(600), tw * 0.55, 4, 28 * u, 20 * u, 1.4);
      K.draw(sm, W - pad - 40 * u - tw * 0.55, y + 30 * u, tw * 0.55, soft(fg, 0.85));
      if (prod) K.line(prod.toUpperCase(), pad, y + 54 * u, `700 ${22 * u}px ${SANS}`, fg, "left", 3 * u);
      if (cta) K.button(cta.toUpperCase(), pad, H - pad - 70 * u, 26 * u, fg, bg, "box", "left", 2 * u);
      break;
    }
    case "c-soft": {
      const top = mix(P, "#ffffff", 0.82), bot = mix(A, "#ffffff", 0.7); const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bot); fill(g, 0, 0, W, H);
      const rg = ctx.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.42, W * 0.7); rg.addColorStop(0, "rgba(255,255,255,0.55)"); rg.addColorStop(1, "rgba(255,255,255,0)"); fill(rg, 0, 0, W, H); grain(ctx, W, H, 0.035);
      const ink = mix(P, "#1a1a1a", lum(P) > 0.55 ? 0.75 : 0.25);
      const m = 70 * u, cw = W - m * 2, ch = H - m * 2; ctx.fillStyle = "rgba(255,255,255,0.45)"; ctx.beginPath(); ctx.roundRect(m, m, cw, ch, 28 * u); ctx.fill();
      ctx.strokeStyle = rgba(ink, 0.18); ctx.lineWidth = 1.5 * u; ctx.stroke();
      const pad = m + 70 * u, tw = W - pad * 2;
      K.line(name, W / 2, m + 90 * u, `italic 500 ${30 * u}px ${FAMILY.serif}`, ink, "center");
      fill(rgba(ink, 0.35), W / 2 - 40 * u, m + 120 * u, 80 * u, 1.5 * u);
      const hm = K.measure(head, HF(fs === "sans" ? 600 : 400), tw, sq ? 3 : 4, (sq ? 86 : 100) * u, 44 * u, 1.12);
      const sm = K.measure(sup, BODY(400), tw * 0.85, 3, 29 * u, 21 * u, 1.6);
      const total = hm.h + 50 * u + sm.h; let y = (H - total) / 2 + (sq ? 10 : 0) * u;
      if (offer) K.line(offer.toUpperCase(), W / 2, y - 50 * u, `600 ${21 * u}px ${SANS}`, mix(A, ink, 0.45), "center", 6 * u);
      y = K.draw(hm, pad, y, tw, ink, "center", -hm.size * 0.01);
      K.draw(sm, pad + tw * 0.075, y + 46 * u, tw * 0.85, rgba(ink, 0.72), "center");
      if (prod) K.line(prod, W / 2, H - m - 160 * u, `italic 500 ${26 * u}px ${FAMILY.serif}`, rgba(ink, 0.8), "center");
      if (cta) K.button(cta, W / 2, H - m - 120 * u, 25 * u, ink, "#ffffff", "outline", "center", 2 * u);
      break;
    }
    case "c-retro": {
      const cream = mix(A, "#f4ead6", 0.82); fill(cream, 0, 0, W, H); grain(ctx, W, H, 0.07);
      const ink = mix(P, "#1b1b1b", lum(P) > 0.5 ? 0.7 : 0.15); const mid = mix(P, A, 0.5);
      const sh = H * 0.028, sy = H - H * (sq ? 0.2 : 0.22);
      [P, mid, A].forEach((col, i) => fill(col, 0, sy + i * sh * 1.5, W, sh));
      fill(P, 0, sy + 3 * sh * 1.5, W, H);
      const pad = 80 * u, tw = W - pad * 2;
      ctx.strokeStyle = ink; ctx.lineWidth = 3 * u; ctx.strokeRect(pad * 0.5, pad * 0.5, W - pad, sy - pad * 0.5 - 30 * u);
      K.line(`— ${name.toUpperCase()} —`, W / 2, pad + 50 * u, `800 ${24 * u}px ${SANS}`, ink, "center", 6 * u);
      const hm = K.measure(head, (s) => `${fs === "retro" ? 400 : HEAD_WEIGHT[fs]} ${s}px ${FAMILY[fs]}`, tw * 0.94, sq ? 3 : 4, (sq ? 104 : 124) * u, 50 * u, 1.02);
      const sm = K.measure(sup, BODY(500), tw * 0.8, sq ? 2 : 3, 29 * u, 21 * u, 1.45);
      const room = sy - 30 * u - (pad + 90 * u); const total = (offer ? 90 * u : 0) + hm.h + 36 * u + sm.h;
      let y = pad + 90 * u + Math.max(0, (room - total) / 2);
      if (offer) { ctx.font = `800 ${26 * u}px ${SANS}`; const ow = K.width(offer.toUpperCase(), ctx.font, 3 * u) + 60 * u; ctx.fillStyle = A; ctx.beginPath(); ctx.roundRect(W / 2 - ow / 2, y, ow, 58 * u, 10 * u); ctx.fill();
        K.line(offer.toUpperCase(), W / 2, y + 39 * u, `800 ${26 * u}px ${SANS}`, aFg, "center", 3 * u); y += 90 * u; }
      y = K.draw(hm, pad + tw * 0.03, y, tw * 0.94, ink, "center");
      K.draw(sm, pad + tw * 0.1, y + 36 * u, tw * 0.8, rgba(ink, 0.8), "center");
      const by = sy + 3 * sh * 1.5; const bh = H - by;
      if (cta) K.button(cta.toUpperCase(), W / 2, by + (bh - 26 * u * 2.5) / 2 - (prod ? 18 * u : 0), 26 * u, cream, ink, "pill", "center", 2 * u);
      if (prod && !(sq && cta)) K.line(prod, W / 2, H - 26 * u, `600 ${20 * u}px ${SANS}`, pFg, "center", 2 * u);
      break;
    }
    case "c-luxury": {
      const bg = lum(P) < 0.3 ? P : mix(P, "#0c0c0c", 0.78); const gold = lum(A) > 0.35 ? A : mix(A, "#d6b25e", 0.6); const fg = "#f5f1ea";
      const g = ctx.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, H * 0.8); g.addColorStop(0, mix(bg, "#ffffff", 0.08)); g.addColorStop(1, bg); fill(g, 0, 0, W, H);
      const m = 54 * u; ctx.strokeStyle = gold; ctx.lineWidth = 1.5 * u; ctx.strokeRect(m, m, W - m * 2, H - m * 2); ctx.lineWidth = 0.8 * u; ctx.strokeRect(m + 14 * u, m + 14 * u, W - m * 2 - 28 * u, H - m * 2 - 28 * u);
      const pad = m + 90 * u, tw = W - pad * 2;
      K.line(name.toUpperCase(), W / 2, m + 120 * u, `500 ${22 * u}px ${SANS}`, gold, "center", 12 * u);
      const hm = K.measure(head, HF(fs === "sans" ? 300 : 400), tw, sq ? 3 : 4, (sq ? 84 : 98) * u, 42 * u, 1.14);
      const sm = K.measure(sup, BODY(300), tw * 0.8, 3, 27 * u, 20 * u, 1.7);
      const total = hm.h + 90 * u + sm.h; let y = (H - total) / 2;
      if (offer) K.line(offer.toUpperCase(), W / 2, y - 60 * u, `500 ${19 * u}px ${SANS}`, gold, "center", 8 * u);
      y = K.draw(hm, pad, y, tw, fg, "center");
      const ry = y + 44 * u; fill(gold, W / 2 - 50 * u, ry, 100 * u, 1.2 * u); ctx.fillStyle = gold; ctx.save(); ctx.translate(W / 2, ry); ctx.rotate(Math.PI / 4); ctx.fillRect(-5 * u, -5 * u, 10 * u, 10 * u); ctx.restore();
      K.draw(sm, pad + tw * 0.1, ry + 44 * u, tw * 0.8, rgba(fg, 0.75), "center");
      if (prod) K.line(prod, W / 2, H - m - 190 * u, `italic 400 ${26 * u}px ${FAMILY.serif}`, rgba(fg, 0.85), "center");
      if (cta) K.button(cta.toUpperCase(), W / 2, H - m - 150 * u, 21 * u, gold, bg, "outline", "center", 5 * u);
      break;
    }
  }
}
