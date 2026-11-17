import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { ReactNode } from "react";
import { LayoutDashboard, Megaphone, Sparkles, CalendarDays, BarChart3, Store, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/app/NotificationBell";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/studio", label: "Content Studio", icon: Sparkles },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/insights", label: "Insights", icon: BarChart3 },
  { to: "/business", label: "My Business", icon: Store },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar p-5 text-sidebar-foreground lg:flex">
        <Link to="/" className="mb-10 flex items-center gap-2.5 px-2">
          <span className="grid size-9 place-items-center rounded-xl bg-warm font-display text-lg font-bold text-foreground">M</span>
          <span className="font-display text-xl font-semibold">MarketMate</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? path === "/" : path.startsWith(to);
            return (
              <Link key={to} to={to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"}`}>
                <Icon className={`size-4 ${active ? "text-sidebar-primary" : ""}`} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-2xl bg-sidebar-accent p-4">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold"><Sparkles className="size-4 text-sidebar-primary" /> Your AI agent</div>
          <p className="text-xs leading-relaxed text-sidebar-foreground/70">Autonomous planning arrives soon. It'll draft campaigns while you run your business.</p>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background/85 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 backdrop-blur lg:px-10">
          <div className="flex shrink-0 items-center gap-2 lg:hidden">
            <span className="grid size-8 place-items-center rounded-lg bg-warm font-display font-bold text-foreground">M</span>
          </div>
          <div className="flex-1" />
          <NotificationBell />
          <Button asChild className="shrink-0 rounded-xl max-sm:size-9 max-sm:px-0"><Link to="/studio" aria-label="New campaign"><Plus className="size-4" /><span className="hidden sm:inline">New campaign</span></Link></Button>
          <UserMenu />
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b px-4 py-2 lg:hidden">
          {nav.map(({ to, label }) => (
            <Link key={to} to={to} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-muted-foreground" activeProps={{ className: "bg-secondary text-foreground" }} activeOptions={{ exact: to === "/" }}>{label}</Link>
          ))}
        </nav>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 rise">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Live: "bg-success/15 text-success",
    Scheduled: "bg-highlight/40 text-highlight-foreground",
    Draft: "bg-muted text-muted-foreground",
    Completed: "bg-primary/10 text-primary",
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${map[status] ?? map["Draft"]}`}>{status}</span>;
}

function UserMenu() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      setName((data.user?.user_metadata?.["full_name"] as string | undefined) ?? "");
    });
  }, []);
  const initials = (name || email || "?").split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Account menu" className="grid size-9 place-items-center rounded-full bg-highlight text-sm font-semibold text-highlight-foreground">{initials}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          {name && <div className="text-sm font-semibold">{name}</div>}
          <div className="truncate text-xs text-muted-foreground">{email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}><LogOut className="size-4" /> Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
