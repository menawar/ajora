const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

function runInRoot(cmd) {
  console.log(`Running: ${cmd}`);
  try {
    return execSync(cmd, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  } catch (e) {
    console.error(`Failed to run: ${cmd}`);
    return null;
  }
}

// Ensure clean working directory before starting
try {
  runInRoot('git checkout main');
  runInRoot('git pull origin main'); // Be safe
} catch (e) {
  console.error("Failed to checkout main. Ensure you have a clean working directory.");
  process.exit(1);
}

const numItems = 210;

for (let i = 1; i <= numItems; i++) {
  let category, type, ext, dirPath, getCommit1, getCommit2, getCommit3, getCommit4, getCommit5;
  const itemName = `FeatureBlock${i}`;
  
  if (i <= 50) {
    category = 'ui';
    type = 'components';
    ext = 'tsx';
    dirPath = path.join(__dirname, '..', 'app', 'components', 'massive');
    getCommit1 = () => `export function ${itemName}() { return <div></div>; }`;
    getCommit2 = () => `export function ${itemName}() { return <div className="p-4 m-2 flex flex-col gap-2"></div>; }`;
    getCommit3 = () => `export function ${itemName}() { return <div className="p-4 m-2 flex flex-col gap-2 text-gray-900 bg-white border border-gray-200"></div>; }`;
    getCommit4 = () => `import React from 'react';\n\nexport interface ${itemName}Props extends React.HTMLAttributes<HTMLDivElement> {\n  title?: string;\n}\n\nexport function ${itemName}({ title = "${itemName}", className = "", ...props }: ${itemName}Props) {\n  return <div className={\`p-4 m-2 flex flex-col gap-2 text-gray-900 bg-white border border-gray-200 \${className}\`} {...props}>{title}</div>;\n}`;
    getCommit5 = () => `import React, { useState } from 'react';\n\n/**\n * ${itemName} Props\n */\nexport interface ${itemName}Props extends React.HTMLAttributes<HTMLDivElement> {\n  /** The title to display */\n  title?: string;\n}\n\n/**\n * A mature, accessible ${itemName} component designed for enterprise interfaces.\n * Focuses on clean typography and subtle interactive states.\n */\nexport function ${itemName}({ title = "${itemName}", className = "", ...props }: ${itemName}Props) {\n  const [isHovered, setIsHovered] = useState(false);\n  return (\n    <div \n      onMouseEnter={() => setIsHovered(true)}\n      onMouseLeave={() => setIsHovered(false)}\n      className={\`p-4 m-2 flex flex-col gap-2 text-sm font-medium transition-colors duration-150 ease-in-out \${isHovered ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-200'} text-gray-900 border rounded-md shadow-sm \${className}\`} \n      {...props}\n    >\n      {title}\n    </div>\n  );\n}`;
  } else if (i <= 100) {
    category = 'hooks';
    type = 'hooks';
    ext = 'ts';
    dirPath = path.join(__dirname, '..', 'app', 'hooks', 'massive');
    getCommit1 = () => `export function use${itemName}() { return null; }`;
    getCommit2 = () => `import { useState } from 'react';\nexport function use${itemName}() { const [state, setState] = useState(null); return state; }`;
    getCommit3 = () => `import { useState, useEffect } from 'react';\nexport function use${itemName}() { const [state, setState] = useState(null); useEffect(() => { setState(true) }, []); return state; }`;
    getCommit4 = () => `import { useState, useEffect } from 'react';\nexport function use${itemName}(initialValue: any) { const [state, setState] = useState(initialValue); useEffect(() => { setState(true) }, []); return state; }`;
    getCommit5 = () => `import { useState, useEffect, useCallback } from 'react';\nexport function use${itemName}(initialValue: any) { const [state, setState] = useState(initialValue); const toggle = useCallback(() => setState(!state), [state]); return { state, toggle }; }`;
  } else if (i <= 150) {
    category = 'utils';
    type = 'utils';
    ext = 'ts';
    dirPath = path.join(__dirname, '..', 'app', 'utils', 'massive');
    getCommit1 = () => `export function format${itemName}() { return ''; }`;
    getCommit2 = () => `export function format${itemName}(val: string) { return val; }`;
    getCommit3 = () => `export function format${itemName}(val: string) { return val.trim(); }`;
    getCommit4 = () => `export function format${itemName}(val: string) { return val ? val.trim().toLowerCase() : ''; }`;
    getCommit5 = () => `/** Formats ${itemName} */\nexport function format${itemName}(val: string) { return val ? val.trim().toLowerCase() : ''; }`;
  } else if (i <= 200) {
    category = 'types';
    type = 'types';
    ext = 'ts';
    dirPath = path.join(__dirname, '..', 'app', 'types', 'massive');
    getCommit1 = () => `export type ${itemName} = any;`;
    getCommit2 = () => `export type ${itemName} = string | number;`;
    getCommit3 = () => `export interface ${itemName} { id: string; }`;
    getCommit4 = () => `export interface ${itemName} { id: string; value: number; }`;
    getCommit5 = () => `export interface ${itemName} { id: string; value: number; createdAt: Date; }`;
  } else {
    category = 'docs';
    type = 'docs';
    ext = 'md';
    dirPath = path.join(__dirname, '..', 'docs', 'massive');
    getCommit1 = () => `# ${itemName}`;
    getCommit2 = () => `# ${itemName}\n\nThis is a doc.`;
    getCommit3 = () => `# ${itemName}\n\nThis is a doc.\n## Usage\n...`;
    getCommit4 = () => `# ${itemName}\n\nThis is a doc.\n## Usage\n...\n## API\n...`;
    getCommit5 = () => `# ${itemName}\n\nThis is a doc.\n## Usage\n...\n## API\n...\n## Examples\n...`;
  }

  const branchName = `feature/massive-${category}-${itemName.toLowerCase()}`;
  const filePath = path.join(dirPath, `${itemName}.${ext}`);
  let basePath = category === 'docs' ? `docs/massive/${itemName}.${ext}` : `app/${type}/massive/${itemName}.${ext}`;

  try {
    runInRoot(`git checkout -b ${branchName}`);
    
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Commit 1
    fs.writeFileSync(filePath, getCommit1());
    runInRoot(`git add ${basePath}`);
    runInRoot(`git commit -m "feat(${category}): create base ${itemName}"`);
    
    // Commit 2
    fs.writeFileSync(filePath, getCommit2());
    runInRoot(`git add ${basePath}`);
    runInRoot(`git commit -m "style(${category}): add structure to ${itemName}"`);
    
    // Commit 3
    fs.writeFileSync(filePath, getCommit3());
    runInRoot(`git add ${basePath}`);
    runInRoot(`git commit -m "feat(${category}): add logic to ${itemName}"`);
    
    // Commit 4
    fs.writeFileSync(filePath, getCommit4());
    runInRoot(`git add ${basePath}`);
    runInRoot(`git commit -m "feat(${category}): enhance ${itemName} capabilities"`);
    
    // Commit 5
    fs.writeFileSync(filePath, getCommit5());
    runInRoot(`git add ${basePath}`);
    runInRoot(`git commit -m "docs(${category}): finalize ${itemName}"`);
    
    // Push and PR
    runInRoot(`git push -u origin ${branchName}`);
    runInRoot(`gh pr create --title "feat(${category}): add massive ${itemName}" --body "Automated PR for ${itemName}."`);
    
    // Delay to avoid strict rate limiting by github
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000); 

  } catch (err) {
    console.error(`Failed on component ${itemName}:`, err.message);
  } finally {
    runInRoot('git checkout main');
  }
}

console.log("Finished generating 1000+ commits.");
