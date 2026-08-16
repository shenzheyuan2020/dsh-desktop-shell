/** 探测本机能否运行官方 DeepSeek Harness：系统 Node/npm，以及源码仓库 / 本应用已部署的官方包 / PATH 上的 dsh。 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { isCheckout, officialRuntimeBin } from './config.js';
import { harnessVersion } from './harness.js';
import { t } from './i18n.js';

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
 * @param {'checkout' | 'runtime' | 'path' | 'missing'} kind
 * @param {string} detail
 */
function harnessInfo(kind, detail) {
  return { kind, detail, version: harnessVersion(kind, detail) };
}

/**
 * @param {null | {command?: string, cwd?: string}} [config] 当前启动配置；优先于环境扫描，避免和实际拉起的后端不一致。
 * @returns {{node: {ok: boolean, version: string, path: string, npm: string, reason: string}, harness: {kind: 'checkout' | 'runtime' | 'path' | 'missing', detail: string, version: string}}} 探测结果。
 */
export function probeEnvironment(config = null) {
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
  if (!nodePath) reason = t('nodeMissing');
  else if (!npmPath) reason = t('npmMissing');
  else if (!nodeSatisfies(version)) reason = t('nodeOld', { version: version || t('nodeUnknown') });

  const node = { ok: Boolean(nodePath && npmPath && nodeSatisfies(version)), version, path: nodePath, npm: npmPath, reason };

  if (config?.cwd && isCheckout(config.cwd)) {
    return { node, harness: harnessInfo('checkout', config.cwd) };
  }
  const configured = String(config?.command || '');
  if (configured && fs.existsSync(configured)) {
    const kind = configured.replaceAll('\\', '/').includes('official-runtime') ? 'runtime' : 'path';
    return { node, harness: harnessInfo(kind, configured) };
  }

  const checkout = process.env.DSH_CHECKOUT;
  if (isCheckout(checkout)) {
    return { node, harness: harnessInfo('checkout', checkout) };
  }
  const runtime = officialRuntimeBin();
  if (fs.existsSync(runtime)) {
    return { node, harness: harnessInfo('runtime', runtime) };
  }
  const onPath = which('dsh');
  if (onPath) {
    return { node, harness: harnessInfo('path', onPath) };
  }
  return { node, harness: harnessInfo('missing', '') };
}
