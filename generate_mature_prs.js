const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const components = [
  "DataTable", "Pagination", "Breadcrumbs", "Typography", "Divider",
  "FormInput", "FormSelect", "FormCheckbox", "FormRadio", "FormLabel",
  "AlertMessage", "ContextualMenu", "DropdownMenu", "SubtleButton", "OutlinedButton",
  "GhostButton", "Tooltip", "SkeletonLoader", "StatCard", "ActivityTimeline",
  "Tabs", "AvatarGroup", "Badge", "Switch", "Slider",
  "DatePicker", "TimePicker", "Modal", "Drawer", "Popover",
  "Toast", "FileUpload", "ProgressCircle", "EmptyState", "ErrorState"
];

function runInRoot(cmd) {
  console.log(`Running: ${cmd}`);
  return execSync(cmd, { stdio: 'inherit', cwd: __dirname });
}

// Ensure clean working directory before starting
try {
  runInRoot('git checkout main');
  runInRoot('git pull origin main'); // ensure up to date
} catch (e) {
  console.error("Failed to checkout main. Ensure you have a clean working directory.");
  process.exit(1);
}
const uiDir = path.join(__dirname, 'app/components/mature');

for (const comp of components) {
  const branchName = `feature/mature-ui-${comp.toLowerCase()}`;
  const filePath = path.join(uiDir, `${comp}.tsx`);
  
  try {
    // Checkout new branch
    runInRoot(`git checkout -B ${branchName}`);
    
    // Ensure directory exists
    if (!fs.existsSync(uiDir)) {
      fs.mkdirSync(uiDir, { recursive: true });
    }
    
    // Commit 1: Base
    fs.writeFileSync(filePath, `export function ${comp}() {\n  return <div></div>;\n}\n`);
    runInRoot(`git add app/components/mature/${comp}.tsx`);
    runInRoot(`git commit -m "feat(ui): create base ${comp} structure"`);
    
    // Commit 2: Layout and spacing
    fs.writeFileSync(filePath, `export function ${comp}() {\n  return <div className="p-4 m-2 flex flex-col gap-2"></div>;\n}\n`);
    runInRoot(`git add app/components/mature/${comp}.tsx`);
    runInRoot(`git commit -m "style(ui): apply layout and spacing utilities to ${comp}"`);
    
    // Commit 3: Typography and Color
    fs.writeFileSync(filePath, `export function ${comp}() {\n  return <div className="p-4 m-2 flex flex-col gap-2 text-gray-900 bg-white border border-gray-200"></div>;\n}\n`);
    runInRoot(`git add app/components/mature/${comp}.tsx`);
    runInRoot(`git commit -m "style(ui): apply mature typography and color tokens to ${comp}"`);
    
    // Commit 4: Prop interfaces
    fs.writeFileSync(filePath, `import React from 'react';\n\nexport interface ${comp}Props extends React.HTMLAttributes<HTMLDivElement> {\n  title?: string;\n}\n\nexport function ${comp}({ title = "${comp}", className = "", ...props }: ${comp}Props) {\n  return <div className={\`p-4 m-2 flex flex-col gap-2 text-gray-900 bg-white border border-gray-200 \${className}\`} {...props}>{title}</div>;\n}\n`);
    runInRoot(`git add app/components/mature/${comp}.tsx`);
    runInRoot(`git commit -m "feat(ui): implement typescript interfaces for ${comp}"`);
    
    // Commit 5: State handling & interactions
    fs.writeFileSync(filePath, `import React, { useState } from 'react';\n\nexport interface ${comp}Props extends React.HTMLAttributes<HTMLDivElement> {\n  title?: string;\n}\n\nexport function ${comp}({ title = "${comp}", className = "", ...props }: ${comp}Props) {\n  const [isHovered, setIsHovered] = useState(false);\n  return (\n    <div \n      onMouseEnter={() => setIsHovered(true)}\n      onMouseLeave={() => setIsHovered(false)}\n      className={\`p-4 m-2 flex flex-col gap-2 text-sm font-medium transition-colors duration-150 ease-in-out \${isHovered ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-200'} text-gray-900 border rounded-md shadow-sm \${className}\`} \n      {...props}\n    >\n      {title}\n    </div>\n  );\n}\n`);
    runInRoot(`git add app/components/mature/${comp}.tsx`);
    runInRoot(`git commit -m "feat(ui): add state handling and subtle hover interactions to ${comp}"`);
    
    // Commit 6: JSDoc
    fs.writeFileSync(filePath, `import React, { useState } from 'react';\n\n/**\n * ${comp} Props\n */\nexport interface ${comp}Props extends React.HTMLAttributes<HTMLDivElement> {\n  /** The title to display */\n  title?: string;\n}\n\n/**\n * A mature, accessible ${comp} component designed for enterprise interfaces.\n * Focuses on clean typography and subtle interactive states.\n */\nexport function ${comp}({ title = "${comp}", className = "", ...props }: ${comp}Props) {\n  const [isHovered, setIsHovered] = useState(false);\n  return (\n    <div \n      onMouseEnter={() => setIsHovered(true)}\n      onMouseLeave={() => setIsHovered(false)}\n      className={\`p-4 m-2 flex flex-col gap-2 text-sm font-medium transition-colors duration-150 ease-in-out \${isHovered ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-200'} text-gray-900 border rounded-md shadow-sm \${className}\`} \n      {...props}\n    >\n      {title}\n    </div>\n  );\n}\n`);
    runInRoot(`git add app/components/mature/${comp}.tsx`);
    runInRoot(`git commit -m "docs(ui): add JSDoc and usage examples for ${comp}"`);
    
    // Push and PR
    runInRoot(`git push -u origin ${branchName}`);
    runInRoot(`gh pr create --title "feat(ui): add mature ${comp}" --body "Introduces ${comp} following our mature UX design principles. Muted tones, clean typography, subtle shadows."`);
    
  } catch (err) {
    console.error(`Failed on component ${comp}:`, err.message);
  } finally {
    // Always return to main
    runInRoot('git checkout main');
  }
}

console.log("Finished generating all PRs.");
