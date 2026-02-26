#!/usr/bin/env node
// Git Workflow Validator Hook
// Prevents: commits on main, push to main, force push
// Cross-platform: Node.js (no bash dependency)

const { execSync } = require("child_process");

const chunks = [];
process.stdin.on("data", (chunk) => chunks.push(chunk));
process.stdin.on("end", () => {
  let tool = "";
  let cmd = "";
  try {
    const input = JSON.parse(Buffer.concat(chunks).toString());
    tool = input.tool || "";
    cmd = (input.tool_input && input.tool_input.command) || "";
  } catch {
    process.exit(0);
  }

  // Skip if not Bash or not git command
  if (tool !== "Bash" || !cmd.includes("git")) {
    process.exit(0);
  }

  let currentBranch = "unknown";
  try {
    currentBranch = execSync("git branch --show-current", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    // ignore
  }

  // No commits on main/master
  if (/git\s+commit/.test(cmd)) {
    if (currentBranch === "main" || currentBranch === "master") {
      process.stderr.write(
        "\nBLOCKED: Cannot commit directly to " +
          currentBranch +
          "\nCreate feature branch first: git checkout -b feat/[name]\n"
      );
      process.exit(2);
    }
  }

  // No push to main/master
  if (/git\s+push/.test(cmd) && /origin\s+(main|master)/.test(cmd)) {
    process.stderr.write("BLOCKED: Cannot push directly to main/master\n");
    process.exit(2);
  }

  // No force push
  if (/git\s+push.*(-f|--force)/.test(cmd)) {
    process.stderr.write("BLOCKED: Force push is forbidden\n");
    process.exit(2);
  }

  // No --amend
  if (/git\s+commit.*--amend/.test(cmd)) {
    process.stderr.write("BLOCKED: git commit --amend is forbidden\n");
    process.exit(2);
  }

  process.exit(0);
});
