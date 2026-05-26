import { ThemeService } from './ThemeManager'
import {
  ExtensionAPI,
  ExtensionContext,
  Disposable,
  EditorDocument,
  Selection,
  FileSystemEntry,
  CompilerDefinition,
  LanguageDefinition,
  CompletionProvider,
  RegisteredCommand,
  RegisteredCompiler,
  CompletionItemKind,
  ProjectTemplateInput,
  TokenHighlightRule,
  RegisteredTheme
} from '../types/extension'

export class ExtensionAPIImpl implements ExtensionAPI {
  CompletionItemKind = CompletionItemKind
  private context: ExtensionContext
  private _commandsMap: Map<string, RegisteredCommand>
  private _compilersMap: Map<string, RegisteredCompiler>
  private _languagesMap: Map<string, LanguageDefinition>
  private _completionProvidersMap: Map<string, CompletionProvider[]>
  private _projectTemplatesMap: Map<string, any>
  private _themesMap: Map<string, RegisteredTheme>
  private _builtinFunctionsMap: Map<string, string[]>
  private _tokenHighlightRulesMap: Map<string, TokenHighlightRule[]>
  private getActiveTabContent: () => { path: string | null; content: string; language: string } | null
  private setActiveTabContent: (content: string) => void
  private setLanguage: (languageId: string) => void
  private getWorkspacePath: () => string | null
  private fsAPI: any
  private terminalAPI: any
  private envAPI: any
  private themeService: ThemeService

  constructor(
    context: ExtensionContext,
    commandsMap: Map<string, RegisteredCommand>,
    compilersMap: Map<string, RegisteredCompiler>,
    languagesMap: Map<string, LanguageDefinition>,
    completionProvidersMap: Map<string, CompletionProvider[]>,
    projectTemplatesMap: Map<string, any>,
    themesMap: Map<string, RegisteredTheme>,
    builtinFunctionsMap: Map<string, string[]>,
    tokenHighlightRulesMap: Map<string, TokenHighlightRule[]>,
    getActiveTabContent: () => { path: string | null; content: string; language: string } | null,
    setActiveTabContent: (content: string) => void,
    setLanguage: (languageId: string) => void,
    getWorkspacePath: () => string | null,
    fsAPI: any,
    terminalAPI: any,
    envAPI: any,
    themeService: ThemeService
  ) {
    this.context = context
    this._commandsMap = commandsMap
    this._compilersMap = compilersMap
    this._languagesMap = languagesMap
    this._completionProvidersMap = completionProvidersMap
    this._projectTemplatesMap = projectTemplatesMap
    this._themesMap = themesMap
    this._builtinFunctionsMap = builtinFunctionsMap
    this._tokenHighlightRulesMap = tokenHighlightRulesMap
    this.getActiveTabContent = getActiveTabContent
    this.setActiveTabContent = setActiveTabContent
    this.setLanguage = setLanguage
    this.getWorkspacePath = getWorkspacePath
    this.fsAPI = fsAPI
    this.terminalAPI = terminalAPI
    this.envAPI = envAPI
    this.themeService = themeService
  }

  commands = {
    registerCommand: (id: string, handler: (...args: any[]) => any): Disposable => {
      this._commandsMap.set(id, { id, handler, extensionId: this.context.extensionPath })
      const disposable: Disposable = {
        dispose: () => this._commandsMap.delete(id)
      }
      this.context.subscriptions.push(disposable)
      return disposable
    },
    executeCommand: async (id: string, ...args: any[]): Promise<any> => {
      const cmd = this._commandsMap.get(id)
      if (!cmd) throw new Error(`Command '${id}' not found`)
      return cmd.handler(...args)
    }
  }

  window = {
    showInformationMessage: (message: string) => {
      alert(message)
    },
    showErrorMessage: (message: string) => {
      alert(`Error: ${message}`)
    },
    showWarningMessage: (message: string) => {
      alert(`Warning: ${message}`)
    },
    onDidChangeTheme: (callback: (themeId: string) => void): Disposable => {
      return this.themeService.onDidChangeTheme(callback)
    }
  }

  editor = {
    getActiveDocument: (): EditorDocument | null => {
      const tab = this.getActiveTabContent()
      if (!tab) return null
      return {
        uri: tab.path || '',
        fileName: tab.path ? tab.path.split('/').pop() || '' : 'Untitled',
        languageId: tab.language,
        getText: () => tab.content,
        lineCount: tab.content.split('\n').length
      }
    },
    getActiveSelection: (): Selection | null => {
      return null
    },
    replaceSelection: (text: string) => {
      const tab = this.getActiveTabContent()
      if (!tab) return
      this.setActiveTabContent(text)
    },
    insertText: (text: string) => {
      const tab = this.getActiveTabContent()
      if (!tab) return
      this.setActiveTabContent(tab.content + text)
    },
    getLanguage: (): string => {
      const tab = this.getActiveTabContent()
      return tab?.language || 'plaintext'
    },
    setLanguage: (languageId: string) => {
      this.setLanguage(languageId)
    }
  }

  workspace = {
    getPath: (): string | null => {
      return this.getWorkspacePath()
    },
    readFile: async (path: string): Promise<string> => {
      const result = await this.fsAPI.readFile(path)
      if (!result.success) throw new Error(result.error || 'Failed to read file')
      return result.content || ''
    },
    writeFile: async (path: string, content: string): Promise<void> => {
      const result = await this.fsAPI.writeFile(path, content)
      if (!result.success) throw new Error(result.error || 'Failed to write file')
    },
    readDir: async (path: string): Promise<FileSystemEntry[]> => {
      const result = await this.fsAPI.readDir(path)
      if (!result.success) throw new Error(result.error || 'Failed to read directory')
      return result.items || []
    },
    findFiles: async (pattern: string): Promise<string[]> => {
      const workspacePath = this.getWorkspacePath()
      if (!workspacePath) return []
      const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'))
      const files: string[] = []
      const searchDir = async (dir: string) => {
        const result = await this.fsAPI.readDir(dir)
        if (!result.success) return
        for (const item of result.items || []) {
          if (item.isDirectory) {
            await searchDir(item.path)
          } else if (regex.test(item.name)) {
            files.push(item.path)
          }
        }
      }
      await searchDir(workspacePath)
      return files
    },
    registerProjectTemplate: (template: ProjectTemplateInput): Disposable => {
      const registered = {
        id: template.id,
        name: template.name,
        description: template.description,
        language: template.language,
        files: template.files,
        extensionId: this.context.extensionPath
      }
      this._projectTemplatesMap.set(template.id, registered)
      const disposable: Disposable = {
        dispose: () => this._projectTemplatesMap.delete(template.id)
      }
      this.context.subscriptions.push(disposable)
      return disposable
    },
    registerTheme: (theme: RegisteredTheme): Disposable => {
      this._themesMap.set(theme.id, theme)
      const disposable: Disposable = {
        dispose: () => this._themesMap.delete(theme.id)
      }
      this.context.subscriptions.push(disposable)
      return disposable
    }
  }

  terminal = {
    sendText: (text: string) => {
      this.terminalAPI.write(text + '\n')
    },
    registerCompiler: (compiler: CompilerDefinition): Disposable => {
      const registered: RegisteredCompiler = {
        id: compiler.id,
        label: compiler.label,
        command: compiler.command,
        args: compiler.args || [],
        fileExtensions: compiler.fileExtensions || [],
        extensionId: this.context.extensionPath
      }
      this._compilersMap.set(compiler.id, registered)
      const disposable: Disposable = {
        dispose: () => this._compilersMap.delete(compiler.id)
      }
      this.context.subscriptions.push(disposable)
      return disposable
    }
  }

  languages = {
    registerLanguage: (language: LanguageDefinition): Disposable => {
      this._languagesMap.set(language.id, language)
      const disposable: Disposable = {
        dispose: () => this._languagesMap.delete(language.id)
      }
      this.context.subscriptions.push(disposable)
      return disposable
    },
    registerCompletionProvider: (languageId: string, provider: CompletionProvider): Disposable => {
      const providers = this._completionProvidersMap.get(languageId) || []
      providers.push(provider)
      this._completionProvidersMap.set(languageId, providers)
      const disposable: Disposable = {
        dispose: () => {
          const idx = providers.indexOf(provider)
          if (idx >= 0) providers.splice(idx, 1)
        }
      }
      this.context.subscriptions.push(disposable)
      return disposable
    },
    registerBuiltinFunctions: (languageId: string, functions: string[]): Disposable => {
      const existing = this._builtinFunctionsMap.get(languageId) || []
      const merged = [...new Set([...existing, ...functions])]
      this._builtinFunctionsMap.set(languageId, merged)
      const disposable: Disposable = {
        dispose: () => {
          const remaining = existing.filter(f => !functions.includes(f))
          if (remaining.length > 0) {
            this._builtinFunctionsMap.set(languageId, remaining)
          } else {
            this._builtinFunctionsMap.delete(languageId)
          }
        }
      }
      this.context.subscriptions.push(disposable)
      return disposable
    },
    registerTokenHighlighter: (languageId: string, rules: TokenHighlightRule[]): Disposable => {
      const existing = this._tokenHighlightRulesMap.get(languageId) || []
      const merged = [...existing, ...rules]
      this._tokenHighlightRulesMap.set(languageId, merged)
      const disposable: Disposable = {
        dispose: () => {
          const remaining = existing.filter(r => !rules.includes(r))
          if (remaining.length > 0) {
            this._tokenHighlightRulesMap.set(languageId, remaining)
          } else {
            this._tokenHighlightRulesMap.delete(languageId)
          }
        }
      }
      this.context.subscriptions.push(disposable)
      return disposable
    }
  }

  env = {
    openExternal: (url: string) => {
      window.open(url, '_blank')
    },
    getAppPath: (): string => {
      return this.envAPI?.appPath || ''
    },
    getCSSVar: (name: string): string => {
      return this.themeService.getCSSVar(name)
    },
    getActiveTheme: (): string => {
      return this.themeService.getActiveTheme()
    }
  }
}
