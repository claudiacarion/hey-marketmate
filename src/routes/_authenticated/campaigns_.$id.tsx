import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TitleEditor } from "@/components/campaign/TitleEditor";
import { StartDateEditor } from "@/components/campaign/StartDateEditor";
import { PlanView } from "@/components/studio/PlanView";
import type { SavedPoster } from "@/components/studio/PosterStudio";
import type { CampaignPlan } from "@/lib/campaign-types";
import { normalizeProfile, loadProfile } from "@/lib/business-profile";

export const Route = createFileRoute("/_authenticated/campaigns_/$id")({
  head: () => ({
    meta: [
      { title: "Campaign — MarketMate" },
      { name: "description", content: "Review a saved campaign plan and its poster." },
      { property: "og:title", content: "Campaign — MarketMate" },
      { property: "og:description", content: "Review a saved campaign plan and its poster." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CampaignDetail,
});

function CampaignDetail() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["campaign", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaigns").select("id,title,business,brief,plan,poster,created_at").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const back = <Link to="/campaigns" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />All campaigns</Link>;
  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  if (error || !data) return <div className="mx-auto max-w-5xl space-y-4">{back}<p className="panel p-6 text-sm">This campaign couldn't be found.</p></div>;
  const b = normalizeProfile((data.business ?? {}) as Record<string, unknown>);
  return (
    <div className="mx-auto max-w-5xl">
      {back}
      <StartDateEditor campaignId={data.id} brief={data.brief} createdAt={data.created_at} calendar={(data.plan as unknown as CampaignPlan)?.calendar} />
      <PlanView plan={{ ...(data.plan as unknown as CampaignPlan), title: data.title }} businessName={b.name} businessType={b.category}
        brand={{ primary: loadProfile().primaryColor, accent: loadProfile().accentColor }} titleAction={<TitleEditor campaignId={data.id} title={data.title} />} campaignId={data.id} brief={data.brief} createdAt={data.created_at} poster={data.poster as unknown as SavedPoster | null} />
    </div>
  );
}
