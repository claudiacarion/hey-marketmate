import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Loader2, NotebookPen, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Note = { id: string; body: string; created_at: string; updated_at: string; is_completed: boolean };
const fmt = (s: string) => new Date(s).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export function CampaignNotes({ campaignId }: { campaignId: string }) {
  const qc = useQueryClient();
  const key = ["campaign-notes", campaignId];
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const { data: notes = [], isLoading, error, refetch } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from("campaign_notes").select("id,body,created_at,updated_at,is_completed").eq("campaign_id", campaignId).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Note[];
    },
  });
  const done = () => qc.invalidateQueries({ queryKey: key });
  const add = useMutation({
    mutationFn: async (body: string) => { const { error } = await supabase.from("campaign_notes").insert({ campaign_id: campaignId, body }); if (error) throw error; },
    onSuccess: () => { setDraft(null); toast.success("Note saved"); done(); },
    onError: () => toast.error("Couldn't save the note. Please try again."),
  });
  const update = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: string }) => { const { error } = await supabase.from("campaign_notes").update({ body }).eq("id", id); if (error) throw error; },
    onSuccess: () => { setEditId(null); toast.success("Note updated"); done(); },
    onError: () => toast.error("Couldn't update the note."),
  });
  const toggle = useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => { const { error } = await supabase.from("campaign_notes").update({ is_completed }).eq("id", id); if (error) throw error; },
    onSuccess: done,
    onError: () => toast.error("Couldn't update the note."),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("campaign_notes").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Note deleted"); done(); },
    onError: () => toast.error("Couldn't delete the note."),
  });

  const startAdd = () => { setOpen(true); setDraft(""); };

  return (
    <div className="panel">
      <div className="flex items-center justify-between gap-2 p-4">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-w-0 items-center gap-2 text-left">
          <NotebookPen className="size-4 shrink-0 text-primary" />
          <span className="font-semibold">My Campaign Notes</span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">{isLoading ? "…" : notes.length}</span>
          <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <Button size="sm" variant="outline" onClick={startAdd}><Plus className="size-4" /><span className="hidden sm:inline">Add note</span></Button>
      </div>
      {open && (
        <div className="space-y-3 border-t p-4 text-sm">
          {draft !== null && (
            <div className="space-y-2">
              <textarea autoFocus rows={3} maxLength={5000} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="An idea, reminder or decision…" className="w-full rounded-lg border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>Cancel</Button>
                <Button size="sm" disabled={!draft.trim() || add.isPending} onClick={() => add.mutate(draft.trim())}>{add.isPending && <Loader2 className="size-4 animate-spin" />}Save</Button>
              </div>
            </div>
          )}
          {isLoading && <div className="flex justify-center py-3"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>}
          {error && <p className="text-destructive">Couldn't load notes. <button className="underline" onClick={() => refetch()}>Try again</button></p>}
          {!isLoading && !error && notes.length === 0 && draft === null && <p className="text-muted-foreground">No notes yet. Add your ideas and reminders for this campaign.</p>}
          <ul className="divide-y">
            {notes.map((n) => (
              <li key={n.id} className="py-3">
                {editId === n.id ? (
                  <div className="space-y-2">
                    <textarea autoFocus rows={3} maxLength={5000} value={editText} onChange={(e) => setEditText(e.target.value)} className="w-full rounded-lg border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                      <Button size="sm" disabled={!editText.trim() || update.isPending} onClick={() => update.mutate({ id: n.id, body: editText.trim() })}>{update.isPending && <Loader2 className="size-4 animate-spin" />}Save</Button>
                    </div>
                  </div>
                ) : (
                   <div className="flex items-start justify-between gap-2">
                     <div className="flex min-w-0 items-start gap-2">
                       <input
                         type="checkbox"
                         checked={n.is_completed}
                         disabled={toggle.isPending}
                         aria-label="Mark note as completed"
                         onChange={(e) => toggle.mutate({ id: n.id, is_completed: e.target.checked })}
                         className="mt-1 size-4 shrink-0 accent-primary"
                       />
                     <div className="min-w-0">
                       <p className={`whitespace-pre-line break-words ${n.is_completed ? "text-muted-foreground line-through" : ""}`}>{n.body}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Added {fmt(n.created_at)}{new Date(n.updated_at).getTime() - new Date(n.created_at).getTime() > 1000 ? ` · Edited ${fmt(n.updated_at)}` : ""}</p>
                    </div>
                    <div className="flex shrink-0">
                      <Button size="icon" variant="ghost" aria-label="Edit note" onClick={() => { setEditId(n.id); setEditText(n.body); }}><Pencil className="size-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label="Delete note" disabled={del.isPending} onClick={() => { if (confirm("Delete this note?")) del.mutate(n.id); }}><Trash2 className="size-4" /></Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
