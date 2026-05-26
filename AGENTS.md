# ViStudio IDE - AI Agent Development Guide

## 📋 Overview

ViStudio è un IDE moderno costruito con Electron + React + TypeScript, ispirato a VS Code. Questo documento serve come guida completa per AI agent che devono modificare, estendere o debuggare il codebase.

---

## 🏗️ Architecture

### Stack Tecnologico
- **Runtime**: Electron 42 (system-installed su Arch Linux)
- **Frontend**: React 18 con TypeScript
- **Build Tool**: Vite 5
- **Editor Engine**: Monaco Editor 0.45 (lo stesso di VS Code)
- **Terminal Engine**: xterm.js + `child_process` (script PTY)
- **Plugin System**: vite-plugin-electron
- **Extension System**: Sandboxato con `new Function()` - nessun accesso a `require`, `process`, `window`

### Architettura a Livelli

```
┌─────────────────────────────────────────────┐
│           Electron Main Process             │
│  - Window management                        │
│  - IPC handlers (fs, dialog, project, term) │
│  - Menu system                              │
│  - Extension IPC (load, activate, delete)   │
└──────────────────┬──────────────────────────┘
                   │ IPC (contextBridge)
┌──────────────────┴──────────────────────────┐
│           Preload Script                    │
│  - electronAPI exposed to renderer          │
│  - Secure bridge main↔renderer              │
│  - APIs: fs, dialog, project, folder, file, │
│    terminal, extension, log, onMenuAction   │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│           React Renderer Process            │
│  - App.tsx (state management)               │
│  - Components (UI)                          │
│  - Monaco Editor (code editing)             │
│  - xterm.js (terminal)                      │
│  - ExtensionHost (extension sandbox)        │
│  - CommandPalette, SearchPanel, Console     │
└─────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
ViStudio/
├── electron/
│   ├── main.ts          # Processo principale Electron
│   │   ├── GPU fixes (commandLine switches)
│   │   ├── createWindow() - BrowserWindow config
│   │   ├── createMenu() - Menu nativo (nascosto)
│   │   └── IPC handlers:
│   │       - fs:readFile, fs:writeFile, fs:readDir, fs:stat, fs:exists, fs:move
│   │       - dialog:openFile, dialog:openFolder, dialog:saveFile
│   │       - project:create (projectName, parentDir)
│   │       - folder:create, file:create
│   │       - terminal:start, terminal:write, terminal:resize
│   │       - extension:load, extension:activate, extension:deactivate,
│   │         extension:list, extension:loadDirectory, extension:delete
│   │       └── log
│   └── preload.ts       # Bridge sicuro renderer↔main
│       └── electronAPI esposto: fs, dialog, project, folder, file, terminal, extension, log, onMenuAction
│
├── src/
│   ├── main.tsx         # Entry point React + global error handlers
│   ├── App.tsx          # Componente principale + state management
│   │   ├── States: sidebarOpen, folderPath, tabs[], activeTabId, terminalVisible, consoleVisible, ...
│   │   ├── Handlers: handleOpenFolder, handleFileClick, handleSave, handleMenuAction, ...
│   │   ├── Console interceptor (log/warn/error/info → ConsolePanel)
│   │   ├── ExtensionHost initialization
│   │   └── Layout: MenuBar → [Sidebar + (TabBar + EditorPanel + TerminalPanel)] → StatusBar
│   │
│   ├── components/
│   │   ├── MenuBar.tsx          # Barra menu con dropdown (File, Edit, View, Extensions, Help)
│   │   ├── Sidebar.tsx          # Sidebar laterale con Explorer (ridimensionabile)
│   │   ├── ProjectExplorer.tsx  # Albero file/cartelle con drag & drop
│   │   ├── EditorPanel.tsx      # Wrapper Monaco Editor con tema custom vs-dark-enhanced
│   │   ├── TabBar.tsx           # Barra tab multipli (reorder, close, modified)
│   │   ├── TerminalPanel.tsx    # Wrapper xterm.js (bash shell via script PTY)
│   │   ├── StatusBar.tsx        # Barra di stato (extensions, errors, cursor, language)
│   │   ├── CommandPalette.tsx   # Command palette (Ctrl+Shift+P / Ctrl+P) con fuzzy search
│   │   ├── SearchPanel.tsx      # Ricerca globale nei file (Ctrl+Shift+F) con replace
│   │   ├── ExtensionsPanel.tsx  # Pannello gestione estensioni (activate/deactivate/delete)
│   │   ├── ConsolePanel.tsx     # Console output con filtri e auto-scroll
│   │   ├── SettingsPanel.tsx    # Pannello impostazioni (modale con Apply/Cancel)
│   │   ├── ErrorBoundary.tsx    # React error boundary (cattura crash, mostra "Try Again")
│   │   ├── GitPanel.tsx         # Pannello source control (git status, diff, commit)
│   │   └── FileIcon.tsx         # Icone file per estensione (133+ SVG icons)
│   │
│   ├── core/
│   │   ├── ExtensionHost.ts     # Extension host: load, activate, deactivate, sandbox execution
│   │   ├── ExtensionAPI.ts      # ExtensionAPIImpl: commands, window, editor, workspace, terminal, languages, env
│   │   └── ThemeManager.ts      # ThemeManager + ThemeService interface: getCSSVar, applyTheme, onDidChangeTheme
│   │
│   ├── styles/
│   │   └── global.css           # Stili globali, CSS variables (dark+light), font bundling, scrollbar
│   │
│   ├── types/
│   │   ├── index.ts             # TypeScript interfaces (EditorTab, FileSystemItem, ProjectConfig, ElectronAPI, CommandItem, EditorSettings)
│   │   └── extension.ts         # Extension types (Manifest, API, Context, Disposable, RegisteredTheme, etc.)
│   │
│   └── assets/                  # (empty)
│
├── schemas/
│   └── vistproj.template.json   # Template formato progetto
│
├── public/
│   ├── vite.svg                 # Favicon
│   ├── fonts/                   # Font bundled (Inter, JetBrains Mono)
│   │   ├── Inter-Regular.woff2
│   │   ├── Inter-Medium.woff2
│   │   ├── Inter-SemiBold.woff2
│   │   ├── Inter-Bold.woff2
│   │   ├── JetBrainsMono-Regular.woff2
│   │   ├── JetBrainsMono-Medium.woff2
│   │   └── JetBrainsMono-Bold.woff2
│   └── icons/                   # 133+ SVG file icons (devicon set)
│
├── docs/                        # (empty)
├── EXTENSION_API.md             # Documentazione completa Extension API
├── index.html                   # HTML entry point
├── package.json                 # Dependencies e scripts
├── tsconfig.json                # TypeScript config
├── vite.config.ts               # Vite + Electron config (external: ['electron', 'node-pty'])
├── run.sh                       # Script di avvio sviluppo
└── start-dev.sh                 # Script alternativo (legacy)
```

---

## 🔑 Key Components Deep Dive

### 1. App.tsx - State Management

**Stati principali:**
```typescript
sidebarOpen: boolean          // Sidebar visibile/nascosta
folderPath: string | null     // Percorso cartella aperta
tabs: EditorTab[]             // Array di tab aperti
activeTabId: string | null    // ID del tab attivo
terminalVisible: boolean      // Terminale visibile/nascosto
consoleVisible: boolean       // Console visibile/nascosta
consoleLogs: LogEntry[]       // Log intercettati
extensionsLoaded: number      // Numero estensioni caricate
extensionsList: ExtensionInfo[] // Lista estensioni
commandPaletteVisible: boolean // Command palette visibile
searchPanelVisible: boolean   // Search panel visibile
extensionsPanelVisible: boolean // Extensions panel visibile
refreshPath: string | null    // Trigger per refresh explorer
// ... modali states (file input, folder input, project input)
```

**Console Interceptor:**
- Intercetta `console.log`, `console.warn`, `console.error`, `console.info`
- Redirect a ConsolePanel con timestamp e livello
- Protezione contro loop infiniti (`isLogging` flag)
- Max 1000 entries (trim a 500)

**Extension System:**
- `ExtensionHost` inizializzato all'avvio
- Carica estensioni da `/home/regaldragoon200/.config/vistudio/extensions/`
- Attiva estensioni con `activationEvents: ["*"]`
- Refs per evitare stale closures (`getActiveTabContentRef`, etc.)

**Flusso dati:**
```
User Action → Handler → setState → Re-render → UI Update
```

### 2. ProjectExplorer.tsx - File Tree con Drag & Drop

**Algoritmo di caricamento:**
1. `folderPath` cambia → useEffect trigger
2. `loadDirectory(folderPath)` → chiama `electronAPI.fs.readDir`
3. Filtra: no file nascosti (.), no node_modules
4. Ordina: cartelle prima, poi alfabetico
5. Setta `fileTree` state
6. Controlla `.vistproj` → parse JSON → `projectConfig`

**Drag & Drop Implementation:**
- `onDragStart`: setta `dataTransfer.setData('text/plain', node.path)` e `draggedNode`
- `onDragOver`: `e.preventDefault()`, `e.dataTransfer.dropEffect = 'move'`
- `onDrop`: legge `e.dataTransfer.getData('text/plain')`, chiama `handleDrop`
- `handleDrop`: chiama `electronAPI.fs.move(sourcePath, destPath)`, poi aggiorna albero selettivamente
- Feedback visivo: bordo tratteggiato blu su cartelle target, opacità ridotta su elemento trascinato
- `setTimeout(() => setDraggedNode(node), 0)` previene re-render prematuri
- `WebkitUserDrag: 'element'` abilita il drag nativo su WebKit/Electron
- `pointerEvents: 'none'` su icone/frecce previene interferenze con il drag

### 3. TabBar.tsx - Multi-Tab Management

**Funzionalità:**
- Visualizza lista tab aperti
- Click per switchare tab attivo
- Drag & Drop per riordinare tab
- "×" per chiudere tab (appare su hover)
- Pallino bianco per file modificati non salvati

### 4. TerminalPanel.tsx - Integrated Terminal

**Tecnologia:**
- **xterm.js**: Rendering terminale (stesso di VS Code)
- **FitAddon**: Auto-resize
- **WebLinksAddon**: Link cliccabili
- **Backend**: `child_process` + `script` (pseudo-terminale) per evitare moduli nativi problematici
- **Shell**: Forzata a `/bin/bash` per compatibilità

**Flusso:**
1. Componente montato → `initTerminal()`
2. Crea istanza `Terminal` → `term.open(ref)`
3. Chiama `electronAPI.terminal.start(cwd)`
4. Listener `onData` riceve output dal main process → `term.write(data)`
5. Input utente → `term.onData` → `electronAPI.terminal.write(data)`

### 5. EditorPanel.tsx - Monaco Editor

**Configurazione Monaco:**
```typescript
options: {
  minimap: { enabled: true },
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
  fontLigatures: true,
  automaticLayout: true,
  bracketPairColorization: { enabled: true },
  guides: { bracketPairs: true, indentation: true },
  tabSize: 2,
}
```

**Tema Custom (vs-dark-enhanced):**
- Bracket highlighting colorato (6 livelli)
- Token colors per keywords, strings, functions, types, etc.
- Custom cursor, selection, line highlight

**Tema Chiaro (vs-light-enhanced):**
- Base `vs` con token colors invertiti (sfondo bianco, testo nero)
- Selection `#ADD6FF`, line highlight `#E8E8E8`
- Bracket highlighting con tonalità scure (6 livelli)

**Extension Themes Support:**
- `defineAllThemes()` registra temi estensione via `monaco.editor.defineTheme()`
- `uiColors` gestiti da ThemeManager (iniezione CSS per UI)
- `useEffect([themeName, extensionThemes])` aggiorna temi Monaco al cambio

**Anti-Crash:**
- `applyCustomHighlighting()` safe: max 100 iterazioni per regex, max 5000 decorazioni
- `mountedRef` impedisce setState su componente smontato
- `timeoutsRef` traccia e pulisce setTimeout

### 6. CommandPalette.tsx - Command Palette

**Funzionalità:**
- Aperta con `Ctrl+Shift+P` (comandi) o `Ctrl+P` (file quick open)
- Fuzzy search con scoring
- Modalità comando (`>`) e modalità file (`#`)
- Navigazione con frecce ↑↓
- Shortcut visualizzati accanto ai comandi
- Comandi built-in + comandi delle estensioni + tab aperti

### 7. SearchPanel.tsx - Global Search

**Funzionalità:**
- Aperto con `Ctrl+Shift+F`
- Ricerca contenuto file o nome file
- Replace singolo o "Replace All"
- Opzioni: regex, match case, whole word
- Esclusioni configurabili (node_modules, .git, dist, build)
- Batch processing (10 file per volta) per non bloccare UI
- Max 200 risultati
- Navigazione con frecce ↑↓

### 8. ExtensionsPanel.tsx - Extension Management

**Funzionalità:**
- Lista estensioni con toggle switch activate/deactivate
- Search per nome/descrizione
- Install extension (seleziona cartella)
- Delete extension (con conferma)
- Pannello laterale destro

### 9. ConsolePanel.tsx - Output Console

**Funzionalità:**
- Intercetta tutti i console.log/warn/error/info
- Filtri per livello (All, Log, Info, Warn, Error)
- Search/filter messaggi
- Auto-scroll toggle
- Clear button
- Contatore entries

### 10. Font Bundling
- **Inter**: Font UI principale (Regular, Medium, SemiBold, Bold)
- **JetBrains Mono**: Font editor codice (Regular, Medium, Bold)
- Path: `public/fonts/`
- Definizioni `@font-face` in `src/styles/global.css`
- Cross-platform consistency (no system font dependency)

### 11. File Icons
- 133+ SVG icons da devicon set
- Path: `public/icons/`
- `FileIcon.tsx` mappa estensioni → icone
- Fallback su `file-text.svg`

### 12. Sidebar Resize
- Sidebar ridimensionabile tramite drag handle (4px) tra sidebar e editor
- Range: 150px - 600px
- Implementato con `useRef` per evitare stale closures
- Listener globali `mousemove`/`mouseup` nel `useEffect`
- Transizione disabilitata quando sidebar aperta per resize fluido

### 13. Explorer Horizontal Scroll
- Quando i nomi dei file superano la larghezza della sidebar, appare scrollbar orizzontale
- `overflowX: 'auto'` sul container dell'albero
- `whiteSpace: 'nowrap'` su tutti i nomi (file, cartelle, root)
- Wrapper con `minWidth: 'fit-content'` per espandere il contenuto

### 14. Keyboard Shortcuts
- Tutte le shortcut sono gestite nel renderer tramite `window.addEventListener('keydown')`
- `handleMenuActionRef` usa `useRef` per evitare TDZ (Temporal Dead Zone) errors
- Shortcut supportate:
  - `Ctrl+N`: New File
  - `Ctrl+O`: Open File
  - `Ctrl+Shift+O`: Open Folder
  - `Ctrl+S`: Save
  - `Ctrl+Shift+S`: Save As
  - `Ctrl+B`: Toggle Sidebar
  - `Ctrl+``: Toggle Terminal
  - `Ctrl+Shift+U`: Toggle Console
  - `Ctrl+Shift+F`: Search Panel
  - `Ctrl+Shift+P`: Command Palette
  - `Ctrl+P`: Quick Open File
  - `Escape`: Chiudi pannelli modali
- Menu Electron senza acceleratori (gestiti dal renderer)
- `onMenuAction` IPC listener per menu click

### 15. New Project Modal
- Modale con campo nome progetto (precompilato "MyProject")
- Selettore template progetto (dropdown)
- Campo parent directory con pulsante "Browse"
- IPC `project:create` accetta `projectName`, `parentDir`, `templateFiles`
- Crea struttura: cartella progetto, `src/`, `.vistproj`, file template

### 16. Project Templates
- Le estensioni possono registrare template progetto via `vs.workspace.registerProjectTemplate()`
- Template = oggetto con `id`, `name`, `language`, `files` (mappa path→contenuto)
- Apparsi nel dropdown "New Project" come "Nome (linguaggio)"
- Alla creazione, i file del template vengono scritti nella cartella progetto
- Template deregistrati automaticamente alla disattivazione dell'estensione

### 17. SettingsPanel.tsx - Impostazioni con Apply/Cancel
- **Modale centrato** 520px con overlay semitrasparente
- **Stato pending**: le modifiche sono staged nello stato locale `pending`, non scritte subito
- **Apply**: chiama `onApply(pending)` che salva su disco via IPC `settings:save`, poi chiude
- **Cancel**: chiama `onClose()` direttamente, scarta le modifiche
- **Gruppi**: Editor, Files, Workbench (Color Theme)
- **Theme selector**: dropdown con temi built-in + temi registrati da estensioni
- **Shortcut**: mostra il nome del tema selezionato sotto il dropdown

### 18. ErrorBoundary.tsx - React Error Boundary
- **Componente classe** (necessario per `getDerivedStateFromError`)
- **Wrappa App** in `main.tsx: root.render(React.createElement(ErrorBoundary, null, React.createElement(App)))`
- **Cattura errori** durante rendering React, componentDidCatch, lifecycle methods
- **UI amichevole**: titolo "Something went wrong", messaggio errore, stack trace, pulsante "Try Again"
- **"Try Again"**: resetta lo stato `hasError` permettendo il re-render di App
- **Logging**: scrive errore su `~/.config/vistudio/runtime-error.log`

### 19. ThemeManager.tsx - Gestione Temi UI-wide
- **Classe singleton** pre-instanziata: `export const themeManager = new ThemeManager()`
- **applyTheme(themeId)**: setta `data-theme` su `<html>`, notifica listeners
- **getCSSVar(name)**: legge una CSS variable via `getComputedStyle`
- **getActiveTheme()**: restituisce l'ID del tema attivo
- **onDidChangeTheme(callback)**: si iscrive ai cambi tema, restituisce `Disposable`
- **registerThemeUI(theme)**: genera uno `<style>` con `[data-theme="id"] { --variabili }` e lo inietta nel `<head>`
- **unregisterThemeUI(themeId)**: rimuove lo `<style>` dal `<head>`
- **generateThemeCSS(theme)**: produce stringa CSS per un tema con `uiColors`
- **Temi estensione**: chiamato da `syncExtensionThemes()` in `App.tsx` dopo caricamento estensioni
- **Tema chiaro**: le variabili CSS per il tema light sono in `global.css` sotto `[data-theme="vs-light-enhanced"]`

### 20. Stabilità: Fix anti-crash
- **Regex safe**: `applyCustomHighlighting()` limita iterazioni (max 100 per regex, max 5000 decorazioni), salta match vuoti, gestisce regex malformati
- **mountedRef**: ogni componente controlla `mountedRef.current` prima di setState in callback asincroni
- **Timeout tracciati**: tutti i `setTimeout` sono salvati in `timeoutsRef` e cancellati nel cleanup `useEffect`
- **Ref sync unificato**: 10 useEffect separati per ref sync sono combinati in uno solo
- **Extension loading try/catch**: `loadExtensions()` wrappato per evitare unhandled rejections
- **openFileInTab safe**: `setActiveTabId` non viene chiamato dentro il callback di `setTabs` (side-effect vietato in React 18 strict mode)

---

## 🔌 IPC Communication

### Main Process → Renderer

**Menu Actions:**
```typescript
mainWindow.webContents.send('menu:new-file')
// ... tutte le azioni menu
```

**Terminal Events:**
```typescript
mainWindow.webContents.send('terminal:data', data)
mainWindow.webContents.send('terminal:exit', exitCode)
```

### Renderer → Main (via electronAPI)

**File System:**
```typescript
window.electronAPI.fs.readFile(path)
window.electronAPI.fs.writeFile(path, content)
window.electronAPI.fs.readDir(path)
window.electronAPI.fs.stat(path)
window.electronAPI.fs.exists(path)
window.electronAPI.fs.move(source, dest)
```

**Terminal:**
```typescript
window.electronAPI.terminal.start(cwd)      // Avvia shell
window.electronAPI.terminal.write(data)     // Invia input
window.electronAPI.terminal.resize(cols, rows) // Resize
window.electronAPI.terminal.onData(callback) // Ricevi output
window.electronAPI.terminal.onExit(callback) // Gestione uscita
```

**Dialogs:**
```typescript
window.electronAPI.dialog.openFile()
window.electronAPI.dialog.openFolder()
window.electronAPI.dialog.saveFile(defaultPath?)
```

**Project/File/Folder:**
```typescript
window.electronAPI.project.create(projectName, parentDir)  // Returns { success, projectDir?, error? }
window.electronAPI.folder.create(name, parentPath?)
window.electronAPI.file.create(name, parentPath)
```

**Extensions:**
```typescript
window.electronAPI.extension.load(path)
window.electronAPI.extension.activate(id)
window.electronAPI.extension.deactivate(id)
window.electronAPI.extension.list()
window.electronAPI.extension.loadDirectory(dir)
window.electronAPI.extension.delete(path)
```

**Logging:**
```typescript
window.electronAPI.log(message)  // Log dal renderer al main process
```

---

## 📦 Extension System

### Architettura
- **ExtensionHost**: Gestisce caricamento, attivazione, disattivazione
- **ExtensionAPIImpl**: Implementa le API esposte alle estensioni
- **Sandbox**: `new Function('context', 'vscode', code)` - nessun accesso a `require`, `process`, `window`

### API Disponibili alle Estensioni
- `vs.commands`: registerCommand, executeCommand
- `vs.window`: showInformationMessage, showErrorMessage, showWarningMessage, **onDidChangeTheme**
- `vs.editor`: getActiveDocument, getActiveSelection, replaceSelection, insertText, getLanguage, setLanguage
- `vs.workspace`: getPath, readFile, writeFile, readDir, findFiles, **registerProjectTemplate**, **registerTheme**
- `vs.terminal`: sendText, registerCompiler
- `vs.languages`: registerLanguage, registerCompletionProvider, registerBuiltinFunctions, registerTokenHighlighter
- `vs.env`: openExternal, getAppPath, **getCSSVar**, **getActiveTheme**
- `vs.CompletionItemKind`: Enum per tipi di completamento

### ThemeService (Dependency Injection)

Il `ThemeService` è un'interfaccia iniettata in `ExtensionAPIImpl` via costruttore al momento dell'attivazione dell'estensione. Questo permette alle estensioni di:

1. **Leggere variabili CSS correnti** — `vs.env.getCSSVar('--bg-primary')`
2. **Ottenere il tema attivo** — `vs.env.getActiveTheme()`
3. **Iscriversi ai cambi tema** — `vs.window.onDidChangeTheme(callback)`

Il `ThemeService` è definito in `src/core/ThemeManager.ts` e implementato da `ThemeManager`:

```typescript
export interface ThemeService {
  getCSSVar(name: string): string
  getActiveTheme(): string
  onDidChangeTheme(callback: (themeId: string) => void): Disposable
}
```

**Flusso di dependency injection:**
1. `App.tsx` crea `ExtensionHost` passando `themeManager` (che implementa `ThemeService`)
2. `ExtensionHost` memorizza `themeService` e lo passa a `ExtensionAPIImpl` nell'attivazione
3. `ExtensionAPIImpl` memorizza `themeService` e lo usa per implementare `env.getCSSVar()`, `env.getActiveTheme()`, `window.onDidChangeTheme()`
4. Il codice dell'estensione (sandboxato) accede a questi metodi tramite `vs.env` e `vs.window`

**Esempio: Leggere il colore di sfondo corrente**
```javascript
function activate(context, vs) {
  const bg = vs.env.getCSSVar('--bg-primary')
  // Ritorna "#1e1e1e" in dark, "#ffffff" in light
}
```

**Esempio: Ottenere il tema attivo**
```javascript
function activate(context, vs) {
  const theme = vs.env.getActiveTheme()
  // Ritorna "vs-dark-enhanced", "vs-light-enhanced", o l'id di un tema estensione
}
```

**Esempio: Iscriversi ai cambi tema (con cleanup automatico)**
```javascript
function activate(context, vs) {
  const disposable = vs.window.onDidChangeTheme((themeId) => {
    console.log('Theme changed to:', themeId)
    const bg = vs.env.getCSSVar('--bg-primary')
    // Aggiorna UI personalizzata dell'estensione
  })
  // Il listener viene rimosso automaticamente alla disattivazione dell'estensione
  context.subscriptions.push(disposable)
}
```

### vs.workspace.registerTheme()

Permette alle estensioni di registrare temi personalizzati sia per Monaco Editor che per UI:

```typescript
interface RegisteredTheme {
  id: string
  label: string
  type: 'dark' | 'light'
  colors?: Record<string, string>           // Colori Monaco Editor
  tokenColors?: Array<{
    scope: string | string[]
    settings: { foreground?: string; fontStyle?: string }
  }>
  uiColors?: Record<string, string>          // Colori UI (usati come CSS variables)
}
```

**Esempio completo: Tema con colori Monaco + UI**

```javascript
function activate(context, vs) {
  const disposable = vs.workspace.registerTheme({
    id: 'my-forest-theme',
    label: 'Forest Dark',
    type: 'dark',
    // Colori Monaco Editor
    colors: {
      'editor.background': '#1b2b1b',
      'editor.foreground': '#d4d4d4',
      'editorCursor.foreground': '#7ec87e',
    },
    // Colori syntax token
    tokenColors: [
      { scope: 'keyword', settings: { foreground: '#7ec87e' } },
      { scope: 'string', settings: { foreground: '#d4a04a' } },
      { scope: 'comment', settings: { foreground: '#6a9955', fontStyle: 'italic' } },
    ],
    // Colori UI (CSS variables)
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
  context.subscriptions.push(disposable)
}
```

Dopo la registrazione, il tema appare nel dropdown delle impostazioni (Settings > Workbench > Color Theme) e l'utente può selezionarlo. Quando selezionato, sia Monaco Editor che tutti i componenti UI si aggiornano automaticamente.

### Ciclo di Vita
1. **Load**: Scansiona `~/.config/vistudio/extensions/`, legge `extension.json`
2. **Activate**: Legge `extension.js`, esegue in sandbox, chiama `activate(context, vs)`
3. **Deactivate**: Dispose subscriptions, rimuove comandi/compilatori
4. **Delete**: Disattiva, elimina cartella, rimuove dal registro

### Log Estensioni
- `~/.config/vistudio/extension-debug.log` - Log dettagliati attivazione
- `/tmp/vistudio.log` - Log main process

---

## 📄 .vistproj Format

```json
{
  "name": "MyProject",
  "version": "1.0.0",
  "description": "Project description",
  "language": "typescript",
  "compiler": {
    "command": "tsc",
    "args": ["--outDir", "./dist", "--sourceMap"]
  },
  "entryPoint": "src/main.ts",
  "extensions": [],
  "settings": {
    "tabSize": 2,
    "formatOnSave": true,
    "theme": "vs-dark"
  },
  "exclude": ["node_modules", "dist", ".git"]
}
```

---

## 🎨 Theming & Styling

### Overview

ViStudio ha un sistema di theming UI-wide basato su **CSS custom properties** + attributo `data-theme` sull'elemento `<html>`. Ogni componente React usa `var(--xxx)` negli inline styles invece di colori hardcoded. Il cambio tema richiede solo:

1. `document.documentElement.setAttribute('data-theme', themeId)` — fatto da `ThemeManager.applyTheme()`
2. La cascata CSS aggiorna tutte le `var(--xxx)` automaticamente
3. Monaco Editor viene aggiornato via `monaco.editor.setTheme()` e `monaco.editor.defineTheme()`

### CSS Variables: Definizione

Tutte le variabili sono definite in `src/styles/global.css`:

**Tema Dark (default, su `:root`):**
```css
:root {
  --bg-primary: #1e1e1e;
  --bg-secondary: #252526;
  --bg-tertiary: #2d2d30;
  --bg-titlebar: #323233;
  --bg-hover: #2a2d2e;
  --bg-active: #094771;
  --bg-input: #3c3c3c;
  --bg-statusbar: #007acc;
  --text-primary: #cccccc;
  --text-secondary: #858585;
  --text-active: #ffffff;
  --text-button: #ffffff;
  --border-primary: #3c3c3c;
  --border-secondary: #555555;
  --accent: #007acc;
  --danger: #e81123;
  --scrollbar-bg: #1e1e1e;
  --scrollbar-thumb: #424242;
  --scrollbar-thumb-hover: #4f4f4f;
}
```

**Tema Light (su `[data-theme="vs-light-enhanced"], [data-theme="vs"]`):**
```css
[data-theme="vs-light-enhanced"],
[data-theme="vs"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f3f3f3;
  --bg-tertiary: #ececec;
  --bg-titlebar: #dddddd;
  --bg-hover: #e8e8e8;
  --bg-active: #cce5ff;
  --bg-input: #ffffff;
  --bg-statusbar: #007acc;
  --text-primary: #333333;
  --text-secondary: #666666;
  --text-active: #000000;
  --text-button: #ffffff;
  --border-primary: #d4d4d4;
  --border-secondary: #aaaaaa;
  --accent: #007acc;
  --danger: #e81123;
  --scrollbar-bg: #ffffff;
  --scrollbar-thumb: #c1c1c1;
  --scrollbar-thumb-hover: #a0a0a0;
}
```

### Come usare le CSS Variables nei componenti

Nei componenti React, usare `var(--xxx)` direttamente negli inline styles. Il browser risolve la variabile in base al `data-theme` corrente:

```typescript
// Inline style con CSS variable — FUNZIONA
style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}

// NON usare colori hardcoded
style={{ background: '#1e1e1e', color: '#cccccc' }}  // ✗
```

### Tabella delle Variabili

| Variabile | Dark | Light | Uso |
|-----------|------|-------|-----|
| `--bg-primary` | `#1e1e1e` | `#ffffff` | Sfondo principale (editor, pannelli) |
| `--bg-secondary` | `#252526` | `#f3f3f3` | Sidebar, modali, header pannelli |
| `--bg-tertiary` | `#2d2d30` | `#ececec` | Card, sezioni, label tema |
| `--bg-titlebar` | `#323233` | `#dddddd` | Barra titolo (MenuBar) |
| `--bg-hover` | `#2a2d2e` | `#e8e8e8` | Hover su elementi lista |
| `--bg-active` | `#094771` | `#cce5ff` | Elemento selezionato (CommandPalette, SearchPanel) |
| `--bg-input` | `#3c3c3c` | `#ffffff` | Input field, button secondari |
| `--bg-statusbar` | `#007acc` | `#007acc` | Status bar (uguale in entrambi) |
| `--text-primary` | `#cccccc` | `#333333` | Testo principale |
| `--text-secondary` | `#858585` | `#666666` | Testo secondario (label, descrizioni) |
| `--text-active` | `#ffffff` | `#000000` | Testo su elemento selezionato/attivo |
| `--text-button` | `#ffffff` | `#ffffff` | Testo su bottoni primari (sempre bianco) |
| `--border-primary` | `#3c3c3c` | `#d4d4d4` | Bordi principali (modali, pannelli) |
| `--border-secondary` | `#555555` | `#aaaaaa` | Bordi input, bottoni secondari |
| `--accent` | `#007acc` | `#007acc` | Accent color (bottoni, link, toggle attivo) |
| `--danger` | `#e81123` | `#e81123` | Colore errore/pericolo |

### ThemeManager (`src/core/ThemeManager.ts`)

Classe singleton che gestisce l'applicazione dei temi UI-wide:

```typescript
export interface ThemeService {
  getCSSVar(name: string): string
  getActiveTheme(): string
  onDidChangeTheme(callback: (themeId: string) => void): Disposable
}

export class ThemeManager implements ThemeService {
  applyTheme(themeId: string): void
  getCSSVar(name: string): string        // Legge variabile CSS via getComputedStyle
  getActiveTheme(): string               // Restituisce tema corrente
  onDidChangeTheme(cb): Disposable       // Iscrizione a cambi tema
  registerThemeUI(theme): void           // Registra tema estensione con uiColors
  unregisterThemeUI(themeId): void       // Rimuove tema estensione
  generateThemeCSS(theme): string        // Genera CSS `[data-theme="id"] { --vars }`
  getAllUIThemes(): ThemeUIDefinition[]  // Tutti i temi UI registrati
}

export const themeManager: ThemeManager  // Singleton pre-instanziato
```

`registerThemeUI()` genera uno `<style>` nel `<head>` con regole `[data-theme="tema-id"] { --variabili }`. Al cambio tema, l'attributo `data-theme` sull'`<html>` fa scattare la cascata CSS che applica automaticamente le variabili del tema selezionato.

### Sistema Tema: Extension Themes con uiColors

Le estensioni possono registrare temi completi (Monaco + UI). Oltre ai colori Monaco e token, possono specificare `uiColors` per personalizzare l'interfaccia:

```typescript
interface RegisteredTheme {
  id: string           // Identificativo unico (es. "my-extension-dark")
  label: string        // Nome mostrato nelle impostazioni
  type: 'dark' | 'light'
  colors?: Record<string, string>           // Colori Monaco Editor
  tokenColors?: Array<{                      // Colori syntax token
    scope: string | string[]
    settings: { foreground?: string; fontStyle?: string }
  }>
  uiColors?: Record<string, string>          // Colori UI (--bg-primary, --text-primary, etc.)
}
```

**Cosa succede quando un'estensione registra un tema con `uiColors`:**
1. `ExtensionHost.registerTheme()` salva il tema nella mappa `themes`
2. App.tsx chiama `syncExtensionThemes()` che itera i temi
3. Per ogni tema con `uiColors`, chiama `themeManager.registerThemeUI()`
4. ThemeManager genera CSS: `[data-theme="tema-id"] { --bg-primary: ...; --text-primary: ... }`
5. Lo `<style>` viene iniettato nel `<head>`
6. Quando l'utente seleziona il tema, `applyTheme()` setta `data-theme` su root
7. La cascata CSS applica automaticamente i colori UI

**Esempio: Estensione che registra un tema custom con colori UI**

```javascript
// ~/.config/vistudio/extensions/my-theme/extension.js
function activate(context, vs) {
  const disposable = vs.workspace.registerTheme({
    id: 'my-sunset-theme',
    label: 'Sunset Glow',
    type: 'dark',
    colors: {
      'editor.background': '#1a1a2e',
      'editor.foreground': '#e0e0e0',
      'editorCursor.foreground': '#ff6b6b'
    },
    tokenColors: [
      { scope: 'keyword', settings: { foreground: '#ff6b6b' } },
      { scope: 'string', settings: { foreground: '#ffd93d' } },
      { scope: 'comment', settings: { foreground: '#6c757d', fontStyle: 'italic' } }
    ],
    uiColors: {
      'bg-primary': '#1a1a2e',
      'bg-secondary': '#16213e',
      'bg-tertiary': '#0f3460',
      'bg-hover': '#1a1a3e',
      'bg-active': '#e94560',
      'bg-input': '#16213e',
      'text-primary': '#e0e0e0',
      'text-secondary': '#a0a0a0',
      'text-active': '#ffffff',
      'accent': '#e94560',
      'border-primary': '#0f3460',
      'border-secondary': '#1a1a4e'
    }
  })

  context.subscriptions.push(disposable)
}
```

**Esempio: Estensione che reagisce al cambio tema**

```javascript
function activate(context, vs) {
  // Legge variabile CSS corrente
  const bgColor = vs.env.getCSSVar('--bg-primary')
  console.log('Current background:', bgColor)

  // Tema attuale
  const theme = vs.env.getActiveTheme()
  console.log('Active theme:', theme)

  // Si iscrive a cambi futuro del tema
  const disposable = vs.window.onDidChangeTheme((themeId) => {
    const newBg = vs.env.getCSSVar('--bg-primary')
    console.log(`Theme changed to ${themeId}, bg: ${newBg}`)
  })

  context.subscriptions.push(disposable)
}
```

### Tema Chiaro (vs-light-enhanced)

Definito in `EditorPanel.tsx` come `LIGHT_THEME`. Base `vs` con:
- Colori token invertiti rispetto al dark (sfondo bianco, testo nero)
- Bracket highlighting colorato (6 livelli con tonalità scure)
- Selection `#ADD6FF`, line highlight `#E8E8E8`

### xterm.js Dynamic Theme

`TerminalPanel.tsx` legge le CSS variables via `getComputedStyle` al mount:

```typescript
const cssVar = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim()

theme: {
  background: cssVar('--bg-primary') || '#1e1e1e',
  foreground: cssVar('--text-primary') || '#cccccc',
  cursor: cssVar('--text-active') || '#ffffff',
  selectionBackground: cssVar('--bg-active') || '#264f78',
  // ANSI colors rimangono hardcoded (sono colori semantici del terminale)
}
```

### Scrollbar Styling (Themed con CSS variables)

```css
::-webkit-scrollbar { width: 10px; }
::-webkit-scrollbar-track { background: var(--scrollbar-bg); }
::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 5px; }
::-webkit-scrollbar-thumb:hover { background: var(--scrollbar-thumb-hover); }
```

### Fonts

```css
body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
editor { fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace"; }
```

---

## 🚀 Development Workflow

### Avvio Sviluppo
```bash
./run.sh
# Oppure:
npm run electron:dev
```

**Cosa fa run.sh:**
1. Kill processi esistenti (node, vite, electron)
2. Kill anything su porta 5173
3. Avvia Vite dev server su porta 5173
4. Attende che Vite sia ready
5. Avvia Electron con `VITE_DEV_SERVER_URL=http://localhost:5173`
6. Electron carica URL dev server

### Hot Reload
- **React components**: Vite HMR aggiorna automaticamente
- **Electron main/preload**: richiede restart (vite-plugin-electron rebuild)

### Debug
- **DevTools**: aperte automaticamente in dev mode (`mainWindow.webContents.openDevTools()`)
- **Console logs**: `[RENDERER]` prefix per logs dal renderer
- **Main process logs**: visibili nel terminale e in `/tmp/vistudio.log`
- **Extension logs**: `~/.config/vistudio/extension-debug.log`
- **Runtime errors**: `~/.config/vistudio/runtime-error.log`

---

## 🛠️ Common Tasks

### Aggiungere un nuovo menu item
1. Aggiungi in `menuTemplate` in `MenuBar.tsx`
2. Aggiungi case in `handleMenuAction` in `App.tsx`
3. Implementa handler function

### Aggiungere un nuovo IPC handler
1. Aggiungi `ipcMain.handle()` in `electron/main.ts`
2. Esponi in `electron/preload.ts` via `contextBridge`
3. Aggiungi tipo in `src/types/index.ts`
4. Usa in React component via `window.electronAPI`

### Aggiungere un nuovo componente
1. Crea file in `src/components/`
2. Esporta come default
3. Importa in `App.tsx` o componente padre
4. Aggiungi nel JSX tree

### Aggiungere un'estensione
1. Crea cartella in `~/.config/vistudio/extensions/`
2. Aggiungi `extension.json` (manifest)
3. Aggiungi `extension.js` (codice)
4. Riavvia ViStudio o usa "Refresh Extensions"

---

## ⚠️ Known Issues & Workarounds

### Electron Binary
- Electron è installato a livello di sistema (`/usr/bin/electron`)
- `node_modules/electron/dist/` contiene symlink/copie dei binari
- Se Electron non si avvia: reinstalla con `pkexec pacman -S electron`

### GPU Issues
- Hardware acceleration disabilitata per evitare crash GPU
- Command line switches in `main.ts`:
  ```typescript
  app.commandLine.appendSwitch('no-sandbox')
  app.commandLine.appendSwitch('disable-gpu-compositing')
  app.commandLine.appendSwitch('enable-unsafe-webgpu')
  app.commandLine.appendSwitch('disable-dev-shm-usage')
  app.commandLine.appendSwitch('ozone-platform-hint', 'auto')
  app.disableHardwareAcceleration()
  ```

### Port Conflicts
- Vite usa porta 5173
- Se occupata, Vite usa porta successiva (5174, etc.)
- `run.sh` kill processi esistenti prima di avviare

### Drag & Drop
- Il drag & drop usa `dataTransfer.setData` per passare il percorso
- `setTimeout(() => setDraggedNode(node), 0)` previene re-render prematuri che cancellano il drag
- `WebkitUserDrag: 'element'` abilita il drag nativo su WebKit/Electron
- `pointerEvents: 'none'` su icone/frecce previene interferenze con il drag
- `onRefresh()` deve essere chiamato dopo `fs.move` per aggiornare l'albero

### Terminal & Native Modules
- `node-pty` (modulo nativo) fallisce la compilazione con Vite/Electron system-installed
- **Workaround**: Usato `child_process` + comando `script` (Linux) per creare pseudo-terminale
- Shell forzata a `/bin/bash` per evitare problemi di input con `fish`
- `process` non è disponibile nel renderer (contextIsolation=true), usare fallback nel main process

### Sidebar Resize
- Sidebar ridimensionabile tramite drag handle (4px) tra sidebar e editor
- Range: 150px - 600px
- Implementato con `useRef` + listener globali in `useEffect`
- Transizione disabilitata quando sidebar aperta per resize fluido

### Extension Sandbox
- Le estensioni sono eseguite con `new Function()` - nessun accesso a moduli Node.js
- Non possono usare `require()`, `process`, `window`, `fetch`
- Possono solo usare le API esposte tramite `vs` (ExtensionAPI)
- Il codice viene trasformato: `module.exports = function activate` → `function __ext_activate`

---

## 📝 Code Conventions

### React Components
- Functional components con TypeScript
- `React.createElement()` invece di JSX (per compatibilità)
- Props interfaces definite
- useCallback/useMemo per performance
- useRef per evitare stale closures

### Naming
- Components: PascalCase (`ProjectExplorer`)
- Files: PascalCase per components, camelCase per altri
- Handlers: `handle` prefix (`handleOpenFolder`)
- States: camelCase (`folderPath`, `fileContent`)

### Error Handling
- Try/catch intorno a chiamate async
- Console.error per errori
- Graceful degradation (fallback UI)
- Global error handler in `main.tsx` → scrive su `runtime-error.log`

---

## 🔮 Feature Status

### ✅ Fase 3: Tab Multipli (COMPLETATO)
- Array di file aperti
- Tab bar component
- Switch tra tab
- Stato "modificato" (dot sul tab)
- Drag & Drop per riordinare

### ✅ Fase 4: Extension API (COMPLETATO)
- Extension host sandboxato
- API per: syntax highlighting, autocompletamento, compilatori
- Formato estensione: cartella con `extension.json` + `extension.js`
- Supporto multi-lingua (C, JS, TS, Python, ecc.)
- Extensions panel per gestione

### ✅ Fase 5: Terminale Integrato (COMPLETATO)
- xterm.js per terminale
- Panel in basso
- Comandi build/run
- Pseudo-terminale con `script`

### ✅ Fase 6: Command Palette (COMPLETATO)
- Ctrl+Shift+P per aprire
- Fuzzy search comandi
- Quick open file (Ctrl+P)
- Integrazione comandi estensioni
- Navigazione con frecce ↑↓
- Shortcut visualizzati accanto ai comandi

### ✅ Fase 7: Ricerca Globale (COMPLETATO)
- Ctrl+Shift+F per aprire
- Ricerca testo in tutti i file
- Replace in files (singolo e all)
- Preview risultati
- Esclusioni (node_modules, .git, ecc.)
- Regex support
- Match case / whole word
- File name search (fuzzy match)

### ✅ Fase 8: Console Panel (COMPLETATO)
- Intercettazione console.log/warn/error/info
- Filtri per livello
- Search nei log
- Auto-scroll
- Clear button

### ✅ Fase 9: Font Bundling (COMPLETATO)
- Inter font per UI
- JetBrains Mono per editor
- Cross-platform consistency

### ✅ Fase 10: Sidebar Resize & Keyboard Shortcuts (COMPLETATO)
- Sidebar ridimensionabile (150px - 600px)
- Explorer horizontal scroll
- Keyboard shortcuts: Ctrl+N, Ctrl+O, Ctrl+Shift+O, Ctrl+S, Ctrl+Shift+S, Ctrl+B, Ctrl+`, Ctrl+Shift+U, Ctrl+Shift+F, Ctrl+Shift+P, Ctrl+P, Escape
- Menu Electron senza acceleratori (gestiti dal renderer)
- `handleMenuActionRef` per evitare TDZ errors

### ✅ Fase 11: New Project Modal (COMPLETATO)
- Modale con campo nome progetto e parent directory
- Pulsante Browse per selezionare cartella
- Crea struttura progetto completa

### ✅ Fase 12: Project Templates (COMPLETATO)
- Estensioni registrano template via `vs.workspace.registerProjectTemplate()`
- Dropdown nel modale "New Project" per selezionare template
- Template = { id, name, language, files: Record<string, string> }
- File del template scritti automaticamente alla creazione
- Deregistrazione automatica alla disattivazione

### ✅ Fase 13: Settings Panel (COMPLETATO)
- Pannello laterale destro "Settings" accessibile da View > Settings o `Ctrl+,`
- Implementato come modale con Apply/Cancel (modifiche staged)
- Impostazioni salvate in `~/.config/vistudio/settings.json`
- Default settings definiti in `electron/main.ts` come `DEFAULT_SETTINGS`
- Settings applicati in tempo reale a Monaco Editor (font size, tab size, etc.)
- Gruppi: Editor, Files, Workbench
- Tipi di input: number, boolean, select, string
- Menu item in View + builtin command
- Escape per chiudere

### ✅ Fase 14: CSS Variables UI-Wide Theming (COMPLETATO)
- CSS custom properties per tutti i colori UI (~30 variabili)
- Tema dark su `:root` di default, tema light su `[data-theme="vs-light-enhanced"]`
- `data-theme` su `<html>` attiva la cascata CSS
- `var(--xxx)` usato in tutti i componenti React (inline styles)
- ThemeManager singleton per applicare temi e gestire injection CSS
- xterm.js theme dinamico (legge CSS vars via getComputedStyle)
- Scrollbar themate con CSS variables

### ✅ Fase 15: Extension Theme API (COMPLETATO)
- `vs.workspace.registerTheme()` per registrare temi completi (Monaco + UI)
- `uiColors` per personalizzare colori interfaccia
- ThemeManager.injectUI() genera `<style>` con `[data-theme="id"] { --vars }`
- Tema estensione appare nel dropdown Settings > Workbench > Color Theme
- Deregistrazione automatica alla disattivazione dell'estensione

### ✅ Fase 16: ThemeService (Dependency Injection) (COMPLETATO)
- `ThemeService` interface: getCSSVar, getActiveTheme, onDidChangeTheme
- `ThemeManager` implementa `ThemeService`
- `ExtensionAPIImpl` riceve `ThemeService` via costruttore (dependency injection)
- `vs.env.getCSSVar()` — estensioni leggono variabili CSS
- `vs.env.getActiveTheme()` — estensioni ottengono tema corrente
- `vs.window.onDidChangeTheme()` — estensioni reagiscono a cambi tema
- ThemeManager emette eventi (array di callback, nessun framework)

### ✅ Fase 17: Error Boundary & Stabilità (COMPLETATO)
- `ErrorBoundary.tsx` component classe che wrappa App
- Cattura errori React, mostra UI amichevole con "Try Again"
- Regex safe in applyCustomHighlighting (max iterazioni, max decorazioni)
- mountedRef in EditorPanel per prevenire setState su componente smontato
- Timeout tracciati e cleanup in useEffect return
- openFileInTab senza setActiveTabId dentro setTabs (side-effect safe)
- Extension loading wrappato in try/catch
- Ref sync unificato in un solo useEffect

---

## 📞 Quick Reference

| Task | File | Function/Component |
|------|------|-------------------|
| Apri cartella | App.tsx | handleOpenFolder |
| Crea progetto | electron/main.ts | ipcMain.handle('project:create') |
| Leggi file | electron/main.ts | ipcMain.handle('fs:readFile') |
| Sposta file | electron/main.ts | ipcMain.handle('fs:move') |
| Crea cartella | electron/main.ts | ipcMain.handle('folder:create') |
| Crea file | electron/main.ts | ipcMain.handle('file:create') |
| Avvia terminale | electron/main.ts | ipcMain.handle('terminal:start') |
| Scrivi terminale | electron/main.ts | ipcMain.handle('terminal:write') |
| Menu actions | MenuBar.tsx | menuTemplate |
| File tree | ProjectExplorer.tsx | loadDirectory, FileTreeItem, handleDrop |
| Tab bar | TabBar.tsx | TabBar component |
| Editor | EditorPanel.tsx | Monaco Editor wrapper |
| Terminal | TerminalPanel.tsx | xterm.js wrapper |
| Status bar | StatusBar.tsx | Info display |
| Command palette | CommandPalette.tsx | fuzzyMatch, CommandPalette |
| Search panel | SearchPanel.tsx | searchInFile, collectFiles, handleReplace |
| Extensions panel | ExtensionsPanel.tsx | ExtensionsPanel |
| Console panel | ConsolePanel.tsx | ConsolePanel |
| Settings panel | SettingsPanel.tsx | SettingsPanel with Apply/Cancel |
| Error boundary | ErrorBoundary.tsx | ErrorBoundary class component |
| Git panel | GitPanel.tsx | GitPanel |
| Extension host | core/ExtensionHost.ts | ExtensionHost class |
| Extension API | core/ExtensionAPI.ts | ExtensionAPIImpl class |
| Theme manager | core/ThemeManager.ts | ThemeManager, ThemeService |
| Theme service DI | core/ThemeManager.ts | ThemeService interface (getCSSVar, getActiveTheme, onDidChangeTheme) |
| File icons | FileIcon.tsx | extToIcon map, getFileIcon |
| Settings IPC | electron/main.ts | ipcMain.handle('settings:load/save') |
| Settings types | src/types/index.ts | EditorSettings, SettingsKey |
| Extension types | src/types/extension.ts | Extension interfaces, RegisteredTheme |
| Styles | src/styles/global.css | CSS variables, fonts |
| Config | vite.config.ts | Vite + Electron setup |
| Launch | run.sh | Development script |

---

## 🧪 Testing Checklist

Quando modifichi il codice, verifica:
- [ ] App si avvia senza errori (`./run.sh`)
- [ ] Menu bar funziona (click, dropdown)
- [ ] Open Folder carica file nell'explorer
- [ ] New Project crea cartella con .vistproj
- [ ] Click su file apre nell'editor
- [ ] Monaco Editor mostra syntax highlighting
- [ ] Save/Save As funzionano
- [ ] Scrollbar è scura
- [ ] Cartella radice è collassabile
- [ ] Drag & drop sposta file/cartelle correttamente
- [ ] Explorer si aggiorna dopo drag & drop
- [ ] Pulsanti 📄+ e 📁+ creano file/cartelle
- [ ] Modali input funzionano correttamente
- [ ] **Tab Multipli**: Apertura, switch, chiusura, riordino funzionano
- [ ] **Stato Modificato**: Pallino bianco appare su modifiche non salvate
- [ ] **Terminale**: Si apre, mostra prompt, accetta input, esegue comandi
- [ ] **Terminale**: Usa bash correttamente (no fish issues)
  - [ ] **Command Palette**: Ctrl+Shift+P apre, fuzzy search funziona, Ctrl+P quick open file
  - [ ] **Search Panel**: Ctrl+Shift+F apre, ricerca contenuto e nome file, replace funziona
  - [ ] **Extensions Panel**: Toggle activate/deactivate, install, delete funzionano
  - [ ] **Console Panel**: Log intercettati, filtri, auto-scroll, clear funzionano
- [ ] **Font**: Inter per UI, JetBrains Mono per editor
- [ ] **Sidebar Resize**: Drag handle funziona, range 150px-600px
- [ ] **Explorer Horizontal Scroll**: Scrollbar appare quando nomi troppo lunghi
- [ ] **Keyboard Shortcuts**: Ctrl+B, Ctrl+N, Ctrl+O, Ctrl+S funzionano
- [ ] **New Project Modal**: Nome progetto modificabile, Browse directory funziona
- [ ] **Project Templates**: Dropdown template appare, template registrati da estensioni, file creati correttamente
- [ ] **CSS Variables**: Tutti i colori UI usano `var(--xxx)`, nessun hardcoded color
- [ ] **Tema Chiaro**: Settings > Color Theme > vs-light-enhanced, tutta UI si adatta
- [ ] **Settings Apply/Cancel**: Apply salva, Cancel non salva
- [ ] **Extension Themes**: Tema registrato da estensione appare nel dropdown e funziona
- [ ] **Theme API Extension**: `vs.env.getCSSVar()`, `vs.env.getActiveTheme()`, `vs.window.onDidChangeTheme()` funzionano
- [ ] **Error Boundary**: Errore React mostra UI "Try Again" invece di white screen
- [ ] DevTools non mostrano errori

---

*Ultimo aggiornamento: 2026-05-26*
*Versione: 0.9.0 (Settings Panel, UI-Wide Theming, Extension Theme API, ThemeService DI, Error Boundary)*
