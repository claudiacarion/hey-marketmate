import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const MAX_TITLE = 80;
export function cleanTitle(t: string) { return t.trim().replace(/\s+/g, " ").slice(0, MAX_TITLE); }

export function TitleEditor({ campaignId, title }: { campaignId: string; title: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(title);
  const clean = cleanTitle(value);
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("campaigns").update({ title: clean }).eq("id", campaignId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaign", campaignId] });
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign name updated.");
      setOpen(false);
    },
    onError: () => toast.error("Couldn't rename the campaign. Please try again."),
  });
  return (
    <>
      <Button type="button" size="icon" variant="ghost" aria-label="Edit campaign name" className="mt-1 shrink-0 text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground"
        onClick={() => { setValue(title); setOpen(true); }}><Pencil className="size-4" /></Button>
      <Dialog open={open} onOpenChange={(o) => !save.isPending && setOpen(o)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename campaign</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (clean) save.mutate(); }} className="space-y-2">
            <Input autoFocus value={value} maxLength={MAX_TITLE} onChange={(e) => setValue(e.target.value)} aria-label="Campaign name" />
            <p className="text-right text-xs text-muted-foreground">{value.length}/{MAX_TITLE}</p>
            {!clean && <p className="text-sm text-destructive">Please enter a name.</p>}
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={save.isPending}>Cancel</Button>
              <Button type="submit" disabled={!clean || save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
