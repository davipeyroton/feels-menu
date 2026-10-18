#!/usr/bin/env node
/**
 * Resize (max edge) + JPEG compress for menu product photos.
 * Usage: node scripts/optimize-menu-image.mjs <input> <output.jpg>
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const MAX_EDGE = 1080;
const JPEG_QUALITY = 76;

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("Usage: node scripts/optimize-menu-image.mjs <input> <output.jpg>");
  process.exit(1);
}

const outPath = resolve(output);
mkdirSync(dirname(outPath), { recursive: true });
copyFileSync(resolve(input), outPath);

execFileSync("sips", [
  "-Z",
  String(MAX_EDGE),
  "-s",
  "format",
  "jpeg",
  "-s",
  "formatOptions",
  String(JPEG_QUALITY),
  outPath,
  "--out",
  outPath,
]);

const info = execFileSync(
  "sips",
  ["-g", "pixelWidth", "-g", "pixelHeight", outPath],
  { encoding: "utf8" },
);
console.log(info.trim());
