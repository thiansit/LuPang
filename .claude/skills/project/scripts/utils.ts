// utils.ts - Shared utilities for project scripts (cross-platform)
import { Glob } from "bun";
import { existsSync, lstatSync, readdirSync, statSync } from "fs";
import { join, basename, dirname } from "path";
import { homedir } from "os";

// --- Environment ---
export function getRoot(): string {
  const ROOT = process.env.ROOT;
  if (!ROOT) {
    console.error("Error: ROOT environment variable required");
    process.exit(1);
  }
  return ROOT;
}

export function getPaths(root: string) {
  return {
    slugsFile: join(root, "psi", "memory", "slugs.yaml"),
    learnDir: join(root, "psi", "learn", "repo", "github.com"),
    incubateDir: join(root, "psi", "incubate", "repo", "github.com"),
    logDir: join(root, "psi", "memory", "logs"),
  };
}

// --- Date/Time ---
export const today = () => new Date().toISOString().slice(0, 10);
export const now = () => new Date().toTimeString().slice(0, 5);

// --- Slug parsing ---
export type RepoInfo = { owner: string; name: string; slug: string };

export function parseRepo(input: string, defaultOrg = "thiansit"): RepoInfo {
  if (input.startsWith("http")) {
    const slug = input.replace("https://github.com/", "").replace(".git", "");
    const [owner, name] = slug.split("/");
    return { owner, name, slug };
  }
  if (input.includes("/")) {
    const [owner, name] = input.split("/");
    return { owner, name, slug: input };
  }
  return { owner: defaultOrg, name: input, slug: `${defaultOrg}/${input}` };
}

export function ghqPath(owner: string, name: string): string {
  // Cross-platform: use Code/github.com under home directory
  return join(homedir(), "Code", "github.com", owner, name);
}

// --- Directory listing (cross-platform, replaces symlink scanning) ---
export type LinkInfo = { path: string; org: string; repo: string; slug: string; target?: string };

export async function getProjectDirs(baseDir: string): Promise<LinkInfo[]> {
  if (!existsSync(baseDir)) return [];

  const links: LinkInfo[] = [];
  try {
    const orgs = readdirSync(baseDir).filter(d => {
      try { return statSync(join(baseDir, d)).isDirectory(); } catch { return false; }
    });
    for (const org of orgs) {
      const orgDir = join(baseDir, org);
      const repos = readdirSync(orgDir).filter(d => {
        try { return statSync(join(orgDir, d)).isDirectory(); } catch { return false; }
      });
      for (const repo of repos) {
        links.push({ path: join(orgDir, repo), org, repo, slug: `${org}/${repo}` });
      }
    }
  } catch {}
  return links;
}

// Keep old name as alias for backward compat
export const getSymlinks = getProjectDirs;

export function matchesSlug(link: LinkInfo, slug: string): boolean {
  return slug.includes("/") ? link.slug === slug : link.repo === slug;
}

// --- Slugs.yaml operations ---
export async function findInSlugs(slugsFile: string, input: string): Promise<string | null> {
  if (!existsSync(slugsFile)) return null;

  const content = await Bun.file(slugsFile).text();
  for (const line of content.split("\n")) {
    const matches =
      line.startsWith(`${input}:`) ||
      line.includes(`/${input}:`) ||
      (!input.includes("/") && line.startsWith(`${input}:`));

    if (matches) {
      // Handle both Unix (~) and Windows paths
      const rawPath = line.split(":").slice(1).join(":").trim();
      const path = rawPath.replace(/^~/, homedir());
      if (existsSync(path)) return path;
    }
  }
  return null;
}

export async function updateSlugsFile(slugsFile: string, slug: string, path: string) {
  const dir = dirname(slugsFile);
  const { mkdirSync } = await import("fs");
  mkdirSync(dir, { recursive: true });

  if (!existsSync(slugsFile)) {
    await Bun.write(slugsFile, "# Slug Registry (owner/repo: path)\n");
  }

  const content = await Bun.file(slugsFile).text();
  const filtered = content.split("\n").filter((l) => !l.startsWith(`${slug}:`)).join("\n");
  await Bun.write(slugsFile, `${filtered}\n${slug}: ${path}\n`);
}

// --- Path expansion ---
export function expandPath(input: string): string {
  return input.replace(/^~/, homedir());
}
