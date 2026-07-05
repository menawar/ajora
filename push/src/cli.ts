import { PushStore } from "./store.ts";
import { runDrawJob, runStreakJob, type JobDeps } from "./jobs.ts";
import { configureVapid, makeSender, readVapidEnv } from "./webpush.ts";

/** One-shot tick for cron use: `node src/cli.ts draw|streak [periodId]`. */
async function main(): Promise<void> {
  const kind = process.argv[2];
  if (kind !== "draw" && kind !== "streak") {
    console.error("usage: node src/cli.ts draw|streak [periodId]");
    process.exit(2);
  }

  configureVapid(readVapidEnv());
  const store = new PushStore(process.env.DB_PATH ?? "./push.db");
  const jobs: JobDeps = {
    store,
    indexerUrl: process.env.INDEXER_URL ?? "http://localhost:42069",
    send: makeSender(store),
  };

  const report =
    kind === "draw"
      ? await runDrawJob(jobs, process.argv[3] ? BigInt(process.argv[3]) : undefined)
      : await runStreakJob(jobs);
  console.log(JSON.stringify(report));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
