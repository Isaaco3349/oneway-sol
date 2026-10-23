# Deploy to Vercel

## GitHub

Repo: push `main` from `oneway-sol` (secrets stay out of git via `.gitignore`).

## Vercel project

1. [vercel.com/new](https://vercel.com/new) → Import the GitHub repo.
2. **Root Directory:** `apps/web` (important for this monorepo).
3. Framework preset: **Next.js** (uses `apps/web/vercel.json` for install/build).
4. **Environment variables** (Production + Preview):

| Name | Value |
|------|--------|
| `AURORA_API_KEY` | Your Studio key |
| `AURORA_CONNECT_API_URL` | `https://intents-connect-api.aurora.dev` |
| `ORIGIN_ASSET_ID` | Base USDC nep141 id |
| `DESTINATION_ASSET_ID` | Solana USDC nep141 id |
| `NEXT_PUBLIC_DEFAULT_ORIGIN_CHAIN` | `base` |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |

5. Deploy. Test `/api/config` → `hasServerApiKey: true`.

## Cursor MCP (GitHub / Vercel)

If you add **GitHub** or **Vercel** MCP servers from the chat **+** menu, the agent can open PRs and trigger deploys from here. This workspace does not include those MCPs yet; until then, `gh` and the Vercel dashboard (or `vercel` CLI) are the path.
