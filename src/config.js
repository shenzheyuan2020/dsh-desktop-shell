/** 配置加载：userData（DSH Desktop）目录下的 config.json，缺失时写入默认值并返回。 */
import { app, dialog } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { t } from './i18n.js';

/** 源码仓库启动参数（cwd 必须是仓库根）。 */
export const SOURCE_LAUNCH_ARGS = ['--import', 'tsx/esm', 'apps/cli/src/bin.ts', 'web'];

const NODE_DOWNLOAD = 'https://nodejs.org/en/download';
const NPM_MIRROR = 'https://registry.npmmirror.com';

/** 官方 Node 下载页（页面上请选 22.19+ 或 24，不要选 20 LTS）。 */
export function nodeDownloadUrl() {
  return NODE_DOWNLOAD;
}

/** 国内 npm 镜像，默认源失败时回退。 */
export function npmMirrorUrl() {
  return NPM_MIRROR;
}

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

/**
 * @param {null | {home?: string}} [node] 用于前置 PATH 的 Node 目录（便携 Node 必须带上）。
 * @returns {Record<string, unknown>} 指向本应用已部署官方包的启动配置。
 */
export function officialRuntimeLaunch(node = null) {
  const env = {};
  if (node?.home) env.PATH = `${node.home}${path.delimiter}${process.env.PATH || ''}`;
  return { command: officialRuntimeBin(), args: ['web'], cwd: '', env, shell: true };
}

/**
 * 首次写入配置时的界面语言：跟系统显示语言，可再在壳里改。
 * @returns {'en' | 'zh'}
 */
export function detectDefaultLocale() {
  try {
    const loc = String(app.getLocale?.() || Intl.DateTimeFormat().resolvedOptions().locale || 'en');
    return loc.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  } catch {
    return 'en';
  }
}

/**
 * 按本机环境挑选默认启动方式：`DSH_CHECKOUT` → 本应用已部署的官方包 → PATH 上的 `dsh`。
 * 不扫描维护者本机路径。
 * @returns {Record<string, unknown>} 默认配置。
 */
export function defaultConfig() {
  const locale = detectDefaultLocale();
  const checkout = process.env.DSH_CHECKOUT;
  if (isCheckout(checkout)) {
    return { command: 'node', args: [...SOURCE_LAUNCH_ARGS], cwd: checkout, env: {}, shell: false, locale };
  }
  if (fs.existsSync(officialRuntimeBin())) return { ...officialRuntimeLaunch(), locale };
  return { command: 'dsh', args: ['web'], cwd: '', env: {}, shell: true, locale };
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
 * @returns {Record<string, unknown>} 生效配置。
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
 * @param {Record<string, unknown>} patch 要覆盖的字段。
 * @returns {Record<string, unknown>} 合并后的配置。
 */
export function saveConfig(patch) {
  const merged = { ...loadConfig(), ...patch };
  const file = configPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  return merged;
}
