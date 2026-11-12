// Move the build to the repo root: index.html plus the hashed files in site/.
import { cpSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const extra = [
  '<link rel="icon" href="./favicon.svg" type="image/svg+xml" />',
  '<link rel="preload" as="image" href="./shreyash_portrait.jpg" fetchpriority="high" />',
].join("\n");
const html = readFileSync("dist/index.html", "utf8");
if (!html.includes("<!--HEAD-EXTRA-->")) throw new Error("HEAD-EXTRA marker missing from the built index.html");
writeFileSync("../index.html", html.replace("<!--HEAD-EXTRA-->", extra));
rmSync("../site", { recursive: true, force: true });
cpSync("dist/site", "../site", { recursive: true });
console.log("Published index.html and site/ to the repo root.");
