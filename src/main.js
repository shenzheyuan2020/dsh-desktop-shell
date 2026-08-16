/**
 * DSH Desktop 壳主进程：单实例、启动页、主窗口、托盘、外链策略与后端编排。
 * 主窗口以零注入方式承载 dsh web GUI（无 preload、sandbox 开启），只允许 loopback 导航。
 */
import { app, BrowserWindow, Menu, Tray, shell, ipcMain, clipboard, dialog } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadConfig,
  configPath,
  saveConfig,
  officialRuntimeBin,
  officialRuntimeDir,
  officialRuntimeLaunch,
  nodeDownloadUrl,
  isCheckout,
  SOURCE_LAUNCH_ARGS,
} from './config.js';
import { resolveLaunchFromDir } from './harness.js';
import { Supervisor } from './supervisor.js';
import { loadWindowState, trackWindowState } from './window-state.js';
import { startUpdater } from './updater.js';
import { augmentDarwinPath, launchEnvForNode, probeEnvironment } from './probe.js';
import { deployOfficial } from './deploy.js';
import { BUNDLED_NODE_VERSION, bundledNodeRoot, ensureBundledNode } from './bundled-node.js';
import { getLocale, setLocale, strings, t } from './i18n.js';

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
let deploying = false;

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

function currentProbe() {
  return probeEnvironment(supervisor?.config ?? loadConfig());
}

/**
 * 探测结果来自磁盘/环境、但 config 仍是默认的 `dsh` 时，把启动配置改成真正能拉起的那一份。
 * 用户已经写明 checkout 或绝对路径时不改。
 */
function applyDiscoveredLaunch(probe) {
  if (supervisor === null || probe.harness.kind === 'missing' || !probe.node.ok) return;
  const env = launchEnvForNode(probe.node);
  const config = supervisor.config;
  const pathReady = !probe.node.home || String(config.env?.PATH || '').includes(probe.node.home);

  if (config.cwd && isCheckout(config.cwd)) {
    const command = probe.node.source === 'bundled' ? probe.node.path : config.command;
    if (command !== config.command || !pathReady) {
      supervisor.config = saveConfig({ command, env: { ...(config.env || {}), ...env } });
    }
    return;
  }
  if (config.command && fs.existsSync(config.command)) {
    if (!pathReady) supervisor.config = saveConfig({ env: { ...(config.env || {}), ...env } });
    return;
  }
  if (probe.harness.kind === 'checkout') {
    supervisor.config = saveConfig({
      command: probe.node.source === 'bundled' ? probe.node.path : 'node',
      args: [...SOURCE_LAUNCH_ARGS],
      cwd: probe.harness.detail,
      shell: false,
      env,
    });
    return;
  }
  if (probe.harness.kind === 'runtime') {
    supervisor.config = saveConfig(officialRuntimeLaunch(probe.node));
    return;
  }
  if (probe.harness.kind === 'path') {
    supervisor.config = saveConfig({ command: probe.harness.detail, args: ['web'], cwd: '', env, shell: true });
  }
}

function startIfReady(probe) {
  if (probe.harness.kind === 'missing' || !probe.node.ok || supervisor === null) return false;
  applyDiscoveredLaunch(probe);
  if (supervisor.child !== null) supervisor.restart();
  else supervisor.start();
  return true;
}

function kindLabel(kind) {
  if (kind === 'checkout') return t('kindCheckout');
  if (kind === 'runtime') return t('kindRuntime');
  if (kind === 'path') return t('kindPath');
  return t('identityMissing');
}

function identity() {
  const probe = currentProbe();
  return {
    shellVersion: app.getVersion(),
    locale: getLocale(),
    node: probe.node,
    harness: probe.harness,
    kindLabel: kindLabel(probe.harness.kind),
  };
}

function shellTitle() {
  const probe = currentProbe();
  const shellVer = app.getVersion();
  if (probe.harness.kind !== 'missing' && probe.harness.version) {
    return `DSH Desktop ${shellVer} · Harness ${probe.harness.version}`;
  }
  if (probe.harness.kind !== 'missing') {
    return `DSH Desktop ${shellVer} · Harness`;
  }
  return `DSH Desktop ${shellVer}`;
}

function applyWindowTitle() {
  const title = shellTitle();
  if (mainWin !== null && !mainWin.isDestroyed()) mainWin.setTitle(title);
  if (splashWin !== null && !splashWin.isDestroyed()) splashWin.setTitle(title);
  if (tray !== null) tray.setToolTip(title);
}

function pushProbe() {
  const probe = currentProbe();
  applyWindowTitle();
  if (splashWin !== null && !splashWin.isDestroyed()) {
    splashWin.webContents.send('probe-updated', probe);
    splashWin.webContents.send('identity-updated', identity());
  }
  rebuildTray();
}

function parentWin() {
  if (splashWin !== null && !splashWin.isDestroyed() && splashWin.isVisible()) return splashWin;
  if (mainWin !== null && !mainWin.isDestroyed()) return mainWin;
  return undefined;
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
    width: 720,
    height: 640,
    title: shellTitle(),
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
  splashWin.on('close', event => {
    if (quitting) return;
    event.preventDefault();
    maybeHintCloseToTray();
    splashWin.hide();
  });
  splashWin.on('closed', () => {
    splashWin = null;
  });
  splashWin.on('focus', () => {
    const probe = currentProbe();
    pushProbe();
    if (supervisor !== null && supervisor.child === null && supervisor.state !== 'starting') {
      startIfReady(probe);
    }
  });
  wireDevtoolsToggle(splashWin);
  void splashWin.loadFile(path.join(splashDir, 'index.html'));
}

function showConsole() {
  if (splashWin === null) createSplash();
  else {
    splashWin.show();
    splashWin.focus();
  }
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
      title: shellTitle(),
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
    mainWin.on('page-title-updated', event => {
      event.preventDefault();
      mainWin.setTitle(shellTitle());
    });
    mainWin.on('close', event => {
      if (quitting) return;
      event.preventDefault();
      maybeHintCloseToTray();
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
  applyWindowTitle();
  if (!firstCreate && !mainWin.isVisible()) mainWin.show();
  if (splashWin !== null) splashWin.hide();
}

function maybeHintCloseToTray() {
  const config = loadConfig();
  if (config.closeToTrayHintShown === true) return;
  saveConfig({ closeToTrayHintShown: true });
  void dialog.showMessageBox(parentWin() ?? mainWin, {
    type: 'info',
    title: t('trayHintTitle'),
    message: t('trayHintTitle'),
    // darwin 的「托盘」实为菜单栏图标，文案单独一份。
    detail: t(process.platform === 'darwin' ? 'trayHintBodyMac' : 'trayHintBody'),
  });
}

/** 显示可用窗口：后端就绪显示主窗口，否则显示启动/状态页。 */
function showAnyWindow() {
  if (mainWin !== null && supervisor.url !== null) {
    mainWin.show();
    mainWin.focus();
    return;
  }
  showConsole();
}

/** @returns {string} 托盘「检查壳更新」一项的当前文案。 */
function updateMenuLabel() {
  if (updateState.kind === 'checking') return t('trayUpdating');
  if (updateState.kind === 'available' || updateState.kind === 'downloading') {
    return t('trayDownloading', { version: updateState.version ?? '' }).trim();
  }
  if (updateState.kind === 'ready') return t('trayInstall', { version: updateState.version });
  if (updateState.kind === 'error') return t('trayUpdateFailed');
  return t('trayUpdate');
}

function uiBundle() {
  return { locale: getLocale(), strings: strings(), identity: identity() };
}

function applyLocale(next) {
  setLocale(next);
  saveConfig({ locale: getLocale() });
  rebuildTray();
  applyWindowTitle();
  if (splashWin !== null && !splashWin.isDestroyed()) {
    splashWin.webContents.send('locale-changed', uiBundle());
  }
}

function hasOfficialRuntime() {
  return fs.existsSync(officialRuntimeBin());
}

/** 按后端与更新状态重建托盘菜单。 */
function rebuildTray() {
  if (tray === null) return;
  const url = supervisor?.url ?? null;
  const officialInstalled = hasOfficialRuntime();
  const probe = supervisor ? currentProbe() : null;
  const installHarness = officialInstalled
    ? {
        label: t('trayUpdateOfficial'),
        click: () => {
          showConsole();
          void confirmAndDeploy({ update: true });
        },
      }
    : !probe?.node.ok
      ? {
          label: t('trayInstallRuntime'),
          click: () => {
            showConsole();
            void confirmAndInstallRuntimeAndHarness();
          },
        }
      : {
          label: t('trayDeploy'),
          click: () => {
            showConsole();
            void confirmAndDeploy({ update: false });
          },
        };
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: t('trayShow'), click: showAnyWindow },
      { label: t('trayConsole'), click: showConsole },
      {
        label: t('trayBrowser'),
        enabled: url !== null,
        click: () => {
          if (supervisor.url !== null) openExternal(supervisor.url);
        },
      },
      {
        label: t('trayCopy'),
        enabled: url !== null,
        click: () => {
          if (supervisor.url !== null) clipboard.writeText(supervisor.url);
        },
      },
      { type: 'separator' },
      installHarness,
      ...(probe?.node.source === 'bundled'
        ? []
        : [
            {
              label: t('trayInstallBundledNode'),
              click: () => {
                showConsole();
                void confirmBundledNodeOnly();
              },
            },
          ]),
      { label: t('trayPick'), click: () => void pickHarnessFolder() },
      { label: t('trayRestart'), click: () => supervisor.restart() },
      {
        label: t('trayLogs'),
        click: () => {
          void shell.openPath(path.join(app.getPath('userData'), 'logs'));
        },
      },
      {
        label: t('trayConfig'),
        click: () => {
          void shell.openPath(configPath());
        },
      },
      {
        label: t('trayLanguage'),
        submenu: [
          { label: 'English', type: 'radio', checked: getLocale() === 'en', click: () => applyLocale('en') },
          { label: '中文', type: 'radio', checked: getLocale() === 'zh', click: () => applyLocale('zh') },
        ],
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
        label: t('trayReleases'),
        click: () => openExternal('https://github.com/shenzheyuan2020/dsh-desktop-shell/releases'),
      },
      { type: 'separator' },
      {
        label: t('trayQuit'),
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
  // darwin 的托盘位是菜单栏，32px 会过大，用 16px。
  tray = new Tray(asset(process.platform === 'darwin' ? 'icon-16.png' : 'icon-32.png'));
  applyWindowTitle();
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
      showConsole();
    }
    applyWindowTitle();
  });
  supervisor.on('ready', url => {
    console.log(`[shell] backend ready: ${url}`);
    ensureMainWindow(url);
    pushProbe();
  });
}

async function explainAndOpenNode() {
  const { response } = await dialog.showMessageBox(parentWin(), {
    type: 'info',
    title: t('nodeNeedTitle'),
    message: t('nodeNeedTitle'),
    detail: t('nodeNeedBody'),
    buttons: [t('nodeOpenDownload'), t('cancel')],
    defaultId: 0,
    cancelId: 1,
  });
  if (response === 0) openExternal(nodeDownloadUrl());
}

async function pickHarnessFolder() {
  const result = await dialog.showOpenDialog(parentWin(), {
    title: t('pickTitle'),
    properties: ['openDirectory'],
  });
  if (result.canceled || !result.filePaths[0]) return { ok: false, cancelled: true };
  const dir = result.filePaths[0];
  const launch = resolveLaunchFromDir(dir);
  if (launch === null) {
    await dialog.showMessageBox(parentWin(), {
      type: 'error',
      title: t('pickTitle'),
      message: t('pickInvalid'),
    });
    return { ok: false, error: t('pickInvalid') };
  }
  const config = saveConfig({ ...launch, env: launchEnvForNode(currentProbe().node) });
  supervisor.config = config;
  supervisor.attempts = 0;
  const probe = currentProbe();
  startIfReady(probe);
  pushProbe();
  return { ok: true, detail: launch.cwd || launch.command, needsNode: !probe.node.ok };
}

async function confirmAndDeploy({ update = false } = {}) {
  if (deploying) return { ok: false, error: t('deployingWait') };
  const probe = currentProbe();
  const current = `${supervisor.config.command} ${(supervisor.config.args || []).join(' ')}`.trim();
  const overwrite =
    !update &&
    probe.harness.kind !== 'missing' &&
    probe.harness.kind !== 'runtime';
  const { response } = await dialog.showMessageBox(parentWin(), {
    type: 'question',
    title: update ? t('updateConfirmTitle') : t('deployConfirmTitle'),
    message: update ? t('updateConfirmTitle') : t('deployConfirmTitle'),
    detail: `${update ? t('updateConfirmBody') : t('deployConfirmBody', { dir: officialRuntimeDir() })}${
      overwrite ? `\n\n${t('deployOverwrite', { current })}` : ''
    }`,
    buttons: [update ? t('updateConfirm') : t('deployConfirm'), t('cancel')],
    defaultId: 0,
    cancelId: 1,
  });
  if (response !== 0) return { ok: false, cancelled: true };
  return runOfficialDeploy();
}

function onInstallLog(line) {
  if (supervisor !== null) supervisor.log(line);
}

async function runOfficialDeployUnlocked() {
  const result = await deployOfficial({ onLog: onInstallLog });
  if (result.ok) {
    supervisor.config = result.config;
    supervisor.attempts = 0;
    if (supervisor.child !== null) supervisor.restart();
    else supervisor.start();
    pushProbe();
  }
  return result;
}

/** 从 npm 安装官方 @deepseek-ai/dsh 到本应用目录，成功后按新配置拉起后端。 */
async function runOfficialDeploy() {
  if (deploying) return { ok: false, error: t('deployingWait') };
  deploying = true;
  showConsole();
  try {
    return await runOfficialDeployUnlocked();
  } finally {
    deploying = false;
  }
}

async function confirmAndInstallRuntimeAndHarness() {
  if (deploying) return { ok: false, error: t('deployingWait') };
  const { response } = await dialog.showMessageBox(parentWin(), {
    type: 'question',
    title: t('runtimeConfirmTitle'),
    message: t('runtimeConfirmTitle'),
    detail: t('runtimeConfirmBody', {
      version: BUNDLED_NODE_VERSION,
      nodeDir: bundledNodeRoot(),
      harnessDir: officialRuntimeDir(),
    }),
    buttons: [t('deployConfirm'), t('cancel')],
    defaultId: 0,
    cancelId: 1,
  });
  if (response !== 0) return { ok: false, cancelled: true };
  deploying = true;
  showConsole();
  try {
    const nodeResult = await ensureBundledNode({ onLog: onInstallLog });
    if (!nodeResult.ok) return nodeResult;
    pushProbe();
    return await runOfficialDeployUnlocked();
  } finally {
    deploying = false;
  }
}

async function confirmBundledNodeOnly() {
  if (deploying) return { ok: false, error: t('deployingWait') };
  const { response } = await dialog.showMessageBox(parentWin(), {
    type: 'question',
    title: t('bundledConfirmTitle'),
    message: t('bundledConfirmTitle'),
    detail: t('bundledConfirmBody', { version: BUNDLED_NODE_VERSION, nodeDir: bundledNodeRoot() }),
    buttons: [t('deployConfirm'), t('cancel')],
    defaultId: 0,
    cancelId: 1,
  });
  if (response !== 0) return { ok: false, cancelled: true };
  deploying = true;
  showConsole();
  try {
    const nodeResult = await ensureBundledNode({ onLog: onInstallLog });
    pushProbe();
    return nodeResult;
  } finally {
    deploying = false;
  }
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', showAnyWindow);
  // mac 点 Dock 图标时重新示窗；supervisor 尚未初始化的极早期点击忽略。
  app.on('activate', () => {
    if (supervisor !== null) showAnyWindow();
  });
  app.on('window-all-closed', () => {
    /* 托盘常驻：窗口全关不退出应用 */
  });
  app.on('before-quit', () => {
    quitting = true;
    if (supervisor !== null) supervisor.stop();
  });
  void app.whenReady().then(() => {
    augmentDarwinPath();
    // darwin 置空应用菜单会连 Cmd+C/V/Q 一起废掉，保留系统三件套；其他平台不要菜单。
    if (process.platform === 'darwin') {
      Menu.setApplicationMenu(
        Menu.buildFromTemplate([{ role: 'appMenu' }, { role: 'editMenu' }, { role: 'windowMenu' }]),
      );
    } else {
      Menu.setApplicationMenu(null);
    }
    const config = loadConfig();
    setLocale(config.locale);
    supervisor = new Supervisor(config, path.join(app.getPath('userData'), 'logs'));
    ipcMain.handle('restart-backend', () => supervisor.restart());
    ipcMain.handle('get-snapshot', () => supervisor.snapshot());
    ipcMain.handle('probe-environment', () => currentProbe());
    ipcMain.handle('deploy-official', () => confirmAndDeploy({ update: hasOfficialRuntime() }));
    ipcMain.handle('install-runtime-and-harness', () => confirmAndInstallRuntimeAndHarness());
    ipcMain.handle('install-bundled-node', () => confirmBundledNodeOnly());
    ipcMain.handle('pick-harness', () => pickHarnessFolder());
    ipcMain.handle('open-nodejs', () => explainAndOpenNode());
    ipcMain.handle('open-config', () => {
      void shell.openPath(configPath());
    });
    ipcMain.handle('get-ui', () => uiBundle());
    ipcMain.handle('get-identity', () => identity());
    ipcMain.handle('set-locale', (_event, next) => {
      applyLocale(next);
      return uiBundle();
    });
    ipcMain.handle('reprobe-and-start', () => {
      supervisor.config = loadConfig();
      const next = currentProbe();
      startIfReady(next);
      pushProbe();
      return next;
    });
    updater = startUpdater({
      onState: next => {
        updateState = next;
        rebuildTray();
      },
      onBeforeInstall: () => {
        quitting = true;
      },
    });
    updateState = updater.getState();
    wireSupervisor();
    buildTray();
    createSplash();
    const probe = currentProbe();
    if (probe.harness.kind === 'missing') {
      supervisor.log(t('missingLog'));
    } else if (!probe.node.ok) {
      supervisor.log(t('needNode'));
    } else {
      applyDiscoveredLaunch(probe);
      supervisor.start();
    }
    applyWindowTitle();
  });
}
