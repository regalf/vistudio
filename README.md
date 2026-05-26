# ViStudio IDE

> A lightweight, extensible code editor built with Electron, React, TypeScript, and Monaco Editor.

![Version](https://img.shields.io/badge/version-0.9.0-blue)
![Electron](https://img.shields.io/badge/Electron-42-%23478cbf)
![React](https://img.shields.io/badge/React-18-%2361dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-%233178c6)
![License](https://img.shields.io/badge/license-GPLv3-blue)

---

## ✨ Features

- **Monaco Editor** — The same powerful editor engine that powers VS Code, with full syntax highlighting, bracket pair colorization, and IntelliSense
- **Multi-Tab Editing** — Open, close, reorder, and manage multiple files simultaneously
- **Integrated Terminal** — Full xterm.js terminal with bash shell integration
- **File Explorer** — Tree-based file browser with drag & drop support
- **Command Palette** — Fuzzy-search command runner (`Ctrl+Shift+P`) and quick file open (`Ctrl+P`)
- **Global Search** — Search and replace across all files with regex support
- **Extension System** — Extend functionality with plain JavaScript extensions (sandboxed for security)
- **Custom Themes** — Dark and light themes with full UI coverage via CSS custom properties
- **Extension API** — Rich API for extensions: commands, editors, workspace, languages, terminal, themes
- **Project Templates** — Create new projects from templates registered by extensions
- **Settings Panel** — Visual settings editor with Apply/Cancel workflow
- **Git Integration** — Built-in source control panel (status, diff, commit)
- **Console Panel** — Developer console with log filtering
- **File Icons** — 133+ SVG file icons for visual file type identification
- **Keyboard Shortcuts** — Comprehensive keyboard-first workflow

---

## 🚀 Quick Start

### Prerequisites

- **Linux** (Arch Linux recommended)
- **Electron 42** (system-installed)
- **Node.js 18+**
- **npm** or **pnpm**

### Run

```bash
git clone https://github.com/regalf/vistudio.git
cd vistudio
npm install
./run.sh
```

The script starts a Vite dev server on port 5173 and launches Electron with hot-reload support.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New file |
| `Ctrl+O` | Open file |
| `Ctrl+Shift+O` | Open folder |
| `Ctrl+S` | Save |
| `Ctrl+Shift+S` | Save as |
| `Ctrl+B` | Toggle sidebar |
| `` Ctrl+` `` | Toggle terminal |
| `Ctrl+Shift+U` | Toggle console |
| `Ctrl+Shift+F` | Search in files |
| `Ctrl+Shift+P` | Command palette |
| `Ctrl+P` | Quick open file |
| `Ctrl+,` | Settings |
| `Escape` | Close modals |

---

## 📦 Extension System

ViStudio extensions are **plain JavaScript files** — no build tools, no npm, no TypeScript compilation required.

### Hello World Extension

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

### Extension API Overview

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

## 🎨 Theming

ViStudio supports **dark and light themes** with full UI coverage via CSS custom properties. Extensions can register custom themes with both Monaco Editor colors and UI colors.

```
Settings → Workbench → Color Theme
```

### Extension Theme Example

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

## 🏗️ Architecture

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

## 📁 Project Structure

```
vistudio/
├── electron/
│   ├── main.ts          # Electron main process
│   └── preload.ts       # Secure IPC bridge
├── src/
│   ├── App.tsx          # Main React component + state
│   ├── components/      # UI components (16 total)
│   ├── core/            # Extension system, theme manager
│   ├── styles/          # Global CSS with theme variables
│   └── types/           # TypeScript interfaces
├── public/
│   ├── fonts/           # Inter + JetBrains Mono
│   └── icons/           # 133+ file type SVG icons
├── package.json
├── tsconfig.json
├── vite.config.ts
└── run.sh
```

---

## 🛠️ Development

### Commands

```bash
npm run start        # Launch ViStudio (development)
npm run build        # TypeScript check + Vite build
npm run typecheck    # TypeScript type checking only
```

### Debugging

- **DevTools**: open automatically in dev mode
- **Logs**: `/tmp/vistudio.log` (main process)
- **Extension logs**: `~/.config/vistudio/extension-debug.log`
- **Runtime errors**: `~/.config/vistudio/runtime-error.log`

---

## 📝 License

[GNU General Public License v3.0](LICENSE)

---

Built with ❤️ using Electron, React, and TypeScript.
