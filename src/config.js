/** 配置加载：%APPDATA%/DSH Desktop/config.json，缺失时写入默认值并返回。 */
import { app, dialog } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

const SOURCE_ARGS = ['--import', 'tsx/esm', 'apps/cli/src/bin.ts', 'web'];
// 维护者本机的源码仓库；其他机器命中不了该路径，会走 DSH_CHECKOUT 或 PATH 上的 dsh。
const KNOWN_CHECKOUTS = ['E:\\30_软件游戏\\Opt\\DSH'];

/** @param {string | undefined} dir 是否为可源码启动的 DSH 仓库。 */
function isCheckout(dir) {
  return Boolean(dir) && fs.existsSync(path.join(dir, 'apps', 'cli', 'src', 'bin.ts'));
}

/**
 * 按本机环境挑选默认启动方式：已知源码仓库 → 环境变量 DSH_CHECKOUT 指向的仓库 → PATH 上的 dsh。
 * @returns {{command: string, args: string[], cwd: string, env: Record<string, string>, shell: boolean}} 默认配置。
 */
export function defaultConfig() {
  for (const dir of [...KNOWN_CHECKOUTS, process.env.DSH_CHECKOUT]) {
    if (isCheckout(dir)) {
      return { command: 'node', args: [...SOURCE_ARGS], cwd: dir, env: {}, shell: false };
    }
  }
  // npm 全局安装的 dsh 在 Windows 上是 .cmd 垫片，必须经 shell 启动。
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
