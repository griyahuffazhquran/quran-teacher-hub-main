import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve("dist");
const assetsDir = path.join(distDir, "assets");

if (!fs.existsSync(distDir)) {
  console.error("dist directory does not exist!");
  process.exit(1);
}

let cssFile = "";
let indexJsFile = "";

if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  cssFile = files.find((f) => f.startsWith("styles-") && f.endsWith(".css")) || files.find((f) => f.endsWith(".css")) || "";
  indexJsFile = files.find((f) => f.startsWith("index-") && f.endsWith(".js")) || files.find((f) => f.endsWith(".js")) || "";
}

const htmlContent = `<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Griya Huffazh Quran - Upgrading System</title>
    <meta name="description" content="Aplikasi Manajemen & Upgrading Pengajar Al-Qur'an Griya Huffazh." />
    <link rel="icon" href="./favicon.ico" />
    <link rel="manifest" href="./manifest.json" />
    ${cssFile ? `<link rel="stylesheet" href="./assets/${cssFile}" />` : ""}
  </head>
  <body class="min-h-screen bg-background text-foreground antialiased">
    <div id="root"></div>
    ${indexJsFile ? `<script type="module" src="./assets/${indexJsFile}"></script>` : ""}
  </body>
</html>`;

fs.writeFileSync(path.join(distDir, "index.html"), htmlContent, "utf8");
fs.writeFileSync(path.join(distDir, "404.html"), htmlContent, "utf8");
fs.writeFileSync(path.join(distDir, ".nojekyll"), "", "utf8");

console.log("Successfully generated dist/index.html, dist/404.html, and dist/.nojekyll for GitHub Pages!");
