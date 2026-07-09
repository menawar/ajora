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

## Deploy (#66)

### systemd service

```bash
sudo useradd -r -s /usr/sbin/nologin ajora
sudo mkdir -p /opt/ajora/push
sudo cp -r . /opt/ajora/push
sudo cp deploy/push.service /etc/systemd/system/ajora-push.service
sudo systemctl daemon-reload
sudo systemctl enable --now ajora-push
```

### Nightly backup

A cron entry or systemd timer runs `deploy/backup.sh` daily:

```bash
# /etc/cron.d/ajora-push-backup
15 3 * * * ajora /opt/ajora/push/deploy/backup.sh
```

Backups go to `/opt/ajora/backups/push/` by default. The script prunes files
older than 30 days.

### Restore

```bash
systemctl stop ajora-push
cp /opt/ajora/backups/push/push-20260708T031500Z.db /opt/ajora/push/push.db
systemctl start ajora-push
```

Verify the restore: `journalctl -u ajora-push -n 20 --no-pager`. Database
integrity is checked at backup time (no automatic check on restore — run
`sqlite3 push.db "PRAGMA integrity_check;"` to verify manually).

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
