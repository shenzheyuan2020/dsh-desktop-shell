/**
 * 壳自身的自动更新（electron-updater + GitHub Releases）。
 * 只更新桌面壳安装包，不碰官方 dsh 源码或 Web GUI。
 * 开发模式（pnpm start）没有安装包元数据，只提示、不检查。
 */
import { app, dialog, Notification } from 'electron';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { autoUpdater } = require('electron-updater');

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const STARTUP_DELAY_MS = 8000;

/**
 * @typedef {{kind: 'dev' | 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error', version?: string, message?: string}} UpdateState
 */

/**
 * 挂上自动更新。打包版启动后延迟检查，之后每 6 小时再查一次。
 * @param {{onState?: (state: UpdateState) => void}} [options] 状态变化回调（托盘文案用）。
 * @returns {{check: (opts?: {userInitiated?: boolean}) => Promise<void>, quitAndInstall: () => void, getState: () => UpdateState}} 检查、安装与当前状态。
 */
export function startUpdater(options = {}) {
  /** @type {UpdateState} */
  let state = { kind: app.isPackaged ? 'idle' : 'dev' };
  const emit = next => {
    state = next;
    options.onState?.(state);
  };

  const check = async ({ userInitiated = false } = {}) => {
    if (!app.isPackaged) {
      if (userInitiated) {
        await dialog.showMessageBox({
          type: 'info',
          title: 'DSH Desktop',
          message: '开发模式不检查更新',
          detail: '自动更新只对安装包 / 打包版生效。发布新版本后，已安装用户会在启动时或点「检查更新」时收到。',
        });
      }
      return;
    }
    if (state.kind === 'checking' || state.kind === 'downloading') {
      if (userInitiated) {
        await dialog.showMessageBox({ type: 'info', title: 'DSH Desktop', message: '正在检查或下载更新，请稍候。' });
      }
      return;
    }
    emit({ kind: 'checking' });
    try {
      const result = await autoUpdater.checkForUpdates();
      const update = result?.updateInfo;
      const incoming = update?.version;
      if (!incoming || incoming === app.getVersion()) {
        emit({ kind: 'idle' });
        if (userInitiated) {
          await dialog.showMessageBox({
            type: 'info',
            title: 'DSH Desktop',
            message: `已是最新版本 ${app.getVersion()}`,
          });
        }
      }
    } catch (error) {
      const message = String(error?.message ?? error);
      emit({ kind: 'error', message });
      if (userInitiated) {
        await dialog.showMessageBox({
          type: 'error',
          title: '检查更新失败',
          message: '无法联系 GitHub Releases。',
          detail: message,
        });
      }
    }
  };

  if (app.isPackaged) {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.logger = console;
    autoUpdater.on('update-available', info => {
      emit({ kind: 'available', version: info.version });
      try {
        new Notification({
          title: 'DSH Desktop 有新版本',
          body: `${info.version} 正在后台下载。完成后可从托盘安装。`,
        }).show();
      } catch {
        /* 通知权限缺失时仍走托盘状态 */
      }
    });
    autoUpdater.on('download-progress', () => {
      if (state.kind !== 'downloading') emit({ kind: 'downloading', version: state.version });
    });
    autoUpdater.on('update-downloaded', async info => {
      emit({ kind: 'ready', version: info.version });
      const { response } = await dialog.showMessageBox({
        type: 'info',
        title: '更新已就绪',
        message: `DSH Desktop ${info.version} 已下载完成。`,
        detail: '现在重启安装，或稍后从托盘选择「安装更新并重启」。后端会随壳一起退出。',
        buttons: ['现在重启安装', '稍后'],
        defaultId: 0,
        cancelId: 1,
      });
      if (response === 0) autoUpdater.quitAndInstall(false, true);
    });
    autoUpdater.on('error', error => {
      emit({ kind: 'error', message: String(error?.message ?? error) });
    });
    setTimeout(() => {
      void check({ userInitiated: false });
    }, STARTUP_DELAY_MS);
    setInterval(() => {
      void check({ userInitiated: false });
    }, CHECK_INTERVAL_MS);
  }

  return {
    check,
    quitAndInstall: () => autoUpdater.quitAndInstall(false, true),
    getState: () => state,
  };
}
