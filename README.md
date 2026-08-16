# DSH Desktop

English | [中文](README.zh.md)

A desktop window around the official DeepSeek Harness `dsh web` UI: system tray, close-to-tray, crash restart, and updates for this shell only.

**The shell is ours. The UI inside the window is the official product.** We do not fork, vendor, or patch official source.

The shell UI defaults to **English**. Switch to Chinese from the startup page (English / 中文) or the tray **Language** menu. The official Harness UI has its own language settings.

| | Link |
|---|---|
| Installer | [Releases](https://github.com/shenzheyuan2020/dsh-desktop-shell/releases/latest) |
| Version | 0.1.5 (Windows x64) |

---

## Install

1. Open the [latest Release](https://github.com/shenzheyuan2020/dsh-desktop-shell/releases/latest).
2. Download **`DSH-Desktop-Setup-0.1.5.exe`** (~95 MB). Do not download the Source code zip.
3. Run the installer. It is unsigned; if SmartScreen appears, choose **More info → Run anyway**.
4. Start **DSH Desktop** from the Start menu or desktop.

Use the Setup installer. Auto-update does not apply to `dist/win-unpacked`.

### First launch if you do not have Harness yet

This shell does not bundle official source. It can install the official npm package for you:

1. You need **Node.js 22.19+ or 24+** ([nodejs.org](https://nodejs.org/)). If it is missing, the startup page says so; click **Install Node.js**, then open the shell again or click **Check again**.
2. If Harness is not found, click **Install official DSH**. The official package `@deepseek-ai/dsh` is installed into `%APPDATA%\DSH Desktop\official-runtime` (needs network, about 1–2 minutes).
3. The official UI then opens. Enter the API key under **Settings → Models** in that UI, not in the shell.

If you already cloned the official repo or have `dsh` on PATH, the shell uses that and skips this step.

You can also use **I already installed it — set the path**, or **Check again** after a manual install. The tray has the same install action.

---

## Daily use

Tray (cyan `>_`):

- **Show window** / double-click tray
- **Open in browser** / **Copy address**
- **Install official DSH** / **Restart backend**
- **Open backend logs** / **Edit config**
- **Language** → English or 中文
- **Check for updates** / **Open releases page**
- **Quit (stop backend)**

Closing the window does not quit. F12 opens DevTools.

---

## Auto-update (shell only)

The Setup install checks GitHub Releases about 8 seconds after start, then every 6 hours. You can also use **Check for updates**.

An update replaces this shell only. It does not change your DeepSeek Harness install.

---

## Config

`%APPDATA%\DSH Desktop\config.json` (tray **Edit config**; restart the backend after edits):

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

`locale` is `"en"` (default) or `"zh"`. The UI switcher writes this field.

For a source checkout, set `command` / `args` / `cwd` to the repo root. Or set the `DSH_CHECKOUT` environment variable and delete `config.json` so defaults are rewritten.

---

## Maintainers

```sh
git clone https://github.com/shenzheyuan2020/dsh-desktop-shell.git
cd dsh-desktop-shell
pnpm install
pnpm start
pnpm run dist
```

Release: bump `package.json` `version`, commit, `git tag vX.Y.Z`, push `main` and the tag. Do not also run `gh release create` for the same tag.
