import React, { useRef, useEffect, useState, useMemo } from 'react'
import Editor from '@monaco-editor/react'
import type { OnMount } from '@monaco-editor/react'
import { tokenHighlightRegistry } from '../core/TokenHighlightRegistry'
import { RegisteredTheme } from '../types'
import { CompletionProvider } from '../types/extension'
import MarkdownPreview from './MarkdownPreview'

interface EditorPanelProps {
  filePath: string | null
  fileName: string
  content: string
  language: string
  onChange: (value: string) => void
  settings: Record<string, any>
  themeName: string
  extensionThemes: RegisteredTheme[]
  getCompletionProviders?: () => Map<string, CompletionProvider[]> | undefined
}

const EditorPanel: React.FC<EditorPanelProps> = ({ filePath, fileName, content, language, onChange, settings, themeName, extensionThemes, getCompletionProviders }) => {
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)
  const themeDefined = useRef(false)
  const decorationsRef = useRef<string[]>([])
  const mountedRef = useRef(true)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const completionProvidersRegistered = useRef(false)

  const isMarkdown = useMemo(() => {
    const name = fileName || filePath || ''
    return name.endsWith('.md') || name.endsWith('.mdx') || name.endsWith('.markdown')
  }, [fileName, filePath])

  type PreviewMode = 'editor' | 'preview' | 'split'
  const [previewMode, setPreviewMode] = useState<PreviewMode>('editor')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPreviewMode('editor')
    setShowDropdown(false)
  }, [filePath, fileName])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current = []
    }
  }, [])

  const DARK_THEME = {
    base: 'vs-dark' as const,
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'keyword', foreground: '569CD6' },
      { token: 'keyword.control', foreground: 'C586C0' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'string.escape', foreground: 'D7BA7D' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'regexp', foreground: 'D16969' },
      { token: 'operator', foreground: 'D4D4D4' },
      { token: 'namespace', foreground: '4EC9B0' },
      { token: 'type', foreground: '4EC9B0' },
      { token: 'function', foreground: 'DCDCAA' },
      { token: 'function.builtin', foreground: '4EC9B0' },
      { token: 'variable', foreground: '9CDCFE' },
      { token: 'variable.predefined', foreground: '4EC9B0' },
      { token: 'macro', foreground: '569CD6' },
      { token: 'delimiter', foreground: 'D4D4D4' },
      { token: 'delimiter.bracket', foreground: 'FFD700' },
      { token: 'predefined', foreground: '4EC9B0' },
      { token: 'invalid', foreground: 'F44747' }
    ],
    colors: {
      'editor.background': '#1E1E1E',
      'editor.foreground': '#D4D4D4',
      'editorCursor.foreground': '#FFFFFF',
      'editor.lineHighlightBackground': '#2C2C2C',
      'editor.selectionBackground': '#264F78',
      'editor.inactiveSelectionBackground': '#3A3D41',
      'editorLineNumber.foreground': '#858585',
      'editorLineNumber.activeForeground': '#C6C6C6',
      'editorIndentGuide.background': '#404040',
      'editorIndentGuide.activeBackground': '#707070',
      'editorBracketHighlight.foreground1': '#FFD700',
      'editorBracketHighlight.foreground2': '#DA70D6',
      'editorBracketHighlight.foreground3': '#179FFF',
      'editorBracketHighlight.foreground4': '#9CDCFE',
      'editorBracketHighlight.foreground5': '#CE9178',
      'editorBracketHighlight.foreground6': '#B5CEA8'
    }
  }

  const LIGHT_THEME = {
    base: 'vs' as const,
    inherit: true,
    rules: [
      { token: 'comment', foreground: '008000', fontStyle: 'italic' },
      { token: 'keyword', foreground: '0000FF' },
      { token: 'keyword.control', foreground: 'AF00DB' },
      { token: 'string', foreground: 'A31515' },
      { token: 'string.escape', foreground: 'D7BA7D' },
      { token: 'number', foreground: '098658' },
      { token: 'regexp', foreground: 'D16969' },
      { token: 'operator', foreground: '000000' },
      { token: 'namespace', foreground: '267F99' },
      { token: 'type', foreground: '267F99' },
      { token: 'function', foreground: '795E26' },
      { token: 'function.builtin', foreground: '267F99' },
      { token: 'variable', foreground: '001080' },
      { token: 'variable.predefined', foreground: '267F99' },
      { token: 'macro', foreground: '0000FF' },
      { token: 'delimiter', foreground: '000000' },
      { token: 'delimiter.bracket', foreground: '0451A5' },
      { token: 'predefined', foreground: '267F99' },
      { token: 'invalid', foreground: 'FF0000' }
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#000000',
      'editorCursor.foreground': '#000000',
      'editor.lineHighlightBackground': '#E8E8E8',
      'editor.selectionBackground': '#ADD6FF',
      'editor.inactiveSelectionBackground': '#E5EBF1',
      'editorLineNumber.foreground': '#858585',
      'editorLineNumber.activeForeground': '#000000',
      'editorIndentGuide.background': '#D3D3D3',
      'editorIndentGuide.activeBackground': '#B0B0B0',
      'editorBracketHighlight.foreground1': '#0431A5',
      'editorBracketHighlight.foreground2': '#AF00DB',
      'editorBracketHighlight.foreground3': '#098658',
      'editorBracketHighlight.foreground4': '#001080',
      'editorBracketHighlight.foreground5': '#A31515',
      'editorBracketHighlight.foreground6': '#267F99'
    }
  }

  const defineAllThemes = (monaco: any) => {
    const highlightRules = tokenHighlightRegistry.get('c') || []
    const customThemeRules = highlightRules.map((r, i) => ({
      token: `customHighlight.${i}`,
      foreground: r.color
    }))

    monaco.editor.defineTheme('vs-dark-enhanced', {
      base: 'vs-dark',
      inherit: true,
      rules: [...DARK_THEME.rules, ...customThemeRules],
      colors: DARK_THEME.colors
    })

    monaco.editor.defineTheme('vs-light-enhanced', {
      base: 'vs',
      inherit: true,
      rules: [...LIGHT_THEME.rules, ...customThemeRules.map((r, i) => ({
        token: `customHighlight.${i}`,
        foreground: r.foreground
      }))],
      colors: LIGHT_THEME.colors
    })

    for (const extTheme of extensionThemes) {
      const extRules = (extTheme.tokenColors || []).map(tc => {
        const scope = Array.isArray(tc.scope) ? tc.scope[0] : tc.scope || ''
        return { token: scope, foreground: tc.settings.foreground?.replace('#', '') || '000000', fontStyle: tc.settings.fontStyle }
      })
      const extColors: Record<string, string> = {}
      if (extTheme.colors) {
        for (const [key, val] of Object.entries(extTheme.colors)) {
          extColors[key] = val
        }
      }
      monaco.editor.defineTheme(extTheme.id, {
        base: extTheme.type === 'light' ? 'vs' : 'vs-dark',
        inherit: true,
        rules: extRules,
        colors: extColors
      })
    }

    monaco.editor.setTheme(themeName)
  }

  useEffect(() => {
    if (monacoRef.current) {
      defineAllThemes(monacoRef.current)
    }
  }, [themeName, extensionThemes])

  const applyCustomHighlighting = () => {
    if (!editorRef.current || !monacoRef.current) return
    
    const model = editorRef.current.getModel()
    if (!model) return
    const langId = model.getLanguageId()
    
    const highlightRules = tokenHighlightRegistry.get(langId) || []
    if (highlightRules.length === 0) {
      if (decorationsRef.current.length > 0) {
        editorRef.current.deltaDecorations(decorationsRef.current, [])
        decorationsRef.current = []
      }
      return
    }

    const text = model.getValue()
    const lines = text.split('\n')
    const newDecorations: any[] = []
    const MAX_DECORATIONS = 5000

    for (let lineIdx = 0; lineIdx < lines.length && newDecorations.length < MAX_DECORATIONS; lineIdx++) {
      const line = lines[lineIdx]
      for (let ruleIdx = 0; ruleIdx < highlightRules.length && newDecorations.length < MAX_DECORATIONS; ruleIdx++) {
        const rule = highlightRules[ruleIdx]
        if (!rule.match) continue
        let pattern: RegExp
        try {
          pattern = typeof rule.match === 'string'
            ? new RegExp(`\\b${rule.match}\\b`, 'g')
            : new RegExp(rule.match.source, 'g')
        } catch {
          continue
        }

        let match
        let iterations = 0
        while ((match = pattern.exec(line)) !== null && iterations < 100) {
          iterations++
          if (match[0].length === 0) { pattern.lastIndex++; continue }
          newDecorations.push({
            range: new monacoRef.current.Range(
              lineIdx + 1,
              match.index + 1,
              lineIdx + 1,
              match.index + match[0].length + 1
            ),
            options: {
              inlineClassName: `custom-highlight-${ruleIdx}`,
              inlineClassNameAffectsAfter: true
            }
          })
        }
      }
    }

    // Add CSS for custom highlights
    const styleId = 'custom-highlight-styles'
    let styleEl = document.getElementById(styleId) as HTMLStyleElement
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = styleId
      document.head.appendChild(styleEl)
    }
    
    const cssRules = highlightRules.map((rule, i) => 
      `.custom-highlight-${i} { color: #${rule.color} !important; }`
    ).join('\n')
    styleEl.textContent = cssRules

    decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, newDecorations)
  }

  const handleBeforeMount = (monaco: any) => {
    if (themeDefined.current) return
    themeDefined.current = true
    defineAllThemes(monaco)
  }

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    if (!themeDefined.current) {
      themeDefined.current = true
      defineAllThemes(monaco)
    }

    // Apply highlighting after a short delay to ensure model is ready
    const initTimeout = setTimeout(() => { if (mountedRef.current) applyCustomHighlighting() }, 100)
    timeoutsRef.current.push(initTimeout)

    // Listen for content changes
    editor.onDidChangeModelContent(() => {
      const t = setTimeout(() => { if (mountedRef.current) applyCustomHighlighting() }, 50)
      timeoutsRef.current.push(t)
    })

    // Listen for model changes (tab switches)
    editor.onDidChangeModel(() => {
      const t = setTimeout(() => { if (mountedRef.current) applyCustomHighlighting() }, 50)
      timeoutsRef.current.push(t)
    })

    // Listen for registry changes
    const origSet = tokenHighlightRegistry.set.bind(tokenHighlightRegistry)
    const origDelete = tokenHighlightRegistry.delete.bind(tokenHighlightRegistry)

    const highlightWithTimeout = () => {
      const t = setTimeout(() => { if (mountedRef.current) applyCustomHighlighting() }, 50)
      timeoutsRef.current.push(t)
    }

    tokenHighlightRegistry.set = function(key: any, value: any) {
      origSet(key, value)
      if (mountedRef.current) defineAllThemes(monaco)
      highlightWithTimeout()
      return tokenHighlightRegistry
    }

    tokenHighlightRegistry.delete = function(key: any) {
      const result = origDelete(key)
      if (mountedRef.current) defineAllThemes(monaco)
      highlightWithTimeout()
      return result
    }

    // Register completion providers once (queries dynamically each time)
    if (!completionProvidersRegistered.current) {
      completionProvidersRegistered.current = true
      const extLangIds = new Set(getCompletionProviders?.()?.keys() || [])
      const knownLangs = ['c', 'cpp', 'python', 'rust', 'java', 'javascript', 'typescript']
      for (const id of knownLangs) extLangIds.add(id)
      for (const langId of extLangIds) {
        monaco.languages.registerCompletionItemProvider(langId, {
          provideCompletionItems: async (model, position) => {
            const providers = getCompletionProviders?.()?.get(langId) || []
            if (providers.length === 0) return { suggestions: [] }
            const doc = {
              uri: model.uri.toString(),
              fileName: model.uri.path.split('/').pop() || '',
              languageId: model.getLanguageId(),
              getText: () => model.getValue(),
              lineCount: model.getLineCount()
            }
            const monacoPos = { line: position.lineNumber, column: position.column }
            const allItems: any[] = []
            for (const p of providers) {
              try {
                const items = p.provideCompletionItems(doc, monacoPos)
                if (items) {
                  const resolved = items instanceof Promise ? await items : items
                  for (const item of resolved) {
                    allItems.push({
                      label: item.label,
                      kind: item.kind,
                      insertText: item.insertText,
                      detail: item.detail
                    })
                  }
                }
              } catch (e) {
                console.error('[CompletionProvider] Error:', e)
              }
            }
            return { suggestions: allItems }
          }
        })
      }
    }
  }

  return React.createElement('div', {
    style: { flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', overflow: 'hidden' }
  }, [
    isMarkdown && React.createElement('div', {
      key: 'preview-bar',
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '2px 12px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-primary)',
        position: 'relative'
      }
    }, [
      React.createElement('div', {
        key: 'dropdown-wrapper',
        ref: dropdownRef,
        style: { position: 'relative' }
      }, [
        React.createElement('button', {
          key: 'toggle',
          onClick: () => setShowDropdown(!showDropdown),
          style: {
            padding: '3px 12px',
            fontSize: '12px',
            background: 'var(--accent)',
            color: 'var(--text-button)',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }
        }, [
          'View: ',
          previewMode === 'editor' ? 'Editor' : previewMode === 'preview' ? 'Preview' : 'Split',
          React.createElement('span', {
            key: 'arrow',
            style: { fontSize: '8px', marginLeft: '2px' }
          }, '\u25BC')
        ]),
        showDropdown && React.createElement('div', {
          key: 'menu',
          style: {
            position: 'absolute',
            top: '100%',
            right: '0',
            marginTop: '2px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '4px',
            zIndex: 100,
            minWidth: '110px',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }
        }, [
          ['editor', 'Editor'], ['split', 'Split View'], ['preview', 'Preview']
        ].map(([mode, label]) =>
          React.createElement('div', {
            key: mode,
            onClick: () => {
              setPreviewMode(mode as PreviewMode)
              setShowDropdown(false)
            },
            style: {
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '12px',
              color: previewMode === mode ? 'var(--accent)' : 'var(--text-primary)',
              background: previewMode === mode ? 'var(--bg-active)' : 'transparent'
            }
          }, label)
        ))
      ])
    ]),
    React.createElement('div', {
      key: 'editor-area',
      style: {
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }
    }, [
      React.createElement('div', {
        key: 'editor-wrapper',
        style: {
          flex: 1,
          overflow: 'hidden',
          display: previewMode === 'preview' ? 'none' : undefined,
          minWidth: 0,
          width: previewMode === 'split' ? '50%' : undefined
        }
      }, React.createElement(Editor, {
        key: filePath || fileName || 'untitled',
        height: '100%',
        theme: themeName,
        path: filePath || fileName || 'untitled',
        defaultLanguage: language,
        defaultValue: content,
        onChange: (value) => onChange(value || ''),
        beforeMount: handleBeforeMount,
        onMount: handleEditorDidMount,
        options: {
          minimap: { enabled: settings['editor.minimap'] },
          fontSize: settings['editor.fontSize'],
          fontFamily: settings['editor.fontFamily'],
          fontLigatures: settings['editor.fontLigatures'],
          automaticLayout: true,
          scrollBeyondLastLine: settings['editor.scrollBeyondLastLine'],
          smoothScrolling: settings['editor.smoothScrolling'],
          cursorBlinking: settings['editor.cursorBlinking'] as any,
          cursorSmoothCaretAnimation: 'on',
          renderWhitespace: settings['editor.renderWhitespace'] as any,
          bracketPairColorization: { enabled: settings['editor.bracketPairColorization'] },
          guides: { bracketPairs: settings['editor.bracketPairGuides'], indentation: settings['editor.indentationGuides'] },
          tabSize: settings['editor.tabSize'],
          wordWrap: settings['editor.wordWrap'] as any,
          lineNumbers: settings['editor.lineNumbers'] as any,
          renderLineHighlight: 'all',
          scrollbar: {
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10
          },
          parameterHints: { enabled: true },
          suggest: {
            showKeywords: true,
            showSnippets: true,
            showClasses: true,
            showFunctions: true,
            showVariables: true,
            showModules: true
          }
        }
      })),
      React.createElement('div', {
        key: 'preview-wrapper',
        style: {
          flex: 1,
          overflow: 'hidden',
          display: previewMode === 'editor' ? 'none' : undefined,
          minWidth: 0,
          width: previewMode === 'split' ? '50%' : undefined,
          borderLeft: previewMode === 'split' ? '1px solid var(--border-primary)' : undefined
        }
      }, React.createElement(MarkdownPreview, {
        content: content
      }))
    ])
  ])
}

export default EditorPanel
