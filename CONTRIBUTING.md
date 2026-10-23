# Contributing (hackathon sprint)

This repo is optimized for a **solo/duo** Encode × Aurora submission.

## Branch strategy

- `main` — always demoable; matches checkpoint/final submissions
- Feature branches only for risky spikes (merge within 24h)

## Before opening a PR

```bash
pnpm install
pnpm typecheck
pnpm build
```

## Secrets

Never commit `.env` or API keys. Use Vercel env vars for deployed demos.

## Scope guardrails

- Aurora **Intents Connect** bridge-in + Kamino only
- No parallel x402 / Swap Widget tracks until Aurora flow is on video
