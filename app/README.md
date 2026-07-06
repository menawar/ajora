# Ajora Mini App

Next.js + Tailwind MiniPay Mini App (spec §11). Screens: home, save, pick, crew,
draw, board, wallet, stats.

## Commands

```bash
npm run dev            # local dev server
npm run build          # production build (also the typecheck gate in CI)
npm run check:budget   # bundle budget — run after build
npm run e2e            # core-loop script
npm run keeper:tick    # draw keeper (see DEPLOYMENT.md)
npm run metrics        # nightly rollup collector
```

## Backend env (all optional — the app degrades to on-chain reads)

| Var | Effect when set |
|---|---|
| `NEXT_PUBLIC_INDEXER_URL` | Boards read the indexer (sybil-filtered, one query) instead of walking logs (#60) |
| `NEXT_PUBLIC_PUSH_URL` | Shows the notification opt-in bell (#16) |

## Performance budget (#74)

Spec §11 targets low-end Android on mobile data: **worst-route first-load JS must
stay ≤ 300 KB gzipped**. CI enforces it after every build via
`scripts/check-bundle-budget.mjs`; override locally with `BUNDLE_BUDGET_KB` to
experiment. Baseline 2026-07-06: home route at **204.6 KB gz** (~95 KB headroom).

If the gate trips: check the per-route table it prints, then lazy-load the heavy
dependency (`next/dynamic`) or move it out of the first paint.
