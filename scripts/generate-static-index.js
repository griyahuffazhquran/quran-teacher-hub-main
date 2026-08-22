import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve("dist");
const assetsDir = path.join(distDir, "assets");

if (!fs.existsSync(distDir) || !fs.existsSync(assetsDir)) {
  console.error("dist or assets directory does not exist!");
  process.exit(1);
}

const files = fs.readdirSync(assetsDir);
const cssFile = files.find((f) => f.startsWith("styles-") && f.endsWith(".css")) || files.find((f) => f.endsWith(".css")) || "";
const runtimeJs = files.find((f) => f.includes("runtime") && f.endsWith(".js")) || "";
const indexJs = files.find((f) => f.startsWith("index-") && f.endsWith(".js")) || "";

const scriptTags = [
  runtimeJs ? `<script type="module" src="./assets/${runtimeJs}"></script>` : "",
  indexJs ? `<script type="module" src="./assets/${indexJs}"></script>` : "",
].filter(Boolean).join("\n    ");

const htmlContent = `<!DOCTYPE html>
<html lang="id" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Griya Huffazh Quran - Upgrading System</title>
    <meta name="description" content="Aplikasi Manajemen & Upgrading Pengajar Al-Qur'an Griya Huffazh." />
    <link rel="icon" href="./favicon.ico" />
    <link rel="manifest" href="./manifest.json" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
    ${cssFile ? `<link rel="stylesheet" href="./assets/${cssFile}" />` : ""}
  </head>
  <body class="min-h-screen bg-background text-foreground antialiased">
    <div id="root"></div>
    ${scriptTags}
  </body>
</html>`;

fs.writeFileSync(path.join(distDir, "index.html"), htmlContent, "utf8");
fs.writeFileSync(path.join(distDir, "404.html"), htmlContent, "utf8");
fs.writeFileSync(path.join(distDir, "static-site.html"), htmlContent, "utf8");
fs.writeFileSync(path.join(distDir, ".nojekyll"), "", "utf8");

console.log("Successfully generated dist/index.html, dist/404.html, dist/static-site.html, and dist/.nojekyll with runtime scripts!");
