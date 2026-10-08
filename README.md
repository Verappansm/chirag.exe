# CHIRAG TANK: THE TRAINING SIMULATOR

A game built as a thank-you. Next.js (App Router) + TypeScript + Tailwind v4 + Framer Motion.

## Run locally
```
npm install
npm run dev        # http://localhost:3100 (or 3000)
```
`.env.local` is pre-generated for local dev; **local admin PIN: 246810**. Admin lives at `/admin`.

## Deploy to Vercel
1. Push to GitHub, import in Vercel.
2. Generate your real PIN hash: `npm run hash-pin -- 123456` (use your own 6 digits). Add the printed
   `ADMIN_PIN_HASH` and `SESSION_SECRET` as Vercel environment variables.
3. **Persistence:** Vercel's filesystem is not writable/persistent. In the Vercel dashboard go to
   Storage / Marketplace, add **Upstash Redis** and connect it to the project. It sets `KV_REST_API_URL` and
   `KV_REST_API_TOKEN`, which the app picks up automatically. Without it, edits live in memory only (the admin
   dashboard shows a warning).
4. Put Chirag's picture at `public/images/chirag.png` (a "CT" monogram shows until you do).

## How content works
`data/*.json` are the seed/defaults. Admin edits are stored in the storage provider (`lib/storage`) and override
the seed. `lib/repo.ts` is the only place that merges them. Swap providers by editing `getStorage()`.
"Settings → Reset" restores a section to its seed; "Download all content" gives a JSON backup.

## Structure
- `app/` routes: `/` boot, `/hub`, `/games/{trainee,chirag-says,timeline}`, `/finale`, `/admin/*`, `/api/admin/*`
- `components/game` public experience, `components/admin` CMS, `components/ui|animations` shared bits
- `lib/auth` PIN + signed cookie, `lib/validation` input sanitising, `lib/storage` providers
- **Add a new game:** add a card to `LEVELS` in `components/game/Hub.tsx`, create `app/games/<name>/page.tsx`.

## Memes
No meme URLs are bundled (none could be verified, and none were invented). Each timeline event has a search
query; open **Admin → Meme timeline**, click the "Search GIPHY" link, copy a direct GIF/mp4 URL into
"Meme / GIF URL" and the page URL into "Source". Empty or broken URLs show a fallback card, never a broken layout.

## Security notes
PIN is scrypt-hashed in an env var, verified server-side, session is an HMAC-signed httpOnly/SameSite=Strict cookie,
login is throttled (best effort), all admin writes are validated/sanitised server-side. Public pages receive
quiz answers in their page data (it's a friendly game, not an exam).
