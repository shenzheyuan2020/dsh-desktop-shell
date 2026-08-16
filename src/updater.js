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

/** 只有 NSIS 安装版才走自动更新；免安装目录 / 开发模式会误检或装错位置。 */
function canAutoUpdate() {
  if (!app.isPackaged) return false;
  const exe = app.getPath('exe').replaceAll('\\', '/').toLowerCase();
  return !exe.includes('/win-unpacked/') && !exe.includes('/dist/');
}

/**
 * @typedef {{kind: 'dev' | 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error', version?: string, message?: string}} UpdateState
 */

/**
 * 挂上自动更新。打包版启动后延迟检查，之后每 6 小时再查一次。
 * @param {{onState?: (state: UpdateState) => void, onBeforeInstall?: () => void}} [options] 状态回调；安装前钩子用于放行关窗（避免被托盘逻辑拦下）。
 * @returns {{check: (opts?: {userInitiated?: boolean}) => Promise<void>, quitAndInstall: () => void, getState: () => UpdateState}} 检查、安装与当前状态。
 */
export function startUpdater(options = {}) {
  const enabled = canAutoUpdate();
  /** @type {UpdateState} */
  let state = { kind: enabled ? 'idle' : 'dev' };
  const emit = next => {
    state = next;
    options.onState?.(state);
  };

  const check = async ({ userInitiated = false } = {}) => {
    if (!enabled) {
      if (userInitiated) {
        await dialog.showMessageBox({
          type: 'info',
          title: 'DSH Desktop',
          message: '当前运行方式不检查更新',
          detail: '自动更新只对「DSH-Desktop-Setup」安装版生效。请从 GitHub Releases 下载 Setup 安装；开发模式和 win-unpacked 免安装目录不会自动升级。',
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
      const incoming = result?.updateInfo?.version;
      const available = result?.isUpdateAvailable ?? (Boolean(incoming) && incoming !== app.getVersion());
      if (!available) {
        emit({ kind: 'idle' });
        if (userInitiated) {
          await dialog.showMessageBox({
            type: 'info',
            title: 'DSH Desktop',
            message: `已是最新版本 ${app.getVersion()}`,
          });
        }
      } else if (userInitiated) {
        await dialog.showMessageBox({
          type: 'info',
          title: 'DSH Desktop',
          message: `发现新版本 ${incoming}`,
          detail: '正在后台下载，完成后会提示重启安装；也可稍后从托盘安装。',
        });
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

  if (enabled) {
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
      if (response === 0) {
        options.onBeforeInstall?.();
        autoUpdater.quitAndInstall(false, true);
      }
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
    quitAndInstall: () => {
      options.onBeforeInstall?.();
      autoUpdater.quitAndInstall(false, true);
    },
    getState: () => state,
  };
}
