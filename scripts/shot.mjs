// Dev-only: render the startup page offscreen with canned first-run data and save README screenshots.
// Usage: pnpm exec electron scripts/shot.mjs   → writes docs/screenshot-en.png and docs/screenshot-zh.png
// No window is shown; production code is untouched (the page talks to canned IPC handlers below).
import { app, BrowserWindow, ipcMain } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getLocale, setLocale, strings, t } from '../src/i18n.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'docs');
const shellVersion = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;

const cannedNode = {
  ok: true,
  version: 'v24.18.1',
  path: 'C:\\Program Files\\nodejs\\node.exe',
  npm: 'C:\\Program Files\\nodejs\\npm.cmd',
  home: 'C:\\Program Files\\nodejs',
  source: 'system',
  reason: '',
};
const cannedProbe = () => ({ node: { ...cannedNode }, harness: { kind: 'missing', detail: '', version: '' } });
const cannedIdentity = () => ({
  shellVersion,
  locale: getLocale(),
  node: { ...cannedNode },
  harness: { kind: 'missing', detail: '', version: '' },
  kindLabel: '',
});

ipcMain.handle('get-ui', () => ({ locale: getLocale(), strings: strings(), identity: cannedIdentity() }));
ipcMain.handle('get-identity', () => cannedIdentity());
ipcMain.handle('probe-environment', () => cannedProbe());
ipcMain.handle('get-snapshot', () => ({
  state: 'stopped',
  url: null,
  attempts: 0,
  lines: [`[12:00:00] ${t('missingLog')}`],
}));

function shoot(file) {
  return new Promise((resolve, reject) => {
    const win = new BrowserWindow({
      width: 720,
      height: 640,
      useContentSize: true,
      show: false,
      webPreferences: {
        offscreen: true,
        preload: path.join(root, 'splash', 'preload.cjs'),
        contextIsolation: true,
        sandbox: true,
        nodeIntegration: false,
      },
    });
    win.webContents.once('did-finish-load', () => {
      setTimeout(async () => {
        try {
          const image = await win.webContents.capturePage();
          fs.writeFileSync(path.join(outDir, file), image.toPNG());
          win.destroy();
          resolve();
        } catch (error) {
          reject(error);
        }
      }, 1200);
    });
    void win.loadFile(path.join(root, 'splash', 'index.html'));
  });
}

app.disableHardwareAcceleration();
app.on('window-all-closed', () => {
  /* 两张截图之间会短暂没有窗口：阻止 Electron 默认退出 */
});
void app.whenReady().then(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  setLocale('en');
  await shoot('screenshot-en.png');
  setLocale('zh');
  await shoot('screenshot-zh.png');
  console.log('screenshots written to docs/');
  app.quit();
});
