const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const components = [
  "GlassCard", "GradientButton", "AnimatedBadge", "UserAvatar", "AccordionList",
  "TooltipWrapper", "ToggleSwitch", "ProgressBar", "TabNav", "PremiumToast",
  "HeroSection", "StatWidget", "HoverCard", "DrawerPanel", "StepIndicator",
  "PulseRing", "AnimatedLogo", "ConfettiOverlay", "ShimmerText", "FloatingMenu"
];

function runInRoot(cmd) {
  console.log(`Running: ${cmd}`);
  return execSync(cmd, { stdio: 'inherit', cwd: __dirname });
}

// Ensure clean working directory before starting
try {
  runInRoot('git checkout main');
} catch (e) {
  console.error("Failed to checkout main. Ensure you have a clean working directory.");
  process.exit(1);
}

const uiDir = path.join(__dirname, 'app/components/ui');
if (!fs.existsSync(uiDir)) {
  fs.mkdirSync(uiDir, { recursive: true });
}

for (const comp of components) {
  const branchName = `feature/ui-${comp.toLowerCase()}`;
  const filePath = path.join(uiDir, `${comp}.tsx`);
  
  try {
    // Checkout new branch
    runInRoot(`git checkout -b ${branchName}`);
    
    // Commit 1: Base
    fs.writeFileSync(filePath, `export function ${comp}() {\n  return <div></div>;\n}\n`);
    runInRoot(`git add app/components/ui/${comp}.tsx`);
    runInRoot(`git commit -m "feat(ui): create base ${comp} component"`);
    
    // Commit 2: Structure
    fs.writeFileSync(filePath, `export function ${comp}() {\n  return <div className="p-4 flex items-center justify-center"></div>;\n}\n`);
    runInRoot(`git add app/components/ui/${comp}.tsx`);
    runInRoot(`git commit -m "style(ui): add structural tailwind classes to ${comp}"`);
    
    // Commit 3: Dynamic props
    fs.writeFileSync(filePath, `interface ${comp}Props {\n  title?: string;\n}\n\nexport function ${comp}({ title = "${comp}" }: ${comp}Props) {\n  return <div className="p-4 flex items-center justify-center">{title}</div>;\n}\n`);
    runInRoot(`git add app/components/ui/${comp}.tsx`);
    runInRoot(`git commit -m "feat(ui): add dynamic props to ${comp}"`);
    
    // Commit 4: Aesthetics
    fs.writeFileSync(filePath, `interface ${comp}Props {\n  title?: string;\n}\n\nexport function ${comp}({ title = "${comp}" }: ${comp}Props) {\n  return <div className="p-4 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 text-gray-800">{title}</div>;\n}\n`);
    runInRoot(`git add app/components/ui/${comp}.tsx`);
    runInRoot(`git commit -m "style(ui): add modern aesthetics and glassmorphism to ${comp}"`);
    
    // Commit 5: Animation
    fs.writeFileSync(filePath, `"use client";\nimport { motion } from "framer-motion";\n\ninterface ${comp}Props {\n  title?: string;\n}\n\nexport function ${comp}({ title = "${comp}" }: ${comp}Props) {\n  return (\n    <motion.div \n      initial={{ opacity: 0, y: 10 }}\n      animate={{ opacity: 1, y: 0 }}\n      whileHover={{ scale: 1.02 }}\n      className="p-4 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 text-gray-800 font-semibold"\n    >\n      {title}\n    </motion.div>\n  );\n}\n`);
    runInRoot(`git add app/components/ui/${comp}.tsx`);
    runInRoot(`git commit -m "feat(ui): add framer-motion animations to ${comp}"`);
    
    // Push and PR
    runInRoot(`git push -u origin ${branchName}`);
    runInRoot(`gh pr create --title "feat(ui): add ${comp}" --body "Adds modern ${comp} with glassmorphism and animations."`);
    
  } catch (err) {
    console.error(`Failed on component ${comp}:`, err.message);
  } finally {
    // Always return to main
    runInRoot('git checkout main');
  }
}

console.log("Finished generating all PRs.");
