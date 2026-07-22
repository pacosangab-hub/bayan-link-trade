<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Cursor Cloud specific instructions

PSG Supply Gateway is a TanStack Start (React 19) + Vite SSR app — a mostly client-side B2B marketplace demo backed by in-memory/localStorage mock stores (`src/lib/*-store.ts`, `src/lib/mock-data.ts`). Supabase is configured via `.env` (`VITE_SUPABASE_*`) but most flows work without a live backend.

- Package manager: this repo has both `bun.lock` and `package-lock.json`, but `bun` is not installed in this environment; use `npm` (the update script runs `npm install`).
- Run the dev server with `npm run dev` (script in `package.json`). It serves on `http://localhost:8080/` (port fixed by the Lovable Vite config), not the Vite default 5173.
- Other scripts (see `package.json`): `npm run lint` (ESLint), `npm run build` (production SSR build), `npm run preview`.
- `npm run lint` currently reports thousands of pre-existing `prettier/prettier` formatting errors in the committed source. This is the repo's existing state, not an environment problem — do not mass-reformat unless asked.
- Demo login: the `/login` page has "Continue as Buyer/Supplier/Admin" buttons that set a local auth session (`src/lib/auth-store.ts`) with no real credentials or Supabase call — use these to exercise authenticated flows.
- Only "In Stock" products expose "Add to Cart"/"Buy Now"; "Made to Order" products only offer "Request Custom Quote". Some mock product links can 404, which is expected demo-data behavior.
