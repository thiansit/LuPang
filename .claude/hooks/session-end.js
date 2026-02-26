#!/usr/bin/env node
// Session End Hook - Flag pending retrospective if work was done
// Cross-platform: Node.js (no bash dependency)

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..", "..");
const flagFile = path.join(
  projectRoot,
  "psi",
  "inbox",
  ".pending-retrospective"
);

// Check if this is a git repo
const gitDir = path.join(projectRoot, ".git");
try {
  fs.accessSync(gitDir);
} catch {
  process.exit(0);
}

function hasUncommittedChanges() {
  try {
    execSync("git diff --quiet", { cwd: projectRoot, stdio: "pipe" });
    return false;
  } catch {
    return true;
  }
}

function hasStagedChanges() {
  try {
    execSync("git diff --cached --quiet", { cwd: projectRoot, stdio: "pipe" });
    return false;
  } catch {
    return true;
  }
}

function hasRecentCommits() {
  try {
    const result = execSync('git log --since="30 minutes ago" --oneline', {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    return result.length > 0;
  } catch {
    return false;
  }
}

if (hasUncommittedChanges() || hasStagedChanges() || hasRecentCommits()) {
  let branch = "unknown";
  try {
    branch = execSync("git branch --show-current", {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    // ignore
  }

  const now = new Date();
  const timestamp = now.toISOString().replace("T", " ").substring(0, 19);
  const content = `TIMESTAMP=${timestamp}\nBRANCH=${branch}\nRetrospective pending - will remind on next session start\n`;

  // Ensure directory exists
  const flagDir = path.dirname(flagFile);
  fs.mkdirSync(flagDir, { recursive: true });

  fs.writeFileSync(flagFile, content, "utf8");
  console.log("Retrospective pending - will remind on next session start");
}

process.exit(0);
