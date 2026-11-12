import { createServerFn } from "@tanstack/react-start";

// Free-tier Google AI Studio text model.
const MODEL = "gemini-2.5-flash";

export type BusinessProfile = { name: string; type: string; location: string; audience: string; voice: string };
export type CampaignBrief = { goal: string; channels: string[]; budget: string; timing: string; notes: string };
export type CampaignPlan = {
  title: string;
  objective: string;
  targetAudience: string;
  marketingApproach: string;
  coreMessage: string;
  recommendedChannels: { channel: string; why: string }[];
  promotionalIdea: string;
  budgetAllocation: { item: string; percent: number; amount?: string }[];
  successMetrics: { metric: string; target: string }[];
};
export type GenerateResult = { plan: CampaignPlan; error?: undefined } | { plan?: undefined; error: string };

const S = { type: "STRING" };
const schema = {
  type: "OBJECT",
  properties: {
    title: S, objective: S, targetAudience: S, marketingApproach: S, coreMessage: S,
    recommendedChannels: { type: "ARRAY", items: { type: "OBJECT", properties: { channel: S, why: S }, required: ["channel", "why"] } },
    promotionalIdea: S,
    budgetAllocation: { type: "ARRAY", items: { type: "OBJECT", properties: { item: S, percent: { type: "NUMBER" }, amount: S }, required: ["item", "percent"] } },
    successMetrics: { type: "ARRAY", items: { type: "OBJECT", properties: { metric: S, target: S }, required: ["metric", "target"] } },
  },
  required: ["title", "objective", "targetAudience", "marketingApproach", "coreMessage", "recommendedChannels", "promotionalIdea", "budgetAllocation", "successMetrics"],
};

const clip = (v: unknown, n = 2000) => (typeof v === "string" ? v.slice(0, n).trim() : "");

export const generateCampaign = createServerFn({ method: "POST" })
  .inputValidator((d: { business: BusinessProfile; brief: CampaignBrief }) => {
    const b = d?.business ?? ({} as BusinessProfile);
    const r = d?.brief ?? ({} as CampaignBrief);
    return {
      business: { name: clip(b.name, 200), type: clip(b.type, 100), location: clip(b.location, 200), audience: clip(b.audience), voice: clip(b.voice, 300) },
      brief: {
        goal: clip(r.goal, 200),
        channels: Array.isArray(r.channels) ? r.channels.slice(0, 10).map((c) => clip(c, 40)) : [],
        budget: clip(r.budget, 100), timing: clip(r.timing, 100), notes: clip(r.notes),
      },
    };
  })
  .handler(async ({ data }): Promise<GenerateResult> => {
    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) return { error: "The AI service isn't set up yet (the Gemini key is missing)." };
    const { business: b, brief } = data;
    if (!brief.goal) return { error: "Please choose a campaign goal." };

    const prompt = `You are an experienced marketing strategist for small businesses. Create a practical, specific campaign plan tailored to this exact type of business. Use plain, actionable language that matches the brand voice.

BUSINESS
Name: ${b.name || "Unnamed"}
Type: ${b.type || "Small business"}
Location: ${b.location || "Not specified"}
Customers: ${b.audience || "Not specified"}
Brand voice: ${b.voice || "Friendly and professional"}

BRIEF
Goal: ${brief.goal}
Preferred channels: ${brief.channels.join(", ") || "Recommend the best ones"}
Budget: ${brief.budget || "Not specified - suggest a modest realistic total"}
Timing: ${brief.timing || "Not specified"}
Notes: ${brief.notes || "None"}

Budget percentages must add up to 100; include amounts in the budget's currency when a budget is given. Give 3-5 success metrics with concrete targets.`;

    let res: Response;
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: 0.8 },
        }),
      });
    } catch (e) {
      console.error("Gemini network error", e);
      return { error: "Couldn't reach the AI service. Please try again." };
    }

    if (!res.ok) {
      console.error("Gemini error", res.status, (await res.text()).slice(0, 500));
      if (res.status === 429) return { error: "The free AI usage limit was reached. Please wait a minute and try again." };
      if (res.status === 400 || res.status === 401 || res.status === 403) return { error: "The AI service rejected the request. The Gemini key may be invalid." };
      return { error: "The AI service had a problem. Please try again shortly." };
    }

    try {
      const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      if (!text) return { error: "The AI returned an empty answer. Please try again." };
      const plan = JSON.parse(text) as CampaignPlan;
      if (!plan.objective || !Array.isArray(plan.recommendedChannels) || !Array.isArray(plan.budgetAllocation) || !Array.isArray(plan.successMetrics)) {
        throw new Error("missing fields");
      }
      return { plan };
    } catch (e) {
      console.error("Invalid Gemini response", e);
      return { error: "The AI's answer couldn't be read. Please try again." };
    }
  });
