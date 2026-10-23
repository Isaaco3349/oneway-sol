# Architecture

## Problem

Users hold stablecoins on **non-Solana** chains. Solana apps (here: **Kamino lending**) lose them at the **deposit step** — wallets, bridges, and gas tokens multiply friction.

## Solution

OneWay uses **Aurora Intents Connect** *quote-with-steps* (bridge-in):

1. User expresses intent: “Supply USDC to Kamino on Solana.”
2. Aurora returns a **quote** (origin deposit address, amounts) plus **Solana steps** (Kamino refresh + deposit).
3. User signs the **NEAR Intents** payload with their **EVM** wallet (`erc191`).
4. User sends origin-chain USDC to the quote deposit address.
5. After 1Click settlement, Aurora executes Kamino instructions from the user’s **Solana intermediary**.

## Components

### `packages/connect`

| Module | Responsibility |
|--------|----------------|
| `kamino/stake-steps.ts` | Builds Aurora-compatible `steps[]` for Kamino USDC reserve |
| `solana/ata.ts` | Derives intermediary USDC / cUSDC ATAs |
| `evm/sign-erc191.ts` | MetaMask `personal_sign` → `secp256k1:…` submit encoding |
| `aurora/client.ts` | HTTP client for Connect API (used server-side or in tests) |

Design choice: keep **all protocol constants** (Kamino reserve addresses, discriminators) in one package so the web app stays thin.

### `apps/web`

| Surface | Responsibility |
|---------|----------------|
| `StakePanel` | UX state machine aligned with Aurora bridge-in lifecycle |
| `useStakeFlow` | Orchestrates intermediary → create → sign → submit → deposit record |
| `/api/aurora/[...path]` | Reverse proxy; injects `x-api-key` |
| `/api/config` | Exposes non-secret config to client |

## Security

- **`AURORA_API_KEY` must never be bundled client-side.** All authenticated Connect calls go through the Next proxy.
- Users sign **intent messages**, not arbitrary transactions on Solana — the service constructs the Kamino transaction.

## Failure modes (product + judging)

| Failure | UX |
|---------|-----|
| Quote expired | Show deadline; regenerate quote |
| Wrong deposit amount | Document EXACT_INPUT rules; show quoted amount |
| Bridge delay | “Awaiting settlement (~minutes)” state |
| Kamino revert (rare on bridge-in) | Explain stranded USDC in intermediary + steps-only recovery (Aurora docs) |

## Extension hooks (post-checkpoint)

- **Second origin chain** in demo (e.g. Arbitrum USDC) — same UI, different `ORIGIN_ASSET_ID`.
- **Integrator fee** in Aurora Studio — revenue slide for judges.
- **Position dashboard** — read cUSDC balance via Solana RPC for intermediary ATA.
- **Withdraw path** — Kamino withdraw scenario (steps-only) for full earn lifecycle.

## Non-goals (timeboxed)

- Custom Anchor program (unless checkpoint is early).
- Intents Deposits PDAs (separate product surface; org approval).
- x402 (optional second track; not required for Aurora).
