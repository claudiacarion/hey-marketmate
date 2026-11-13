import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2, Search, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, StatusPill } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";

const STATUSES = ["Draft", "Scheduled", "Live", "Completed"] as const;

export const Route = createFileRoute("/_authenticated/campaigns")({
  head: () => ({
    meta: [
      { title: "Campaigns — MarketMate" },
      { name: "description", content: "Manage every marketing campaign for your business in one place." },
      { property: "og:title", content: "Campaigns — MarketMate" },
      { property: "og:description", content: "Manage every marketing campaign for your business in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Campaigns,
});

function Campaigns() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaigns").select("id,title,status,brief,created_at,poster").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const term = q.trim().toLowerCase();
  const shown = (data ?? []).filter((c) => {
    if (statusFilter !== "All" && c.status !== statusFilter) return false;
    if (!term) return true;
    const b = (c.brief ?? {}) as Record<string, unknown>;
    const hay = [c.title, c.status, ...Object.values(b).flatMap((v) => Array.isArray(v) ? v : [v])].filter((v) => typeof v === "string").join(" ").toLowerCase();
    return hay.includes(term);
  });
  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("campaigns").update({ status }).eq("id", id);
    if (error) toast.error("Couldn't update status."); else qc.invalidateQueries({ queryKey: ["campaigns"] });
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this campaign?")) return;
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) toast.error("Couldn't delete."); else qc.invalidateQueries({ queryKey: ["campaigns"] });
  };
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader eyebrow="Campaigns" title="Everything you're running" description="Every plan you generate in Content Studio is saved here."
        action={<Button asChild className="rounded-xl"><Link to="/studio"><Plus className="size-4" /> New campaign</Link></Button>} />
      {isLoading ? <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      : error ? <p className="panel p-6 text-sm text-destructive">Couldn't load your campaigns. Please refresh.</p>
      : !data?.length ? (
        <div className="panel p-10 text-center">
          <h3 className="text-lg font-semibold">No campaigns yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">Generate your first plan in Content Studio and it will appear here.</p>
          <Button asChild className="mt-4 rounded-xl"><Link to="/studio">Open Content Studio</Link></Button>
        </div>
      ) : (<>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border bg-card px-3 py-2 sm:max-w-md">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, channel, goal…" aria-label="Search campaigns" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            {q && <button type="button" aria-label="Clear search" onClick={() => setQ("")}><X className="size-4 text-muted-foreground" /></button>}
          </div>
          <select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border bg-card px-3 py-2 text-sm">
            <option>All</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <span className="text-sm text-muted-foreground">{shown.length} of {data.length}</span>
        </div>
        {!shown.length ? <p className="panel p-8 text-center text-sm text-muted-foreground">No campaigns match your search.</p> :
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((c, i) => {
            const brief = (c.brief ?? {}) as { channels?: string[] };
            return (
              <article key={c.id} className="panel flex flex-col p-6 rise" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <Link to="/campaigns/$id" params={{ id: c.id }} className="min-w-0 break-words text-lg font-semibold hover:underline">{c.title}</Link>
                  <StatusPill status={c.status} />
                </div>
                <p className="text-sm text-muted-foreground">{brief.channels?.join(" · ") || "—"}</p>
                <div className="mt-3 flex items-center gap-2 text-xs">{c.poster ? <span className="rounded-full bg-secondary px-2 py-1 font-medium">Poster saved</span> : null}<Link to="/campaigns/$id" params={{ id: c.id }} className="font-medium text-primary underline">Open plan & poster</Link></div>
                <div className="mt-auto flex items-center justify-between gap-2 border-t pt-4 mt-6 text-sm">
                  <span className="text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                  <div className="flex items-center gap-2">
                    <select aria-label="Status" value={c.status} onChange={(e) => setStatus(c.id, e.target.value)} className="rounded-md border bg-background px-2 py-1 text-xs">
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    <Button size="icon" variant="ghost" aria-label="Delete campaign" onClick={() => remove(c.id)}><Trash2 className="size-4" /></Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>}
      </>)}
    </div>
  );
}
