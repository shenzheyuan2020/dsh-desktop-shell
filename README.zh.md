# DSH Desktop

[English](README.md) | 中文

把本机已有的官方 DeepSeek Harness（`dsh web`）放进独立桌面窗口：托盘常驻、关窗不杀后端、壳自己会检查更新。

**壳是我们的，窗口里的界面是官方原版。** 不 fork、不内嵌、不改官方源码。

壳界面**默认英文**。启动页右上角 English / 中文，或托盘 **Language** 可切换；选择会写入配置。官方 Harness 窗口里的语言由官方产品自己提供，壳不会去改。

| | 链接 |
|---|---|
| 下载安装包 | [Releases](https://github.com/shenzheyuan2020/dsh-desktop-shell/releases/latest) |
| 当前版本 | 0.1.5（Windows x64） |

---

## 安装

1. 打开 [最新 Release](https://github.com/shenzheyuan2020/dsh-desktop-shell/releases/latest)。
2. 下载 **`DSH-Desktop-Setup-0.1.5.exe`**（大约 95 MB）。不要下 Source code 压缩包。
3. 双击安装。未签名时 SmartScreen 点 **「更多信息」→「仍要运行」**。
4. 从开始菜单或桌面打开 **DSH Desktop**。

请用 Setup 安装。自动更新只对安装版生效。

### 第一次打开：还没有官方 Harness

1. 本机需要 **Node.js 22.19+ 或 24+**（[nodejs.org](https://nodejs.org/)）。没有则点 **Install Node.js**，装完点 **Check again**。
2. 未检测到 Harness 时点 **Install official DSH**，从 npm 安装官方包 `@deepseek-ai/dsh` 到 `%APPDATA%\DSH Desktop\official-runtime`。
3. 然后打开官方界面。API Key 在官方的 **设置 → 模型** 里填写。

已有源码仓库或 PATH 上的 `dsh` 会直接复用。也可以 **I already installed it — set the path**，或自行安装后 **Check again**。

---

## 日常使用

托盘可切换语言、部署官方包、重启后端、检查壳更新。关窗不等于退出。

配置在 `%APPDATA%\DSH Desktop\config.json`，其中 `"locale": "en"` 或 `"zh"`。
