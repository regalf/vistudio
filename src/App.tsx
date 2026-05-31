import React, { useState, useEffect, useCallback, useRef } from 'react'
import MenuBar from './components/MenuBar'
import Sidebar from './components/Sidebar'
import EditorPanel from './components/EditorPanel'
import StatusBar from './components/StatusBar'
import TabBar from './components/TabBar'
import TerminalPanel from './components/TerminalPanel'
import ExtensionsPanel from './components/ExtensionsPanel'
import ConsolePanel from './components/ConsolePanel'
import CommandPalette from './components/CommandPalette'
import SearchPanel from './components/SearchPanel'
import SettingsPanel from './components/SettingsPanel'
import UpdatePanel from './components/UpdatePanel'
import WelcomePage from './components/WelcomePage'
import CloneModal from './components/CloneModal'
import GitHubModal from './components/GitHubModal'
import GitStatusModal from './components/GitStatusModal'
import './styles/global.css'
import { EditorTab, EditorSettings, CommandItem } from './types'
import { ExtensionHost } from './core/ExtensionHost'
import { ExtensionInfo, RegisteredTheme } from './types/extension'
import { themeManager } from './core/ThemeManager'
import pkg from '../package.json'

const BUILTIN_COMMANDS: CommandItem[] = [
  { id: 'menu:new-file', label: 'New File', category: 'File', shortcut: 'Ctrl+N', type: 'command' },
  { id: 'menu:open-file', label: 'Open File...', category: 'File', shortcut: 'Ctrl+O', type: 'command' },
  { id: 'menu:open-folder', label: 'Open Folder...', category: 'File', shortcut: 'Ctrl+Shift+O', type: 'command' },
  { id: 'menu:save', label: 'Save', category: 'File', shortcut: 'Ctrl+S', type: 'command' },
  { id: 'menu:save-as', label: 'Save As...', category: 'File', shortcut: 'Ctrl+Shift+S', type: 'command' },
  { id: 'menu:new-folder', label: 'New Folder...', category: 'File', type: 'command' },
  { id: 'menu:new-project', label: 'New Project...', category: 'File', type: 'command' },
  { id: 'menu:open-project', label: 'Open Project...', category: 'File', type: 'command' },
  { id: 'menu:toggle-sidebar', label: 'Toggle Sidebar', category: 'View', shortcut: 'Ctrl+B', type: 'command' },
  { id: 'menu:toggle-terminal', label: 'Toggle Terminal', category: 'View', shortcut: 'Ctrl+`', type: 'command' },
  { id: 'menu:toggle-console', label: 'Toggle Console', category: 'View', shortcut: 'Ctrl+Shift+U', type: 'command' },
  { id: 'menu:toggle-search', label: 'Search in Files', category: 'View', shortcut: 'Ctrl+Shift+F', type: 'command' },
  { id: 'menu:manage-extensions', label: 'Manage Extensions...', category: 'Extensions', type: 'command' },
  { id: 'menu:install-extension', label: 'Install Extension...', category: 'Extensions', type: 'command' },
  { id: 'menu:refresh-extensions', label: 'Refresh Extensions', category: 'Extensions', type: 'command' },
  { id: 'menu:source-control', label: 'View Source Control', category: 'Git', shortcut: 'Ctrl+Shift+G', type: 'command' },
  { id: 'menu:git-status', label: 'Git Status', category: 'Git', type: 'command' },
  { id: 'menu:git-commit', label: 'Git Commit...', category: 'Git', type: 'command' },
  { id: 'menu:git-fetch', label: 'Git Fetch', category: 'Git', type: 'command' },
  { id: 'menu:git-pull', label: 'Git Pull', category: 'Git', type: 'command' },
  { id: 'menu:git-push', label: 'Git Push', category: 'Git', type: 'command' },
  { id: 'menu:git-merge', label: 'Git Merge...', category: 'Git', type: 'command' },
  { id: 'menu:git-remote-add', label: 'Git Remote Add...', category: 'Git', type: 'command' },
  { id: 'menu:git-init', label: 'Git Init', category: 'Git', type: 'command' },
  { id: 'menu:git-clone', label: 'Git Clone...', category: 'Git', type: 'command' },
  { id: 'menu:debug-test-all', label: 'Run Debug Tests', category: 'Help', shortcut: 'Ctrl+Shift+T', type: 'command' },
  { id: 'menu:github-dashboard', label: 'GitHub Dashboard...', category: 'GitHub', type: 'command' },
  { id: 'menu:settings', label: 'Settings', category: 'File', shortcut: 'Ctrl+,', type: 'command' },
  { id: 'menu:check-updates', label: 'Check for Updates...', category: 'Help', type: 'command' },
  { id: 'menu:about', label: 'About ViStudio', category: 'Help', type: 'command' },
]

const HARDCODED_LANGUAGES: Record<string, string> = {
  js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
  py: 'python', html: 'html', css: 'css', json: 'json', md: 'markdown',
  java: 'java', cpp: 'cpp', c: 'c', h: 'c', cs: 'csharp', go: 'go', rs: 'rust',
  rb: 'ruby', php: 'php', sh: 'shell', xml: 'xml', yaml: 'yaml', yml: 'yaml',
  sql: 'sql', vue: 'vue', svelte: 'svelte'
}

const getLanguageFromExtension = (fileName: string, host?: any): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  if (host && host.getLanguages) {
    const langs = host.getLanguages() as Map<string, any>
    for (const [, lang] of langs) {
      if (lang.extensions && lang.extensions.includes('.' + ext)) {
        return lang.id
      }
    }
  }
  return HARDCODED_LANGUAGES[ext] || 'plaintext'
}

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(250)
  const sidebarWidthRef = useRef(sidebarWidth)
  const [folderPath, setFolderPath] = useState<string | null>(null)
  const [tabs, setTabs] = useState<EditorTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [_cursorPosition, _setCursorPosition] = useState({ line: 1, column: 1 })
  const [_projectConfig, setProjectConfig] = useState<any>(null)
  const [refreshPath, setRefreshPath] = useState<string | null>(null)
  const [showFolderInput, setShowFolderInput] = useState(false)
  const [folderInputValue, setFolderInputValue] = useState('')
  const [folderInputTarget, setFolderInputTarget] = useState('')
  const [showFileInput, setShowFileInput] = useState(false)
  const [fileInputValue, setFileInputValue] = useState('')
  const [fileInputTarget, setFileInputTarget] = useState('')
  const [showProjectInput, setShowProjectInput] = useState(false)
  const [projectNameValue, setProjectNameValue] = useState('MyProject')
  const [projectDirValue, setProjectDirValue] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [unsavedChangesModal, setUnsavedChangesModal] = useState<{ tabId: string; tabName: string } | null>(null)
  const [terminalVisible, setTerminalVisible] = useState(false)
  const [extensionsLoaded, setExtensionsLoaded] = useState(0)
  const [extensionsList, setExtensionsList] = useState<ExtensionInfo[]>([])
  const [extensionsPanelVisible, setExtensionsPanelVisible] = useState(false)
  const [consoleVisible, setConsoleVisible] = useState(false)
  const [consoleLogs, setConsoleLogs] = useState<Array<{ id: string; timestamp: string; level: 'log' | 'warn' | 'error' | 'info'; message: string }>>([])
  const [commandPaletteVisible, setCommandPaletteVisible] = useState(false)
  const [searchPanelVisible, setSearchPanelVisible] = useState(false)
  const [sidebarActivePanel, setSidebarActivePanel] = useState<'explorer' | 'git'>('explorer')
  const [gitBranch, setGitBranch] = useState<string>('')
  const [settingsPanelVisible, setSettingsPanelVisible] = useState(false)
  const [settings, setSettings] = useState<EditorSettings>({
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
    'editor.scrollBeyondLastLine': true,
    'editor.bracketPairColorization': true,
    'editor.bracketPairGuides': true,
    'editor.indentationGuides': true,
    'files.autoSave': 'off',
    'files.autoSaveDelay': 1000,
    'workbench.colorTheme': 'vs-dark-enhanced'
  })
  const [availableThemes, setAvailableThemes] = useState<Array<{ id: string; label: string; type: 'dark' | 'light' }>>([
    { id: 'vs-dark-enhanced', label: 'ViStudio Dark Enhanced', type: 'dark' },
    { id: 'vs-light-enhanced', label: 'ViStudio Light Enhanced', type: 'light' },
    { id: 'vs-dark', label: 'Dark (VS)', type: 'dark' },
    { id: 'vs', label: 'Light (VS)', type: 'light' }
  ])
  const [extensionThemes, setExtensionThemes] = useState<RegisteredTheme[]>([])
  const [updatePanelVisible, setUpdatePanelVisible] = useState(false)
  const [updateNotification, setUpdateNotification] = useState<{ version: string } | null>(null)
  const [recentFolders, setRecentFolders] = useState<string[]>([])
  const [cloneModalVisible, setCloneModalVisible] = useState(false)
  const [githubModalVisible, setGitHubModalVisible] = useState(false)
  const [gitStatusModalVisible, setGitStatusModalVisible] = useState(false)
  const [changesCount, setChangesCount] = useState(0)
  const appVersion = pkg.version
  const extensionHostRef = useRef<ExtensionHost | null>(null)

  const syncExtensionThemes = useCallback(() => {
    if (extensionHostRef.current) {
      const et = extensionHostRef.current.getThemes()
      setExtensionThemes(et)
      for (const t of et) {
        if (t.uiColors && Object.keys(t.uiColors).length > 0) {
          themeManager.registerThemeUI({ id: t.id, label: t.label, type: t.type, uiColors: t.uiColors })
        }
      }
      if (et.length > 0) {
        setAvailableThemes(prev => {
          const builtin = prev.filter(t => !et.find(e => e.id === t.id))
          return [...builtin, ...et.map(t => ({ id: t.id, label: t.label, type: t.type }))]
        })
      }
    }
  }, [])

  useEffect(() => {
    themeManager.applyTheme(settings['workbench.colorTheme'])
  }, [settings])

  useEffect(() => {
    window.electronAPI?.appReady()
  }, [])

  useEffect(() => {
    sidebarWidthRef.current = sidebarWidth
  }, [sidebarWidth])

  useEffect(() => {
    const handle = document.querySelector('.sidebar-resize-handle')
    if (!handle) return

    let isResizing = false
    let startX = 0
    let startWidth = 0

    const onMouseDown = (e: MouseEvent) => {
      isResizing = true
      startX = e.clientX
      startWidth = sidebarWidthRef.current
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'
      e.preventDefault()
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const delta = e.clientX - startX
      const newWidth = Math.max(150, Math.min(600, startWidth + delta))
      setSidebarWidth(newWidth)
    }

    const onMouseUp = () => {
      if (!isResizing) return
      isResizing = false
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    handle.addEventListener('mousedown', onMouseDown as EventListener)
    document.addEventListener('mousemove', onMouseMove as EventListener)
    document.addEventListener('mouseup', onMouseUp as EventListener)

    return () => {
      handle.removeEventListener('mousedown', onMouseDown as EventListener)
      document.removeEventListener('mousemove', onMouseMove as EventListener)
      document.removeEventListener('mouseup', onMouseUp as EventListener)
    }
  }, [])

  const addLog = useCallback((level: 'log' | 'warn' | 'error' | 'info', message: string) => {
    const logId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const now = new Date()
    const timestamp = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setConsoleLogs(prev => {
      if (prev.length > 1000) return prev.slice(-500)
      return [...prev, { id: logId, timestamp, level, message }]
    })
  }, [])

  useEffect(() => {
    const origLog = console.log
    const origWarn = console.warn
    const origError = console.error
    const origInfo = console.info

    let isLogging = false

    console.log = function(...args) {
      if (isLogging) return origLog.apply(console, args)
      isLogging = true
      try {
        const msg = args.map(a => {
          if (typeof a === 'string') return a
          if (typeof a === 'object' && a !== null && a.type) return '[React Element]'
          try { return JSON.stringify(a) } catch { return String(a) }
        }).join(' ')
        addLog('log', msg)
      } catch (e) {}
      origLog.apply(console, args)
      isLogging = false
    }
    console.warn = function(...args) {
      if (isLogging) return origWarn.apply(console, args)
      isLogging = true
      try {
        const msg = args.map(a => {
          if (typeof a === 'string') return a
          try { return JSON.stringify(a) } catch { return String(a) }
        }).join(' ')
        addLog('warn', msg)
      } catch (e) {}
      origWarn.apply(console, args)
      isLogging = false
    }
    console.error = function(...args) {
      if (isLogging) return origError.apply(console, args)
      isLogging = true
      try {
        const msg = args.map(a => {
          if (typeof a === 'string') return a
          try { return JSON.stringify(a) } catch { return String(a) }
        }).join(' ')
        addLog('error', msg)
      } catch (e) {}
      origError.apply(console, args)
      isLogging = false
    }
    console.info = function(...args) {
      if (isLogging) return origInfo.apply(console, args)
      isLogging = true
      try {
        const msg = args.map(a => {
          if (typeof a === 'string') return a
          try { return JSON.stringify(a) } catch { return String(a) }
        }).join(' ')
        addLog('info', msg)
      } catch (e) {}
      origInfo.apply(console, args)
      isLogging = false
    }

    window.addEventListener('error', function(e) {
      addLog('error', 'Error: ' + (e.message || 'Unknown error'))
    })

    window.addEventListener('unhandledrejection', function(e) {
      addLog('error', 'Unhandled rejection: ' + (e.reason?.message || String(e.reason)))
    })

    addLog('info', 'ViStudio console initialized')
    return () => {
      console.log = origLog
      console.warn = origWarn
      console.error = origError
      console.info = origInfo
    }
  }, [addLog])

  const handleMenuActionRef = useRef<(action: string) => void>(() => {})
  const handleNewFileRef = useRef<() => Promise<void>>(() => Promise.resolve())
  const handleCreateFolderRef = useRef<() => Promise<void>>(() => Promise.resolve())
  const handleCreateProjectRef = useRef<() => Promise<void>>(() => Promise.resolve())
  const handleOpenFileRef = useRef<() => Promise<void>>(() => Promise.resolve())
  const handleOpenFolderRef = useRef<() => Promise<void>>(() => Promise.resolve())
  const handleOpenProjectRef = useRef<() => Promise<void>>(() => Promise.resolve())
  const handleSaveRef = useRef<() => Promise<void>>(() => Promise.resolve())
  const handleSaveAsRef = useRef<() => Promise<void>>(() => Promise.resolve())

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      const shift = e.shiftKey

      if (ctrl && shift && e.key === 'P') {
        e.preventDefault()
        setCommandPaletteVisible(prev => !prev)
      } else if (ctrl && e.key === 'p') {
        e.preventDefault()
        setCommandPaletteVisible(true)
      } else if (ctrl && shift && e.key === 'F') {
        e.preventDefault()
        setSearchPanelVisible(prev => !prev)
      } else if (ctrl && e.key === 'b') {
        e.preventDefault()
        setSidebarOpen(prev => !prev)
      } else if (ctrl && e.key === 'n') {
        e.preventDefault()
        handleMenuActionRef.current('menu:new-file')
      } else if (ctrl && e.key === 'o' && !shift) {
        e.preventDefault()
        handleMenuActionRef.current('menu:open-file')
      } else if (ctrl && shift && e.key === 'O') {
        e.preventDefault()
        handleMenuActionRef.current('menu:open-folder')
      } else if (ctrl && e.key === 's' && !shift) {
        e.preventDefault()
        handleMenuActionRef.current('menu:save')
      } else if (ctrl && shift && e.key === 'S') {
        e.preventDefault()
        handleMenuActionRef.current('menu:save-as')
      } else if (ctrl && e.key === '`') {
        e.preventDefault()
        handleMenuActionRef.current('menu:toggle-terminal')
      } else if (ctrl && shift && e.key === 'G') {
        e.preventDefault()
        handleMenuActionRef.current('menu:source-control')
      } else if (ctrl && shift && e.key === 'U') {
        e.preventDefault()
        handleMenuActionRef.current('menu:toggle-console')
      } else if (ctrl && e.key === ',') {
        e.preventDefault()
        handleMenuActionRef.current('menu:settings')
      } else if (e.key === 'Escape') {
        setCommandPaletteVisible(false)
        setSearchPanelVisible(false)
        setExtensionsPanelVisible(false)
        setSettingsPanelVisible(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onMenuAction) {
      const cleanup = window.electronAPI.onMenuAction((action: string) => {
        handleMenuActionRef.current(action)
      })
      return cleanup
    }
  }, [])

  useEffect(() => {
    if (!folderPath || !window.electronAPI) { setGitBranch(''); return }
    window.electronAPI.git.branch(folderPath).then(r => {
      if (r.success && r.branch) setGitBranch(r.branch)
    }).catch(() => {})
  }, [folderPath])

  useEffect(() => {
    if (window.electronAPI && window.electronAPI.settings) {
      window.electronAPI.settings.load().then(result => {
        if (result.success && result.settings) {
          setSettings(prev => ({ ...prev, ...result.settings }))
          if (result.settings['recentFolders']) {
            setRecentFolders(result.settings['recentFolders'])
          }
        }
      }).catch(() => {})
    }
  }, [])

  const getPaletteCommands = useCallback((): CommandItem[] => {
    const commands = [...BUILTIN_COMMANDS]

    if (extensionHostRef.current) {
      const extCommands = extensionHostRef.current.getCommands()
      extCommands.forEach((_cmd, id) => {
        if (!commands.find(c => c.id === id)) {
          commands.push({ id, label: id, category: 'Extension', type: 'command' })
        }
      })
    }

    if (folderPath) {
      tabs.forEach(tab => {
        if (tab.path) {
          commands.push({
            id: 'file:' + tab.path,
            label: tab.name,
            category: tab.path.replace(folderPath + '/', ''),
            type: 'file',
            path: tab.path
          })
        }
      })
    }

    return commands
  }, [folderPath, tabs])

  const getActiveTabContent = useCallback(() => {
    const tab = tabs.find(t => t.id === activeTabId) || null
    if (!tab) return null
    return { path: tab.path, content: tab.content, language: tab.language }
  }, [tabs, activeTabId])

  const setActiveTabContent = useCallback((content: string) => {
    if (activeTabId) {
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, content, isModified: true } : t))
    }
  }, [activeTabId])

  const setEditorLanguage = useCallback((languageId: string) => {
    if (activeTabId) {
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, language: languageId } : t))
    }
  }, [activeTabId])

  const getWorkspacePath = useCallback(() => folderPath, [folderPath])

  const getActiveTabContentRef = useRef(getActiveTabContent)
  const setActiveTabContentRef = useRef(setActiveTabContent)
  const setEditorLanguageRef = useRef(setEditorLanguage)
  const getWorkspacePathRef = useRef(getWorkspacePath)

  useEffect(() => {
    getActiveTabContentRef.current = getActiveTabContent
    setActiveTabContentRef.current = setActiveTabContent
    setEditorLanguageRef.current = setEditorLanguage
    getWorkspacePathRef.current = getWorkspacePath
  })

  useEffect(() => {
    console.log('[App] Extension useEffect running')
    if (window.electronAPI) {
      console.log('[App] electronAPI available')
      window.electronAPI.log('[App] Extension system initializing').catch(() => {})
      const initExtensions = async () => {
        try {
          const dataPath = await window.electronAPI.getDataPath()
          const host = new ExtensionHost(
            () => getActiveTabContentRef.current(),
            (content: string) => setActiveTabContentRef.current(content),
            (languageId: string) => setEditorLanguageRef.current(languageId),
            () => getWorkspacePathRef.current(),
            window.electronAPI.fs,
            window.electronAPI.terminal,
            { appPath: '/opt/vistudio' },
            themeManager,
            dataPath + '/extension-debug.log'
          )
          extensionHostRef.current = host

          const defaultExtDir = dataPath + '/extensions'
          const exists = await window.electronAPI.fs.exists(defaultExtDir)
          if (exists) {
            const count = await host.loadExtensionsFromDirectory(defaultExtDir)
            setExtensionsLoaded(count)
            setExtensionsList(host.getAllExtensions())
            await host.activateExtensionsByEvent('*')
            setExtensionsList(host.getAllExtensions())
            syncExtensionThemes()
          }
        } catch (e) {
          console.error('Failed to load extensions:', e)
        }
      }
      initExtensions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onAvailable = window.electronAPI?.update.onAvailable
    if (onAvailable) {
      onAvailable((info: { version: string }) => {
        if (settings['update.checkOnStartup'] !== false) {
          setUpdateNotification({ version: info.version })
        }
      })
    }
  }, [settings])

  useEffect(() => {
    const handler = (e: Event) => {
      const action = (e as CustomEvent).detail as string
      handleMenuActionRef.current(action === 'help-docs' ? '' : '')
      switch (action) {
        case 'help-docs':
          window.open('https://github.com/regalf/vistudio/wiki', '_blank')
          break
        case 'help-github':
          window.open('https://github.com/regalf/vistudio', '_blank')
          break
        case 'manage-extensions':
          setExtensionsPanelVisible(true)
          break
        case 'check-updates':
          setUpdatePanelVisible(true)
          break
      }
    }
    window.addEventListener('welcome-action', handler)
    return () => window.removeEventListener('welcome-action', handler)
  }, [])

  const activeTab = tabs.find(t => t.id === activeTabId) || null

  const openFileInTab = useCallback(async (path: string | null, content: string, isNew: boolean = false) => {
    const name = path ? path.split('/').pop() || 'Untitled' : 'Untitled'
    const language = path ? getLanguageFromExtension(path, extensionHostRef.current) : 'plaintext'
    const id = path || `new-${Date.now()}`
    
    setTabs(prev => {
      const existing = prev.find(t => t.path === path && path !== null)
      if (existing) {
        return prev
      }
      return [...prev, { id, path, name, content, language, isModified: false, isNew }]
    })
    setActiveTabId(id)
  }, [])

  const closeTab = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId)
    if (tab && tab.isModified) {
      setUnsavedChangesModal({ tabId, tabName: tab.name })
      return
    }
    
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId)
      if (activeTabId === tabId) {
        setActiveTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null)
      }
      return newTabs
    })
  }, [tabs, activeTabId])

  const confirmCloseTabRef = useRef<(action: 'save' | 'discard' | 'cancel') => Promise<void>>(() => Promise.resolve())

  const switchTab = useCallback((tabId: string) => {
    setActiveTabId(tabId)
  }, [])

  const handleTabReorder = useCallback((newTabs: EditorTab[]) => {
    setTabs(newTabs)
  }, [])

  const updateTabContent = useCallback((tabId: string, content: string) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, content, isModified: true } : t))
  }, [])

  const saveTab = useCallback(async (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId)
    if (!tab || !tab.path) return
    
    try {
      if (window.electronAPI) {
        await window.electronAPI.fs.writeFile(tab.path, tab.content)
        setTabs(prev => prev.map(t => t.id === tabId ? { ...t, isModified: false, isNew: false } : t))
      }
    } catch (e) {
      console.error('Failed to save file:', e)
    }
  }, [tabs])

  const confirmCloseTab = useCallback(async (action: 'save' | 'discard' | 'cancel') => {
    if (!unsavedChangesModal) return
    
    const { tabId } = unsavedChangesModal
    setUnsavedChangesModal(null)
    
    if (action === 'cancel') return
    
    if (action === 'save') {
      const tab = tabs.find(t => t.id === tabId)
      if (tab) {
        if (tab.isNew || !tab.path) {
          try {
            if (window.electronAPI) {
              const defaultPath = folderPath ? `${folderPath}/${tab.name}` : undefined
              const path = await window.electronAPI.dialog.saveFile(defaultPath)
              if (path) {
                await window.electronAPI.fs.writeFile(path, tab.content)
                setTabs(prev => prev.map(t => t.id === tabId ? { ...t, path, name: path.split('/').pop() || 'Untitled', isModified: false, isNew: false } : t))
              } else {
                return
              }
            }
          } catch (e) {
            console.error('Failed to save:', e)
            return
          }
        } else {
          await saveTab(tabId)
        }
      }
    }
    
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId)
      if (activeTabId === tabId) {
        setActiveTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null)
      }
      return newTabs
    })
  }, [unsavedChangesModal, tabs, activeTabId, folderPath, saveTab])

  const handleClone = useCallback(async (url: string, destPath: string) => {
    if (!window.electronAPI) throw new Error('No electronAPI')
    const result = await window.electronAPI.git.clone(url, destPath)
    if (!result.success) throw new Error(result.error || 'Clone failed')
    if (result.path) {
      setFolderPath(result.path)
      setSidebarActivePanel('git')
      setSidebarOpen(true)
      setRecentFolders(prev => {
        const next = [result.path!, ...prev.filter(p => p !== result.path)].slice(0, 10)
        window.electronAPI?.settings.save({ recentFolders: next }).catch(() => {})
        return next
      })
    }
  }, [])

  const handleOpenFolder = useCallback(async () => {
    try {
      if (window.electronAPI) {
        const path = await window.electronAPI.dialog.openFolder()
        if (path) {
          setFolderPath(path)
          setRecentFolders(prev => {
            const next = [path, ...prev.filter(p => p !== path)].slice(0, 10)
            window.electronAPI?.settings.save({ recentFolders: next }).catch(() => {})
            return next
          })
        }
      }
    } catch (e) {
      console.error('Failed to open folder:', e)
    }
  }, [])

  const handleOpenRecent = useCallback((path: string) => {
    setFolderPath(path)
    setRecentFolders(prev => {
      const next = [path, ...prev.filter(p => p !== path)].slice(0, 10)
      window.electronAPI?.settings.save({ recentFolders: next }).catch(() => {})
      return next
    })
  }, [])

  const handleRemoveRecent = useCallback((path: string) => {
    setRecentFolders(prev => {
      const next = prev.filter(p => p !== path)
      window.electronAPI?.settings.save({ recentFolders: next }).catch(() => {})
      return next
    })
  }, [])

  const handleClearRecents = useCallback(() => {
    setRecentFolders([])
    window.electronAPI?.settings.save({ recentFolders: [] }).catch(() => {})
  }, [])

  const handleOpenProject = useCallback(async () => {
    try {
      if (window.electronAPI) {
        const projPath = await window.electronAPI.dialog.openProject()
        if (projPath) {
          const folder = projPath.substring(0, projPath.lastIndexOf('/'))
          setFolderPath(folder)
        }
      }
    } catch (e) {
      console.error('Failed to open project:', e)
    }
  }, [])

  const handleCreateProject = useCallback(async () => {
    setShowProjectInput(true)
    setProjectNameValue('MyProject')
    setProjectDirValue('')
    setSelectedTemplate('')
  }, [])

  const getProjectTemplates = useCallback(() => {
    if (extensionHostRef.current) {
      return extensionHostRef.current.getProjectTemplates()
    }
    return []
  }, [])

  const handleCreateFolder = useCallback(async () => {
    setShowFolderInput(true)
    setFolderInputValue('NewFolder')
    setFolderInputTarget(folderPath || '')
  }, [folderPath])

  const handleNewFileInExplorer = useCallback((parentPath: string) => {
    setShowFileInput(true)
    setFileInputValue('untitled.txt')
    setFileInputTarget(parentPath)
  }, [])

  const handleNewFolderInExplorer = useCallback((parentPath: string) => {
    setShowFolderInput(true)
    setFolderInputValue('NewFolder')
    setFolderInputTarget(parentPath)
  }, [])

  const handleRefreshExplorer = useCallback(() => {
    setRefreshPath(folderPath)
  }, [folderPath])

  const handleClearConsole = useCallback(() => {
    setConsoleLogs([])
  }, [])

  const handleFolderInputConfirm = useCallback(async () => {
    if (!folderInputValue) {
      setShowFolderInput(false)
      return
    }
    try {
      if (window.electronAPI) {
        const newFolderPath = await window.electronAPI.folder.create(folderInputValue, folderInputTarget || undefined)
        if (newFolderPath) {
          setRefreshPath(folderInputTarget || folderPath)
        }
      }
    } catch (e) {
      console.error('Failed to create folder:', e)
    }
    setShowFolderInput(false)
  }, [folderInputValue, folderInputTarget, folderPath])

  const handleFileInputConfirm = useCallback(async () => {
    if (!fileInputValue) {
      setShowFileInput(false)
      return
    }
    try {
      if (window.electronAPI) {
        const newFilePath = await window.electronAPI.file.create(fileInputValue, fileInputTarget)
        if (newFilePath) {
          setRefreshPath(fileInputTarget)
        }
      }
    } catch (e) {
      console.error('Failed to create file:', e)
    }
    setShowFileInput(false)
  }, [fileInputValue, fileInputTarget])

  const handleProjectInputConfirm = useCallback(async () => {
    if (!projectNameValue || !projectDirValue) {
      setShowProjectInput(false)
      return
    }
    try {
      if (window.electronAPI) {
        const templates = getProjectTemplates()
        const template = templates.find(t => t.id === selectedTemplate)
        const templateFiles = template ? template.files : {}
        const language = template ? template.language : undefined
        const entryPoint = template && template.files ? Object.keys(template.files).find(f => /^src\/main\./.test(f)) : undefined
        const result = await window.electronAPI.project.create(projectNameValue, projectDirValue, templateFiles, language, entryPoint)
        if (result.success && result.projectDir) {
          setFolderPath(result.projectDir)
          setProjectConfig({ name: projectNameValue })
          const mainFileMap: Record<string, string> = {
            'c-basic': 'src/main.c',
            'cpp-basic': 'src/main.cpp'
          }
          const mainFile = mainFileMap[selectedTemplate] || 'src/main.ts'
          const mainPath = result.projectDir + '/' + mainFile
          const exists = await window.electronAPI.fs.exists(mainPath)
          if (exists) {
            const fileResult = await window.electronAPI.fs.readFile(mainPath)
            if (fileResult.success && fileResult.content !== undefined) {
              openFileInTab(mainPath, fileResult.content)
            }
          }
        } else if (result.error) {
          alert(result.error)
        }
      }
    } catch (e) {
      console.error('Failed to create project:', e)
    }
    setShowProjectInput(false)
  }, [projectNameValue, projectDirValue, selectedTemplate, getProjectTemplates, openFileInTab])

  const handleOpenFile = useCallback(async () => {
    try {
      if (window.electronAPI) {
        const path = await window.electronAPI.dialog.openFile()
        if (path) {
          const result = await window.electronAPI.fs.readFile(path)
          if (result.success && result.content !== undefined) {
            openFileInTab(path, result.content)
          }
        }
      }
    } catch (e) {
      console.error('Failed to open file:', e)
    }
  }, [openFileInTab])

  const handleFileClick = useCallback(async (path: string, _line?: number) => {
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.fs.readFile(path)
        if (result.success && result.content !== undefined) {
          openFileInTab(path, result.content)
        }
      }
    } catch (e) {
      console.error('Failed to open file:', e)
    }
  }, [openFileInTab])

  const handleProjectLoad = useCallback((projectPath: string) => {
    console.log('Project loaded:', projectPath)
  }, [])

  const handleNewFile = useCallback(async () => {
    openFileInTab(null, '', true)
  }, [openFileInTab])

  const handleSave = useCallback(async () => {
    if (!activeTabId) return
    const tab = tabs.find(t => t.id === activeTabId)
    if (!tab) return

    if (tab.isNew || !tab.path) {
      try {
        if (window.electronAPI) {
          const defaultPath = folderPath ? `${folderPath}/${tab.name}` : undefined
          const path = await window.electronAPI.dialog.saveFile(defaultPath)
          if (path) {
            await window.electronAPI.fs.writeFile(path, tab.content)
            setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, path, name: path.split('/').pop() || 'Untitled', isModified: false, isNew: false } : t))
          }
        }
      } catch (e) {
        console.error('Failed to save:', e)
      }
    } else {
      saveTab(activeTabId)
    }
  }, [activeTabId, tabs, folderPath, saveTab])

  const handleSaveAs = useCallback(async () => {
    if (!activeTabId) return
    const tab = tabs.find(t => t.id === activeTabId)
    if (!tab) return

    try {
      if (window.electronAPI) {
        const defaultPath = folderPath ? `${folderPath}/` : undefined
        const path = await window.electronAPI.dialog.saveFile(defaultPath)
        if (path) {
          await window.electronAPI.fs.writeFile(path, tab.content)
          setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, path, name: path.split('/').pop() || 'Untitled', isModified: false, isNew: false } : t))
        }
      }
    } catch (e) {
      console.error('Failed to save as:', e)
    }
  }, [activeTabId, tabs, folderPath])

  const handleMenuAction = useCallback(async (action: string) => {
    console.log('Menu action:', action)
    switch (action) {
      case 'menu:new-file':
        await handleNewFileRef.current()
        break
      case 'menu:new-folder':
        await handleCreateFolderRef.current()
        break
      case 'menu:new-project':
        await handleCreateProjectRef.current()
        break
      case 'menu:open-file':
        await handleOpenFileRef.current()
        break
      case 'menu:open-folder':
        await handleOpenFolderRef.current()
        break
      case 'menu:open-project':
        await handleOpenProjectRef.current()
        break
      case 'menu:save':
        await handleSaveRef.current()
        break
      case 'menu:save-as':
        await handleSaveAsRef.current()
        break
      case 'menu:toggle-sidebar':
        setSidebarOpen(prev => !prev)
        break
      case 'menu:toggle-terminal':
        setTerminalVisible(prev => !prev)
        break
      case 'menu:toggle-console':
        setConsoleVisible(prev => !prev)
        break
      case 'menu:command-palette':
        setCommandPaletteVisible(prev => !prev)
        break
      case 'menu:debug-test-all':
        if (extensionHostRef.current) {
          const cmd = extensionHostRef.current.getCommands().get('debug.testAll')
          if (cmd) cmd.handler()
          else alert('Debug extension not loaded')
        }
        break
      case 'menu:check-updates':
        setUpdatePanelVisible(prev => !prev)
        setUpdateNotification(null)
        break
      case 'menu:about':
        alert('ViStudio IDE v' + appVersion + '\nExtensions API loaded!')
        break
      case 'menu:settings':
        setSettingsPanelVisible(prev => !prev)
        break
      case 'menu:load-extension':
      case 'menu:install-extension':
        if (window.electronAPI) {
          window.electronAPI.dialog.openFolder().then(async (extPath) => {
            if (extPath && extensionHostRef.current) {
              const ext = await extensionHostRef.current.loadExtension(extPath)
              if (ext) {
                await extensionHostRef.current.activateExtension(ext.id)
                setExtensionsLoaded(prev => prev + 1)
                setExtensionsList(extensionHostRef.current.getAllExtensions())
              }
            }
          })
        }
        break
      case 'menu:manage-extensions':
        setExtensionsPanelVisible(prev => !prev)
        if (extensionHostRef.current) {
          setExtensionsList(extensionHostRef.current.getAllExtensions())
        }
        break
      case 'menu:refresh-extensions':
        if (extensionHostRef.current) {
          setExtensionsList(extensionHostRef.current.getAllExtensions())
          setExtensionsLoaded(extensionHostRef.current.getAllExtensions().length)
        }
        break
      case 'menu:toggle-search':
        setSearchPanelVisible(prev => !prev)
        break
      case 'menu:source-control':
        setSidebarOpen(true)
        setSidebarActivePanel(prev => prev === 'git' ? 'explorer' : 'git')
        break
      case 'menu:git-status':
        if (folderPath) {
          setGitStatusModalVisible(true)
        }
        break
      case 'menu:git-commit':
        if (folderPath && window.electronAPI) {
          setSidebarOpen(true)
          setSidebarActivePanel('git')
        }
        break
      case 'menu:git-pull':
        if (folderPath && window.electronAPI) {
          window.electronAPI.git.pull(folderPath).then(r => {
            window.electronAPI!.git.logHistory({ operation: 'Pull', success: r.success, error: r.error })
            if (r.success) addLog('info', 'Git pull completed')
            else addLog('error', `Git pull failed: ${r.error}`)
          })
        }
        break
      case 'menu:git-fetch':
        if (folderPath && window.electronAPI) {
          window.electronAPI.git.fetch(folderPath).then(r => {
            if (r.success) addLog('info', 'Git fetch completed')
            else addLog('error', `Git fetch failed: ${r.error}`)
          })
        }
        break
      case 'menu:git-push':
        if (folderPath && window.electronAPI) {
          window.electronAPI.git.push(folderPath).then(r => {
            if (r.success) {
              window.electronAPI!.git.logHistory({ operation: 'Push', success: true })
              addLog('info', 'Git push completed')
            } else {
              if (r.error && (r.error.includes('no upstream') || r.error.includes('set-upstream'))) {
                window.electronAPI.git.pushUpstream(folderPath, gitBranch).then(r2 => {
                  window.electronAPI!.git.logHistory({ operation: 'Push Upstream', success: r2.success, error: r2.error })
                  if (r2.success) addLog('info', 'Git push completed (upstream set)')
                  else addLog('error', `Git push failed: ${r2.error}`)
                })
              } else {
                window.electronAPI!.git.logHistory({ operation: 'Push', success: false, error: r.error })
                addLog('error', `Git push failed: ${r.error}`)
              }
            }
          })
        }
        break
      case 'menu:git-fetch':
        if (folderPath && window.electronAPI) {
          window.electronAPI.git.fetch(folderPath).then(r => {
            window.electronAPI!.git.logHistory({ operation: 'Fetch', success: r.success, error: r.error })
            if (r.success) addLog('info', 'Git fetch completed')
            else addLog('error', `Git fetch failed: ${r.error}`)
          })
        }
        break
      case 'menu:git-merge':
        if (folderPath && window.electronAPI) {
          setSidebarOpen(true)
          setSidebarActivePanel('git')
        }
        break
      case 'menu:git-remote-add':
        if (folderPath && window.electronAPI) {
          setSidebarOpen(true)
          setSidebarActivePanel('git')
        }
        break
      case 'menu:github-dashboard':
        setGitHubModalVisible(true)
        break
      case 'menu:git-init':
        if (folderPath && window.electronAPI) {
          window.electronAPI.git.init(folderPath).then(r => {
            window.electronAPI!.git.logHistory({ operation: 'Init', success: r.success, error: r.error })
            if (r.success) {
              addLog('info', 'Git repository initialized')
              window.electronAPI.git.branch(folderPath).then(b => {
                if (b.success && b.branch) setGitBranch(b.branch)
              })
            } else addLog('error', `Git init failed: ${r.error}`)
          })
        }
        break
      case 'menu:git-clone':
        setCloneModalVisible(true)
        break
    }
  }, [extensionsLoaded, folderPath, addLog])

  const handleSettingsApply = useCallback((newSettings: EditorSettings) => {
    setSettings(newSettings)
    if (window.electronAPI && window.electronAPI.settings) {
      window.electronAPI.settings.save(newSettings).catch(() => {})
    }
  }, [])

  const handleSettingChange = useCallback((key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    if (window.electronAPI && window.electronAPI.settings) {
      window.electronAPI.settings.save({ [key]: value }).catch(() => {})
    }
  }, [])

  useEffect(() => {
    handleNewFileRef.current = handleNewFile
    handleCreateFolderRef.current = handleCreateFolder
    handleCreateProjectRef.current = handleCreateProject
    handleOpenFileRef.current = handleOpenFile
    handleOpenFolderRef.current = handleOpenFolder
    handleOpenProjectRef.current = handleOpenProject
    handleSaveRef.current = handleSave
    handleSaveAsRef.current = handleSaveAs
    handleMenuActionRef.current = handleMenuAction
    confirmCloseTabRef.current = confirmCloseTab
  })

  const handlePaletteSelect = useCallback((cmd: CommandItem) => {
    setCommandPaletteVisible(false)
    if (cmd.type === 'file' && cmd.path) {
      handleFileClick(cmd.path)
    } else {
      handleMenuAction(cmd.id)
    }
  }, [handleFileClick, handleMenuAction])

  const handleEditorChange = useCallback((value: string) => {
    if (activeTabId) {
      updateTabContent(activeTabId, value)
    }
  }, [activeTabId, updateTabContent])

  const handleActivateExtension = useCallback(async (id: string) => {
    console.log('[App] Activating extension:', id)
    if (extensionHostRef.current) {
      const result = await extensionHostRef.current.activateExtension(id)
      console.log('[App] Activate result:', result)
      setExtensionsList(extensionHostRef.current.getAllExtensions())
      console.log('[App] Extensions list updated')
    }
  }, [])

  const handleDeactivateExtension = useCallback(async (id: string) => {
    console.log('[App] Deactivating extension:', id)
    if (extensionHostRef.current) {
      const result = await extensionHostRef.current.deactivateExtension(id)
      console.log('[App] Deactivate result:', result)
      setExtensionsList(extensionHostRef.current.getAllExtensions())
      console.log('[App] Extensions list updated')
    }
  }, [])

  const handleDeleteExtension = useCallback(async (id: string) => {
    if (window.electronAPI && extensionHostRef.current) {
      const ext = extensionHostRef.current.getExtension(id)
      if (ext && confirm(`Delete extension "${ext.manifest.name}"?`)) {
        await extensionHostRef.current.deactivateExtension(id)
        const result = await window.electronAPI.extension.delete(ext.path)
        if (result.success) {
          const dataPath = await window.electronAPI.getDataPath()
          extensionHostRef.current = new ExtensionHost(
            () => getActiveTabContentRef.current(),
            (content: string) => setActiveTabContentRef.current(content),
            (languageId: string) => setEditorLanguageRef.current(languageId),
            () => getWorkspacePathRef.current(),
            window.electronAPI.fs,
            window.electronAPI.terminal,
            { appPath: '/opt/vistudio' },
            themeManager,
            dataPath + '/extension-debug.log'
          )
          const defaultExtDir = dataPath + '/extensions'
          const count = await extensionHostRef.current.loadExtensionsFromDirectory(defaultExtDir)
          setExtensionsLoaded(count)
          setExtensionsList(extensionHostRef.current.getAllExtensions())
          await extensionHostRef.current.activateExtensionsByEvent('*')
          setExtensionsList(extensionHostRef.current.getAllExtensions())
          syncExtensionThemes()
        }
      }
    }
  }, [])

  return React.createElement('div', {
    'data-theme': settings['workbench.colorTheme'],
    style: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'sans-serif'
    }
  }, [
    React.createElement(MenuBar, {
      key: 'menubar',
      onAction: handleMenuAction
    }),
    React.createElement('div', {
      key: 'main',
      style: { display: 'flex', flex: 1, overflow: 'hidden' }
    }, [
      React.createElement(Sidebar, {
        key: 'sidebar',
        isOpen: sidebarOpen,
        width: sidebarWidth,
        folderPath: folderPath,
        refreshPath: refreshPath,
        onOpenFolder: handleOpenFolder,
        onFileClick: handleFileClick,
        onProjectLoad: handleProjectLoad,
        onNewFile: handleNewFileInExplorer,
        onNewFolder: handleNewFolderInExplorer,
        onRefreshPathConsumed: () => setRefreshPath(null),
        onRefresh: handleRefreshExplorer,
        activePanel: sidebarActivePanel,
        onPanelChange: setSidebarActivePanel,
        onBranchChange: setGitBranch,
        onChangesCountChange: setChangesCount
      }),
      React.createElement('div', {
        key: 'resize-handle',
        className: 'sidebar-resize-handle',
        style: {
          width: '4px',
          cursor: 'col-resize',
          background: 'transparent',
          flexShrink: 0,
          height: '100%'
        }
      }),
      React.createElement('div', {
        key: 'editor-area',
        style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }
      }, [
        tabs.length > 0 && React.createElement(TabBar, {
          key: 'tabbar',
          tabs: tabs,
          activeTabId: activeTabId,
          onSwitch: switchTab,
          onClose: closeTab,
          onReorder: handleTabReorder
        }),
        tabs.length > 0 ? React.createElement(EditorPanel, {
          key: 'editor',
          filePath: activeTab?.path || null,
          fileName: activeTab?.name || '',
          content: activeTab?.content || '',
          language: activeTab?.language || 'plaintext',
          onChange: handleEditorChange,
          settings,
          themeName: settings['workbench.colorTheme'],
          extensionThemes,
          getCompletionProviders: () => extensionHostRef.current?.getCompletionProviders()
        }) : React.createElement(WelcomePage, {
          key: 'welcome',
          version: appVersion,
          recentFolders,
          onOpenFolder: () => handleMenuAction('menu:open-folder'),
          onNewFile: () => handleMenuAction('menu:new-file'),
          onNewProject: () => handleMenuAction('menu:new-project'),
          onOpenRecent: handleOpenRecent,
          onRemoveRecent: handleRemoveRecent,
          onClearRecents: handleClearRecents
        }),
        terminalVisible && React.createElement('div', {
          key: 'terminal-container',
          style: {
            height: '200px',
            borderTop: '1px solid #3c3c3c',
            display: 'flex',
            flexDirection: 'column'
          }
        }, [
          React.createElement('div', {
            key: 'terminal-header',
            style: {
              padding: '4px 10px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--border-primary)'
            }
          }, [
            React.createElement('span', { key: 'title' }, 'TERMINAL'),
            React.createElement('span', {
              key: 'close',
              onClick: () => setTerminalVisible(false),
              style: { cursor: 'pointer', fontSize: '16px' }
            }, '×')
          ]),
          React.createElement('div', {
            key: 'terminal-body',
            style: { flex: 1, overflow: 'hidden' }
          }, React.createElement(TerminalPanel, {
            folderPath: folderPath,
            isVisible: terminalVisible
          }))
        ])
      ]),
      consoleVisible && React.createElement(ConsolePanel, {
        key: 'console-panel',
        logs: consoleLogs,
        onClear: handleClearConsole,
        onClose: () => setConsoleVisible(false)
      }),
      settingsPanelVisible && React.createElement(SettingsPanel, {
        key: 'settings-panel',
        settings,
        onApply: handleSettingsApply,
        onClose: () => setSettingsPanelVisible(false),
        availableThemes
      }),
      updatePanelVisible && React.createElement(UpdatePanel, {
        key: 'update-panel',
        settings,
        onSettingChange: handleSettingChange,
        onClose: () => setUpdatePanelVisible(false)
      })
    ]),
    showFileInput && React.createElement('div', {
      key: 'file-modal',
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }
    }, [
      React.createElement('div', {
        key: 'modal-content',
        style: {
          background: 'var(--bg-secondary)',
          padding: '20px',
          borderRadius: '8px',
          minWidth: '300px',
          border: '1px solid var(--border-primary)'
        }
      }, [
        React.createElement('h3', {
          key: 'title',
          style: { margin: '0 0 15px 0', color: 'var(--text-primary)', fontSize: '16px' }
        }, 'New File'),
        React.createElement('input', {
          key: 'input',
          type: 'text',
          value: fileInputValue,
          onChange: (e: any) => setFileInputValue(e.target.value),
          onKeyDown: (e: any) => e.key === 'Enter' && handleFileInputConfirm(),
          autoFocus: true,
          style: {
            width: '100%',
            padding: '8px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-secondary)',
            color: 'var(--text-primary)',
            borderRadius: '4px',
            marginBottom: '15px',
            boxSizing: 'border-box'
          }
        }),
        React.createElement('div', {
          key: 'buttons',
          style: { display: 'flex', justifyContent: 'flex-end', gap: '10px' }
        }, [
          React.createElement('button', {
            key: 'cancel',
            onClick: () => setShowFileInput(false),
            style: {
              padding: '6px 16px',
              background: 'var(--bg-input)',
              border: 'none',
              color: 'var(--text-primary)',
              borderRadius: '4px',
              cursor: 'pointer'
            }
          }, 'Cancel'),
          React.createElement('button', {
            key: 'create',
            onClick: handleFileInputConfirm,
            style: {
              padding: '6px 16px',
              background: 'var(--accent)',
              border: 'none',
              color: 'var(--text-button)',
              borderRadius: '4px',
              cursor: 'pointer'
            }
          }, 'Create')
        ])
      ])
    ]),
    showFolderInput && React.createElement('div', {
      key: 'folder-modal',
      style: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }
    }, [
      React.createElement('div', {
        key: 'modal-content',
        style: {
          background: 'var(--bg-secondary)',
          padding: '20px',
          borderRadius: '8px',
          minWidth: '300px',
          border: '1px solid var(--border-primary)'
        }
      }, [
        React.createElement('h3', {
          key: 'title',
          style: { margin: '0 0 15px 0', color: 'var(--text-primary)', fontSize: '16px' }
        }, 'New Folder'),
        React.createElement('input', {
          key: 'input',
          type: 'text',
          value: folderInputValue,
          onChange: (e: any) => setFolderInputValue(e.target.value),
          onKeyDown: (e: any) => e.key === 'Enter' && handleFolderInputConfirm(),
          autoFocus: true,
          style: {
            width: '100%',
            padding: '8px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-secondary)',
            color: 'var(--text-primary)',
            borderRadius: '4px',
            marginBottom: '15px',
            boxSizing: 'border-box'
          }
        }),
        React.createElement('div', {
          key: 'buttons',
          style: { display: 'flex', justifyContent: 'flex-end', gap: '10px' }
        }, [
          React.createElement('button', {
            key: 'cancel',
            onClick: () => setShowFolderInput(false),
            style: {
              padding: '6px 16px',
              background: 'var(--bg-input)',
              border: 'none',
              color: 'var(--text-primary)',
              borderRadius: '4px',
              cursor: 'pointer'
            }
          }, 'Cancel'),
          React.createElement('button', {
            key: 'create',
            onClick: handleFolderInputConfirm,
            style: {
              padding: '6px 16px',
              background: 'var(--accent)',
              border: 'none',
              color: 'var(--text-button)',
              borderRadius: '4px',
              cursor: 'pointer'
            }
          }, 'Create')
        ])
      ])
    ]),
    showProjectInput && React.createElement('div', {
      key: 'project-modal',
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }
    }, [
      React.createElement('div', {
        key: 'modal-content',
        style: {
          background: 'var(--bg-secondary)',
          padding: '20px',
          borderRadius: '8px',
          minWidth: '400px',
          border: '1px solid var(--border-primary)'
        }
      }, [
        React.createElement('h3', {
          key: 'title',
          style: { margin: '0 0 15px 0', color: 'var(--text-primary)', fontSize: '16px' }
        }, 'New Project'),
        React.createElement('label', {
          key: 'name-label',
          style: { display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }
        }, 'Project Name'),
        React.createElement('input', {
          key: 'name-input',
          type: 'text',
          value: projectNameValue,
          onChange: (e: any) => setProjectNameValue(e.target.value),
          autoFocus: true,
          style: {
            width: '100%',
            padding: '8px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-secondary)',
            color: 'var(--text-primary)',
            borderRadius: '4px',
            marginBottom: '12px',
            boxSizing: 'border-box'
          }
        }),
        React.createElement('label', {
          key: 'template-label',
          style: { display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }
        }, 'Project Template'),
        React.createElement('select', {
          key: 'template-select',
          value: selectedTemplate,
          onChange: (e: any) => setSelectedTemplate(e.target.value),
          style: {
            width: '100%',
            padding: '8px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-secondary)',
            color: 'var(--text-primary)',
            borderRadius: '4px',
            marginBottom: '12px',
            boxSizing: 'border-box'
          }
        }, [
          React.createElement('option', { key: 'empty', value: '' }, 'Empty Project'),
          ...getProjectTemplates().map(t =>
            React.createElement('option', { key: t.id, value: t.id }, `${t.name} (${t.language})`)
          )
        ]),
        React.createElement('label', {
          key: 'dir-label',
          style: { display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }
        }, 'Parent Directory'),
        React.createElement('div', {
          key: 'dir-row',
          style: { display: 'flex', gap: '8px', marginBottom: '15px' }
        }, [
          React.createElement('input', {
            key: 'dir-input',
            type: 'text',
            value: projectDirValue,
            onChange: (e: any) => setProjectDirValue(e.target.value),
            placeholder: navigator.platform?.startsWith('Win') ? 'C:\\Users\\username\\projects' : '/home/user/projects',
            style: {
              flex: 1,
              padding: '8px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-secondary)',
              color: 'var(--text-primary)',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }
          }),
          React.createElement('button', {
            key: 'dir-btn',
            onClick: async () => {
              if (window.electronAPI) {
                const dir = await window.electronAPI.dialog.openFolder()
                if (dir) setProjectDirValue(dir)
              }
            },
            style: {
              padding: '8px 12px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-secondary)',
              color: 'var(--text-primary)',
              borderRadius: '4px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }
          }, 'Browse')
        ]),
        React.createElement('div', {
          key: 'buttons',
          style: { display: 'flex', justifyContent: 'flex-end', gap: '10px' }
        }, [
          React.createElement('button', {
            key: 'cancel',
            onClick: () => setShowProjectInput(false),
            style: {
              padding: '6px 16px',
              background: 'var(--bg-input)',
              border: 'none',
              color: 'var(--text-primary)',
              borderRadius: '4px',
              cursor: 'pointer'
            }
          }, 'Cancel'),
          React.createElement('button', {
            key: 'create',
            onClick: handleProjectInputConfirm,
            style: {
              padding: '6px 16px',
              background: 'var(--accent)',
              border: 'none',
              color: 'var(--text-button)',
              borderRadius: '4px',
              cursor: 'pointer'
            }
          }, 'Create')
        ])
      ])
    ]),
    extensionsPanelVisible && React.createElement(ExtensionsPanel, {
      key: 'extensions-panel',
      extensions: extensionsList,
      onActivate: handleActivateExtension,
      onDeactivate: handleDeactivateExtension,
      onDelete: handleDeleteExtension,
      onInstall: () => handleMenuAction('menu:install-extension'),
      onInstallRecommended: async () => {
        if (!window.electronAPI) return 0
        const result = await window.electronAPI.extension.installRecommended()
        if (result.success && result.installed && result.installed > 0) {
          const dataPath = await window.electronAPI.getDataPath()
          const host = extensionHostRef.current
          if (host) {
            const count = await host.loadExtensionsFromDirectory(dataPath + '/extensions')
            setExtensionsLoaded(count)
            setExtensionsList(host.getAllExtensions())
            await host.activateExtensionsByEvent('*')
            setExtensionsList(host.getAllExtensions())
            syncExtensionThemes()
          }
        }
        return result.installed || 0
      },
      onClose: () => setExtensionsPanelVisible(false)
    }),
    unsavedChangesModal && React.createElement('div', {
      key: 'unsaved-modal',
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1001
      }
    }, [
      React.createElement('div', {
        key: 'modal-content',
        style: {
          background: 'var(--bg-secondary)',
          padding: '20px',
          borderRadius: '8px',
          minWidth: '350px',
          border: '1px solid var(--border-primary)'
        }
      }, [
        React.createElement('h3', {
          key: 'title',
          style: { margin: '0 0 10px 0', color: 'var(--text-primary)', fontSize: '16px' }
        }, 'Save Changes?'),
        React.createElement('p', {
          key: 'message',
          style: { margin: '0 0 20px 0', color: 'var(--text-secondary)', fontSize: '13px' }
        }, `Do you want to save the changes you made to ${unsavedChangesModal.tabName}?`),
        React.createElement('div', {
          key: 'buttons',
          style: { display: 'flex', justifyContent: 'flex-end', gap: '10px' }
        }, [
          React.createElement('button', {
            key: 'discard',
            onClick: () => confirmCloseTabRef.current('discard'),
            style: {
              padding: '6px 16px',
              background: 'var(--bg-input)',
              border: 'none',
              color: 'var(--text-primary)',
              borderRadius: '4px',
              cursor: 'pointer'
            }
          }, "Don't Save"),
          React.createElement('button', {
            key: 'cancel',
            onClick: () => confirmCloseTabRef.current('cancel'),
            style: {
              padding: '6px 16px',
              background: 'var(--bg-input)',
              border: 'none',
              color: 'var(--text-primary)',
              borderRadius: '4px',
              cursor: 'pointer'
            }
          }, 'Cancel'),
          React.createElement('button', {
            key: 'save',
            onClick: () => confirmCloseTabRef.current('save'),
            style: {
              padding: '6px 16px',
              background: 'var(--accent)',
              border: 'none',
              color: 'var(--text-button)',
              borderRadius: '4px',
              cursor: 'pointer'
            }
          }, 'Save')
        ])
      ])
    ]),
    commandPaletteVisible && React.createElement(CommandPalette, {
      key: 'command-palette',
      commands: getPaletteCommands(),
      onSelect: handlePaletteSelect,
      onClose: () => setCommandPaletteVisible(false)
    }),
    searchPanelVisible && React.createElement(SearchPanel, {
      key: 'search-panel',
      folderPath: folderPath,
      fsAPI: window.electronAPI?.fs,
      onFileClick: handleFileClick,
      onClose: () => setSearchPanelVisible(false)
    }),
    updateNotification && React.createElement('div', {
      key: 'update-notification',
      style: {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--accent)',
        borderRadius: '8px',
        padding: '14px 18px',
        zIndex: 1002,
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        maxWidth: '320px'
      }
    }, [
      React.createElement('div', {
        key: 'msg',
        style: { color: 'var(--text-primary)', fontSize: '13px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }
      }, [
        React.createElement('span', { key: 'dot', style: { width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' } }),
        'Update available: v' + updateNotification.version
      ]),
      React.createElement('div', {
        key: 'buttons',
        style: { display: 'flex', gap: '6px', justifyContent: 'flex-end' }
      }, [
        React.createElement('button', {
          key: 'dismiss',
          onClick: () => setUpdateNotification(null),
          style: {
            padding: '5px 12px',
            background: 'var(--bg-input)',
            border: 'none',
            color: 'var(--text-primary)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }
        }, 'Dismiss'),
        React.createElement('button', {
          key: 'view',
          onClick: () => {
            setUpdateNotification(null)
            setUpdatePanelVisible(true)
          },
          style: {
            padding: '5px 12px',
            background: 'var(--accent)',
            border: 'none',
            color: 'var(--text-button)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }
        }, 'View Update')
      ])
    ]),
    cloneModalVisible && React.createElement(CloneModal, {
      key: 'clone-modal',
      onClone: handleClone,
      onClose: () => setCloneModalVisible(false)
    }),
    githubModalVisible && React.createElement(GitHubModal, {
      key: 'github-modal',
      folderPath: folderPath,
      onClose: () => setGitHubModalVisible(false)
    }),
    gitStatusModalVisible && React.createElement(GitStatusModal, {
      key: 'git-status-modal',
      folderPath: folderPath,
      onClose: () => setGitStatusModalVisible(false)
    }),
    React.createElement(StatusBar, {
      key: 'statusbar',
      filePath: activeTab?.path || null,
      language: activeTab?.language || 'plaintext',
      cursorPosition: _cursorPosition,
      extensionsLoaded: extensionsLoaded,
      errorCount: consoleLogs.filter(l => l.level === 'error').length,
      onConsoleClick: () => setConsoleVisible(prev => !prev),
      gitBranch: gitBranch,
      changesCount: changesCount
    })
  ])
}

export default App
