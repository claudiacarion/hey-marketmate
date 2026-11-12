import type { BusinessProfile } from "./campaign.functions";

const KEY = "marketmate.business";
export const businessTypes = ["Restaurant / Café", "Salon / Beauty", "Online shop", "Fitness studio", "Consultant", "Other"];
export const defaultProfile: BusinessProfile = {
  name: "Lina's Bakery & Brunch",
  type: businessTypes[0],
  location: "Stockholm",
  audience: "Young families and remote workers in the neighbourhood who love slow weekend mornings.",
  voice: "Warm, playful, a little cosy",
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
