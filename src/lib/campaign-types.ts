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
  socialPosts?: { platform: string; headline: string; caption: string; callToAction: string; hashtags?: string[]; visualConcept: string }[];
  calendar?: { day: string; theme: string; channel: string; timing: string; action: string }[];
  promotionalMaterial?: { offer: string; headline: string; supportingCopy: string; callToAction: string; designConcept: string };
  qualityReview?: { brandVoiceCheck: string; audienceFit: string; clarityScore: number; reviewerNotes: string };
};
