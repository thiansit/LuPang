#!/usr/bin/env node
// Session Start Hook - Show Oracle context
// Cross-platform: Node.js (no bash dependency)

const fs = require("fs");
const path = require("path");

// Find project root (walk up from this script's directory)
const hooksDir = __dirname;
const projectRoot = path.resolve(hooksDir, "..", "..");

console.log("=== LuPang Oracle ===");
console.log("");

// Show current focus
const focusPath = path.join(projectRoot, "psi", "inbox", "focus.md");
try {
  const focus = fs.readFileSync(focusPath, "utf8");
  console.log(focus);
  console.log("");
} catch {
  // no focus file
}

// Check pending retrospective
const retroPath = path.join(
  projectRoot,
  "psi",
  "inbox",
  ".pending-retrospective"
);
try {
  fs.accessSync(retroPath);
  console.log("PENDING RETROSPECTIVE DETECTED");
  console.log("Last session had work but no retrospective.");
  console.log("Run: /rrr");
  console.log("");
} catch {
  // no pending retro
}

// Show recent activity
const activityPath = path.join(
  projectRoot,
  "psi",
  "memory",
  "logs",
  "activity.log"
);
try {
  const content = fs.readFileSync(activityPath, "utf8");
  const lines = content.trim().split("\n");
  const lastFive = lines.slice(-5);
  console.log("--- Recent Activity ---");
  console.log(lastFive.join("\n"));
  console.log("");
} catch {
  // no activity log
}

console.log("Ready. Type /recap for full context.");
