import library from "./photo-library.json";

export type PhotoCategory = "cafe" | "restaurant" | "salon" | "fitness" | "shop" | "consultant" | "general";
export type StockPhoto = {
  id: string; url: string; category: PhotoCategory; title: string; creator: string; creatorUrl?: string | null;
  source: string; provider?: string | null; license: string; licenseVersion?: string | null; licenseUrl?: string | null;
};
export const stockPhotos = library as StockPhoto[];
export const CATEGORY_LABELS: Record<PhotoCategory, string> = {
  cafe: "Coffee & café", restaurant: "Food", salon: "Hair & beauty", fitness: "Fitness", shop: "Shop & products", consultant: "Office & business", general: "General",
};

const KEYWORDS: Record<PhotoCategory, string[]> = {
  cafe: ["coffee", "latte", "espresso", "café", "cafe", "cappuccino", "pastry", "croissant", "bakery", "cake", "tea"],
  restaurant: ["food", "dinner", "lunch", "brunch", "menu", "dish", "restaurant", "meal", "chef", "breakfast", "pizza", "burger"],
  salon: ["hair", "salon", "beauty", "nail", "spa", "cut", "colour", "color", "blowout", "style", "makeup"],
  fitness: ["gym", "fitness", "workout", "yoga", "class", "training", "pilates", "strength", "run", "sweat"],
  shop: ["shop", "store", "collection", "sale", "product", "gift", "order", "shipping", "boutique", "bundle"],
  consultant: ["consult", "strategy", "coaching", "advice", "business", "session", "client", "workshop", "expert"],
  general: [],
};
const TYPE_TO_CATEGORY: Record<string, PhotoCategory> = {
  "Restaurant / Café": "restaurant", "Salon / Beauty": "salon", "Online shop": "shop", "Fitness studio": "fitness", Consultant: "consultant",
  "Food & Hospitality": "restaurant", "Beauty & Personal Care": "salon", "Retail & Online Shops": "shop", "Handmade & Creative Businesses": "shop",
  "Professional Services": "consultant", "Health, Fitness & Wellness": "fitness", "Education & Digital Products": "consultant",
};

/** Categories ranked by relevance to the business type and campaign wording. */
export function rankCategories(businessType: string, text: string): PhotoCategory[] {
  const t = text.toLowerCase(); const base = TYPE_TO_CATEGORY[businessType];
  const scores = (Object.keys(KEYWORDS) as PhotoCategory[]).map((cat) => {
    let s = KEYWORDS[cat].reduce((n, k) => n + (t.includes(k) ? 2 : 0), 0);
    if (cat === base) s += 3;
    if ((businessType === "Restaurant / Café" || businessType === "Food & Hospitality") && cat === "cafe") s += 2;
    if (cat === "general") s += 0.5;
    return { cat, s };
  });
  return scores.sort((a, b) => b.s - a.s).map((x) => x.cat);
}
export function suggestPhotos(businessType: string, text: string): StockPhoto[] {
  const order = rankCategories(businessType, text);
  return [...stockPhotos].sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
}

const LICENSE_NAMES: Record<string, string> = { cc0: "CC0", pdm: "Public Domain", by: "CC BY" };
export function licenseLabel(p: Pick<StockPhoto, "license" | "licenseVersion">) {
  const n = LICENSE_NAMES[p.license] ?? p.license.toUpperCase();
  return p.license === "by" && p.licenseVersion ? `${n} ${p.licenseVersion}` : n;
}
/** CC BY photos legally require a credit wherever the image is used. */
export const requiresCredit = (p: Pick<StockPhoto, "license">) => p.license === "by";
export function creditLine(p: StockPhoto) {
  return `Photo: ${p.creator}${p.provider ? ` / ${p.provider}` : ""} · ${licenseLabel(p)}`;
}
