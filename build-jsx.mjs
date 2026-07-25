// Minimal JSX build step for this no-bundler app.
//
// How it works: author components in real `.jsx` files. This script finds
// every `*.jsx` file in the project, strips JSX syntax down to
// `jsxDEV(...)` calls (via esbuild's `transform`, NOT `build` -- so it never
// bundles, and every `import "./foo.js"` you wrote stays byte-for-byte
// untouched), and writes the result next to the source as a `.js` file with
// the exact same name. index.html and every other file keep importing the
// `.js` output exactly as before -- nothing about serve.py or the site's
// module graph changes.
//
// The emitted call style (`jsxDEV` from "react/jsx-dev-runtime") matches
// what this codebase already hand-authors, so output "looks like" the old
// files -- the difference is you never write it by hand again.
//
// Usage:
//   node build-jsx.mjs           one-shot build of every .jsx file
//   node build-jsx.mjs --watch   rebuild on save
import { readFileSync, writeFileSync, existsSync } from "fs";
import { readdir } from "fs/promises";
import path from "path";
import { transform } from "esbuild";

const ROOT = process.cwd();
const IGNORE_DIRS = new Set(["node_modules", ".git", "_originals_bg"]);

async function findJsxFiles(dir, out = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      await findJsxFiles(full, out);
    } else if (entry.name.endsWith(".jsx")) {
      out.push(full);
    }
  }
  return out;
}

async function buildOne(file) {
  const src = readFileSync(file, "utf8");
  const { code, warnings } = await transform(src, {
    loader: "jsx",
    jsx: "automatic",
    jsxDev: true,
    jsxImportSource: "react",
    format: "esm",
    target: "esnext",
    sourcefile: file
  });
  for (const w of warnings) console.warn(`[jsx] ${file}: ${w.text}`);
  const outFile = file.slice(0, -4) + ".js";
  writeFileSync(outFile, code);
  console.log(`[jsx] ${path.relative(ROOT, file)} -> ${path.relative(ROOT, outFile)}`);
}

async function buildAll() {
  const files = await findJsxFiles(ROOT);
  if (files.length === 0) {
    console.log("[jsx] no .jsx files found yet -- nothing to build.");
    return;
  }
  let failed = 0;
  for (const f of files) {
    try {
      await buildOne(f);
    } catch (err) {
      failed++;
      console.error(`[jsx] FAILED ${path.relative(ROOT, f)}:`);
      console.error(err.message || err);
    }
  }
  if (failed > 0) {
    console.error(`[jsx] ${failed} file(s) failed to build.`);
    process.exitCode = 1;
  } else {
    console.log(`[jsx] built ${files.length} file(s) cleanly.`);
  }
}

if (process.argv.includes("--watch")) {
  const { watch } = await import("fs");
  await buildAll();
  console.log("[jsx] watching for .jsx changes (Ctrl+C to stop)...");
  watch(ROOT, { recursive: true }, async (_event, filename) => {
    if (!filename || !filename.endsWith(".jsx")) return;
    const full = path.join(ROOT, filename);
    if (!existsSync(full)) return;
    try {
      await buildOne(full);
    } catch (err) {
      console.error(`[jsx] FAILED ${filename}:`);
      console.error(err.message || err);
    }
  });
} else {
  await buildAll();
}
