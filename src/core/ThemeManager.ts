import { Disposable } from '../types/extension'

export interface ThemeUIDefinition {
  id: string
  label: string
  type: 'dark' | 'light'
  uiColors: Record<string, string>
}

export interface ThemeService {
  getCSSVar(name: string): string
  getActiveTheme(): string
  onDidChangeTheme(callback: (themeId: string) => void): Disposable
}

const STYLE_ID_PREFIX = 'ext-theme-'

export class ThemeManager implements ThemeService {
  private activeTheme: string = 'vs-dark-enhanced'
  private themes: Map<string, ThemeUIDefinition> = new Map()
  private listeners: Array<(themeId: string) => void> = []

  getCSSVar(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  }

  registerThemeUI(theme: ThemeUIDefinition): void {
    this.themes.set(theme.id, theme)
    const css = this.generateThemeCSS(theme)
    const styleId = STYLE_ID_PREFIX + theme.id
    let styleEl = document.getElementById(styleId) as HTMLStyleElement
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = styleId
      document.head.appendChild(styleEl)
    }
    styleEl.textContent = css
  }

  unregisterThemeUI(themeId: string): void {
    this.themes.delete(themeId)
    const styleEl = document.getElementById(STYLE_ID_PREFIX + themeId)
    if (styleEl) styleEl.remove()
  }

  applyTheme(themeId: string): void {
    this.activeTheme = themeId
    document.documentElement.setAttribute('data-theme', themeId)
    this.listeners.forEach(cb => cb(themeId))
  }

  getActiveTheme(): string {
    return this.activeTheme
  }

  onDidChangeTheme(callback: (themeId: string) => void): Disposable {
    this.listeners.push(callback)
    const disposable: Disposable = {
      dispose: () => {
        this.listeners = this.listeners.filter(cb => cb !== callback)
      }
    }
    return disposable
  }

  generateThemeCSS(theme: ThemeUIDefinition): string {
    const vars = Object.entries(theme.uiColors)
      .map(([key, val]) => `  --${key}: ${val};`)
      .join('\n')
    return `[data-theme="${theme.id}"] {\n${vars}\n}`
  }

  getAllUIThemes(): ThemeUIDefinition[] {
    return Array.from(this.themes.values())
  }
}

export const themeManager = new ThemeManager()
