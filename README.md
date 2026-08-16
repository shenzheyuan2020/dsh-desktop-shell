# DSH Desktop

English | [中文](README.zh.md)

A desktop window around the official DeepSeek Harness `dsh web` UI: system tray, close-to-tray, crash restart, first-run install of the official CLI, and **separate** updates for this shell and for official Harness.

**The shell is ours. The UI inside the window is the official product.** We do not fork, vendor, inject, or patch official source. When official Harness updates, the window shows that update.

| | Link |
|---|---|
| Installer | [Releases](https://github.com/shenzheyuan2020/dsh-desktop-shell/releases/latest) |
| Current version | 0.1.7 (Windows x64) |
| Official Harness | [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) |

The window title and tray tooltip show **shell version** and **Harness version** (when known), for example `DSH Desktop 0.1.7 · Harness 0.1.0-rc.6`.

---

## Language

On the **first** write of `config.json`, the shell follows the Windows display language (`zh*` → Chinese, otherwise English). You can still switch at any time:

- Startup page, top right: **English** / **中文**
- Tray → **Language** → English or 中文

The choice is written as `"locale": "en"` or `"zh"` and is kept on the next launch. A language change applies immediately to the shell. Changing `command` / `args` / `cwd` needs **Restart backend**.

The official Harness window has its **own** language settings. This shell does not change that UI. The startup page says so on purpose.

---

## Install the shell

1. Open the [latest Release](https://github.com/shenzheyuan2020/dsh-desktop-shell/releases/latest).
2. Download **`DSH-Desktop-Setup-0.1.7.exe`** (about 95 MB). Do not download the Source code zip; that is source, not the app.
3. Run the installer. It is unsigned. If Windows SmartScreen appears, choose **More info → Run anyway**.
4. Start **DSH Desktop** from the Start menu or the desktop shortcut.

Use this Setup installer. Auto-update of the **shell** only works for the installed app. The `dist/win-unpacked` folder is for developers and will not receive shell updates.

---

## First launch: detect Harness, or install it yourself

On every start the shell looks for official DeepSeek Harness, in this order:

1. The **current** `config.json` launch path (a source checkout in `cwd`, or a `dsh.cmd` you already chose)
2. The `DSH_CHECKOUT` environment variable, if it points at a clone that contains `apps/cli/src/bin.ts`
3. An official npm install this shell already placed in `%APPDATA%\DSH Desktop\official-runtime`
4. A `dsh` command on PATH (for example `npm install -g @deepseek-ai/dsh`)

There is **no** hardcoded maintainer disk path. If you develop from a clone, set `DSH_CHECKOUT` or use **Choose Harness folder**.

**If one of those is found**, the official UI starts immediately.

**If none is found**, the startup page stays open as a short wizard. The shell does not install anything until you confirm.

### Option A — install from the shell (no git clone)

Node is optional to install yourself. The shell prefers, in order:

1. A **system** Node.js 22.19+ or 24+ with npm
2. An **app-local** official Node already downloaded into `%APPDATA%\DSH Desktop\bundled-node` (not on the system PATH)
3. Nothing — then the primary button can download one

| This PC | Primary button | What happens |
|---|---|---|
| Qualified system Node, no Harness | **Install official Harness** | Uses system Node. Does not download another copy. |
| No qualified Node | **Install runtime and official Harness** | Downloads official Node.js 24.18.1 (Windows x64 zip, SHA-256 checked) into `bundled-node`, then `npm install @deepseek-ai/dsh` into `official-runtime`. |
| Checkout or folder already chosen | Official UI opens | Neither install step appears. |

The Node zip is **not** inside the Setup installer. First time without system Node needs network (~30 MB for Node, then the npm package). Default npm registry failure retries with `https://registry.npmmirror.com`. The Node zip tries nodejs.org, then npmmirror. You can set `"npmRegistry"` in `config.json`.

**Advanced** still has: **Install app-local Node only**, **Install system Node.js from nodejs.org** (choose 22.19+ or 24, not 20), **Choose Harness folder**, **Edit config.json**.

When that finishes, the official UI opens. Enter the API key under **Settings → Models** in that UI. Do not put the key in the shell config.

The same actions are on the tray. If the official package is already in `official-runtime`, the item is **Update official Harness** (latest npm). That does **not** update this desktop shell.

If you already launch from a source checkout, the confirm dialog warns that launch config will switch to the npm package. Use **Choose Harness folder** to switch back.

### Option B — you already installed Harness yourself

Click **Choose Harness folder…** (startup **Advanced**, or the tray). Pick a directory. The shell accepts:

- a git clone that contains `apps/cli/src/bin.ts`
- a folder that contains `dsh.cmd` / `dsh`
- a folder that contains `node_modules\.bin\dsh.cmd`

It writes `config.json` and starts. It does **not** open the JSON file for this step. **Edit config.json** stays under Advanced for hand edits.

After a manual install outside the app, **Check again** rescans and starts if it can see Harness.

### If startup fails

| What you see | What to do |
|---|---|
| DeepSeek Harness is not on this PC yet | Confirm **Install official Harness** or **Install runtime and official Harness**, or **Choose Harness folder**. |
| No usable Node.js 22.19+ or 24 | Use **Install runtime and official Harness**, or Advanced → app-local Node only / system Node from nodejs.org (not 20). |
| npm exited with a non-zero code | Network / registry. The shell already retried npmmirror. Set `npmRegistry`, or install yourself and choose the folder. |
| `dsh web: http://127.0.0.1:…` never appears | The official package started but did not become ready. Open **Backend console** and read the log; or point at a source checkout. |
| `'dsh' is not recognized` / `ENOENT` | Nothing on PATH. Use one-click install, or choose a folder. |

Config path: `%APPDATA%\DSH Desktop\config.json`. After you edit `command` / `args` / `cwd`, click **Restart backend**.

---

## Daily use

The cyan `>_` icon is the tray. Right-click:

| Item | Meaning |
|---|---|
| **Show window** | Bring the official UI back. Double-click the tray does the same. |
| **Backend console** | Reopen the startup page (log, versions, Advanced). It is not discarded after the UI loads. |
| **Open in browser** | Open the same official UI in the system browser. |
| **Copy address** | Copy the current `http://127.0.0.1:<port>` URL. |
| **Install runtime and official Harness** | Shown when there is no usable Node. Downloads app-local official Node, then official Harness. |
| **Install official Harness** / **Update official Harness** | npm install or update `@deepseek-ai/dsh` in this app’s folder. Uses system Node if it qualifies. Asks first. Does not update the shell. |
| **Install app-local Node only** | Downloads official Node into `bundled-node` only. Not on the system PATH. Hidden once that Node is present. |
| **Choose Harness folder…** | Folder picker; validates checkout or `dsh`. |
| **Restart backend** | Restart only `dsh web`. The window follows the new port. |
| **Open backend logs** | Opens `%APPDATA%\DSH Desktop\logs`. |
| **Edit config.json** | Opens the JSON file. Restart the backend after `command` / `args` / `cwd` edits. Locale applies immediately. |
| **Language** | English or 中文. Applies to the shell only. |
| **Check for shell updates** | Check GitHub Releases for a new **shell**. Does not update official Harness. |
| **Open shell releases page** | Open this project’s Releases in the browser. |
| **Quit (stop backend)** | Exit the shell and stop `dsh web`. |

The first time you close the window (or the startup page), a dialog explains: that hides to the tray; the backend keeps running. That is not Quit. The flag is stored as `closeToTrayHintShown`.

F12 opens DevTools on the startup page or the official UI window.

The startup page header always shows shell version, Harness version and kind, Node version and whether it is **system** or **app-local**, and the path in use.

---

## Updates: shell vs official Harness

These are two different actions.

**Shell** (this desktop app): the Setup install, about 8 seconds after start, checks GitHub Releases. It checks again every 6 hours. You can also use tray **Check for shell updates**. An update replaces this shell only.

**Official Harness**: tray **Update official Harness** (or first-run install). That runs npm against `@deepseek-ai/dsh` in `official-runtime`. It does not replace the Setup installer.

- 0.1.0 had no shell updater — install Setup once by hand.
- 0.1.1 and later can follow later Setup releases.

Dev mode (`pnpm start`) and `win-unpacked` do not auto-update the shell. That is expected.

---

## Config

File: `%APPDATA%\DSH Desktop\config.json`  
Tray: **Edit config.json**. After `command` / `args` / `cwd` edits, **Restart backend**.

Default when no checkout is found (locale follows the OS on first write):

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

If you cloned the official repository, use **Choose Harness folder** or write (change the path):

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

After a successful **Install official Harness**, `command` is set to the `dsh.cmd` inside `official-runtime`.

| Field | Meaning |
|---|---|
| `command` / `args` | Process to start. If `args` has no `--port`, the shell adds `--port 0` (OS-assigned, no clash). Needs Restart backend. |
| `cwd` | Working directory. For a source launch this must be the repo root. |
| `env` | Extra environment variables, merged on top of the process environment. |
| `shell` | Must be `true` on Windows when `command` is `dsh` or a `.cmd` shim. |
| `locale` | `"en"` or `"zh"`. The language switcher writes this. Applies immediately. |
| `npmRegistry` | Optional. If set, npm install uses this registry first, then the default, then npmmirror. |
| `closeToTrayHintShown` | Set after the first close-to-tray explanation. |
| `harnessVersion` | Written after a successful official-package install; the UI also reads `package.json` live. |

You can set user environment variable `DSH_CHECKOUT` to a repo path, delete `config.json`, and restart so defaults are rewritten.

Logs: `%APPDATA%\DSH Desktop\logs\backend.log` (rotated to `.old` after 5 MB). Log timestamps follow the shell language.

App-local Node (optional): `%APPDATA%\DSH Desktop\bundled-node`. Not on the system PATH. Launch config `env.PATH` prepends that folder when this Node is in use.

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
pnpm start          # dev run; Check for shell updates is unavailable, as designed
pnpm run dist       # NSIS installer + latest.yml in dist/
```

To point a dev machine at a source checkout without editing JSON every time:

```powershell
setx DSH_CHECKOUT "D:\path\to\deepseek-harness"
```

Then restart the shell (new processes see the variable).

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
- Shell auto-update is Setup-only.
- Official Harness language is not controlled by this shell.
- Official Harness still needs a real official `node.exe`+`npm` (not Electron’s Node). The Setup installer does not contain that zip; the shell can download it on demand into `bundled-node`, or use a qualified system Node.
- App-local Node is Windows x64 only (the same as this Setup).
- Windows x64 only.
- Not implemented: start on login, global hotkey, multi-profile switcher.
