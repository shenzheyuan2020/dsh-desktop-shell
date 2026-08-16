# DSH Desktop

English | [中文](README.zh.md)

A desktop window around the official DeepSeek Harness `dsh web` UI: system tray, close-to-tray, crash restart, first-run install of the official CLI, and updates for this shell only.

**The shell is ours. The UI inside the window is the official product.** We do not fork, vendor, inject, or patch official source. When official Harness updates, the window shows that update.

| | Link |
|---|---|
| Installer | [Releases](https://github.com/shenzheyuan2020/dsh-desktop-shell/releases/latest) |
| Current version | 0.1.5 (Windows x64) |
| Official Harness | [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) |

---

## Language

The **shell** UI (startup page, tray, dialogs) defaults to **English**.

Switch to Simplified Chinese in either place:

- Startup page, top right: **English** / **中文**
- Tray → **Language** → English or 中文

The choice is written to `%APPDATA%\DSH Desktop\config.json` as `"locale": "en"` or `"zh"` and is kept on the next launch.

The official Harness window has its **own** language settings. This shell does not change that UI.

---

## Install the shell

1. Open the [latest Release](https://github.com/shenzheyuan2020/dsh-desktop-shell/releases/latest).
2. Download **`DSH-Desktop-Setup-0.1.5.exe`** (about 95 MB). Do not download the Source code zip; that is source, not the app.
3. Run the installer. It is unsigned. If Windows SmartScreen appears, choose **More info → Run anyway**.
4. Start **DSH Desktop** from the Start menu or the desktop shortcut.

Use this Setup installer. Auto-update only works for the installed app. The `dist/win-unpacked` folder is for developers and will not receive updates.

---

## First launch: detect Harness, or install it yourself

On every start the shell looks for official DeepSeek Harness, in this order:

1. A source checkout at a known path, or the `DSH_CHECKOUT` environment variable pointing at a clone that contains `apps/cli/src/bin.ts`
2. An official npm install this shell already placed in `%APPDATA%\DSH Desktop\official-runtime`
3. A `dsh` command on PATH (for example `npm install -g @deepseek-ai/dsh`)

**If one of those is found**, the official UI starts immediately.

**If none is found**, the startup page stays open and offers ways for you to install it. The shell does not install anything until you click.

### Option A — one-click official package (no git clone)

1. You need **Node.js 22.19+ or 24+** from [nodejs.org](https://nodejs.org/) (the official installer, including npm). Electron’s bundled runtime is not enough.
2. If Node is missing or too old, **Install official DSH** is disabled. Click **Install Node.js**, install it, then click **Check again** (or restart the shell).
3. If Node is OK, click **Install official DSH**. The shell runs `npm install` for the official package `@deepseek-ai/dsh` into `%APPDATA%\DSH Desktop\official-runtime` (needs network, about 1–2 minutes). Progress appears in the log.
4. When that finishes, the official UI opens. Enter the API key under **Settings → Models** in that UI. Do not put the key in the shell config.

The same action is on the tray as **Install official DSH** if you want to install or reinstall later.

### Option B — you already installed Harness yourself

- Click **I already installed it — set the path**, edit `config.json` (see [Config](#config)), then **Restart backend** or **Check again**.
- Or install Node / `dsh` / a git clone outside the app, then click **Check again**. The shell rescans and starts if it can see Harness.

### If startup fails

| What you see | What to do |
|---|---|
| Official DeepSeek Harness was not found | Click **Install official DSH**, or set a path if you already have it. |
| Install a supported Node.js first | Click **Install Node.js**, install 22.19+ or 24+, then **Check again**. |
| npm exited with a non-zero code | Check network / npm registry, then try **Install official DSH** again. |
| `dsh web: http://127.0.0.1:…` never appears | The official package started but did not become ready. Read the log; or point `config.json` at a source checkout. |
| `'dsh' is not recognized` / `ENOENT` | Nothing on PATH. Use one-click install, or set `command` / `cwd` to your clone. |

Config path: `%APPDATA%\DSH Desktop\config.json`. After you edit it, restart the shell or click **Restart backend**.

---

## Daily use

The cyan `>_` icon is the tray. Right-click:

| Item | Meaning |
|---|---|
| **Show window** | Bring the official UI back. Double-click the tray does the same. |
| **Open in browser** | Open the same official UI in the system browser. |
| **Copy address** | Copy the current `http://127.0.0.1:<port>` URL. |
| **Install official DSH** | Install or reinstall `@deepseek-ai/dsh` into this app’s folder. |
| **Restart backend** | Restart only `dsh web`. The window follows the new port. |
| **Open backend logs** | Opens `%APPDATA%\DSH Desktop\logs`. |
| **Edit config** | Opens `config.json`. Restart the backend after edits. |
| **Language** | English (default) or 中文. Applies to the shell only. |
| **Check for updates** | Check GitHub Releases for a new shell. |
| **Open releases page** | Open this project’s Releases in the browser. |
| **Quit (stop backend)** | Exit the shell and stop `dsh web`. |

Closing the window hides it to the tray. The backend keeps running. That is not Quit.

F12 opens DevTools on the startup page or the official UI window.

---

## Auto-update (this shell only)

The Setup install, about 8 seconds after start, checks GitHub Releases. It checks again every 6 hours. You can also use tray **Check for updates**.

When a new shell version is found it downloads in the background, then asks whether to restart and install. You can postpone and use **Install … and restart** on the tray later.

What is updated: only this desktop shell.  
What is not updated: your official Harness checkout, the npm package under `official-runtime`, or API keys.

- 0.1.0 had no updater — install Setup once by hand.
- 0.1.1 and later can follow later Setup releases.

Dev mode (`pnpm start`) and `win-unpacked` do not auto-update. That is expected.

---

## Config

File: `%APPDATA%\DSH Desktop\config.json`  
Tray: **Edit config**. After edits, **Restart backend** or restart the shell.

Default when no checkout is found:

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

If you cloned the official repository, use (change the path):

```json
{
  "command": "node",
  "args": ["--import", "tsx/esm", "apps/cli/src/bin.ts", "web"],
  "cwd": "D:\\path\\to\\deepseek-harness",
  "env": {},
  "shell": false,
  "locale": "en"
}
```

After a successful **Install official DSH**, `command` is set to the `dsh.cmd` inside `official-runtime`.

| Field | Meaning |
|---|---|
| `command` / `args` | Process to start. If `args` has no `--port`, the shell adds `--port 0` (OS-assigned, no clash). |
| `cwd` | Working directory. For a source launch this must be the repo root. |
| `env` | Extra environment variables, merged on top of the process environment. |
| `shell` | Must be `true` on Windows when `command` is `dsh` or a `.cmd` shim. |
| `locale` | `"en"` (default) or `"zh"`. The language switcher writes this. |

You can set user environment variable `DSH_CHECKOUT` to a repo path, delete `config.json`, and restart so defaults are rewritten.

Logs: `%APPDATA%\DSH Desktop\logs\backend.log` (rotated to `.old` after 5 MB).

---

## How the shell talks to official Harness

Only three contracts:

1. Start: spawn `command` + `args` (add `--port 0` unless you set a port).
2. Ready: wait for a stdout line `dsh web: <URL>`, then load that URL with no injection.
3. Stop: kill the whole backend process tree on quit or restart.

Custom tools or UI for the agent belong in official bundles / profiles / slots, not in this shell.

---

## Maintainers

```sh
git clone https://github.com/shenzheyuan2020/dsh-desktop-shell.git
cd dsh-desktop-shell
pnpm install
pnpm start          # dev run; Check for updates is unavailable, as designed
pnpm run dist       # NSIS installer + latest.yml in dist/
```

You can also `npx github:shenzheyuan2020/dsh-desktop-shell` (Node 22+; downloads Electron). End users should use Setup.

To publish: bump `package.json` `version`, commit, then:

```sh
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z
```

A `v*` tag starts GitHub Actions, which builds the installer and creates the Release (including `latest.yml` for electron-updater). Do not also run `gh release create` for the same tag.

pnpm 11 blocks dependency build scripts unless allowed. `pnpm-workspace.yaml` already allows `electron` and `electron-winstaller`. If `node_modules/electron/dist/electron.exe` is missing:

```powershell
$env:ELECTRON_MIRROR='https://npmmirror.com/mirrors/electron/'; node node_modules/electron/install.js
```

---

## Known limits

- The installer is unsigned; first run may show SmartScreen.
- Auto-update is Setup-only.
- Official Harness language is not controlled by this shell.
- Not implemented: start on login, global hotkey, multi-profile switcher.
