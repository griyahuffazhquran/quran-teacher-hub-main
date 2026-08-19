import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log("Penggunaan: node .agent/scripts/activity_log.js <pesan aktivitas>");
  process.exit(1);
}

const stateFile = ".agent/AGENT_STATE.md";
const fullPath = path.resolve(stateFile);

if (!fs.existsSync(fullPath)) {
  console.log(`File ${stateFile} tidak ditemukan.`);
  process.exit(1);
}

const message = args.join(" ");
const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

const logEntry = `- **${timestamp}** - ${message}\n`;

let content = fs.readFileSync(fullPath, "utf8");
if (content.includes("## 📜 Activity Log")) {
  content = content.replace("## 📜 Activity Log\n", `## 📜 Activity Log\n${logEntry}`);
} else {
  content += `\n## 📜 Activity Log\n${logEntry}`;
}

fs.writeFileSync(fullPath, content, "utf8");
console.log(`Berhasil mencatat aktivitas: '${message}' ke ${stateFile}`);
