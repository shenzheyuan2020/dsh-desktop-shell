/** Shell UI language. First run follows the OS; `zh` is Simplified Chinese. Official dsh web UI is unchanged. */

export const LOCALES = ['en', 'zh'];

/** @type {'en' | 'zh'} */
let locale = 'en';

const en = {
  langName: 'English',
  langOther: '中文',
  subtitle: 'Official DeepSeek Harness in a desktop window',
  detecting: 'Checking this machine…',
  setupTitle: 'DeepSeek Harness is not on this PC yet',
  setupBody:
    'This window does not include Harness. If this PC already has Node.js 22.19+ or 24+, install the official npm package. If not, you can download an app-local official Node+npm into this app folder (not the system PATH), then install Harness.',
  setupKey: 'After it opens, enter the API key in the official UI: Settings → Models. This shell never stores the key.',
  setupLang: 'English / 中文 here is for the shell only. The official UI has its own language setting.',
  deploy: 'Install official Harness',
  deployUpdate: 'Update official Harness',
  installRuntime: 'Install runtime and official Harness',
  installBundledNode: 'Install app-local Node only',
  reprobe: 'Check again',
  installNode: 'Install system Node.js from nodejs.org',
  pickFolder: 'Choose Harness folder…',
  editConfig: 'Edit config.json',
  restart: 'Restart backend',
  advanced: 'Advanced',
  hint: 'Install needs network · API key is in the official UI · F12 for DevTools',
  logLabel: 'Log',
  starting: 'Starting backend…',
  ready: 'Backend ready: {url}. Opening the official UI…',
  restarting: 'Backend exited. Restarting in {sec}s (attempt {n})…',
  failed: 'Startup failed repeatedly. Check the log, then use Advanced → Restart backend.',
  stopped: 'Backend stopped.',
  needNode: 'No usable Node.js 22.19+ or 24. Use Install runtime and official Harness, or Advanced to install app-local Node only / system Node from nodejs.org.',
  nodeOkDeploy: 'Node {version} ({source}) found. Install official Harness downloads @deepseek-ai/dsh (needs network, about 1–2 minutes).',
  missingHarness: 'Official Harness not found. Install it here, or choose a folder you already have.',
  foundHarness: 'Found: {kind} {version} · {detail}',
  reprobing: 'Checking this machine again…',
  foundStarting: 'Official Harness found. Starting…',
  deploying: 'Installing official @deepseek-ai/dsh from npm…',
  deployed: 'Official package installed. Starting…',
  deployFailed: 'Install failed: {error}',
  deployCancelled: 'Install cancelled.',
  identityShell: 'Shell {version}',
  identityHarness: 'Harness {version} ({kind})',
  identityMissing: 'Harness not installed',
  identityNode: 'Node {version} ({source})',
  nodeSourceSystem: 'system',
  nodeSourceBundled: 'app-local',
  kindCheckout: 'source checkout',
  kindRuntime: 'official npm package',
  kindPath: 'dsh on PATH',
  pickTitle: 'Choose a DeepSeek Harness folder',
  pickInvalid:
    'That folder is not a Harness checkout or an installed dsh.\n\nUse a git clone that contains apps/cli/src/bin.ts, or a folder that contains the dsh launcher (dsh.cmd on Windows, dsh on macOS), directly or under node_modules/.bin.',
  pickOk: 'Using {detail}. Starting…',
  nodeNeedTitle: 'Install system Node.js from nodejs.org?',
  nodeNeedBody:
    'This opens the official download page. Official Harness will not run on Node 18 or 20. The big LTS button is often 20 — choose 22.19+ or 24.\n\nMost people should use Install runtime and official Harness instead: that downloads Node only for this app and does not change the system PATH.',
  nodeOpenDownload: 'Open Node.js download',
  runtimeConfirmTitle: 'Install app-local Node and official Harness?',
  runtimeConfirmBody:
    'This downloads the official Node.js {version} archive for this platform into:\n{nodeDir}\n\nIt does not add Node to the system PATH.\nThen it installs @deepseek-ai/dsh into:\n{harnessDir}\n\nNeeds network. API key is entered later in the official UI (Settings → Models).',
  bundledConfirmTitle: 'Install app-local Node only?',
  bundledConfirmBody:
    'This downloads official Node.js {version} into:\n{nodeDir}\n\nIt does not add Node to the system PATH and does not install Harness. Use Install official Harness afterwards if you want the official UI.',
  bundledDownloading: 'Downloading official Node.js {version}…',
  bundledProgress: 'Node download {pct}% ({mb} / {totalMb} MB)',
  bundledAlready: 'App-local Node already present: {home}',
  bundledVerified: 'Node archive SHA-256 matches the official checksum.',
  bundledExtracting: 'Extracting Node archive…',
  bundledReady: 'App-local Node is ready: {home}',
  bundledDownloadFail: 'Could not download official Node.js. {error}',
  bundledSumFail: 'Could not download SHASUMS256.txt to verify the Node archive.',
  bundledHashFail: 'Node archive SHA-256 did not match. The file was discarded.',
  bundledExtractFail: 'Could not extract the Node archive: {error}',
  bundledMissingExe: 'The Node archive extracted, but node / npm were not found.',
  bundledUnsupported: 'App-local Node is not offered on this platform.',
  installingRuntime: 'Installing app-local Node, then official Harness…',
  installingBundled: 'Installing app-local Node…',
  bundledInstalled: 'App-local Node is ready.',
  deployConfirmTitle: 'Install official Harness from npm?',
  deployConfirmBody:
    'This downloads @deepseek-ai/dsh into:\n{dir}\n\nNeeds network. If the default npm registry fails, the shell retries with a China mirror.\nLaunch config will point at that package.\nEnter the API key later in the official UI (Settings → Models).',
  deployOverwrite: 'Your current launch path will be replaced:\n{current}\n\nYou can switch back with Choose Harness folder.',
  updateConfirmTitle: 'Update official Harness?',
  updateConfirmBody:
    'This installs the latest @deepseek-ai/dsh from npm into the app folder. It does not update this desktop shell. Use Check for shell updates for the shell.',
  deployConfirm: 'Install',
  updateConfirm: 'Update',
  cancel: 'Cancel',
  deployRegistry: 'Using npm registry: {registry}',
  deployRegistryDefault: 'Using the default npm registry',
  deployRetryMirror: 'Default registry failed. Retrying with npmmirror…',
  deployVersion: 'Installed official Harness {version}',
  trayShow: 'Show window',
  trayConsole: 'Backend console',
  trayBrowser: 'Open in browser',
  trayCopy: 'Copy address',
  trayDeploy: 'Install official Harness',
  trayInstallRuntime: 'Install runtime and official Harness',
  trayInstallBundledNode: 'Install app-local Node only',
  trayUpdateOfficial: 'Update official Harness',
  trayPick: 'Choose Harness folder…',
  trayRestart: 'Restart backend',
  trayLogs: 'Open backend logs',
  trayConfig: 'Edit config.json',
  trayLanguage: 'Language',
  trayUpdate: 'Check for shell updates',
  trayUpdating: 'Checking for shell updates…',
  trayDownloading: 'Downloading shell {version}…',
  trayInstall: 'Install shell {version} and restart',
  trayUpdateFailed: 'Shell update check failed (try again)',
  trayReleases: 'Open shell releases page',
  trayQuit: 'Quit (stop backend)',
  trayHintTitle: 'Still running in the tray',
  trayHintBody:
    'Closing the window hides DSH Desktop. The backend keeps running.\n\nTo quit, right-click the cyan >_ tray icon and choose Quit (stop backend).',
  trayHintBodyMac:
    'Closing the window hides DSH Desktop. The backend keeps running.\n\nTo quit, click the cyan >_ menu bar icon and choose Quit (stop backend).',
  nodeMissing: 'No system Node.js. Use Install runtime and official Harness for an app-local official Node, or install Node 22.19+ / 24 from nodejs.org (not Electron’s Node, and not Node 20).',
  npmMissing: 'node was found, but npm was not. Reinstall the official Node.js installer.',
  nodeOld: 'Node is {version}. Official Harness requires 22.19+ or 24+, not 18 or 20.',
  nodeUnknown: 'unknown version',
  missingLog: 'Official DeepSeek Harness was not found. Use Install runtime and official Harness, Install official Harness, or Choose Harness folder.',
  deployingWait: 'Install already in progress. Please wait.',
  deployTo: 'Installing official package {pkg} into:',
  deployCmd: '$ npm install --prefix <runtime> {pkg}',
  deployNpmFail:
    'npm exited with code {code}. Check the network. The shell already retried a China mirror. You can set npmRegistry in config.json, or install {pkg} yourself and Choose Harness folder.',
  deployWrote: 'Wrote launch config: {bin}',
  spawnFail: 'Failed to start: {error}',
  procError: 'Process error: {error}',
  procExit: 'Backend exited (code={code} signal={signal})',
  autoRestart: 'Restarting in {sec}s (attempt {n}/{max})',
  configBadTitle: 'DSH Desktop config is invalid',
  configBadBody: '{file}\n\n{error}\n\nThis launch uses built-in defaults. Fix the file and restart the shell.',
  updateDevTitle: 'Shell updates are not checked in this run mode',
  updateDevDetail:
    'Auto-update only works for the DSH-Desktop-Setup installer. Download Setup from GitHub Releases. Dev mode and the win-unpacked folder will not upgrade.\n\nUpdating official Harness is a separate tray action.',
  updateMacTitle: 'Auto-update is not available on macOS',
  updateMacDetail:
    'The macOS build is unsigned, so in-app updates cannot be applied. Download the new .dmg from GitHub Releases and replace the app.\n\nUpdating official Harness is a separate tray action.',
  updateMacOpenReleases: 'Open Releases',
  updateBusy: 'Already checking or downloading a shell update. Please wait.',
  updateLatest: 'This shell is the latest version {version}',
  updateFound: 'Shell update {version} is available',
  updateFoundDetail: 'Downloading in the background. You will be asked to restart when it finishes, or install later from the tray. Official Harness is not part of this update.',
  updateFailTitle: 'Could not check for shell updates',
  updateFailBody: 'Could not reach GitHub Releases.',
  updateNotifyTitle: 'DSH Desktop shell update available',
  updateNotifyBody: 'Shell {version} is downloading. Install it from the tray when it finishes.',
  updateReadyTitle: 'Shell update ready',
  updateReadyBody: 'DSH Desktop {version} has been downloaded.',
  updateReadyDetail: 'Restart now to install the shell, or choose Install shell and restart later from the tray. The backend will stop with the shell. Official Harness on disk is not replaced.',
  updateNow: 'Restart and install',
  updateLater: 'Later',
};

const zh = {
  langName: '中文',
  langOther: 'English',
  subtitle: '把官方 DeepSeek Harness 放进桌面窗口',
  detecting: '正在检测本机环境…',
  setupTitle: '这台电脑上还没有 DeepSeek Harness',
  setupBody:
    '这个窗口不内嵌 Harness。本机已有 Node.js 22.19+ 或 24+ 时，直接安装官方 npm 包。没有的话，可以先把官方便携 Node+npm 下到本应用目录（不写入系统 PATH），再安装 Harness。',
  setupKey: '打开之后，请在官方界面的「设置 → 模型」里填写 API Key。本壳不会保存密钥。',
  setupLang: '这里的 English / 中文只改壳。官方界面有自己的语言设置。',
  deploy: '安装官方 Harness',
  deployUpdate: '更新官方 Harness',
  installRuntime: '安装运行时和官方 Harness',
  installBundledNode: '只安装本应用 Node',
  reprobe: '重新检测',
  installNode: '从 nodejs.org 安装系统 Node.js',
  pickFolder: '选择已有的 Harness 文件夹…',
  editConfig: '编辑 config.json',
  restart: '重启后端',
  advanced: '高级',
  hint: '安装需要网络 · API Key 在官方界面填写 · F12 开发者工具',
  logLabel: '日志',
  starting: '正在启动后端…',
  ready: '后端已就绪：{url}，正在打开主界面…',
  restarting: '后端已退出，{sec}s 后自动重启（第 {n} 次）…',
  failed: '连续启动失败——请查看日志，然后在「高级」里点「重启后端」。',
  stopped: '后端已停止。',
  needNode: '没有可用的 Node.js 22.19+ 或 24。请点「安装运行时和官方 Harness」，或在高级里只装本应用 Node / 从官网装系统 Node。',
  nodeOkDeploy: '检测到 Node {version}（{source}）。点「安装官方 Harness」将下载 @deepseek-ai/dsh（需要网络，大约一两分钟）。',
  missingHarness: '未检测到官方 Harness。可以在这里安装，或选择你已经有的文件夹。',
  foundHarness: '已找到：{kind} {version} · {detail}',
  reprobing: '正在重新检测本机…',
  foundStarting: '已检测到官方 Harness，正在启动…',
  deploying: '正在从 npm 安装官方 @deepseek-ai/dsh…',
  deployed: '官方包已安装，正在启动…',
  deployFailed: '安装失败：{error}',
  deployCancelled: '已取消安装。',
  identityShell: '壳 {version}',
  identityHarness: 'Harness {version}（{kind}）',
  identityMissing: '尚未安装 Harness',
  identityNode: 'Node {version}（{source}）',
  nodeSourceSystem: '系统',
  nodeSourceBundled: '本应用',
  kindCheckout: '源码仓库',
  kindRuntime: '官方 npm 包',
  kindPath: 'PATH 上的 dsh',
  pickTitle: '选择 DeepSeek Harness 文件夹',
  pickInvalid:
    '这个文件夹不是 Harness 源码仓库，也不是已安装的 dsh。\n\n请选带有 apps/cli/src/bin.ts 的 git 克隆，或含 dsh 启动器（Windows 是 dsh.cmd，macOS 是 dsh；可在 node_modules/.bin 下）的目录。',
  pickOk: '将使用 {detail}，正在启动…',
  nodeNeedTitle: '要从 nodejs.org 安装系统 Node.js 吗？',
  nodeNeedBody:
    '这会打开官方下载页。官方 Harness 不能跑在 Node 18 或 20 上。最大的 LTS 按钮经常是 20，请选 22.19+ 或 24。\n\n多数人应改用「安装运行时和官方 Harness」：只给本应用下载 Node，不改系统 PATH。',
  nodeOpenDownload: '打开 Node.js 下载页',
  runtimeConfirmTitle: '要安装本应用 Node 和官方 Harness 吗？',
  runtimeConfirmBody:
    '将下载本平台的官方 Node.js {version} 压缩包到：\n{nodeDir}\n\n不会写入系统 PATH。\n然后把 @deepseek-ai/dsh 装到：\n{harnessDir}\n\n需要网络。API Key 之后在官方界面的「设置 → 模型」里填写。',
  bundledConfirmTitle: '只安装本应用 Node 吗？',
  bundledConfirmBody:
    '将下载官方 Node.js {version} 到：\n{nodeDir}\n\n不写入系统 PATH，也不安装 Harness。之后如需官方界面，再点「安装官方 Harness」。',
  bundledDownloading: '正在下载官方 Node.js {version}…',
  bundledProgress: 'Node 下载 {pct}%（{mb} / {totalMb} MB）',
  bundledAlready: '本应用 Node 已存在：{home}',
  bundledVerified: 'Node 压缩包 SHA-256 与官方校验和一致。',
  bundledExtracting: '正在解压 Node…',
  bundledReady: '本应用 Node 已就绪：{home}',
  bundledDownloadFail: '无法下载官方 Node.js。{error}',
  bundledSumFail: '无法下载 SHASUMS256.txt，不能校验 Node 压缩包。',
  bundledHashFail: 'Node 压缩包 SHA-256 不一致，已丢弃该文件。',
  bundledExtractFail: '无法解压 Node 压缩包：{error}',
  bundledMissingExe: '压缩包已解开，但没有找到 node / npm。',
  bundledUnsupported: '本应用 Node 在此平台上不提供。',
  installingRuntime: '正在安装本应用 Node，然后安装官方 Harness…',
  installingBundled: '正在安装本应用 Node…',
  bundledInstalled: '本应用 Node 已就绪。',
  deployConfirmTitle: '要从 npm 安装官方 Harness 吗？',
  deployConfirmBody:
    '将把 @deepseek-ai/dsh 下载到：\n{dir}\n\n需要网络。默认 npm 源失败时，壳会改用国内镜像再试一次。\n启动配置会改成使用这个包。\nAPI Key 之后在官方界面的「设置 → 模型」里填写。',
  deployOverwrite: '当前启动路径会被替换：\n{current}\n\n以后可以用「选择已有的 Harness 文件夹」切回去。',
  updateConfirmTitle: '要更新官方 Harness 吗？',
  updateConfirmBody: '这会把最新的 @deepseek-ai/dsh 装进本应用目录。不会更新这个桌面壳。更新壳请用「检查壳更新」。',
  deployConfirm: '安装',
  updateConfirm: '更新',
  cancel: '取消',
  deployRegistry: '使用 npm 源：{registry}',
  deployRegistryDefault: '使用默认 npm 源',
  deployRetryMirror: '默认源失败，改用 npmmirror 重试…',
  deployVersion: '已安装官方 Harness {version}',
  trayShow: '显示窗口',
  trayConsole: '后端控制台',
  trayBrowser: '在浏览器中打开',
  trayCopy: '复制访问地址',
  trayDeploy: '安装官方 Harness',
  trayInstallRuntime: '安装运行时和官方 Harness',
  trayInstallBundledNode: '只安装本应用 Node',
  trayUpdateOfficial: '更新官方 Harness',
  trayPick: '选择已有的 Harness 文件夹…',
  trayRestart: '重启后端',
  trayLogs: '查看后端日志',
  trayConfig: '编辑 config.json',
  trayLanguage: '语言 / Language',
  trayUpdate: '检查壳更新',
  trayUpdating: '正在检查壳更新…',
  trayDownloading: '正在下载壳 {version}…',
  trayInstall: '安装壳 {version} 并重启',
  trayUpdateFailed: '检查壳更新失败（再试一次）',
  trayReleases: '打开壳的发布页',
  trayQuit: '退出（结束后端）',
  trayHintTitle: '仍在托盘运行',
  trayHintBody:
    '关掉窗口只是把 DSH Desktop 藏到托盘，后端还在跑。\n\n要退出，请右键托盘里青色的 >_ 图标，选「退出（结束后端）」。',
  trayHintBodyMac:
    '关掉窗口只是把 DSH Desktop 藏进菜单栏，后端还在跑。\n\n要退出，请点菜单栏里青色的 >_ 图标，选「退出（结束后端）」。',
  nodeMissing: '没有系统 Node.js。请用「安装运行时和官方 Harness」下载本应用专用的官方 Node，或从 nodejs.org 安装 22.19+ / 24（不要用 Electron 自带的，也不要装 20）。',
  npmMissing: '找到了 node，但没有 npm。请重装官方 Node.js 安装包。',
  nodeOld: '当前 Node 是 {version}。官方 Harness 需要 22.19+ 或 24+，不能用 18 或 20。',
  nodeUnknown: '未知版本',
  missingLog: '未检测到官方 DeepSeek Harness。请用「安装运行时和官方 Harness」、「安装官方 Harness」，或「选择已有的 Harness 文件夹」。',
  deployingWait: '正在安装，请稍候。',
  deployTo: '将安装官方包 {pkg} 到：',
  deployCmd: '$ npm install --prefix <runtime> {pkg}',
  deployNpmFail:
    'npm 退出码 {code}。请检查网络。壳已经用国内镜像重试过。也可以在 config.json 里写 npmRegistry，或自己安装 {pkg} 再「选择文件夹」。',
  deployWrote: '已写入启动配置：{bin}',
  spawnFail: '启动失败：{error}',
  procError: '进程错误：{error}',
  procExit: '后端进程退出（code={code} signal={signal}）',
  autoRestart: '{sec}s 后自动重启（第 {n}/{max} 次）',
  configBadTitle: 'DSH Desktop 配置无效',
  configBadBody: '{file}\n\n{error}\n\n本次启动使用内置默认配置；修复该文件后重启壳生效。',
  updateDevTitle: '当前运行方式不检查壳更新',
  updateDevDetail:
    '自动更新只对「DSH-Desktop-Setup」安装版生效。请从 GitHub Releases 下载 Setup 安装；开发模式和 win-unpacked 免安装目录不会自动升级。\n\n更新官方 Harness 是托盘里另一项。',
  updateMacTitle: 'macOS 上不提供自动更新',
  updateMacDetail:
    'macOS 版未签名，应用内更新无法生效。请到 GitHub Releases 下载新的 .dmg，替换现有应用。\n\n更新官方 Harness 是托盘里另一项。',
  updateMacOpenReleases: '打开 Releases 页',
  updateBusy: '正在检查或下载壳更新，请稍候。',
  updateLatest: '壳已是最新版本 {version}',
  updateFound: '发现壳的新版本 {version}',
  updateFoundDetail: '正在后台下载，完成后会提示重启安装；也可稍后从托盘安装。这次不会更新官方 Harness。',
  updateFailTitle: '检查壳更新失败',
  updateFailBody: '无法联系 GitHub Releases。',
  updateNotifyTitle: 'DSH Desktop 壳有新版本',
  updateNotifyBody: '壳 {version} 正在后台下载。完成后可从托盘安装。',
  updateReadyTitle: '壳更新已就绪',
  updateReadyBody: 'DSH Desktop {version} 已下载完成。',
  updateReadyDetail: '现在重启安装壳，或稍后从托盘选择「安装壳并重启」。后端会随壳一起退出。磁盘上的官方 Harness 不会被替换。',
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
