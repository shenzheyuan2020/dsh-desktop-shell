/** 探测本机能否运行官方 DeepSeek Harness：系统 Node/npm，以及源码仓库 / 本应用已部署的官方包 / PATH 上的 dsh。 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { isCheckout, officialRuntimeBin, KNOWN_CHECKOUTS } from './config.js';

/**
 * @param {string} command 要在 PATH 上查找的可执行文件名。
 * @returns {string} 第一个命中路径；没有则为空串。
 */
export function which(command) {
  try {
    const tool = process.platform === 'win32' ? 'where.exe' : 'which';
    return execFileSync(tool, [command], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 8000,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .trim()
      .split(/\r?\n/)[0];
  } catch {
    return '';
  }
}

/**
 * 官方 CLI 要求 Node ^22.19 || >=24。
 * @param {string} version `node --version` 输出。
 * @returns {boolean} 是否满足官方引擎要求。
 */
export function nodeSatisfies(version) {
  const match = String(version).match(/v?(\d+)\.(\d+)/);
  if (!match) return false;
  const major = Number(match[1]);
  const minor = Number(match[2]);
  return (major === 22 && minor >= 19) || major >= 24;
}

/**
 * @returns {{node: {ok: boolean, version: string, path: string, npm: string, reason: string}, harness: {kind: 'checkout' | 'runtime' | 'path' | 'missing', detail: string}}} 探测结果。
 */
export function probeEnvironment() {
  const nodePath = which('node');
  const npmPath = which('npm');
  let version = '';
  if (nodePath) {
    try {
      version = execFileSync(nodePath, ['--version'], {
        encoding: 'utf8',
        windowsHide: true,
        timeout: 8000,
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
    } catch {
      version = '';
    }
  }
  let reason = '';
  if (!nodePath) reason = '未找到系统 Node.js。请先安装 Node.js 22.19 或 24 以上（不要只用 Electron 自带的运行时）。';
  else if (!npmPath) reason = '找到了 node，但没有 npm。请重装官方 Node.js 安装包。';
  else if (!nodeSatisfies(version)) reason = `当前 Node 是 ${version || '未知版本'}，官方 DSH 需要 22.19+ 或 24+。`;

  const node = { ok: Boolean(nodePath && npmPath && nodeSatisfies(version)), version, path: nodePath, npm: npmPath, reason };

  for (const dir of [...KNOWN_CHECKOUTS, process.env.DSH_CHECKOUT]) {
    if (isCheckout(dir)) {
      return { node, harness: { kind: 'checkout', detail: dir } };
    }
  }
  const runtime = officialRuntimeBin();
  if (fs.existsSync(runtime)) {
    return { node, harness: { kind: 'runtime', detail: runtime } };
  }
  const onPath = which('dsh');
  if (onPath) {
    return { node, harness: { kind: 'path', detail: onPath } };
  }
  return { node, harness: { kind: 'missing', detail: '' } };
}
