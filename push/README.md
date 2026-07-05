# Ajora push service

Web Push backend for draw results and streak-at-risk nudges (issue #16,
AJORA_SPEC.md §10/§11). Node ≥ 23.6, zero build step (native TS execution),
zero native deps (`node:sqlite`).

## How it works

```
indexer /notify/draw/:id ─┐
indexer /notify/at-risk ──┤→ jobs (policy-gated) → web-push → MiniPay/browser
subscriptions (SQLite) ───┘
```

- **Draw job**: after the 00:08 UTC reveal, winners get "You won X cUSD", other
  pickers get the winning number. Target period defaults to yesterday.
- **Streak job**: users whose `lastCheckInDay == today - 1` (live streak, not yet
  checked in) get one nudge in the 18:00–24:00 UTC window.
- **Policy** (`src/policy.ts`): per-user quiet hours (default 21:00–05:00 UTC —
  results land next morning instead of 2 AM local), max 3 pushes/user/day, and
  at-most-once per (subscriber, kind, event) via the send log's unique key.
  Quiet hours *defer* (a later tick delivers); dedupe *silences* reruns.
- **Scheduler**: internal 15-minute tick. `POST /tick/draw|streak` (Bearer
  `TICK_TOKEN`) and `npm run tick:draw|tick:streak` exist for cron/ops.

## Run

```bash
npm install
npm run vapid          # once: paste keys into .env (see .env.example)
set -a; . ./.env; set +a
npm start              # listens on :42070
```

## API

- `GET /health` · `GET /vapid-public-key` · `GET /metrics` (delivery counts by kind)
- `POST /subscriptions` `{ address, subscription, quietStart?, quietEnd? }` —
  the app sends the `PushSubscription.toJSON()` plus the wallet address
- `DELETE /subscriptions` `{ endpoint }`
- `POST /tick/draw` / `POST /tick/streak` — Bearer `TICK_TOKEN`

Dead subscriptions (push service returns 404/410) are pruned automatically.

## Tests

`npm test` — store, policy, and job suites (node:test, in-memory SQLite,
injected fake sender/indexer). `npm run typecheck` for tsc.
