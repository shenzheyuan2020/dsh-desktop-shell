/** 探测本机能否运行官方 DeepSeek Harness：系统或本应用便携 Node/npm，以及源码仓库 / 官方包 / PATH 上的 dsh。 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { isCheckout, officialRuntimeBin } from './config.js';
import { findBundledRuntime } from './bundled-node.js';
import { harnessVersion } from './harness.js';
import { t } from './i18n.js';

/**
 * macOS 上从 Finder/Dock 启动的 GUI 进程只继承极简 PATH（/usr/bin:/bin:/usr/sbin:/sbin），
 * Homebrew / Volta 装的 node、dsh 全都找不到。把常见安装目录里真实存在且尚未入 PATH 的
 * 前置到 process.env.PATH，让 which/spawn 与终端里的结果一致。非 darwin 平台不做任何事。
 */
export function augmentDarwinPath() {
  if (process.platform !== 'darwin') return;
  const candidates = ['/opt/homebrew/bin', '/usr/local/bin', path.join(os.homedir(), '.volta', 'bin')];
  const current = String(process.env.PATH || '').split(path.delimiter).filter(Boolean);
  const missing = candidates.filter(dir => fs.existsSync(dir) && !current.includes(dir));
  if (missing.length > 0) process.env.PATH = [...missing, ...current].join(path.delimiter);
}

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
 * @param {string} nodePath
 * @returns {string}
 */
function readNodeVersion(nodePath) {
  try {
    return execFileSync(nodePath, ['--version'], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 8000,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

/**
 * @param {'system' | 'bundled'} source
 * @param {string} nodePath
 * @param {string} npmPath
 */
function inspectRuntime(source, nodePath, npmPath) {
  const version = nodePath ? readNodeVersion(nodePath) : '';
  let reason = '';
  if (!nodePath) reason = t('nodeMissing');
  else if (!npmPath || !fs.existsSync(npmPath)) reason = t('npmMissing');
  else if (!nodeSatisfies(version)) reason = t('nodeOld', { version: version || t('nodeUnknown') });
  const ok = Boolean(nodePath && npmPath && fs.existsSync(npmPath) && nodeSatisfies(version));
  return {
    ok,
    version,
    path: nodePath || '',
    npm: npmPath || '',
    home: nodePath ? path.dirname(nodePath) : '',
    source: ok ? source : 'missing',
    reason,
  };
}

/**
 * 系统合格 Node 优先，否则用本应用目录里已下载的便携 Node。
 * @returns {{ok: boolean, version: string, path: string, npm: string, home: string, source: 'system' | 'bundled' | 'missing', reason: string}}
 */
export function resolveNodeRuntime() {
  const system = inspectRuntime('system', which('node'), which('npm'));
  if (system.ok) return system;
  const bundled = findBundledRuntime();
  if (bundled) {
    const local = inspectRuntime('bundled', bundled.node, bundled.npm);
    if (local.ok) return local;
  }
  return { ...system, source: 'missing', ok: false };
}

/**
 * @param {null | {home?: string}} [node]
 * @returns {Record<string, string>} 给子进程前置 Node 目录的 PATH；系统 Node 也可安全前置。
 */
export function launchEnvForNode(node) {
  if (!node?.home) return {};
  return { PATH: `${node.home}${path.delimiter}${process.env.PATH || ''}` };
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
 * @returns {{node: ReturnType<typeof resolveNodeRuntime>, harness: {kind: 'checkout' | 'runtime' | 'path' | 'missing', detail: string, version: string}}} 探测结果。
 */
export function probeEnvironment(config = null) {
  const node = resolveNodeRuntime();

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
