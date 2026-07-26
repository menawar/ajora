const { execSync } = require('child_process');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// Get all remote branches
const raw = execSync('git branch -r', { encoding: 'utf8', cwd: rootDir });
const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

const keep = ['origin/main', 'origin/feature/production-upgrade', 'origin/HEAD'];

const toDelete = [];

for (const line of lines) {
  if (line.includes('->')) continue; // skip pointer like origin/HEAD -> origin/main
  if (keep.includes(line)) continue;
  
  // Extract branch name after "origin/"
  if (line.startsWith('origin/')) {
    const branchName = line.slice(7);
    toDelete.push(branchName);
  }
}

console.log(`Found ${toDelete.length} remote branches to delete.`);
console.log(`Keeping: main and feature/production-upgrade.`);

let successCount = 0;
let failCount = 0;

for (let i = 0; i < toDelete.length; i++) {
  const branch = toDelete[i];
  console.log(`[${i + 1}/${toDelete.length}] Deleting remote branch: ${branch}...`);
  try {
    execSync(`git push origin --delete "${branch}"`, { stdio: 'inherit', cwd: rootDir });
    successCount++;
  } catch (err) {
    console.error(`Failed to delete branch ${branch}: ${err.message}`);
    failCount++;
  }
}

console.log(`\n=========================================`);
console.log(`Remote branch deletion complete: ${successCount} deleted, ${failCount} failed.`);
console.log(`=========================================\n`);
