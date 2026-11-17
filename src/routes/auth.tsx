import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Sparkles, CalendarDays, Megaphone, MailCheck } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const searchSchema = z.object({ redirect: z.string().optional() });

function safePath(p?: string) {
  return p && p.startsWith("/") && !p.startsWith("//") && !p.startsWith("/auth") ? p : "/";
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  ssr: false,
  head: () => ({
    meta: [
      { title: "Welcome to MarketMate — Sign in" },
      { name: "description", content: "Sign in or create your MarketMate account to plan campaigns with your AI marketing assistant." },
      { property: "og:title", content: "Welcome to MarketMate" },
      { property: "og:description", content: "Your AI marketing assistant for small businesses. Sign in or create an account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const GoogleLogo = () => (
  <svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
);

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const dest = safePath(search.redirect);
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => {
    sessionStorage.setItem("marketmate.redirect", dest);
    supabase.auth.getUser().then(({ data }) => { if (data.user) navigate({ to: dest, replace: true }); });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate({ to: sessionStorage.getItem("marketmate.redirect") ?? "/", replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [dest, navigate]);

  async function google() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth` } });
    if (error) setError(friendly(error.message));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "signup") {
        if (password.length < 8) throw new Error("Please use at least 8 characters for your password.");
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth`, data: { full_name: name.trim() || undefined } } });
        if (error) throw error;
        if (!data.session) setSent(`We sent a confirmation link to ${email}. Click it to activate your account.`);
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setSent(`If an account exists for ${email}, a reset link is on its way.`);
      }
    } catch (err) {
      setError(friendly(err instanceof Error ? err.message : "Something went wrong."));
    } finally { setBusy(false); }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-hero p-12 text-hero-foreground lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl bg-warm font-display text-lg font-bold text-foreground">M</span>
          <span className="font-display text-2xl font-semibold">MarketMate</span>
        </div>
        <div className="max-w-md rise">
          <h1 className="font-display text-5xl font-semibold leading-tight">Marketing that runs while you run your business.</h1>
          <p className="mt-4 text-hero-muted">Your AI strategist plans campaigns, writes posts and designs posters — tailored to your shop, salon, studio or café.</p>
          <ul className="mt-8 space-y-3 text-sm">
            <li className="flex items-center gap-3"><Sparkles className="size-4 text-hero-accent" /> Campaign strategies in seconds</li>
            <li className="flex items-center gap-3"><Megaphone className="size-4 text-hero-accent" /> Ready-to-post social content</li>
            <li className="flex items-center gap-3"><CalendarDays className="size-4 text-hero-accent" /> A clear 7-day plan to follow</li>
          </ul>
        </div>
        <p className="text-xs text-hero-muted">© MarketMate</p>
      </section>

      <section className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm rise">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid size-9 place-items-center rounded-xl bg-warm font-display font-bold text-foreground">M</span>
            <span className="font-display text-xl font-semibold">MarketMate</span>
          </div>
          {sent ? (
            <div className="panel p-6 text-center">
              <MailCheck className="mx-auto mb-3 size-8 text-accent" />
              <h2 className="text-2xl font-semibold">Check your inbox</h2>
              <p className="mt-2 text-sm text-muted-foreground">{sent}</p>
              <Button variant="ghost" className="mt-4" onClick={() => { setSent(null); setMode("signin"); }}>Back to sign in</Button>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-semibold">{mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Welcome back"}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{mode === "signup" ? "Start planning smarter campaigns today." : mode === "forgot" ? "We'll email you a link to choose a new password." : "Sign in to your marketing workspace."}</p>

              {mode !== "forgot" && (
                <>
                  <button type="button" onClick={google}
                    className="mt-8 flex h-12 w-full items-center justify-center gap-[10px] rounded-xl border border-[#747775] bg-[#FFFFFF] px-3 text-[14px] font-medium leading-5 text-[#1F1F1F] shadow-soft transition hover:bg-[#F8F8F8]"
                    style={{ fontFamily: "'Google Sans', 'Plus Jakarta Sans', sans-serif" }}>
                    <GoogleLogo /> Continue with Google
                  </button>
                  <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
                    <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
                  </div>
                </>
              )}

              <form onSubmit={submit} className={`space-y-4 ${mode === "forgot" ? "mt-8" : ""}`}>
                {mode === "signup" && (
                  <div className="space-y-1.5"><Label htmlFor="name">Your name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} /></div>
                )}
                <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={255} /></div>
                {mode !== "forgot" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      {mode === "signin" && <button type="button" className="text-xs text-primary hover:underline" onClick={() => { setMode("forgot"); setError(null); }}>Forgot password?</button>}
                    </div>
                    <Input id="password" type="password" required minLength={mode === "signup" ? 8 : undefined} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
                  </div>
                )}
                {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={busy} className="h-11 w-full rounded-xl">
                  {busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "signin" ? <>New to MarketMate? <button className="font-medium text-primary hover:underline" onClick={() => { setMode("signup"); setError(null); }}>Create an account</button></>
                  : <>Already have an account? <button className="font-medium text-primary hover:underline" onClick={() => { setMode("signin"); setError(null); }}>Sign in</button></>}
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function friendly(msg: string) {
  if (/invalid login credentials/i.test(msg)) return "That email and password don't match. Try again or reset your password.";
  if (/email not confirmed/i.test(msg)) return "Please confirm your email first — check your inbox for the link.";
  if (/already registered/i.test(msg)) return "An account with this email already exists. Try signing in instead.";
  if (/provider is not enabled/i.test(msg)) return "Google sign-in isn't switched on yet. Please use email for now.";
  return msg;
}
