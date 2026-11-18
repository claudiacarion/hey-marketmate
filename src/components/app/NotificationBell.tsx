import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, CheckCheck, FileClock, Image, Rocket, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { buildNotifications, type CampaignRow } from "@/lib/notifications";

const icons = { post: CalendarDays, draft: FileClock, poster: Image, ready: Sparkles, launch: Rocket };
const KEY = "mm-read-notifications";

export function NotificationBell() {
  const [read, setRead] = useState<string[]>([]);
  useEffect(() => { try { setRead(JSON.parse(localStorage.getItem(KEY) ?? "[]")); } catch { /* ignore */ } }, []);
  const save = (ids: string[]) => { setRead(ids); localStorage.setItem(KEY, JSON.stringify(ids.slice(-300))); };

  const { data = [] } = useQuery({
    queryKey: ["campaigns", "notifications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaigns").select("id,title,status,created_at,poster,plan,brief").order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      return data as unknown as CampaignRow[];
    },
    refetchInterval: 5 * 60_000,
  });
  const items = useMemo(() => buildNotifications(data), [data]);
  const unread = items.filter((n) => !read.includes(n.id)).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`} className="relative">
          <Bell className="size-4" />
          {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-4 text-accent-foreground">{unread > 9 ? "9+" : unread}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-display font-semibold">Notifications</span>
          {unread > 0 && <button onClick={() => save([...read, ...items.map((n) => n.id)])} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"><CheckCheck className="size-3.5" /> Mark all as read</button>}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">You're all caught up. Create a campaign and reminders will appear here.</p>
          ) : items.map((n) => {
            const Icon = icons[n.kind];
            const isRead = read.includes(n.id);
            return (
              <Link key={n.id} to="/campaigns/$id" params={{ id: n.campaignId }} onClick={() => !isRead && save([...read, n.id])}
                className={`flex gap-3 border-b px-4 py-3 last:border-0 hover:bg-muted/60 ${isRead ? "opacity-60" : ""}`}>
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-primary"><Icon className="size-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-semibold">{n.title}{!isRead && <span className="size-1.5 rounded-full bg-accent" />}</span>
                  <span className="line-clamp-2 text-xs text-muted-foreground">{n.body}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
