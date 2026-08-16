/**
 * DSH Desktop 壳主进程：单实例、启动页、主窗口、托盘、外链策略与后端编排。
 * 主窗口以零注入方式承载 dsh web GUI（无 preload、sandbox 开启），只允许 loopback 导航。
 */
import { app, BrowserWindow, Menu, Tray, shell, ipcMain, clipboard } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, configPath } from './config.js';
import { Supervisor } from './supervisor.js';
import { loadWindowState, trackWindowState } from './window-state.js';
import { startUpdater } from './updater.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const asset = name => path.join(here, '..', 'assets', name);
const splashDir = path.join(here, '..', 'splash');

let supervisor = null;
let mainWin = null;
let splashWin = null;
let tray = null;
let updater = null;
let updateState = { kind: 'idle' };
let quitting = false;

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]']);

/** @param {string} rawUrl 是否为本机 loopback 的 http(s)/ws(s) 地址。 */
function isLoopback(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return ['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol) && LOOPBACK_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

/** @param {string} url 只放行 http(s) 到系统默认浏览器。 */
function openExternal(url) {
  if (/^https?:/i.test(url)) void shell.openExternal(url);
}

/** @param {import('electron').BrowserWindow} win F12 切换开发者工具。 */
function wireDevtoolsToggle(win) {
  win.webContents.on('before-input-event', (_event, input) => {
    if (input.type === 'keyDown' && input.key === 'F12') win.webContents.toggleDevTools();
  });
}

/** 创建启动/状态页窗口（含日志流与重启按钮的唯一入口）。 */
function createSplash() {
  splashWin = new BrowserWindow({
    width: 620,
    height: 480,
    title: 'DSH Desktop',
    icon: asset('icon-256.png'),
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(splashDir, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });
  splashWin.on('closed', () => {
    splashWin = null;
  });
  wireDevtoolsToggle(splashWin);
  void splashWin.loadFile(path.join(splashDir, 'index.html'));
}

/**
 * 确保主窗口存在并导航到后端 URL；后端重启换端口后由 ready 事件再次调用跟随。
 * @param {string} url 后端就绪 URL。
 */
function ensureMainWindow(url) {
  const firstCreate = mainWin === null;
  if (firstCreate) {
    const stateDir = app.getPath('userData');
    const state = loadWindowState(stateDir);
    mainWin = new BrowserWindow({
      x: state.x,
      y: state.y,
      width: state.width,
      height: state.height,
      minWidth: 900,
      minHeight: 600,
      show: false,
      title: 'DSH Desktop',
      icon: asset('icon-256.png'),
      autoHideMenuBar: true,
      backgroundColor: '#0f172a',
      webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false },
    });
    if (state.maximized) mainWin.maximize();
    trackWindowState(mainWin, stateDir);
    wireDevtoolsToggle(mainWin);
    mainWin.webContents.setWindowOpenHandler(({ url: target }) => {
      if (isLoopback(target)) return { action: 'allow' };
      openExternal(target);
      return { action: 'deny' };
    });
    mainWin.webContents.on('will-navigate', (event, target) => {
      if (isLoopback(target)) return;
      event.preventDefault();
      openExternal(target);
    });
    mainWin.on('close', event => {
      if (quitting) return;
      event.preventDefault();
      mainWin.hide();
    });
    mainWin.on('closed', () => {
      mainWin = null;
    });
    mainWin.once('ready-to-show', () => {
      if (mainWin !== null) mainWin.show();
    });
  }
  void mainWin.loadURL(url);
  if (!firstCreate && !mainWin.isVisible()) mainWin.show();
  if (splashWin !== null) splashWin.hide();
}

/** 显示可用窗口：后端就绪显示主窗口，否则显示启动/状态页。 */
function showAnyWindow() {
  if (mainWin !== null && supervisor.url !== null) {
    mainWin.show();
    mainWin.focus();
    return;
  }
  if (splashWin === null) createSplash();
  else {
    splashWin.show();
    splashWin.focus();
  }
}

/** @returns {string} 托盘「检查更新」一项的当前文案。 */
function updateMenuLabel() {
  if (updateState.kind === 'checking') return '正在检查更新…';
  if (updateState.kind === 'available' || updateState.kind === 'downloading') {
    return `正在下载 ${updateState.version ?? ''}…`.trim();
  }
  if (updateState.kind === 'ready') return `安装更新 ${updateState.version} 并重启`;
  if (updateState.kind === 'error') return '检查更新失败（再试一次）';
  return '检查更新';
}

/** 按后端与更新状态重建托盘菜单。 */
function rebuildTray() {
  if (tray === null) return;
  const url = supervisor?.url ?? null;
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: '显示窗口', click: showAnyWindow },
      {
        label: '在浏览器中打开',
        enabled: url !== null,
        click: () => {
          if (supervisor.url !== null) openExternal(supervisor.url);
        },
      },
      {
        label: '复制访问地址',
        enabled: url !== null,
        click: () => {
          if (supervisor.url !== null) clipboard.writeText(supervisor.url);
        },
      },
      { type: 'separator' },
      { label: '重启后端', click: () => supervisor.restart() },
      {
        label: '查看后端日志',
        click: () => {
          void shell.openPath(path.join(app.getPath('userData'), 'logs'));
        },
      },
      {
        label: '编辑配置（重启壳后生效）',
        click: () => {
          void shell.openPath(configPath());
        },
      },
      { type: 'separator' },
      {
        label: updateMenuLabel(),
        enabled: updateState.kind !== 'checking' && updateState.kind !== 'downloading',
        click: () => {
          if (updateState.kind === 'ready') {
            quitting = true;
            updater.quitAndInstall();
            return;
          }
          void updater.check({ userInitiated: true });
        },
      },
      {
        label: '打开发布页',
        click: () => openExternal('https://github.com/shenzheyuan2020/dsh-desktop-shell/releases'),
      },
      { type: 'separator' },
      {
        label: '退出（结束后端）',
        click: () => {
          quitting = true;
          app.quit();
        },
      },
    ]),
  );
}

/** 建托盘：菜单项随后端状态与更新状态刷新。 */
function buildTray() {
  tray = new Tray(asset('icon-32.png'));
  tray.setToolTip('DSH Desktop');
  rebuildTray();
  supervisor.on('status', rebuildTray);
  tray.on('double-click', showAnyWindow);
}

/** 把 supervisor 事件接到窗口/托盘/控制台。 */
function wireSupervisor() {
  supervisor.on('log', line => {
    if (splashWin !== null && !splashWin.isDestroyed()) splashWin.webContents.send('backend-log', line);
  });
  supervisor.on('status', status => {
    if (splashWin !== null && !splashWin.isDestroyed()) splashWin.webContents.send('backend-status', status);
    if (status.state === 'failed') {
      console.log('[shell] backend failed');
      if (splashWin === null) createSplash();
      else splashWin.show();
    }
  });
  supervisor.on('ready', url => {
    console.log(`[shell] backend ready: ${url}`);
    ensureMainWindow(url);
  });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', showAnyWindow);
  app.on('window-all-closed', () => {
    /* 托盘常驻：窗口全关不退出应用 */
  });
  app.on('before-quit', () => {
    quitting = true;
    if (supervisor !== null) supervisor.stop();
  });
  void app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    const config = loadConfig();
    supervisor = new Supervisor(config, path.join(app.getPath('userData'), 'logs'));
    ipcMain.handle('restart-backend', () => supervisor.restart());
    ipcMain.handle('get-snapshot', () => supervisor.snapshot());
    updater = startUpdater({
      onState: next => {
        updateState = next;
        rebuildTray();
      },
    });
    updateState = updater.getState();
    wireSupervisor();
    buildTray();
    createSplash();
    supervisor.start();
  });
}
