export const CAMPAIGN_COLOUR_COUNT = 10;
function hash(s: string) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
/** Deterministic: oldest campaigns claim their hashed slot first; later ones probe to the next free slot. */
export function assignCampaignColours(campaigns: { id: string; created_at: string }[]) {
  const sorted = [...campaigns].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
  const used = new Set<number>(); const out: Record<string, number> = {};
  for (const c of sorted) {
    let slot = hash(c.id) % CAMPAIGN_COLOUR_COUNT;
    if (used.size < CAMPAIGN_COLOUR_COUNT) while (used.has(slot)) slot = (slot + 1) % CAMPAIGN_COLOUR_COUNT;
    used.add(slot); out[c.id] = slot;
  }
  return out;
}
export const campaignStyle = (slot: number) => ({ backgroundColor: `var(--camp-${slot + 1}-bg)`, color: `var(--camp-${slot + 1}-fg)` });
export const campaignDot = (slot: number) => ({ backgroundColor: `var(--camp-${slot + 1}-fg)` });
