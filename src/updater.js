/**
 * 壳自身的自动更新（electron-updater + GitHub Releases）。
 * 只更新桌面壳安装包，不碰官方 dsh 源码或 Web GUI。
 * 开发模式（pnpm start）没有安装包元数据，只提示、不检查。
 * macOS 包未签名，electron-updater 无法应用更新：只提示并引导去 Releases 手动换包。
 */
import { app, dialog, Notification, shell } from 'electron';
import { createRequire } from 'node:module';
import { t } from './i18n.js';

const require = createRequire(import.meta.url);
const { autoUpdater } = require('electron-updater');

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const STARTUP_DELAY_MS = 8000;

/** 只有 Windows NSIS 安装版才走自动更新；未签名的 macOS 包装不上，免安装目录 / 开发模式会误检或装错位置。 */
function canAutoUpdate() {
  if (process.platform === 'darwin') return false;
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
        if (process.platform === 'darwin') {
          const { response } = await dialog.showMessageBox({
            type: 'info',
            title: 'DSH Desktop',
            message: t('updateMacTitle'),
            detail: t('updateMacDetail'),
            buttons: [t('updateMacOpenReleases'), t('cancel')],
            defaultId: 0,
            cancelId: 1,
          });
          if (response === 0) {
            void shell.openExternal('https://github.com/shenzheyuan2020/dsh-desktop-shell/releases');
          }
          return;
        }
        await dialog.showMessageBox({
          type: 'info',
          title: 'DSH Desktop',
          message: t('updateDevTitle'),
          detail: t('updateDevDetail'),
        });
      }
      return;
    }
    if (state.kind === 'checking' || state.kind === 'downloading') {
      if (userInitiated) {
        await dialog.showMessageBox({ type: 'info', title: 'DSH Desktop', message: t('updateBusy') });
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
            message: t('updateLatest', { version: app.getVersion() }),
          });
        }
      } else if (userInitiated) {
        await dialog.showMessageBox({
          type: 'info',
          title: 'DSH Desktop',
          message: t('updateFound', { version: incoming }),
          detail: t('updateFoundDetail'),
        });
      }
    } catch (error) {
      const message = String(error?.message ?? error);
      emit({ kind: 'error', message });
      if (userInitiated) {
        await dialog.showMessageBox({
          type: 'error',
          title: t('updateFailTitle'),
          message: t('updateFailBody'),
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
          title: t('updateNotifyTitle'),
          body: t('updateNotifyBody', { version: info.version }),
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
        title: t('updateReadyTitle'),
        message: t('updateReadyBody', { version: info.version }),
        detail: t('updateReadyDetail'),
        buttons: [t('updateNow'), t('updateLater')],
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
