# Demo video script (2–4 minutes)

## Setup (before recording)

- Browser: clean profile, MetaMask on **Base**, small USDC + ETH for gas  
- `.env` configured; app running locally or on Vercel  
- Solscan tab ready (intermediary address copied)  
- Hide API keys; use test wallet

## Scene 1 — Problem (20s)

> “Most people’s USDC isn’t on Solana. Solana DeFi loses them at the deposit step — bridges, networks, and gas. OneWay fixes that with Aurora Intents Connect.”

## Scene 2 — Product (15s)

Show homepage. Read subtitle: any-chain USDC → Kamino on Solana, one signature.

## Scene 3 — Connect (20s)

Click **Connect wallet**. Show EVM address. Click **Show Solana intermediary** — explain this is the user’s deterministic Solana execution account tied to their EVM wallet.

## Scene 4 — Intent (45s)

Enter amount (e.g. 10 USDC). Click **Stake → Kamino**.

- MetaMask **Sign message** appears — clarify this is an **intent**, not sending USDC yet.  
- After submit, show **deposit address** and exact amount.

## Scene 5 — Deposit (40s)

Send USDC on Base to deposit address in MetaMask. Copy tx hash. Paste into **Record deposit**.

## Scene 6 — Outcome (30s)

Switch to Solscan — intermediary cUSDC token account. Explain bridge settlement time. Show cUSDC balance (or “pending” honestly if still settling).

## Scene 7 — Aurora + Solana (25s)

> “Aurora routed Base USDC through NEAR Intents and executed Kamino supply on Solana. Solana holds the yield position as cUSDC.”

Show repo README architecture diagram.

## Scene 8 — Close (15s)

> “OneWay is deposit abstraction for any Solana consumer app — savings, games, memberships — with integrator fees on every cross-chain flow.”

## B-roll (optional)

- Aurora docs Kamino page  
- Second origin chain quote (still image OK)

## Honesty notes

If settlement is slow during recording, cut to a prior successful Solscan screenshot labeled “earlier test deposit” — judges prefer honesty over fake instant success.
