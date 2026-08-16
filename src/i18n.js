/** Shell UI language. Default English; `zh` is Simplified Chinese. Official dsh web UI is unchanged. */

export const LOCALES = ['en', 'zh'];

/** @type {'en' | 'zh'} */
let locale = 'en';

const en = {
  langName: 'English',
  langOther: '中文',
  subtitle: 'Desktop shell for official DeepSeek Harness',
  detecting: 'Checking this machine…',
  setupTitle: 'Official DeepSeek Harness was not found',
  setupBody:
    'This shell does not bundle official source. If Node.js is installed, you can install the official npm package @deepseek-ai/dsh into this app folder and then open the official UI.',
  deploy: 'Install official DSH',
  reprobe: 'Check again',
  installNode: 'Install Node.js',
  editConfig: 'I already installed it — set the path',
  restart: 'Restart backend',
  hint: 'Install needs network · Enter the API key in the official UI · F12 for DevTools',
  starting: 'Starting backend…',
  ready: 'Backend ready: {url}. Opening the official UI…',
  restarting: 'Backend exited. Restarting in {sec}s (attempt {n})…',
  failed: 'Startup failed repeatedly. Check the log, then click Restart backend.',
  stopped: 'Backend stopped.',
  needNode: 'Install a supported Node.js first, then you can deploy official DSH.',
  nodeOkDeploy: 'Node {version} found. Install official DSH downloads the npm package (needs network, about 1–2 minutes).',
  missingHarness: 'Official Harness not found. You can install it here.',
  foundHarness: 'Found: {kind} · {detail}',
  reprobing: 'Checking this machine again…',
  foundStarting: 'Official Harness found. Starting…',
  deploying: 'Installing official @deepseek-ai/dsh from npm…',
  deployed: 'Official package installed. Starting…',
  deployFailed: 'Install failed: {error}',
  trayShow: 'Show window',
  trayBrowser: 'Open in browser',
  trayCopy: 'Copy address',
  trayDeploy: 'Install official DSH',
  trayRestart: 'Restart backend',
  trayLogs: 'Open backend logs',
  trayConfig: 'Edit config (restart shell to apply)',
  trayLanguage: 'Language',
  trayUpdate: 'Check for updates',
  trayUpdating: 'Checking for updates…',
  trayDownloading: 'Downloading {version}…',
  trayInstall: 'Install {version} and restart',
  trayUpdateFailed: 'Update check failed (try again)',
  trayReleases: 'Open releases page',
  trayQuit: 'Quit (stop backend)',
  nodeMissing: 'System Node.js not found. Install Node.js 22.19+ or 24+ (not the runtime bundled in Electron).',
  npmMissing: 'node was found, but npm was not. Reinstall the official Node.js installer.',
  nodeOld: 'Node is {version}. Official DSH requires 22.19+ or 24+.',
  nodeUnknown: 'unknown version',
  missingLog: 'Official DeepSeek Harness was not found. Use Install official DSH on the startup page.',
  deployingWait: 'Install already in progress. Please wait.',
  deployTo: 'Installing official package {pkg} into:',
  deployCmd: '$ npm install --prefix <runtime> {pkg}',
  deployNpmFail: 'npm exited with code {code}. Check the network / npm registry, or run npm install -g {pkg} yourself.',
  deployWrote: 'Wrote launch config: {bin}',
  spawnFail: 'Failed to start: {error}',
  procError: 'Process error: {error}',
  procExit: 'Backend exited (code={code} signal={signal})',
  autoRestart: 'Restarting in {sec}s (attempt {n}/{max})',
  configBadTitle: 'DSH Desktop config is invalid',
  configBadBody: '{file}\n\n{error}\n\nThis launch uses built-in defaults. Fix the file and restart the shell.',
  updateDevTitle: 'Updates are not checked in this run mode',
  updateDevDetail:
    'Auto-update only works for the DSH-Desktop-Setup installer. Download Setup from GitHub Releases. Dev mode and the win-unpacked folder will not upgrade.',
  updateBusy: 'Already checking or downloading an update. Please wait.',
  updateLatest: 'You are on the latest version {version}',
  updateFound: 'Update {version} is available',
  updateFoundDetail: 'Downloading in the background. You will be asked to restart when it finishes, or install later from the tray.',
  updateFailTitle: 'Could not check for updates',
  updateFailBody: 'Could not reach GitHub Releases.',
  updateNotifyTitle: 'DSH Desktop update available',
  updateNotifyBody: '{version} is downloading. Install it from the tray when it finishes.',
  updateReadyTitle: 'Update ready',
  updateReadyBody: 'DSH Desktop {version} has been downloaded.',
  updateReadyDetail: 'Restart now to install, or choose Install and restart later from the tray. The backend will stop with the shell.',
  updateNow: 'Restart and install',
  updateLater: 'Later',
};

const zh = {
  langName: '中文',
  langOther: 'English',
  subtitle: 'DeepSeek Harness 桌面壳 · 壳核分离',
  detecting: '正在检测本机环境…',
  setupTitle: '还没有官方 DeepSeek Harness',
  setupBody:
    '本壳不内嵌官方源码。只要本机有合格的 Node.js，就可以从 npm 安装官方包 @deepseek-ai/dsh，装到本应用目录，然后打开官方原版界面。',
  deploy: '部署官方 DSH',
  reprobe: '重新检测',
  installNode: '安装 Node.js',
  editConfig: '我已安装，填写路径',
  restart: '重启后端',
  hint: '部署需要网络 · API Key 在官方界面里填写 · F12 开发者工具',
  starting: '正在启动后端…',
  ready: '后端已就绪：{url}，正在打开主界面…',
  restarting: '后端已退出，{sec}s 后自动重启（第 {n} 次）…',
  failed: '连续启动失败——请检查下方日志，修复后点击「重启后端」。',
  stopped: '后端已停止。',
  needNode: '需要先安装合格的 Node.js，才能部署官方 DSH。',
  nodeOkDeploy: '检测到 Node {version}。点「部署官方 DSH」将从 npm 安装官方包（需要网络，大约一两分钟）。',
  missingHarness: '未检测到官方 Harness，可以一键部署。',
  foundHarness: '已找到：{kind} · {detail}',
  reprobing: '正在重新检测本机…',
  foundStarting: '已检测到官方 Harness，正在启动…',
  deploying: '正在从 npm 安装官方 @deepseek-ai/dsh…',
  deployed: '官方包已部署，正在启动…',
  deployFailed: '部署失败：{error}',
  trayShow: '显示窗口',
  trayBrowser: '在浏览器中打开',
  trayCopy: '复制访问地址',
  trayDeploy: '部署官方 DSH',
  trayRestart: '重启后端',
  trayLogs: '查看后端日志',
  trayConfig: '编辑配置（重启壳后生效）',
  trayLanguage: '语言 / Language',
  trayUpdate: '检查更新',
  trayUpdating: '正在检查更新…',
  trayDownloading: '正在下载 {version}…',
  trayInstall: '安装更新 {version} 并重启',
  trayUpdateFailed: '检查更新失败（再试一次）',
  trayReleases: '打开发布页',
  trayQuit: '退出（结束后端）',
  nodeMissing: '未找到系统 Node.js。请先安装 Node.js 22.19 或 24 以上（不要只用 Electron 自带的运行时）。',
  npmMissing: '找到了 node，但没有 npm。请重装官方 Node.js 安装包。',
  nodeOld: '当前 Node 是 {version}，官方 DSH 需要 22.19+ 或 24+。',
  nodeUnknown: '未知版本',
  missingLog: '未检测到官方 DeepSeek Harness。可在启动页点击「部署官方 DSH」。',
  deployingWait: '正在部署，请稍候。',
  deployTo: '将安装官方包 {pkg} 到：',
  deployCmd: '$ npm install --prefix <runtime> {pkg}',
  deployNpmFail: 'npm 退出码 {code}。请检查网络 / npm 源，或本机先手动执行 npm install -g {pkg}。',
  deployWrote: '已写入启动配置：{bin}',
  spawnFail: '启动失败：{error}',
  procError: '进程错误：{error}',
  procExit: '后端进程退出（code={code} signal={signal}）',
  autoRestart: '{sec}s 后自动重启（第 {n}/{max} 次）',
  configBadTitle: 'DSH Desktop 配置无效',
  configBadBody: '{file}\n\n{error}\n\n本次启动使用内置默认配置；修复该文件后重启壳生效。',
  updateDevTitle: '当前运行方式不检查更新',
  updateDevDetail:
    '自动更新只对「DSH-Desktop-Setup」安装版生效。请从 GitHub Releases 下载 Setup 安装；开发模式和 win-unpacked 免安装目录不会自动升级。',
  updateBusy: '正在检查或下载更新，请稍候。',
  updateLatest: '已是最新版本 {version}',
  updateFound: '发现新版本 {version}',
  updateFoundDetail: '正在后台下载，完成后会提示重启安装；也可稍后从托盘安装。',
  updateFailTitle: '检查更新失败',
  updateFailBody: '无法联系 GitHub Releases。',
  updateNotifyTitle: 'DSH Desktop 有新版本',
  updateNotifyBody: '{version} 正在后台下载。完成后可从托盘安装。',
  updateReadyTitle: '更新已就绪',
  updateReadyBody: 'DSH Desktop {version} 已下载完成。',
  updateReadyDetail: '现在重启安装，或稍后从托盘选择「安装更新并重启」。后端会随壳一起退出。',
  updateNow: '现在重启安装',
  updateLater: '稍后',
};

const TABLES = { en, zh };

/**
 * @param {'en' | 'zh' | string | undefined} next
 * @returns {'en' | 'zh'}
 */
export function normalizeLocale(next) {
  return next === 'zh' ? 'zh' : 'en';
}

/** @returns {'en' | 'zh'} */
export function getLocale() {
  return locale;
}

/** @param {'en' | 'zh' | string} next */
export function setLocale(next) {
  locale = normalizeLocale(next);
}

/** @returns {typeof en} */
export function strings() {
  return TABLES[locale];
}

/**
 * @param {keyof typeof en} key
 * @param {Record<string, string | number | undefined>} [vars]
 * @returns {string}
 */
export function t(key, vars = {}) {
  let text = TABLES[locale][key] ?? TABLES.en[key] ?? String(key);
  for (const [name, value] of Object.entries(vars)) {
    text = text.replaceAll(`{${name}}`, String(value ?? ''));
  }
  return text;
}
