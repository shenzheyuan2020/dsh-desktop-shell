/**
 * 把官方 npm 包 @deepseek-ai/dsh 装进本应用目录（不 fork、不改官方源码）。
 * 能装的前提：系统已有满足官方引擎要求的 Node + npm，且能访问 npm 源。
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
import { probeEnvironment, which } from './probe.js';
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
function runNpmInstall(npm, dir, registry, log) {
  const env = { ...process.env, npm_config_update_notifier: 'false', NO_COLOR: '1' };
  if (registry) env.npm_config_registry = registry;
  log(registry ? t('deployRegistry', { registry }) : t('deployRegistryDefault'));
  log(t('deployCmd', { pkg: OFFICIAL_PACKAGE }));

  return new Promise(resolve => {
    const child = spawn(npm, ['install', '--prefix', dir, OFFICIAL_PACKAGE], {
      shell: process.platform === 'win32',
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
  const npm = which('npm');
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
    lastCode = await runNpmInstall(npm, dir, registry, log);
    const bin = officialRuntimeBin();
    if (lastCode === 0 && fs.existsSync(bin)) {
      const version = installedVersion();
      const config = saveConfig({ ...officialRuntimeLaunch(), harnessVersion: version });
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
