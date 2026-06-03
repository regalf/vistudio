import {
  ExtensionManifest,
  ExtensionContext,
  ExtensionInfo,
  RegisteredCommand,
  RegisteredCompiler,
  LanguageDefinition,
  CompletionProvider,
  Disposable,
  ProjectTemplate,
  RegisteredTheme
} from '../types/extension'
import { ExtensionAPIImpl } from './ExtensionAPI'
import { builtinFunctionsRegistry } from './BuiltinFunctions'
import { tokenHighlightRegistry } from './TokenHighlightRegistry'
import { ThemeService } from './ThemeManager'

export class ExtensionHost {
  private extensions: Map<string, ExtensionInfo>
  private commands: Map<string, RegisteredCommand>
  private compilers: Map<string, RegisteredCompiler>
  private languages: Map<string, LanguageDefinition>
  private completionProviders: Map<string, CompletionProvider[]>
  private projectTemplates: Map<string, ProjectTemplate>
  private themes: Map<string, RegisteredTheme>
  private activatingExtensions: Set<string>
  private getActiveTabContent: () => { path: string | null; content: string; language: string } | null
  private setActiveTabContent: (content: string) => void
  private setLanguage: (languageId: string) => void
  private getWorkspacePath: () => string | null
  private fsAPI: any
  private terminalAPI: any
  private envAPI: any
  private themeService: ThemeService
  private logFilePath: string

  constructor(
    getActiveTabContent: () => { path: string | null; content: string; language: string } | null,
    setActiveTabContent: (content: string) => void,
    setLanguage: (languageId: string) => void,
    getWorkspacePath: () => string | null,
    fsAPI: any,
    terminalAPI: any,
    envAPI: any,
    themeService: ThemeService,
    logFilePath: string = 'extension-debug.log'
  ) {
    this.extensions = new Map()
    this.commands = new Map()
    this.compilers = new Map()
    this.languages = new Map()
    this.completionProviders = new Map()
    this.projectTemplates = new Map()
    this.themes = new Map()
    this.activatingExtensions = new Set()
    this.getActiveTabContent = getActiveTabContent
    this.setActiveTabContent = setActiveTabContent
    this.setLanguage = setLanguage
    this.getWorkspacePath = getWorkspacePath
    this.fsAPI = fsAPI
    this.terminalAPI = terminalAPI
    this.envAPI = envAPI
    this.themeService = themeService
    this.logFilePath = logFilePath
  }

  async loadExtension(extensionPath: string): Promise<ExtensionInfo | null> {
    try {
      const manifestPath = `${extensionPath}/extension.json`
      const result = await this.fsAPI.readFile(manifestPath)
      if (!result.success || !result.content) {
        console.error(`Failed to read manifest for extension at ${extensionPath}`)
        return null
      }

      const manifest: ExtensionManifest = JSON.parse(result.content)
      const id = manifest.name

      if (this.extensions.has(id)) {
        console.warn(`Extension ${id} is already loaded — reloading from disk`)
        const existing = this.extensions.get(id)!
        if (existing.isActive) {
          await this.deactivateExtension(id)
        }
        this.extensions.delete(id)
      }

      const extensionInfo: ExtensionInfo = {
        id,
        manifest,
        path: extensionPath,
        isActive: false,
        commands: [],
        compilers: [],
        subscriptions: []
      }

      this.extensions.set(id, extensionInfo)
      console.log(`Extension ${id} loaded successfully`)
      return extensionInfo
    } catch (error) {
      console.error(`Failed to load extension at ${extensionPath}:`, error)
      return null
    }
  }

  async activateExtension(extensionId: string): Promise<boolean> {
    const logFile = this.logFilePath
    const log = async (msg: string) => {
      const line = `[${new Date().toISOString()}] [ACTIVATE] ${msg}\n`
      console.log(`[ExtensionHost] ${msg}`)
      try {
        if (typeof window !== 'undefined') {
          if (window.electronAPI) {
            await window.electronAPI.log(`[EXT] ${msg}`)
            const existing = await window.electronAPI.fs.readFile(logFile)
            const content = existing.success ? existing.content : ''
            await window.electronAPI.fs.writeFile(logFile, content + line)
          } else {
            console.log('[ExtensionHost] electronAPI not available')
          }
        }
      } catch (e) {
        console.error('Log write failed', e)
      }
    }

    await log(`Starting activation of ${extensionId}`)
    const extension = this.extensions.get(extensionId)
    if (!extension) {
      await log(`Extension ${extensionId} not found`)
      return false
    }

    if (extension.isActive) {
      await log(`Extension ${extensionId} is already active, returning true`)
      return true
    }

    if (this.activatingExtensions.has(extensionId)) {
      await log(`Extension ${extensionId} is already being activated, skipping`)
      return false
    }

    this.activatingExtensions.add(extensionId)

    try {
      await log(`Creating context for ${extensionId}`)
      const context: ExtensionContext = {
        extensionPath: extension.path,
        subscriptions: [],
        workspacePath: this.getWorkspacePath()
      }

      await log(`Creating API for ${extensionId}`)
      const api = new ExtensionAPIImpl(
        context,
        this.commands,
        this.compilers,
        this.languages,
        this.completionProviders,
        this.projectTemplates,
        this.themes,
        builtinFunctionsRegistry,
        tokenHighlightRegistry,
        this.getActiveTabContent,
        this.setActiveTabContent,
        this.setLanguage,
        this.getWorkspacePath,
        this.fsAPI,
        this.terminalAPI,
        this.envAPI,
        this.themeService
      )

      const mainPath = `${extension.path}/${extension.manifest.main}`
      await log(`Reading main file: ${mainPath}`)
      const result = await this.fsAPI.readFile(mainPath)
      if (!result.success || !result.content) {
        await log(`Failed to read main file for extension ${extensionId}`)
        return false
      }

      await log(`Raw file content: ${JSON.stringify(result.content)}`)
      await log(`Processing extension code`)
      let extensionCode = result.content
      if (extensionCode.includes('module.exports')) {
        extensionCode = extensionCode.replace(/module\.exports\s*=\s*function\s*activate\s*\(/, 'function __ext_activate(')
        extensionCode = extensionCode.replace(/module\.exports\s*=\s*\(\s*function\s*activate\s*\(/, 'function __ext_activate(')
        extensionCode += '\nif (typeof __ext_activate === "function") { __ext_activate(context, vscode); }'
      } else {
        extensionCode = extensionCode.replace(/\nactivate\(context, vs(?:code)?\)\s*$/m, '')
        extensionCode += '\nactivate(context, vscode)'
      }

      await log(`Extension code length: ${extensionCode.length} chars`)
      await log(`Extension code preview: ${extensionCode.substring(0, 200)}`)

      try {
        await log(`Executing extension code`)
        const extensionModule = new Function('context', 'vscode', extensionCode)
        extensionModule(context, api)
        await log(`Extension code executed successfully`)
      } catch (execError) {
        await log(`Execution error: ${execError}`)
        throw execError
      }

      await log(`Setting isActive = true and updating commands/compilers`)
      extension.isActive = true
      extension.commands = Array.from(this.commands.entries())
        .filter(([, cmd]) => cmd.extensionId === extension.path)
        .map(([id]) => id)
      extension.compilers = Array.from(this.compilers.entries())
        .filter(([, comp]) => comp.extensionId === extension.path)
        .map(([id]) => id)
      extension.subscriptions = context.subscriptions

      this.activatingExtensions.delete(extensionId)
      await log(`Extension ${extensionId} activated successfully, returning true`)
      return true
    } catch (error) {
      this.activatingExtensions.delete(extensionId)
      await log(`Failed to activate extension ${extensionId}: ${error}`)
      console.error(`Failed to activate extension ${extensionId}:`, error)
      return false
    }
  }

  async deactivateExtension(extensionId: string): Promise<boolean> {
    const logFile = this.logFilePath
    const log = async (msg: string) => {
      const line = `[${new Date().toISOString()}] [DEACTIVATE] ${msg}\n`
      console.log(`[ExtensionHost] ${msg}`)
      try {
        if (typeof window !== 'undefined') {
          if (window.electronAPI) {
            await window.electronAPI.log(`[EXT] ${msg}`)
            const existing = await window.electronAPI.fs.readFile(logFile)
            const content = existing.success ? existing.content : ''
            await window.electronAPI.fs.writeFile(logFile, content + line)
          } else {
            console.log('[ExtensionHost] electronAPI not available')
          }
        }
      } catch (e) {
        console.error('Log write failed', e)
      }
    }

    await log(`Starting deactivation of ${extensionId}`)
    const extension = this.extensions.get(extensionId)
    if (!extension) {
      await log(`Extension ${extensionId} not found`)
      return false
    }

    if (!extension.isActive) {
      await log(`Extension ${extensionId} is not active, returning true`)
      return true
    }

    try {
      await log(`Disposing subscriptions`)
      for (const sub of extension.subscriptions || []) {
        try {
          sub.dispose()
        } catch (e) {
          await log(`Error disposing subscription: ${e}`)
        }
      }

      await log(`Removing commands`)
      for (const [id, cmd] of this.commands.entries()) {
        if (cmd.extensionId === extension.path) {
          this.commands.delete(id)
        }
      }

      await log(`Removing compilers`)
      for (const [id, comp] of this.compilers.entries()) {
        if (comp.extensionId === extension.path) {
          this.compilers.delete(id)
        }
      }

      await log(`Setting isActive = false`)
      extension.isActive = false
      extension.commands = []
      extension.compilers = []
      extension.subscriptions = []

      await log(`Extension ${extensionId} deactivated successfully, returning true`)
      return true
    } catch (error) {
      await log(`Failed to deactivate extension ${extensionId}: ${error}`)
      console.error(`Failed to deactivate extension ${extensionId}:`, error)
      return false
    }
  }

  registerProjectTemplate(template: ProjectTemplate): Disposable {
    this.projectTemplates.set(template.id, template)
    console.log(`Project template registered: ${template.id} (${template.name})`)
    const disposable: Disposable = {
      dispose: () => {
        this.projectTemplates.delete(template.id)
        console.log(`Project template unregistered: ${template.id}`)
      }
    }
    return disposable
  }

  getProjectTemplates(): ProjectTemplate[] {
    return Array.from(this.projectTemplates.values())
  }

  registerTheme(theme: RegisteredTheme): Disposable {
    this.themes.set(theme.id, theme)
    const disposable: Disposable = {
      dispose: () => {
        this.themes.delete(theme.id)
      }
    }
    return disposable
  }

  getThemes(): RegisteredTheme[] {
    return Array.from(this.themes.values())
  }

  getExtension(extensionId: string): ExtensionInfo | undefined {
    return this.extensions.get(extensionId)
  }

  getAllExtensions(): ExtensionInfo[] {
    return Array.from(this.extensions.values())
  }

  getCommands(): Map<string, RegisteredCommand> {
    return this.commands
  }

  getCompilers(): Map<string, RegisteredCompiler> {
    return this.compilers
  }

  getLanguages(): Map<string, LanguageDefinition> {
    return this.languages
  }

  getCompletionProviders(): Map<string, CompletionProvider[]> {
    return this.completionProviders
  }

  getBuiltinFunctions(): Map<string, string[]> {
    return builtinFunctionsRegistry
  }

  async loadExtensionsFromDirectory(extensionsDir: string): Promise<number> {
    try {
      const result = await this.fsAPI.readDir(extensionsDir)
      if (!result.success || !result.items) {
        console.error(`Failed to read extensions directory: ${extensionsDir}`)
        return 0
      }

      let loadedCount = 0
      for (const item of result.items) {
        if (item.isDirectory) {
          const extension = await this.loadExtension(item.path)
          if (extension) {
            loadedCount++
          }
        }
      }

      console.log(`Loaded ${loadedCount} extensions from ${extensionsDir}`)
      return loadedCount
    } catch (error) {
      console.error(`Failed to load extensions from directory ${extensionsDir}:`, error)
      return 0
    }
  }

  async activateExtensionsByEvent(event: string): Promise<number> {
    let activatedCount = 0
    for (const extension of this.extensions.values()) {
      if (extension.isActive) continue

      const activationEvents = extension.manifest.activationEvents || []
      if (activationEvents.includes(event) || activationEvents.includes('*')) {
        const success = await this.activateExtension(extension.id)
        if (success) {
          activatedCount++
        }
      }
    }
    return activatedCount
  }
}
