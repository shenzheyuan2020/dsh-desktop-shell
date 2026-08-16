/** 主窗口位置/尺寸记忆：userData/window-state.json，移动/缩放去抖落盘。 */
import fs from 'node:fs';
import path from 'node:path';

const FILE_NAME = 'window-state.json';

/**
 * 读取上次窗口状态。
 * @param {string} dir userData 目录。
 * @returns {{x?: number, y?: number, width: number, height: number, maximized: boolean}} 恢复用状态；首次启动返回默认尺寸。
 */
export function loadWindowState(dir) {
  try {
    const state = JSON.parse(fs.readFileSync(path.join(dir, FILE_NAME), 'utf8'));
    if (typeof state.width === 'number' && typeof state.height === 'number') return state;
  } catch {
    /* 首次启动或文件损坏：使用默认窗口尺寸 */
  }
  return { width: 1280, height: 800, maximized: false };
}

/**
 * 跟踪窗口几何变化并持久化（最大化时保留最后的普通边界，恢复时先还原再最大化）。
 * @param {import('electron').BrowserWindow} win 被跟踪的窗口。
 * @param {string} dir userData 目录。
 */
export function trackWindowState(win, dir) {
  const file = path.join(dir, FILE_NAME);
  let normalBounds = win.getBounds();
  let timer = null;
  const persist = () => {
    fs.writeFile(file, JSON.stringify({ ...normalBounds, maximized: win.isMaximized() }), () => {});
  };
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(persist, 500);
  };
  const remember = () => {
    if (!win.isMaximized()) normalBounds = win.getBounds();
    schedule();
  };
  win.on('resize', remember);
  win.on('move', remember);
  win.on('maximize', schedule);
  win.on('unmaximize', schedule);
  win.on('close', () => {
    clearTimeout(timer);
    try {
      fs.writeFileSync(file, JSON.stringify({ ...normalBounds, maximized: win.isMaximized() }));
    } catch {
      /* 退出时磁盘不可写则放弃本次记忆 */
    }
  });
}
