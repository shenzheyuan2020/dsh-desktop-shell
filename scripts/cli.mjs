#!/usr/bin/env node
// npm / npx 入口：用本包依赖的 electron 拉起壳。安装包用户不必走这条路。
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

let electronPath;
try {
  electronPath = require('electron');
} catch {
  console.error('未找到 electron。请先在本目录执行 pnpm install，或改用 GitHub Releases 里的安装包。');
  process.exit(1);
}

const child = spawn(electronPath, [root, ...process.argv.slice(2)], {
  stdio: 'inherit',
  windowsHide: false,
});
child.on('exit', code => process.exit(code ?? 0));
child.on('error', error => {
  console.error(error);
  process.exit(1);
});
