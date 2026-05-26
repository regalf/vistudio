b# ViStudio IDE Documentation

> Version 0.9.0 — A modern, lightweight IDE built with Electron + React + TypeScript

---

## Table of Contents

1. [What is ViStudio?](#-what-is-vistudio)
2. [Getting Started](#-getting-started)
3. [User Interface Overview](#-user-interface-overview)
4. [Creating Extensions](#-creating-extensions)
5. [Extension API Reference](#-extension-api-reference)
6. [Complete Examples](#-complete-examples)
7. [Theming & Customization](#-theming--customization)
8. [Debugging](#-debugging)
9. [Known Issues & Limitations](#-known-issues--limitations)

---

## 📖 What is ViStudio?

ViStudio is a **lightweight code editor** built with the same core technologies as VS Code:
- **Monaco Editor** — the same editor engine that powers VS Code
- **xterm.js** — the same terminal emulator
- **Electron** — cross-platform desktop runtime

Unlike VS Code, ViStudio is designed to be **minimal**, **fast**, and **extensible through a simple JavaScript API**. Extensions are plain JavaScript files — no TypeScript compilation, no npm install, no build tools required.

---

## 🚀 Getting Started

### System Requirements

- **OS**: Linux (Arch Linux recommended)
- **Runtime**: Electron 42 (system-installed)
- **Node.js**: 18+

### Running ViStudio

```bash
# Clone the repository
git clone <repository-url>
cd ViStudio

# Run the development server
./run.sh
```

This will:
1. Start the Vite development server on port 5173
2. Launch Electron with hot-reload for React components

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New file |
| `Ctrl+O` | Open file |
| `Ctrl+Shift+O` | Open folder |
| `Ctrl+S` | Save file |
| `Ctrl+Shift+S` | Save as |
| `Ctrl+B` | Toggle sidebar |
| `Ctrl+`` | Toggle terminal |
| `Ctrl+Shift+U` | Toggle console |
| `Ctrl+Shift+F` | Search in files |
| `Ctrl+Shift+P` | Command palette |
| `Ctrl+P` | Quick open file |
| `Ctrl+,` | Settings |
| `Escape` | Close modals/panels |

---

## 🖥️ User Interface Overview

```
┌──────────────────────────────────────────────────┐
│  File  Edit  View  Extensions  Help              │ ← MenuBar
├──────────┬───────────────────────────────────────┤
│          │ ┌────┬────┬────┬───┐                 │ ← TabBar
│ Sidebar  │ │tab1│tab2│tab3│ × │                 │
│          │ ├────────────────────────────────────┤ │
│ Explorer │ │                                    │ │
│ 📁 src   │ │     Monaco Editor                  │ │
│   main.ts│ │     (code editing)                 │ │
│   utils/ │ │                                    │ │
│     help.│ │                                    │ │
│          │ │                                    │ │
│          │ ├────────────────────────────────────┤ │
│          │ │ $ ~/project ❯ _                    │ │ ← Terminal
│          │ └────────────────────────────────────┘ │
├──────────┴───────────────────────────────────────┤
│ Extensions: 3  ⚠ 2 Errors   Ln 10  Col 5  TS    │ ← StatusBar
└──────────────────────────────────────────────────┘
```

### Main Components

| Component | Description |
|-----------|-------------|
| **MenuBar** | File, Edit, View, Extensions, Help menus |
| **Sidebar** | Resizable panel (150px–600px) with file explorer |
| **ProjectExplorer** | File tree with drag & drop support |
| **TabBar** | Multi-tab management with reorder and close |
| **EditorPanel** | Monaco Editor with syntax highlighting |
| **TerminalPanel** | Integrated terminal (bash via xterm.js) |
| **StatusBar** | Extension count, errors, cursor position, language |
| **CommandPalette** | Fuzzy-search command runner (`Ctrl+Shift+P`) |
| **SearchPanel** | Global text search with replace (`Ctrl+Shift+F`) |
| **ConsolePanel** | Developer console with log filtering |
| **SettingsPanel** | Settings modal with Apply/Cancel |
| **ExtensionsPanel** | Extension manager (activate/deactivate/delete) |

---

## 🧩 Creating Extensions

Extensions are the heart of ViStudio's customizability. They are simple JavaScript files that run in a **sandboxed environment** and can interact with the editor through a well-defined API.

### Extension Structure

Every extension is a **folder** containing at least two files:

```
~/.config/vistudio/extensions/
└── my-extension/
    ├── extension.json    # Manifest (required)
    └── extension.js      # Code (required)
```

### The Manifest: `extension.json`

The manifest tells ViStudio about your extension.

```json
{
  "name": "my-extension",
  "version": "1.0.0",
  "description": "What my extension does",
  "author": "Your Name",
  "main": "extension.js",
  "activationEvents": ["*"],
  "contributes": {
    "commands": [
      {
        "command": "myExt.hello",
        "title": "Hello World",
        "category": "My Extension"
      }
    ],
    "languages": [
      {
        "id": "mylang",
        "extensions": [".mylang"],
        "aliases": ["MyLang"]
      }
    ]
  }
}
```

#### Manifest Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Unique identifier for the extension |
| `version` | string | ✅ | Semantic version (e.g. "1.0.0") |
| `description` | string | ❌ | Human-readable description |
| `author` | string | ❌ | Extension author |
| `main` | string | ✅ | Main JavaScript file (relative to folder) |
| `activationEvents` | string[] | ❌ | Events that trigger activation (`"*"` = always) |
| `contributes` | object | ❌ | Contributions (commands, languages) |

#### Activation Events

| Event | Description |
|-------|-------------|
| `"*"` | Activate on IDE startup |
| `"onCommand:myExt.hello"` | Activate when command is executed |
| `"onLanguage:typescript"` | Activate when a TypeScript file is opened |

### The Code: `extension.js`

Extensions are plain JavaScript files. The sandbox provides two parameters:

```javascript
function activate(context, vs) {
  // Your extension logic here
  console.log('Extension activated!')
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `context` | ExtensionContext | Extension path, subscriptions, workspace info |
| `vs` | ExtensionAPI | Full ViStudio API to interact with the editor |

### Sandbox Limitations

Extensions run in a **locked-down sandbox** for security:

```javascript
// ❌ NOT available in extensions:
require('fs')             // No Node.js modules
process.env.HOME          // No process access
window.document           // No DOM access
fetch('https://...')      // No network access

// ✅ Available:
vs.commands               // Register/execute commands
vs.window                 // Show messages
vs.editor                 // Manipulate editor
vs.workspace              // Read/write files
vs.terminal               // Terminal interaction
vs.languages              // Language support
vs.env                    // Environment info
console.log               // Logging (DevTools)
context                   // Extension context
```

### Extension Lifecycle

```
1. LOAD
   ── ViStudio scans ~/.config/vistudio/extensions/
   ── Reads extension.json from each folder
   ── Creates metadata entry (isActive: false)

2. ACTIVATE
   ── Triggered by activationEvents
   ── Reads extension.js
   ── Executes in sandbox: new Function('context', 'vscode', code)
   ── Calls activate(context, vs)
   ── Saves subscriptions for cleanup
   ── Sets isActive: true

3. DEACTIVATE
   ── User toggles off in Extensions panel
   ── Calls dispose() on all subscriptions
   ── Removes registered commands, compilers, themes
   ── Sets isActive: false

4. DELETE
   ── Deactivates first
   ── Deletes extension folder recursively
   ── Removes from internal registry
```

### Installing Extensions

**Method 1: Manual copy**
```bash
mkdir -p ~/.config/vistudio/extensions/my-extension
cp extension.json extension.js ~/.config/vistudio/extensions/my-extension/
```

Then use **Extensions → Refresh Extensions** or restart ViStudio.

**Method 2: From the IDE**
1. Menu **Extensions → Install Extension...**
2. Select the extension folder
3. Extension is loaded and activated automatically

**Method 3: Manage Extensions panel**
1. Menu **Extensions → Manage Extensions...**
2. Toggle switch to activate/deactivate
3. "Delete" button to remove

---

## 📚 Extension API Reference

### `vs.commands` — Registering & Executing Commands

#### `registerCommand(id, handler) → Disposable`

Register a command that users can run from the Command Palette or menu.

```javascript
var dispose = vs.commands.registerCommand('myExt.sayHello', function(name) {
  vs.window.showInformationMessage('Hello, ' + name + '!')
})

// Always push to subscriptions for auto-cleanup
context.subscriptions.push(dispose)
```

#### `executeCommand(id, ...args) → Promise`

Execute any registered command (including from other extensions).

```javascript
vs.commands.executeCommand('myExt.sayHello', 'World')
vs.commands.executeCommand('editor.formatDocument')
```

---

### `vs.window` — User Interaction

#### `showInformationMessage(message)`

```javascript
vs.window.showInformationMessage('File saved successfully!')
```

#### `showErrorMessage(message)`

```javascript
vs.window.showErrorMessage('Failed to compile: syntax error')
```

#### `showWarningMessage(message)`

```javascript
vs.window.showWarningMessage('You have unsaved changes')
```

#### `onDidChangeTheme(callback) → Disposable`

Listen for theme changes. Runs whenever the user switches themes.

```javascript
var dispose = vs.window.onDidChangeTheme(function(themeId) {
  console.log('Theme changed to:', themeId)
  var bg = vs.env.getCSSVar('--bg-primary')
  console.log('New background:', bg)
})

context.subscriptions.push(dispose)
```

---

### `vs.editor` — Editor Manipulation

#### `getActiveDocument() → EditorDocument | null`

Get the currently active document.

```javascript
var doc = vs.editor.getActiveDocument()
if (doc) {
  console.log('File:', doc.fileName)
  console.log('Language:', doc.languageId)
  console.log('Content:', doc.getText())
  console.log('Lines:', doc.lineCount)
}
```

#### `getActiveSelection() → Selection | null`

Get the current text selection.

#### `replaceSelection(text)`

Replace the selected text.

```javascript
vs.editor.replaceSelection('replacement text')
```

#### `insertText(text)`

Insert text at the end of the document.

```javascript
vs.editor.insertText('\n// Added by extension')
```

#### `getLanguage() → string`

Get the language of the active document.

```javascript
var lang = vs.editor.getLanguage()
console.log('Current language:', lang)
```

#### `setLanguage(languageId)`

Change the language of the active document.

```javascript
vs.editor.setLanguage('javascript')
```

---

### `vs.workspace` — File System Access

#### `getPath() → string | null`

Get the currently opened workspace folder path.

```javascript
var workspacePath = vs.workspace.getPath()
if (workspacePath) {
  console.log('Working on:', workspacePath)
} else {
  vs.window.showWarningMessage('No folder is open')
}
```

#### `readFile(path) → Promise<string>`

Read a file's content.

```javascript
vs.workspace.readFile('/home/user/project/src/main.js').then(function(content) {
  console.log('File content length:', content.length)
})
```

#### `writeFile(path, content) → Promise<void>`

Write content to a file.

```javascript
vs.workspace.writeFile('/home/user/project/output.txt', 'Hello from extension!')
```

#### `readDir(path) → Promise<FileSystemEntry[]>`

Read a directory's contents.

```javascript
vs.workspace.readDir('/home/user/project').then(function(entries) {
  entries.forEach(function(entry) {
    console.log(entry.name, entry.isDirectory ? '(dir)' : '(file)')
  })
})
```

#### `findFiles(pattern) → Promise<string[]>`

Search for files matching a glob pattern (`*` and `?` supported).

```javascript
vs.workspace.findFiles('*.js').then(function(files) {
  console.log('JS files:', files)
})

vs.workspace.findFiles('test_*.py').then(function(files) {
  console.log('Test files:', files)
})
```

#### `registerProjectTemplate(template) → Disposable`

Register a project template that appears in the "New Project" dialog.

```javascript
var template = vs.workspace.registerProjectTemplate({
  id: 'python-flask',
  name: 'Flask Web App',
  description: 'A basic Flask web application',
  language: 'python',
  files: {
    'app.py': 'from flask import Flask\n\napp = Flask(__name__)\n\n@app.route("/")\ndef home():\n    return "Hello, World!"\n\nif __name__ == "__main__":\n    app.run(debug=True)',
    'requirements.txt': 'flask\n',
    'templates/index.html': '<!DOCTYPE html>\n<html>\n<head>\n    <title>My App</title>\n</head>\n<body>\n    <h1>Hello!</h1>\n</body>\n</html>'
  }
})

context.subscriptions.push(template)
```

**Template fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique template identifier |
| `name` | string | ✅ | Display name in dropdown |
| `description` | string | ❌ | Optional description |
| `language` | string | ✅ | Project language |
| `files` | object | ✅ | Map of `path → content` for files to create |

Paths are relative to the project folder. Directories are created automatically.

#### `registerTheme(theme) → Disposable`

Register a custom theme with colors for both the editor and the UI.

```javascript
var theme = vs.workspace.registerTheme({
  id: 'my-forest-theme',
  label: 'Forest Dark',
  type: 'dark',
  // Monaco Editor colors
  colors: {
    'editor.background': '#1b2b1b',
    'editor.foreground': '#d4d4d4',
    'editorCursor.foreground': '#7ec87e',
  },
  // Syntax token colors
  tokenColors: [
    { scope: 'keyword', settings: { foreground: '#7ec87e' } },
    { scope: 'string', settings: { foreground: '#d4a04a' } },
    { scope: 'comment', settings: { foreground: '#6a9955', fontStyle: 'italic' } },
  ],
  // UI colors (CSS custom properties)
  uiColors: {
    'bg-primary': '#1b2b1b',
    'bg-secondary': '#1e301e',
    'bg-tertiary': '#243624',
    'bg-hover': '#2a402a',
    'bg-active': '#3a5a3a',
    'bg-input': '#1e301e',
    'text-primary': '#d4d4d4',
    'text-secondary': '#8a9a8a',
    'text-active': '#ffffff',
    'accent': '#7ec87e',
    'border-primary': '#2a402a',
    'border-secondary': '#3a5a3a',
  }
})

context.subscriptions.push(theme)
```

After registration, the theme appears in **Settings → Workbench → Color Theme**. Both Monaco Editor and all UI components update automatically when selected.

**Available UI color variables:**

| Variable | Purpose |
|----------|---------|
| `bg-primary` | Main background (editor, panels) |
| `bg-secondary` | Sidebar, modals, panel headers |
| `bg-tertiary` | Cards, sections |
| `bg-titlebar` | Title bar (MenuBar) |
| `bg-hover` | Hover state on list items |
| `bg-active` | Selected/active element background |
| `bg-input` | Input fields, secondary buttons |
| `bg-statusbar` | Status bar |
| `text-primary` | Main text color |
| `text-secondary` | Secondary text (labels, descriptions) |
| `text-active` | Text on selected/active elements |
| `text-button` | Text on primary buttons |
| `border-primary` | Main borders (modals, panels) |
| `border-secondary` | Input borders, secondary buttons |
| `accent` | Accent color (buttons, links, toggles) |
| `danger` | Error/danger color |

---

### `vs.terminal` — Terminal Integration

#### `sendText(text)`

Send text to the integrated terminal (executes as a command).

```javascript
vs.terminal.sendText('npm run build')
vs.terminal.sendText('ls -la')
vs.terminal.sendText('python script.py')
```

#### `registerCompiler(compiler) → Disposable`

Register a compiler for a file type.

```javascript
var compiler = vs.terminal.registerCompiler({
  id: 'myExt.compiler',
  label: 'My Compiler',
  command: 'tsc',
  args: ['--outDir', './dist'],
  fileExtensions: ['.ts']
})

context.subscriptions.push(compiler)
```

---

### `vs.languages` — Language Support & Autocompletion

#### `registerLanguage(language) → Disposable`

Register a new language with custom syntax highlighting.

```javascript
var lang = vs.languages.registerLanguage({
  id: 'mylang',
  extensions: ['.mylang'],
  aliases: ['MyLang', 'my-language'],
  keywords: ['fn', 'let', 'const', 'if', 'else', 'for', 'while', 'return'],
  operators: ['=', '==', '!=', '<', '>', '+', '-', '*', '/'],
  symbols: ['{', '}', '(', ')', '[', ']', ';', ','],
  builtins: ['print', 'input', 'len', 'range']
})

context.subscriptions.push(lang)
```

#### `registerCompletionProvider(languageId, provider) → Disposable`

Register autocompletion suggestions for a language.

```javascript
var provider = vs.languages.registerCompletionProvider('mylang', {
  provideCompletionItems: function(document, position) {
    return [
      {
        label: 'fn',
        kind: vs.CompletionItemKind.Keyword,
        insertText: 'fn',
        detail: 'Function declaration'
      },
      {
        label: 'println',
        kind: vs.CompletionItemKind.Function,
        insertText: 'println()',
        detail: 'Print to console'
      },
      {
        label: 'import',
        kind: vs.CompletionItemKind.Keyword,
        insertText: 'import "',
        detail: 'Import module'
      }
    ]
  }
})

context.subscriptions.push(provider)
```

#### `registerBuiltinFunctions(languageId, functions) → Disposable`

Register built-in functions for syntax highlighting (they appear as `support.function` tokens).

```javascript
var builtins = vs.languages.registerBuiltinFunctions('mylang', [
  'print', 'println', 'input', 'len', 'range', 'type', 'str', 'int'
])

context.subscriptions.push(builtins)
```

#### `registerTokenHighlighter(languageId, highlighter) → Disposable`

Register a custom token highlighter that maps regex patterns to token scopes.

```javascript
var highlighter = vs.languages.registerTokenHighlighter('mylang', {
  highlight: function(lineText) {
    var tokens = []
    // Match strings
    var strRegex = /"([^"]*)"/g
    var match
    while ((match = strRegex.exec(lineText)) !== null) {
      tokens.push({
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        type: 'string'
      })
    }
    // Match comments
    var commentRegex = /\/\/.*$/g
    while ((match = commentRegex.exec(lineText)) !== null) {
      tokens.push({
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        type: 'comment'
      })
    }
    return tokens
  }
})

context.subscriptions.push(highlighter)
```

---

### `vs.env` — Environment Information

#### `openExternal(url)`

Open a URL in the default browser.

```javascript
vs.env.openExternal('https://example.com')
vs.env.openExternal('https://github.com')
```

#### `getAppPath() → string`

Get the ViStudio installation path.

```javascript
var appPath = vs.env.getAppPath()
console.log('ViStudio installed at:', appPath)
```

#### `getCSSVar(name) → string`

Read a CSS custom property value from the current theme.

```javascript
var bg = vs.env.getCSSVar('--bg-primary')
console.log('Current background:', bg)
// "#1e1e1e" in dark theme, "#ffffff" in light theme

var accent = vs.env.getCSSVar('--accent')
console.log('Accent color:', accent)
// "#007acc"
```

This is especially useful for extensions that draw custom UI elements and need to match the current theme.

#### `getActiveTheme() → string`

Get the ID of the currently active theme.

```javascript
var theme = vs.env.getActiveTheme()
console.log('Active theme:', theme)
// "vs-dark-enhanced", "vs-light-enhanced", or a custom extension theme ID
```

---

### `vs.CompletionItemKind` — Completion Item Types

Enum used when providing autocompletion items:

| Value | Description |
|-------|-------------|
| `vs.CompletionItemKind.Text` | Plain text |
| `vs.CompletionItemKind.Method` | Class method |
| `vs.CompletionItemKind.Function` | Function |
| `vs.CompletionItemKind.Constructor` | Constructor |
| `vs.CompletionItemKind.Field` | Field |
| `vs.CompletionItemKind.Variable` | Variable |
| `vs.CompletionItemKind.Class` | Class |
| `vs.CompletionItemKind.Interface` | Interface |
| `vs.CompletionItemKind.Module` | Module |
| `vs.CompletionItemKind.Property` | Property |
| `vs.CompletionItemKind.Keyword` | Keyword |
| `vs.CompletionItemKind.Snippet` | Snippet |
| `vs.CompletionItemKind.Color` | Color |
| `vs.CompletionItemKind.File` | File |
| `vs.CompletionItemKind.Reference` | Reference |

---

### ExtensionContext

The `context` object passed to `activate()`:

| Property | Type | Description |
|----------|------|-------------|
| `extensionPath` | string | Absolute path to the extension folder |
| `subscriptions` | Disposable[] | Array for cleanup on deactivation |
| `workspacePath` | string \| null | Current workspace path |

### Disposable

Every `register*` method returns a `Disposable` with a `dispose()` method. Pushing it to `context.subscriptions` ensures automatic cleanup when the extension is deactivated:

```javascript
var cmd = vs.commands.registerCommand('myExt.hello', handler)
context.subscriptions.push(cmd)
// dispose() is called automatically on deactivation
```

---

## 💡 Complete Examples

### Example 1: Hello World Extension

**`extension.json`**
```json
{
  "name": "hello-world",
  "version": "1.0.0",
  "description": "A simple hello world extension",
  "author": "You",
  "main": "extension.js",
  "activationEvents": ["*"]
}
```

**`extension.js`**
```javascript
function activate(context, vs) {
  // Register a command
  var cmd = vs.commands.registerCommand('hello.greet', function() {
    vs.window.showInformationMessage('Hello, developer!')
  })

  // Register another command with arguments
  var greetName = vs.commands.registerCommand('hello.greetName', function(name) {
    vs.window.showInformationMessage('Hello, ' + name + '!')
  })

  context.subscriptions.push(cmd)
  context.subscriptions.push(greetName)

  console.log('Hello World extension activated!')
}

activate(context, vs)
```

---

### Example 2: Custom Language Support

This extension adds full language support for a fictional language called "SimpleLang".

**`extension.json`**
```json
{
  "name": "simplelang-support",
  "version": "1.0.0",
  "description": "Full language support for SimpleLang",
  "main": "extension.js",
  "activationEvents": ["*"],
  "contributes": {
    "commands": [
      {
        "command": "simplelang.run",
        "title": "Run SimpleLang File",
        "category": "SimpleLang"
      }
    ]
  }
}
```

**`extension.js`**
```javascript
function activate(context, vs) {
  // 1. Register the language
  var lang = vs.languages.registerLanguage({
    id: 'simplelang',
    extensions: ['.sl'],
    aliases: ['SimpleLang', 'simple'],
    keywords: [
      'fn', 'let', 'const', 'if', 'elif', 'else',
      'for', 'while', 'return', 'break', 'continue',
      'true', 'false', 'null', 'import', 'class'
    ],
    operators: [
      '=', '==', '!=', '<', '>', '<=', '>=',
      '+', '-', '*', '/', '%', '&&', '||', '!'
    ],
    symbols: ['{', '}', '(', ')', '[', ']', ';', ':', ',', '.'],
    builtins: [
      'print', 'println', 'input', 'len', 'range',
      'type', 'int', 'str', 'float', 'bool',
      'open', 'read', 'write', 'close'
    ]
  })

  // 2. Register autocompletion
  var provider = vs.languages.registerCompletionProvider('simplelang', {
    provideCompletionItems: function(document, position) {
      return [
        { label: 'fn', kind: vs.CompletionItemKind.Keyword, insertText: 'fn ', detail: 'Function declaration' },
        { label: 'let', kind: vs.CompletionItemKind.Keyword, insertText: 'let ', detail: 'Variable declaration' },
        { label: 'const', kind: vs.CompletionItemKind.Keyword, insertText: 'const ', detail: 'Constant declaration' },
        { label: 'if', kind: vs.CompletionItemKind.Keyword, insertText: 'if ', detail: 'If statement' },
        { label: 'for', kind: vs.CompletionItemKind.Keyword, insertText: 'for ', detail: 'For loop' },
        { label: 'while', kind: vs.CompletionItemKind.Keyword, insertText: 'while ', detail: 'While loop' },
        { label: 'print', kind: vs.CompletionItemKind.Function, insertText: 'print()', detail: 'Print without newline' },
        { label: 'println', kind: vs.CompletionItemKind.Function, insertText: 'println()', detail: 'Print with newline' },
        { label: 'input', kind: vs.CompletionItemKind.Function, insertText: 'input()', detail: 'Read user input' },
      ]
    }
  })

  // 3. Register built-in functions for highlighting
  var builtins = vs.languages.registerBuiltinFunctions('simplelang', [
    'print', 'println', 'input', 'len', 'range',
    'type', 'int', 'str', 'float', 'bool',
    'open', 'read', 'write', 'close'
  ])

  // 4. Register a command to run the file
  var runCmd = vs.commands.registerCommand('simplelang.run', function() {
    var doc = vs.editor.getActiveDocument()
    if (doc && doc.languageId === 'simplelang') {
      vs.terminal.sendText('python run_simplelang.py "' + doc.fileName + '"')
      vs.window.showInformationMessage('Running SimpleLang file...')
    } else {
      vs.window.showErrorMessage('Not a SimpleLang file')
    }
  })

  context.subscriptions.push(lang)
  context.subscriptions.push(provider)
  context.subscriptions.push(builtins)
  context.subscriptions.push(runCmd)

  console.log('SimpleLang support activated!')
}

activate(context, vs)
```

---

### Example 3: Project Template Extension

**`extension.json`**
```json
{
  "name": "web-templates",
  "version": "1.0.0",
  "description": "Web project templates",
  "main": "extension.js",
  "activationEvents": ["*"]
}
```

**`extension.js`**
```javascript
function activate(context, vs) {
  // Register multiple project templates

  var reactTemplate = vs.workspace.registerProjectTemplate({
    id: 'react-basic',
    name: 'React App',
    description: 'A basic React application with Vite',
    language: 'typescript',
    files: {
      'package.json': '{\n  "name": "my-react-app",\n  "version": "1.0.0",\n  "scripts": {\n    "dev": "vite",\n    "build": "vite build"\n  },\n  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0"\n  },\n  "devDependencies": {\n    "@vitejs/plugin-react": "^4.0.0",\n    "vite": "^5.0.0"\n  }\n}',
      'vite.config.js': 'import { defineConfig } from "vite"\nimport react from "@vitejs/plugin-react"\n\nexport default defineConfig({\n  plugins: [react()]\n})',
      'index.html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>My React App</title>\n</head>\n<body>\n  <div id="root"></div>\n  <script type="module" src="/src/main.tsx"></script>\n</body>\n</html>',
      'src/main.tsx': 'import React from "react"\nimport ReactDOM from "react-dom/client"\nimport App from "./App"\n\nReactDOM.createRoot(document.getElementById("root")!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n)',
      'src/App.tsx': 'function App() {\n  return (\n    <div>\n      <h1>Hello, React!</h1>\n    </div>\n  )\n}\n\nexport default App'
    }
  })

  var htmlTemplate = vs.workspace.registerProjectTemplate({
    id: 'html-basic',
    name: 'HTML Site',
    description: 'A basic HTML/CSS/JS website',
    language: 'html',
    files: {
      'index.html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Site</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Welcome!</h1>\n  <script src="script.js"></script>\n</body>\n</html>',
      'style.css': 'body {\n  font-family: sans-serif;\n  max-width: 800px;\n  margin: 0 auto;\n  padding: 2rem;\n}',
      'script.js': 'console.log("Hello, World!")'
    }
  })

  context.subscriptions.push(reactTemplate)
  context.subscriptions.push(htmlTemplate)
}

activate(context, vs)
```

---

### Example 4: Custom Theme Extension

**`extension.json`**
```json
{
  "name": "sunset-theme",
  "version": "1.0.0",
  "description": "A beautiful sunset-inspired dark theme",
  "main": "extension.js",
  "activationEvents": ["*"]
}
```

**`extension.js`**
```javascript
function activate(context, vs) {
  var theme = vs.workspace.registerTheme({
    id: 'sunset-glow',
    label: 'Sunset Glow',
    type: 'dark',
    // Monaco Editor colors
    colors: {
      'editor.background': '#1a1a2e',
      'editor.foreground': '#e0e0e0',
      'editorCursor.foreground': '#ff6b6b',
      'editorLineNumber.foreground': '#4a4a6a',
      'editor.selectionBackground': '#e9456060',
      'editor.lineHighlightBackground': '#16213e',
    },
    // Syntax token colors
    tokenColors: [
      { scope: 'keyword', settings: { foreground: '#ff6b6b' } },
      { scope: 'string', settings: { foreground: '#ffd93d' } },
      { scope: 'comment', settings: { foreground: '#6c757d', fontStyle: 'italic' } },
      { scope: 'type', settings: { foreground: '#6bcbff' } },
      { scope: 'function', settings: { foreground: '#ff9ff3' } },
      { scope: 'number', settings: { foreground: '#ffd93d' } },
      { scope: 'variable', settings: { foreground: '#e0e0e0' } },
    ],
    // UI colors
    uiColors: {
      'bg-primary': '#1a1a2e',
      'bg-secondary': '#16213e',
      'bg-tertiary': '#0f3460',
      'bg-titlebar': '#16213e',
      'bg-hover': '#1a1a3e',
      'bg-active': '#e94560',
      'bg-input': '#16213e',
      'bg-statusbar': '#e94560',
      'text-primary': '#e0e0e0',
      'text-secondary': '#8899aa',
      'text-active': '#ffffff',
      'text-button': '#ffffff',
      'accent': '#e94560',
      'danger': '#ff6b6b',
      'border-primary': '#0f3460',
      'border-secondary': '#1a1a4e',
      'scrollbar-bg': '#1a1a2e',
      'scrollbar-thumb': '#0f3460',
      'scrollbar-thumb-hover': '#1a3a6e',
    }
  })

  context.subscriptions.push(theme)
  console.log('Sunset Glow theme registered!')
}

activate(context, vs)
```

Once registered, the theme appears in **Settings → Workbench → Color Theme** as "Sunset Glow". Users can select it and both the editor and all UI components will update.

---

### Example 5: Theme-Aware Extension

This extension reacts to theme changes and logs the current colors.

**`extension.json`**
```json
{
  "name": "theme-aware",
  "version": "1.0.0",
  "description": "Demonstrates theme-aware APIs",
  "main": "extension.js",
  "activationEvents": ["*"]
}
```

**`extension.js`**
```javascript
function activate(context, vs) {
  // Read current theme info on activation
  var currentTheme = vs.env.getActiveTheme()
  var bgColor = vs.env.getCSSVar('--bg-primary')
  var textColor = vs.env.getCSSVar('--text-primary')
  var accentColor = vs.env.getCSSVar('--accent')

  console.log('=== Theme Info on Activation ===')
  console.log('Theme:', currentTheme)
  console.log('Background:', bgColor)
  console.log('Text:', textColor)
  console.log('Accent:', accentColor)

  // Register a command that shows current theme info
  var themeInfoCmd = vs.commands.registerCommand('theme.showInfo', function() {
    var theme = vs.env.getActiveTheme()
    var bg = vs.env.getCSSVar('--bg-primary')
    var text = vs.env.getCSSVar('--text-primary')

    vs.window.showInformationMessage(
      'Theme: ' + theme + ' | BG: ' + bg + ' | Text: ' + text
    )
  })

  // Listen for theme changes
  var onThemeChange = vs.window.onDidChangeTheme(function(themeId) {
    console.log('=== Theme Changed ===')
    console.log('New theme:', themeId)

    var newBg = vs.env.getCSSVar('--bg-primary')
    var newText = vs.env.getCSSVar('--text-primary')
    var newAccent = vs.env.getCSSVar('--accent')

    console.log('Background:', newBg)
    console.log('Text:', newText)
    console.log('Accent:', newAccent)
  })

  context.subscriptions.push(themeInfoCmd)
  context.subscriptions.push(onThemeChange)
}

activate(context, vs)
```

---

### Example 6: Build System Extension

**`extension.json`**
```json
{
  "name": "build-system",
  "version": "1.0.0",
  "description": "Generic build system with compiler registration",
  "main": "extension.js",
  "activationEvents": ["*"],
  "contributes": {
    "commands": [
      {
        "command": "build.run",
        "title": "Run Build",
        "category": "Build"
      },
      {
        "command": "build.clean",
        "title": "Clean Build",
        "category": "Build"
      }
    ]
  }
}
```

**`extension.js`**
```javascript
function activate(context, vs) {
  // Register compilers for different file types
  var cCompiler = vs.terminal.registerCompiler({
    id: 'gcc',
    label: 'GCC Compiler',
    command: 'gcc',
    args: ['-Wall', '-Wextra', '-o', 'output'],
    fileExtensions: ['.c', '.h']
  })

  var python = vs.terminal.registerCompiler({
    id: 'python',
    label: 'Python Runner',
    command: 'python3',
    args: [],
    fileExtensions: ['.py']
  })

  // Register build commands
  var buildCmd = vs.commands.registerCommand('build.run', function() {
    var doc = vs.editor.getActiveDocument()
    if (!doc) {
      vs.window.showErrorMessage('No file open')
      return
    }

    var fileName = doc.fileName
    if (fileName.endsWith('.c') || fileName.endsWith('.cpp')) {
      vs.terminal.sendText('gcc -Wall -Wextra -o output "' + fileName + '"')
      vs.window.showInformationMessage('Compiling C file...')
    } else if (fileName.endsWith('.py')) {
      vs.terminal.sendText('python3 "' + fileName + '"')
      vs.window.showInformationMessage('Running Python file...')
    } else {
      vs.window.showWarningMessage('No compiler configured for this file type')
    }
  })

  var cleanCmd = vs.commands.registerCommand('build.clean', function() {
    vs.terminal.sendText('rm -f output *.o')
    vs.window.showInformationMessage('Cleaned build artifacts')
  })

  context.subscriptions.push(cCompiler)
  context.subscriptions.push(python)
  context.subscriptions.push(buildCmd)
  context.subscriptions.push(cleanCmd)
}

activate(context, vs)
```

---

### Example 7: File Counter Extension

**`extension.json`**
```json
{
  "name": "file-counter",
  "version": "1.0.0",
  "description": "Count and analyze files in the workspace",
  "main": "extension.js",
  "activationEvents": ["*"],
  "contributes": {
    "commands": [
      {
        "command": "counter.count",
        "title": "Count Files",
        "category": "Counter"
      },
      {
        "command": "counter.countByType",
        "title": "Count Files by Type",
        "category": "Counter"
      }
    ]
  }
}
```

**`extension.js`**
```javascript
function activate(context, vs) {
  var countCmd = vs.commands.registerCommand('counter.count', function() {
    var workspacePath = vs.workspace.getPath()
    if (!workspacePath) {
      vs.window.showErrorMessage('No workspace open')
      return
    }

    vs.workspace.findFiles('*').then(function(files) {
      vs.window.showInformationMessage('Total files: ' + files.length)
    })
  })

  var countByTypeCmd = vs.commands.registerCommand('counter.countByType', function() {
    var workspacePath = vs.workspace.getPath()
    if (!workspacePath) {
      vs.window.showErrorMessage('No workspace open')
      return
    }

    vs.workspace.findFiles('*').then(function(files) {
      var typeCount = {}
      files.forEach(function(file) {
        var ext = file.split('.').pop().toLowerCase()
        typeCount[ext] = (typeCount[ext] || 0) + 1
      })

      var message = 'Files by type:\n'
      Object.keys(typeCount).sort().forEach(function(ext) {
        message += '  .' + ext + ': ' + typeCount[ext] + '\n'
      })

      vs.window.showInformationMessage(message)
    })
  })

  context.subscriptions.push(countCmd)
  context.subscriptions.push(countByTypeCmd)
}

activate(context, vs)
```

---

## 🎨 Theming & Customization

ViStudio uses **CSS custom properties** for all UI colors. Every component uses `var(--xxx)` instead of hardcoded colors. This means:

1. Switching themes updates the entire UI instantly
2. Extensions can register themes that customize both editor and UI colors
3. Extension code can read current theme colors at runtime

### Available CSS Variables

| Variable | Dark | Light | Purpose |
|----------|------|-------|---------|
| `--bg-primary` | `#1e1e1e` | `#ffffff` | Main background |
| `--bg-secondary` | `#252526` | `#f3f3f3` | Sidebar, modals |
| `--bg-tertiary` | `#2d2d30` | `#ececec` | Cards, sections |
| `--bg-titlebar` | `#323233` | `#dddddd` | Menu bar |
| `--bg-hover` | `#2a2d2e` | `#e8e8e8` | Hover state |
| `--bg-active` | `#094771` | `#cce5ff` | Active selection |
| `--bg-input` | `#3c3c3c` | `#ffffff` | Input fields |
| `--bg-statusbar` | `#007acc` | `#007acc` | Status bar |
| `--text-primary` | `#cccccc` | `#333333` | Main text |
| `--text-secondary` | `#858585` | `#666666` | Secondary text |
| `--text-active` | `#ffffff` | `#000000` | Active element text |
| `--text-button` | `#ffffff` | `#ffffff` | Button text |
| `--border-primary` | `#3c3c3c` | `#d4d4d4` | Main borders |
| `--border-secondary` | `#555555` | `#aaaaaa` | Secondary borders |
| `--accent` | `#007acc` | `#007acc` | Accent color |
| `--danger` | `#e81123` | `#e81123` | Error color |

### Reading CSS Variables from Extensions

```javascript
// Get the current accent color
var accent = vs.env.getCSSVar('--accent')

// Get the current background
var bg = vs.env.getCSSVar('--bg-primary')

// Get the active theme ID
var theme = vs.env.getActiveTheme()
```

### Reacting to Theme Changes

```javascript
vs.window.onDidChangeTheme(function(themeId) {
  // Theme just changed — update your extension's custom UI
  var bg = vs.env.getCSSVar('--bg-primary')
  var text = vs.env.getCSSVar('--text-primary')
  console.log('Theme:', themeId, 'BG:', bg, 'Text:', text)
})
```

---

## 🐛 Debugging

### Extension Logs

ViStudio writes detailed logs to:
```
~/.config/vistudio/extension-debug.log
```

### Main Process Logs
```bash
tail -f /tmp/vistudio.log
```

### Renderer (Extension) Logs

Open DevTools (`Ctrl+Shift+I`) and check the Console tab. Your extension's `console.log()` calls appear here with a prefix.

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Unexpected token` | Syntax error in extension.js | Check JavaScript syntax |
| `vs.commands.registerCommand is not a function` | Wrong API name | Use `vs.commands` (not `vs.command`) |
| `Extension not found` | Missing or invalid manifest | Verify `extension.json` |
| `Failed to read main file` | Main file path is wrong | Check the `main` field in manifest |
| `Theme already exists` | Duplicate theme ID | Use a unique `id` for your theme |

---

## ⚠️ Known Issues & Limitations

### Extension Sandbox
- Extensions **cannot** use `require()`, `process`, `window`, or `fetch`
- Only the exposed `vs` API and `context` are available
- This is intentional for security and stability

### Terminal
- The terminal uses `/bin/bash` (enforced for compatibility)
- `node-pty` is not used (native module compilation issues); instead, `script` command creates the pseudo-terminal

### Theme Registration
- Theme `id` must be unique across all extensions
- If two extensions register the same theme ID, the second one will fail
- `uiColors` in themes are optional — without them, only Monaco Editor colors change
- CSS variable names in `uiColors` should match the `--xxx` format (the `--` prefix is added automatically)

### Drag & Drop
- File drag & drop in the explorer uses `dataTransfer.setData` for path passing
- The tree refreshes after a successful move operation

### GPU
- Hardware acceleration is disabled by default to prevent GPU crashes
- This is controlled in the Electron main process

---

*ViStudio IDE v0.9.0*
*Documentation updated: 2026-05-26*
