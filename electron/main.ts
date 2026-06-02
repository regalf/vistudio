import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, statSync, readdirSync, existsSync, mkdirSync, renameSync, rmSync, createWriteStream } from 'fs'
import { spawn, execFileSync, execFile } from 'child_process'
import https from 'https'
import { autoUpdater } from 'electron-updater'

// GPU acceleration - Skylake GT2 via Mesa 26
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-dev-shm-usage')
app.commandLine.appendSwitch('enable-gpu-rasterization')
app.commandLine.appendSwitch('enable-native-gpu-memory-buffers')
app.commandLine.appendSwitch('ignore-gpu-blocklist')
app.commandLine.appendSwitch('ozone-platform-hint', 'auto')

// Ensure consistent data dir name across platforms
;(app as any).name = 'ViStudio'

// Ensure consistent data dir name across platforms
;(app as any).name = 'ViStudio'

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
  const isWin = process.platform === 'win32'
  const iconFile = isWin ? 'logo.ico' : 'logo-512.png'
  const iconPath = join(app.getAppPath(), 'public/icons', iconFile)
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'ViStudio',
    icon: iconPath,
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

ipcMain.handle('app:getVersion', () => app.getVersion())
ipcMain.handle('app:getDataPath', () => app.getPath('userData'))

ipcMain.on('window:minimize', () => mainWindow?.minimize())

ipcMain.on('window:maximize', () => mainWindow?.isMaximized() ? mainWindow?.unmaximize() : mainWindow?.maximize())

ipcMain.on('window:close', () => mainWindow?.close())

// IPC Handlers
const normalize = (p: string) => p.replace(/\\/g, '/')

ipcMain.handle('fs:readFile', async (_, filePath: string) => {
  try {
    const content = readFileSync(normalize(filePath), 'utf-8')
    return { success: true, content }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('fs:writeFile', async (_, filePath: string, content: string) => {
  try {
    writeFileSync(normalize(filePath), content, 'utf-8')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('fs:readDir', async (_, dirPath: string) => {
  try {
    const items = readdirSync(normalize(dirPath), { withFileTypes: true })
    const result = items.map(item => ({
      name: item.name,
      isDirectory: item.isDirectory(),
      path: normalize(join(normalize(dirPath), item.name))
    }))
    return { success: true, items: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('fs:stat', async (_, filePath: string) => {
  try {
    const stats = statSync(normalize(filePath))
    return { success: true, stats: { isDirectory: stats.isDirectory(), size: stats.size, modified: stats.mtime } }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('fs:exists', async (_, filePath: string) => {
  return existsSync(normalize(filePath))
})

ipcMain.handle('fs:move', async (_, sourcePath: string, destPath: string) => {
  try {
    const src = normalize(sourcePath)
    const dst = normalize(destPath)
    if (!existsSync(src)) {
      return { success: false, error: 'Source file not found' }
    }
    if (existsSync(dst)) {
      return { success: false, error: 'Destination already exists' }
    }
    renameSync(src, dst)
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
  return result.canceled ? null : normalize(result.filePaths[0])
})

ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  })
  return result.canceled ? null : normalize(result.filePaths[0])
})

ipcMain.handle('dialog:saveFile', async (_, defaultPath?: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: defaultPath ? normalize(defaultPath) : undefined,
    filters: [{ name: 'All Files', extensions: ['*'] }]
  })
  return result.canceled ? null : normalize(result.filePath)
})

ipcMain.handle('dialog:openProject', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [{ name: 'ViStudio Project', extensions: ['vistproj'] }]
  })
  return result.canceled ? null : normalize(result.filePaths[0])
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

    const normalizedParent = normalize(parentDir)
    const projectDir = join(normalizedParent, projectName)
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
    const normalizedParent = parentPath ? normalize(parentPath) : undefined

    const targetPath = normalizedParent || (await dialog.showOpenDialog(mainWindow!, {
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
    return normalize(newFolderPath)
  } catch (error: any) {
    console.error('Failed to create folder:', error)
    return null
  }
})

ipcMain.handle('file:create', async (_, fileName: string, parentPath: string) => {
  try {
    if (!fileName || !parentPath) return null
    const normalizedParent = normalize(parentPath)
    const newFilePath = join(normalizedParent, fileName)
    if (existsSync(newFilePath)) {
      await dialog.showMessageBox(mainWindow!, {
        type: 'error',
        title: 'Error',
        message: `File "${fileName}" already exists`
      })
      return null
    }
    writeFileSync(newFilePath, '', 'utf-8')
    return normalize(newFilePath)
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
      cwd: cwd ? normalize(cwd) : (process.platform === 'win32' ? process.env.USERPROFILE : process.env.HOME),
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

// Bundled recommended extensions
const getBundledExtensionsDir = () => {
  const devPath = join(__dirname, '..', 'extensions')
  if (existsSync(devPath)) return devPath
  return null
}

ipcMain.handle('extension:listRecommended', async () => {
  try {
    const dir = getBundledExtensionsDir()
    if (!dir) return { success: true, extensions: [] }
    const items = readdirSync(dir, { withFileTypes: true })
    const extensions: Array<{ id: string; name: string; description: string; version: string }> = []
    for (const item of items) {
      if (!item.isDirectory()) continue
      const manifestPath = join(dir, item.name, 'extension.json')
      if (!existsSync(manifestPath)) continue
      try {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
        extensions.push({
          id: manifest.name || item.name,
          name: manifest.name || item.name,
          description: manifest.description || '',
          version: manifest.version || '0.0.0'
        })
      } catch (_) {}
    }
    return { success: true, extensions }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('extension:installRecommended', async () => {
  try {
    const bundledDir = getBundledExtensionsDir()
    if (!bundledDir) return { success: false, error: 'No bundled extensions found' }
    const userDataExtDir = join(app.getPath('userData'), 'extensions')
    if (!existsSync(userDataExtDir)) mkdirSync(userDataExtDir, { recursive: true })

    const items = readdirSync(bundledDir, { withFileTypes: true })
    let installed = 0
    for (const item of items) {
      if (!item.isDirectory()) continue
      const srcPath = join(bundledDir, item.name)
      const manifestPath = join(srcPath, 'extension.json')
      if (!existsSync(manifestPath)) continue
      const destPath = join(userDataExtDir, item.name)
      if (!existsSync(destPath)) {
        mkdirSync(destPath, { recursive: true })
        const files = readdirSync(srcPath)
        for (const file of files) {
          const content = readFileSync(join(srcPath, file))
          writeFileSync(join(destPath, file), content)
        }
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
        const id = manifest.name || item.name
        extensionPaths.set(id, destPath)
        installed++
      }
    }
    return { success: true, installed }
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
    const stdout = execFileSync('git', args, { cwd: dir, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
    return { success: true, stdout: stdout.trimEnd() }
  } catch (err: any) {
    return { success: false, stdout: err.stdout?.trimEnd() || '', stderr: err.stderr?.trimEnd() || '', error: err.message }
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
        if (code === 0) resolve({ success: true, stdout: stdout.trimEnd() })
        else resolve({ success: false, stdout: stdout.trimEnd(), stderr: stderr.trimEnd(), error: stderr.trimEnd() || stdout.trimEnd() })
      })
      child.on('error', (err) => resolve({ success: false, error: err.message }))
    } catch (err: any) {
      resolve({ success: false, error: err.message })
    }
  })
}

ipcMain.handle('git:status', async (_, dir: string) => {
  dir = normalize(dir)
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

ipcMain.handle('git:statusVerbose', async (_, dir: string) => {
  dir = normalize(dir)
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository', isRepo: false }
  const r = runGit(dir, ['status'])
  return r
})

ipcMain.handle('git:branch', async (_, dir: string) => {
  dir = normalize(dir)
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository', isRepo: false }
  const r = runGit(dir, ['branch', '--show-current'])
  if (!r.success) {
    const all = runGit(dir, ['rev-parse', '--abbrev-ref', 'HEAD'])
    return { ...r, branch: all.stdout || 'HEAD', isRepo: true }
  }
  return { ...r, branch: r.stdout || 'main', isRepo: true }
})

ipcMain.handle('git:log', async (_, dir: string, count: number = 20) => {
  dir = normalize(dir)
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
  dir = normalize(dir)
  filePath = normalize(filePath)
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository' }
  return runGit(dir, ['add', filePath])
})

ipcMain.handle('git:unstage', async (_, dir: string, filePath: string) => {
  dir = normalize(dir)
  filePath = normalize(filePath)
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository' }
  return runGit(dir, ['reset', 'HEAD', '--', filePath])
})

ipcMain.handle('git:commit', async (_, dir: string, message: string) => {
  dir = normalize(dir)
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository' }
  const result = await runGitSpawn(dir, ['commit', '-m', message])
  return result
})

ipcMain.handle('git:commitAll', async (_, dir: string, message: string) => {
  dir = normalize(dir)
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository' }
  const result = await runGitSpawn(dir, ['commit', '-a', '-m', message])
  return result
})

ipcMain.handle('git:diff', async (_, dir: string, filePath?: string) => {
  dir = normalize(dir)
  if (filePath) filePath = normalize(filePath)
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository', isRepo: false }
  const args = ['diff', '--no-color']
  if (filePath) args.push('--', filePath)
  return { ...runGit(dir, args), isRepo: true }
})

ipcMain.handle('git:diffStaged', async (_, dir: string, filePath?: string) => {
  dir = normalize(dir)
  if (filePath) filePath = normalize(filePath)
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository', isRepo: false }
  const args = ['diff', '--staged', '--no-color']
  if (filePath) args.push('--', filePath)
  return { ...runGit(dir, args), isRepo: true }
})

ipcMain.handle('git:init', async (_, dir: string) => {
  dir = normalize(dir)
  return runGit(dir, ['init'])
})

ipcMain.handle('git:checkout', async (_, dir: string, branch: string) => {
  dir = normalize(dir)
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository' }
  return runGit(dir, ['checkout', branch])
})

ipcMain.handle('git:pull', async (_, dir: string) => {
  dir = normalize(dir)
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository' }
  return runGit(dir, ['pull'])
})

ipcMain.handle('git:push', async (_, dir: string) => {
  dir = normalize(dir)
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository' }
  return runGit(dir, ['push'])
})

ipcMain.handle('git:allBranches', async (_, dir: string) => {
  dir = normalize(dir)
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository', isRepo: false }
  return { ...runGit(dir, ['branch', '-a']), isRepo: true }
})

ipcMain.handle('git:clone', async (_, url: string, targetDir: string) => {
  try {
    const dirName = url.split('/').pop()?.replace('.git', '') || 'repo'
    const dest = normalize(join(targetDir, dirName))
    if (existsSync(dest)) return { success: false, error: 'Directory already exists: ' + dest }
    const result = runGit(targetDir, ['clone', url, dirName])
    if (result.success) return { success: true, path: dest }
    return result
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('git:branchCreate', async (_, dir: string, branchName: string) => {
  dir = normalize(dir)
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository' }
  return runGit(dir, ['checkout', '-b', branchName])
})

ipcMain.handle('git:branchDelete', async (_, dir: string, branchName: string) => {
  dir = normalize(dir)
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository' }
  return runGit(dir, ['branch', '-d', branchName])
})

ipcMain.handle('git:stash', async (_, dir: string) => {
  dir = normalize(dir)
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository' }
  return runGit(dir, ['stash'])
})

ipcMain.handle('git:stashPop', async (_, dir: string) => {
  dir = normalize(dir)
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository' }
  return runGit(dir, ['stash', 'pop'])
})

ipcMain.handle('git:logFile', async (_, dir: string, filePath: string) => {
  dir = normalize(dir)
  filePath = normalize(filePath)
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository', isRepo: false }
  const r = runGit(dir, ['show', 'HEAD:' + filePath])
  return { ...r, isRepo: true }
})

ipcMain.handle('git:restore', async (_, dir: string, filePath: string) => {
  dir = normalize(dir)
  filePath = normalize(filePath)
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository' }
  return runGit(dir, ['restore', filePath])
})

ipcMain.handle('git:fetch', async (_, dir: string) => {
  dir = normalize(dir)
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository' }
  return runGit(dir, ['fetch', '--prune'])
})

ipcMain.handle('git:pushUpstream', async (_, dir: string, branch: string) => {
  dir = normalize(dir)
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository' }
  return runGit(dir, ['push', '--set-upstream', 'origin', branch])
})

ipcMain.handle('git:branchDeleteForce', async (_, dir: string, branchName: string) => {
  dir = normalize(dir)
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository' }
  return runGit(dir, ['branch', '-D', branchName])
})

ipcMain.handle('git:branchRename', async (_, dir: string, oldName: string, newName: string) => {
  dir = normalize(dir)
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository' }
  return runGit(dir, ['branch', '-m', oldName, newName])
})

ipcMain.handle('git:merge', async (_, dir: string, branchName: string) => {
  dir = normalize(dir)
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository' }
  return runGit(dir, ['merge', branchName])
})

ipcMain.handle('git:remoteAdd', async (_, dir: string, name: string, url: string) => {
  dir = normalize(dir)
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository' }
  return runGit(dir, ['remote', 'add', name, url])
})

ipcMain.handle('git:remoteList', async (_, dir: string) => {
  dir = normalize(dir)
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository', isRepo: false }
  return { ...runGit(dir, ['remote', '-v']), isRepo: true }
})

ipcMain.handle('git:stashList', async (_, dir: string) => {
  dir = normalize(dir)
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository', isRepo: false }
  const r = runGit(dir, ['stash', 'list'])
  if (!r.success) return { ...r, stashes: [], isRepo: true }
  const stashes = r.stdout!.split('\n').filter(Boolean).map(line => {
    const m = line.match(/^(stash@\{[^}]+\}):\s+(.+)$/)
    return { ref: m ? m[1] : line, message: m ? m[2] : line }
  })
  return { success: true, stashes, isRepo: true }
})

ipcMain.handle('git:stashPush', async (_, dir: string, message?: string) => {
  dir = normalize(dir)
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository' }
  const args = ['stash', 'push']
  if (message) args.push('-m', message)
  return runGit(dir, args)
})

ipcMain.handle('git:stashDrop', async (_, dir: string, ref: string) => {
  dir = normalize(dir)
  if (!existsSync(join(dir, '.git'))) return { success: false, error: 'Not a git repository' }
  return runGit(dir, ['stash', 'drop', ref])
})

// GitHub CLI IPC Handlers
function runGh(args: string[], cwd?: string): { success: boolean; stdout?: string; stderr?: string; error?: string } {
  try {
    const stdout = execFileSync('gh', args, { cwd, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
    return { success: true, stdout: stdout.trim() }
  } catch (err: any) {
    return { success: false, stdout: err.stdout?.trim() || '', stderr: err.stderr?.trim() || '', error: err.message }
  }
}

ipcMain.handle('gh:authStatus', async () => {
  const r = runGh(['auth', 'status'])
  if (r.success) {
    const m = r.stdout!.match(/Logged in to github\.com account (\S+)/)
    return { success: true, loggedIn: true, username: m ? m[1] : 'unknown' }
  }
  return { success: true, loggedIn: false, username: '' }
})

ipcMain.handle('gh:repoView', async (_, dir: string, repoName?: string) => {
  dir = normalize(dir)
  if (!repoName) {
    const remoteR = runGit(dir, ['remote', 'get-url', 'origin'])
    if (!remoteR.success) return { success: false, error: 'No remote origin found', hasRemote: false }
    const url = remoteR.stdout!
    const m = url.match(/(?:github\.com[/: ])([\w.-]+)\/([\w.-]+?)(?:\.git)?$/)
    if (!m) return { success: false, error: 'Remote is not a GitHub URL', hasRemote: false }
    repoName = `${m[1]}/${m[2]}`
  }
  const r = runGh(['repo', 'view', repoName, '--json', 'name,description,url,stargazerCount,forkCount,primaryLanguage,isPrivate,updatedAt,owner'], dir)
  if (!r.success) return { success: false, error: r.stderr || r.error, hasRemote: true }
  try {
    const data = JSON.parse(r.stdout!)
    return { success: true, hasRemote: true, repo: data }
  } catch {
    return { success: false, error: 'Failed to parse repo info', hasRemote: true }
  }
})

ipcMain.handle('gh:repoCreate', async (_, dir: string, name: string, isPublic: boolean, description?: string) => {
  dir = normalize(dir)
  const args = ['repo', 'create', name, '--source=.', '--remote=origin', '--push']
  if (isPublic) args.push('--public')
  else args.push('--private')
  if (description) args.push('--description', description)
  return runGh(args, dir)
})

ipcMain.handle('gh:prList', async (_, dir: string, repoName?: string) => {
  dir = normalize(dir)
  if (!repoName) {
    const remoteR = runGit(dir, ['remote', 'get-url', 'origin'])
    if (!remoteR.success) return { success: false, error: 'No remote origin found' }
    const url = remoteR.stdout!
    const m = url.match(/(?:github\.com[/: ])([\w.-]+)\/([\w.-]+?)(?:\.git)?$/)
    if (!m) return { success: false, error: 'Remote is not a GitHub URL' }
    repoName = `${m[1]}/${m[2]}`
  }
  const r = runGh(['pr', 'list', '--repo', repoName, '--json', 'number,title,state,headRefName,author,createdAt', '--limit', '10'], dir)
  if (!r.success) return { success: false, error: r.stderr || r.error }
  try {
    return { success: true, pulls: JSON.parse(r.stdout!) }
  } catch {
    return { success: false, error: 'Failed to parse PR list' }
  }
})

ipcMain.handle('gh:issueList', async (_, dir: string, repoName?: string) => {
  dir = normalize(dir)
  if (!repoName) {
    const remoteR = runGit(dir, ['remote', 'get-url', 'origin'])
    if (!remoteR.success) return { success: false, error: 'No remote origin found' }
    const url = remoteR.stdout!
    const m = url.match(/(?:github\.com[/: ])([\w.-]+)\/([\w.-]+?)(?:\.git)?$/)
    if (!m) return { success: false, error: 'Remote is not a GitHub URL' }
    repoName = `${m[1]}/${m[2]}`
  }
  const r = runGh(['issue', 'list', '--repo', repoName, '--json', 'number,title,state,labels,author,createdAt', '--limit', '10'], dir)
  if (!r.success) return { success: false, error: r.stderr || r.error }
  try {
    return { success: true, issues: JSON.parse(r.stdout!) }
  } catch {
    return { success: false, error: 'Failed to parse issue list' }
  }
})

ipcMain.handle('gh:browse', async (_, dir: string) => {
  dir = normalize(dir)
  return runGh(['repo', 'view', '--web'], dir)
})

// Git operation history
const HISTORY_FILE = join(app.getPath('userData'), 'git-history.json')
const MAX_HISTORY = 100

ipcMain.handle('git:logHistory', async (_, entry: { operation: string; details?: string; success: boolean; error?: string }) => {
  try {
    let history: any[] = []
    if (existsSync(HISTORY_FILE)) {
      try { history = JSON.parse(readFileSync(HISTORY_FILE, 'utf-8')) } catch {}
    }
    history.unshift({ ...entry, timestamp: new Date().toISOString() })
    if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY)
    writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('git:getHistory', async () => {
  try {
    if (!existsSync(HISTORY_FILE)) return { success: true, history: [] }
    const data = readFileSync(HISTORY_FILE, 'utf-8')
    return { success: true, history: JSON.parse(data) }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

// Auto-updater configuration
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

// ── Linux package detection ──────────────────────────────────────────

type LinuxPackageType = 'deb' | 'rpm' | 'appimage' | 'unknown'

interface LinuxPackageInfo {
  type: LinuxPackageType
  ext: string
  label: string
  installCmd: string
}

function detectLinuxPackage(): LinuxPackageInfo | null {
  if (process.platform !== 'linux') return null
  if (process.env.APPIMAGE) {
    return { type: 'appimage', ext: 'AppImage', label: 'AppImage', installCmd: '' }
  }
  if (existsSync('/etc/debian_version')) {
    return { type: 'deb', ext: 'deb', label: 'Debian/Ubuntu (.deb)', installCmd: 'dpkg -i' }
  }
  if (existsSync('/etc/fedora-release') || existsSync('/etc/redhat-release') || existsSync('/etc/rocky-release')) {
    return { type: 'rpm', ext: 'rpm', label: 'Fedora/RHEL (.rpm)', installCmd: 'rpm -Uvh' }
  }
  return null
}

const LINUX_PKG = detectLinuxPackage()

// Detect if auto-update is possible based on install type
function canSelfUpdate(): { supported: boolean; reason?: string; url?: string } {
  if (process.platform === 'win32') {
    return { supported: true }
  }
  if (process.platform === 'darwin') {
    return { supported: true }
  }
  if (LINUX_PKG) {
    return { supported: true }
  }
  const releasesUrl = 'https://github.com/regalf/vistudio/releases'
  if (process.env.FLATPAK_ID) {
    return { supported: false, reason: 'Flatpak installation detected. Update via Flatpak:', url: 'flatpak update' }
  }
  if (existsSync('/etc/arch-release')) {
    return { supported: false, reason: 'Arch Linux detected. Auto-update is disabled. Get the latest version from GitHub Releases or your AUR helper:', url: releasesUrl }
  }
  return { supported: false, reason: 'Auto-update not supported for this installation. Get the latest version from GitHub Releases:', url: releasesUrl }
}

const UPDATE_INFO = canSelfUpdate()

// ── GitHub release asset helpers ─────────────────────────────────────

function getAssetFilename(version: string): string {
  if (LINUX_PKG) {
    switch (LINUX_PKG.type) {
      case 'deb': return `vistudio_${version}_amd64.deb`
      case 'rpm': return `vistudio-${version}.x86_64.rpm`
      case 'appimage': return `ViStudio-${version}.AppImage`
    }
  }
  // fallback: AppImage
  return `ViStudio-${version}.AppImage`
}

function getAssetUrl(version: string): string {
  const base = 'https://github.com/regalf/vistudio/releases/download'
  const tag = `v${version}`
  const file = getAssetFilename(version)
  return `${base}/${tag}/${file}`
}

// ── Download asset with progress ─────────────────────────────────────

function downloadAsset(url: string, dest: string, onProgress?: (pct: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest)
    https.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close()
        rmSync(dest, { force: true })
        downloadAsset(res.headers.location, dest, onProgress).then(resolve, reject)
        return
      }
      if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
        file.close()
        rmSync(dest, { force: true })
        reject(new Error(`Download failed: HTTP ${res.statusCode}`))
        return
      }
      const total = parseInt(res.headers['content-length'] || '0', 10)
      let downloaded = 0
      res.on('data', (chunk: Buffer) => {
        downloaded += chunk.length
        if (total && onProgress) {
          onProgress(Math.round((downloaded / total) * 100))
        }
      })
      res.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve(dest)
      })
    }).on('error', (err) => {
      file.close()
      rmSync(dest, { force: true })
      reject(err)
    })
  })
}

// ── Linux install via pkexec ─────────────────────────────────────────

function installLinuxPackage(pkgPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!LINUX_PKG) {
      reject(new Error('No Linux package info'))
      return
    }
    let args: string[]
    switch (LINUX_PKG.type) {
      case 'deb':
        args = ['dpkg', '-i', pkgPath]
        break
      case 'rpm':
        args = ['rpm', '-Uvh', pkgPath]
        break
      default:
        reject(new Error('Install not supported for ' + LINUX_PKG.type))
        return
    }
    const bin = existsSync('/usr/bin/pkexec') ? 'pkexec' : 'sudo'
    console.log('[UPDATE] Installing with', bin, args.join(' '))
    const proc = execFile(bin, args, { timeout: 120000 }, (err, _stdout, stderr) => {
      if (err) {
        console.error('[UPDATE] Install failed:', stderr)
        reject(new Error(stderr || err.message))
      } else {
        resolve()
      }
    })
    proc.stdout?.on('data', (d) => console.log('[UPDATE:install]', d.toString().trim()))
    proc.stderr?.on('data', (d) => console.log('[UPDATE:install:err]', d.toString().trim()))
  })
}

const updaterChannel = process.platform === 'win32' ? 'latest-windows' : undefined
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'regalf',
  repo: 'vistudio',
  private: false,
  channel: updaterChannel
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
    if (!UPDATE_INFO.supported) {
      mainWindow?.webContents.send('update:error', {
        message: UPDATE_INFO.reason || 'Self-update not supported for this installation type.',
        url: UPDATE_INFO.url
      })
      return { success: true }
    }
    await checkForUpdatesWithTimeout()
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('util:openExternal', async (_, url: string) => {
  try {
    await shell.openExternal(url)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('update:download', async () => {
  try {
    if (!UPDATE_INFO.supported) {
      return { success: false, error: UPDATE_INFO.reason || 'Self-update not supported.' }
    }
    // Linux system packages (deb/rpm): download direct from GitHub
    if (LINUX_PKG && LINUX_PKG.type !== 'appimage') {
      const version = app.getVersion()
      const url = getAssetUrl(version)
      const dest = join(app.getPath('temp'), getAssetFilename(version))
      console.log('[UPDATE] Downloading:', url)
      mainWindow?.webContents.send('update:download-progress', { percent: 0, bytesPerSecond: 0, total: 0, transferred: 0 })
      await downloadAsset(url, dest, (pct) => {
        mainWindow?.webContents.send('update:download-progress', { percent: pct, bytesPerSecond: 0, total: 0, transferred: 0 })
      })
      console.log('[UPDATE] Downloaded to:', dest)
      _pendingUpdatePath = dest
      mainWindow?.webContents.send('update:downloaded')
      return { success: true }
    }
    // Windows / AppImage: use electron-updater
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

let _pendingUpdatePath = ''

ipcMain.handle('update:install-type', async () => {
  if (LINUX_PKG) {
    return { type: 'linux', pkg: LINUX_PKG.label, needsElevation: LINUX_PKG.type !== 'appimage' }
  }
  if (process.platform === 'win32') {
    return { type: 'win32', pkg: 'NSIS installer', needsElevation: false }
  }
  return { type: 'appimage', pkg: 'AppImage', needsElevation: false }
})

ipcMain.handle('update:install', async () => {
  try {
    // Linux system package: install via pkexec
    if (LINUX_PKG && LINUX_PKG.type !== 'appimage') {
      if (!_pendingUpdatePath || !existsSync(_pendingUpdatePath)) {
        return { success: false, error: 'Update package not found. Please download again.' }
      }
      await installLinuxPackage(_pendingUpdatePath)
      rmSync(_pendingUpdatePath, { force: true })
      _pendingUpdatePath = ''
      app.relaunch()
      app.quit()
      return { success: true }
    }
    // NSIS / AppImage: use electron-updater
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
    if (!UPDATE_INFO.supported) return
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
