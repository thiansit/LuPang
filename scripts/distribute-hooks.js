#!/usr/bin/env node
// Distribute hooks and settings to all incubate repos
// Cross-platform: Node.js (works on Windows, macOS, Linux)
// Usage: node scripts/distribute-hooks.js

const fs = require("fs");
const path = require("path");

const scriptDir = __dirname;
const projectRoot = path.resolve(scriptDir, "..");
const hooksSrc = path.join(projectRoot, ".claude", "hooks");
const settingsSrc = path.join(projectRoot, ".claude", "settings.json");
const incubateDir = path.join(projectRoot, "psi", "incubate");

if (!fs.existsSync(incubateDir)) {
  console.log("No incubate directory found at " + incubateDir);
  process.exit(0);
}

const hookFiles = [
  "safety-check.js",
  "git-workflow-validator.js",
  "session-start.js",
  "session-end.js",
];

let count = 0;
const entries = fs.readdirSync(incubateDir, { withFileTypes: true });

for (const entry of entries) {
  if (!entry.isDirectory()) continue;

  const repoPath = path.join(incubateDir, entry.name);
  const gitPath = path.join(repoPath, ".git");

  if (!fs.existsSync(gitPath)) continue;

  console.log("--- " + entry.name + " ---");

  // Create .claude/hooks/ in target
  const targetHooksDir = path.join(repoPath, ".claude", "hooks");
  fs.mkdirSync(targetHooksDir, { recursive: true });

  // Copy hooks
  for (const hookFile of hookFiles) {
    const src = path.join(hooksSrc, hookFile);
    const dest = path.join(targetHooksDir, hookFile);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  }

  // Copy settings (only if not exists, don't overwrite custom settings)
  const targetSettings = path.join(repoPath, ".claude", "settings.json");
  if (!fs.existsSync(targetSettings)) {
    fs.copyFileSync(settingsSrc, targetSettings);
    console.log("  [NEW] settings.json");
  } else {
    console.log("  [SKIP] settings.json (already exists)");
  }

  console.log("  hooks copied");
  count++;
}

console.log("");
console.log("Done: " + count + " repos updated");
