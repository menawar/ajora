#!/usr/bin/env node
/**
 * Bundle budget gate (#74, AJORA_SPEC.md §11): the app must load on low-end Android
 * over mobile data, so the worst route's first-load JS must stay under 300 KB gzipped.
 *
 * Reads the .next build manifests (run `next build` first), gzips every chunk a route
 * ships on first load (shared + route-specific), and fails when the worst route busts
 * the budget. Override for experiments with BUNDLE_BUDGET_KB.
 *
 * Usage: node scripts/check-bundle-budget.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const BUDGET_KB = Number(process.env.BUNDLE_BUDGET_KB ?? 300);
const NEXT_DIR = ".next";

const manifestPath = join(NEXT_DIR, "app-build-manifest.json");
if (!existsSync(manifestPath)) {
  console.error("No .next/app-build-manifest.json — run `npm run build` first.");
  process.exit(2);
}
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

const gzipCache = new Map();
function gzipKb(file) {
  if (!gzipCache.has(file)) {
    const path = join(NEXT_DIR, file);
    const bytes = existsSync(path) ? gzipSync(readFileSync(path), { level: 9 }).length : 0;
    gzipCache.set(file, bytes / 1024);
  }
  return gzipCache.get(file);
}

const routes = [];
for (const [route, files] of Object.entries(manifest.pages)) {
  const js = [...new Set(files)].filter((f) => f.endsWith(".js"));
  const kb = js.reduce((sum, f) => sum + gzipKb(f), 0);
  routes.push({ route, kb, chunks: js.length });
}
routes.sort((a, b) => b.kb - a.kb);

const pad = (s, n) => String(s).padEnd(n);
console.log(pad("route", 28) + pad("first-load JS (gz)", 20) + "chunks");
for (const { route, kb, chunks } of routes) {
  console.log(pad(route, 28) + pad(`${kb.toFixed(1)} KB`, 20) + chunks);
}

const worst = routes[0];
console.log(`\nworst route: ${worst.route} at ${worst.kb.toFixed(1)} KB gz (budget ${BUDGET_KB} KB)`);

if (worst.kb > BUDGET_KB) {
  console.error(`\n❌ Bundle budget busted by ${(worst.kb - BUDGET_KB).toFixed(1)} KB.`);
  console.error("Trim the offending route or lazy-load the heavy dependency.");
  process.exit(1);
}
console.log(`✅ Under budget with ${(BUDGET_KB - worst.kb).toFixed(1)} KB headroom.`);
