// Build the GitHub release body: this tag's CHANGELOG section + per-installer SHA-256 + standing install notes.
// Usage: node scripts/release-notes.mjs vX.Y.Z <output.md>
// Fails loudly when the CHANGELOG section or any expected installer is missing, so a tag cannot ship notes-less or with a package silently dropped.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const tag = process.argv[2] ?? '';
const outFile = process.argv[3] ?? '';
if (!/^v\d+\.\d+\.\d+$/.test(tag) || !outFile) {
  console.error('usage: node scripts/release-notes.mjs vX.Y.Z <output.md>');
  process.exit(1);
}
const version = tag.slice(1);

const changelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
const match = changelog.match(new RegExp(`^## \\[${version.replaceAll('.', '\\.')}\\][^\\n]*\\n([\\s\\S]*?)(?=^## \\[|\\Z)`, 'm'));
if (!match || !match[1].trim()) {
  console.error(`CHANGELOG.md has no section for ${version}. Add "## [${version}] - YYYY-MM-DD" before tagging.`);
  process.exit(1);
}
const section = match[1].trim();

// Every expected installer must exist before notes are written; a missing one aborts the release.
const installers = [
  `DSH-Desktop-Setup-${version}.exe`,
  `DSH-Desktop-${version}-arm64.dmg`,
  `DSH-Desktop-${version}-x64.dmg`,
];
const missing = installers.filter((name) => !fs.existsSync(path.join(root, 'dist', name)));
if (missing.length > 0) {
  for (const name of missing) console.error(`installer not found: ${path.join(root, 'dist', name)}`);
  process.exit(1);
}
const hashLines = installers
  .map((name) => `${crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'dist', name))).digest('hex')}  ${name}`)
  .join('\n');

const body = `${section}

---

**Verify / 校验** — SHA-256 of each installer / 各安装包的 SHA-256：

\`\`\`
${hashLines}
\`\`\`

Windows PowerShell: \`Get-FileHash <file> -Algorithm SHA256\` · macOS: \`shasum -a 256 <file>\`

---

- **Windows** — \`DSH-Desktop-Setup-${version}.exe\`. The installer is unsigned — if SmartScreen appears: More info → Run anyway.
- **macOS** — \`arm64\` dmg on Apple Silicon, \`x64\` dmg on Intel. The app is unsigned: on first open, right-click the app → Open, or allow it under System Settings → Privacy & Security → Open Anyway. If Gatekeeper still blocks the quarantined app, run \`xattr -cr "/Applications/DSH Desktop.app"\`. The shell does not auto-update on macOS — to upgrade, download the new dmg from Releases.
- Desktop shell around official \`dsh web\`. This package updates the shell only; it does not fork or embed DeepSeek Harness. Closing the window hides to the tray (the menu bar icon on macOS); quit from the cyan \`>_\` icon.

- **Windows** — \`DSH-Desktop-Setup-${version}.exe\`。安装包未签名，SmartScreen 提示时点「更多信息 → 仍要运行」。
- **macOS** — Apple Silicon 下载 \`arm64\` dmg，Intel 下载 \`x64\` dmg。应用未签名：首次打开请右键应用 →「打开」，或在 系统设置 → 隐私与安全性 点「仍要打开」；若仍被隔离拦下，执行 \`xattr -cr "/Applications/DSH Desktop.app"\`。macOS 上壳没有自动更新，升级请到 Releases 重新下载 dmg。
- 壳核分离桌面外壳，本包只更新壳，不内嵌、不 fork DeepSeek Harness。关窗进托盘（macOS 为菜单栏图标）；退出请从青色 \`>_\` 图标操作。
`;

fs.writeFileSync(path.join(root, outFile), body);
console.log(`wrote ${outFile} (${body.length} chars, ${installers.length} installers hashed)`);
