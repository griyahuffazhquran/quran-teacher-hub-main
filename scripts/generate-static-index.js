import fs from "node:fs";
import path from "node:path";

// 1. Candidate directories where vite / Nitro / TanStack Start outputs client assets
const distDir = path.resolve("dist");
const distClientDir = path.resolve("dist/client");
const outputPublicDir = path.resolve(".output/public");

const candidateDirs = [distClientDir, outputPublicDir, distDir];

let sourceDir = "";
let assetsDir = "";

for (const dir of candidateDirs) {
  const checkAssets = path.join(dir, "assets");
  if (fs.existsSync(checkAssets) && fs.statSync(checkAssets).isDirectory()) {
    sourceDir = dir;
    assetsDir = checkAssets;
    break;
  }
}

// Fallback search for any 'assets' directory inside dist or .output
if (!assetsDir) {
  for (const root of [distDir, path.resolve(".output")]) {
    if (fs.existsSync(root)) {
      const findAssets = (d) => {
        try {
          const entries = fs.readdirSync(d, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isDirectory()) {
              const fullPath = path.join(d, entry.name);
              if (entry.name === "assets") return fullPath;
              const sub = findAssets(fullPath);
              if (sub) return sub;
            }
          }
        } catch {
          // ignore
        }
        return null;
      };
      const found = findAssets(root);
      if (found) {
        assetsDir = found;
        sourceDir = path.dirname(found);
        break;
      }
    }
  }
}

let files = [];
if (assetsDir && fs.existsSync(assetsDir)) {
  files = fs.readdirSync(assetsDir);
} else {
  console.warn("Warning: No 'assets' directory found after build. Proceeding with fallback static HTML generation.");
}

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

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Sync assets from sourceDir to distDir if sourceDir is subfolder like dist/client or .output/public
if (sourceDir && sourceDir !== distDir && fs.existsSync(sourceDir)) {
  try {
    fs.cpSync(sourceDir, distDir, { recursive: true });
  } catch (err) {
    console.warn("Could not copy assets to dist:", err);
  }
}

// Write html index and fallbacks to all potential target directories
const targetDirs = new Set([distDir, distClientDir, outputPublicDir, sourceDir].filter(Boolean));
targetDirs.forEach((dir) => {
  if (fs.existsSync(dir)) {
    try {
      fs.writeFileSync(path.join(dir, "index.html"), htmlContent, "utf8");
      fs.writeFileSync(path.join(dir, "404.html"), htmlContent, "utf8");
      fs.writeFileSync(path.join(dir, "static-site.html"), htmlContent, "utf8");
      fs.writeFileSync(path.join(dir, ".nojekyll"), "", "utf8");
    } catch (err) {
      console.warn(`Could not write HTML to ${dir}:`, err);
    }
  }
});

console.log("Successfully generated index.html, 404.html, static-site.html, and .nojekyll across all build targets!");


