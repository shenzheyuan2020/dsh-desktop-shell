/**
 * 把官方 npm 包 @deepseek-ai/dsh 装进本应用目录（不 fork、不改官方源码）。
 * 能装的前提：系统或本应用便携 Node+npm 合格，且能访问 npm 源。
 * 默认源失败时自动改用 npmmirror。
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import readline from 'node:readline';
import {
  loadConfig,
  npmMirrorUrl,
  officialRuntimeBin,
  officialRuntimeDir,
  officialRuntimeLaunch,
  saveConfig,
} from './config.js';
import { readJsonVersion } from './harness.js';
import { probeEnvironment } from './probe.js';
import { quoteForShell } from './shell-quote.js';
import { t } from './i18n.js';
import path from 'node:path';

const OFFICIAL_PACKAGE = '@deepseek-ai/dsh';

/**
 * @param {string} npm npm 可执行文件。
 * @param {string} dir 安装前缀。
 * @param {string} registry 空串表示用默认源。
 * @param {(line: string) => void} log
 * @returns {Promise<number | null>} 退出码。
 */
function runNpmInstall(npm, dir, registry, log, nodeHome) {
  const env = { ...process.env, npm_config_update_notifier: 'false', NO_COLOR: '1' };
  if (nodeHome) env.PATH = `${nodeHome}${path.delimiter}${process.env.PATH || ''}`;
  if (registry) env.npm_config_registry = registry;
  log(registry ? t('deployRegistry', { registry }) : t('deployRegistryDefault'));
  log(t('deployCmd', { pkg: OFFICIAL_PACKAGE }));

  return new Promise(resolve => {
    // Windows 上 npm 是 .cmd，必须经 cmd 启动（shell:true），npm 路径与 --prefix 目录都可能含空格，先加引号；
    // POSIX 走 shell:false 数组传参，天然不受空格影响，不要加引号。
    const useShell = process.platform === 'win32';
    const npmArgs = ['install', '--prefix', dir, OFFICIAL_PACKAGE];
    const child = spawn(useShell ? quoteForShell(npm) : npm, useShell ? npmArgs.map(quoteForShell) : npmArgs, {
      shell: useShell,
      windowsHide: true,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.on('error', error => {
      log(String(error));
      resolve(1);
    });
    for (const stream of [child.stdout, child.stderr]) {
      if (stream) readline.createInterface({ input: stream }).on('line', line => log(line));
    }
    child.on('exit', code => resolve(code));
  });
}

function installedVersion() {
  return readJsonVersion(path.join(officialRuntimeDir(), 'node_modules', '@deepseek-ai', 'dsh', 'package.json'));
}

/**
 * 从 npm 安装官方 CLI 到 userData/official-runtime，并写回启动配置。
 * @param {{onLog?: (line: string) => void}} [options] 把 npm 输出送到启动页。
 * @returns {Promise<{ok: true, config: ReturnType<typeof officialRuntimeLaunch>, version: string} | {ok: false, error: string}>} 部署结果。
 */
export async function deployOfficial(options = {}) {
  const log = line => options.onLog?.(line);
  const probe = probeEnvironment();
  if (!probe.node.ok) {
    return { ok: false, error: probe.node.reason };
  }
  const npm = probe.node.npm;
  const dir = officialRuntimeDir();
  fs.mkdirSync(dir, { recursive: true });
  log(t('deployTo', { pkg: OFFICIAL_PACKAGE }));
  log(dir);

  const registries = [];
  const saved = loadConfig();
  const configured = typeof saved.npmRegistry === 'string' ? saved.npmRegistry.trim() : '';
  if (configured) registries.push(configured);
  registries.push('');
  registries.push(npmMirrorUrl());
  const unique = [...new Set(registries)];

  let lastCode = null;
  for (const [index, registry] of unique.entries()) {
    if (index > 0) log(t('deployRetryMirror'));
    lastCode = await runNpmInstall(npm, dir, registry, log, probe.node.home);
    const bin = officialRuntimeBin();
    if (lastCode === 0 && fs.existsSync(bin)) {
      const version = installedVersion();
      const config = saveConfig({ ...officialRuntimeLaunch(probe.node), harnessVersion: version });
      log(t('deployWrote', { bin }));
      if (version) log(t('deployVersion', { version }));
      return { ok: true, config, version };
    }
  }

  return {
    ok: false,
    error: t('deployNpmFail', { code: lastCode ?? 'null', pkg: OFFICIAL_PACKAGE }),
  };
}
