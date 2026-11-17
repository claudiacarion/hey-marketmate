<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Structure
- Keep app branding in shared CSS semantic tokens and mirror the logo gradient in the public SVG favicon; this updates all screens without altering saved poster or business colours.
- Pair dark gradient sections with hero foreground tokens, not primary button foregrounds; independent roles preserve contrast when brand colours change.
- App shell (sidebar + top bar) lives in src/components/app/AppShell.tsx and wraps <Outlet /> in src/routes/_authenticated/route.tsx; each section is its own route file.
- Placeholder figures live in src/lib/sample-data.ts until real data/AI is wired in, so they can be swapped in one place.
- All app pages live under src/routes/_authenticated/ (client-only gate + AppShell); /auth and /reset-password are the only public pages — keeps every workspace screen behind sign-in.
- Posters are drawn client-side on <canvas> (src/lib/poster/render.ts); stock photos are curated CC0/CC BY files uploaded as Lovable assets, with credits in src/lib/poster/photo-library.json — no paid image APIs, and licences stay traceable.
- User photo uploads and saved poster PNGs live in the private `posters` bucket under `<user_id>/…`; poster settings are stored in campaigns.poster — keeps files owner-only via storage RLS.
- Poster templates live in src/lib/poster/templates.ts (drawDesign dispatches templates, falls back to render.ts classic layouts) — old saved posters keep rendering unchanged.

- Colour-only poster styles live in src/lib/poster/colour-styles.ts (layout ids "c-*"); AI designs are a validated spec (src/lib/poster/ai-design.ts, layout "ai", stored as campaigns.poster.aiSpec) from the design-poster Edge Function — text-only Gemini, no image generation.
