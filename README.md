# DSH Desktop（壳核分离桌面外壳）

把本机的 DeepSeek Harness `dsh web` 后端包成一个原生桌面应用：独立窗口、系统托盘、崩溃自动重启、关窗不杀后端、**壳自身自动更新**。**不 fork、不 vendor、不注入 DSH 的任何代码**，官方怎么更新都不破壳。

发布页：[Releases](https://github.com/shenzheyuan2020/dsh-desktop-shell/releases)

## 与 DSH 的全部耦合面（就三条）

1. 启动：spawn 配置里的 `command + args`（未显式给 `--port` 时自动追加 `--port 0`，端口由 OS 分配，永不冲突）；
2. 就绪：等待 stdout 出现 `dsh web: <URL>` 行（dsh 在整棵 Loader 树结算成功后才打印，这是官方文档化的就绪信号），然后把主窗口导航到该 URL；
3. 结束：退出/重启时结束整棵后端进程树。

主窗口以零注入方式承载 GUI：无 preload、sandbox 开启、只允许 loopback 导航，其余链接一律转交系统默认浏览器。

## 给最终用户

1. 从 [Releases](https://github.com/shenzheyuan2020/dsh-desktop-shell/releases) 下载 `DSH-Desktop-Setup-<version>.exe` 安装（未签名，SmartScreen 点「仍要运行」）。
2. 本机需要能跑官方 `dsh web`：要么已有 DeepSeek Harness 源码仓库，要么 PATH 上有 `dsh`。
3. 首次启动会在 `%APPDATA%\DSH Desktop\config.json` 写入启动命令。本机若存在 `E:\30_软件游戏\Opt\DSH` 会默认用源码启动；否则尝试 `dsh web`。别人使用时把 `cwd` 改成自己的仓库路径即可。
4. 之后双击图标即可。关窗进托盘，后端继续跑。

## 自动更新（只更新壳，不更新官方界面）

已安装用户会在启动约 8 秒后静默检查 GitHub Releases，之后每 6 小时再查一次。有新版本时后台下载，完成后弹窗询问是否立刻重启安装；也可以随时从托盘点「检查更新」。

维护者发布更新：

```sh
# 1. 改 package.json 的 version（例如 0.1.2）
# 2. 提交并打 tag
git add -A && git commit -m "release: 0.1.2"
git tag v0.1.2
git push origin main
git push origin v0.1.2
```

推送 `v*` tag 后，GitHub Actions 会构建 NSIS 安装包并创建 Release（含 `latest.yml`，这是 electron-updater 的更新清单）。已部署用户下次检查即可收到。

开发模式（`pnpm start`）没有安装包元数据，托盘「检查更新」只会提示不可用——这是预期。

## npm / 源码运行（给开发者）

```sh
# 从 GitHub 当包用（需本机 Node 22+，会再装 electron）
npx github:shenzheyuan2020/dsh-desktop-shell

# 或克隆后开发
git clone https://github.com/shenzheyuan2020/dsh-desktop-shell.git
cd dsh-desktop-shell
pnpm install
pnpm start
```

若要把包发到 npm 公共源：`npm login` 后执行 `npm publish --access public`，之后别人可以 `npx dsh-desktop-shell`。安装包渠道仍然是给普通用户的主路径。

## 日常使用

- 关闭窗口 = 最小化到托盘，后端继续运行。
- 托盘：显示窗口 / 浏览器中打开 / 复制访问地址 / 重启后端 / 查看后端日志 / 编辑配置 / 检查更新 / 打开发布页 / 退出。
- 后端崩溃自动重启（1s/3s/10s 退避，三次失败后停在状态页）；重启后端口变化由壳自动跟随。
- F12 打开开发者工具。

## 配置

首次启动生成 `%APPDATA%\DSH Desktop\config.json`（托盘「编辑配置」可打开，改完重启壳生效）：

```json
{
  "command": "node",
  "args": ["--import", "tsx/esm", "apps/cli/src/bin.ts", "web"],
  "cwd": "E:\\30_软件游戏\\Opt\\DSH",
  "env": {},
  "shell": false
}
```

- 源码启动：`command`/`args`/`cwd` 指向仓库；API Key 走仓库根部的 `.env`。
- 全局 `dsh`：`{ "command": "dsh", "args": ["web"], "shell": true }`（Windows 的 `.cmd` 垫片需要 `shell: true`）。
- 固定端口：在 `args` 里自己加 `--port 3080`，壳就不再追加 `--port 0`。
- 日志：`%APPDATA%\DSH Desktop\logs\backend.log`（超过 5MB 轮转为 `.old`）。

## 构建

```sh
pnpm install
pnpm run icon         # 重新生成图标
pnpm start            # 开发运行
pnpm run dist         # 产出 NSIS 安装包到 dist/（含 latest.yml）
```

pnpm 11 默认拦截依赖的构建脚本；`pnpm-workspace.yaml` 已通过 `allowBuilds` 放行 `electron` 与 `electron-winstaller`。若 electron 二进制未下载：

```powershell
$env:ELECTRON_MIRROR='https://npmmirror.com/mirrors/electron/'; node node_modules/electron/install.js
```

## 设计边界

- 壳只认上面三条契约；DSH 内部怎么改都与壳无关。
- 界面客制化不写进壳：走 DSH 自己的 bundle/profile 与 slot 插件。
- 自动更新只替换本壳的安装包，不会改、不会升级你本机的 DeepSeek Harness。

## 已知限制

- 安装包未签名，首次运行会有 SmartScreen 提示。
- 当前已安装的 0.1.0（无更新器）不会自动升到 0.1.1，需要手动装一次；之后的版本即可自动跟。
- 未实现：开机自启、全局快捷键唤起、多 profile 切换。
