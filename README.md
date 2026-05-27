# ViStudio

> Part of the **[ViTools](https://github.com/regalf/ViTools)** suite — a collection of Linux desktop development tools built with AI-assisted coding.

> A lightweight, extensible code editor built with Electron, React, TypeScript, and Monaco Editor.

## About

ViStudio is an IDE powered by **Monaco Editor** — the same engine behind VS Code — with an integrated terminal, file explorer, multi-tab editing, global search, and a sandboxed JavaScript extension system.

Built as part of the [ViTools](https://github.com/regalf/ViTools) suite.

---

## Quick Start

### Requirements

#### Development (from source)

- **Linux** (Arch Linux recommended) or **Windows 10/11** (experimental)
- **Electron 42** (system-installed on Linux: `pacman -S electron`; on Windows Electron is bundled via npm)
- **Node.js 18+**
- **npm**

#### Runtime (pre-built)

- **Linux**: AppImage with **FUSE 2** (`libfuse2` on Debian/Ubuntu, `fuse2` on Arch)
- **Windows 10/11** (beta): Portable `.exe` — no extra dependencies required
- No Node.js, npm, or Electron required — the executable is self-contained

Install FUSE:
```bash
# Arch Linux
sudo pacman -S fuse2

# Debian / Ubuntu
sudo apt install libfuse2

# Fedora
sudo dnf install fuse
```

### Run

```bash
git clone https://github.com/regalf/vistudio.git
cd vistudio
npm install
./run.sh
```

Launches a Vite dev server on port 5173 and opens Electron with hot-reload.

> **Windows (dev)**: `run.sh` is a bash script — use npm scripts directly:
> ```powershell
> npm run build                   # TypeScript check + Vite build
> npx electron .                  # Run the built app
> ```
> For hot-reload, start Vite in one terminal (`npx vite`) and Electron in another:
> ```powershell
> # Terminal 1
> npx vite
> # Terminal 2
> $env:VITE_DEV_SERVER_URL="http://localhost:5173"; npx electron .
> ```

### Build Executable

```bash
npm run dist         # Package into AppImage + directory (Linux)
npm run dist:dir     # Package into directory only (faster)
npm run dist:appimage # AppImage only
npm run dist:win     # Windows portable .exe (cross-compile from Linux)
npm run dist:nsis    # Windows NSIS installer (requires Wine)
```

Output goes to `release/` — standalone executables (no Node.js or npm required).

> **Cross-compile from Linux** (recommended): `npm run dist:win` produces `release/win-unpacked/ViStudio.exe` — copy the whole folder to Windows and run.

> **Native build on Windows**: All `npm run dist:*` scripts work natively on Windows too. The simplest commands:
> ```powershell
> npm run dist:win     # Build for Windows (portable .exe)
> npm run dist:nsis    # Build NSIS installer (no Wine needed on Windows)
> ```

> **Windows support** (beta, v0.11.0+):
> - Cross-compiled from Linux using electron-builder — **no Windows machine needed** to build
> - `npm run dist:win` produces `release/win-unpacked/ViStudio.exe` — copy the whole folder to Windows and run
> - Terminal uses **PowerShell** (detected automatically on Windows)
> - **Auto-updater** configured — checks for new releases on startup using channel `latest-windows`
> - Custom title bar and platform-agnostic paths (`app.getPath('userData')` instead of `~/.config`)
> - Requires Wine only for NSIS installer (`dist:nsis`)
> - Run `ViStudio.exe` directly from the unpacked folder — no install needed

### Commands

```bash
npm run build        # TypeScript check + Vite build
npm run typecheck    # TypeScript type checking only
npm run start        # Launch ViStudio (development)
```

---

## Features

- **Monaco Editor** — Full syntax highlighting, bracket pair colorization, minimap, IntelliSense
- **Multi-tab editing** — Open, close, reorder, and manage multiple files
- **Integrated terminal** — xterm.js with bash shell
- **File explorer** — Tree browser with drag & drop
- **Command palette** — `Ctrl+Shift+P` fuzzy-search for commands, `Ctrl+P` for files
- **Global search** — Search and replace across all files with regex
- **Extension system** — Sandboxed JavaScript extensions with a rich API
- **Custom themes** — Dark and light themes with full CSS variable coverage
- **Project templates** — Create projects from extension-registered templates
- **Settings panel** — Visual editor with Apply/Cancel workflow
- **Git integration** — Source control panel (status, diff, commit)
- **File icons** — 133+ SVG icons for file type identification
- **Windows support** (beta, v0.11.0+) — Cross-compiled from Linux, runs on Windows 10/11 with:
  - **PowerShell terminal** — auto-detected on Windows; seamless bash-like experience
  - **Auto-updater** — checks for new releases via `latest-windows` channel
  - **Platform-agnostic paths** — `app.getPath('userData')` replaces `~/.config`
  - **Custom title bar** — consistent look across Linux and Windows
  - **Portable .exe** — no install, no extra dependencies, run from any folder
- **GPU acceleration** — Hardware-accelerated rendering with Mesa 26 (Skylake GT2+); GPU blocklist ignored for broad compatibility

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New file |
| `Ctrl+O` | Open file |
| `Ctrl+Shift+O` | Open folder |
| `Ctrl+S` | Save |
| `Ctrl+Shift+S` | Save as |
| `Ctrl+B` | Toggle sidebar |
| `` Ctrl+` `` | Toggle terminal |
| `Ctrl+Shift+F` | Search in files |
| `Ctrl+Shift+P` | Command palette |
| `Ctrl+P` | Quick open file |
| `Ctrl+,` | Settings |
| `Escape` | Close modals |

---

## Extension System

Extensions are **plain JavaScript files** — no build tools, no npm, no TypeScript compilation required. They run in a sandboxed environment with no access to `require()`, `process`, `window`, or `fetch`.

### Hello World

```bash
mkdir -p ~/.config/vistudio/extensions/hello-world
```

**`extension.json`**
```json
{
  "name": "hello-world",
  "version": "1.0.0",
  "main": "extension.js",
  "activationEvents": ["*"]
}
```

**`extension.js`**
```javascript
function activate(context, vs) {
  var cmd = vs.commands.registerCommand('hello.greet', function() {
    vs.window.showInformationMessage('Hello from ViStudio!')
  })
  context.subscriptions.push(cmd)
}

activate(context, vs)
```

Restart ViStudio or use **Extensions → Refresh Extensions**.

### API Reference

| API | Purpose |
|-----|---------|
| `vs.commands` | Register and execute commands |
| `vs.window` | Show messages, react to theme changes |
| `vs.editor` | Read and manipulate the active document |
| `vs.workspace` | Read/write files, find files, register themes and templates |
| `vs.terminal` | Send text to terminal, register compilers |
| `vs.languages` | Register languages, completion providers, token highlighters |
| `vs.env` | Open URLs, read CSS variables, get active theme |

> Full documentation: [Documentation.md](Documentation.md)

---

## Theming

ViStudio supports **dark and light themes** with full UI coverage via CSS custom properties. Extensions can register themes that customize both Monaco Editor token colors and UI variables.

```
Settings → Workbench → Color Theme
```

### Custom Theme Example

```javascript
vs.workspace.registerTheme({
  id: 'my-theme',
  label: 'My Theme',
  type: 'dark',
  colors: {
    'editor.background': '#1e1e1e',
    'editor.foreground': '#d4d4d4'
  },
  tokenColors: [
    { scope: 'keyword', settings: { foreground: '#569cd6' } }
  ],
  uiColors: {
    'bg-primary': '#1e1e1e',
    'text-primary': '#cccccc',
    'accent': '#007acc'
  }
})
```

---

## Architecture

```
┌──────────────────────────────────────┐
│       Electron Main Process          │
│  - Window management                 │
│  - IPC handlers (fs, dialog, term)   │
└──────────────┬───────────────────────┘
               │ IPC (contextBridge)
┌──────────────┴───────────────────────┐
│       React Renderer Process         │
│  - Monaco Editor                     │
│  - xterm.js Terminal                 │
│  - Extension Host (sandbox)          │
│  - UI Components                     │
└──────────────────────────────────────┘
```

### Build & Release

The project uses **GitHub Actions** to build and release automatically:

- **Push to `master`** — builds the AppImage (Linux) and portable .exe (Windows) and uploads them as build artifacts
- **Push a tag `v*`** — builds both platforms and creates a **GitHub Release** with:
  - `ViStudio-x86_64.AppImage` — Linux AppImage
  - `ViStudio-win32-x64.zip` — Windows portable .exe (zipped)
  - `latest-linux.yml` + `latest-windows.yml` — auto-update metadata
- **Auto-update** — the app checks for new releases via `electron-updater` (uses `latest-windows.yml` channel on Windows)

To create a release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

### Tech Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Electron 42 |
| UI Framework | React 18 + TypeScript |
| Editor | Monaco Editor 0.45 |
| Terminal | xterm.js 5.3 |
| Build Tool | Vite 5 |
| Extension API | Sandboxed `new Function()` |

---

## Project Structure

```
vistudio/
├── electron/
│   ├── main.ts          # Electron main process
│   └── preload.ts       # Secure IPC bridge
├── src/
│   ├── App.tsx          # Main React component + state
│   ├── components/      # UI components (16)
│   ├── core/            # Extension system, theme manager
│   ├── styles/          # Global CSS with theme variables
│   └── types/           # TypeScript interfaces
├── public/
│   ├── fonts/           # Inter + JetBrains Mono
│   └── icons/           # 133+ file type SVG icons
├── package.json
├── tsconfig.json
├── vite.config.ts
├── run.sh
└── release/          # Packaged executable (gitignored)
```

---

## Debugging

| Source | Linux | Windows |
|--------|-------|---------|
| DevTools | Open automatically in dev mode | Open automatically in dev mode |
| Main process logs | `/tmp/vistudio.log` | `%TEMP%\vistudio.log` |
| Extension logs | `~/.config/vistudio/extension-debug.log` | `%APPDATA%\vistudio\extension-debug.log` |
| Runtime errors | `~/.config/vistudio/runtime-error.log` | `%APPDATA%\vistudio\runtime-error.log` |

---

## More Information

For full documentation on the extension system, API reference, theming, and debugging, see the **[Wiki](https://github.com/regalf/vistudio/wiki)**.

---

## License

[GNU General Public License v3.0](LICENSE)
