import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, statSync, readdirSync, existsSync, mkdirSync, renameSync, rmSync } from 'fs'
import { spawn, execSync } from 'child_process'
import { autoUpdater } from 'electron-updater'

// GPU acceleration - Skylake GT2 via Mesa 26
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-dev-shm-usage')
app.commandLine.appendSwitch('enable-gpu-rasterization')
app.commandLine.appendSwitch('enable-native-gpu-memory-buffers')
app.commandLine.appendSwitch('ignore-gpu-blocklist')
app.commandLine.appendSwitch('ozone-platform-hint', 'auto')

let mainWindow: BrowserWindow | null = null

function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        { label: 'New File', click: () => mainWindow?.webContents.send('menu:new-file') },
        { label: 'Open File', click: () => mainWindow?.webContents.send('menu:open-file') },
        { label: 'Open Folder', click: () => mainWindow?.webContents.send('menu:open-folder') },
        { type: 'separator' },
        { label: 'Save', click: () => mainWindow?.webContents.send('menu:save') },
        { label: 'Save As', click: () => mainWindow?.webContents.send('menu:save-as') },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { type: 'separator' },
        { label: 'Find', click: () => mainWindow?.webContents.send('menu:find') },
        { label: 'Replace', click: () => mainWindow?.webContents.send('menu:replace') }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Sidebar', click: () => mainWindow?.webContents.send('menu:toggle-sidebar') },
        { label: 'Toggle Terminal', click: () => mainWindow?.webContents.send('menu:toggle-terminal') },
        { label: 'Toggle Console', click: () => mainWindow?.webContents.send('menu:toggle-console') },
        { label: 'Run Debug Tests', click: () => mainWindow?.webContents.send('menu:debug-test-all') },
        { label: 'Command Palette', click: () => mainWindow?.webContents.send('menu:command-palette') },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'About ViStudio', click: () => dialog.showMessageBox({ title: 'ViStudio', message: 'ViStudio IDE v0.1.0', detail: 'A modern, extensible code editor' }) }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'ViStudio',
    frame: false,
    autoHideMenuBar: true,
    backgroundColor: '#1e1e1e',
    show: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
      sandbox: false
    }
  })

  mainWindow.setMenuBarVisibility(false)

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription)
  })

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully')
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    console.log('Loading dev server:', process.env.VITE_DEV_SERVER_URL)
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    console.log('Loading production build')
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

ipcMain.handle('app:getDataPath', () => app.getPath('userData'))

ipcMain.on('window:minimize', () => mainWindow?.minimize())

ipcMain.on('window:maximize', () => mainWindow?.isMaximized() ? mainWindow?.unmaximize() : mainWindow?.maximize())

ipcMain.on('window:close', () => mainWindow?.close())

// IPC Handlers
ipcMain.handle('fs:readFile', async (_, filePath: string) => {
  try {
    const content = readFileSync(filePath, 'utf-8')
    return { success: true, content }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('fs:writeFile', async (_, filePath: string, content: string) => {
  try {
    writeFileSync(filePath, content, 'utf-8')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('fs:readDir', async (_, dirPath: string) => {
  try {
    const items = readdirSync(dirPath, { withFileTypes: true })
    const result = items.map(item => ({
      name: item.name,
      isDirectory: item.isDirectory(),
      path: join(dirPath, item.name)
    }))
    return { success: true, items: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('fs:stat', async (_, filePath: string) => {
  try {
    const stats = statSync(filePath)
    return { success: true, stats: { isDirectory: stats.isDirectory(), size: stats.size, modified: stats.mtime } }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('fs:exists', async (_, filePath: string) => {
  return existsSync(filePath)
})

ipcMain.handle('fs:move', async (_, sourcePath: string, destPath: string) => {
  try {
    if (!existsSync(sourcePath)) {
      return { success: false, error: 'Source file not found' }
    }
    if (existsSync(destPath)) {
      return { success: false, error: 'Destination already exists' }
    }
    renameSync(sourcePath, destPath)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [{ name: 'All Files', extensions: ['*'] }]
  })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('dialog:saveFile', async (_, defaultPath?: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath,
    filters: [{ name: 'All Files', extensions: ['*'] }]
  })
  return result.canceled ? null : result.filePath
})

ipcMain.handle('dialog:openProject', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [{ name: 'ViStudio Project', extensions: ['vistproj'] }]
  })
  return result.canceled ? null : result.filePaths[0]
})

function getCompilerConfig(language?: string): { command: string; args: string[] } {
  switch (language) {
    case 'c': return { command: 'gcc', args: ['-Wall', '-Wextra', '-std=c11', '-o', 'main', 'src/main.c'] }
    case 'cpp': return { command: 'g++', args: ['-Wall', '-Wextra', '-std=c++17', '-Iinclude', '-o', 'main', 'src/main.cpp'] }
    default: return { command: 'tsc', args: ['--outDir', './dist', '--sourceMap'] }
  }
}

ipcMain.handle('project:create', async (_, projectName: string, parentDir: string, templateFiles?: Record<string, string>, language?: string, entryPoint?: string) => {
  try {
    if (!projectName) return { success: false, error: 'Project name is required' }

    const projectDir = join(parentDir, projectName)
    if (existsSync(projectDir)) {
      return { success: false, error: `Folder "${projectName}" already exists` }
    }

    mkdirSync(projectDir, { recursive: true })
    mkdirSync(join(projectDir, 'src'), { recursive: true })

    const vistprojContent = JSON.stringify({
      name: projectName,
      version: '1.0.0',
      description: `${projectName} - Created with ViStudio`,
      language: language || 'typescript',
      compiler: getCompilerConfig(language),
      entryPoint: entryPoint || 'src/main.ts',
      extensions: [],
      settings: {
        tabSize: 2,
        formatOnSave: true,
        theme: 'vs-dark'
      },
      exclude: ['node_modules', 'dist', '.git']
    }, null, 2)

    writeFileSync(join(projectDir, '.vistproj'), vistprojContent, 'utf-8')

    if (templateFiles && Object.keys(templateFiles).length > 0) {
      for (const [relativePath, content] of Object.entries(templateFiles)) {
        const fullPath = join(projectDir, relativePath)
        const dir = fullPath.substring(0, fullPath.lastIndexOf('/'))
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
        writeFileSync(fullPath, content, 'utf-8')
      }
    } else {
      writeFileSync(join(projectDir, 'src', 'main.ts'), '// Main entry point\n', 'utf-8')
    }

    return { success: true, projectDir }
  } catch (error: any) {
    console.error('Failed to create project:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('folder:create', async (_, folderName: string, parentPath?: string) => {
  try {
    if (!folderName) return null

    const targetPath = parentPath || (await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
      title: 'Select parent folder'
    })).filePaths[0]

    if (!targetPath) return null

    const newFolderPath = join(targetPath, folderName)
    if (existsSync(newFolderPath)) {
      await dialog.showMessageBox(mainWindow!, {
        type: 'error',
        title: 'Error',
        message: `Folder "${folderName}" already exists`
      })
      return null
    }

    mkdirSync(newFolderPath, { recursive: true })
    return newFolderPath
  } catch (error: any) {
    console.error('Failed to create folder:', error)
    return null
  }
})

ipcMain.handle('file:create', async (_, fileName: string, parentPath: string) => {
  try {
    if (!fileName || !parentPath) return null
    const newFilePath = join(parentPath, fileName)
    if (existsSync(newFilePath)) {
      await dialog.showMessageBox(mainWindow!, {
        type: 'error',
        title: 'Error',
        message: `File "${fileName}" already exists`
      })
      return null
    }
    writeFileSync(newFilePath, '', 'utf-8')
    return newFilePath
  } catch (error: any) {
    console.error('Failed to create file:', error)
    return null
  }
})

// Terminal IPC Handlers
let terminalProcess: ReturnType<typeof spawn> | null = null

ipcMain.handle('terminal:start', async (_, cwd: string) => {
  try {
    console.log('[TERMINAL] ========== STARTING TERMINAL ==========')
    console.log('[TERMINAL] CWD:', cwd)
    console.log('[TERMINAL] Shell:', process.env.SHELL)
    
    if (terminalProcess) {
      console.log('[TERMINAL] Killing existing process')
      terminalProcess.kill()
    }

    const shell = process.platform === 'win32' ? 'powershell.exe' : '/bin/bash'
    console.log('[TERMINAL] Using shell:', shell)
    
    // Use 'script' to create a pseudo-terminal on Linux/Mac
    const args = process.platform === 'win32' 
      ? [] 
      : ['-q', '-c', shell, '/dev/null']
    
    const command = process.platform === 'win32' ? shell : 'script'
    console.log('[TERMINAL] Command:', command, 'Args:', args)

    terminalProcess = spawn(command, args, {
      cwd: cwd || process.env.HOME,
      env: { ...process.env, TERM: 'xterm-256color' },
      stdio: ['pipe', 'pipe', 'pipe']
    })

    console.log('[TERMINAL] Process spawned with PID:', terminalProcess.pid)

    terminalProcess.stdout?.on('data', (data) => {
      const text = data.toString()
      console.log('[TERMINAL STDOUT]', JSON.stringify(text))
      mainWindow?.webContents.send('terminal:data', text)
    })

    terminalProcess.stderr?.on('data', (data) => {
      const text = data.toString()
      console.log('[TERMINAL STDERR]', JSON.stringify(text))
      mainWindow?.webContents.send('terminal:data', text)
    })

    terminalProcess.on('exit', (code) => {
      console.log('[TERMINAL] Process exited with code:', code)
      mainWindow?.webContents.send('terminal:exit', code)
      terminalProcess = null
    })

    terminalProcess.on('error', (err) => {
      console.error('[TERMINAL ERROR]', err)
      mainWindow?.webContents.send('terminal:data', `\r\nError: ${err.message}\r\n`)
    })

    // Send initial welcome message to test output
    setTimeout(() => {
      if (terminalProcess) {
        console.log('[TERMINAL] Sending initial prompt test')
        mainWindow?.webContents.send('terminal:data', 'ViStudio Terminal Ready\r\n$ ')
      }
    }, 500)

    return { success: true }
  } catch (error: any) {
    console.error('[TERMINAL] Failed to start:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('terminal:write', async (_, data: string) => {
  console.log('[TERMINAL WRITE]', JSON.stringify(data))
  if (terminalProcess && terminalProcess.stdin) {
    terminalProcess.stdin.write(data)
    console.log('[TERMINAL] Data written to stdin')
  } else {
    console.log('[TERMINAL] No process or stdin available')
  }
  return { success: true }
})

ipcMain.handle('terminal:resize', async () => {
  return { success: true }
})

// Logger IPC for debugging renderer issues
ipcMain.handle('log', async (_, message: string) => {
  console.log('[RENDERER LOG]', message)
  return { success: true }
})

// Extension IPC Handlers
const extensionPaths: Map<string, string> = new Map()

ipcMain.handle('extension:load', async (_, extensionPath: string) => {
  try {
    const manifestPath = join(extensionPath, 'extension.json')
    if (!existsSync(manifestPath)) {
      return { success: false, error: 'extension.json not found' }
    }
    const manifestContent = readFileSync(manifestPath, 'utf-8')
    const manifest = JSON.parse(manifestContent)
    const id = manifest.name || extensionPath.split('/').pop()
    extensionPaths.set(id, extensionPath)
    return { success: true, id, manifest }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('extension:activate', async (_, extensionId: string) => {
  const path = extensionPaths.get(extensionId)
  if (!path) {
    return { success: false, error: 'Extension not found' }
  }
  return { success: true, id: extensionId }
})

ipcMain.handle('extension:deactivate', async (_, extensionId: string) => {
  extensionPaths.delete(extensionId)
  return { success: true }
})

ipcMain.handle('extension:list', async () => {
  const extensions = Array.from(extensionPaths.entries()).map(([id, path]) => ({ id, path }))
  return { success: true, extensions }
})

ipcMain.handle('extension:loadDirectory', async (_, extensionsDir: string) => {
  try {
    if (!existsSync(extensionsDir)) {
      return { success: false, error: 'Directory not found' }
    }
    const items = readdirSync(extensionsDir, { withFileTypes: true })
    let loadedCount = 0
    for (const item of items) {
      if (item.isDirectory()) {
        const extPath = join(extensionsDir, item.name)
        const manifestPath = join(extPath, 'extension.json')
        if (existsSync(manifestPath)) {
          const manifestContent = readFileSync(manifestPath, 'utf-8')
          const manifest = JSON.parse(manifestContent)
          const id = manifest.name || item.name
          extensionPaths.set(id, extPath)
          loadedCount++
        }
      }
    }
    return { success: true, loadedCount }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('extension:delete', async (_, extensionPath: string) => {
  try {
    if (!existsSync(extensionPath)) {
      return { success: false, error: 'Extension not found' }
    }
    rmSync(extensionPath, { recursive: true, force: true })
    for (const [id, path] of extensionPaths.entries()) {
      if (path === extensionPath) {
        extensionPaths.delete(id)
        break
      }
    }
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Settings IPC Handlers
const SETTINGS_PATH = join(app.getPath('userData'), 'settings.json')

const DEFAULT_SETTINGS: Record<string, any> = {
  'editor.fontSize': 14,
  'editor.fontFamily': "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
  'editor.tabSize': 2,
  'editor.wordWrap': 'off',
  'editor.lineNumbers': 'on',
  'editor.minimap': true,
  'editor.fontLigatures': true,
  'editor.smoothScrolling': true,
  'editor.cursorBlinking': 'smooth',
  'editor.renderWhitespace': 'selection',
  'files.autoSave': 'off',
  'files.autoSaveDelay': 1000,
  'workbench.colorTheme': 'vs-dark-enhanced',
  'editor.bracketPairColorization': true,
  'editor.bracketPairGuides': true,
  'editor.indentationGuides': true,
  'editor.scrollBeyondLastLine': true,
  'update.checkOnStartup': true
}

ipcMain.handle('settings:load', async () => {
  try {
    if (!existsSync(SETTINGS_PATH)) {
      writeFileSync(SETTINGS_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8')
      return { success: true, settings: DEFAULT_SETTINGS }
    }
    const content = readFileSync(SETTINGS_PATH, 'utf-8')
    const saved = JSON.parse(content)
    const merged = { ...DEFAULT_SETTINGS, ...saved }
    return { success: true, settings: merged }
  } catch (error: any) {
    return { success: false, settings: DEFAULT_SETTINGS, error: error.message }
  }
})

ipcMain.handle('settings:save', async (_, partial: Record<string, any>) => {
  try {
    let current: Record<string, any> = { ...DEFAULT_SETTINGS }
    if (existsSync(SETTINGS_PATH)) {
      const content = readFileSync(SETTINGS_PATH, 'utf-8')
      current = { ...current, ...JSON.parse(content) }
    }
    const merged = { ...current, ...partial }
    writeFileSync(SETTINGS_PATH, JSON.stringify(merged, null, 2), 'utf-8')
    return { success: true, settings: merged }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Git IPC Handlers
function runGit(dir: string, args: string[]): { success: boolean; stdout?: string; stderr?: string; error?: string } {
  try {
    const stdout = execSync(`git ${args.join(' ')}`, { cwd: dir, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
    return { success: true, stdout: stdout.trim() }
  } catch (err: any) {
    return { success: false, stdout: err.stdout?.trim() || '', stderr: err.stderr?.trim() || '', error: err.message }
  }
}

function runGitSpawn(dir: string, args: string[]): Promise<{ success: boolean; stdout?: string; stderr?: string; error?: string }> {
  return new Promise(resolve => {
    try {
      const child = spawn('git', args, { cwd: dir, stdio: ['pipe', 'pipe', 'pipe'] })
      let stdout = '', stderr = ''
      child.stdout?.on('data', (d: Buffer) => { stdout += d.toString() })
      child.stderr?.on('data', (d: Buffer) => { stderr += d.toString() })
      child.on('close', (code) => {
        if (code === 0) resolve({ success: true, stdout: stdout.trim() })
        else resolve({ success: false, stdout: stdout.trim(), stderr: stderr.trim(), error: stderr.trim() })
      })
      child.on('error', (err) => resolve({ success: false, error: err.message }))
    } catch (err: any) {
      resolve({ success: false, error: err.message })
    }
  })
}

ipcMain.handle('git:status', async (_, dir: string) => {
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository', isRepo: false }
  const r = runGit(dir, ['status', '--porcelain', '-u'])
  if (!r.success) return { ...r, isRepo: true }
  const files: Array<{ path: string; staged: string; working: string }> = r.stdout!.split('\n').filter(Boolean).map(line => ({
    path: line.slice(3),
    staged: line[0] === ' ' ? '' : line[0],
    working: line[1] === ' ' ? '' : line[1]
  }))
  return { success: true, files, isRepo: true }
})

ipcMain.handle('git:branch', async (_, dir: string) => {
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository', isRepo: false }
  const r = runGit(dir, ['branch', '--show-current'])
  if (!r.success) {
    const all = runGit(dir, ['rev-parse', '--abbrev-ref', 'HEAD'])
    return { ...r, branch: all.stdout || 'HEAD', isRepo: true }
  }
  return { ...r, branch: r.stdout || 'main', isRepo: true }
})

ipcMain.handle('git:log', async (_, dir: string, count: number = 20) => {
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository', isRepo: false }
  const r = runGit(dir, ['log', `--max-count=${count}`, '--format=%h|%an|%ar|%s', '--no-color'])
  if (!r.success) return { ...r, isRepo: true }
  const commits = r.stdout!.split('\n').filter(Boolean).map(line => {
    const [hash, author, date, ...msgParts] = line.split('|')
    return { hash, author, date, message: msgParts.join('|') }
  })
  return { success: true, commits, isRepo: true }
})

ipcMain.handle('git:add', async (_, dir: string, filePath: string) => {
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository' }
  return runGit(dir, ['add', filePath])
})

ipcMain.handle('git:unstage', async (_, dir: string, filePath: string) => {
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository' }
  return runGit(dir, ['reset', 'HEAD', '--', filePath])
})

ipcMain.handle('git:commit', async (_, dir: string, message: string) => {
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository' }
  return runGitSpawn(dir, ['commit', '-m', message])
})

ipcMain.handle('git:diff', async (_, dir: string, filePath?: string) => {
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository', isRepo: false }
  const args = ['diff', '--no-color']
  if (filePath) args.push('--', filePath)
  return { ...runGit(dir, args), isRepo: true }
})

ipcMain.handle('git:diffStaged', async (_, dir: string, filePath?: string) => {
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository', isRepo: false }
  const args = ['diff', '--staged', '--no-color']
  if (filePath) args.push('--', filePath)
  return { ...runGit(dir, args), isRepo: true }
})

ipcMain.handle('git:init', async (_, dir: string) => {
  return runGit(dir, ['init'])
})

ipcMain.handle('git:checkout', async (_, dir: string, branch: string) => {
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository' }
  return runGit(dir, ['checkout', branch])
})

ipcMain.handle('git:pull', async (_, dir: string) => {
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository' }
  return runGit(dir, ['pull'])
})

ipcMain.handle('git:push', async (_, dir: string) => {
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository' }
  return runGit(dir, ['push'])
})

ipcMain.handle('git:allBranches', async (_, dir: string) => {
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository', isRepo: false }
  return { ...runGit(dir, ['branch', '-a']), isRepo: true }
})

// Auto-updater configuration
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'regalf',
  repo: 'vistudio',
  private: false
})

function setupAutoUpdater() {
  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update:available', info)
  })

  autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('update:not-available')
  })

  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('update:download-progress', progress)
  })

  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update:downloaded')
  })

  autoUpdater.on('error', (err) => {
    console.error('[AUTO-UPDATE] Error:', err.message)
    mainWindow?.webContents.send('update:error', err.message)
  })
}

const UPDATE_TIMEOUT = 10000 // 10 second timeout for update checks

async function checkForUpdatesWithTimeout(): Promise<void> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.error('[AUTO-UPDATE] Timeout - no response from update server')
      mainWindow?.webContents.send('update:error', 'Update check timed out. Check your internet connection.')
      resolve()
    }, UPDATE_TIMEOUT)

    const cleanup = () => {
      clearTimeout(timeout)
      resolve()
    }

    autoUpdater.once('update-available', cleanup)
    autoUpdater.once('update-not-available', cleanup)
    autoUpdater.once('error', cleanup)

    autoUpdater.checkForUpdates().catch((err) => {
      console.error('[AUTO-UPDATE] checkForUpdates failed:', err.message)
      mainWindow?.webContents.send('update:error', err.message)
      clearTimeout(timeout)
      resolve()
    })
  })
}

ipcMain.handle('update:check', async () => {
  try {
    await checkForUpdatesWithTimeout()
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('update:download', async () => {
  try {
    autoUpdater.downloadUpdate()
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('update:cancel', async () => {
  try {
    ;(autoUpdater as any).cancel()
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('update:install', async () => {
  try {
    setImmediate(() => autoUpdater.quitAndInstall())
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

app.whenReady().then(() => {
  createMenu()
  createWindow()
  setupAutoUpdater()

  // Check for updates after a short delay (honours setting)
  setTimeout(() => {
    try {
      if (existsSync(SETTINGS_PATH)) {
        const content = readFileSync(SETTINGS_PATH, 'utf-8')
        const saved = JSON.parse(content)
        if (saved['update.checkOnStartup'] === false) return
      }
    } catch (_) {}
    checkForUpdatesWithTimeout().catch(() => {})
  }, 5000)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
