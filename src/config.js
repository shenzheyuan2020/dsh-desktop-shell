/** 配置加载：%APPDATA%/DSH Desktop/config.json，缺失时写入默认值并返回。 */
import { app, dialog } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { t } from './i18n.js';

const SOURCE_ARGS = ['--import', 'tsx/esm', 'apps/cli/src/bin.ts', 'web'];
// 维护者本机的源码仓库；其他机器命中不了该路径，会走 DSH_CHECKOUT、本应用已部署的官方包，或 PATH 上的 dsh。
export const KNOWN_CHECKOUTS = ['E:\\30_软件游戏\\Opt\\DSH'];

/** @param {string | undefined} dir 是否为可源码启动的 DSH 仓库。 */
export function isCheckout(dir) {
  return Boolean(dir) && fs.existsSync(path.join(dir, 'apps', 'cli', 'src', 'bin.ts'));
}

/** @returns {string} 本应用目录下官方 npm 包的安装前缀。 */
export function officialRuntimeDir() {
  return path.join(app.getPath('userData'), 'official-runtime');
}

/** @returns {string} 已部署官方包的 dsh 启动器路径（尚未安装时文件不存在）。 */
export function officialRuntimeBin() {
  const name = process.platform === 'win32' ? 'dsh.cmd' : 'dsh';
  return path.join(officialRuntimeDir(), 'node_modules', '.bin', name);
}

/** @returns {{command: string, args: string[], cwd: string, env: Record<string, string>, shell: boolean}} 指向本应用已部署官方包的启动配置。 */
export function officialRuntimeLaunch() {
  return { command: officialRuntimeBin(), args: ['web'], cwd: '', env: {}, shell: true };
}

/**
 * 按本机环境挑选默认启动方式：源码仓库 → 本应用已部署的官方包 → PATH 上的 dsh。
 * @returns {{command: string, args: string[], cwd: string, env: Record<string, string>, shell: boolean}} 默认配置。
 */
export function defaultConfig() {
  for (const dir of [...KNOWN_CHECKOUTS, process.env.DSH_CHECKOUT]) {
    if (isCheckout(dir)) {
      return { command: 'node', args: [...SOURCE_ARGS], cwd: dir, env: {}, shell: false, locale: 'en' };
    }
  }
  if (fs.existsSync(officialRuntimeBin())) return { ...officialRuntimeLaunch(), locale: 'en' };
  return { command: 'dsh', args: ['web'], cwd: '', env: {}, shell: true, locale: 'en' };
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
    dialog.showErrorBox(t('configBadTitle'), t('configBadBody', { file, error: String(error) }));
    return { ...defaults };
  }
}

/**
 * 把部分字段写回 config.json，并返回合并后的生效配置。
 * @param {Partial<{command: string, args: string[], cwd: string, env: Record<string, string>, shell: boolean}>} patch 要覆盖的字段。
 * @returns {{command: string, args: string[], cwd: string, env: Record<string, string>, shell: boolean}} 合并后的配置。
 */
export function saveConfig(patch) {
  const merged = { ...loadConfig(), ...patch };
  const file = configPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  return merged;
}
