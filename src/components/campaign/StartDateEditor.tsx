import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarIcon, Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { CampaignPlan } from "@/lib/campaign-types";
import { campaignStart, rescheduleBrief, toLocalISO } from "@/lib/task-dates";

export function StartDateEditor({ campaignId, brief, createdAt, calendar }: { campaignId: string; brief: unknown; createdAt: string; calendar: CampaignPlan["calendar"] }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Date | null>(null);
  const start = campaignStart(brief, createdAt);
  const save = useMutation({
    mutationFn: async (d: Date) => {
      const { data: rows, error: tErr } = await supabase.from("campaign_tasks").select("task_index").eq("campaign_id", campaignId).eq("completed", true);
      if (tErr) throw tErr;
      const next = rescheduleBrief(brief, calendar, createdAt, toLocalISO(d), new Set(rows.map((r) => r.task_index)));
      const { error } = await supabase.from("campaigns").update({ brief: next as never }).eq("id", campaignId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaign", campaignId] });
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Start date updated — pending tasks moved.");
      setPending(null);
    },
    onError: () => toast.error("Couldn't change the start date. Please try again."),
  });
  return (
    <div className="panel mt-4 flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="flex items-center gap-2 text-sm">
        <CalendarIcon className="size-4 text-primary" />
        <span className="text-muted-foreground">Start date</span>
        <b>{start.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</b>
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild><Button variant="outline" size="sm" disabled={save.isPending}><Pencil className="size-4" />Edit</Button></PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar mode="single" selected={start} defaultMonth={start} initialFocus className="p-3 pointer-events-auto"
            onSelect={(d) => { setOpen(false); if (d && toLocalISO(d) !== toLocalISO(start)) setPending(d); }} />
        </PopoverContent>
      </Popover>
      <AlertDialog open={!!pending} onOpenChange={(o) => { if (!o && !save.isPending) setPending(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move campaign to {pending?.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}?</AlertDialogTitle>
            <AlertDialogDescription>Changing your campaign start date will move all pending tasks to match the new schedule. Completed tasks will remain unchanged. Would you like to continue?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={save.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={save.isPending} onClick={(e) => { e.preventDefault(); if (pending) save.mutate(pending); }}>{save.isPending ? "Saving…" : "Confirm"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
