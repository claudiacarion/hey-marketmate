export type BusinessProfile = { name: string; type: string; location: string; audience: string; voice: string; primaryColor: string; accentColor: string };

const KEY = "marketmate.business";
export const businessTypes = ["Restaurant / Café", "Salon / Beauty", "Online shop", "Fitness studio", "Consultant", "Other"];
export const defaultProfile: BusinessProfile = {
  name: "Lina's Bakery & Brunch",
  type: "Restaurant / Café",
  location: "Stockholm",
  audience: "Young families and remote workers in the neighbourhood who love slow weekend mornings.",
  voice: "Warm, playful, a little cosy",
  primaryColor: "#1f4f3f",
  accentColor: "#e8744f",
};

export function loadProfile(): BusinessProfile {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaultProfile, ...JSON.parse(raw) } : defaultProfile;
  } catch {
    return defaultProfile;
  }
}
export function saveProfile(p: BusinessProfile) {
  localStorage.setItem(KEY, JSON.stringify(p));
}
