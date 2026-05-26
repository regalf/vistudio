export interface ProjectTemplate {
  id: string
  name: string
  description?: string
  language: string
  files: Record<string, string>
  extensionId: string
}

export interface ProjectTemplateInput {
  id: string
  name: string
  description?: string
  language: string
  files: Record<string, string>
}

export interface ExtensionManifest {
  name: string
  version: string
  description?: string
  author?: string
  main: string
  activationEvents?: string[]
  contributes?: ExtensionContributions
  dependencies?: string[]
}

export interface ExtensionContributions {
  commands?: ExtensionCommand[]
  languages?: ExtensionLanguage[]
  themes?: ExtensionTheme[]
  compilers?: ExtensionCompiler[]
  menus?: ExtensionMenu[]
}

export interface ExtensionCommand {
  command: string
  title: string
  category?: string
  keybinding?: string
}

export interface ExtensionLanguage {
  id: string
  extensions: string[]
  aliases?: string[]
  syntax?: string
  grammar?: object
}

export interface ExtensionTheme {
  id: string
  label: string
  uiTheme?: string
  path: string
}

export interface ExtensionCompiler {
  id: string
  label: string
  command: string
  args?: string[]
  fileExtensions?: string[]
}

export interface ExtensionMenu {
  command: string
  when?: string
  group?: string
}

export interface ExtensionContext {
  extensionPath: string
  subscriptions: Disposable[]
  workspacePath: string | null
}

export interface Disposable {
  dispose(): void
}

export interface RegisteredCommand {
  id: string
  handler: (...args: any[]) => any
  extensionId: string
}

export interface RegisteredCompiler {
  id: string
  label: string
  command: string
  args: string[]
  fileExtensions: string[]
  extensionId: string
}

export interface ExtensionInfo {
  id: string
  manifest: ExtensionManifest
  path: string
  isActive: boolean
  commands: string[]
  compilers: string[]
  subscriptions: Disposable[]
}

export type ExtensionAPI = {
  commands: {
    registerCommand: (id: string, handler: (...args: any[]) => any) => Disposable
    executeCommand: (id: string, ...args: any[]) => Promise<any>
  }
  window: {
    showInformationMessage: (message: string) => void
    showErrorMessage: (message: string) => void
    showWarningMessage: (message: string) => void
    onDidChangeTheme: (callback: (themeId: string) => void) => Disposable
  }
  editor: {
    getActiveDocument: () => EditorDocument | null
    getActiveSelection: () => Selection | null
    replaceSelection: (text: string) => void
    insertText: (text: string) => void
    getLanguage: () => string
    setLanguage: (languageId: string) => void
  }
  workspace: {
    getPath: () => string | null
    readFile: (path: string) => Promise<string>
    writeFile: (path: string, content: string) => Promise<void>
    readDir: (path: string) => Promise<FileSystemEntry[]>
    findFiles: (pattern: string) => Promise<string[]>
  }
  terminal: {
    sendText: (text: string) => void
    registerCompiler: (compiler: CompilerDefinition) => Disposable
  }
  workspace: {
    getPath: () => string | null
    readFile: (path: string) => Promise<string>
    writeFile: (path: string, content: string) => Promise<void>
    readDir: (path: string) => Promise<FileSystemEntry[]>
    findFiles: (pattern: string) => Promise<string[]>
    registerProjectTemplate: (template: ProjectTemplateInput) => Disposable
    registerTheme: (theme: RegisteredTheme) => Disposable
  }
  languages: {
    registerLanguage: (language: LanguageDefinition) => Disposable
    registerCompletionProvider: (languageId: string, provider: CompletionProvider) => Disposable
    registerBuiltinFunctions: (languageId: string, functions: string[]) => Disposable
    registerTokenHighlighter: (languageId: string, rules: TokenHighlightRule[]) => Disposable
  }
  env: {
    openExternal: (url: string) => void
    getAppPath: () => string
    getCSSVar: (name: string) => string
    getActiveTheme: () => string
  }
}

export interface EditorDocument {
  uri: string
  fileName: string
  languageId: string
  getText: () => string
  lineCount: number
}

export interface Selection {
  start: Position
  end: Position
  text: string
}

export interface Position {
  line: number
  column: number
}

export interface FileSystemEntry {
  name: string
  path: string
  isDirectory: boolean
}

export interface CompilerDefinition {
  id: string
  label: string
  command: string
  args?: string[]
  fileExtensions?: string[]
}

export interface LanguageDefinition {
  id: string
  extensions: string[]
  aliases?: string[]
  keywords?: string[]
  operators?: string[]
  symbols?: string[]
  builtins?: string[]
}

export interface CompletionItem {
  label: string
  kind: CompletionItemKind
  insertText: string
  detail?: string
  documentation?: string
}

export enum CompletionItemKind {
  Text = 0,
  Method = 1,
  Function = 2,
  Constructor = 3,
  Field = 4,
  Variable = 5,
  Class = 6,
  Interface = 7,
  Module = 8,
  Property = 9,
  Keyword = 10,
  Snippet = 11,
  Color = 12,
  File = 13,
  Reference = 14
}

export interface CompletionProvider {
  provideCompletionItems: (document: EditorDocument, position: Position) => CompletionItem[] | Promise<CompletionItem[]>
}

export interface TokenHighlightRule {
  match: string | RegExp
  color: string
}

export interface RegisteredTheme {
  id: string
  label: string
  type: 'dark' | 'light'
  colors?: Record<string, string>
  tokenColors?: Array<{ scope: string | string[]; settings: { foreground?: string; fontStyle?: string } }>
  uiColors?: Record<string, string>
}
