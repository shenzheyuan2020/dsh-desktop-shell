/**
 * 把官方 npm 包 @deepseek-ai/dsh 装进本应用目录（不 fork、不改官方源码）。
 * 能装的前提：系统已有满足官方引擎要求的 Node + npm，且能访问 npm 源。
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import readline from 'node:readline';
import { officialRuntimeBin, officialRuntimeDir, officialRuntimeLaunch, saveConfig } from './config.js';
import { probeEnvironment, which } from './probe.js';
import { t } from './i18n.js';

const OFFICIAL_PACKAGE = '@deepseek-ai/dsh';

/**
 * 从 npm 安装官方 CLI 到 userData/official-runtime，并写回启动配置。
 * @param {{onLog?: (line: string) => void}} [options] 把 npm 输出送到启动页。
 * @returns {Promise<{ok: true, config: ReturnType<typeof officialRuntimeLaunch>, versionLine: string} | {ok: false, error: string}>} 部署结果。
 */
export function deployOfficial(options = {}) {
  const log = line => options.onLog?.(line);
  const probe = probeEnvironment();
  if (!probe.node.ok) {
    return Promise.resolve({ ok: false, error: probe.node.reason });
  }
  const npm = which('npm');
  const dir = officialRuntimeDir();
  fs.mkdirSync(dir, { recursive: true });
  log(t('deployTo', { pkg: OFFICIAL_PACKAGE }));
  log(dir);
  log(t('deployCmd', { pkg: OFFICIAL_PACKAGE }));

  return new Promise(resolve => {
    const child = spawn(npm, ['install', '--prefix', dir, OFFICIAL_PACKAGE], {
      shell: process.platform === 'win32',
      windowsHide: true,
      env: { ...process.env, npm_config_update_notifier: 'false', NO_COLOR: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.on('error', error => {
      resolve({ ok: false, error: String(error) });
    });
    for (const stream of [child.stdout, child.stderr]) {
      if (stream) readline.createInterface({ input: stream }).on('line', line => log(line));
    }
    child.on('exit', code => {
      const bin = officialRuntimeBin();
      if (code !== 0 || !fs.existsSync(bin)) {
        resolve({
          ok: false,
          error: t('deployNpmFail', { code: code ?? 'null', pkg: OFFICIAL_PACKAGE }),
        });
        return;
      }
      const config = saveConfig(officialRuntimeLaunch());
      log(t('deployWrote', { bin }));
      resolve({ ok: true, config, versionLine: OFFICIAL_PACKAGE });
    });
  });
}
