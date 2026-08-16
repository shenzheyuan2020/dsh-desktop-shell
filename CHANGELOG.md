# Changelog / 更新日志

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow SemVer (pre-1.0).
Release notes on GitHub are generated from this file by `scripts/release-notes.mjs`.

格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)；版本号遵循 SemVer（1.0 前）。
GitHub 上的发版说明由 `scripts/release-notes.mjs` 从本文件生成。

## [0.1.8] - 2026-08-16

### Added

- CI workflow: JavaScript syntax checks and English/Chinese string-key parity run on every push and pull request.（新增 CI：每次推送与 PR 检查 JS 语法、中英文案键位与占位符一致性）
- Release notes are generated from this changelog and include the installer's SHA-256.（发版说明改由本文件生成，并附安装包 SHA-256 校验值）
- README: screenshots, version/CI badges, table of contents, changelog and license sections; hard-coded version numbers removed.（README 增加截图、徽章、目录、更新日志与许可证章节，去掉写死的版本号）

### Changed

- Repository metadata: topics and homepage filled in for discoverability.（补全仓库 topics 与主页链接）
- No product behavior change in the shell itself.（壳的产品行为无变化）

## [0.1.7] - 2026-08-16

### Added

- Optional app-local official Node: when no qualified system Node exists, the primary button downloads official Node.js 24.18.1 (Windows x64 zip, SHA-256 verified against the official checksums) into the app folder — never onto the system PATH — then installs official Harness.（可选「本应用 Node」：无合格系统 Node 时，主按钮先把官方 Node 下到本应用目录（校验 SHA-256、不写系统 PATH），再装官方 Harness）
- Advanced actions: install app-local Node only; open the nodejs.org download page for a system install.（高级动作：只装本应用 Node；或打开官网装系统 Node）
- The startup page and window title show whether the active Node is system or app-local.（启动页与标题显示 Node 来源：系统 / 本应用）
- Node zip download falls back from nodejs.org to npmmirror automatically.（Node 压缩包下载自动从 nodejs.org 回退到 npmmirror）

## [0.1.6] - 2026-08-16

### Added

- First-run wizard: one primary action per machine state, everything else folded into Advanced.（首启向导：按本机状态只露一个主按钮，其余收进「高级」）
- Folder picker for existing Harness installs (source checkout or `dsh.cmd`), replacing raw JSON editing as the primary path.（「选择已有的 Harness 文件夹」替代手改 JSON）
- Confirmation dialogs and an indeterminate progress bar for installs; automatic npmmirror retry; optional `npmRegistry` config field.（安装前确认、安装中进度条；npm 默认源失败自动用 npmmirror 重试；可配 `npmRegistry`）
- Backend console tray item — the startup page stays reachable after the official UI loads.（托盘「后端控制台」：官方界面打开后启动页仍可再开）
- First-time close-to-tray explanation dialog.（第一次关窗弹出「仍在托盘运行」说明）
- Shell and Harness versions in the window title, tray tooltip, and startup page header.（标题、托盘提示与启动页顶部显示壳/Harness 版本）
- Shell language follows the OS display language on first run.（首次运行界面语言跟随系统）
- Shell updates and official-Harness updates are separate, clearly labeled actions.（「检查壳更新」与「更新官方 Harness」拆分为两个动作）

### Removed

- Hard-coded maintainer checkout path in the default launch detection.（移除默认探测里写死的维护者本机路径）

## [0.1.5] - 2026-08-16

### Added

- Bilingual shell UI (default English) with a switcher on the startup page and in the tray; the choice persists in `config.json`. The official UI keeps its own language settings.（壳界面中英双语，默认英文；启动页与托盘可切换并持久化；官方界面语言不受影响）

## [0.1.4] - 2026-08-16

### Added

- Re-detect Harness and set a path manually from the startup page.（启动页支持重新检测与手动填写路径）

## [0.1.3] - 2026-08-16

### Added

- One-click install of the official npm package `@deepseek-ai/dsh` into the app folder when no Harness is found (requires a qualified system Node).（未检测到 Harness 时一键安装官方 npm 包到本应用目录）

## [0.1.2] - 2026-08-16

### Changed

- Release hardening: releases are created by `softprops/action-gh-release` with a per-tag concurrency group, avoiding drafts and duplicate uploads.（发版加固：单一发布任务，避免草稿与重复上传）

## [0.1.1] - 2026-08-16

### Added

- Shell auto-update via GitHub Releases (electron-updater); Setup installs only.（壳自动更新，仅对 Setup 安装版生效）

## [0.1.0] - 2026-08-16

### Added

- Initial shell: spawns official `dsh web`, waits for the `dsh web: <URL>` ready line, and loads the official UI with zero injection; system tray, close-to-tray, crash restart with 1s/3s/10s backoff, window-state memory, loopback-only navigation, single instance.（首版壳：spawn 官方 `dsh web`、就绪即零注入加载官方界面；托盘常驻、关窗进托盘、崩溃退避重启、窗口记忆、仅放行本机地址、单实例）
