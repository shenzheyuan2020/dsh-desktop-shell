# DSH Desktop

[English](README.md) | 中文

把本机的官方 DeepSeek Harness（`dsh web`）放进独立桌面窗口：系统托盘、关窗进托盘、崩溃自动重启、首次可自行安装官方 CLI，以及**分开**的「更新壳」和「更新官方 Harness」。

**壳是我们的，窗口里的界面是官方原版。** 不 fork、不内嵌、不注入、不改官方源码。官方 Harness 怎么升级，窗口里就是什么。

| | 链接 |
|---|---|
| 安装包 | [Releases](https://github.com/shenzheyuan2020/dsh-desktop-shell/releases/latest) |
| 当前版本 | 0.1.6（Windows x64） |
| 官方 Harness | [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) |

窗口标题和托盘提示会显示 **壳版本** 和 **Harness 版本**（能读到时），例如 `DSH Desktop 0.1.6 · Harness 0.1.0-rc.6`。

---

## 语言

**第一次**写入 `config.json` 时，壳跟 Windows 显示语言走（`zh*` 用中文，否则英文）。之后随时可改：

- 启动页右上角：**English** / **中文**
- 托盘 → **Language** → English 或 中文

选择会写成 `"locale": "en"` 或 `"zh"`，下次启动仍有效。改语言立刻作用于壳。改 `command` / `args` / `cwd` 需要 **重启后端**。

官方 Harness 窗口有**自己的**语言设置。本壳不会去改那一层。启动页会把这件事写明白。

---

## 安装壳

1. 打开 [最新 Release](https://github.com/shenzheyuan2020/dsh-desktop-shell/releases/latest)。
2. 下载 **`DSH-Desktop-Setup-0.1.6.exe`**（大约 95 MB）。不要下 Source code 压缩包，那是源码不是应用。
3. 双击安装。安装包未签名。若出现 Windows SmartScreen，点 **「更多信息」→「仍要运行」**。
4. 从开始菜单或桌面快捷方式打开 **DSH Desktop**。

请用这个 Setup 安装。**壳**的自动更新只对「已安装的应用」生效。`dist/win-unpacked` 是给开发者用的免安装目录，不会收到壳更新。

---

## 第一次打开：自动识别 Harness，或自己安装

每次启动，壳按下面顺序查找官方 DeepSeek Harness：

1. 当前 `config.json` 里的启动路径（`cwd` 里的源码仓库，或你选过的 `dsh.cmd`）
2. 环境变量 `DSH_CHECKOUT` 指向的克隆（目录里要有 `apps/cli/src/bin.ts`）
3. 本壳曾经装过的官方 npm 包：`%APPDATA%\DSH Desktop\official-runtime`
4. PATH 上的 `dsh` 命令（例如你执行过 `npm install -g @deepseek-ai/dsh`）

**不会**扫描维护者本机的硬盘路径。如果你在源码仓库上开发，请设 `DSH_CHECKOUT`，或用 **选择已有的 Harness 文件夹**。

**找到其中任意一种**，就直接打开官方界面。

**一种都没有**，启动页会停在一段短向导上。你不确认，壳不会擅自安装。

### 方式 A — 安装官方包（不用 git clone）

1. 本机需要 [nodejs.org/en/download](https://nodejs.org/en/download) 的 **Node.js 22.19+ 或 24+**（官方安装包，带 npm）。只用 Electron 自带运行时不够。**不要装 Node 20**——官网最大的 LTS 按钮经常是 20，官方 Harness 会拒绝。
2. 若 Node 缺失或版本不够，主按钮是 **安装 Node.js 22.19+ 或 24**。先说明版本要求，再打开下载页。你装完回到这里，窗口一获得焦点就会再检测。也可以用 **高级 → 重新检测**。
3. Node 合格后，主按钮是 **安装官方 Harness**。先确认对话框。壳会对 `@deepseek-ai/dsh` 执行 `npm install`，装到 `%APPDATA%\DSH Desktop\official-runtime`（需要网络，大约一两分钟）。进度条和日志会动。
4. 默认 npm 源失败时，壳会**自动**用 `https://registry.npmmirror.com` 再试。也可以在 `config.json` 里写 `"npmRegistry"`。
5. 装完后打开官方界面。API Key 在官方界面的 **设置 → 模型** 里填写，不要写进壳的配置。

托盘里有同一项。若 `official-runtime` 里已经有官方包，该项变成 **更新官方 Harness**（拉 npm 最新版）。这**不会**更新这个桌面壳。

若你当前是从源码仓库启动，确认框会警告启动配置将改成 npm 包。可用 **选择已有的 Harness 文件夹** 切回去。

### 方式 B — 你已经自己装过 Harness

点 **选择已有的 Harness 文件夹…**（启动页 **高级**，或托盘）。选一个目录。壳接受：

- 带有 `apps/cli/src/bin.ts` 的 git 克隆
- 里面有 `dsh.cmd` / `dsh` 的文件夹
- 里面有 `node_modules\.bin\dsh.cmd` 的文件夹

它会写入 `config.json` 并启动。这一步**不会**打开 JSON。手改配置仍在高级里的 **编辑 config.json**。

在壳外面装好之后，点 **重新检测**，能看见就启动。

### 启动失败时

| 你看到的 | 怎么处理 |
|---|---|
| 这台电脑上还没有 DeepSeek Harness | 确认 **安装官方 Harness**，或 **选择已有的 Harness 文件夹**。 |
| 需要先安装 Node.js 22.19+ 或 24 | 用那个按钮，装 **22.19+ 或 24（不要装 20）**，再回来。 |
| npm 退出码非 0 | 网络 / 源。壳已经用 npmmirror 重试过。可写 `npmRegistry`，或自己安装再选文件夹。 |
| 一直不出现 `dsh web: http://127.0.0.1:…` | 官方包已拉起但没有就绪。打开 **后端控制台** 看日志；或把路径指到源码仓库。 |
| `'dsh' 不是内部或外部命令` / `ENOENT` | PATH 上没有 `dsh`。用一键安装，或选择文件夹。 |

配置文件：`%APPDATA%\DSH Desktop\config.json`。改完 `command` / `args` / `cwd` 后点 **重启后端**。

---

## 日常使用

托盘图标是青色的 `>_`。右键：

| 项 | 含义 |
|---|---|
| **显示窗口** | 唤回官方界面。双击托盘一样。 |
| **后端控制台** | 重新打开启动页（日志、版本、高级）。官方界面起来之后也不会丢掉。 |
| **在浏览器中打开** | 用系统浏览器打开同一套官方 UI。 |
| **复制访问地址** | 复制当前 `http://127.0.0.1:<端口>`。 |
| **安装官方 Harness** / **更新官方 Harness** | 在本应用目录里 npm 安装或更新 `@deepseek-ai/dsh`。会先确认。不更新壳。 |
| **选择已有的 Harness 文件夹…** | 文件夹选择框；校验仓库或 `dsh`。 |
| **重启后端** | 只重启 `dsh web`。窗口会跟到新端口。 |
| **查看后端日志** | 打开 `%APPDATA%\DSH Desktop\logs`。 |
| **编辑 config.json** | 打开 JSON。改 `command` / `args` / `cwd` 后要重启后端。语言立刻生效。 |
| **语言 / Language** | English 或 中文。只作用于壳。 |
| **检查壳更新** | 向 GitHub Releases 检查新**壳**。不会更新官方 Harness。 |
| **打开壳的发布页** | 用浏览器打开本项目的 Releases。 |
| **退出（结束后端）** | 退出壳并结束后台的 `dsh web`。 |

第一次关掉窗口（或启动页）时，会弹出说明：那是藏到托盘，后端还在跑。那不是退出。标记写在 `closeToTrayHintShown`。

启动页或官方窗口里按 F12 打开开发者工具。

启动页顶部会一直显示壳版本、Harness 版本和种类、Node 版本，以及正在用的路径。

---

## 更新：壳 和 官方 Harness

这是两件不同的事。

**壳**（这个桌面应用）：用 Setup 安装的版本，启动约 8 秒后会检查 GitHub Releases，之后每 6 小时再查。也可以随时用托盘 **检查壳更新**。更新只替换这个壳。

**官方 Harness**：托盘 **更新官方 Harness**（或首次安装）。对 `official-runtime` 里的 `@deepseek-ai/dsh` 跑 npm。不会替换 Setup 安装包。

- 0.1.0 没有壳更新器，需要再手动装一次 Setup。
- 0.1.1 及以后可以跟随后续 Setup。

开发模式（`pnpm start`）和 `win-unpacked` 不会自动更新壳，这是预期行为。

---

## 配置

文件：`%APPDATA%\DSH Desktop\config.json`  
托盘：**编辑 config.json**。改完 `command` / `args` / `cwd` 后 **重启后端**。

本机没有源码仓库时的默认内容（第一次写入时语言跟系统走）：

```json
{
  "command": "dsh",
  "args": ["web"],
  "cwd": "",
  "env": {},
  "shell": true,
  "locale": "zh"
}
```

若你克隆了官方仓库，用 **选择已有的 Harness 文件夹**，或写成（路径换成你的）：

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

**安装官方 Harness** 成功后，`command` 会写成 `official-runtime` 里的 `dsh.cmd`。

| 字段 | 含义 |
|---|---|
| `command` / `args` | 实际拉起的进程。`args` 里没有 `--port` 时，壳会追加 `--port 0`（系统分配，避免冲突）。改完要重启后端。 |
| `cwd` | 工作目录。源码启动必须指向仓库根。 |
| `env` | 额外环境变量，叠在进程环境上。 |
| `shell` | Windows 上 `command` 是 `dsh` 或 `.cmd` 垫片时必须为 `true`。 |
| `locale` | `"en"` 或 `"zh"`。界面切换语言时会写入。立刻生效。 |
| `npmRegistry` | 可选。若设置，npm 安装先用这个源，再默认源，再 npmmirror。 |
| `closeToTrayHintShown` | 第一次关窗说明之后写入。 |
| `harnessVersion` | 成功安装官方包后写入；界面也会现场读 `package.json`。 |

也可以先设用户环境变量 `DSH_CHECKOUT` 为仓库路径，删掉 `config.json` 再启动，让默认配置按新路径重写。

日志：`%APPDATA%\DSH Desktop\logs\backend.log`（超过 5 MB 轮转为 `.old`）。日志时间戳跟壳的语言走。

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
pnpm start          # 开发运行；此时「检查壳更新」不可用，属预期
pnpm run dist       # 产出 NSIS 安装包和 latest.yml 到 dist/
```

开发机要固定指向源码仓库、又不想每次改 JSON，可以：

```powershell
setx DSH_CHECKOUT "D:\path\to\deepseek-harness"
```

然后重启壳（新进程才能看见这个变量）。

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
- 壳的自动更新只对 Setup 安装版生效。
- 官方 Harness 界面的语言不由本壳控制。
- 官方 Harness 仍然需要本机 **系统** Node.js 22.19+ 或 24+；壳不内嵌这份运行时。
- 仅 Windows x64。
- 尚未实现：开机自启、全局快捷键、多 profile 切换。
