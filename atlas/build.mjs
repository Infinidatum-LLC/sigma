// Builds dist/sigma-atlas.min.js from the fork's source (not from npm), so changes on
// this branch reach the browser runtime that Regulatory Atlas vendors.
import { build } from "esbuild";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const here = new URL(".", import.meta.url).pathname;
const commit = execSync("git rev-parse HEAD", { cwd: here }).toString().trim();
const license = readFileSync(new URL("../LICENSE.txt", import.meta.url), "utf8");

await build({
  absWorkingDir: here,
  entryPoints: ["index.ts"],
  bundle: true,
  minify: true,
  format: "iife",
  globalName: "AtlasSigma",
  target: "es2020",
  alias: { sigma: "../packages/sigma/src" },
  // The fork packages resolve their dependencies from this folder, not the monorepo root.
  nodePaths: [here + "node_modules"],
  banner: { js: `/*! sigma (Infinidatum-LLC/sigma, atlas branch, ${commit}) + graphology. MIT.\n${license.trim()}\n*/` },
  outfile: "dist/sigma-atlas.min.js",
  logLevel: "info",
});
