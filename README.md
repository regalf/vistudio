# ViStudio

> A lightweight, extensible code editor built with Electron, React, TypeScript, and Monaco Editor.

## About

ViStudio is an IDE powered by **Monaco Editor** — the same engine behind VS Code — with an integrated terminal, file explorer, multi-tab editing, global search, and a sandboxed JavaScript extension system.

Built as part of the [ViTools](https://github.com/regalf/ViTools) suite.

---

## Quick Start

### Requirements

- **Linux** (Arch Linux recommended)
- **Electron 42** (system-installed: `pacman -S electron`)
- **Node.js 18+**
- **npm**

### Run

```bash
git clone https://github.com/regalf/vistudio.git
cd vistudio
npm install
./run.sh
```

Launches a Vite dev server on port 5173 and opens Electron with hot-reload.

### Commands

```bash
npm run start        # Launch ViStudio (development)
npm run build        # TypeScript check + Vite build
npm run typecheck    # TypeScript type checking only
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
└── run.sh
```

---

## Debugging

| Source | Location |
|--------|----------|
| DevTools | Open automatically in dev mode |
| Main process logs | `/tmp/vistudio.log` |
| Extension logs | `~/.config/vistudio/extension-debug.log` |
| Runtime errors | `~/.config/vistudio/runtime-error.log` |

---

## License

[GNU General Public License v3.0](LICENSE)
