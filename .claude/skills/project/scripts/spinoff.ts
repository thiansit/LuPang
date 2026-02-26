#!/usr/bin/env bun
// spinoff.ts - Graduate project to its own repo
import { $ } from "bun";
import { existsSync, rmSync, cpSync } from "fs";
import { join } from "path";
import { getRoot, getPaths, ghqPath, parseRepo } from "./utils.ts";

const [slug, target] = process.argv.slice(2);
if (!slug || !target) {
  console.log("Usage: ROOT=/path bun spinoff.ts <slug> <target-org/repo>");
  process.exit(1);
}

const ROOT = getRoot();
const { incubateDir } = getPaths(ROOT);

const incubatePath = join(ROOT, "psi/incubate", slug);

if (!existsSync(incubatePath)) {
  console.error(`Not found: ${incubatePath}`);
  process.exit(1);
}

const sourcePath = existsSync(incubatePath) && 
  (await Bun.file(incubatePath).exists() ? incubatePath : incubatePath);

const { owner, name } = parseRepo(target);
const targetPath = ghqPath(owner, name);

console.log(`Spinoff: ${slug} → ${target}`);
console.log(`  Source: ${sourcePath}`);
console.log(`  Target: ${targetPath}`);

// 1. Create target repo
const exists = await $`gh repo view ${target}`.quiet().then(() => true).catch(() => false);
if (!exists) await $`gh repo create ${target} --private`;

// 2. Clone to ghq
await $`ghq get github.com/${target}`.quiet();

// 3. Copy files (cross-platform using Node.js)
if (existsSync(sourcePath)) {
  cpSync(sourcePath, targetPath, { recursive: true, force: true });
}

// 4. Commit and push
await $`git -C ${targetPath} add -A`;
await $`git -C ${targetPath} commit -m "Spinoff from ${slug}"`.quiet().catch(() => {});
await $`git -C ${targetPath} push origin main`.quiet().catch(() => 
  $`git -C ${targetPath} push origin master`.quiet()
);

// 5. Update symlink
if (existsSync(incubatePath)) rmSync(incubatePath, { recursive: true, force: true });
cpSync(targetPath, incubatePath, { recursive: true });

console.log(`\nSpinoff complete: ${slug} → ${target}`);
console.log(`  GitHub: https://github.com/${target}`);
