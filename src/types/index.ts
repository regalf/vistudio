export * from './extension'

export interface CommandItem {
  id: string
  label: string
  category?: string
  shortcut?: string
  icon?: string
  type: 'command' | 'file'
  path?: string
}

export interface EditorTab {
  id: string
  path: string | null
  name: string
  content: string
  language: string
  isModified: boolean
  isNew: boolean
}

export interface FileSystemItem {
  name: string
  path: string
  isDirectory: boolean
}

export interface OpenedFile {
  path: string
  name: string
  content: string
  isModified: boolean
  language: string
}

export interface ProjectConfig {
  name: string
  version: string
  description?: string
  language?: string
  compiler?: {
    command: string
    args: string[]
  }
  entryPoint?: string
  extensions?: string[]
  settings?: ProjectSettings
  exclude?: string[]
}

export interface ProjectSettings {
  tabSize?: number
  formatOnSave?: boolean
  theme?: string
}

export interface EditorSettings {
  'editor.fontSize': number
  'editor.fontFamily': string
  'editor.tabSize': number
  'editor.wordWrap': string
  'editor.lineNumbers': string
  'editor.minimap': boolean
  'editor.fontLigatures': boolean
  'editor.smoothScrolling': boolean
  'editor.cursorBlinking': string
  'editor.renderWhitespace': string
  'editor.scrollBeyondLastLine': boolean
  'editor.bracketPairColorization': boolean
  'editor.bracketPairGuides': boolean
  'editor.indentationGuides': boolean
  'files.autoSave': string
  'files.autoSaveDelay': number
  'workbench.colorTheme': string
}

export type SettingsKey = keyof EditorSettings

export interface ElectronAPI {
  fs: {
    readFile: (path: string) => Promise<{ success: boolean; content?: string; error?: string }>
    writeFile: (path: string, content: string) => Promise<{ success: boolean; error?: string }>
    readDir: (path: string) => Promise<{ success: boolean; items?: FileSystemItem[]; error?: string }>
    stat: (path: string) => Promise<{ success: boolean; stats?: any; error?: string }>
    exists: (path: string) => Promise<boolean>
    move: (sourcePath: string, destPath: string) => Promise<{ success: boolean; error?: string }>
  }
  dialog: {
    openFile: () => Promise<string | null>
    openFolder: () => Promise<string | null>
    saveFile: (defaultPath?: string) => Promise<string | null>
    openProject: () => Promise<string | null>
  }
  project: {
    create: (projectName: string, parentDir: string, templateFiles?: Record<string, string>, language?: string, entryPoint?: string) => Promise<{ success: boolean; projectDir?: string; error?: string }>
  }
  folder: {
    create: (folderName: string, parentPath?: string) => Promise<string | null>
  }
  file: {
    create: (fileName: string, parentPath: string) => Promise<string | null>
  }
  terminal: {
    start: (cwd?: string) => Promise<{ success: boolean; error?: string }>
    write: (data: string) => Promise<{ success: boolean }>
    resize: () => Promise<{ success: boolean }>
    onData: (callback: (data: string) => void) => void
    onExit: (callback: (exitCode: number) => void) => void
  }
  log: (message: string) => Promise<{ success: boolean }>
  onMenuAction: (callback: (action: string) => void) => void
  extension: {
    load: (extensionPath: string) => Promise<{ success: boolean; id?: string; manifest?: any; error?: string }>
    activate: (extensionId: string) => Promise<{ success: boolean; error?: string }>
    deactivate: (extensionId: string) => Promise<{ success: boolean; error?: string }>
    list: () => Promise<{ success: boolean; extensions?: any[]; error?: string }>
    loadDirectory: (extensionsDir: string) => Promise<{ success: boolean; loadedCount?: number; error?: string }>
    delete: (extensionPath: string) => Promise<{ success: boolean; error?: string }>
  }
  appReady: () => void
  settings: {
    load: () => Promise<{ success: boolean; settings?: Record<string, any>; error?: string }>
    save: (partial: Record<string, any>) => Promise<{ success: boolean; settings?: Record<string, any>; error?: string }>
  }
  windowControls: {
    minimize: () => void
    maximize: () => void
    close: () => void
  }
  git: {
    status: (dir: string) => Promise<{ success: boolean; files?: Array<{ path: string; staged: string; working: string }>; isRepo?: boolean; error?: string }>
    branch: (dir: string) => Promise<{ success: boolean; branch?: string; isRepo?: boolean; error?: string }>
    log: (dir: string, count?: number) => Promise<{ success: boolean; commits?: Array<{ hash: string; author: string; date: string; message: string }>; isRepo?: boolean; error?: string }>
    add: (dir: string, filePath: string) => Promise<{ success: boolean; error?: string }>
    unstage: (dir: string, filePath: string) => Promise<{ success: boolean; error?: string }>
    commit: (dir: string, message: string) => Promise<{ success: boolean; error?: string }>
    diff: (dir: string, filePath?: string) => Promise<{ success: boolean; stdout?: string; isRepo?: boolean; error?: string }>
    diffStaged: (dir: string, filePath?: string) => Promise<{ success: boolean; stdout?: string; isRepo?: boolean; error?: string }>
    init: (dir: string) => Promise<{ success: boolean; error?: string }>
    checkout: (dir: string, branch: string) => Promise<{ success: boolean; error?: string }>
    pull: (dir: string) => Promise<{ success: boolean; error?: string }>
    push: (dir: string) => Promise<{ success: boolean; error?: string }>
    allBranches: (dir: string) => Promise<{ success: boolean; stdout?: string; isRepo?: boolean; error?: string }>
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
