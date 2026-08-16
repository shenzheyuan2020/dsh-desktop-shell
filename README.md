# DSH Desktop

把本机已有的官方 DeepSeek Harness（`dsh web`）放进独立桌面窗口：托盘常驻、关窗不杀后端、壳自己会检查更新。

**壳是我们的，窗口里的界面是官方原版。** 不 fork、不内嵌、不改官方源码。官方 Harness 怎么升级，窗口里就是什么。

| | 链接 |
|---|---|
| 下载安装包 | [Releases](https://github.com/shenzheyuan2020/dsh-desktop-shell/releases/latest) |
| 当前版本 | 0.1.3（Windows x64） |

---

## 安装（普通用户只看这一节）

### 1. 下载并安装壳

1. 打开 [最新 Release](https://github.com/shenzheyuan2020/dsh-desktop-shell/releases/latest)。
2. 下载 **`DSH-Desktop-Setup-0.1.3.exe`**（大约 95 MB）。不要下 Source code 压缩包。
3. 双击安装。安装包未签名，Windows SmartScreen 可能拦截：点 **「更多信息」→「仍要运行」**。
4. 装完从开始菜单或桌面打开 **DSH Desktop**。

请用这个 Setup 安装，不要用仓库里的 `dist/win-unpacked` 免安装目录——**自动更新只对安装版生效**。

### 2. 第一次打开：还没有官方 Harness 也能继续

壳**不内嵌**官方源码，但可以从官方 npm 包帮你装：

1. 本机需要 **Node.js 22.19+ 或 24+**（[nodejs.org](https://nodejs.org/)）。没有的话，启动页会提示，点「安装 Node.js」去官网下载，装完再打开壳。
2. 若本机还没有 DeepSeek Harness，启动页会显示 **「部署官方 DSH」**。点它，壳会把官方包 `@deepseek-ai/dsh` 装到 `%APPDATA%\DSH Desktop\official-runtime`（需要网络，大约一两分钟）。
3. 装完后自动启动官方原版界面。API Key 在官方界面的 **设置 → 模型** 里填写，不用写进壳。

已经自己克隆过官方仓库、或 PATH 上已有 `dsh` 的人，不会看到这一步，壳直接复用你现有的。

也可以稍后从托盘再点「部署官方 DSH」（用来补装或重装官方包）。

### 3. 启动失败时

| 日志里常见字样 | 怎么办 |
|---|---|
| 未检测到官方 DeepSeek Harness | 点启动页「部署官方 DSH」。 |
| 需要先安装 Node.js | 点「安装 Node.js」，装 22.19+ 或 24+ 后重开壳。 |
| npm 退出码非 0 | 检查网络 / npm 源，再点一次部署。 |
| 一直不出现 `dsh web: http://127.0.0.1:…` | 官方包已装但启动失败。看日志；或托盘「编辑配置」改成你的源码仓库路径。 |

配置文件在 `%APPDATA%\DSH Desktop\config.json`，改完必须重启壳或点「重启后端」。

---

## 日常使用

托盘图标（青色 `>_`）右键：

- **显示窗口** / 双击托盘：唤回界面
- **在浏览器中打开** / **复制访问地址**：同一套官方 UI，只是换浏览器看
- **重启后端**：只重启 `dsh web`，窗口会跟到新端口
- **查看后端日志**：打开 `%APPDATA%\DSH Desktop\logs`
- **编辑配置**：用记事本改启动命令
- **检查更新** / **打开发布页**
- **退出（结束后端）**：关掉壳和后台的 `dsh web`

关窗 ≠ 退出。F12 打开开发者工具。

---

## 自动更新（只更新壳）

用 **Setup 安装版** 才会自动更新。启动约 8 秒后静默检查 GitHub Releases，之后每 6 小时再查；也可以随时托盘「检查更新」。

有新版本时后台下载，完成后询问是否立刻重启安装。下载的是新的壳安装包，**不会改、不会升级你本机的 DeepSeek Harness**。

- 0.1.0（没有更新器）→ 请手动再装一次 Setup。
- 0.1.1 及以后 → 之后的版本会自动提示。

---

## 配置

首次启动若本机没有已知源码仓库，默认写成：

```json
{
  "command": "dsh",
  "args": ["web"],
  "cwd": "",
  "env": {},
  "shell": true
}
```

你克隆了官方仓库时，改成（路径换成你自己的）：

```json
{
  "command": "node",
  "args": ["--import", "tsx/esm", "apps/cli/src/bin.ts", "web"],
  "cwd": "D:\\path\\to\\deepseek-harness",
  "env": {},
  "shell": false
}
```

也可以不改文件，先设用户环境变量 `DSH_CHECKOUT` 为仓库路径，再删掉 `config.json` 后重启壳，让它按新默认重写。

| 字段 | 含义 |
|---|---|
| `command` / `args` | 实际拉起的进程。未写 `--port` 时壳会追加 `--port 0`。 |
| `cwd` | 工作目录。源码启动必须指向仓库根。 |
| `env` | 额外环境变量，会叠在系统环境上。 |
| `shell` | Windows 上跑 `dsh.cmd` 时必须是 `true`。 |

---

## 给开发者 / 维护者

```sh
git clone https://github.com/shenzheyuan2020/dsh-desktop-shell.git
cd dsh-desktop-shell
pnpm install
pnpm start          # 开发运行（此时「检查更新」不可用，属预期）
pnpm run dist       # 本地打 NSIS 包到 dist/
```

也可 `npx github:shenzheyuan2020/dsh-desktop-shell`（需要本机 Node 22+，会再下载 Electron）。普通用户请走 Setup，不要走这条。

发布新版本：把 `package.json` 的 `version` 改成例如 `0.1.3`，提交后：

```sh
git tag v0.1.3
git push origin main
git push origin v0.1.3
```

推送 `v*` 标签后，GitHub Actions 会构建并发布 Release（含 `latest.yml`，安装版靠它检查更新）。不要对同一标签再手动 `gh release create`，以免和 Actions 抢上传。

壳与官方 Harness 只认三条契约：spawn 配置里的命令、stdout 的 `dsh web: <URL>` 就绪行、退出时结束进程树。界面客制化请走官方 bundle / profile / slot，不要改壳去注入 DOM。
