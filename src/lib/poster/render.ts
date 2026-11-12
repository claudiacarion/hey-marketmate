// Canvas poster renderer — draws a real image from a photo + campaign copy.
export type PosterFormat = "square" | "social" | "story" | "print";
export type PosterLayout = "overlay" | "split" | "frame" | "graphic";
export const FORMATS: Record<PosterFormat, { label: string; hint: string; w: number; h: number }> = {
  square: { label: "Square", hint: "1080×1080 · Instagram / Facebook square", w: 1080, h: 1080 },
  social: { label: "Social portrait", hint: "1080×1350 · Instagram / Facebook feed", w: 1080, h: 1350 },
  story: { label: "Story", hint: "1080×1920 · Stories & Reels", w: 1080, h: 1920 },
  print: { label: "Print A4", hint: "2480×3508 · 300 dpi poster", w: 2480, h: 3508 },
};
export const LAYOUTS: Record<PosterLayout, string> = { overlay: "Full photo", split: "Photo + colour panel", frame: "Framed photo", graphic: "Colour design (no photo)" };

export type PosterContent = { businessName: string; offer: string; headline: string; supportingCopy: string; callToAction: string; credit?: string | undefined };
export type PosterStyle = { format: PosterFormat; layout: PosterLayout; primary: string; accent: string };

const DISPLAY = '"Fraunces", Georgia, serif';
const SANS = '"Plus Jakarta Sans", system-ui, sans-serif';

export async function ensurePosterFonts() {
  if (typeof document === "undefined" || !document.fonts) return;
  await Promise.allSettled([
    document.fonts.load(`700 80px "Fraunces"`), document.fonts.load(`600 40px "Plus Jakarta Sans"`),
    document.fonts.load(`500 40px "Plus Jakarta Sans"`), document.fonts.load(`700 40px "Plus Jakarta Sans"`),
  ]);
}

export function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "").match(/^([0-9a-f]{6}|[0-9a-f]{3})$/i);
  if (!m) return [31, 90, 70];
  let h = m[1]!; if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
/** Readable text colour (near-white or near-black) for a given background hex. */
export function textOn(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? "#141414" : "#ffffff";
}
export const rgba = (hex: string, a: number) => { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };

/** Split text into lines that fit maxWidth at the current ctx font. */
export function wrapLines(ctx: Pick<CanvasRenderingContext2D, "measureText">, text: string, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean); const lines: string[] = []; let line = "";
  for (const w of words) { const t = line ? `${line} ${w}` : w; if (ctx.measureText(t).width <= maxWidth || !line) line = t; else { lines.push(line); line = w; } }
  if (line) lines.push(line);
  return lines;
}
/** Largest font size (step 2px) whose wrapped text fits within maxLines. */
export function fit(ctx: CanvasRenderingContext2D, text: string, font: (s: number) => string, maxW: number, maxLines: number, max: number, min: number) {
  for (let s = max; s >= min; s -= 2) { ctx.font = font(s); const l = wrapLines(ctx, text, maxW); if (l.length <= maxLines) return { size: s, lines: l }; }
  ctx.font = font(min); const l = wrapLines(ctx, text, maxW);
  if (l.length > maxLines) { l.length = maxLines; l[maxLines - 1] = l[maxLines - 1]!.replace(/\s*\S*$/, "") + "…"; }
  return { size: min, lines: l };
}
/** Shrink the px size in a CSS font string so `text` fits maxW (call with letterSpacing already set). */
export function shrinkFont(ctx: CanvasRenderingContext2D, text: string, font: string, maxW: number) {
  let f = font;
  for (let i = 0; i < 6; i++) { ctx.font = f; const w = ctx.measureText(text).width; if (w <= maxW || w <= 0) break;
    f = f.replace(/([\d.]+)px/, (_m, n: string) => `${(Number(n) * maxW * 0.97) / w}px`); }
  return f;
}
export function drawCover(ctx: CanvasRenderingContext2D, img: CanvasImageSource & { width: number; height: number }, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / img.width, h / img.height); const sw = w / s, sh = h / s;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}
export function pill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, bg: string, fg: string, padX: number, padY: number) {
  ctx.font = `700 ${size}px ${SANS}`; const w = ctx.measureText(text).width + padX * 2, h = size + padY * 2;
  ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
  ctx.fillStyle = fg; ctx.textBaseline = "middle"; ctx.fillText(text, x + padX, y + h / 2 + size * 0.04); ctx.textBaseline = "alphabetic";
  return { w, h };
}
export function spaced(ctx: CanvasRenderingContext2D, px: number) { (ctx as unknown as { letterSpacing: string }).letterSpacing = `${px}px`; }

export function drawPoster(canvas: HTMLCanvasElement, img: (CanvasImageSource & { width: number; height: number }) | null, c: PosterContent, st: PosterStyle) {
  const { w: W, h: H } = FORMATS[st.format];
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!; const u = W / 1080; const pad = 80 * u; const tw = W - pad * 2;
  const accentFg = textOn(st.accent);
  ctx.clearRect(0, 0, W, H); spaced(ctx, 0);
  const photo = (x: number, y: number, w: number, h: number) => { if (img) drawCover(ctx, img, x, y, w, h); else { ctx.fillStyle = rgba(st.primary, 0.6); ctx.fillRect(x, y, w, h); } };

  // Text stack drawn bottom-up from `bottom`; returns nothing.
  const stack = (top: number, bottom: number, fg: string, headColor: string, ctaBg: string, ctaFg: string, withBadge: boolean) => {
    const avail = bottom - top;
    const cta = c.callToAction.trim(); const ctaSize = 36 * u;
    let y = bottom;
    if (cta) { ctx.font = `700 ${ctaSize}px ${SANS}`; const h = ctaSize + 52 * u; y -= h; pill(ctx, cta, pad, y, ctaSize, ctaBg, ctaFg, 44 * u, 26 * u); y -= 44 * u; }
    const offerH = withBadge && c.offer.trim() ? 32 * u + 76 * u : 0;
    let copy = fit(ctx, c.supportingCopy, (s) => `500 ${s}px ${SANS}`, tw, avail > 900 * u ? 5 : 3, 36 * u, 26 * u);
    let head = fit(ctx, c.headline, (s) => `700 ${s}px ${DISPLAY}`, tw, 4, (avail > 900 * u ? 118 : 96) * u, 54 * u);
    // Shrink until the whole stack fits between top and bottom, so nothing overlaps the brand or offer.
    for (let k = 0.92; k >= 0.5 && (bottom - y) + copy.lines.length * copy.size * 1.4 + 20 * u + head.lines.length * head.size * 1.05 + offerH > avail; k -= 0.06) {
      copy = fit(ctx, c.supportingCopy, (s) => `500 ${s}px ${SANS}`, tw, avail > 900 * u ? 5 : 4, 36 * u * k, 18 * u);
      head = fit(ctx, c.headline, (s) => `700 ${s}px ${DISPLAY}`, tw, 4, (avail > 900 * u ? 118 : 96) * u * k, 30 * u);
    }
    ctx.fillStyle = fg; ctx.font = `500 ${copy.size}px ${SANS}`;
    const lh = copy.size * 1.4; for (let i = copy.lines.length - 1; i >= 0; i--) { ctx.fillText(copy.lines[i]!, pad, y); y -= lh; }
    y -= 20 * u;
    ctx.fillStyle = headColor; ctx.font = `700 ${head.size}px ${DISPLAY}`; spaced(ctx, -head.size * 0.02);
    const hl = head.size * 1.05; for (let i = head.lines.length - 1; i >= 0; i--) { ctx.fillText(head.lines[i]!, pad, y); y -= hl; }
    spaced(ctx, 0);
    if (withBadge && c.offer.trim()) { const s = 32 * u; y -= s + 40 * u; ctx.font = `700 ${s}px ${SANS}`; pill(ctx, c.offer.trim().slice(0, 60), pad, y - 4 * u, s, st.accent, accentFg, 32 * u, 18 * u); }
  };
  const brand = (color: string, y: number, maxW = tw) => { ctx.font = `700 ${28 * u}px ${SANS}`; spaced(ctx, 6 * u); ctx.fillStyle = color; const t = c.businessName.trim().toUpperCase().slice(0, 60); ctx.font = shrinkFont(ctx, t, ctx.font, maxW); ctx.fillText(t, pad, y); spaced(ctx, 0); };
  const credit = (color: string) => { if (!c.credit) return; ctx.font = `500 ${17 * u}px ${SANS}`; ctx.fillStyle = color; ctx.textAlign = "right"; ctx.fillText(c.credit.slice(0, 120), W - 28 * u, H - 24 * u); ctx.textAlign = "left"; };

  if (st.layout === "graphic") {
    const fg = textOn(st.primary);
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, st.primary); g.addColorStop(1, rgba(st.accent, 0.55));
    ctx.fillStyle = st.primary; ctx.fillRect(0, 0, W, H); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // Decorative shapes in brand colours
    ctx.fillStyle = st.accent; ctx.beginPath(); ctx.arc(W * 0.92, H * 0.12, 300 * u, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = rgba(fg, 0.25); ctx.lineWidth = 6 * u; ctx.beginPath(); ctx.arc(W * 0.92, H * 0.12, 380 * u, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = rgba(fg, 0.08); ctx.beginPath(); ctx.arc(W * 0.05, H * 0.5, 420 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = rgba(st.accent, 0.9);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.arc(W - pad - i * 34 * u, H * 0.36 + j * 34 * u, 6 * u, 0, Math.PI * 2); ctx.fill(); }
    brand(fg, pad + 20 * u);
    ctx.fillStyle = st.accent; ctx.fillRect(pad, pad + 48 * u, 90 * u, 8 * u);
    stack(H * 0.3, H - pad - 30 * u, fg === "#ffffff" ? "rgba(255,255,255,0.9)" : "rgba(20,20,20,0.85)", fg, st.accent, accentFg, true);
  } else if (st.layout === "overlay") {
    photo(0, 0, W, H);
    const g = ctx.createLinearGradient(0, H * 0.25, 0, H); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.55, "rgba(0,0,0,0.55)"); g.addColorStop(1, "rgba(0,0,0,0.88)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const t = ctx.createLinearGradient(0, 0, 0, 260 * u); t.addColorStop(0, rgba(st.primary, 0.75)); t.addColorStop(1, rgba(st.primary, 0));
    ctx.fillStyle = t; ctx.fillRect(0, 0, W, 260 * u);
    brand("#ffffff", pad + 20 * u);
    ctx.fillStyle = st.accent; ctx.fillRect(pad, pad + 48 * u, 90 * u, 8 * u);
    stack(H * 0.4, H - pad - 30 * u, "rgba(255,255,255,0.92)", "#ffffff", "#ffffff", "#141414", true);
    credit("rgba(255,255,255,0.75)");
  } else if (st.layout === "split") {
    const ph = H * 0.52; photo(0, 0, W, ph);
    ctx.fillStyle = st.primary; ctx.fillRect(0, ph, W, H - ph);
    const fg = textOn(st.primary);
    // brand tag on photo
    ctx.font = `700 ${28 * u}px ${SANS}`; spaced(ctx, 6 * u); const bw = Math.min(tw - 56 * u, ctx.measureText(c.businessName.trim().toUpperCase().slice(0, 60)).width); spaced(ctx, 0);
    ctx.fillStyle = rgba(st.primary, 0.88); ctx.beginPath(); ctx.roundRect(pad - 28 * u, pad - 8 * u, bw + 56 * u, 64 * u, 32 * u); ctx.fill();
    brand(fg, pad + 34 * u, tw - 56 * u);
    if (c.offer.trim()) { const s = 34 * u; pill(ctx, c.offer.trim().slice(0, 48), pad, ph - (s + 40 * u) / 2, s, st.accent, accentFg, 36 * u, 20 * u); }
    stack(ph + 70 * u, H - pad, fg === "#ffffff" ? "rgba(255,255,255,0.9)" : "rgba(20,20,20,0.85)", fg, st.accent, accentFg, false);
    credit(fg === "#ffffff" ? "rgba(255,255,255,0.6)" : "rgba(20,20,20,0.6)");
  } else {
    ctx.fillStyle = "#f7f1e8"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = rgba(st.accent, 0.18); ctx.beginPath(); ctx.arc(W - 60 * u, 120 * u, 260 * u, 0, Math.PI * 2); ctx.fill();
    brand(st.primary, pad + 20 * u);
    const py = pad + 70 * u, ph = H * 0.5;
    ctx.save(); ctx.beginPath(); ctx.roundRect(pad, py, tw, ph, 36 * u); ctx.clip(); photo(pad, py, tw, ph); ctx.restore();
    if (c.offer.trim()) { const s = 32 * u; ctx.font = `700 ${s}px ${SANS}`; const bw = ctx.measureText(c.offer.trim().slice(0, 48)).width + 64 * u; pill(ctx, c.offer.trim().slice(0, 48), pad + tw - bw - 30 * u, py + 30 * u, s, st.accent, accentFg, 32 * u, 18 * u); }
    stack(py + ph + 60 * u, H - pad, "rgba(20,20,20,0.78)", st.primary, st.primary, textOn(st.primary), false);
    credit("rgba(20,20,20,0.55)");
  }
}
