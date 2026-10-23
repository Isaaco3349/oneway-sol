# Aurora Intents Connect integration

This document is the technical source of truth for judges and reviewers.

## Product used

**Intents Connect** — mode **`quote_with_steps`** (bridge-in), destination **`type: "solana"`**.

Official reference: [Kamino stake scenario](https://docs.intents.aurora.dev/intents-connect/developer-guides/solana/kamino-stake-scenario.md)

## API surface (via proxy)

Base URL (server): `AURORA_CONNECT_API_URL`  
Auth: header `x-api-key: AURORA_API_KEY`

| Step | Method | Path |
|------|--------|------|
| Resolve intermediary | `GET` | `/api/v1/executions/{evmWallet}/intermediary` |
| Create bridge-in + steps | `POST` | `/api/v1/executions/{evmWallet}` |
| Submit origin signature | `POST` | `/api/v1/executions/{evmWallet}/submit` |
| Notify deposit | `POST` | `/api/v1/executions/deposit/submit` |

Implementation: `packages/connect/src/aurora/client.ts`, `apps/web/src/app/api/aurora/[...path]/route.ts`.

## Create execution body (shape)

```json
{
  "version": "1.0",
  "type": "solana",
  "quote": {
    "originAsset": "<1Click id: USDC on Base>",
    "amount": "25000000",
    "destinationAsset": "<1Click id: USDC on Solana>",
    "slippageTolerance": 100,
    "swapType": "EXACT_INPUT",
    "deadline": "<ISO-8601>"
  },
  "steps": [ "refresh_reserve", "deposit_reserve_liquidity" ],
  "metadata": { "title": "OneWay Kamino stake", "intent": "kamino_stake" },
  "dry": false
}
```

Steps are built in code with Kamino mainnet reserve addresses. Bridge-in deposit amount uses placeholder **`{MIN_AMOUNT_OUT}`** on the deposit instruction — Aurora fills post-fee bridged USDC.

## Signing (EVM origin)

1. Read `result.details.payload.payload_json` **as a string** — do not re-serialize JSON.
2. `personal_sign([payloadJson, walletAddress])`.
3. Normalize `v` (27/28 → 0/1), base58-encode 65 bytes, prefix `secp256k1:`.
4. Submit `{ signature, executionId }` only (no `publicKey`).

Code: `packages/connect/src/evm/sign-erc191.ts`  
Spec: [Submit signing](https://docs.intents.aurora.dev/intents-connect/developer-guides/submit-signing.md)

## Deposit lifecycle

After create + submit:

1. Display `result.quote.depositAddress` (and `depositMemo` if present).
2. User sends **EXACT_INPUT** amount on origin chain.
3. Call deposit submit with `{ txHash, depositAddress, memo? }`.

Bridge-in timing: settlement can take ~minutes; Kamino tx is pre-signed to run on arrival.

## Asset IDs

Run:

```bash
pnpm --filter @oneway/web resolve-assets
```

Or query 1Click token list and set `ORIGIN_ASSET_ID` / `DESTINATION_ASSET_ID` in `.env`.

## Studio setup

1. Create project at https://studio.aurora.dev  
2. Generate API key with Intents Connect enabled  
3. (Optional) Configure integrator fee % for demo narrative  

## Testing checklist

- [ ] Intermediary returns non-null `result.solana`
- [ ] Create execution returns `executionId`, `details.payload`, `quote.depositAddress`
- [ ] Submit returns success
- [ ] Origin deposit tx confirms
- [ ] deposit/submit accepted
- [ ] cUSDC ATA balance increases on intermediary (Solscan)

## Bonus criteria mapping

| Aurora bonus | OneWay |
|--------------|--------|
| Multi-chain source | Demo second `ORIGIN_ASSET_ID` (e.g. Arbitrum) |
| Contract composability | Future: add custom Anchor step after Kamino deposit |
| Confidential Intents | Out of scope unless time remains |
