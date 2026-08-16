// Build the GitHub release body: this tag's CHANGELOG section + installer SHA-256 + standing install notes.
// Usage: node scripts/release-notes.mjs vX.Y.Z <output.md>
// Fails loudly when the CHANGELOG section or the installer is missing, so a tag cannot ship without notes.
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

const exeName = `DSH-Desktop-Setup-${version}.exe`;
const exePath = path.join(root, 'dist', exeName);
if (!fs.existsSync(exePath)) {
  console.error(`installer not found: ${exePath}`);
  process.exit(1);
}
const sha256 = crypto.createHash('sha256').update(fs.readFileSync(exePath)).digest('hex');

const body = `${section}

---

**Verify / 校验** — SHA-256 of \`${exeName}\`:

\`\`\`
${sha256}
\`\`\`

PowerShell: \`Get-FileHash .\\${exeName} -Algorithm SHA256\`

---

Desktop shell around official \`dsh web\`. This package updates the shell only; it does not fork or embed DeepSeek Harness. The installer is unsigned — if SmartScreen appears: More info → Run anyway. Closing the window hides to the tray; quit from the cyan \`>_\` tray icon.

壳核分离桌面外壳，本包只更新壳，不内嵌、不 fork DeepSeek Harness。安装包未签名，SmartScreen 提示时点「更多信息 → 仍要运行」。关窗进托盘；退出请右键托盘青色 \`>_\` 图标。
`;

fs.writeFileSync(path.join(root, outFile), body);
console.log(`wrote ${outFile} (${body.length} chars, sha256 ${sha256.slice(0, 12)}…)`);
