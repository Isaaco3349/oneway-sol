# OneWay

**Any-chain USDC → Kamino yield on Solana, one signature.**

OneWay is a consumer onboarding app for [Solana Hackathon 2026](https://www.encodeclub.com/programmes/solana-hackathon-2026), built around **[Aurora Intents Connect](https://docs.intents.aurora.dev/intents-connect/developer-guides/solana)** (Route A: bridge-in + on-chain execution).

Users connect an **EVM wallet** (demo: Base USDC), sign an intent, deposit to Aurora’s quote address, and the backend **bridges + supplies USDC to Kamino Main Market** on Solana — receiving **cUSDC** on the user’s Solana intermediary account.

| Track | Fit |
|--------|-----|
| **Aurora Intents** | Live Connect bridge-in + Kamino `refresh_reserve` / `deposit_reserve_liquidity` steps |
| **Best Consumer App** | “I have USDC elsewhere — earn on Solana without learning bridges” |
| **Solana** | Kamino position on Solana mainnet; EVM-origin signing |

---

## Architecture (30 seconds)

```text
┌─────────────┐     sign intent (EIP-191)      ┌──────────────────────┐
│  EVM wallet │ ─────────────────────────────► │ Aurora Intents Connect│
│  (Base)     │     deposit USDC on origin      │  + NEAR Intents 1Click │
└─────────────┘ ─────────────────────────────► └──────────┬───────────┘
                                                            │ bridge settles
                                                            ▼
                                                 ┌──────────────────────┐
                                                 │ Solana intermediary   │
                                                 │  → Kamino USDC supply │
                                                 └──────────────────────┘
```

- **`@oneway/connect`** — Kamino step builder, ATA derivation, ERC-191 signature encoding, typed API client.
- **`apps/web`** — Next.js UI + **server proxy** (`/api/aurora/*`) so `AURORA_API_KEY` never ships to the browser.

Deep dive: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) · [docs/AURORA_INTEGRATION.md](./docs/AURORA_INTEGRATION.md)

---

## Prerequisites

- **Node.js 20+**, **pnpm 9**
- [Aurora Studio](https://studio.aurora.dev) API key (Intents Connect)
- EVM wallet with **USDC on Base** (or change asset IDs for another origin)
- Small amount of **ETH on Base** for the deposit transaction gas

> Kamino steps in this repo target **Solana mainnet** reserve accounts documented by Aurora. The hackathon accepts devnet demos where applicable; our primary path follows Aurora’s **mainnet Kamino** reference for judge familiarity.

---

## Quick start

```bash
git clone <your-repo-url> oneway-sol
cd oneway-sol
pnpm install
cp .env.example .env
```

1. Set `AURORA_API_KEY` in `.env` (repo root — loaded by Next.js from `apps/web` via symlink or copy; see below).
2. Resolve asset IDs:

```bash
pnpm --filter @oneway/web resolve-assets
# Paste into .env:
# ORIGIN_ASSET_ID=...
# DESTINATION_ASSET_ID=...
```

3. Create **`apps/web/.env.local`** (gitignored — it will not show in Git until you add secrets locally):

```bash
cp .env.example apps/web/.env.local
# Paste AURORA_API_KEY, then run resolve-assets if IDs are empty
pnpm --filter @oneway/web resolve-assets
```

4. Run the app:

```bash
pnpm dev
# open http://localhost:3000
```

---

## User flow (demo script)

1. Connect MetaMask (Base network).
2. **Show Solana intermediary** — deterministic ed25519 account for your EVM address.
3. Enter USDC amount → **Stake** — creates bridge-in execution, prompts **personal_sign**, submits signature.
4. Send **exact** origin USDC to `depositAddress` on Base.
5. Paste origin **tx hash** → `POST /executions/deposit/submit`.
6. After bridge settlement, Kamino supply runs; cUSDC appears on the intermediary (verify on Solscan).

Full narrator script: [docs/DEMO_SCRIPT.md](./docs/DEMO_SCRIPT.md)

---

## Environment variables

| Variable | Where | Description |
|----------|--------|-------------|
| `AURORA_API_KEY` | Server only | From [Aurora Studio](https://studio.aurora.dev) |
| `AURORA_CONNECT_API_URL` | Server | Default `https://intents-connect-api.aurora.dev` |
| `ORIGIN_ASSET_ID` | Server | 1Click asset id for origin USDC (e.g. Base) |
| `DESTINATION_ASSET_ID` | Server | 1Click asset id for Solana USDC |
| `NEXT_PUBLIC_DEFAULT_ORIGIN_CHAIN` | Public | UI label (`base`) |

---

## Repository layout

```text
oneway-sol/
├── apps/web/              # Next.js app (UI + API proxy)
├── packages/connect/      # Aurora Connect + Kamino step library
├── docs/                  # Architecture, hackathon plan, demo script
├── scripts/               # (optional) shared tooling
├── .env.example
└── README.md
```

---

## Hackathon timeline (team of 1–2)

| Milestone | Target | Deliverable |
|-----------|--------|-------------|
| **Checkpoint 1** | ~2 Nov | End-to-end bridge-in + deposit recorded; short screen capture |
| **Final** | ~8 Nov | Second chain in video, error states, 2–4 min demo, slides |
| **Aurora bonus** | Final | Document integrator fee config + roadmap for production |

Plan: [docs/HACKATHON.md](./docs/HACKATHON.md)

---

## How Solana powers OneWay

Solana is not a wallet-connect accessory: the **economic outcome** (Kamino supply, **cUSDC** collateral token) lives on Solana mainnet. Aurora routes external liquidity into a **Solana intermediary** controlled by the user’s origin wallet, then executes Kamino lending instructions in the same intent.

---

## How Aurora Intents powers OneWay

- **Persistent cross-chain quoting** via 1Click (`quote` on create execution).
- **Intents Connect** composability: `{MIN_AMOUNT_OUT}` deposit amount after bridge fees.
- **Single signature** on origin before deposit (pre-signed Kamino tx fires on settlement).

References:

- [Kamino stake scenario](https://docs.intents.aurora.dev/intents-connect/developer-guides/solana/kamino-stake-scenario.md)
- [Submit signing (EVM)](https://docs.intents.aurora.dev/intents-connect/developer-guides/submit-signing.md)

---

## Development

```bash
pnpm typecheck
pnpm build
```

---

## Submission checklist (Encode)

- [ ] Working demo (live Connect flow, not mocked)
- [ ] Public GitHub with this README + setup steps
- [ ] 2–4 minute demo video
- [ ] Slides: problem, flow, Aurora integration, failure handling
- [ ] Encode project page: repo link + demo URL

---

## License

MIT — see [LICENSE](./LICENSE).

---

## Support during the build

- Aurora docs: https://docs.intents.aurora.dev/
- Aurora Telegram (linked from hackathon programme)
- Office hours: request via hackathon / Aurora channels (workshop attendance **not** required)
