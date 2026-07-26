const { execSync } = require('child_process');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const startPr = 295;
const endPr = 463;

console.log(`Starting merge of PRs #${startPr} through #${endPr}...`);
let successCount = 0;
let failCount = 0;

for (let pr = startPr; pr <= endPr; pr++) {
  try {
    console.log(`Merging PR #${pr}...`);
    execSync(`gh pr merge ${pr} --merge --delete-branch`, { stdio: 'inherit', cwd: rootDir });
    successCount++;
  } catch (err) {
    console.error(`Failed to merge PR #${pr}: ${err.message}`);
    failCount++;
  }
}

console.log(`\n=========================================`);
console.log(`Merge complete: ${successCount} merged, ${failCount} failed.`);
console.log(`=========================================\n`);
