# Environment setup

Next.js loads **`apps/web/.env.local`** only (not the repo root). That file is gitignored, so it will not appear in GitHub — you create it locally once.

## Variables

| Variable | Where to get it |
|----------|-----------------|
| `AURORA_API_KEY` | [Aurora Studio](https://studio.aurora.dev) → your project → API keys (Intents Connect). **Server-only.** |
| `AURORA_CONNECT_API_URL` | Leave as `https://intents-connect-api.aurora.dev` unless Aurora docs say otherwise. |
| `ORIGIN_ASSET_ID` | 1Click id for **USDC on the chain you deposit from** (demo: Base). Run `pnpm --filter @oneway/web resolve-assets` or use the values already in `.env.local`. |
| `DESTINATION_ASSET_ID` | 1Click id for **USDC on Solana** (Kamino path). Same script. |
| `NEXT_PUBLIC_DEFAULT_ORIGIN_CHAIN` | UI label only (`base`). |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally; your Vercel URL in production. |

## Quick start

1. Open `apps/web/.env.local`.
2. Paste your key: `AURORA_API_KEY=your_key_here` (no quotes).
3. Restart dev server: `pnpm dev` from repo root.

Verify: open `http://localhost:3000/api/config` — `hasServerApiKey` should be `true`.

## Vercel

Add the same variables in Project → Settings → Environment Variables (all except `NEXT_PUBLIC_*` as secrets).
