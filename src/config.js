/** 配置加载：%APPDATA%/DSH Desktop/config.json，缺失时写入默认值并返回。 */
import { app, dialog } from 'electron';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const SOURCE_ARGS = ['--import', 'tsx/esm', 'apps/cli/src/bin.ts', 'web'];
const LOCAL_CHECKOUT = 'E:\\30_软件游戏\\Opt\\DSH';

/** @param {string | undefined} dir 是否为可源码启动的 DSH 仓库。 */
function isCheckout(dir) {
  return Boolean(dir) && fs.existsSync(path.join(dir, 'apps', 'cli', 'src', 'bin.ts'));
}

/** @returns {string} PATH 上的 dsh 可执行文件；没有则空串。 */
function resolveDshOnPath() {
  try {
    const command = process.platform === 'win32' ? 'where.exe dsh' : 'command -v dsh';
    return execSync(command, { encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] })
      .trim()
      .split(/\r?\n/)[0];
  } catch {
    return '';
  }
}

/**
 * 按本机环境挑选默认启动方式：本机源码仓库优先，其次 PATH 上的 dsh。
 * @returns {{command: string, args: string[], cwd: string, env: Record<string, string>, shell: boolean}} 默认配置。
 */
export function defaultConfig() {
  if (isCheckout(LOCAL_CHECKOUT)) {
    return { command: 'node', args: [...SOURCE_ARGS], cwd: LOCAL_CHECKOUT, env: {}, shell: false };
  }
  const fromEnv = process.env.DSH_HOME;
  if (isCheckout(fromEnv)) {
    return { command: 'node', args: [...SOURCE_ARGS], cwd: fromEnv, env: {}, shell: false };
  }
  if (resolveDshOnPath()) {
    return { command: 'dsh', args: ['web'], cwd: '', env: {}, shell: true };
  }
  return { command: 'dsh', args: ['web'], cwd: '', env: {}, shell: true };
}

/**
 * 配置文件绝对路径。
 * @returns {string} userData 下 config.json 的路径。
 */
export function configPath() {
  return path.join(app.getPath('userData'), 'config.json');
}

/**
 * 读取配置；文件不存在时落盘默认值，JSON 损坏时弹窗提示并回退默认值（不覆盖用户文件）。
 * @returns {{command: string, args: string[], cwd: string, env: Record<string, string>, shell: boolean}} 生效配置。
 */
export function loadConfig() {
  const file = configPath();
  const defaults = defaultConfig();
  try {
    if (!fs.existsSync(file)) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, `${JSON.stringify(defaults, null, 2)}\n`, 'utf8');
      return { ...defaults };
    }
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return { ...defaults, ...parsed };
  } catch (error) {
    dialog.showErrorBox('DSH Desktop 配置无效', `${file}\n\n${String(error)}\n\n本次启动使用内置默认配置；修复该文件后重启壳生效。`);
    return { ...defaults };
  }
}
