#!/usr/bin/env node
// Safety check hook - blocks dangerous commands
// Cross-platform: Node.js (no bash/jq dependency)

const chunks = [];
process.stdin.on("data", (chunk) => chunks.push(chunk));
process.stdin.on("end", () => {
  let cmd = "";
  try {
    const input = JSON.parse(Buffer.concat(chunks).toString());
    cmd = (input.tool_input && input.tool_input.command) || "";
  } catch {
    process.exit(0);
  }

  // Block rm -rf
  if (/(?:^|;|&&|\|\|)\s*rm\s+-rf\s/.test(cmd)) {
    process.stderr.write("BLOCKED: rm -rf not allowed.\n");
    process.exit(2);
  }

  // Block force flags
  if (/(?:^|;|&&|\|\|)\s*(?:git|npm|yarn|pnpm)\s+[a-z-]+\s+.*(?:\s-f(?:\s|$)|--force(?:\s|$))/.test(cmd)) {
    process.stderr.write("BLOCKED: Force flags not allowed.\n");
    process.exit(2);
  }

  // Block reset --hard
  if (/(?:^|;|&&|\|\|)\s*git\s+reset\s+--hard/.test(cmd)) {
    process.stderr.write("BLOCKED: git reset --hard not allowed.\n");
    process.exit(2);
  }

  // Block git commit --amend
  if (/git\s+commit\s+.*--amend/.test(cmd)) {
    process.stderr.write("BLOCKED: Never use --amend. Create new commit instead.\n");
    process.exit(2);
  }

  process.exit(0);
});
