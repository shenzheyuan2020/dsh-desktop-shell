/** 从文件夹识别官方 Harness，并读取已安装版本。 */
import fs from 'node:fs';
import path from 'node:path';
import { isCheckout, officialRuntimeDir, SOURCE_LAUNCH_ARGS } from './config.js';

/**
 * @param {string} file package.json 路径。
 * @returns {string} version 字段；读不到则为空串。
 */
export function readJsonVersion(file) {
  try {
    const version = JSON.parse(fs.readFileSync(file, 'utf8')).version;
    return typeof version === 'string' ? version : '';
  } catch {
    return '';
  }
}

/**
 * 把用户选中的目录变成启动配置。
 * 接受：源码仓库根、含 `dsh.cmd`/`dsh` 的目录、或 `node_modules/.bin` 的上两级。
 * @param {string} dir 文件夹。
 * @returns {null | {command: string, args: string[], cwd: string, env: Record<string, string>, shell: boolean}} 启动配置。
 */
export function resolveLaunchFromDir(dir) {
  if (!dir || !fs.existsSync(dir)) return null;
  if (isCheckout(dir)) {
    return { command: 'node', args: [...SOURCE_LAUNCH_ARGS], cwd: dir, env: {}, shell: false };
  }
  const binName = process.platform === 'win32' ? 'dsh.cmd' : 'dsh';
  const candidates = [
    path.join(dir, binName),
    path.join(dir, 'node_modules', '.bin', binName),
    path.join(dir, '.bin', binName),
  ];
  for (const command of candidates) {
    if (fs.existsSync(command)) {
      return { command, args: ['web'], cwd: '', env: {}, shell: true };
    }
  }
  return null;
}

/**
 * @param {'checkout' | 'runtime' | 'path' | 'missing'} kind 探测种类。
 * @param {string} detail 路径。
 * @returns {string} 官方包或仓库 package.json 的 version。
 */
export function harnessVersion(kind, detail) {
  if (kind === 'runtime') {
    return readJsonVersion(path.join(officialRuntimeDir(), 'node_modules', '@deepseek-ai', 'dsh', 'package.json'));
  }
  if (kind === 'checkout' && detail) {
    return readJsonVersion(path.join(detail, 'package.json'));
  }
  if (kind === 'path' && detail) {
    const binDir = path.dirname(detail);
    const nearby = [
      path.join(binDir, '..', '@deepseek-ai', 'dsh', 'package.json'),
      path.join(binDir, '..', '..', '@deepseek-ai', 'dsh', 'package.json'),
    ];
    for (const file of nearby) {
      const version = readJsonVersion(file);
      if (version) return version;
    }
  }
  return '';
}
