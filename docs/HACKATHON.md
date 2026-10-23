# Hackathon execution plan (solo / duo)

**Primary prize target:** Aurora Intents ($1,500 / $1,000 / $500)  
**Secondary narrative:** Best Consumer App (accelerator)

## Scope lock

We ship **OneWay** only:

- Aurora **Intents Connect** bridge-in  
- **Kamino USDC supply** on Solana mainnet (Aurora-documented reserve)  
- EVM-origin demo (**Base USDC**)

We explicitly do **not** parallelize x402 or Swap Widget tracks in v1.

## Dates (Europe/London)

| Event | Date |
|--------|------|
| Checkpoint 1 | ~2 Nov 2026 |
| Registration closes | With checkpoint |
| Final submission | ~8 Nov 2026, 23:59 UTC-12 |
| Winners | ~16 Nov 2026 |

**Oct 28 Aurora workshop:** optional; not required for submission.

## Roles (2 people)

| Person | Owns |
|--------|------|
| **A** | Connect API, signing, deposit lifecycle, Solscan verification |
| **B** | UI, demo video, slides, Encode project page |

Solo: follow A then B; cut slides to 3 frames.

## Checkpoint 1 (must ship)

Minimum credible Aurora demo:

1. Intermediary fetch on real wallet  
2. Create + sign + submit succeeds  
3. One real origin deposit + deposit/submit  
4. README setup works on fresh clone  
5. 60–90s uncut screen recording  

Nice-to-have: Kamino supply confirmed on-chain.

## Final submission

1. **2–4 min video** — pain → connect wallet → sign → deposit → Solscan cUSDC  
2. **Second chain** clip or chapter (e.g. “also works from Arbitrum”)  
3. **Failure slide** — expired quote or wrong network message  
4. **Integrator fee** mention (Aurora Studio)  
5. Deployed demo URL (Vercel + env vars)

## Risk register

| Risk | Mitigation |
|------|------------|
| Wrong asset IDs | `resolve-assets` script + verify in `/api/config` |
| API key in client | Proxy-only (already enforced) |
| Bridge-in revert | Stay with documented Kamino two-step; avoid custom instructions |
| Low test funds | Use minimum USDC (e.g. 5–10) on Base |
| Mainnet vs devnet wording | README states mainnet Kamino path per Aurora docs |

## Encode project copy (draft)

**Title:** OneWay — Any-chain yield on Solana  
**One-liner:** Bridge USDC from Base and supply Kamino in one Aurora Intents Connect flow.  
**Category:** Consumer / payments  
**Partner track:** Aurora Intents Connect  

## Post-hackathon

Aurora winner bundle includes office hours + BD — position OneWay as deposit abstraction for any Solana consumer app (games, memberships, savings).
