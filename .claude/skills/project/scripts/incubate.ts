#!/usr/bin/env bun
// incubate.ts - Clone or create repo for active work
import { $ } from "bun";
import { existsSync, mkdirSync, rmSync, cpSync } from "fs";
import { dirname, join } from "path";
import { getRoot, getPaths, parseRepo, ghqPath, updateSlugsFile } from "./utils.ts";

const args = process.argv.slice(2);
const input = args[0];
if (!input) {
  console.log("Usage: ROOT=/path bun incubate.ts <owner/repo|name> [--org org]");
  process.exit(1);
}

const ROOT = getRoot();
const { slugsFile, incubateDir } = getPaths(ROOT);
const orgFlag = args.indexOf("--org");
const defaultOrg = orgFlag !== -1 ? args[orgFlag + 1] : "thiansit";

const { owner, name, slug } = parseRepo(input, defaultOrg);
const localPath = ghqPath(owner, name);
const linkPath = join(incubateDir, owner, name);

console.log(`Incubating: ${slug}`);

// Check if repo exists on GitHub
const repoExists = await $`gh repo view ${slug}`.quiet().then(() => true).catch(() => false);

if (repoExists) {
  await $`ghq get -u github.com/${slug}`.quiet();
} else {
  console.log("  Creating new repo...");
  await $`gh repo create ${slug} --private --clone=false`;
  await $`ghq get github.com/${slug}`.quiet();

  // Init if empty
  if (!existsSync(join(localPath, "README.md"))) {
    await Bun.write(join(localPath, "README.md"), `# ${name}\n`);
    await $`git -C ${localPath} add README.md && git -C ${localPath} commit -m "Initial commit"`;
    await $`git -C ${localPath} push origin main`.quiet().catch(() => $`git -C ${localPath} push origin master`.quiet());
  }
}

// Create symlink
mkdirSync(dirname(linkPath), { recursive: true });
if (existsSync(linkPath)) rmSync(linkPath, { recursive: true, force: true });
cpSync(localPath, linkPath, { recursive: true });

// Register slug
await updateSlugsFile(slugsFile, slug, localPath);

// Auto-distribute hooks and settings to the new repo
const hooksDir = join(ROOT, ".claude", "hooks");
const settingsSrc = join(ROOT, ".claude", "settings.json");
const targetHooksDir = join(linkPath, ".claude", "hooks");
mkdirSync(targetHooksDir, { recursive: true });

const hookFiles = ["safety-check.js", "git-workflow-validator.js", "session-start.js", "session-end.js"];
for (const hf of hookFiles) {
  const src = join(hooksDir, hf);
  if (existsSync(src)) cpSync(src, join(targetHooksDir, hf));
}
const targetSettings = join(linkPath, ".claude", "settings.json");
if (!existsSync(targetSettings) && existsSync(settingsSrc)) {
  cpSync(settingsSrc, targetSettings);
}
console.log("  Hooks distributed");

console.log(`Ready: ${localPath}`);
console.log(`GitHub: https://github.com/${slug}`);
