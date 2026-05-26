import { contextBridge, ipcRenderer } from 'electron'

try {
  contextBridge.exposeInMainWorld('electronAPI', {
    fs: {
      readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
      writeFile: (filePath: string, content: string) => ipcRenderer.invoke('fs:writeFile', filePath, content),
      readDir: (dirPath: string) => ipcRenderer.invoke('fs:readDir', dirPath),
      stat: (filePath: string) => ipcRenderer.invoke('fs:stat', filePath),
      exists: (filePath: string) => ipcRenderer.invoke('fs:exists', filePath),
      move: (sourcePath: string, destPath: string) => ipcRenderer.invoke('fs:move', sourcePath, destPath)
    },
  dialog: {
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
    openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
    saveFile: (defaultPath?: string) => ipcRenderer.invoke('dialog:saveFile', defaultPath),
    openProject: () => ipcRenderer.invoke('dialog:openProject')
  },
  project: {
    create: (projectName: string, parentDir: string, templateFiles?: Record<string, string>, language?: string, entryPoint?: string) => ipcRenderer.invoke('project:create', projectName, parentDir, templateFiles, language, entryPoint)
  },
  folder: {
    create: (folderName: string, parentPath?: string) => ipcRenderer.invoke('folder:create', folderName, parentPath)
  },
  file: {
    create: (fileName: string, parentPath: string) => ipcRenderer.invoke('file:create', fileName, parentPath)
  },
  terminal: {
    start: (cwd: string) => ipcRenderer.invoke('terminal:start', cwd),
    write: (data: string) => ipcRenderer.invoke('terminal:write', data),
    resize: () => ipcRenderer.invoke('terminal:resize'),
    onData: (callback: (data: string) => void) => {
      ipcRenderer.on('terminal:data', (_, data) => callback(data))
    },
    onExit: (callback: (exitCode: number) => void) => {
      ipcRenderer.on('terminal:exit', (_, exitCode) => callback(exitCode))
    }
  },
  log: (message: string) => ipcRenderer.invoke('log', message),
  onMenuAction: (callback: (action: string) => void) => {
      const actions = ['menu:new-file', 'menu:open-file', 'menu:open-folder', 'menu:save', 'menu:save-as', 'menu:find', 'menu:replace', 'menu:toggle-sidebar', 'menu:toggle-terminal', 'menu:toggle-console', 'menu:command-palette', 'menu:debug-test-all']
    const listeners: Record<string, any> = {}
    actions.forEach(action => {
      listeners[action] = () => callback(action)
      ipcRenderer.on(action, listeners[action])
    })
    return () => {
      actions.forEach(action => {
        if (listeners[action]) {
          ipcRenderer.removeListener(action, listeners[action])
        }
      })
    }
  },
  extension: {
    load: (extensionPath: string) => ipcRenderer.invoke('extension:load', extensionPath),
    activate: (extensionId: string) => ipcRenderer.invoke('extension:activate', extensionId),
    deactivate: (extensionId: string) => ipcRenderer.invoke('extension:deactivate', extensionId),
    list: () => ipcRenderer.invoke('extension:list'),
    loadDirectory: (extensionsDir: string) => ipcRenderer.invoke('extension:loadDirectory', extensionsDir),
    delete: (extensionPath: string) => ipcRenderer.invoke('extension:delete', extensionPath)
  },
  appReady: () => ipcRenderer.send('app:ready'),
  settings: {
    load: () => ipcRenderer.invoke('settings:load'),
    save: (partial: Record<string, any>) => ipcRenderer.invoke('settings:save', partial)
  },
  windowControls: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close')
  },
  git: {
    status: (dir: string) => ipcRenderer.invoke('git:status', dir),
    branch: (dir: string) => ipcRenderer.invoke('git:branch', dir),
    log: (dir: string, count?: number) => ipcRenderer.invoke('git:log', dir, count),
    add: (dir: string, filePath: string) => ipcRenderer.invoke('git:add', dir, filePath),
    unstage: (dir: string, filePath: string) => ipcRenderer.invoke('git:unstage', dir, filePath),
    commit: (dir: string, message: string) => ipcRenderer.invoke('git:commit', dir, message),
    diff: (dir: string, filePath?: string) => ipcRenderer.invoke('git:diff', dir, filePath),
    diffStaged: (dir: string, filePath?: string) => ipcRenderer.invoke('git:diffStaged', dir, filePath),
    init: (dir: string) => ipcRenderer.invoke('git:init', dir),
    checkout: (dir: string, branch: string) => ipcRenderer.invoke('git:checkout', dir, branch),
    pull: (dir: string) => ipcRenderer.invoke('git:pull', dir),
    push: (dir: string) => ipcRenderer.invoke('git:push', dir),
    allBranches: (dir: string) => ipcRenderer.invoke('git:allBranches', dir)
  },
  update: {
    check: () => ipcRenderer.invoke('update:check'),
    download: () => ipcRenderer.invoke('update:download'),
    cancel: () => ipcRenderer.invoke('update:cancel'),
    install: () => ipcRenderer.invoke('update:install'),
    onAvailable: (callback: (info: any) => void) => {
      ipcRenderer.on('update:available', (_, info) => callback(info))
    },
    onNotAvailable: (callback: () => void) => {
      ipcRenderer.on('update:not-available', () => callback())
    },
    onDownloadProgress: (callback: (progress: any) => void) => {
      ipcRenderer.on('update:download-progress', (_, progress) => callback(progress))
    },
    onDownloaded: (callback: () => void) => {
      ipcRenderer.on('update:downloaded', () => callback())
    },
    onError: (callback: (msg: string) => void) => {
      ipcRenderer.on('update:error', (_, msg) => callback(msg))
    }
  }
  })
} catch (error) {
  console.error('Failed to expose electronAPI:', error)
}
