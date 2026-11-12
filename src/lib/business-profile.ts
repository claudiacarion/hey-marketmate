export type EtsyDetails = {
  productType: string; productDescription: string; productNature: string[]; targetCustomer: string;
  priceRange: string; markets: string; usps: string; challenges: string;
};
export type BusinessProfile = {
  name: string; category: string; subcategory: string; otherDescription: string; salesChannels: string[];
  location: string; audience: string; voice: string; primaryColor: string; accentColor: string; etsyDetails: EtsyDetails;
};

const KEY = "marketmate.business";

export const businessCategories: Record<string, string[]> = {
  "Food & Hospitality": ["Café", "Restaurant", "Bakery", "Bar", "Food truck", "Catering", "Hotel / B&B"],
  "Beauty & Personal Care": ["Hair salon", "Barber", "Nails", "Skincare / spa", "Makeup", "Tattoo"],
  "Retail & Online Shops": ["Clothing", "Gifts", "Home goods", "Books", "Electronics", "Groceries"],
  "Handmade & Creative Businesses": ["Jewellery", "Ceramics", "Candles", "Art", "Stationery", "Clothing", "Accessories", "Crafts", "Photography"],
  "Professional Services": ["Consulting", "Accounting", "Legal", "Marketing / design", "IT services", "Real estate"],
  "Health, Fitness & Wellness": ["Gym / studio", "Personal training", "Yoga / pilates", "Physio / massage", "Nutrition", "Mental wellbeing"],
  "Education & Digital Products": ["Online courses", "Digital downloads", "Tutoring", "Coaching", "Templates", "Ebooks"],
  "Home & Local Services": ["Cleaning", "Gardening", "Renovation", "Plumbing", "Home maintenance", "Pet care"],
  "Events & Experiences": ["Weddings", "Venues", "Tours", "Workshops", "Entertainment", "Photography"],
  Other: [],
};
export const salesChannelOptions = ["Etsy", "Shopify", "Own website", "Instagram / social media", "Physical shop", "Local services", "Other marketplaces", "Multiple channels"];
export const productNatures = ["Handmade", "Personalized", "Vintage", "Digital"];

export const emptyEtsy: EtsyDetails = { productType: "", productDescription: "", productNature: [], targetCustomer: "", priceRange: "", markets: "", usps: "", challenges: "" };

export const defaultProfile: BusinessProfile = {
  name: "Lina's Bakery & Brunch",
  category: "Food & Hospitality",
  subcategory: "Bakery",
  otherDescription: "",
  salesChannels: ["Physical shop", "Instagram / social media"],
  location: "Stockholm",
  audience: "Young families and remote workers in the neighbourhood who love slow weekend mornings.",
  voice: "Warm, playful, a little cosy",
  primaryColor: "#1f4f3f",
  accentColor: "#e8744f",
  etsyDetails: emptyEtsy,
};

const LEGACY: Record<string, [string, string]> = {
  "Restaurant / Café": ["Food & Hospitality", "Café"], "Salon / Beauty": ["Beauty & Personal Care", "Hair salon"],
  "Online shop": ["Retail & Online Shops", ""], "Fitness studio": ["Health, Fitness & Wellness", "Gym / studio"],
  Consultant: ["Professional Services", "Consulting"], Other: ["Other", ""],
};

/** Shows Etsy/handmade fields and switches the AI into Etsy mode. */
export function isEtsySeller(p: Pick<BusinessProfile, "category" | "salesChannels">) {
  return p.category === "Handmade & Creative Businesses" || p.salesChannels.includes("Etsy");
}

export function normalizeProfile(raw: Record<string, unknown>): BusinessProfile {
  const p = { ...defaultProfile, ...raw } as BusinessProfile & { type?: string };
  const legacy = typeof p.type === "string" ? LEGACY[p.type] : undefined;
  if (!raw["category"] && legacy) { p.category = legacy[0]; p.subcategory = legacy[1]; }
  if (!businessCategories[p.category]) p.category = "Other";
  if (!Array.isArray(p.salesChannels)) p.salesChannels = [];
  p.etsyDetails = { ...emptyEtsy, ...(p.etsyDetails ?? {}) };
  delete p.type;
  return p;
}

export function loadProfile(): BusinessProfile {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? normalizeProfile(JSON.parse(raw)) : defaultProfile;
  } catch {
    return defaultProfile;
  }
}
export function saveProfile(p: BusinessProfile) {
  localStorage.setItem(KEY, JSON.stringify(p));
}
