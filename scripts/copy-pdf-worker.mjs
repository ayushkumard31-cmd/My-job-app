// Copies pdf.js's worker into public/ so the syllabus planner can load it from
// a plain URL (see src/lib/syllabus.js).
//
// It has to be a copy rather than a bundler import: pdf.js refuses to run if the
// worker's version differs from the API's, and every bundler resolves worker
// URLs differently. Running this from `postinstall` means the copy is refreshed
// whenever pdfjs-dist is installed or upgraded, so the two can't drift apart.

import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const from = join(root, "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
const to = join(root, "public", "pdf.worker.min.mjs");

try {
  await mkdir(dirname(to), { recursive: true });
  await copyFile(from, to);
  console.log("copied pdf.worker.min.mjs → public/");
} catch (e) {
  // Not fatal: the planner is one page, and a missing worker is a clearer
  // failure at runtime than a failed install for everyone else.
  console.warn("could not copy pdf.js worker:", e.message);
}
