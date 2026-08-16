# DSH Desktop

[English](README.md) | 中文

把本机的官方 DeepSeek Harness（`dsh web`）放进独立桌面窗口：系统托盘、关窗进托盘、崩溃自动重启、首次可自行安装官方 CLI，以及**只更新本壳**的自动更新。

**壳是我们的，窗口里的界面是官方原版。** 不 fork、不内嵌、不注入、不改官方源码。官方 Harness 怎么升级，窗口里就是什么。

| | 链接 |
|---|---|
| 安装包 | [Releases](https://github.com/shenzheyuan2020/dsh-desktop-shell/releases/latest) |
| 当前版本 | 0.1.5（Windows x64） |
| 官方 Harness | [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) |

---

## 语言

**壳**自己的界面（启动页、托盘、对话框）**默认英文**。

切换简体中文有两处，效果相同：

- 启动页右上角：**English** / **中文**
- 托盘 → **Language** → English 或 中文

选择会写入 `%APPDATA%\DSH Desktop\config.json` 的 `"locale": "en"` 或 `"zh"`，下次启动仍有效。

官方 Harness 窗口有**自己的**语言设置。本壳不会去改那一层界面。

---

## 安装壳

1. 打开 [最新 Release](https://github.com/shenzheyuan2020/dsh-desktop-shell/releases/latest)。
2. 下载 **`DSH-Desktop-Setup-0.1.5.exe`**（大约 95 MB）。不要下 Source code 压缩包，那是源码不是应用。
3. 双击安装。安装包未签名。若出现 Windows SmartScreen，点 **「更多信息」→「仍要运行」**。
4. 从开始菜单或桌面快捷方式打开 **DSH Desktop**。

请用这个 Setup 安装。自动更新只对「已安装的应用」生效。`dist/win-unpacked` 是给开发者用的免安装目录，不会收到更新。

---

## 第一次打开：自动识别 Harness，或自己安装

每次启动，壳按下面顺序查找官方 DeepSeek Harness：

1. 已知路径上的源码仓库，或环境变量 `DSH_CHECKOUT` 指向的克隆（目录里要有 `apps/cli/src/bin.ts`）
2. 本壳曾经装过的官方 npm 包：`%APPDATA%\DSH Desktop\official-runtime`
3. PATH 上的 `dsh` 命令（例如你执行过 `npm install -g @deepseek-ai/dsh`）

**找到其中任意一种**，就直接打开官方界面。

**一种都没有**，启动页会停住，并给出你自己安装的选项。你不点，壳不会擅自安装。

### 方式 A — 一键装官方包（不用 git clone）

1. 本机需要 [nodejs.org](https://nodejs.org/) 的 **Node.js 22.19+ 或 24+**（官方安装包，带 npm）。只用 Electron 自带运行时不够。
2. 若 Node 缺失或版本不够，**Install official DSH** 会是灰色。先点 **Install Node.js** 去安装，再点 **Check again**（或重开壳）。
3. Node 合格后，点 **Install official DSH**。壳会对官方包 `@deepseek-ai/dsh` 执行 `npm install`，装到 `%APPDATA%\DSH Desktop\official-runtime`（需要网络，大约一两分钟）。进度在日志里。
4. 装完后打开官方界面。API Key 在官方界面的 **设置 → 模型** 里填写，不要写进壳的配置。

托盘里也有 **Install official DSH**，以后要补装或重装可以用。

### 方式 B — 你已经自己装过 Harness

- 点 **I already installed it — set the path**，按下面 [配置](#配置) 改 `config.json`，再 **Restart backend** 或 **Check again**。
- 或者在壳外面装好 Node / `dsh` / git 克隆，再点 **Check again**。壳会重新扫描，能看见就启动。

### 启动失败时

| 你看到的 | 怎么处理 |
|---|---|
| Official DeepSeek Harness was not found / 未检测到官方 Harness | 点 **Install official DSH**；若已经有一份，去填路径。 |
| Install a supported Node.js first / 需要先安装 Node.js | 点 **Install Node.js**，装 22.19+ 或 24+，再 **Check again**。 |
| npm 退出码非 0 | 检查网络 / npm 源，再点一次 **Install official DSH**。 |
| 一直不出现 `dsh web: http://127.0.0.1:…` | 官方包已拉起但没有就绪。看日志；或把 `config.json` 指到源码仓库。 |
| `'dsh' 不是内部或外部命令` / `ENOENT` | PATH 上没有 `dsh`。用一键安装，或把 `command` / `cwd` 指到你的克隆。 |

配置文件：`%APPDATA%\DSH Desktop\config.json`。改完后重启壳，或点 **Restart backend**。

---

## 日常使用

托盘图标是青色的 `>_`。右键：

| 项 | 含义 |
|---|---|
| **Show window** | 唤回官方界面。双击托盘一样。 |
| **Open in browser** | 用系统浏览器打开同一套官方 UI。 |
| **Copy address** | 复制当前 `http://127.0.0.1:<端口>`。 |
| **Install official DSH** | 把 `@deepseek-ai/dsh` 安装或重装到本应用目录。 |
| **Restart backend** | 只重启 `dsh web`。窗口会跟到新端口。 |
| **Open backend logs** | 打开 `%APPDATA%\DSH Desktop\logs`。 |
| **Edit config** | 打开 `config.json`。改完后重启后端。 |
| **Language** | English（默认）或 中文。只作用于壳。 |
| **Check for updates** | 向 GitHub Releases 检查新壳。 |
| **Open releases page** | 用浏览器打开本项目的 Releases。 |
| **Quit (stop backend)** | 退出壳并结束后台的 `dsh web`。 |

关掉窗口只是进托盘，后端继续跑。那不是退出。

启动页或官方窗口里按 F12 打开开发者工具。

---

## 自动更新（只更新本壳）

用 Setup 安装的版本，启动约 8 秒后会检查 GitHub Releases，之后每 6 小时再查。也可以随时用托盘 **Check for updates**。

发现新壳版本后在后台下载，完成后询问是否立刻重启安装。可以先选稍后，再从托盘 **Install … and restart**。

会更新的：只有这个桌面壳。  
不会更新的：你的官方 Harness 源码仓库、`official-runtime` 里的 npm 包、API Key。

- 0.1.0 没有更新器，需要再手动装一次 Setup。
- 0.1.1 及以后可以跟随后续 Setup。

开发模式（`pnpm start`）和 `win-unpacked` 不会自动更新，这是预期行为。

---

## 配置

文件：`%APPDATA%\DSH Desktop\config.json`  
托盘：**Edit config**。改完后 **Restart backend**，或重启壳。

本机没有源码仓库时的默认内容：

```json
{
  "command": "dsh",
  "args": ["web"],
  "cwd": "",
  "env": {},
  "shell": true,
  "locale": "en"
}
```

若你克隆了官方仓库，改成（路径换成你的）：

```json
{
  "command": "node",
  "args": ["--import", "tsx/esm", "apps/cli/src/bin.ts", "web"],
  "cwd": "D:\\path\\to\\deepseek-harness",
  "env": {},
  "shell": false,
  "locale": "zh"
}
```

**Install official DSH** 成功后，`command` 会写成 `official-runtime` 里的 `dsh.cmd`。

| 字段 | 含义 |
|---|---|
| `command` / `args` | 实际拉起的进程。`args` 里没有 `--port` 时，壳会追加 `--port 0`（系统分配，避免冲突）。 |
| `cwd` | 工作目录。源码启动必须指向仓库根。 |
| `env` | 额外环境变量，叠在进程环境上。 |
| `shell` | Windows 上 `command` 是 `dsh` 或 `.cmd` 垫片时必须为 `true`。 |
| `locale` | `"en"`（默认）或 `"zh"`。界面切换语言时会写入。 |

也可以先设用户环境变量 `DSH_CHECKOUT` 为仓库路径，删掉 `config.json` 再启动，让默认配置按新路径重写。

日志：`%APPDATA%\DSH Desktop\logs\backend.log`（超过 5 MB 轮转为 `.old`）。

---

## 壳和官方 Harness 怎么对接

只认三条契约：

1. 启动：spawn `command` + `args`（你没写端口就加 `--port 0`）。
2. 就绪：等 stdout 出现 `dsh web: <URL>`，再零注入加载该地址。
3. 结束：退出或重启时结束整棵后端进程树。

给模型用的工具或界面，请走官方 bundle / profile / slot，不要改这个壳去注入 DOM。

---

## 维护者

```sh
git clone https://github.com/shenzheyuan2020/dsh-desktop-shell.git
cd dsh-desktop-shell
pnpm install
pnpm start          # 开发运行；此时「检查更新」不可用，属预期
pnpm run dist       # 产出 NSIS 安装包和 latest.yml 到 dist/
```

也可以 `npx github:shenzheyuan2020/dsh-desktop-shell`（需要 Node 22+，会再下载 Electron）。普通用户请走 Setup。

发版：改 `package.json` 的 `version`，提交，然后：

```sh
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z
```

推送 `v*` 标签后，GitHub Actions 会构建安装包并创建 Release（含 electron-updater 用的 `latest.yml`）。不要对同一标签再手动 `gh release create`。

pnpm 11 默认拦截依赖的构建脚本。`pnpm-workspace.yaml` 已放行 `electron` 与 `electron-winstaller`。若缺少 `node_modules/electron/dist/electron.exe`：

```powershell
$env:ELECTRON_MIRROR='https://npmmirror.com/mirrors/electron/'; node node_modules/electron/install.js
```

---

## 已知限制

- 安装包未签名，首次运行可能出现 SmartScreen。
- 自动更新只对 Setup 安装版生效。
- 官方 Harness 界面的语言不由本壳控制。
- 尚未实现：开机自启、全局快捷键、多 profile 切换。
